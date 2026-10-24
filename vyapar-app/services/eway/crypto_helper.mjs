// ==============================================================================
// Lekha Jokha - e-Way Bill Credential Encryption & Redaction Engine
// Production-grade AES-256-GCM Authenticated Encryption for sensitive GSP/NIC keys at rest
// ==============================================================================

import crypto from 'node:crypto';

// Master derivation key from environment or fallback secure seed
const MASTER_SECRET = process.env.EWAY_CREDENTIALS_SECRET_KEY || process.env.SESSION_SECRET || 'lekhajokha-production-eway-gsp-key-secret-2026';

/**
 * Derives a consistent 32-byte key using PBKDF2
 */
function getDerivedKey(salt = 'lekhajokha-eway-salt') {
  return crypto.pbkdf2Sync(MASTER_SECRET, salt, 100000, 32, 'sha256');
}

/**
 * Encrypts a sensitive credential string using AES-256-GCM
 * @param {string} plaintext
 * @returns {string} iv:authTag:ciphertext (base64)
 */
export function encryptCredential(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return null;
  const iv = crypto.randomBytes(12);
  const key = getDerivedKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a stored credential string
 * @param {string} encryptedString
 * @returns {string|null}
 */
export function decryptCredential(encryptedString) {
  if (!encryptedString || typeof encryptedString !== 'string') return null;
  const parts = encryptedString.split(':');
  if (parts.length !== 3) return null;

  try {
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const ciphertext = parts[2];
    const key = getDerivedKey();

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Eway Crypto] Failed to decrypt credential:', err.message);
    return null;
  }
}

/**
 * Encrypts sensitive fields of a configuration object
 * @param {object} config
 * @returns {object}
 */
export function encryptConfig(config = {}) {
  const enc = { ...config };
  if (config.password) {
    enc.encryptedPassword = encryptCredential(config.password);
    delete enc.password;
  }
  if (config.clientSecret) {
    enc.encryptedClientSecret = encryptCredential(config.clientSecret);
    delete enc.clientSecret;
  }
  return enc;
}

/**
 * Decrypts sensitive fields of a configuration object
 * @param {object} config
 * @returns {object}
 */
export function decryptConfig(config = {}) {
  const dec = { ...config };
  if (config.encryptedPassword || config.encrypted_password) {
    dec.password = decryptCredential(config.encryptedPassword || config.encrypted_password);
  }
  if (config.encryptedClientSecret || config.encrypted_client_secret) {
    dec.clientSecret = decryptCredential(config.encryptedClientSecret || config.encrypted_client_secret);
  }
  return dec;
}

/**
 * Redacts secrets from configuration payload for safe frontend transmission or logging

 * @param {object} config
 * @returns {object}
 */
export function redactConfig(config) {
  if (!config) return null;
  return {
    id: config.id,
    businessId: config.businessId || config.business_id,
    provider: config.provider || 'sandbox',
    environment: config.environment || 'sandbox',
    gstin: config.gstin || '',
    gspBaseUrl: config.gspBaseUrl || config.gsp_base_url || '',
    hasCredentials: !!(config.encrypted_password || config.encryptedPassword || config.password || config.encrypted_client_secret || config.encryptedClientSecret || config.clientSecret),
    hasPassword: !!(config.encrypted_password || config.encryptedPassword || config.password),
    hasClientSecret: !!(config.encrypted_client_secret || config.encryptedClientSecret || config.clientSecret),
    usernameMasked: config.username ? maskString(config.username) : (config.encrypted_username ? 'configured (masked)' : ''),
    clientIdMasked: config.clientId ? maskString(config.clientId) : (config.encrypted_client_id ? 'configured (masked)' : ''),
    isActive: config.isActive !== undefined ? config.isActive : (config.is_active !== undefined ? config.is_active : true),
    lastSyncAt: config.updatedAt || config.updated_at || config.createdAt || config.created_at,
    tokenExpiresAt: config.tokenExpiresAt || config.token_expires_at || null
  };
}

function maskString(str) {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= 4) return '****';
  return str.substring(0, 2) + '****' + str.substring(str.length - 2);
}
