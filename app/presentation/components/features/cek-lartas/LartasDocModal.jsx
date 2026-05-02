"use client";

import { useMemo } from "react";
import { formatHsCode } from "../../../../core/entities/hs-code";

/**
 * @param {{ 
 *   cell: { referenceNo: number, hsCode: string, docCode: string, details: LartasDetail[] }, 
 *   onClose: () => void 
 * }} props
 */
export default function LartasDocModal({ cell, onClose }) {
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
            <div key={group.category} className="rounded-2xl border border-sky-100 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">{group.category}</p>
              <div className="mt-3 space-y-3">
                {group.items.map((detail, idx) => {
                  const links = resolveRegulationLinks(detail);
                  return (
                    <div key={`${group.category}-${detail.idDokumen || idx}`} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700">
                      {/* Baris utama: nama izin + masa berlaku */}
                      <p className="text-base font-semibold text-zinc-900">{detail.namaIzin || "Nama izin tidak tersedia"}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Berlaku: <span className="font-medium text-zinc-700">{formatDate(detail.tanggalMulai)}</span>
                        {" "}s/d{" "}
                        <span className="font-medium text-zinc-700">{formatDate(detail.tanggalAkhir)}</span>
                      </p>
                      {/* Detail sekunder */}
                      <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-zinc-600 sm:grid-cols-2">
                        <p><span className="text-zinc-400">No SKEP</span> — {detail.noSkep || "-"}</p>
                        <p><span className="text-zinc-400">ID Dokumen</span> — {detail.idDokumen || "-"}</p>
                        <p className="sm:col-span-2">
                          <span className="text-zinc-400">Dok Pabean</span> — {(detail.dokumenPabean || []).join(", ") || "-"}
                        </p>
                      </div>
                      {links.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {links.slice(0, 3).map((url, linkIdx) => (
                            <a
                              key={`${group.category}-${idx}-link-${linkIdx}`}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-sky-200 px-2.5 py-1 text-xs font-medium text-cyan-700 transition hover:bg-sky-50"
                            >
                              Lihat PDF {linkIdx + 1} ↗
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
