"use client";

import { useCekLartasFile } from "../../../../presentation/hooks/useCekLartasFile";
import ProgressPanel from "./ProgressPanel";
import Alert from "../../common/Alert";
import Button from "../../common/Button";
import Input from "../../common/Input";
import LartasResultTable from "../LartasResultTable";
import PaywallBanner from "./PaywallBanner";

/**
 * Resolve Alert variant based on status message content.
 *
 * @param {string} status
 * @returns {"info" | "success" | "warning" | "error"}
 *
 * @example
 * resolveAlertVariant("Berhasil! 50 data ditampilkan.") // => "success"
 * resolveAlertVariant("Gagal mengambil data.")          // => "error"
 * resolveAlertVariant("Proses berhenti sebelum selesai.") // => "warning"
 * resolveAlertVariant("")                               // => "info"
 */
function resolveAlertVariant(status) {
  if (!status) return "info";
  const lower = status.toLowerCase();
  if (lower.includes("berhasil")) return "success";
  if (lower.includes("parsial") || lower.includes("berhenti")) return "warning";
  if (
    lower.includes("gagal") ||
    lower.includes("error") ||
    lower.includes("harus") ||
    lower.includes("tidak")
  )
    return "error";
  return "info";
}

/**
 * Panel komponen untuk mode File Input pada Cek Lartas.
 * Menggunakan useCekLartasFile untuk semua state dan aksi.
 *
 * @returns {JSX.Element}
 */
export default function FileInputPanel() {
  const {
    fileData,
    resultData,
    status,
    isLoading,
    progress,
    viewMode,
    setViewMode,
    handleFileChange,
    handleFetch,
    handleExportResult,
    remaining,
    isLimitReached,
    activateKey,
  } = useCekLartasFile();

  const alertVariant = resolveAlertVariant(status);

  const hasResult = resultData && resultData.length > 0;
  const canFetch = fileData && !hasResult && !isLoading;
  
  const buttonLabel = hasResult 
    ? `Ekspor ${viewMode === "lartas" ? "LARTAS" : "Semua"}`
    : isLoading 
    ? "Loading..." 
    : "Tarik Data";
  
  const buttonAction = hasResult ? handleExportResult : handleFetch;
  const buttonDisabled = isLoading || (!fileData && !hasResult) || (!hasResult && isLimitReached);

  return (
    <div className="space-y-4">
      {/* Paywall banner — tampil saat limit tercapai */}
      {isLimitReached && !hasResult ? <PaywallBanner onActivate={activateKey} /> : null}

      {/* Input card */}
      <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Input File</p>
            {!isLimitReached ? (
              <p className="text-xs text-zinc-400">Sisa kuota: {remaining} query</p>
            ) : null}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <Input handleChange={handleFileChange} className="w-full" />
            </div>
            <Button
              onClick={buttonAction}
              disabled={buttonDisabled}
              variant={hasResult ? "secondary" : "primary"}
              className={`shrink-0 px-6 ${
                hasResult 
                  ? "!border-sky-200 hover:!bg-sky-50" 
                  : "!border-cyan-700 !bg-gradient-to-r !from-sky-900 !to-cyan-700 hover:!from-sky-800 hover:!to-cyan-600"
              }`}
            >
              {buttonLabel}
            </Button>
          </div>
          
          <p className="text-xs leading-6 text-zinc-500 sm:text-sm">
            Gunakan file{" "}
            <span className="font-medium text-zinc-700">.xls / .xlsx</span>{" "}
            berisi HS code 8 digit.
          </p>
        </div>

        {/* Status Alert */}
        {status ? (
          <div className="mt-4">
            <Alert
              message={
                alertVariant === "warning"
                  ? `${status} Data yang sudah berhasil diambil tetap bisa diekspor.`
                  : status
              }
              variant={alertVariant}
            />
          </div>
        ) : null}
      </div>

      {/* Progress panel */}
      {progress.total > 0 ? (
        <ProgressPanel progress={progress} isLoading={isLoading} />
      ) : null}

      {/* Results table */}
      <LartasResultTable fileData={fileData} resultData={resultData} viewMode={viewMode} setViewMode={setViewMode} />
    </div>
  );
}
