"use client";

import { useCekLartasFile } from "@/app/features/cek-lartas/presentation/hooks/useCekLartasFile";
import ProgressPanel from "@/app/features/cek-lartas/presentation/components/cek-lartas/ProgressPanel";
import Alert from "@/app/shared/components/Alert";
import Button from "@/app/shared/components/Button";
import Input from "@/app/shared/components/Input";
import LartasResultTable from "@/app/features/cek-lartas/presentation/components/LartasResultTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

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
    sheetCount,
    selectedFileName,
    resultData,
    status,
    isLoading,
    progress,
    viewMode,
    setViewMode,
    handleFileChange,
    handleFetch,
    handleExportResult,
  } = useCekLartasFile();

  const alertVariant = resolveAlertVariant(status);

  const hasResult = resultData && resultData.length > 0;
  const buttonLabel = hasResult 
    ? `Ekspor ${viewMode === "lartas" ? "LARTAS" : "Semua"}`
    : "Tarik Data";
  
  const buttonAction = hasResult ? handleExportResult : handleFetch;
  const buttonDisabled = isLoading || (!fileData && !hasResult);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload invoice Excel</CardTitle>
          <CardDescription>Format .xls atau .xlsx, dapat memuat beberapa sheet.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <Input
                handleChange={handleFileChange}
                className="w-full"
                ariaLabel="Unggah file Excel (.xls, .xlsx)"
                selectedFileName={selectedFileName}
                placeholder="Pilih invoice untuk mulai"
              />
            </div>
            <Button
              onClick={buttonAction}
              disabled={buttonDisabled}
              variant={hasResult ? "secondary" : "primary"}
              className="w-full shrink-0 sm:w-auto"
            >
              {isLoading ? <Spinner data-icon="inline-start" /> : null}
              {buttonLabel}
            </Button>
          </div>
          {hasResult ? (
            <p className="text-xs leading-6 text-muted-foreground">Pilih file lain untuk memulai pemeriksaan baru. Hasil saat ini tetap dapat diekspor sebelum diganti.</p>
          ) : null}

          {status ? (
              <Alert
                message={
                  alertVariant === "warning"
                    ? `${status} Data yang sudah berhasil diambil tetap bisa diekspor.`
                    : status
                }
                variant={alertVariant}
              />
          ) : null}
        </CardContent>
      </Card>

      {/* Progress panel */}
      {progress.total > 0 ? (
        <ProgressPanel progress={progress} isLoading={isLoading} />
      ) : null}

      {/* Results table */}
      {(fileData || hasResult) ? <LartasResultTable fileData={fileData} sheetCount={sheetCount} resultData={resultData} viewMode={viewMode} setViewMode={setViewMode} /> : null}
    </div>
  );
}
