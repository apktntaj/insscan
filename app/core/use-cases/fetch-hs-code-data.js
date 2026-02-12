/**
 * Fetch HS Code Data Use Case
 * Application Business Rules
 *
 * @description Orchestrates fetching HS code data from external service
 */

import {
  createHsCode,
  createEmptyHsCode,
  isValidHsCode,
} from "../entities/hs-code";

const REQUEST_DELAY_MS = 250;

/**
 * @typedef {Object} HsCodeGateway
 * @property {function(string): Promise<Object|null>} fetchByCode - Fetches HS code data
 */

/**
 * Creates the Fetch HS Code Data use case
 * @param {HsCodeGateway} hsCodeGateway - Gateway for fetching HS code data
 * @returns {Object} Use case methods
 */
export function createFetchHsCodeDataUseCase(hsCodeGateway) {
  /**
   * Fetches data for a single HS code
   * @param {string} code - HS code to fetch
   * @returns {Promise<HsCode>}
   */
  async function fetchSingle(code) {
    if (!isValidHsCode(code)) {
      return createEmptyHsCode(code);
    }

    const rawData = await hsCodeGateway.fetchByCode(code);

    if (!rawData) {
      return createEmptyHsCode(code);
    }

    return createHsCode({
      code,
      bm: rawData.bm,
      ppn: rawData.ppn,
      pph: rawData.pph,
      pphNonApi: rawData.pphNonApi,
      hasLartasImport: rawData.hasLartasImport,
      hasLartasBorder: rawData.hasLartasBorder,
      hasLartasPostBorder: rawData.hasLartasPostBorder,
      hasLartasExport: rawData.hasLartasExport,
      lartasImportDetails: rawData.lartasImportDetails,
      lartasBorderDetails: rawData.lartasBorderDetails,
      lartasPostBorderDetails: rawData.lartasPostBorderDetails,
      lartasExportDetails: rawData.lartasExportDetails,
    });
  }

  /**
   * Fetches data for multiple HS codes
   * @param {string[]} codes - Array of HS codes
   * @param {Object} [options] - Optional callbacks/options
   * @param {(progress: {current: number, total: number, code: string, mode: string}) => void} [options.onProgress]
   * @returns {Promise<HsCode[]>}
   */
  async function fetchMultiple(codes, options = {}) {
    const onProgress = typeof options.onProgress === "function"
      ? options.onProgress
      : null;

    const list = Array.isArray(codes) ? codes.map((code) => String(code ?? "")) : [];
    const total = list.length;
    const results = [];
    const cache = new Map();

    for (let index = 0; index < total; index += 1) {
      const code = list[index];
      const progressBase = {
        current: index + 1,
        total,
        code,
      };

      let result = createEmptyHsCode(code);
      let mode = "invalid";

      if (isValidHsCode(code)) {
        if (cache.has(code)) {
          result = cache.get(code);
          mode = "cached";
        } else {
          try {
            result = await fetchSingle(code);
            cache.set(code, result);
            mode = "fetched";
          } catch (error) {
            console.error(`Failed to process HS code ${code}:`, error);
            result = createEmptyHsCode(code);
            mode = "error";
          }

          // Keep a small gap between real INSW requests.
          await sleep(REQUEST_DELAY_MS);
        }
      }

      results.push(result);

      if (onProgress) {
        onProgress({
          ...progressBase,
          mode,
        });
      }
    }

    return results;
  }

  return {
    fetchSingle,
    fetchMultiple,
  };
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
