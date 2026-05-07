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
import { useShipments } from "../../hooks/useShipments";
import { useDashboard } from "../../hooks/useDashboard";
import ShipmentTable from "./ShipmentTable";
import ShipmentForm from "./ShipmentForm";
import ShipmentExportButton from "./ShipmentExportButton";
import DashboardSection from "./DashboardSection";
import { shipmentController } from "../../../adapters/controllers/shipment.controller";
import { MAX_RECORD_LIMIT } from "../../../core/use-cases/create-shipment";

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
        if (result.ok) showSuccess("Shipment updated successfully.");
        return result;
      } else {
        const result = await createShipment(data);
        if (result.ok) showSuccess("Shipment created successfully.");
        return result;
      }
    },
    [editTarget, createShipment, editShipment]
  );

  const handleTerminate = useCallback(
    async (id) => {
      const result = await terminateShipment(id);
      if (result.ok) showSuccess("Shipment terminated.");
      else setSuccessMessage(null);
    },
    [terminateShipment]
  );

  const handleExport = useCallback(async () => {
    const result = await exportShipments();
    if (result.ok) showSuccess("Export complete. All records have been cleared.");
    return result;
  }, [exportShipments]);

  const atLimit = count >= MAX_RECORD_LIMIT;
  const nearLimit = count >= MAX_RECORD_LIMIT * 0.9 && !atLimit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Shipment Management</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track and manage your shipment records locally in the browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Record counter badge */}
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
              atLimit
                ? "border-red-200 bg-red-50 text-red-700"
                : nearLimit
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-zinc-200 bg-zinc-50 text-zinc-600"
            }`}
          >
            {count}/{MAX_RECORD_LIMIT} records used
          </span>

          <ShipmentExportButton onExport={handleExport} disabled={count === 0} />

          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={atLimit}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Shipment
          </button>
        </div>
      </div>

      {/* Limit warning banner */}
      {atLimit && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-red-700">
            <span className="font-medium">Maximum record limit reached ({MAX_RECORD_LIMIT} records).</span>{" "}
            Please export your records to Excel before adding new ones.
          </p>
        </div>
      )}

      {nearLimit && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-amber-700">
            Approaching record limit. Consider exporting soon.
          </p>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* In-app notification fallback */}
      {inAppNotification && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4">
          <p className="text-sm text-sky-700">{inAppNotification}</p>
          <button
            type="button"
            onClick={() => setInAppNotification(null)}
            className="shrink-0 text-sky-500 hover:text-sky-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
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
