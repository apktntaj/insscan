/**
 * INSW API Service
 * Infrastructure Layer - External service adapter
 *
 * @description Implements HsCodeGateway interface for INSW API
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

const INSW_CMS_SEARCH_URL = "https://api.insw.go.id/api/cms/hscode";
const INSW_CMS_DETAIL_URL = "https://api.insw.go.id/api/cms/detail-komoditas";
const INSW_PUBLIC_HSCODE_URL = "https://api.insw.go.id/api-prod/ref/hscode";
const INSW_PUBLIC_DETAIL_ENDPOINTS = [
  "https://api.insw.go.id/api-prod-ba/ref/hscode/komoditas",
  "https://api.insw.go.id/api-prod/ref/hscode/komoditas",
];

// 

// 

const INSW_CMS_TOKEN = "Basic eyJhbGciOiJSUzI1NiIsInR5cCI6ImJzYStqd3QiLCJraWQiOiJLR0pfOVI1ZDRfbXpUQ21iWXJkNGllcUtXaTI5RWlfNmZoQTZxOTFXUmdjIn0.eyJpYXQiOjE3NzgyOTM0MzgsImV4cCI6MTc3ODM0NTk5OSwiYXVkIjoiaHR0cHM6Ly9pbnN3LmdvLmlkIiwiaXNzIjoiaHR0cHM6Ly9zc28uaW5zdy5nby5pZCIsInN1YiI6ImEwYWMwOWZhLTU2NzMtNDJjNi05ZmUxLTQxMWU2YzkzNzEwYSIsImp0aSI6IlUyRnNkR1ZrWDErT3NheTU1aGhSWjBjSW1tNFh3Y09OZWp5c2k2Q0tVYmFVWUFjUE5DeWNQNUVvcDNmZXNhaHhhSm1qVUFoSEhGYmt4QmFObEtiKzJZOGY1TlMzbFJWcVk4cjRDSWtwenF2LzFPZUVQdnQ0anQrUzFLNER1eWZna3BDcVN0WW5pblFVaUZ2cml3QkZuZVlDVHhxKzhWSG1LNmVkc3ovN2pkTkdPaGtIZlIrYVAwVUt6dndsa284Z0Y1V2w3SWVleXFGcW9GYUVXTXJKKzFGQTZCcXVwWHhBM0JjdDh5REl5c1dUdUI3Z29yZlprZTZFbVQraDY5cWEifQ.iCDJhpemoX6EJzYzPkAdKY7QDSMt0vyVdv2X4u0JWvhIRwkSS2QTRKJesT-fh7gMW1iODM9eg1Bilhc9eSJ_75aW3JTW26vcBpaFdpjpcjDKzpZtJVhnHL5f_SEOJQg1lxXcdOdjfBmgGVDWi_dxH2w8vRrxktb_rfi0zmUeJAHMC_18Qp5lvERnkCAEBDx7offT15p6hSUyjKDDl5PLCzmjKQUlDU_8RVnm6i8UEmolHlvgoCYcVV41HaVrZL7p82SQ40dZ_SHjwMLUfhInNqUjKiQArX1ZSkOldUqNP7vbkucvi2D_daYBwmDSV8mx81GsP0WWhd4SM31fZiExBw"
const INSW_PUBLIC_ONLY_MODE =
  process.env.INSW_PUBLIC_ONLY_MODE === "true" ||
  process.env.INSW_DISABLE_AUTH_SOURCES === "true";
const INSW_USE_LOCAL_MOCK = process.env.INSW_USE_LOCAL_MOCK === "true";
const INSW_MOCK_ONLY_MODE = process.env.INSW_MOCK_ONLY_MODE === "true";
const INSW_MOCK_FILE_PATH =
  process.env.INSW_MOCK_FILE_PATH ||
  path.join(process.cwd(), "app/infrastructure/mocks/insw-detail-komoditas.mock.json");

const INSW_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
};
let cachedMockSnapshot = null;
let mockSnapshotLoaded = false;

/**
 * Fetches HS code data from INSW API
 * @param {string} hsCode - HS code to fetch
 * @returns {Promise<Object|null>} Parsed HS code data or null if not found
 */
async function fetchByCode(hsCode) {
  const normalizedCode = normalizeHsCode(hsCode);

  if (!normalizedCode) {
    return null;
  }

  try {
    if (INSW_USE_LOCAL_MOCK) {
      const mockDetail = await loadMockCmsDetailByCode(normalizedCode);

      if (mockDetail) {
        return mapCmsDetailToRawData(mockDetail);
      }

      if (INSW_MOCK_ONLY_MODE) {
        return null;
      }
    }

    // Primary source for LARTAS + tariff details. Requires valid CMS token.
    // Two-step flow: Search first, then fetch details
    if (!INSW_PUBLIC_ONLY_MODE && INSW_CMS_TOKEN) {
      const detailData = await fetchCmsDetailWithSearch(normalizedCode);

      if (detailData) {
        return mapCmsDetailToRawData(detailData);
      }
    }

    // Public detail endpoint (no auth), if available.
    const publicDetailData = await fetchPublicDetailByCode(normalizedCode);
    if (publicDetailData) {
      return publicDetailData;
    }

    // Final fallback public list endpoint (no auth). LARTAS fields are typically unavailable here.
    const response = await fetch(INSW_PUBLIC_HSCODE_URL, {
      method: "GET",
      headers: INSW_HEADERS,
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    const list = json.data || [];
    const data = list.find((item) => {
      const byFormat = normalizeHsCode(item.hsCodeFormat) === normalizedCode;
      const byDotCode = normalizeHsCode(item.kodeHsCode) === normalizedCode;
      return byFormat || byDotCode;
    });

    if (!data) {
      return null;
    }

    return mapPublicHsCodeToRawData(data);
  } catch (error) {
    console.error(`Failed to fetch HS code ${hsCode}:`, error);
    return null;
  }
}

/**
 * Maps CMS detail-komoditas response into internal raw data shape
 * @param {Object} data - CMS detail-komoditas payload
 * @returns {Object}
 */
function mapCmsDetailToRawData(data) {
  const tarif = Array.isArray(data.informasiTarif) ? data.informasiTarif : [];
  const dokumenPabeanLinkMap = buildDokumenPabeanLinkMap(data.dokPabean);
  const getTarifValue = (matcher) =>
    tarif.find((item) => matcher(String(item.label || "").toLowerCase()))?.value ??
    null;

  const pphValue = getTarifValue(
    (label) => label.includes("pph") && !label.includes("non")
  );
  const pphNonApiValue = getTarifValue(
    (label) => label.includes("pph") && label.includes("non")
  );

  const lartasBorderDetails = attachDokumenLinksToRegulations(
    extractRegulationDetails(data.regulasiImporBorder),
    dokumenPabeanLinkMap
  );
  const lartasPostBorderDetails = attachDokumenLinksToRegulations(
    extractRegulationDetails(data.regulasiImporPostborder),
    dokumenPabeanLinkMap
  );
  const lartasExportDetails = attachDokumenLinksToRegulations(
    extractRegulationDetails(data.regulasiEkspor),
    dokumenPabeanLinkMap
  );
  const lartasImportDetails = mergeLartasDetails([
    ...lartasBorderDetails,
    ...lartasPostBorderDetails,
  ]);

  return {
    bm: getTarifValue((label) => label.includes("bm mfn") || label === "bm"),
    ppn: getTarifValue((label) => label === "ppn"),
    pph: normalizeTarifValue(pphValue),
    pphNonApi: normalizeTarifValue(pphNonApiValue),
    hasLartasImport: lartasImportDetails.length > 0,
    hasLartasBorder: lartasBorderDetails.length > 0,
    hasLartasPostBorder: lartasPostBorderDetails.length > 0,
    hasLartasExport: lartasExportDetails.length > 0,
    lartasImportDetails,
    lartasBorderDetails,
    lartasPostBorderDetails,
    lartasExportDetails,
  };
}

/**
 * Maps public HS endpoint response into internal raw data shape
 * @param {Object} data - Public HS list item
 * @returns {Object}
 */
function mapPublicHsCodeToRawData(data) {
  return {
    bm: normalizeTarifValue(data.bmMfn ?? data.bm ?? data.bm_mfn ?? null),
    ppn: normalizeTarifValue(data.ppn ?? data.ppnBm ?? data.ppn_bm ?? null),
    pph: normalizeTarifValue(data.pph ?? data.pphApi ?? data.pph_api ?? null),
    pphNonApi: normalizeTarifValue(
      data.pphNonApi ?? data.pph_non_api ?? data.pphNonAPI ?? null
    ),
    hasLartasImport: false,
    hasLartasBorder: false,
    hasLartasPostBorder: false,
    hasLartasExport: false,
    lartasImportDetails: [],
    lartasBorderDetails: [],
    lartasPostBorderDetails: [],
    lartasExportDetails: [],
  };
}

/**
 * Tries unauthenticated public detail endpoints by HS code.
 * @param {string} hsCode - 8-digit HS code
 * @returns {Promise<Object|null>}
 */
async function fetchPublicDetailByCode(hsCode) {
  for (const endpoint of INSW_PUBLIC_DETAIL_ENDPOINTS) {
    const candidates = [
      `${endpoint}?hs_code=${encodeURIComponent(hsCode)}`,
      `${endpoint}?hsCode=${encodeURIComponent(hsCode)}`,
      `${endpoint}?kodeHsCode=${encodeURIComponent(hsCode)}`,
    ];

    for (const url of candidates) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: INSW_HEADERS,
        });

        if (!response.ok) {
          continue;
        }

        const json = await response.json();
        const payload = extractFirstDataPayload(json);

        if (!payload) {
          continue;
        }

        const mapped = mapPublicHsCodeToRawData(payload);
        if (hasMeaningfulData(mapped)) {
          return mapped;
        }
      } catch {
        // Best-effort endpoint probing; ignore and continue.
      }
    }
  }

  return null;
}

/**
 * Extract first usable object from known API payload shapes.
 * @param {unknown} json
 * @returns {Object|null}
 */
function extractFirstDataPayload(json) {
  if (!json || typeof json !== "object") {
    return null;
  }

  const data = json.data ?? json.result ?? json.payload ?? null;

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  if (data && typeof data === "object") {
    if (Array.isArray(data.komoditas)) {
      return data.komoditas[0] ?? null;
    }
    if (Array.isArray(data.items)) {
      return data.items[0] ?? null;
    }
    return data;
  }

  return null;
}

/**
 * Determines if mapped response has useful tariff/lartas values.
 * @param {Object|null} raw
 * @returns {boolean}
 */
function hasMeaningfulData(raw) {
  if (!raw) {
    return false;
  }

  const hasTarif = Boolean(raw.bm || raw.ppn || raw.pph || raw.pphNonApi);
  const hasLartas = Boolean(
    raw.hasLartasImport ||
      raw.hasLartasBorder ||
      raw.hasLartasPostBorder ||
      raw.hasLartasExport
  );

  return hasTarif || hasLartas;
}

/**
 * Searches for HS codes from CMS search endpoint
 * First request in two-step flow
 * @param {string} keyword - HS code keyword/value to search
 * @param {number} size - Result page size (default: 200)
 * @param {number} from - Result offset/pagination (default: 0)
 * @returns {Promise<Array<Object>>} Array of matching HS code search results
 */
async function fetchCmsSearchByKeyword(keyword, size = 200, from = 0) {
  if (!INSW_CMS_TOKEN) {
    return [];
  }

  const token =
    INSW_CMS_TOKEN.startsWith("Basic ") ||
    INSW_CMS_TOKEN.startsWith("Bearer ")
      ? INSW_CMS_TOKEN
      : `Basic ${INSW_CMS_TOKEN}`;

  try {
    const searchUrl = `${INSW_CMS_SEARCH_URL}?keyword=${encodeURIComponent(keyword)}&size=${size}&from=${from}`;
    
    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        ...INSW_HEADERS,
        authorization: token,
        origin: "https://insw.go.id",
        referer: "https://insw.go.id/",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("INSW CMS token is invalid or expired.");
      }
      return [];
    }

    const json = await response.json();
    const data = json?.data;

    // Handle various response formats
    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === "object" && Array.isArray(data.items)) {
      return data.items;
    }

    if (data && typeof data === "object" && Array.isArray(data.results)) {
      return data.results;
    }

    return [];
  } catch (error) {
    console.error(`Failed to search CMS for keyword ${keyword}:`, error);
    return [];
  }
}

/**
 * Two-step flow: Search for HS code, then fetch detailed data
 * @param {string} hsCode - 8-digit HS code to search and fetch
 * @returns {Promise<Object|null>} Detailed HS code data or null if not found
 */
async function fetchCmsDetailWithSearch(hsCode) {
  // Step 1: Search for the HS code
  const searchResults = await fetchCmsSearchByKeyword(hsCode, 200, 0);

  if (searchResults.length === 0) {
    console.debug(`No search results found for HS code ${hsCode}`);
    return null;
  }

  console.debug(`Found ${searchResults.length} search results for HS code ${hsCode}`);

  // Step 2: Fetch detailed data for the matched HS code
  const detailData = await fetchCmsDetailByCode(hsCode);
  return detailData;
}

/**
 * Fetches detailed HS code data from CMS detail-komoditas endpoint
 * Second request in two-step flow
 * @param {string} hsCode - 8-digit HS code
 * @returns {Promise<Object|null>}
 */
async function fetchCmsDetailByCode(hsCode) {
  if (!INSW_CMS_TOKEN) {
    return null;
  }

  const token =
    INSW_CMS_TOKEN.startsWith("Basic ") ||
    INSW_CMS_TOKEN.startsWith("Bearer ")
      ? INSW_CMS_TOKEN
      : `Basic ${INSW_CMS_TOKEN}`;

  try {
    const response = await fetch(`${INSW_CMS_DETAIL_URL}?hsCode=${hsCode}`, {
      method: "GET",
      headers: {
        ...INSW_HEADERS,
        authorization: token,
        origin: "https://insw.go.id",
        referer: "https://insw.go.id/",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("INSW CMS token is invalid or expired.");
      }
      return null;
    }

    const json = await response.json();
    const payload = json?.data;

    if (!payload) {
      return null;
    }

    return Array.isArray(payload) ? payload[0] ?? null : payload;
  } catch (error) {
    console.error(`Failed to fetch CMS detail for HS code ${hsCode}:`, error);
    return null;
  }
}

/**
 * Normalizes HS code by stripping non-digits
 * @param {string|number} value - Raw HS code
 * @returns {string}
 */
function normalizeHsCode(value) {
  return String(value ?? "").replace(/\D/g, "");
}

/**
 * Normalizes tariff display value
 * @param {string|null} value - Raw tariff value
 * @returns {string|null}
 */
function normalizeTarifValue(value) {
  if (!value || String(value).trim().toUpperCase() === "N/A") {
    return null;
  }

  return String(value).trim();
}

/**
 * Extracts regulation details from CMS LARTAS object
 * @param {Object} regulationObject - LARTAS regulation object grouped by doc code
 * @returns {Array<Object>}
 */
function extractRegulationDetails(regulationObject) {
  if (!regulationObject || typeof regulationObject !== "object") {
    return [];
  }

  const detailMap = new Map();

  for (const [docCode, entries] of Object.entries(regulationObject)) {
    if (!Array.isArray(entries)) {
      continue;
    }

    for (const entry of entries) {
      const key = [
        entry.id_dokumen || "",
        entry.kd_ijin || "",
        entry.ur_ijin || "",
        entry.no_skep || "",
      ].join("|");

      const existing = detailMap.get(key) || {
        idDokumen: entry.id_dokumen || null,
        kodeIzin: entry.kd_ijin || null,
        namaIzin: entry.ur_ijin || null,
        komoditi: entry.komoditi || null,
        noSkep: entry.no_skep || null,
        uraianBarangSkep: entry.ur_brg_skep || null,
        hsCode: entry.hs_code || null,
        tanggalMulai: entry.tgl_awal || null,
        tanggalAkhir: entry.tgl_akhir || null,
        link: normalizeRegulationLink(entry),
        dokumenPabeanSet: new Set(),
      };

      existing.dokumenPabeanSet.add(String(docCode));

      if (Array.isArray(entry.dok_pabean)) {
        entry.dok_pabean.forEach((code) => {
          existing.dokumenPabeanSet.add(String(code));
        });
      }

      if (!existing.link) {
        existing.link = normalizeRegulationLink(entry);
      }

      detailMap.set(key, existing);
    }
  }

  return Array.from(detailMap.values()).map((item) => {
    const dokumenPabean = Array.from(item.dokumenPabeanSet).sort();
    const { dokumenPabeanSet, ...rest } = item;
    return {
      ...rest,
      dokumenPabean,
    };
  });
}

/**
 * Merges and de-duplicates LARTAS detail lists
 * @param {Array<Object>} details - Flat detail list
 * @returns {Array<Object>}
 */
function mergeLartasDetails(details) {
  const merged = new Map();

  for (const detail of details) {
    const key = [
      detail.idDokumen || "",
      detail.kodeIzin || "",
      detail.namaIzin || "",
      detail.noSkep || "",
    ].join("|");

    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...detail,
        dokumenPabean: [...(detail.dokumenPabean || [])],
        links: [...(detail.links || [])],
      });
      continue;
    }

    const joinedDocCodes = new Set([
      ...(existing.dokumenPabean || []),
      ...(detail.dokumenPabean || []),
    ]);

    existing.dokumenPabean = Array.from(joinedDocCodes).sort();
    const joinedLinks = new Set([...(existing.links || []), ...(detail.links || [])]);
    existing.links = Array.from(joinedLinks);

    if (!existing.link && detail.link) {
      existing.link = detail.link;
    }
  }

  return Array.from(merged.values());
}

/**
 * Normalizes any potential regulation URL from INSW payload
 * @param {Object} entry - Regulation entry
 * @returns {string|null}
 */
function normalizeRegulationLink(entry) {
  const rawLink =
    entry.file_path ||
    entry.filePath ||
    entry.ket_link ||
    entry.ketLink ||
    entry.url ||
    entry.link ||
    entry.document_url ||
    null;

  if (!rawLink || typeof rawLink !== "string") {
    return null;
  }

  if (rawLink.startsWith("http://") || rawLink.startsWith("https://")) {
    return rawLink;
  }

  if (rawLink.startsWith("./")) {
    return `https://api.insw.go.id/${rawLink.slice(2)}`;
  }

  if (rawLink.startsWith("/")) {
    return `https://api.insw.go.id${rawLink}`;
  }

  return null;
}

/**
 * Loads mock CMS detail-komoditas payload by HS code from local JSON file.
 * @param {string} hsCode - normalized numeric HS code
 * @returns {Promise<Object|null>}
 */
async function loadMockCmsDetailByCode(hsCode) {
  const snapshot = await loadMockSnapshot();
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const byItems =
    snapshot.items && typeof snapshot.items === "object"
      ? Object.entries(snapshot.items).find(
          ([key]) => normalizeHsCode(key) === hsCode
        )?.[1]
      : null;

  if (byItems && typeof byItems === "object") {
    return byItems;
  }

  const candidates = Array.isArray(snapshot.data)
    ? snapshot.data
    : Array.isArray(snapshot.items)
    ? snapshot.items
    : [];

  const byArray = candidates.find(
    (item) => normalizeHsCode(item?.hs_code || item?.hsCode) === hsCode
  );

  return byArray && typeof byArray === "object" ? byArray : null;
}

/**
 * Reads and memoizes local mock snapshot JSON.
 * @returns {Promise<Object|null>}
 */
async function loadMockSnapshot() {
  if (mockSnapshotLoaded) {
    return cachedMockSnapshot;
  }

  mockSnapshotLoaded = true;

  try {
    const raw = await readFile(INSW_MOCK_FILE_PATH, "utf8");
    cachedMockSnapshot = JSON.parse(raw);
  } catch {
    cachedMockSnapshot = null;
  }

  return cachedMockSnapshot;
}

/**
 * Builds mapping from dokumen pabean code to regulation PDF link.
 * @param {Object} dokPabean - CMS dokPabean payload
 * @returns {Map<string,string>}
 */
function buildDokumenPabeanLinkMap(dokPabean) {
  const map = new Map();

  if (!dokPabean || typeof dokPabean !== "object") {
    return map;
  }

  for (const entries of Object.values(dokPabean)) {
    if (!Array.isArray(entries)) {
      continue;
    }

    for (const entry of entries) {
      const code = String(entry.kd_dokumen || "").trim();
      const link = normalizeRegulationLink(entry);

      if (!code || !link) {
        continue;
      }

      if (!map.has(code)) {
        map.set(code, link);
      }
    }
  }

  return map;
}

/**
 * Enriches LARTAS details with document links from dokumen pabean mapping.
 * @param {Array<Object>} details - LARTAS details
 * @param {Map<string,string>} dokumenLinkMap - Mapping of doc code to link
 * @returns {Array<Object>}
 */
function attachDokumenLinksToRegulations(details, dokumenLinkMap) {
  if (!Array.isArray(details) || details.length === 0) {
    return [];
  }

  return details.map((detail) => {
    const linksFromDokumen = (detail.dokumenPabean || [])
      .map((code) => dokumenLinkMap.get(String(code)))
      .filter(Boolean);
    const links = Array.from(new Set([...(detail.links || []), ...linksFromDokumen]));

    return {
      ...detail,
      links,
      link: detail.link || links[0] || null,
    };
  });
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
  fetchCmsSearchByKeyword,
  fetchCmsDetailWithSearch,
};
