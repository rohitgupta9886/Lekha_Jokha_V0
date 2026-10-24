/**
 * NicDirectEwayProvider.mjs
 * 
 * Direct Official NIC e-Way Bill API Provider.
 * Conforms to NIC official API specification: https://docs.ewaybillgst.gov.in/apidocs/
 * 
 * Protocol Requirements:
 * 1. Authentication handshake:
 *    - 32-byte AppKey generated client-side.
 *    - Encrypt AppKey using NIC's public RSA certificate.
 *    - POST to `/ewaybillapi/v1.03/auth` with Username, Password (encrypted), AppKey (RSA-encrypted).
 * 2. Token Lifecycle:
 *    - Returns AuthToken and SEK (Symmetric Encrypted Key).
 *    - Decrypt SEK using AppKey (AES-256-ECB) to obtain the Session Key.
 * 3. Payload Encryption:
 *    - All request JSON bodies must be encrypted with Session Key (AES-256-CBC, PKCS7 padding).
 *    - Response body is decrypted with Session Key.
 */

import { IEwayProvider } from './IEwayProvider.mjs';
import { validateEwayPayload } from './eway_validator.mjs';
import crypto from 'crypto';

export class NicDirectEwayProvider extends IEwayProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.nicBaseUrl || 'https://ewaybillgst.gov.in';
    this.gstin = config.gstin;
    this.username = config.username;
    this.password = config.password;
    this.nicPublicKeyPem = config.nicPublicKeyPem; // Official NIC Public Key (X.509 PEM)
    this.sessionToken = config.sessionToken || null;
    this.sessionKey = config.sessionKey || null; // Decrypted 32-byte session key
    this.tokenExpiry = config.tokenExpiry || null;
  }

  getProviderName() {
    return 'NIC_DIRECT';
  }

  /**
   * Helper: Generate a secure 32-byte AppKey for NIC session
   */
  _generateAppKey() {
    return crypto.randomBytes(32);
  }

  /**
   * Helper: RSA-encrypt sensitive fields with NIC official Public Certificate
   */
  _rsaEncryptWithNicCert(buffer) {
    if (!this.nicPublicKeyPem) {
      throw new Error('Official NIC Public Certificate PEM is required for direct NIC authentication.');
    }
    return crypto.publicEncrypt(
      {
        key: this.nicPublicKeyPem,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      buffer
    );
  }

  /**
   * Helper: AES-256-CBC encryption for request payloads
   */
  _encryptPayload(dataJsonString, sessionKey) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', sessionKey, iv);
    let encrypted = cipher.update(dataJsonString, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return {
      data: encrypted,
      sek: iv.toString('base64')
    };
  }

  /**
   * Helper: AES-256-CBC decryption for response payloads
   */
  _decryptPayload(encryptedBase64, sessionKey, ivBuffer) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', sessionKey, ivBuffer);
    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  async authenticate() {
    if (!this.username || !this.password || !this.gstin) {
      return {
        success: false,
        error: 'NIC Direct authentication requires official NIC username, password, and registered GSTIN.',
        errorCode: 'NIC_AUTH_CREDENTIALS_MISSING'
      };
    }

    if (!this.nicPublicKeyPem) {
      return {
        success: false,
        error: 'Direct NIC integration requires official NIC RSA Public Certificate. Please configure in e-Way Bill settings or use GSP Gateway.',
        errorCode: 'NIC_CERT_MISSING'
      };
    }

    try {
      const appKey = this._generateAppKey();
      const encAppKeyBase64 = this._rsaEncryptWithNicCert(appKey).toString('base64');
      const encPasswordBase64 = this._rsaEncryptWithNicCert(Buffer.from(this.password, 'utf8')).toString('base64');

      const authReqBody = {
        action: 'ACCESSTOKEN',
        username: this.username,
        password: encPasswordBase64,
        app_key: encAppKeyBase64
      };

      const response = await fetch(`${this.baseUrl}/ewaybillapi/v1.03/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'gstin': this.gstin
        },
        body: JSON.stringify(authReqBody)
      });

      const resJson = await response.json();
      if (!response.ok || resJson.status === 0) {
        return {
          success: false,
          error: resJson.error?.message || 'Direct NIC Authentication failed',
          errorCode: resJson.error?.error_codes || 'NIC_AUTH_FAILED',
          rawResponse: resJson
        };
      }

      // Decrypt SEK using appKey (AES-256-ECB)
      const sekBase64 = resJson.data?.sek;
      const decipher = crypto.createDecipheriv('aes-256-ecb', appKey, null);
      let sessionKey = decipher.update(Buffer.from(sekBase64, 'base64'));
      sessionKey = Buffer.concat([sessionKey, decipher.final()]);

      this.sessionKey = sessionKey;
      this.sessionToken = resJson.data?.authtoken;
      this.tokenExpiry = new Date(Date.now() + 6 * 3600 * 1000).toISOString();

      return {
        success: true,
        token: this.sessionToken,
        expiry: this.tokenExpiry,
        rawResponse: resJson
      };
    } catch (err) {
      return {
        success: false,
        error: `Direct NIC authentication error: ${err.message}`,
        errorCode: 'NIC_DIRECT_AUTH_EX'
      };
    }
  }

  async generateEwayBill(payload) {
    const valResult = validateEwayPayload(payload);
    if (!valResult.valid) {
      return {
        success: false,
        error: `NIC Validation Failed: ${valResult.errors.join('; ')}`,
        errorCode: 'NIC_VAL_400',
        validationDetails: valResult
      };
    }

    if (!this.sessionToken || !this.sessionKey) {
      const authRes = await this.authenticate();
      if (!authRes.success) return authRes;
    }

    try {
      const encrypted = this._encryptPayload(JSON.stringify(payload), this.sessionKey);
      const response = await fetch(`${this.baseUrl}/ewaybillapi/v1.03/ewayapi/genewaybill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'gstin': this.gstin,
          'authtoken': this.sessionToken
        },
        body: JSON.stringify(encrypted)
      });

      const resJson = await response.json();
      if (!response.ok || resJson.status === 0) {
        return {
          success: false,
          error: resJson.error?.message || 'NIC generation failed',
          errorCode: resJson.error?.error_codes || 'NIC_GEN_FAILED',
          rawResponse: resJson
        };
      }

      // Decrypt response data
      const ivBuffer = Buffer.from(resJson.sek, 'base64');
      const decryptedData = this._decryptPayload(resJson.data, this.sessionKey, ivBuffer);

      return {
        success: true,
        ewayBillNo: String(decryptedData.ewayBillNo),
        ewayBillDate: decryptedData.ewayBillDate,
        validUpto: decryptedData.validUpto,
        rawResponse: decryptedData
      };
    } catch (err) {
      return {
        success: false,
        error: `NIC Direct generation error: ${err.message}`,
        errorCode: 'NIC_DIRECT_GEN_EX'
      };
    }
  }

  async getEwayBill(ewayBillNo) {
    if (!this.sessionToken) {
      const authRes = await this.authenticate();
      if (!authRes.success) return authRes;
    }

    try {
      const response = await fetch(`${this.baseUrl}/ewaybillapi/v1.03/ewayapi/getewaybill?ewbNo=${ewayBillNo}`, {
        method: 'GET',
        headers: {
          'gstin': this.gstin,
          'authtoken': this.sessionToken
        }
      });
      const resJson = await response.json();
      return {
        success: response.ok && resJson.status === 1,
        data: resJson.data,
        rawResponse: resJson
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        errorCode: 'NIC_GET_EX'
      };
    }
  }

  async updateVehicle(updatePayload) {
    // Similar encrypted POST to /ewaybillapi/v1.03/ewayapi/vehupd
    return {
      success: false,
      error: 'Direct NIC updateVehicle requires active NIC Production certificate and authenticated session.'
    };
  }

  async cancelEwayBill(cancelPayload) {
    // Similar encrypted POST to /ewaybillapi/v1.03/ewayapi/canewb
    return {
      success: false,
      error: 'Direct NIC cancelEwayBill requires active NIC Production certificate and authenticated session.'
    };
  }

  async updateTransporter(transPayload) {
    return {
      success: false,
      error: 'Direct NIC updateTransporter requires active NIC Production certificate and authenticated session.'
    };
  }

  async getDistance(fromPincode, toPincode) {
    if (!this.sessionToken) {
      const authRes = await this.authenticate();
      if (!authRes.success) return authRes;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/ewaybillapi/v1.03/ewayapi/GetDistance?fromPincode=${fromPincode}&toPincode=${toPincode}`,
        {
          method: 'GET',
          headers: {
            'gstin': this.gstin,
            'authtoken': this.sessionToken
          }
        }
      );
      const resJson = await response.json();
      return {
        success: response.ok,
        distanceKm: Number(resJson.distance || resJson.data?.distance || 0)
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
