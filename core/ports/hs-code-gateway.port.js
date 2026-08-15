/**
 * HS Code Gateway Port (Interface)
 * Defines the contract for HS code data sources
 *
 * @description Output port - implemented by infrastructure layer
 */

/**
 * @typedef {Object} RawHsCodeData
 * @property {string} bm - Bea Masuk
 * @property {string} ppn - PPN
 * @property {string} pph - PPH
 * @property {string} pphNonApi - PPH Non-API
 * @property {boolean} hasLartasImport - Has import regulation
 * @property {boolean} hasLartasBorder - Has border regulation
 * @property {boolean} hasLartasPostBorder - Has post-border regulation
 * @property {boolean} hasLartasExport - Has export regulation
 */

/**
 * @typedef {Object} HsCodeGateway
 * @property {function(string): Promise<RawHsCodeData|null>} fetchByCode - Fetches HS code data by code
 * @property {function(string[]): Promise<RawHsCodeData[]>} fetchByCodes - Fetches multiple HS codes data
 */

/**
 * Validates that an object implements the HsCodeGateway interface
 * @param {Object} gateway - Object to validate
 * @throws {Error} If gateway doesn't implement required methods
 */
export function validateHsCodeGateway(gateway) {
  if (typeof gateway?.fetchByCode !== "function") {
    throw new Error("HsCodeGateway must implement fetchByCode method");
  }
}
