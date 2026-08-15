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

const REQUEST_DELAY_MIN_MS = parseDelayMs(
  process.env.INSW_REQUEST_DELAY_MIN_MS,
  0
);
const REQUEST_DELAY_MAX_MS = parseDelayMs(
  process.env.INSW_REQUEST_DELAY_MAX_MS,
  0
);
const REQUEST_ERROR_COOLDOWN_MS = parseDelayMs(
  process.env.INSW_REQUEST_ERROR_COOLDOWN_MS,
  0
);
const MAX_CONCURRENT_REQUESTS = 8;

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
   * @param {(progress: {current: number, total: number, code: string, mode: string, result: HsCode}) => void} [options.onProgress]
   * @returns {Promise<HsCode[]>}
   */
  async function fetchMultiple(codes, options = {}) {
    const onProgress = typeof options.onProgress === "function"
      ? options.onProgress
      : null;

    const list = Array.isArray(codes) ? codes.map((code) => String(code ?? "")) : [];
    const total = list.length;
    const results = new Array(total);
    const cache = new Map();
    const queue = [];

    const runTask = async (code, index) => {
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

          if (resolveRequestDelay(mode) > 0) {
            await sleep(resolveRequestDelay(mode));
          }
        }
      }

      results[index] = result;

      if (onProgress) {
        onProgress({
          ...progressBase,
          mode,
          result,
        });
      }
    };

    for (let index = 0; index < total; index += 1) {
      const code = list[index];
      queue.push(runTask(code, index));

      if (queue.length >= MAX_CONCURRENT_REQUESTS || index === total - 1) {
        await Promise.all(queue.splice(0, queue.length));
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

function resolveRequestDelay(mode) {
  if (mode === "error") {
    return REQUEST_ERROR_COOLDOWN_MS;
  }

  return randomBetween(REQUEST_DELAY_MIN_MS, REQUEST_DELAY_MAX_MS);
}

function randomBetween(min, max) {
  const safeMin = Math.max(Number(min) || 0, 0);
  const safeMax = Math.max(Number(max) || safeMin, safeMin);
  return Math.round(Math.random() * (safeMax - safeMin) + safeMin);
}

function parseDelayMs(rawValue, fallback) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.round(parsed);
}

