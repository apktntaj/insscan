"use client";

import { useCekLartasFile } from "../../../../presentation/hooks/useCekLartasFile";
import ProgressPanel from "./ProgressPanel";
import Alert from "../../common/Alert";
import Button from "../../common/Button";
import Input from "../../common/Input";
import LartasResultTable from "../LartasResultTable";

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
    handleFileChange,
    handleFetch,
    handleExportResult,
  } = useCekLartasFile();

  const alertVariant = resolveAlertVariant(status);

  return (
    <div className="space-y-6">
      {/* Input card */}
      <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Input File</p>
            <Input handleChange={handleFileChange} className="max-w-2xl" />
            <p className="text-xs leading-6 text-zinc-500 sm:text-sm">
              Gunakan file{" "}
              <span className="font-medium text-zinc-700">.xls / .xlsx</span>{" "}
              berisi HS code 8 digit.
            </p>
          </div>
          <div className="flex min-w-0 w-full flex-col items-start gap-3 lg:w-auto lg:justify-self-end lg:items-end">
            <Button
              onClick={handleFetch}
              disabled={isLoading || !fileData}
              className="w-full px-6 sm:w-auto !border-cyan-700 !bg-gradient-to-r !from-sky-900 !to-cyan-700 hover:!from-sky-800 hover:!to-cyan-600"
            >
              {isLoading ? "Loading..." : "Tarik Data"}
            </Button>
            <Button
              onClick={handleExportResult}
              disabled={!resultData || resultData.length === 0}
              variant="secondary"
              className="w-full px-6 sm:w-auto !border-sky-200 hover:!bg-sky-50"
            >
              Ekspor Hasil
            </Button>
          </div>
        </div>

        {/* Status Alert */}
        {status ? (
          <div className="mt-4">
            <Alert message={status} variant={alertVariant} />
          </div>
        ) : null}
      </div>

      {/* Progress panel — shown when progress.total > 0 */}
      {progress.total > 0 ? (
        <ProgressPanel progress={progress} isLoading={isLoading} />
      ) : null}

      {/* Results table */}
      <LartasResultTable fileData={fileData} resultData={resultData} />
    </div>
  );
}
