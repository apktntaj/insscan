/**
 * HS Code Controller
 * Interface Adapters Layer
 *
 * @description Orchestrates use cases and handles request/response transformation
 */

import { createFetchHsCodeDataUseCase } from "@core/hs-code/use-cases/fetch-hs-code-data";
import { inswApiGateway } from "@/app/features/hs-code/infrastructure/insw-api.service";
import { toResultData } from "../presenters/hs-code.presenter";
import { isValidHsCode } from "@core/hs-code/domain/hs-code";

/**
 * Creates the HS Code controller with injected dependencies
 * @returns {Object} Controller methods
 */
export function createHsCodeController() {
  const fetchHsCodeUseCase = createFetchHsCodeDataUseCase(inswApiGateway, {
    requestDelayMinMs: Number(process.env.INSW_REQUEST_DELAY_MIN_MS),
    requestDelayMaxMs: Number(process.env.INSW_REQUEST_DELAY_MAX_MS),
    requestErrorCooldownMs: Number(process.env.INSW_REQUEST_ERROR_COOLDOWN_MS),
  });

  /**
   * Handles request to fetch HS code data
   * @param {string[]} hsCodes - Array of HS codes from request
   * @param {Object} [options] - Optional callbacks/options
   * @returns {Promise<Object>} Response with Excel-formatted data
   */
  async function handleFetchRequest(hsCodes, options = {}) {
    const results = await fetchHsCodeUseCase.fetchMultiple(hsCodes, options);
    const tableData = toResultData(results);

    return {
      success: true,
      data: tableData,
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
