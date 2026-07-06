"use client";

import { useCekLartasSingle } from "../../../../presentation/hooks/useCekLartasSingle";
import SingleResultCard from "./SingleResultCard";
import Alert from "../../common/Alert";
import Button from "../../common/Button";
import PaywallBanner from "./PaywallBanner";

/**
 * Resolves the Alert variant from a status string.
 *
 * @param {string} status
 * @returns {"success" | "error" | "warning" | "info"}
 */
function resolveAlertVariant(status) {
  if (!status) return "info";
  const lower = status.toLowerCase();
  if (lower.includes("berhasil") || lower.includes("disalin")) return "success";
  if (lower.includes("gagal") || lower.includes("tidak") || lower.includes("harus")) return "error";
  return "warning";
}

/**
 * Panel for Single Input mode of Cek Lartas.
 * Delegates all state and actions to useCekLartasSingle.
 */
export default function SingleInputPanel() {
  const {
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
    activateKey,
  } = useCekLartasSingle();

  const alertVariant = resolveAlertVariant(singleStatus);

  return (
    <div className="space-y-4">
      {/* Paywall banner — tampil saat limit tercapai */}
      {isLimitReached ? <PaywallBanner onActivate={activateKey} /> : null}

      {/* Input card */}
      <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mx-auto max-w-2xl space-y-3">
          
          {/* Search input with icon */}
          <div className="relative">
            <input
              type="text"
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFetch(); }}
              placeholder="84713090"
              disabled={isSingleLoading || isLimitReached}
              className="block w-full rounded-xl border border-sky-100 bg-sky-50/40 py-3 pl-4 pr-11 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleFetch}
              disabled={isSingleLoading || isLimitReached}
              className="absolute inset-y-0 right-0 flex items-center pr-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5 text-cyan-600 transition hover:text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          
          <p className="text-center text-xs leading-6 text-zinc-500 sm:text-sm">
            {isSingleLoading
              ? "Sedang mencari..."
              : !isLimitReached
              ? `Sisa kuota hari ini: ${remaining} query`
              : ""}
          </p>
        </div>

        {/* Status Alert */}
        {singleStatus ? (
          <div className="mt-4">
            <Alert message={singleStatus} variant={alertVariant} />
          </div>
        ) : null}
      </div>

      {/* Result card */}
      {singleResult ? (
        <SingleResultCard
          row={singleResult}
          onCopy={handleCopy}
          onExport={handleExportSingle}
        />
      ) : null}
    </div>
  );
}
