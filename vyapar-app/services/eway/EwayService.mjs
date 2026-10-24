/**
 * EwayService.mjs
 * 
 * Production-Grade Indian GST e-Way Bill Application Service.
 * Coordinates multi-tenant isolation, database operations, idempotency keys,
 * concurrency locking, lifecycle state machine, timeout reconciliation, and audit logs.
 */

import crypto from 'crypto';
import { EwayProviderFactory } from './EwayProviderFactory.mjs';
import { encryptConfig, decryptConfig, redactConfig } from './crypto_helper.mjs';
import { validateEwayPayload, canCancelEwayBill } from './eway_validator.mjs';

// Global concurrency lock map to prevent parallel duplicate submissions for the same (businessId, invoiceNo)
const activeGenerationLocks = new Set();

export class EwayService {
  /**
   * @param {Object} db - Database repository (PostgresRepository or TenantDbManager)
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Helper: Retrieve and decrypt business e-way bill config
   */
  async getConfig(businessId) {
    if (!businessId) throw new Error('businessId is required');
    let rawConfig = null;

    if (this.db.getEwayConfig) {
      rawConfig = await this.db.getEwayConfig(businessId);
    } else if (this.db.getTenantData) {
      const data = await this.db.getTenantData(businessId);
      rawConfig = data?.ewayConfig || null;
    }

    if (!rawConfig) {
      // Return safe defaults indicating unconfigured state
      return {
        configured: false,
        provider: 'NIC_SANDBOX',
        isSandbox: true,
        gstin: '',
        username: ''
      };
    }

    // Decrypt credentials
    const decrypted = decryptConfig(rawConfig);
    return {
      configured: true,
      ...decrypted
    };
  }

  /**
   * Helper: Save and encrypt business e-way bill config
   */
  async saveConfig(businessId, configInput) {
    if (!businessId) throw new Error('businessId is required');

    // Retain existing passwords/secrets if user did not re-type them (indicated by empty string)
    const existing = await this.getConfig(businessId);
    const merged = {
      ...configInput,
      password: configInput.password || existing.password || '',
      clientSecret: configInput.clientSecret || existing.clientSecret || ''
    };

    const encrypted = encryptConfig(merged);

    if (this.db.saveEwayConfig) {
      await this.db.saveEwayConfig(businessId, encrypted);
    } else if (this.db.getTenantData && this.db.saveTenantData) {
      const tenantData = await this.db.getTenantData(businessId) || {};
      tenantData.ewayConfig = encrypted;
      await this.db.saveTenantData(businessId, tenantData);
    }

    return redactConfig(merged);
  }

  /**
   * Test Connection with current configuration
   */
  async testConnection(businessId) {
    const config = await this.getConfig(businessId);
    const provider = EwayProviderFactory.getProvider(config);
    return await provider.authenticate();
  }

  /**
   * Pre-Validate Payload (Dry Run)
   */
  async validatePayload(payload) {
    return validateEwayPayload(payload);
  }

  /**
   * Generate an e-Way Bill
   * Follows Phase 5 reliability rules:
   * 1. Multi-tenant ownership check
   * 2. Concurrency locking per invoice
   * 3. Idempotency key evaluation
   * 4. Pre-generation state logging (VALIDATING -> SUBMITTED)
   * 5. Call external provider
   * 6. Record official response, EBN, and audit history
   */
  async generateEwayBill(businessId, payload, options = {}) {
    if (!businessId) throw new Error('businessId is required');

    // 1. Strict Schema Validation
    const valResult = validateEwayPayload(payload);
    if (!valResult.valid) {
      return {
        success: false,
        status: 'FAILED',
        error: `NIC Validation Failed: ${valResult.errors.join('; ')}`,
        errorCode: 'VALIDATION_FAILED',
        validationDetails: valResult
      };
    }

    // 2. Concurrency Lock
    const lockKey = `${businessId}:${payload.docNo}`;
    if (activeGenerationLocks.has(lockKey)) {
      return {
        success: false,
        status: 'BUSY',
        error: `e-Way Bill generation is already in progress for Document ${payload.docNo}. Please wait.`,
        errorCode: 'CONCURRENT_REQUEST_BLOCKED'
      };
    }

    activeGenerationLocks.add(lockKey);

    try {
      // 3. Idempotency Check: check if already generated
      const idempotencyKey = options.idempotencyKey || crypto.createHash('sha256')
        .update(`${businessId}:${payload.docNo}:${payload.docDate}:${payload.totInvValue}`)
        .digest('hex');

      const existingRecord = await this._findExistingByDocOrKey(businessId, payload.docNo, idempotencyKey);
      if (existingRecord && existingRecord.status === 'GENERATED') {
        return {
          success: true,
          isDuplicate: true,
          message: 'e-Way Bill already generated for this document',
          ewayBill: existingRecord
        };
      }

      // 4. Resolve Provider
      const config = await this.getConfig(businessId);
      const provider = EwayProviderFactory.getProvider(config);

      // Create Initial local record with state SUBMITTED
      const ewbLocalId = `ewb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const initialRecord = {
        id: ewbLocalId,
        businessId,
        docType: payload.docType || 'INV',
        docNo: payload.docNo,
        docDate: payload.docDate,
        status: 'SUBMITTED',
        idempotencyKey,
        supplyType: payload.supplyType || 'O',
        subSupplyType: payload.subSupplyType || '1',
        fromGstin: payload.fromGstin,
        fromTrdName: payload.fromTrdName,
        fromAddr1: payload.fromAddr1,
        fromPlace: payload.fromPlace,
        fromPincode: payload.fromPincode,
        fromStateCode: payload.fromStateCode,
        toGstin: payload.toGstin,
        toTrdName: payload.toTrdName,
        toAddr1: payload.toAddr1,
        toPlace: payload.toPlace,
        toPincode: payload.toPincode,
        toStateCode: payload.toStateCode,
        totalInvoiceValue: payload.totInvValue,
        cgstValue: payload.cgstValue || 0,
        sgstValue: payload.sgstValue || 0,
        igstValue: payload.igstValue || 0,
        cessValue: payload.cessValue || 0,
        transporterId: payload.transporterId || null,
        transporterName: payload.transporterName || null,
        transDistance: payload.transDistance || 0,
        transMode: payload.transMode || '1',
        transDocNo: payload.transDocNo || null,
        transDocDate: payload.transDocDate || null,
        vehicleNo: payload.vehicleNo || null,
        vehicleType: payload.vehicleType || 'R',
        itemList: payload.itemList || [],
        auditHistory: [
          {
            action: 'SUBMITTED',
            timestamp: new Date().toISOString(),
            provider: provider.getProviderName()
          }
        ]
      };

      await this._saveEwayRecord(initialRecord);

      // 5. Invoke Provider
      const genResult = await provider.generateEwayBill(payload);

      if (!genResult.success) {
        // Record FAILED state
        initialRecord.status = 'FAILED';
        initialRecord.lastErrorCode = genResult.errorCode;
        initialRecord.lastErrorMessage = genResult.error;
        initialRecord.auditHistory.push({
          action: 'FAILED',
          timestamp: new Date().toISOString(),
          error: genResult.error,
          errorCode: genResult.errorCode
        });
        await this._saveEwayRecord(initialRecord);

        return {
          success: false,
          status: 'FAILED',
          error: genResult.error,
          errorCode: genResult.errorCode,
          record: initialRecord
        };
      }

      // 6. Record GENERATED state
      initialRecord.status = 'GENERATED';
      initialRecord.ewayBillNo = genResult.ewayBillNo;
      initialRecord.ewayBillDate = genResult.ewayBillDate;
      initialRecord.validUpto = genResult.validUpto;
      initialRecord.rawGovResponse = genResult.rawResponse;
      initialRecord.auditHistory.push({
        action: 'GENERATED',
        timestamp: new Date().toISOString(),
        ewayBillNo: genResult.ewayBillNo,
        validUpto: genResult.validUpto
      });

      await this._saveEwayRecord(initialRecord);

      return {
        success: true,
        status: 'GENERATED',
        ewayBillNo: genResult.ewayBillNo,
        ewayBillDate: genResult.ewayBillDate,
        validUpto: genResult.validUpto,
        record: initialRecord
      };
    } finally {
      activeGenerationLocks.delete(lockKey);
    }
  }

  /**
   * Update Part B / Vehicle
   */
  async updateVehicle(businessId, ewbIdOrNo, updateData) {
    if (!businessId) throw new Error('businessId is required');

    const record = await this._findRecord(businessId, ewbIdOrNo);
    if (!record) {
      return { success: false, error: 'e-Way Bill record not found or unauthorized' };
    }

    if (record.status === 'CANCELLED') {
      return { success: false, error: 'Cannot update vehicle for a CANCELLED e-Way Bill' };
    }

    const config = await this.getConfig(businessId);
    const provider = EwayProviderFactory.getProvider(config);

    const updatePayload = {
      ewayBillNo: record.ewayBillNo,
      vehicleNo: updateData.vehicleNo,
      fromPlace: updateData.fromPlace || record.fromPlace,
      fromState: updateData.fromState || record.fromStateCode,
      reasonCode: updateData.reasonCode || '1', // 1: Due to breakdown, 2: Transshipment, etc.
      reasonRem: updateData.reasonRem || 'Vehicle updated for transit',
      transDocNo: updateData.transDocNo,
      transDocDate: updateData.transDocDate,
      transMode: updateData.transMode || '1'
    };

    const result = await provider.updateVehicle(updatePayload);
    if (!result.success) {
      return result;
    }

    record.vehicleNo = updateData.vehicleNo;
    if (result.validUpto) {
      record.validUpto = result.validUpto;
    }
    record.auditHistory.push({
      action: 'VEHICLE_UPDATED',
      timestamp: new Date().toISOString(),
      vehicleNo: updateData.vehicleNo,
      reasonCode: updatePayload.reasonCode,
      reasonRem: updatePayload.reasonRem
    });

    await this._saveEwayRecord(record);

    return {
      success: true,
      validUpto: record.validUpto,
      record
    };
  }

  /**
   * Cancel e-Way Bill (with statutory 24-hr validation)
   */
  async cancelEwayBill(businessId, ewbIdOrNo, cancelData) {
    if (!businessId) throw new Error('businessId is required');

    const record = await this._findRecord(businessId, ewbIdOrNo);
    if (!record) {
      return { success: false, error: 'e-Way Bill record not found or unauthorized' };
    }

    if (record.status === 'CANCELLED') {
      return { success: false, error: 'e-Way Bill is already cancelled' };
    }

    // Statutory 24-hr check
    const check = canCancelEwayBill(record.ewayBillDate || record.createdAt);
    if (!check.allowed) {
      return { success: false, error: check.reason, errorCode: 'STATUTORY_TIMEOUT_EXPIRED' };
    }

    const config = await this.getConfig(businessId);
    const provider = EwayProviderFactory.getProvider(config);

    const cancelPayload = {
      ewbNo: record.ewayBillNo,
      cancelRsnCode: cancelData.cancelRsnCode || '1', // 1: Duplicate, 2: Order Cancelled, 3: Data Entry Error, 4: Others
      cancelRmrk: cancelData.cancelRmrk || 'Cancelled by user'
    };

    const result = await provider.cancelEwayBill(cancelPayload);
    if (!result.success) {
      return result;
    }

    record.status = 'CANCELLED';
    record.cancelDate = result.cancelDate || new Date().toISOString();
    record.cancelReasonCode = cancelPayload.cancelRsnCode;
    record.cancelRemarks = cancelPayload.cancelRmrk;
    record.auditHistory.push({
      action: 'CANCELLED',
      timestamp: record.cancelDate,
      reasonCode: cancelPayload.cancelRsnCode,
      remarks: cancelPayload.cancelRmrk
    });

    await this._saveEwayRecord(record);

    return {
      success: true,
      record
    };
  }

  /**
   * Get List of e-Way Bills for Tenant
   */
  async listEwayBills(businessId, filters = {}) {
    if (!businessId) throw new Error('businessId is required');

    if (this.db.listEwayBills) {
      return await this.db.listEwayBills(businessId, filters);
    } else if (this.db.getTenantData) {
      const data = await this.db.getTenantData(businessId);
      const list = data?.ewayBills || [];
      return list.sort((a, b) => new Date(b.createdAt || b.ewayBillDate) - new Date(a.createdAt || a.ewayBillDate));
    }
    return [];
  }

  /**
   * Get Single e-Way Bill Record
   */
  async getRecord(businessId, idOrNo) {
    return await this._findRecord(businessId, idOrNo);
  }

  /**
   * Sync / Reconcile Status with government portal
   */
  async syncStatus(businessId, idOrNo) {
    const record = await this._findRecord(businessId, idOrNo);
    if (!record || !record.ewayBillNo) {
      return { success: false, error: 'Valid e-Way Bill number required for sync' };
    }

    const config = await this.getConfig(businessId);
    const provider = EwayProviderFactory.getProvider(config);
    const result = await provider.getEwayBill(record.ewayBillNo);

    if (result.success && result.data) {
      const govData = result.data;
      if (govData.status === 'CAN' || govData.status === 'CANCELLED') {
        record.status = 'CANCELLED';
      }
      record.validUpto = govData.validUpto || record.validUpto;
      record.auditHistory.push({
        action: 'SYNCED_WITH_GOV',
        timestamp: new Date().toISOString(),
        govStatus: govData.status
      });
      await this._saveEwayRecord(record);
    }

    return {
      success: result.success,
      record,
      govData: result.data
    };
  }

  /**
   * Calculate PIN-to-PIN Distance
   */
  async getDistance(businessId, fromPincode, toPincode) {
    const config = await this.getConfig(businessId);
    const provider = EwayProviderFactory.getProvider(config);
    return await provider.getDistance(fromPincode, toPincode);
  }

  // --- Internal Storage Helpers ---

  async _findRecord(businessId, idOrNo) {
    if (this.db.getEwayRecord) {
      return await this.db.getEwayRecord(businessId, idOrNo);
    } else if (this.db.getTenantData) {
      const data = await this.db.getTenantData(businessId);
      const list = data?.ewayBills || [];
      return list.find(r => r.id === idOrNo || String(r.ewayBillNo) === String(idOrNo)) || null;
    }
    return null;
  }

  async _findExistingByDocOrKey(businessId, docNo, idempotencyKey) {
    if (this.db.findEwayByDocOrKey) {
      return await this.db.findEwayByDocOrKey(businessId, docNo, idempotencyKey);
    } else if (this.db.getTenantData) {
      const data = await this.db.getTenantData(businessId);
      const list = data?.ewayBills || [];
      return list.find(r => r.docNo === docNo || (idempotencyKey && r.idempotencyKey === idempotencyKey)) || null;
    }
    return null;
  }

  async _saveEwayRecord(record) {
    if (!record.createdAt) record.createdAt = new Date().toISOString();
    record.updatedAt = new Date().toISOString();

    if (this.db.saveEwayRecord) {
      await this.db.saveEwayRecord(record);
    } else if (this.db.getTenantData && this.db.saveTenantData) {
      const tenantData = await this.db.getTenantData(record.businessId) || {};
      if (!tenantData.ewayBills) tenantData.ewayBills = [];
      const idx = tenantData.ewayBills.findIndex(r => r.id === record.id);
      if (idx >= 0) {
        tenantData.ewayBills[idx] = record;
      } else {
        tenantData.ewayBills.push(record);
      }
      await this.db.saveTenantData(record.businessId, tenantData);
    }
  }
}
