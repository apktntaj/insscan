"use client";

import React, { useMemo, useState, useCallback } from "react";
import Alert from "../common/Alert";
import { formatHsCode, isValidHsCode } from "../../../core/entities/hs-code";
import LartasDocModal from "./cek-lartas/LartasDocModal";

/**
 * LartasMatrixTable Component
 * Inner component that renders the LARTAS matrix table with document codes as columns.
 *
 * @param {{ rows: object[], viewMode: string, setViewMode: (mode: string) => void }} props
 */
function LartasMatrixTable({ rows, viewMode, setViewMode }) {
  const [activeCell, setActiveCell] = useState(null);
  const matrixRows = useMemo(() => buildMatrixRows(rows), [rows]);
  const docCodes = useMemo(() => collectDocumentCodes(matrixRows), [matrixRows]);
  const displayedRows = useMemo(
    () => matrixRows.filter((item) => (viewMode === "all" ? true : item.hasLartas)),
    [matrixRows, viewMode]
  );

  const lartasCount = matrixRows.filter((r) => r.hasLartas).length;
  const totalCount = matrixRows.length;

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Header: ringkasan + toggle filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Hasil Cek LARTAS</p>
          <p className="mt-0.5 text-sm text-zinc-600">
            <span className="font-semibold text-zinc-900">{lartasCount}</span> dari{" "}
            <span className="font-semibold text-zinc-900">{totalCount}</span> HS code terkena LARTAS.
            {" "}Klik sel <span className="font-medium text-zinc-800">Ada</span> untuk lihat detail regulasi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("lartas")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              viewMode === "lartas"
                ? "border-cyan-700 bg-gradient-to-r from-sky-900 to-cyan-700 text-white"
                : "border-zinc-300 text-zinc-600 hover:border-sky-200 hover:bg-sky-50"
            }`}
          >
            Hanya yang LARTAS
          </button>
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              viewMode === "all"
                ? "border-cyan-700 bg-gradient-to-r from-sky-900 to-cyan-700 text-white"
                : "border-zinc-300 text-zinc-600 hover:border-sky-200 hover:bg-sky-50"
            }`}
          >
            Semua HS Code
          </button>
        </div>
      </div>

      {/* Keterangan kolom dokumen pabean */}
      <p className="text-xs text-zinc-500">
        Kolom <span className="font-medium text-zinc-700">Dok</span> menunjukkan kode dokumen pabean yang dipersyaratkan (misal: 20 = PIB, 40 = PEB).
      </p>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="max-h-[34rem] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">No</th>
                <th className="px-4 py-3 font-medium">HS Code</th>
                {docCodes.map((docCode) => (
                  <th key={`head-${docCode}`} className="px-4 py-3 font-medium">
                    Dok {docCode}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((item) => {
                return (
                  <tr key={`${item.referenceNo}-${item.hsCode}`} className="border-t border-zinc-100 text-zinc-700">
                    <td className="px-4 py-3">{item.referenceNo}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{formatHsCode(String(item.hsCode))}</td>
                    {docCodes.map((docCode) => {
                      const cellDetails = item.detailsByDocCode.get(docCode) || [];

                      return (
                        <td key={`${item.referenceNo}-${docCode}`} className="px-4 py-3">
                          {cellDetails.length > 0 ? (
                            <button
                              type="button"
                              title="Klik untuk lihat detail regulasi"
                              onClick={() =>
                                setActiveCell({
                                  referenceNo: item.referenceNo,
                                  hsCode: item.hsCode,
                                  docCode,
                                  details: cellDetails,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-full border border-cyan-700 bg-gradient-to-r from-sky-900 to-cyan-700 px-2.5 py-1 text-xs font-medium text-white transition hover:from-sky-800 hover:to-cyan-600"
                            >
                              Ada ({cellDetails.length}) ↗
                            </button>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {displayedRows.length === 0 ? (
                <tr className="border-t border-zinc-100 text-zinc-600">
                  <td className="px-4 py-4" colSpan={docCodes.length + 2}>
                    Tidak ada HS code yang terkena LARTAS.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      {activeCell ? <LartasDocModal cell={activeCell} onClose={() => setActiveCell(null)} /> : null}
    </div>
  );
}

/**
 * Builds matrix rows from HS code result rows, grouping LARTAS details by document code.
 * @param {object[]} rows
 * @returns {Array<{ referenceNo: number, hsCode: string, hasLartas: boolean, detailsByDocCode: Map<string, object[]> }>}
 */
function buildMatrixRows(rows) {
  return rows.map((row, idx) => {
    const details = extractSectionDetails(row);
    const detailsByDocCode = new Map();

    for (const detail of details) {
      const docCodes = Array.isArray(detail.dokumenPabean) ? detail.dokumenPabean : [];

      for (const docCode of docCodes) {
        const normalizedCode = String(docCode);
        const existing = detailsByDocCode.get(normalizedCode) || [];
        existing.push(detail);
        detailsByDocCode.set(normalizedCode, existing);
      }
    }

    return {
      referenceNo: idx + 1,
      hsCode: row.hsCode,
      hasLartas: details.length > 0,
      detailsByDocCode,
    };
  });
}

/**
 * Collects all unique document codes from matrix rows, sorted numerically then alphabetically.
 * @param {Array<{ detailsByDocCode: Map<string, object[]> }>} matrixRows
 * @returns {string[]}
 */
function collectDocumentCodes(matrixRows) {
  const set = new Set();

  for (const row of matrixRows) {
    for (const code of row.detailsByDocCode.keys()) {
      set.add(String(code));
    }
  }

  return Array.from(set).sort((a, b) => {
    const aNum = Number(a);
    const bNum = Number(b);
    if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
      return aNum - bNum;
    }
    return a.localeCompare(b);
  });
}

/**
 * Extracts all LARTAS detail entries from a row, tagging each with its section category.
 * @param {object} row
 * @returns {Array<object & { category: string }>}
 */
function extractSectionDetails(row) {
  const sections = [
    { category: "Impor Border", details: row.lartasBorderDetails || [] },
    { category: "Impor Post Border", details: row.lartasPostBorderDetails || [] },
    { category: "Ekspor Border", details: row.lartasExportDetails || [] },
  ];
  const result = [];

  for (const section of sections) {
    for (const detail of section.details) {
      result.push({
        ...detail,
        category: section.category,
      });
    }
  }

  return result;
}

/**
 * Extracts valid 8-digit HS codes from a 2D array of file data.
 * @param {Array<Array>} fileData - 2D array from Excel
 * @returns {string[]} Array of valid HS codes
 */
function extractValidHsCodes(fileData) {
  return fileData
    .filter((row) => row.length !== 0)
    .flatMap((row) => row.filter((cell) => isValidHsCode(cell)))
    .map(String);
}

/**
 * LartasResultTable Component
 * Presentation Layer - Feature-specific component
 *
 * @description Displays HS lookup result with tariff and LARTAS details.
 * Shows a preview table when only fileData is available, or the full LARTAS
 * matrix when resultData is present.
 *
 * @param {{ fileData: Array<Array> | null, resultData: object[] | null, viewMode: string, setViewMode: (mode: string) => void }} props
 */
export default function LartasResultTable({ fileData, resultData, viewMode = "lartas", setViewMode = () => {} }) {
  if (Array.isArray(resultData) && resultData.length > 0) {
    return <LartasMatrixTable rows={resultData} viewMode={viewMode} setViewMode={setViewMode} />;
  }

  if (!fileData) {
    return <Alert message="Masukkan file terlebih dahulu" />;
  }

  const rows = extractValidHsCodes(fileData);

  if (rows.length === 0) {
    return <Alert message="Opps Tidak ada data HS Code yang ditemukan" variant="warning" />;
  }

  return (
    <div className="space-y-4 overflow-x-hidden">
      <Alert message="File terdeteksi. Klik 'Tarik Data' untuk melihat informasi LARTAS." />
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="max-h-80 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">No</th>
                <th className="px-4 py-3 font-medium">HS Code</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((code, idx) => (
                <tr key={`${code}-${idx}`} className="border-t border-zinc-100 text-zinc-700">
                  <td className="px-4 py-3">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{formatHsCode(String(code))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
