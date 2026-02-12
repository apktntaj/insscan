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
    return <ResultCards rows={resultData} />;
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
      <Alert message="File terdeteksi. Klik 'Tarik Data' untuk melihat tarif dan detail LARTAS." />
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

function ResultCards({ rows }) {
  const [activeRow, setActiveRow] = useState(null);

  const metrics = useMemo(() => {
    const withLartas = rows.filter((row) => getLartasSections(row).length > 0).length;

    return {
      total: rows.length,
      lartasAda: withLartas,
      lartasTidakAda: rows.length - withLartas,
      pajakLengkap: rows.filter(hasAnyTaxData).length,
    };
  }, [rows]);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total HS" value={metrics.total} />
        <MetricCard label="LARTAS Ada" value={metrics.lartasAda} />
        <MetricCard label="LARTAS Tidak Ada" value={metrics.lartasTidakAda} />
        <MetricCard label="Ada Data Pajak" value={metrics.pajakLengkap} />
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
        {rows.map((row, idx) => {
          const sections = getLartasSections(row);
          const hasLartas = sections.length > 0;
          const preview = getLartasPreview(sections);

          return (
            <div
              key={`${row.hsCode}-${idx}`}
              className="min-w-0 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  No {idx + 1}
                </p>
                <p className="min-w-0 break-words text-right text-lg font-semibold tracking-tight text-zinc-900">
                  {formatHsCode(String(row.hsCode))}
                </p>
              </div>

              <div className="mt-5 border-t border-zinc-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">Data Pajak</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <TaxCell label="BM" value={row.bm} />
                  <TaxCell label="PPN" value={row.ppn} />
                  <TaxCell label="PPH" value={row.pph} />
                  <TaxCell label="PPH Non API" value={row.pphNonApi} />
                </div>
              </div>

              <div className="mt-5 border-t border-zinc-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">LARTAS</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-zinc-600">Status:</span>
                  {hasLartas ? (
                    <span className="rounded-full border border-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-900">Ada</span>
                  ) : (
                    <span className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-500">
                      Tidak Ada
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {renderCategoryBadge("Import", row.hasLartasImport)}
                  {renderCategoryBadge("Border", row.hasLartasBorder)}
                  {renderCategoryBadge("Post Border", row.hasLartasPostBorder)}
                  {renderCategoryBadge("Export", row.hasLartasExport)}
                </div>
              </div>

              <div className="mt-5 border-t border-zinc-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">Detail</p>
                {!hasLartas ? (
                  <p className="mt-2 text-sm text-zinc-500">-</p>
                ) : (
                  <>
                    <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-zinc-700">{preview}</p>
                    <button
                      type="button"
                      className="mt-3 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                      onClick={() => setActiveRow({ ...row, index: idx + 1 })}
                    >
                      Selengkapnya
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeRow ? <LartasModal row={activeRow} onClose={() => setActiveRow(null)} /> : null}
    </div>
  );
}

function LartasModal({ row, onClose }) {
  const sections = getLartasSections(row);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <p className="text-sm text-zinc-500">No {row.index}</p>
          <h3 className="mt-1 break-words text-xl font-semibold tracking-tight text-zinc-900">
            HS {formatHsCode(String(row.hsCode))}
          </h3>
        </div>

        <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-1">
          {sections.length === 0 ? (
            <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">Tidak ada detail LARTAS.</p>
          ) : (
            sections.map((section) => (
              <div key={section.label} className="rounded-2xl border border-zinc-200 p-4 sm:p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">{section.label}</p>
                <div className="mt-3 space-y-3">
                  {section.details.map((detail, idx) => (
                    <div
                      key={`${section.label}-${detail.idDokumen || idx}`}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700"
                    >
                      <div className="grid grid-cols-1 gap-2 leading-6 sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-zinc-900">Nama Izin:</span>{" "}
                          <span className="break-words">{detail.namaIzin || "-"}</span>
                        </p>
                        <p>
                          <span className="font-medium text-zinc-900">No SKEP:</span>{" "}
                          <span className="break-words">{detail.noSkep || "-"}</span>
                        </p>
                        <p>
                          <span className="font-medium text-zinc-900">ID Dokumen:</span>{" "}
                          <span className="break-words">{detail.idDokumen || "-"}</span>
                        </p>
                        <p>
                          <span className="font-medium text-zinc-900">Komoditi:</span>{" "}
                          <span className="break-words">{detail.komoditi || "-"}</span>
                        </p>
                        <p className="break-words sm:col-span-2">
                          <span className="font-medium text-zinc-900">Dok Pabean:</span>{" "}
                          {(detail.dokumenPabean || []).join(", ") || "-"}
                        </p>
                        <p className="sm:col-span-2">
                          <span className="font-medium text-zinc-900">Masa Berlaku:</span>{" "}
                          {formatDate(detail.tanggalMulai)} - {formatDate(detail.tanggalAkhir)}
                        </p>
                      </div>

                      {detail.link ? (
                        <a
                          href={detail.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100"
                        >
                          Buka Link Dokumen
                        </a>
                      ) : (
                        <p className="mt-2 text-sm">
                          <span className="font-medium text-zinc-900">Link Dokumen:</span> -
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
    </div>
  );
}

function TaxCell({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-zinc-800">{value || "tidak ada data"}</p>
    </div>
  );
}

function hasAnyTaxData(row) {
  return [row.bm, row.ppn, row.pph, row.pphNonApi].some((item) => {
    const normalized = String(item || "").trim().toLowerCase();
    return normalized && normalized !== "tidak ada data" && normalized !== "-";
  });
}

function getLartasSections(row) {
  return [
    {
      label: "Import",
      details: row.lartasImportDetails || [],
    },
    {
      label: "Border",
      details: row.lartasBorderDetails || [],
    },
    {
      label: "Post Border",
      details: row.lartasPostBorderDetails || [],
    },
    {
      label: "Export",
      details: row.lartasExportDetails || [],
    },
  ].filter((section) => section.details.length > 0);
}

function getLartasPreview(sections) {
  const firstSection = sections[0];
  const firstDetail = firstSection?.details?.[0];

  if (!firstSection || !firstDetail) {
    return "-";
  }

  if (firstDetail.noSkep) {
    return `${firstSection.label}: ${firstDetail.noSkep}`;
  }

  return `${firstSection.label}: ${firstDetail.namaIzin || "Detail tersedia"}`;
}

function renderCategoryBadge(label, isActive) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        isActive ? "border-zinc-900 text-zinc-900" : "border-zinc-300 text-zinc-500"
      }`}
    >
      {label}
    </span>
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
