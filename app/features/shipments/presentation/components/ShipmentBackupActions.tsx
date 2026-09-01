"use client";

import { useRef, useState } from "react";
import { DownloadIcon, FileJsonIcon, MoreHorizontalIcon, UploadIcon } from "lucide-react";
import type { BackupImportPreview, BackupImportResult } from "@core/shipments/use-cases/import-shipment-backup";
import type { UseCaseResult } from "@core/shipments/use-cases/result";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  disabled?: boolean;
  onExportExcel: () => Promise<UseCaseResult<unknown>>;
  onExportBackup: () => Promise<UseCaseResult<unknown>>;
  onInspectBackup: (contents: string) => Promise<UseCaseResult<BackupImportPreview>>;
  onImportBackup: (preview: BackupImportPreview) => Promise<UseCaseResult<BackupImportResult>>;
  onMessage: (message: string, error?: boolean) => void;
  onImported: () => Promise<void>;
}

export default function ShipmentBackupActions({
  disabled,
  onExportExcel,
  onExportBackup,
  onInspectBackup,
  onImportBackup,
  onMessage,
  onImported,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<BackupImportPreview | null>(null);
  const [busy, setBusy] = useState(false);

  async function runExport(kind: "excel" | "backup") {
    setBusy(true);
    const result = await (kind === "excel" ? onExportExcel() : onExportBackup());
    setBusy(false);
    onMessage(
      result.ok
        ? kind === "excel"
          ? "File Excel berhasil diunduh; data tetap tersimpan."
          : "Backup JSON berhasil diunduh."
        : result.error.message,
      !result.ok,
    );
  }

  async function selectFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const result = await onInspectBackup(await file.text());
      if (result.ok) setPreview(result.data);
      else onMessage(result.error.message, true);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "File backup gagal dibaca.", true);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function confirmImport() {
    if (!preview) return;
    setBusy(true);
    const result = await onImportBackup(preview);
    setBusy(false);
    setPreview(null);
    if (!result.ok) {
      onMessage(result.error.message, true);
      return;
    }
    await onImported();
    onMessage(`${result.data.imported} shipment dipulihkan; ${result.data.skipped} konflik dilewati.`);
  }

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(event) => void selectFile(event.target.files?.[0])}
      />
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button type="button" variant="outline" disabled={busy} />}>
          <MoreHorizontalIcon data-icon="inline-start" />
          Backup & ekspor
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem disabled={disabled || busy} onClick={() => void runExport("excel")}>
              <DownloadIcon /> Unduh Excel
            </DropdownMenuItem>
            <DropdownMenuItem disabled={disabled || busy} onClick={() => void runExport("backup")}>
              <FileJsonIcon /> Unduh backup JSON
            </DropdownMenuItem>
            <DropdownMenuItem disabled={busy} onClick={() => fileInput.current?.click()}>
              <UploadIcon /> Pulihkan backup JSON
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi pemulihan backup</AlertDialogTitle>
            <AlertDialogDescription>
              {preview
                ? `${preview.total} record diperiksa: ${preview.importable} dapat diimpor dan ${preview.skipped} konflik akan dilewati. Data yang ada tidak ditimpa atau dihapus.`
                : "Periksa file backup sebelum melanjutkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={busy || !preview} onClick={() => void confirmImport()}>
              Pulihkan data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
