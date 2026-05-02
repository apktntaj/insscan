"use client";

import { useState } from "react";
import { formatHsCode } from "../../../../core/entities/hs-code";

/**
 * Resolves clickable links from a LARTAS detail object.
 * Priority: detail.links array > detail.link string > Google search by noSkep.
 *
 * @param {import('../../../../adapters/presenters/hs-code.presenter').LartasDetail} detail
 * @returns {string[]}
 */
function resolveDetailLinks(detail) {
    if (Array.isArray(detail.links) && detail.links.length > 0) {
        return detail.links;
    }

    if (detail.link) {
        return [detail.link];
    }

    if (!detail.noSkep) {
        return [];
    }

    return [`https://www.google.com/search?q=${encodeURIComponent(detail.noSkep)}`];
}

/**
 * Displays a single import/export flag with its active status.
 *
 * @param {{ label: string, active: boolean }} props
 */
function InfoBadge({ label, active }) {
    return (
        <div className="rounded-xl border border-sky-100 bg-sky-50/40 px-3 py-2 text-sm">
            <span className="font-medium text-zinc-900">{label}</span>
            <span className={`ml-2 text-xs ${active ? "text-cyan-700 font-medium" : "text-zinc-400"}`}>
                {active ? "Ada" : "Tidak Ada"}
            </span>
        </div>
    );
}

/**
 * Displays a section of LARTAS details (border, post-border, or export).
 *
 * @param {{ label: string, details: import('../../../../adapters/presenters/hs-code.presenter').LartasDetail[] }} props
 */
function LartasSectionCard({ label, details }) {
    return (
        <div className="rounded-2xl border border-sky-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">{label}</p>
            {details.length === 0 ? (
                <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-500">Tidak ada data.</p>
            ) : (
                <div className="mt-3 space-y-2">
                    {details.map((detail, idx) => (
                        <div
                            key={`${label}-${detail.idDokumen || idx}`}
                            className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700"
                        >
                            <p className="font-medium text-zinc-900">{detail.namaIzin || "-"}</p>
                            <p className="mt-1">No SKEP: {detail.noSkep || "-"}</p>
                            <p className="mt-1">
                                Dok Pabean: {(detail.dokumenPabean || []).join(", ") || "-"}
                            </p>
                            {resolveDetailLinks(detail).length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {resolveDetailLinks(detail)
                                        .slice(0, 3)
                                        .map((url, linkIdx) => (
                                            <a
                                                key={`${label}-${idx}-link-${linkIdx}`}
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
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Card displaying the full LARTAS result for a single HS code lookup.
 * Includes copy-to-clipboard and Excel export actions.
 *
 * @param {{
 *   row: import('../../../../adapters/presenters/hs-code.presenter').LartasResult,
 *   onCopy: () => Promise<void>,
 *   onExport: () => void
 * }} props
 */
export default function SingleResultCard({ row, onCopy, onExport }) {
    const [isCopied, setIsCopied] = useState(false);

    const borderDetails = row.lartasBorderDetails || [];
    const postBorderDetails = row.lartasPostBorderDetails || [];
    const exportDetails = row.lartasExportDetails || [];
    const hasLartas =
        borderDetails.length > 0 ||
        postBorderDetails.length > 0 ||
        exportDetails.length > 0;

    const handleCopyClick = async () => {
        await onCopy();
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">HS Code</p>
                    <h3 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
                        {formatHsCode(String(row.hsCode))}
                    </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                            hasLartas
                                ? "border-cyan-700 bg-gradient-to-r from-sky-900 to-cyan-700 text-white"
                                : "border-zinc-300 text-zinc-500"
                        }`}
                    >
                        {hasLartas ? "LARTAS Ada" : "LARTAS Tidak Ada"}
                    </span>

                    <button
                        type="button"
                        onClick={handleCopyClick}
                        className="rounded-full border border-cyan-700 bg-gradient-to-r from-sky-900 to-cyan-700 px-3 py-1.5 text-xs font-medium text-white transition hover:from-sky-800 hover:to-cyan-600"
                    >
                        {isCopied ? "Tersalin!" : "Salin HS Code"}
                    </button>

                    <button
                        type="button"
                        onClick={onExport}
                        className="rounded-full border border-sky-200 px-3 py-1.5 text-xs font-medium text-cyan-700 transition hover:bg-sky-50"
                    >
                        Ekspor ke Excel
                    </button>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoBadge label="Import" active={row.hasLartasImport} />
                <InfoBadge label="Border" active={row.hasLartasBorder} />
                <InfoBadge label="Post Border" active={row.hasLartasPostBorder} />
                <InfoBadge label="Export" active={row.hasLartasExport} />
            </div>

            {!hasLartas ? (
                <p className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                    Tidak ada detail LARTAS untuk HS code ini.
                </p>
            ) : (
                <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <LartasSectionCard label="Impor Border" details={borderDetails} />
                        <LartasSectionCard label="Impor Post Border" details={postBorderDetails} />
                    </div>
                    <LartasSectionCard label="Ekspor Border" details={exportDetails} />
                </div>
            )}
        </div>
    );
}
