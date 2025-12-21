/**
 * HS Code Presenter
 * Interface Adapters Layer
 *
 * @description Transforms domain entities to view models for the UI
 */

/**
 * Transforms HS Code entity to Excel export format
 * @param {HsCode} hsCode - HS Code entity
 * @returns {Object} Excel row data
 */
export function toExcelRow(hsCode) {
  return {
    "HS Code": hsCode.code,
    BM: hsCode.bm ?? "tidak ada data",
    PPN: hsCode.ppn ?? "tidak ada data",
    PPH: hsCode.pph ?? "tidak ada data",
    "PPH NON API": hsCode.pphNonApi ?? "tidak ada data",
    "LARTAS IMPORT": hsCode.hasLartasImport ? "Ada" : "-",
    "LARTAS BORDER": hsCode.hasLartasBorder ? "Ada" : "-",
    "LARTAS POST BORDER": hsCode.hasLartasPostBorder ? "Ada" : "-",
    "LARTAS EXPORT": hsCode.hasLartasExport ? "Ada" : "-",
  };
}

/**
 * Transforms array of HS Code entities to Excel format
 * @param {HsCode[]} hsCodes - Array of HS Code entities
 * @returns {Object[]} Array of Excel row data
 */
export function toExcelData(hsCodes) {
  return hsCodes.map(toExcelRow);
}

/**
 * Transforms HS Code entity to table display format
 * @param {HsCode} hsCode - HS Code entity
 * @param {number} index - Row index
 * @returns {Object} Table row view model
 */
export function toTableRow(hsCode, index) {
  return {
    id: index,
    code: hsCode.code,
    formattedCode: formatForDisplay(hsCode.code),
  };
}

/**
 * Formats HS code for display with dots
 * @param {string} code - Raw HS code
 * @returns {string} Formatted code
 */
function formatForDisplay(code) {
  return String(code).replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
}
