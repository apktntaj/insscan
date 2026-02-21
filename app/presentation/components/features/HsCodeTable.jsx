"use client";

import React, { useMemo, useState } from "react";
import Alert from "../common/Alert";
import { formatHsCode, isValidHsCode } from "../../../core/entities/hs-code";

/**
 * HsCodeTable Component
 * Presentation Layer - Feature-specific component
 *
 * @description Displays HS lookup result with tariff and LARTAS details
 */
export default function HsCodeTable({ fileData, resultData }) {
  if (Array.isArray(resultData) && resultData.length > 0) {
    return <LartasResultTable rows={resultData} />;
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

function LartasResultTable({ rows }) {
  const [viewMode, setViewMode] = useState("lartas");
  const [activeCell, setActiveCell] = useState(null);
  const matrixRows = useMemo(() => buildMatrixRows(rows), [rows]);
  const docCodes = useMemo(() => collectDocumentCodes(matrixRows), [matrixRows]);
  const displayedRows = useMemo(
    () => matrixRows.filter((item) => (viewMode === "all" ? true : item.hasLartas)),
    [matrixRows, viewMode]
  );

  return (
    <div className="space-y-4 overflow-x-hidden">
      <Alert message="Matriks LARTAS per dokumen pabean. Klik sel 'Ada' untuk melihat detail regulasi per dokumen." />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setViewMode("lartas")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            viewMode === "lartas" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-700"
          }`}
        >
          LARTAS Only
        </button>
        <button
          type="button"
          onClick={() => setViewMode("all")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            viewMode === "all" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-700"
          }`}
        >
          All
        </button>
      </div>
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
                              onClick={() =>
                                setActiveCell({
                                  referenceNo: item.referenceNo,
                                  hsCode: item.hsCode,
                                  docCode,
                                  details: cellDetails,
                                })
                              }
                              className="rounded-full border border-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100"
                            >
                              Ada ({cellDetails.length})
                            </button>
                          ) : (
                            <span className="text-zinc-400">-</span>
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
                    Tidak ada data untuk filter ini.
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

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("id-ID");
}

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

function resolveRegulationLinks(item) {
  if (Array.isArray(item.links) && item.links.length > 0) {
    return item.links;
  }

  if (item.link) {
    return [item.link];
  }

  if (!item.noSkep) {
    return [];
  }

  return [`https://www.google.com/search?q=${encodeURIComponent(item.noSkep)}`];
}

function LartasDocModal({ cell, onClose }) {
  const grouped = useMemo(() => groupByCategory(cell.details), [cell.details]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-zinc-500">
              Ref #{cell.referenceNo} | HS {formatHsCode(String(cell.hsCode))}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">Dokumen Pabean {cell.docCode}</h3>
          </div>
          <button
            type="button"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>

        <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-1">
          {grouped.map((group) => (
            <div key={group.category} className="rounded-2xl border border-zinc-200 p-4 sm:p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">{group.category}</p>
              <div className="mt-3 space-y-3">
                {group.items.map((detail, idx) => {
                  const links = resolveRegulationLinks(detail);
                  return (
                    <div key={`${group.category}-${detail.idDokumen || idx}`} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                      <p>
                        <span className="font-medium text-zinc-900">Nama Izin:</span> {detail.namaIzin || "-"}
                      </p>
                      <p className="mt-1">
                        <span className="font-medium text-zinc-900">No SKEP:</span> {detail.noSkep || "-"}
                      </p>
                      <p className="mt-1">
                        <span className="font-medium text-zinc-900">ID Dokumen:</span> {detail.idDokumen || "-"}
                      </p>
                      <p className="mt-1">
                        <span className="font-medium text-zinc-900">Masa Berlaku:</span> {formatDate(detail.tanggalMulai)} -{" "}
                        {formatDate(detail.tanggalAkhir)}
                      </p>
                      <p className="mt-1">
                        <span className="font-medium text-zinc-900">Dok Pabean:</span> {(detail.dokumenPabean || []).join(", ") || "-"}
                      </p>
                      {links.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {links.slice(0, 3).map((url, linkIdx) => (
                            <a
                              key={`${group.category}-${idx}-link-${linkIdx}`}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100"
                            >
                              PDF {linkIdx + 1}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function groupByCategory(details) {
  const map = new Map();

  for (const detail of details) {
    const key = detail.category || "Lainnya";
    const existing = map.get(key) || [];
    existing.push(detail);
    map.set(key, existing);
  }

  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

/**
 * Extracts valid HS codes from file data
 * @param {Array<Array>} fileData - 2D array from Excel
 * @returns {string[]} Array of valid HS codes
 */
function extractValidHsCodes(fileData) {
  return fileData
    .filter((row) => row.length !== 0)
    .flatMap((row) => row.filter((cell) => isValidHsCode(cell)))
    .map(String);
}
