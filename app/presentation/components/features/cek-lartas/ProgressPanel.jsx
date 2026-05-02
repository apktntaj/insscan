"use client";

import { formatHsCode } from "../../../../core/entities/hs-code";

/**
 * Hitung persentase 0-100, aman untuk total = 0.
 * @param {number} current
 * @param {number} total
 * @returns {number}
 * @example calcPercent(45, 100) // => 45
 * @example calcPercent(0, 0)    // => 0
 */
function calcPercent(current, total) {
  if (total <= 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

function labelMode(mode) {
  if (mode === "fetched") return "diambil dari INSW";
  if (mode === "cached") return "cache internal";
  if (mode === "invalid") return "invalid";
  if (mode === "error") return "gagal";
  return "diproses";
}

/**
 * Format ms ke "MM:SS".
 * @param {number | null} value
 * @returns {string}
 * @example formatDuration(90000) // => "01:30"
 * @example formatDuration(null)  // => "-"
 */
function formatDuration(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  const totalSeconds = Math.max(Math.round(value / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Format ETA ke jam lokal "HH:MM:SS".
 * @param {number | null} startedAt
 * @param {number | null} etaTotalMs
 * @returns {string}
 * @example formatEtaClock(Date.now(), 60000) // => "HH:MM:SS" (1 minute from now)
 * @example formatEtaClock(null, null)        // => "-"
 */
function formatEtaClock(startedAt, etaTotalMs) {
  if (!startedAt || typeof etaTotalMs !== "number" || Number.isNaN(etaTotalMs)) {
    return "-";
  }

  const etaDate = new Date(startedAt + etaTotalMs);
  return etaDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format delta ke "+MM:SS" / "-MM:SS" / "tepat sesuai ETA".
 * @param {number | null} deltaMs
 * @returns {string}
 * @example formatDelta(30000)  // => "+00:30"
 * @example formatDelta(-15000) // => "-00:15"
 * @example formatDelta(0)      // => "tepat sesuai ETA"
 */
function formatDelta(deltaMs) {
  if (typeof deltaMs !== "number" || Number.isNaN(deltaMs)) {
    return "-";
  }

  if (deltaMs === 0) {
    return "tepat sesuai ETA";
  }

  const sign = deltaMs > 0 ? "+" : "-";
  return `${sign}${formatDuration(Math.abs(deltaMs))}`;
}

/**
 * Panel progres streaming mode File.
 * Komponen murni — tidak ada state internal, hanya menerima props.
 *
 * @param {{ progress: import('../../../../presentation/hooks/useCekLartasFile').ProgressState, isLoading: boolean }} props
 * @returns {JSX.Element}
 *
 * @example
 * // progress.current = 45, progress.total = 100, isLoading = true
 * // → progress bar 45%, teks "45 dari 100 HS code", ETA ditampilkan
 *
 * @example
 * // progress.current = 100, progress.total = 100, isLoading = false, progress.actualDurationMs = 120000
 * // → progress bar 100%, ringkasan: "Durasi aktual: 02:00", delta ETA ditampilkan
 */
export default function ProgressPanel({ progress, isLoading }) {
  const percent = calcPercent(progress.current, progress.total);

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Proses Fetch</p>
        <p className="text-sm font-medium text-zinc-700">
          {progress.current}/{progress.total}
        </p>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sky-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-900 to-cyan-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-right text-xs font-medium text-zinc-700">{percent}%</p>

      <p className="mt-2 break-words text-sm text-zinc-700">
        {progress.currentCode
          ? `HS aktif: ${formatHsCode(String(progress.currentCode))} (${labelMode(progress.currentMode)})`
          : "Menunggu proses dimulai..."}
        {!isLoading && progress.current === progress.total && progress.total > 0 ? " Selesai." : ""}
      </p>

      <div className="mt-2 text-xs text-zinc-500">
        Mode: serial adaptive chunk (aktif {progress.chunkSize}, maksimum {progress.baseChunkSize})
      </div>

      <div className="mt-3 grid gap-2 text-xs text-zinc-600 sm:grid-cols-2">
        <p>
          Durasi berjalan:{" "}
          <span className="font-medium text-zinc-800">{formatDuration(progress.elapsedMs)}</span>
        </p>
        <p>
          ETA selesai:{" "}
          <span className="font-medium text-zinc-800">
            {formatEtaClock(progress.startedAt, progress.etaTotalMs)}
          </span>
        </p>
        <p className="sm:col-span-2">
          Sisa estimasi:{" "}
          <span className="font-medium text-zinc-800">
            {formatDuration(progress.etaRemainingMs)}
          </span>
        </p>
      </div>

      {!isLoading && progress.actualDurationMs !== null ? (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
          <p>
            Durasi aktual:{" "}
            <span className="font-medium text-zinc-900">{formatDuration(progress.actualDurationMs)}</span>
          </p>
          <p className="mt-1">
            ETA referensi:{" "}
            <span className="font-medium text-zinc-900">{formatDuration(progress.etaReferenceMs)}</span>
          </p>
          <p className="mt-1">
            Selisih aktual vs ETA:{" "}
            <span className="font-medium text-zinc-900">{formatDelta(progress.etaDeltaMs)}</span>
          </p>
        </div>
      ) : null}

      <div className="mt-3 max-h-36 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        {progress.logs.length === 0 ? (
          <p className="text-xs text-zinc-500">Belum ada log proses.</p>
        ) : (
          progress.logs.map((log, idx) => (
            <p key={`${log}-${idx}`} className="break-words text-xs text-zinc-600">
              {log}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
