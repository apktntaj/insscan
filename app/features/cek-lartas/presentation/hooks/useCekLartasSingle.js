"use client";

import { useState, useCallback } from "react";
import { parseHsCodeApiResponse } from "@/app/features/cek-lartas/adapters/presenters/cek-lartas.presenter";
import { isValidHsCode } from "@core/cek-lartas/domain";
import { downloadAsExcel } from "@/app/shared/infrastructure/excel/excel.service";
import { useQueryLimit } from "@/app/features/cek-lartas/presentation/hooks/useQueryLimit";

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Fetch satu HS code dari endpoint /api/hs-code.
 * Kembalikan ParseResult — tidak pernah throw kecuali network error.
 *
 * @param {string} normalized - HS code 8 digit yang sudah dinormalisasi
 * @returns {Promise<{ ok: true, data: import('@core/cek-lartas/domain').Result } | { ok: false, error: string }>}
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

/** Build one export row per verified LARTAS requirement. */
function buildSingleExcelRows(result) {
  const str = (v) => (v !== null && v !== undefined ? String(v) : "-");
  const joinArr = (v) =>
    Array.isArray(v) && v.length > 0 ? v.join(", ") : "-";

  const rows = result.requirements.map((requirement) => ({
    "HS Code": result.hsCode,
    "Kategori LARTAS": requirement.category,
    "Nama Izin": str(requirement.namaIzin),
    "No SKEP": str(requirement.noSkep),
    "ID Dokumen": str(requirement.idDokumen),
    "Dokumen Pabean": joinArr(requirement.dokumenPabean),
    "Tanggal Mulai": str(requirement.tanggalMulai),
    "Tanggal Akhir": str(requirement.tanggalAkhir),
  }));

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
function failureMessage(reason) {
  if (reason === "tidak-ditemukan") return "HS code tidak ditemukan pada sumber.";
  if (reason === "belum-terverifikasi") {
    return "Sumber hanya menyediakan data parsial; status LARTAS belum terverifikasi.";
  }
  if (reason === "hscode-tidak-valid") return "HS code tidak valid.";
  return "Sumber LARTAS gagal diakses. Silakan coba lagi.";
}

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
 * @returns {import('@/app/features/cek-lartas/adapters/presenters/cek-lartas.presenter').SingleHookReturn}
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
  const { remaining, isLimitReached, isPro, consume, activateKey } = useQueryLimit();

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

    if (isLimitReached) {
      setSingleStatus("Batas query harian tercapai.");
      return;
    }

    const allowed = consume(1);
    if (!allowed) {
      setSingleStatus("Batas query harian tercapai.");
      return;
    }

    setIsSingleLoading(true);
    setSingleStatus("Mengambil data HS code...");
    setSingleResult(null);

    try {
      const result = await fetchSingleHsCode(normalized);

      if (!result.ok) {
        setSingleStatus(`Gagal: ${result.error}.`);
      } else if (result.data.status === "gagal") {
        setSingleStatus(failureMessage(result.data.reason));
      } else {
        setSingleResult(result.data);
        setSingleStatus("Data LARTAS berhasil diverifikasi.");
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
    remaining,
    isLimitReached,
    isPro,
    activateKey,
  };
}
