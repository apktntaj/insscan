"use client";

import { useState, useCallback } from "react";
import { parseHsCodeApiResponse } from "../../adapters/presenters/hs-code.presenter";
import { isValidHsCode } from "../../core/entities/hs-code";
import { downloadAsExcel } from "../../infrastructure/excel/excel.service";

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Fetch satu HS code dari endpoint /api/hs-code.
 * Kembalikan ParseResult — tidak pernah throw kecuali network error.
 *
 * @param {string} normalized - HS code 8 digit yang sudah dinormalisasi
 * @returns {Promise<{ ok: true, data: import('../../adapters/presenters/hs-code.presenter').LartasResult } | { ok: false, error: string }>}
 *
 * @example
 * fetchSingleHsCode("84713090")
 * // => { ok: true, data: { hsCode: "84713090", bm: "0%", ... } }
 *
 * @example
 * fetchSingleHsCode("00000000") // server returns 404
 * // => { ok: false, error: "HTTP 404" }
 */
async function fetchSingleHsCode(normalized) {
  const response = await fetch("/api/hs-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ hs_code: normalized }]),
  });

  if (!response.ok) {
    return { ok: false, error: `HTTP ${response.status}` };
  }

  const json = await response.json();
  return parseHsCodeApiResponse(json[0]);
}

/**
 * Ubah LartasResult menjadi array ExcelSingleRow untuk export.
 * Jika tidak ada detail LARTAS sama sekali: kembalikan satu baris dengan Kategori "Tidak Ada".
 * Setiap detail dari setiap kategori menjadi satu baris terpisah.
 *
 * @param {import('../../adapters/presenters/hs-code.presenter').LartasResult} result
 * @returns {Array<{
 *   "HS Code": string,
 *   "Kategori LARTAS": string,
 *   "Nama Izin": string,
 *   "No SKEP": string,
 *   "ID Dokumen": string,
 *   "Dokumen Pabean": string,
 *   "Tanggal Mulai": string,
 *   "Tanggal Akhir": string,
 * }>}
 *
 * @example
 * buildSingleExcelRows({
 *   hsCode: "84713090",
 *   lartasBorderDetails: [{ namaIzin: "PI", noSkep: "123", idDokumen: "D1", dokumenPabean: ["20"], tanggalMulai: "2024-01-01", tanggalAkhir: "2025-01-01" }],
 *   lartasPostBorderDetails: [],
 *   lartasExportDetails: [],
 * })
 * // => [{ "HS Code": "84713090", "Kategori LARTAS": "Impor Border", "Nama Izin": "PI", "No SKEP": "123", "ID Dokumen": "D1", "Dokumen Pabean": "20", "Tanggal Mulai": "2024-01-01", "Tanggal Akhir": "2025-01-01" }]
 *
 * @example
 * buildSingleExcelRows({ hsCode: "00000000", lartasBorderDetails: [], lartasPostBorderDetails: [], lartasExportDetails: [] })
 * // => [{ "HS Code": "00000000", "Kategori LARTAS": "Tidak Ada", "Nama Izin": "-", "No SKEP": "-", "ID Dokumen": "-", "Dokumen Pabean": "-", "Tanggal Mulai": "-", "Tanggal Akhir": "-" }]
 */
function buildSingleExcelRows(result) {
  const str = (v) => (v !== null && v !== undefined ? String(v) : "-");
  const joinArr = (v) =>
    Array.isArray(v) && v.length > 0 ? v.join(", ") : "-";

  /** @param {import('../../adapters/presenters/hs-code.presenter').LartasDetail} detail */
  const toRow = (detail, kategori) => ({
    "HS Code": result.hsCode,
    "Kategori LARTAS": kategori,
    "Nama Izin": str(detail.namaIzin),
    "No SKEP": str(detail.noSkep),
    "ID Dokumen": str(detail.idDokumen),
    "Dokumen Pabean": joinArr(detail.dokumenPabean),
    "Tanggal Mulai": str(detail.tanggalMulai),
    "Tanggal Akhir": str(detail.tanggalAkhir),
  });

  const categories = [
    { details: result.lartasBorderDetails ?? [], label: "Impor Border" },
    { details: result.lartasPostBorderDetails ?? [], label: "Impor Post Border" },
    { details: result.lartasExportDetails ?? [], label: "Ekspor Border" },
  ];

  const rows = categories.flatMap(({ details, label }) =>
    details.map((detail) => toRow(detail, label))
  );

  if (rows.length === 0) {
    return [
      {
        "HS Code": result.hsCode,
        "Kategori LARTAS": "Tidak Ada",
        "Nama Izin": "-",
        "No SKEP": "-",
        "ID Dokumen": "-",
        "Dokumen Pabean": "-",
        "Tanggal Mulai": "-",
        "Tanggal Akhir": "-",
      },
    ];
  }

  return rows;
}

/**
 * Buat nama file Excel untuk export mode Single.
 * Format: lartas-{hsCode}-{YYYYMMDD}.xlsx
 *
 * @param {string} hsCode - HS code 8 digit
 * @returns {string}
 *
 * @example
 * formatSingleExcelFilename("84713090") // (pada 2025-01-15)
 * // => "lartas-84713090-20250115.xlsx"
 *
 * @example
 * formatSingleExcelFilename("01234567") // (pada 2024-12-31)
 * // => "lartas-01234567-20241231.xlsx"
 */
function formatSingleExcelFilename(hsCode) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `lartas-${hsCode}-${yyyy}${mm}${dd}.xlsx`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook untuk logika fetch mode Single Cek Lartas.
 * Mengelola state input, hasil, status, dan loading.
 * Mengekspos handleFetch, handleCopy, handleExportSingle.
 *
 * @returns {import('../../adapters/presenters/hs-code.presenter').SingleHookReturn}
 *
 * @example
 * // Penggunaan di komponen:
 * const { singleInput, setSingleInput, singleResult, singleStatus, isSingleLoading,
 *         handleFetch, handleCopy, handleExportSingle } = useCekLartasSingle();
 *
 * @example
 * // Setelah handleFetch("84713090") berhasil:
 * // singleResult => { hsCode: "84713090", bm: "0%", ... }
 * // singleStatus => "Data berhasil ditampilkan."
 * // isSingleLoading => false
 */
export function useCekLartasSingle() {
  const [singleInput, setSingleInput] = useState("");
  const [singleResult, setSingleResult] = useState(null);
  const [singleStatus, setSingleStatus] = useState("");
  const [isSingleLoading, setIsSingleLoading] = useState(false);

  /**
   * Validasi input, fetch ke /api/hs-code, parse respons, update state.
   *
   * @returns {Promise<void>}
   */
  const handleFetch = useCallback(async () => {
    const normalized = String(singleInput).replace(/\D/g, "");

    if (!isValidHsCode(normalized)) {
      setSingleStatus("HS code harus 8 digit angka.");
      return;
    }

    setIsSingleLoading(true);
    setSingleStatus("Mengambil data HS code...");
    setSingleResult(null);

    try {
      const result = await fetchSingleHsCode(normalized);

      if (result.ok) {
        setSingleResult(result.data);
        setSingleStatus("Data berhasil ditampilkan.");
      } else {
        if (result.error.startsWith("HTTP")) {
          setSingleStatus(`Gagal: ${result.error}.`);
        } else {
          setSingleStatus(`Gagal: ${result.error}.`);
        }
      }
    } catch {
      setSingleStatus(
        "Gagal terhubung ke server. Periksa koneksi internet Anda."
      );
    } finally {
      setIsSingleLoading(false);
    }
  }, [singleInput]);

  /**
   * Salin HS code dari singleResult ke clipboard.
   * Jika Clipboard API tidak tersedia: set singleStatus error.
   * Jika berhasil: set singleStatus konfirmasi selama 2 detik, lalu reset.
   *
   * @returns {Promise<void>}
   */
  const handleCopy = useCallback(async () => {
    if (!navigator.clipboard) {
      setSingleStatus("Salin tidak didukung di browser ini.");
      return;
    }

    await navigator.clipboard.writeText(singleResult.hsCode);
    setSingleStatus("HS code disalin ke clipboard.");
    setTimeout(() => setSingleStatus(""), 2000);
  }, [singleResult]);

  /**
   * Export singleResult ke file Excel.
   * Jika singleResult null: tidak melakukan aksi.
   *
   * @returns {void}
   */
  const handleExportSingle = useCallback(() => {
    if (!singleResult) return;

    const rows = buildSingleExcelRows(singleResult);
    downloadAsExcel(rows, formatSingleExcelFilename(singleResult.hsCode));
  }, [singleResult]);

  return {
    singleInput,
    setSingleInput,
    singleResult,
    singleStatus,
    isSingleLoading,
    handleFetch,
    handleCopy,
    handleExportSingle,
  };
}
