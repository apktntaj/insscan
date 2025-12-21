/**
 * HS Code Controller
 * Interface Adapters Layer
 *
 * @description Orchestrates use cases and handles request/response transformation
 */

import { createFetchHsCodeDataUseCase } from "../../core/use-cases/fetch-hs-code-data";
import { inswApiGateway } from "../../infrastructure/services/insw-api.service";
import { toExcelData } from "../presenters/hs-code.presenter";
import { isValidHsCode } from "../../core/entities/hs-code";

/**
 * Creates the HS Code controller with injected dependencies
 * @returns {Object} Controller methods
 */
export function createHsCodeController() {
  const fetchHsCodeUseCase = createFetchHsCodeDataUseCase(inswApiGateway);

  /**
   * Handles request to fetch HS code data
   * @param {string[]} hsCodes - Array of HS codes from request
   * @returns {Promise<Object>} Response with Excel-formatted data
   */
  async function handleFetchRequest(hsCodes) {
    const results = await fetchHsCodeUseCase.fetchMultiple(hsCodes);
    const excelData = toExcelData(results);

    return {
      success: true,
      data: excelData,
    };
  }

  /**
   * Extracts valid HS codes from raw Excel data
   * @param {Array<Array>} rawData - 2D array from Excel
   * @returns {string[]} Array of valid HS codes
   */
  function extractHsCodesFromExcelData(rawData) {
    return rawData
      .filter((row) => row.length !== 0)
      .flatMap((row) => row.filter((cell) => isValidHsCode(cell)))
      .map(String);
  }

  return {
    handleFetchRequest,
    extractHsCodesFromExcelData,
  };
}

// Singleton instance for convenience
export const hsCodeController = createHsCodeController();
