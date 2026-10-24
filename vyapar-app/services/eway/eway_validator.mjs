// ==============================================================================
// Lekha Jokha - Official NIC GST e-Way Bill Specification & Validator Engine
// Conforming to Government of India (NIC) Schema Version 1.03
// (https://docs.ewaybillgst.gov.in/apidocs/)
// ==============================================================================

// Official 2-digit Indian GST State Codes
export const GST_STATE_CODES = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh (New)",
  "38": "Ladakh",
  "97": "Other Territory",
  "99": "Centre Jurisdiction"
};

// State code to Indian PIN code prefix ranges
export const STATE_PIN_PREFIX_MAP = {
  "01": ["18", "19"],
  "02": ["17"],
  "03": ["14", "15", "16"],
  "04": ["16"],
  "05": ["24", "26"],
  "06": ["12", "13"],
  "07": ["11"],
  "08": ["30", "31", "32", "33", "34"],
  "09": ["20", "21", "22", "23", "24", "25", "26", "27", "28"],
  "10": ["80", "81", "82", "83", "84", "85"],
  "11": ["73"],
  "12": ["79"],
  "13": ["79"],
  "14": ["79"],
  "15": ["79"],
  "16": ["79"],
  "17": ["79"],
  "18": ["78"],
  "19": ["70", "71", "72", "73", "74"],
  "20": ["81", "82", "83"],
  "21": ["75", "76", "77"],
  "22": ["49"],
  "23": ["45", "46", "47", "48"],
  "24": ["36", "37", "38", "39"],
  "26": ["39"],
  "27": ["40", "41", "42", "43", "44"],
  "29": ["56", "57", "58", "59"],
  "30": ["40"],
  "31": ["68"],
  "32": ["67", "68", "69"],
  "33": ["60", "61", "62", "63", "64"],
  "34": ["60"],
  "35": ["74"],
  "36": ["50"],
  "37": ["51", "52", "53"],
  "38": ["19"]
};

// Document types allowed in NIC e-Way Bill
export const VALID_DOC_TYPES = ['INV', 'BIL', 'BOE', 'CHL', 'OTH'];

// Supply and Sub-supply types
export const VALID_SUPPLY_TYPES = ['O', 'I']; // Outward, Inward
export const VALID_SUB_SUPPLY_TYPES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

// Transport Modes: 1-Road, 2-Rail, 3-Air, 4-Ship
export const VALID_TRANSPORT_MODES = ['1', '2', '3', '4'];

// Vehicle Types: R-Regular, O-Over Dimensional Cargo
export const VALID_VEHICLE_TYPES = ['R', 'O'];

// Cancellation Reason Codes: 1-Duplicate, 2-Order Cancelled, 3-Data Entry Error, 4-Others
export const VALID_CANCEL_REASONS = [1, 2, 3, 4];

// GSTIN Regex conforming to Indian Tax Rules
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Standard Indian Vehicle Number Regex (e.g. DL01AB1234, MH12C1234, HR26A1234)
export const VEHICLE_NO_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z]{0,3}[0-9]{4}$/;

/**
 * Validates whether a GSTIN is valid or URP (Unregistered Person)
 */
export function isValidGstin(gstin) {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  if (clean === 'URP') return true;
  return GSTIN_REGEX.test(clean);
}

/**
 * Validates a 6-digit Indian Postal PIN Code
 */
export function isValidPincode(pin) {
  if (!pin) return false;
  return /^[1-9][0-9]{5}$/.test(String(pin).trim());
}

/**
 * Checks if PIN code matches its declared State code
 */
export function isPincodeMatchingState(pin, stateCode) {
  if (!isValidPincode(pin) || !stateCode) return false;
  const sCodeStr = String(stateCode).padStart(2, '0');
  const prefixes = STATE_PIN_PREFIX_MAP[sCodeStr];
  if (!prefixes) return true; // fallback if state not strictly mapped
  const pinPrefix = String(pin).trim().substring(0, 2);
  return prefixes.includes(pinPrefix);
}

/**
 * Validates Indian Vehicle Number (strips hyphens and spaces)
 */
export function isValidVehicleNo(vehNo) {
  if (!vehNo) return false;
  const clean = vehNo.replace(/[\s-]/g, '').toUpperCase();
  return VEHICLE_NO_REGEX.test(clean);
}

/**
 * Normalizes vehicle number to standard uppercase without spaces or hyphens
 */
export function normalizeVehicleNo(vehNo) {
  if (!vehNo) return '';
  return vehNo.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Calculates government statutory validity in hours/days based on Distance and Vehicle Type
 * Rules:
 *  - Regular Vehicle (R): 1 day for first 200 km, +1 day for every additional 200 km
 *  - Over Dimensional Cargo (O): 1 day for first 20 km, +1 day for every additional 20 km
 * @param {number} distanceKm
 * @param {string} vehicleType 'R' | 'O'
 * @returns {number} validityDays
 */
export function calculateValidityDays(distanceKm, vehicleType = 'R') {
  const km = Math.max(1, Number(distanceKm) || 1);
  const kmPerDay = vehicleType === 'O' ? 20 : 200;
  return Math.max(1, Math.ceil(km / kmPerDay));
}

/**
 * Computes official validUntil timestamp string (YYYY-MM-DD 23:59:59)
 */
export function computeValidUntil(generationDate, distanceKm, vehicleType = 'R') {
  const base = generationDate ? new Date(generationDate) : new Date();
  const days = calculateValidityDays(distanceKm, vehicleType);
  const expiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  const yyyy = expiry.getFullYear();
  const mm = String(expiry.getMonth() + 1).padStart(2, '0');
  const dd = String(expiry.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} 23:59:59`;
}

/**
 * Checks if an e-Way Bill is within the statutory 24-hour cancellation window
 */
export function isWithinCancellationWindow(ewayDate) {
  if (!ewayDate) return false;
  const eDate = new Date(ewayDate).getTime();
  const now = Date.now();
  const diffHours = (now - eDate) / (1000 * 60 * 60);
  return diffHours <= 24.0;
}

/**
 * Comprehensive Payload Validator
 * Validates complete NIC JSON payload against government constraints
 * @param {object} p
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
export function validateEwayPayload(p) {
  const errors = [];
  const warnings = [];

  if (!p) {
    return { isValid: false, errors: ['E-Way Bill request payload is empty.'], warnings };
  }

  // 1. Document & Supply Type
  if (!p.docNo || String(p.docNo).trim() === '') {
    errors.push('Document Number (docNo / invoiceNo) is required.');
  }
  if (!p.docDate) {
    errors.push('Document Date (docDate) is required.');
  }
  const docType = (p.docType || 'INV').toUpperCase();
  if (!VALID_DOC_TYPES.includes(docType)) {
    errors.push(`Invalid Document Type '${p.docType}'. Must be one of: ${VALID_DOC_TYPES.join(', ')}.`);
  }

  const supplyType = (p.supplyType || 'O').toUpperCase();
  if (!VALID_SUPPLY_TYPES.includes(supplyType)) {
    errors.push(`Invalid Supply Type '${p.supplyType}'. Must be 'O' (Outward) or 'I' (Inward).`);
  }

  // 2. Consignor (FROM) Details
  if (!p.fromGstin || !isValidGstin(p.fromGstin)) {
    errors.push(`Supplier GSTIN '${p.fromGstin}' is invalid. Must be a valid 15-character GSTIN.`);
  }
  if (!p.fromTrdName || p.fromTrdName.trim().length < 3) {
    errors.push('Supplier Trade/Legal Name (fromTrdName) is required (min 3 chars).');
  }
  if (!p.fromPincode || !isValidPincode(p.fromPincode)) {
    errors.push(`Supplier PIN code '${p.fromPincode}' is invalid. Must be a 6-digit numeric PIN.`);
  }
  if (!p.fromStateCode) {
    errors.push('Supplier State Code (fromStateCode) is required.');
  } else {
    const sCode = String(p.fromStateCode).padStart(2, '0');
    if (!GST_STATE_CODES[sCode]) {
      errors.push(`Supplier State Code '${p.fromStateCode}' is not a recognized Indian GST state.`);
    } else if (p.fromPincode && !isPincodeMatchingState(p.fromPincode, sCode)) {
      warnings.push(`Supplier PIN code '${p.fromPincode}' does not belong to standard range for state ${sCode} (${GST_STATE_CODES[sCode]}).`);
    }
  }

  // 3. Consignee (TO) Details
  if (!p.toGstin || !isValidGstin(p.toGstin)) {
    errors.push(`Recipient GSTIN '${p.toGstin}' is invalid. Must be a valid 15-digit GSTIN or 'URP' for unregistered consumer.`);
  }
  if (!p.toTrdName || p.toTrdName.trim().length < 2) {
    errors.push('Recipient Name (toTrdName) is required.');
  }
  if (!p.toPincode || !isValidPincode(p.toPincode)) {
    errors.push(`Recipient Delivery PIN code '${p.toPincode}' is invalid. Must be a 6-digit numeric PIN.`);
  }
  if (!p.toStateCode) {
    errors.push('Recipient State Code (toStateCode) is required.');
  } else {
    const sCode = String(p.toStateCode).padStart(2, '0');
    if (!GST_STATE_CODES[sCode]) {
      errors.push(`Recipient State Code '${p.toStateCode}' is not a recognized Indian GST state.`);
    } else if (p.toPincode && !isPincodeMatchingState(p.toPincode, sCode)) {
      warnings.push(`Recipient PIN code '${p.toPincode}' does not belong to standard range for state ${sCode} (${GST_STATE_CODES[sCode]}).`);
    }
  }

  // 4. Line Items & HSN Validation
  const items = p.itemList || p.items || [];
  if (!Array.isArray(items) || items.length === 0) {
    errors.push('At least one item must be included in itemList.');
  } else {
    items.forEach((item, idx) => {
      if (!item.productName && !item.name) {
        errors.push(`Item #${idx + 1}: Product name is required.`);
      }
      const hsn = item.hsnCode || item.hsn || '';
      if (!hsn || String(hsn).length < 2 || !/^[0-9]+$/.test(String(hsn))) {
        errors.push(`Item #${idx + 1}: Valid numeric HSN code (min 2 digits) is mandatory for GST compliance.`);
      }
      const qty = Number(item.quantity || item.qty);
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Item #${idx + 1}: Quantity must be greater than zero.`);
      }
      const taxable = Number(item.taxableAmount || item.amount || 0);
      if (isNaN(taxable) || taxable < 0) {
        errors.push(`Item #${idx + 1}: Taxable amount must be non-negative.`);
      }
    });
  }

  // 5. Total Value & Tax Consistency Check
  const totalTaxable = Number(p.totalValue || p.totalTaxableAmount || 0);
  const cgst = Number(p.cgstValue || p.cgstAmount || 0);
  const sgst = Number(p.sgstValue || p.sgstAmount || 0);
  const igst = Number(p.igstValue || p.igstAmount || 0);
  const cess = Number(p.cessValue || p.cessAmount || 0);
  const totInvValue = Number(p.totInvValue || p.totalAmount || 0);

  if (isNaN(totInvValue) || totInvValue <= 0) {
    errors.push('Total Consignment Value (totInvValue) must be greater than zero.');
  }

  // Tax math cross-check
  const calculatedTotal = totalTaxable + cgst + sgst + igst + cess;
  if (totalTaxable > 0 && Math.abs(totInvValue - calculatedTotal) > 2.0) {
    errors.push(`Invoice total (₹${totInvValue}) does not match Taxable Value + Applicable Taxes (₹${calculatedTotal.toFixed(2)}). Difference exceeds rounding limit.`);
  }

  // Interstate vs Intrastate tax rule
  const fromState = String(p.fromStateCode || '').padStart(2, '0');
  const toState = String(p.toStateCode || '').padStart(2, '0');
  if (fromState && toState) {
    if (fromState !== toState) {
      // Interstate: IGST applies, CGST and SGST should be 0
      if ((cgst > 0 || sgst > 0) && igst === 0) {
        errors.push(`Interstate transaction (From state ${fromState} to ${toState}) requires IGST. CGST and SGST cannot be charged on interstate movements.`);
      }
    } else {
      // Intrastate: CGST + SGST applies, IGST should be 0
      if (igst > 0 && (cgst === 0 && sgst === 0)) {
        errors.push(`Intrastate transaction (Within state ${fromState}) requires CGST and SGST. IGST cannot be charged on intrastate movements.`);
      }
      if (Math.abs(cgst - sgst) > 1.0) {
        errors.push(`Intrastate taxes must have equal CGST (₹${cgst}) and SGST (₹${sgst}) amounts.`);
      }
    }
  }

  // 6. Transport / Part B Details
  const transMode = String(p.transMode || '1');
  if (!VALID_TRANSPORT_MODES.includes(transMode)) {
    errors.push(`Invalid Transport Mode '${p.transMode}'. 1-Road, 2-Rail, 3-Air, 4-Ship.`);
  }

  const distance = Number(p.transDistance || p.distanceKm || 0);
  if (isNaN(distance) || distance <= 0 || distance > 4000) {
    errors.push('Approximate Transport Distance must be between 1 KM and 4000 KM.');
  }

  // If Road transport, vehicle number or transporter ID is mandatory
  if (transMode === '1') {
    const hasVehicle = !!p.vehicleNo || !!p.vehicleNumber;
    const hasTransporter = !!p.transporterId && isValidGstin(p.transporterId);

    if (!hasVehicle && !hasTransporter) {
      errors.push('For Road transport, either a valid Vehicle Number (Part B) or an authorized Transporter ID (Part A only) is required.');
    }
    if (hasVehicle) {
      const veh = p.vehicleNo || p.vehicleNumber;
      if (!isValidVehicleNo(veh)) {
        errors.push(`Vehicle number '${veh}' does not match Indian motor vehicle registration format (e.g. DL01AB1234).`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Compute statutory validity date according to Rule 138(10) of CGST Rules
 * Regular Cargo: 1 day for every 200 km (or part thereof)
 * Over Dimensional Cargo (ODC): 1 day for every 20 km (or part thereof)
 * @param {Date|string} genDate - Generation date/time
 * @param {number} distanceKm - Approx distance in kilometers
 * @param {string} vehicleType - 'R' (Regular) or 'O' (ODC)
 * @returns {Date}
 */
export function computeEwayValidityDate(genDate, distanceKm, vehicleType = 'R') {
  const d = new Date(genDate);
  const kmPerDay = vehicleType === 'O' ? 20 : 200;
  const validityDays = Math.max(1, Math.ceil(Number(distanceKm || 0) / kmPerDay));

  // Valid until 23:59:59 of the validity day
  const validUntil = new Date(d.getTime() + validityDays * 24 * 3600 * 1000);
  validUntil.setHours(23, 59, 59, 999);
  return validUntil;
}

/**
 * Check if e-Way Bill is within the statutory 24-hour cancellation window
 * Pursuant to Rule 138(9) of CGST Rules
 * @param {Date|string} genDate - Generation date/time
 * @returns {{ allowed: boolean, reason?: string, elapsedHours?: number }}
 */
export function canCancelEwayBill(genDate) {
  const genTime = new Date(genDate).getTime();
  const now = Date.now();
  const elapsedMs = now - genTime;
  const elapsedHours = elapsedMs / (1000 * 3600);

  if (elapsedHours > 24) {
    return {
      allowed: false,
      reason: `Cannot cancel e-Way Bill: ${elapsedHours.toFixed(1)} hours have elapsed since generation, which exceeds statutory 24-hour window under Rule 138(9).`,
      elapsedHours
    };
  }

  return {
    allowed: true,
    elapsedHours
  };
}

