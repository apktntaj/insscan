"use client";

/**
 * ShipmentExportButton Component
 * Presentation Layer — Feature component
 *
 * @description Export button with confirmation modal. Warns that all records will be
 * permanently deleted after export. Calls exportShipments on confirmation.
 */

import React, { useState } from "react";

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
      setExportError(result.error?.message || "Export failed. Records have not been deleted.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setExportError(null); setShowModal(true); }}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
        Export to Excel
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Export and Clear Records?</h3>
                <p className="mt-1.5 text-sm text-zinc-600">
                  All shipment records will be exported to an Excel file and then{" "}
                  <span className="font-medium text-red-600">permanently deleted</span> from the browser.
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {exportError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {exportError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={exporting}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {exporting && (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {exporting ? "Exporting..." : "Export & Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
