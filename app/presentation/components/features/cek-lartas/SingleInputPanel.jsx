"use client";

import { useCekLartasSingle } from "../../../../presentation/hooks/useCekLartasSingle";
import SingleResultCard from "./SingleResultCard";
import Alert from "../../common/Alert";
import Button from "../../common/Button";

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
  } = useCekLartasSingle();

  const alertVariant = resolveAlertVariant(singleStatus);

  return (
    <div className="space-y-6">
      {/* Input card */}
      <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Input Tunggal</p>
            <input
              type="text"
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFetch(); }}
              placeholder="Contoh: 84713090"
              className="block w-full max-w-2xl rounded-xl border border-sky-100 bg-sky-50/40 px-3 py-2 text-sm text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
            <p className="text-xs leading-6 text-zinc-500 sm:text-sm">
              Masukkan satu HS code 8 digit untuk tampilan hasil berbentuk card.
            </p>
          </div>
          <div className="flex min-w-0 w-full flex-col items-start gap-3 lg:w-auto lg:justify-self-end lg:items-end">
            <Button onClick={handleFetch} disabled={isSingleLoading} className="w-full px-6 sm:w-auto !border-cyan-700 !bg-gradient-to-r !from-sky-900 !to-cyan-700 hover:!from-sky-800 hover:!to-cyan-600">
              {isSingleLoading ? "Loading..." : "Cari HS Code"}
            </Button>
          </div>
        </div>

        {/* Status Alert — shown when singleStatus is not empty */}
        {singleStatus ? (
          <div className="mt-4">
            <Alert message={singleStatus} variant={alertVariant} />
          </div>
        ) : null}
      </div>

      {/* Result card — shown when singleResult is not null */}
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
