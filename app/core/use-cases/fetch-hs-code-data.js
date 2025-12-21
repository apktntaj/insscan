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
    });
  }

  /**
   * Fetches data for multiple HS codes
   * @param {string[]} codes - Array of HS codes
   * @returns {Promise<HsCode[]>}
   */
  async function fetchMultiple(codes) {
    const uniqueCodes = [...new Set(codes.filter(isValidHsCode))];
    const results = await Promise.all(uniqueCodes.map(fetchSingle));

    // Map back to original order, handling duplicates
    return codes.map((code) => {
      const found = results.find((r) => r.code === code);
      return found || createEmptyHsCode(code);
    });
  }

  return {
    fetchSingle,
    fetchMultiple,
  };
}
