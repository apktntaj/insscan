"use client";

/**
 * ShipmentManager Component
 * Presentation Layer — Root feature component
 *
 * @description Top-level component for the Shipment Management feature.
 * Renders the record counter, limit warning, table, form modal, and export button.
 * Initialises browser notification scheduling on mount.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useShipments } from "@/app/features/shipments/presentation/hooks/useShipments";
import { useDashboard } from "@/app/features/shipments/presentation/hooks/useDashboard";
import ShipmentTable from "@/app/features/shipments/presentation/components/ShipmentTable";
import ShipmentForm from "@/app/features/shipments/presentation/components/ShipmentForm";
import ShipmentExportButton from "@/app/features/shipments/presentation/components/ShipmentExportButton";
import DashboardSection from "@/app/features/shipments/presentation/components/DashboardSection";
import { shipmentController } from "@/app/features/shipments/adapters/controllers/shipment.controller";
import { MAX_RECORD_LIMIT } from "@core/shipments/use-cases/create-shipment";
import { BellIcon, CheckCircle2Icon, PlusIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ShipmentManager() {
  const {
    shipments,
    count,
    loading,
    error,
    query,
    setQuery,
    refresh,
    lastRefreshedAt,
    createShipment,
    editShipment,
    terminateShipment,
    exportShipments,
  } = useShipments();

  const { alertsByShipmentId } = useDashboard({ shipments, loading, refresh });

  const [modeSelectorOpen, setModeSelectorOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [inAppNotification, setInAppNotification] = useState(null);

  // Start notification polling on mount
  useEffect(() => {
    // Re-create controller with fallback notification callback
    // The singleton already handles this; we just start polling
    shipmentController.startNotifications();
    return () => shipmentController.stopNotifications();
  }, []);

  function showSuccess(msg) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  }

  function handleOpenCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function handleSelectMode(mode) {
    setFormOpen(true);
  }

  function handleOpenEdit(shipment) {
    setEditTarget(shipment);
    setFormOpen(true);
  }

  const handleFormSubmit = useCallback(
    async (data) => {
      if (editTarget) {
        const result = await editShipment(editTarget.id, data);
        if (result.ok) showSuccess("Perubahan shipment tersimpan.");
        return result;
      } else {
        const result = await createShipment(data);
        if (result.ok) showSuccess("Shipment baru berhasil dibuat.");
        return result;
      }
    },
    [editTarget, createShipment, editShipment]
  );

  const handleTerminate = useCallback(
    async (id) => {
      const result = await terminateShipment(id);
      if (result.ok) showSuccess("Shipment berhasil dihapus.");
      else setSuccessMessage(null);
    },
    [terminateShipment]
  );

  const handleExport = useCallback(async () => {
    const result = await exportShipments();
    if (result.ok) showSuccess("Ekspor selesai. Semua data aktif telah dihapus.");
    return result;
  }, [exportShipments]);

  const atLimit = count >= MAX_RECORD_LIMIT;
  const nearLimit = count >= MAX_RECORD_LIMIT * 0.9 && !atLimit;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="secondary">Workspace PPJK</Badge>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Shipment</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Pantau ETA, kelengkapan data, dan pekerjaan shipment dari satu tempat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Record counter badge */}
          <Badge variant={atLimit ? "destructive" : nearLimit ? "secondary" : "outline"}>
            {count}/{MAX_RECORD_LIMIT} data tersimpan
          </Badge>

          <ShipmentExportButton onExport={handleExport} disabled={count === 0} />

          <Button
            type="button"
            onClick={handleOpenCreate}
            disabled={atLimit}
          >
            <PlusIcon data-icon="inline-start" />
            Shipment baru
          </Button>
        </div>
      </div>

      {/* Limit warning banner */}
      {atLimit && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Batas {MAX_RECORD_LIMIT} data tercapai</AlertTitle>
          <AlertDescription>Ekspor data ke Excel sebelum menambahkan shipment baru.</AlertDescription>
        </Alert>
      )}

      {nearLimit && (
        <Alert>
          <TriangleAlertIcon />
          <AlertTitle>Penyimpanan hampir penuh</AlertTitle>
          <AlertDescription>Pertimbangkan untuk mengekspor data shipment segera.</AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {successMessage && (
        <Alert>
          <CheckCircle2Icon />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* In-app notification fallback */}
      {inAppNotification && (
        <Alert>
          <BellIcon />
          <AlertDescription>{inAppNotification}</AlertDescription>
          <AlertAction>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setInAppNotification(null)}>
              <XIcon /><span className="sr-only">Tutup notifikasi</span>
            </Button>
          </AlertAction>
        </Alert>
      )}

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Data shipment gagal dimuat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard section */}
      <DashboardSection
        shipments={shipments}
        loading={loading}
        refresh={refresh}
        lastRefreshedAt={lastRefreshedAt}
        onEditShipment={handleOpenEdit}
      />

      {/* Shipment table */}
      <ShipmentTable
        shipments={shipments}
        loading={loading}
        query={query}
        onQueryChange={setQuery}
        onEdit={handleOpenEdit}
        onTerminate={handleTerminate}
        alertsByShipmentId={alertsByShipmentId}
      />

      {/* Create / Edit form modal */}
      {editTarget ? (
        <ShipmentForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editTarget}
          isEditMode={true}
        />
      ) : (
        <ShipmentForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}
