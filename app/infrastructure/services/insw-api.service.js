/**
 * INSW API Service
 * Infrastructure Layer - External service adapter
 *
 * @description Implements HsCodeGateway interface for INSW API
 */

const INSW_CMS_DETAIL_URL = "https://api.insw.go.id/api/cms/detail-komoditas";
const INSW_PUBLIC_HSCODE_URL = "https://api.insw.go.id/api-prod/ref/hscode";
const INSW_CMS_TOKEN = process.env.INSW_CMS_TOKEN || process.env.INSW_BEARER_TOKEN;

const INSW_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
};

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
    // Primary source for LARTAS + tariff details. Requires valid CMS token.
    if (INSW_CMS_TOKEN) {
      const detailData = await fetchCmsDetailByCode(normalizedCode);

      if (detailData) {
        return mapCmsDetailToRawData(detailData);
      }
    }

    // Fallback public endpoint (no auth). LARTAS fields are typically unavailable here.
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
  const getTarifValue = (matcher) =>
    tarif.find((item) => matcher(String(item.label || "").toLowerCase()))?.value ??
    null;

  const pphValue = getTarifValue(
    (label) => label.includes("pph") && !label.includes("non")
  );
  const pphNonApiValue = getTarifValue(
    (label) => label.includes("pph") && label.includes("non")
  );

  const lartasBorderDetails = extractRegulationDetails(data.regulasiImporBorder);
  const lartasPostBorderDetails = extractRegulationDetails(
    data.regulasiImporPostborder
  );
  const lartasExportDetails = extractRegulationDetails(data.regulasiEkspor);
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
    bm: data.bmMfn ?? null,
    ppn: null,
    pph: null,
    pphNonApi: null,
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
 * Fetches detailed HS code data from CMS detail-komoditas endpoint
 * @param {string} hsCode - 8-digit HS code
 * @returns {Promise<Object|null>}
 */
async function fetchCmsDetailByCode(hsCode) {
  const token =
    INSW_CMS_TOKEN.startsWith("Basic ") ||
    INSW_CMS_TOKEN.startsWith("Bearer ")
      ? INSW_CMS_TOKEN
      : `Basic ${INSW_CMS_TOKEN}`;

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
      });
      continue;
    }

    const joinedDocCodes = new Set([
      ...(existing.dokumenPabean || []),
      ...(detail.dokumenPabean || []),
    ]);

    existing.dokumenPabean = Array.from(joinedDocCodes).sort();

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
    return `https://insw.go.id/${rawLink.slice(2)}`;
  }

  if (rawLink.startsWith("/")) {
    return `https://insw.go.id${rawLink}`;
  }

  return null;
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
