/**
 * IEwayProvider.mjs
 * 
 * Formal interface contract for Indian GST e-Way Bill providers.
 * All implementations (NIC Direct, GSP Gateway, Sandbox) adhere to this contract.
 */

export class IEwayProvider {
  /**
   * @param {Object} config - Provider configuration (decrypted credentials, URLs)
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Returns provider identifier name
   * @returns {string}
   */
  getProviderName() {
    throw new Error('IEwayProvider.getProviderName() must be implemented');
  }

  /**
   * Authenticate / verify credentials with the provider or NIC gateway
   * @returns {Promise<{ success: boolean, token?: string, expiry?: string, error?: string }>}
   */
  async authenticate() {
    throw new Error('IEwayProvider.authenticate() must be implemented');
  }

  /**
   * Generate e-Way Bill
   * @param {Object} payload - NIC compliant e-Way Bill generation payload
   * @returns {Promise<{
   *   success: boolean,
   *   ewayBillNo?: string,
   *   ewayBillDate?: string,
   *   validUpto?: string,
   *   rawResponse?: any,
   *   error?: string,
   *   errorCode?: string
   * }>}
   */
  async generateEwayBill(payload) {
    throw new Error('IEwayProvider.generateEwayBill() must be implemented');
  }

  /**
   * Fetch details of an existing e-Way Bill by number
   * @param {string} ewayBillNo - 12-digit e-Way Bill number
   * @returns {Promise<{
   *   success: boolean,
   *   data?: any,
   *   error?: string,
   *   errorCode?: string
   * }>}
   */
  async getEwayBill(ewayBillNo) {
    throw new Error('IEwayProvider.getEwayBill() must be implemented');
  }

  /**
   * Update Part-B / Vehicle Details
   * @param {Object} updatePayload - { ewayBillNo, vehicleNo, fromPlace, fromState, reasonCode, reasonRem, transDocNo, transDocDate, transMode }
   * @returns {Promise<{
   *   success: boolean,
   *   validUpto?: string,
   *   rawResponse?: any,
   *   error?: string,
   *   errorCode?: string
   * }>}
   */
  async updateVehicle(updatePayload) {
    throw new Error('IEwayProvider.updateVehicle() must be implemented');
  }

  /**
   * Cancel an e-Way Bill (within 24 hours)
   * @param {Object} cancelPayload - { ewbNo, cancelRsnCode, cancelRmrk }
   * @returns {Promise<{
   *   success: boolean,
   *   cancelDate?: string,
   *   rawResponse?: any,
   *   error?: string,
   *   errorCode?: string
   * }>}
   */
  async cancelEwayBill(cancelPayload) {
    throw new Error('IEwayProvider.cancelEwayBill() must be implemented');
  }

  /**
   * Update Transporter ID
   * @param {Object} transPayload - { ewbNo, transporterId }
   * @returns {Promise<{
   *   success: boolean,
   *   rawResponse?: any,
   *   error?: string,
   *   errorCode?: string
   * }>}
   */
  async updateTransporter(transPayload) {
    throw new Error('IEwayProvider.updateTransporter() must be implemented');
  }

  /**
   * Calculate PIN-to-PIN Distance
   * @param {string} fromPincode
   * @param {string} toPincode
   * @returns {Promise<{ success: boolean, distanceKm?: number, error?: string }>}
   */
  async getDistance(fromPincode, toPincode) {
    throw new Error('IEwayProvider.getDistance() must be implemented');
  }
}
