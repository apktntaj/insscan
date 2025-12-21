/**
 * INSW API Service
 * Infrastructure Layer - External service adapter
 *
 * @description Implements HsCodeGateway interface for INSW API
 */

const INSW_API_URL = "https://api.insw.go.id/api-prod-ba/ref/hscode/komoditas";

const INSW_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  authorization: "Basic aW5zd18yOmJhYzJiYXM2",
  "sec-ch-ua":
    '"Not/A)Brand";v="99", "Microsoft Edge";v="115", "Chromium";v="115"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  Referer: "https://insw.go.id/",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

/**
 * Fetches HS code data from INSW API
 * @param {string} hsCode - HS code to fetch
 * @returns {Promise<Object|null>} Parsed HS code data or null if not found
 */
async function fetchByCode(hsCode) {
  try {
    const response = await fetch(`${INSW_API_URL}?hs_code=${hsCode}`, {
      method: "GET",
      headers: INSW_HEADERS,
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    const data = json.data?.[0];

    if (!data) {
      return null;
    }

    return mapInswResponseToRawData(data);
  } catch (error) {
    console.error(`Failed to fetch HS code ${hsCode}:`, error);
    return null;
  }
}

/**
 * Maps INSW API response to internal data format
 * @param {Object} data - Raw INSW API response data
 * @returns {Object} Mapped data
 */
function mapInswResponseToRawData(data) {
  return {
    bm: data.new_mfn?.[0]?.bm?.[0]?.bm ?? null,
    ppn: data.new_mfn?.[0]?.ppn?.[0]?.ppn ?? null,
    pph: data.new_mfn?.[0]?.pph?.[0]?.pph ?? null,
    pphNonApi: data.new_mfn?.[0]?.pph?.[1]?.pph ?? null,
    hasLartasImport:
      Array.isArray(data.import_regulation) &&
      data.import_regulation.length > 0,
    hasLartasBorder:
      Array.isArray(data.import_regulation_border) &&
      data.import_regulation_border.length > 0,
    hasLartasPostBorder:
      Array.isArray(data.import_regulation_post_border) &&
      data.import_regulation_post_border.length > 0,
    hasLartasExport:
      Array.isArray(data.export_regulation) &&
      data.export_regulation.length > 0,
  };
}

/**
 * Fetches multiple HS codes data
 * @param {string[]} hsCodes - Array of HS codes
 * @returns {Promise<Object[]>} Array of HS code data
 */
async function fetchByCodes(hsCodes) {
  const results = await Promise.all(hsCodes.map(fetchByCode));
  return results;
}

/**
 * INSW API Gateway - implements HsCodeGateway interface
 */
export const inswApiGateway = {
  fetchByCode,
  fetchByCodes,
};
