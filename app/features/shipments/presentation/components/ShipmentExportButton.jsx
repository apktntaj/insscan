"use client";

/**
 * ShipmentExportButton Component
 * Presentation Layer — Feature component
 *
 * @description Export button with confirmation modal. Warns that all records will be
 * permanently deleted after export. Calls exportShipments on confirmation.
 */

import React, { useState } from "react";
import { CircleAlertIcon, DownloadIcon, TriangleAlertIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * @param {{
 *   onExport: () => Promise<{ok: boolean, error?: Object}>,
 *   disabled?: boolean,
 * }} props
 */
export default function ShipmentExportButton({ onExport, disabled = false }) {
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  async function handleConfirm() {
    setExporting(true);
    setExportError(null);
    const result = await onExport();
    setExporting(false);

    if (result.ok) {
      setShowModal(false);
    } else {
      setExportError(result.error?.message || "Ekspor gagal. Data shipment belum dihapus.");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => { setExportError(null); setShowModal(true); }}
        disabled={disabled}
      >
        <DownloadIcon data-icon="inline-start" />
        Ekspor Excel
      </Button>

      <AlertDialog open={showModal} onOpenChange={(open) => { if (!exporting) setShowModal(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia><TriangleAlertIcon /></AlertDialogMedia>
            <AlertDialogTitle>Ekspor dan hapus semua data?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua shipment akan diekspor ke Excel lalu dihapus permanen dari browser. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
            {exportError && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>{exportError}</AlertDescription>
              </Alert>
            )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={exporting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={exporting}>
              {exporting ? <Spinner data-icon="inline-start" /> : <DownloadIcon data-icon="inline-start" />}
              {exporting ? "Mengekspor…" : "Ekspor & hapus semua"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
