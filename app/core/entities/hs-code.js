/**
 * HS Code Entity
 * Enterprise Business Rules - Pure domain object
 *
 * @description Represents a Harmonized System code with its tariff and regulation data
 */

/**
 * Creates an HS Code entity
 * @param {Object} params - HS Code parameters
 * @param {string} params.code - 8-digit HS code
 * @param {string} [params.bm] - Bea Masuk (Import Duty)
 * @param {string} [params.ppn] - PPN (Value Added Tax)
 * @param {string} [params.pph] - PPH (Income Tax)
 * @param {string} [params.pphNonApi] - PPH Non-API
 * @param {boolean} [params.hasLartasImport] - Has import regulation
 * @param {boolean} [params.hasLartasBorder] - Has border regulation
 * @param {boolean} [params.hasLartasPostBorder] - Has post-border regulation
 * @param {boolean} [params.hasLartasExport] - Has export regulation
 * @returns {HsCode}
 */
export function createHsCode({
  code,
  bm = null,
  ppn = null,
  pph = null,
  pphNonApi = null,
  hasLartasImport = false,
  hasLartasBorder = false,
  hasLartasPostBorder = false,
  hasLartasExport = false,
}) {
  return Object.freeze({
    code,
    bm,
    ppn,
    pph,
    pphNonApi,
    hasLartasImport,
    hasLartasBorder,
    hasLartasPostBorder,
    hasLartasExport,
  });
}

/**
 * Validates if a string is a valid HS Code format
 * @param {string|number} value - Value to validate
 * @returns {boolean} True if valid 8-digit HS code
 */
export function isValidHsCode(value) {
  const str = String(value);
  const pattern = /^\d{8}$/;
  return pattern.test(str);
}

/**
 * Formats HS code with dots (e.g., "12345678" -> "1234.56.78")
 * @param {string} code - Raw HS code
 * @returns {string} Formatted HS code
 */
export function formatHsCode(code) {
  return String(code).replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
}

/**
 * Creates an empty/not-found HS Code entity
 * @param {string} code - The HS code
 * @returns {HsCode}
 */
export function createEmptyHsCode(code) {
  return createHsCode({
    code,
    bm: "tidak ada data",
    ppn: "tidak ada data",
    pph: "tidak ada data",
    pphNonApi: "tidak ada data",
    hasLartasImport: false,
    hasLartasBorder: false,
    hasLartasPostBorder: false,
    hasLartasExport: false,
  });
}
