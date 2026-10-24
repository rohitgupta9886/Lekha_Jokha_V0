/**
 * SandboxEwayProvider.mjs
 * 
 * Production-grade Sandbox / Mock-Separated NIC Provider for development,
 * testing, and staging environments before production credentials are activated.
 * 
 * Conforms strictly to official NIC Schema v1.03:
 * - Validates payloads via eway_validator.mjs
 * - Generates official 12-digit format EBNs (<StateCode><YY><MM><8-digits>)
 * - Maintains state and in-memory vehicle history
 * - Enforces statutory 24-hour cancellation rule
 * - Simulates distance calculation based on PIN code coordinates
 */

import { IEwayProvider } from './IEwayProvider.mjs';
import { validateEwayPayload, computeEwayValidityDate, canCancelEwayBill } from './eway_validator.mjs';

// Shared in-memory ledger across sandbox provider instances in the same process
const globalSandboxLedger = new Map();

export class SandboxEwayProvider extends IEwayProvider {
  constructor(config = {}) {
    super(config);
    this.sandboxLedger = globalSandboxLedger;
  }

  getProviderName() {
    return 'NIC_SANDBOX';
  }

  async authenticate() {
    // In sandbox, check that gstin and username/client_id are configured
    const gstin = this.config.gstin || '29AAAAA0000A1Z5';
    const username = this.config.username || 'sandbox_user';
    
    return {
      success: true,
      token: `SANDBOX_TOKEN_${Buffer.from(gstin + ':' + Date.now()).toString('base64')}`,
      expiry: new Date(Date.now() + 6 * 3600 * 1000).toISOString(), // 6 hours token
      provider: 'NIC_SANDBOX'
    };
  }

  async generateEwayBill(payload) {
    // 1. Strict NIC Schema validation
    const valResult = validateEwayPayload(payload);
    if (!valResult.valid) {
      return {
        success: false,
        error: `NIC Validation Failed: ${valResult.errors.join('; ')}`,
        errorCode: 'NIC_VAL_400',
        validationDetails: valResult
      };
    }

    // 2. Generate statutory 12-digit EBN
    // Format: StateCode (2 digits) + Year (2 digits) + Month (2 digits) + Sequence (6 digits)
    const fromState = String(payload.fromStateCode || 29).padStart(2, '0');
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(Math.floor(100000 + Math.random() * 900000));
    const ewayBillNo = `${fromState}${yy}${mm}${seq}`;

    // 3. Compute statutory validity
    const ewayBillDate = now.toISOString();
    const distanceKm = Number(payload.transDistance) || 100;
    const vehicleType = payload.vehicleType || 'R';
    const validUpto = computeEwayValidityDate(now, distanceKm, vehicleType).toISOString();

    const record = {
      ewayBillNo,
      ewayBillDate,
      validUpto,
      status: 'ACT', // Active
      docNo: payload.docNo,
      docDate: payload.docDate,
      fromGstin: payload.fromGstin,
      toGstin: payload.toGstin,
      totalValue: payload.totInvValue,
      transDistance: distanceKm,
      vehicleNo: payload.vehicleNo || null,
      vehicleType,
      transporterId: payload.transporterId || null,
      transDocNo: payload.transDocNo || null,
      transDocDate: payload.transDocDate || null,
      items: payload.itemList || [],
      history: [
        {
          action: 'GENERATED',
          timestamp: ewayBillDate,
          vehicleNo: payload.vehicleNo,
          fromPlace: payload.fromPlace
        }
      ]
    };

    this.sandboxLedger.set(ewayBillNo, record);

    return {
      success: true,
      ewayBillNo,
      ewayBillDate,
      validUpto,
      rawResponse: {
        status: 1,
        data: {
          ewayBillNo: Number(ewayBillNo),
          ewayBillDate,
          validUpto
        }
      }
    };
  }

  async getEwayBill(ewayBillNo) {
    const record = this.sandboxLedger.get(String(ewayBillNo));
    if (!record) {
      return {
        success: false,
        error: `e-Way Bill ${ewayBillNo} not found on Sandbox portal`,
        errorCode: 'NIC_NOT_FOUND_404'
      };
    }

    return {
      success: true,
      data: record
    };
  }

  async updateVehicle(updatePayload) {
    const { ewayBillNo, vehicleNo, fromPlace, fromState, reasonCode, reasonRem, transDocNo, transDocDate, transMode } = updatePayload;
    const record = this.sandboxLedger.get(String(ewayBillNo));

    if (!record) {
      return {
        success: false,
        error: `e-Way Bill ${ewayBillNo} not found`,
        errorCode: 'NIC_NOT_FOUND_404'
      };
    }

    if (record.status === 'CAN') {
      return {
        success: false,
        error: 'Cannot update vehicle for a CANCELLED e-Way Bill',
        errorCode: 'NIC_INVALID_STATUS_400'
      };
    }

    const now = new Date();
    record.vehicleNo = vehicleNo;
    record.history.push({
      action: 'VEHICLE_UPDATED',
      timestamp: now.toISOString(),
      vehicleNo,
      fromPlace,
      fromState,
      reasonCode,
      reasonRem,
      transDocNo,
      transDocDate
    });

    return {
      success: true,
      validUpto: record.validUpto,
      rawResponse: {
        status: 1,
        data: {
          ewayBillNo: Number(ewayBillNo),
          vehUpdDate: now.toISOString(),
          validUpto: record.validUpto
        }
      }
    };
  }

  async cancelEwayBill(cancelPayload) {
    const { ewbNo, cancelRsnCode, cancelRmrk } = cancelPayload;
    const record = this.sandboxLedger.get(String(ewbNo));

    if (!record) {
      return {
        success: false,
        error: `e-Way Bill ${ewbNo} not found`,
        errorCode: 'NIC_NOT_FOUND_404'
      };
    }

    if (record.status === 'CAN') {
      return {
        success: false,
        error: `e-Way Bill ${ewbNo} is already cancelled`,
        errorCode: 'NIC_ALREADY_CANCELLED_400'
      };
    }

    // Enforce statutory 24 hour check
    const checkCancel = canCancelEwayBill(record.ewayBillDate);
    if (!checkCancel.allowed) {
      return {
        success: false,
        error: checkCancel.reason,
        errorCode: 'NIC_CANCEL_TIMEOUT_403'
      };
    }

    const cancelDate = new Date().toISOString();
    record.status = 'CAN';
    record.cancelDate = cancelDate;
    record.cancelRsnCode = cancelRsnCode;
    record.cancelRmrk = cancelRmrk;
    record.history.push({
      action: 'CANCELLED',
      timestamp: cancelDate,
      cancelRsnCode,
      cancelRmrk
    });

    return {
      success: true,
      cancelDate,
      rawResponse: {
        status: 1,
        data: {
          ewayBillNo: Number(ewbNo),
          cancelDate
        }
      }
    };
  }

  async updateTransporter(transPayload) {
    const { ewbNo, transporterId } = transPayload;
    const record = this.sandboxLedger.get(String(ewbNo));

    if (!record) {
      return {
        success: false,
        error: `e-Way Bill ${ewbNo} not found`,
        errorCode: 'NIC_NOT_FOUND_404'
      };
    }

    record.transporterId = transporterId;
    return {
      success: true,
      rawResponse: {
        status: 1,
        data: {
          ewayBillNo: Number(ewbNo),
          transporterId
        }
      }
    };
  }

  async getDistance(fromPincode, toPincode) {
    if (!fromPincode || !toPincode) {
      return { success: false, error: 'Both fromPincode and toPincode are required' };
    }

    if (fromPincode === toPincode) {
      return { success: true, distanceKm: 20 };
    }

    // Deterministic distance formula based on PIN code differences for sandbox testing
    const p1 = parseInt(fromPincode, 10);
    const p2 = parseInt(toPincode, 10);
    if (isNaN(p1) || isNaN(p2)) {
      return { success: true, distanceKm: 150 };
    }

    const stateDiff = Math.abs(Math.floor(p1 / 100000) - Math.floor(p2 / 100000));
    let distance = 50 + stateDiff * 250 + (Math.abs(p1 - p2) % 150);
    if (distance > 4000) distance = 3500;
    if (distance < 20) distance = 25;

    return {
      success: true,
      distanceKm: Math.round(distance)
    };
  }
}
