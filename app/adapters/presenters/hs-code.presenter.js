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
 * Transforms HS Code entity to table/API response format
 * @param {HsCode} hsCode - HS Code entity
 * @returns {Object}
 */
export function toResultRow(hsCode) {
  return {
    hsCode: hsCode.code,
    bm: hsCode.bm ?? "tidak ada data",
    ppn: hsCode.ppn ?? "tidak ada data",
    pph: hsCode.pph ?? "tidak ada data",
    pphNonApi: hsCode.pphNonApi ?? "tidak ada data",
    hasLartasImport: Boolean(hsCode.hasLartasImport),
    hasLartasBorder: Boolean(hsCode.hasLartasBorder),
    hasLartasPostBorder: Boolean(hsCode.hasLartasPostBorder),
    hasLartasExport: Boolean(hsCode.hasLartasExport),
    lartasImportDetails: hsCode.lartasImportDetails || [],
    lartasBorderDetails: hsCode.lartasBorderDetails || [],
    lartasPostBorderDetails: hsCode.lartasPostBorderDetails || [],
    lartasExportDetails: hsCode.lartasExportDetails || [],
  };
}

/**
 * Transforms array of HS Code entities to table/API response format
 * @param {HsCode[]} hsCodes - Array of HS Code entities
 * @returns {Object[]}
 */
export function toResultData(hsCodes) {
  return hsCodes.map(toResultRow);
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

// ─── Task 1.1: Helpers untuk parseHsCodeApiResponse ───────────────────────────

/**
 * Memeriksa apakah value adalah plain object (bukan null, array, atau primitif).
 *
 * @param {unknown} value
 * @returns {boolean}
 *
 * @example
 * isPlainObject({})          // => true
 * isPlainObject({ a: 1 })   // => true
 * isPlainObject(null)        // => false
 * isPlainObject([1, 2])      // => false
 * isPlainObject("string")    // => false
 * isPlainObject(42)          // => false
 */
export function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Normalisasi array detail LARTAS.
 * Kembalikan array apa adanya jika valid, atau `[]` jika bukan array.
 *
 * @param {unknown} value
 * @returns {Array}
 *
 * @example
 * parseDetailArray([{ namaIzin: "PI" }])  // => [{ namaIzin: "PI" }]
 * parseDetailArray([])                     // => []
 * parseDetailArray(null)                   // => []
 * parseDetailArray(undefined)              // => []
 * parseDetailArray("bukan array")          // => []
 */
export function parseDetailArray(value) {
  return Array.isArray(value) ? value : [];
}

// ─── Task 1.2: parseHsCodeApiResponse ─────────────────────────────────────────

/**
 * Mem-parse satu objek respons mentah dari API /api/hs-code atau stream /api/hs-code/progress
 * menjadi LartasResult yang tervalidasi.
 * Tidak pernah throw — error dikembalikan sebagai { ok: false, error }.
 *
 * @param {unknown} raw - Objek mentah dari API
 * @returns {{ ok: true, data: import('./types').LartasResult } | { ok: false, error: string }}
 *
 * @example
 * parseHsCodeApiResponse({ hsCode: "84713090", bm: "0%", hasLartasImport: false })
 * // => { ok: true, data: { hsCode: "84713090", bm: "0%", hasLartasImport: false, lartasImportDetails: [], ... } }
 *
 * @example
 * parseHsCodeApiResponse(null)
 * // => { ok: false, error: "Response tidak valid: bukan objek" }
 *
 * @example
 * parseHsCodeApiResponse({ bm: "5%" })
 * // => { ok: false, error: "Field wajib tidak ada: hsCode" }
 */
export function parseHsCodeApiResponse(raw) {
  // Validasi: harus plain object
  if (!isPlainObject(raw)) {
    return { ok: false, error: "Response tidak valid: bukan objek" };
  }

  // Validasi: field wajib hsCode
  if (raw.hsCode === undefined || raw.hsCode === null || raw.hsCode === "") {
    return { ok: false, error: "Field wajib tidak ada: hsCode" };
  }

  // Normalisasi string-or-null helper
  const toStringOrNull = (v) =>
    v !== undefined && v !== null ? String(v) : null;

  /** @type {import('./types').LartasResult} */
  const data = {
    hsCode: String(raw.hsCode),
    bm: toStringOrNull(raw.bm),
    ppn: toStringOrNull(raw.ppn),
    pph: toStringOrNull(raw.pph),
    pphNonApi: toStringOrNull(raw.pphNonApi),
    hasLartasImport: Boolean(raw.hasLartasImport),
    hasLartasBorder: Boolean(raw.hasLartasBorder),
    hasLartasPostBorder: Boolean(raw.hasLartasPostBorder),
    hasLartasExport: Boolean(raw.hasLartasExport),
    lartasImportDetails: parseDetailArray(raw.lartasImportDetails),
    lartasBorderDetails: parseDetailArray(raw.lartasBorderDetails),
    lartasPostBorderDetails: parseDetailArray(raw.lartasPostBorderDetails),
    lartasExportDetails: parseDetailArray(raw.lartasExportDetails),
  };

  return { ok: true, data };
}
