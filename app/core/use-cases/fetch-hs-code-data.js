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
const MAX_CONCURRENCY = 5;

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
   * @returns {Promise<HsCode[]>}
   */
  async function fetchMultiple(codes) {
    const uniqueCodes = [...new Set(codes.filter(isValidHsCode))];
    const resultMap = new Map();
    const concurrency = Math.min(
      Math.max(resolveConcurrency(uniqueCodes.length), 1),
      MAX_CONCURRENCY
    );
    let cursor = 0;

    // Run with bounded worker pool to keep request rate controlled.
    async function worker() {
      while (true) {
        const currentIndex = cursor;
        cursor += 1;

        if (currentIndex >= uniqueCodes.length) {
          return;
        }

        const code = uniqueCodes[currentIndex];
        const result = await fetchSingle(code);
        resultMap.set(code, result);

        // Add a short delay to avoid burst traffic to INSW.
        await sleep(REQUEST_DELAY_MS);
      }
    }

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    // Map back to original order, handling duplicates
    return codes.map((code) => {
      const found = resultMap.get(code);
      return found || createEmptyHsCode(code);
    });
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

/**
 * Resolves worker count (1-5) based on request size.
 * @param {number} totalCodes - Number of unique HS codes
 * @returns {number}
 */
function resolveConcurrency(totalCodes) {
  if (totalCodes > 100) return 5;
  if (totalCodes > 60) return 4;
  if (totalCodes > 30) return 3;
  if (totalCodes > 10) return 2;
  return 1;
}
