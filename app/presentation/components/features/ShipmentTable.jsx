"use client";

/**
 * ShipmentTable Component
 * Presentation Layer — Feature component
 *
 * @description Renders the sorted/filtered shipment list with search, edit, and terminate actions.
 */

import React, { useState } from "react";
import AlertBadge from "./AlertBadge";

/**
 * @param {{
 *   shipments: Object[],
 *   loading: boolean,
 *   query: string,
 *   onQueryChange: (q: string) => void,
 *   onEdit: (shipment: Object) => void,
 *   onTerminate: (id: number) => Promise<void>,
 *   alertsByShipmentId?: Map<number, Object>,
 * }} props
 */
export default function ShipmentTable({ shipments, loading, query, onQueryChange, onEdit, onTerminate, alertsByShipmentId }) {
  const [terminatingId, setTerminatingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  async function handleTerminateConfirm() {
    if (!confirmId) return;
    setTerminatingId(confirmId);
    setConfirmId(null);
    await onTerminate(confirmId);
    setTerminatingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by B/L, shipper, consignee, alias..."
          className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Shipment #</th>
              <th className="px-4 py-3">B/L Number</th>
              <th className="px-4 py-3">Shipper</th>
              <th className="px-4 py-3">Consignee</th>
              <th className="px-4 py-3">Vessel / Voyage</th>
              <th className="px-4 py-3">ETA</th>
              <th className="px-4 py-3">Alias</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-zinc-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-zinc-400">
                  {query ? "No shipments match your search." : "No shipment records yet. Create one to get started."}
                </td>
              </tr>
            ) : (
              shipments.map((s) => (
                <tr
                  key={s.id}
                  className={`transition hover:bg-zinc-50 ${s.isNotificationDue ? "bg-amber-50/60" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <div className="flex items-center gap-2">
                      <span>{s.shipmentNumber}</span>
                      {s.isNotificationDue && (
                        <span className="inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          H-1
                        </span>
                      )}
                      {alertsByShipmentId && (() => {
                        const alertResult = alertsByShipmentId.get(s.id);
                        return alertResult ? (
                          <AlertBadge alerts={alertResult.alerts} highestRisk={alertResult.highestRisk} />
                        ) : null;
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{s.blNumber}</td>
                  <td className="px-4 py-3 text-zinc-600">{s.shipperName}</td>
                  <td className="px-4 py-3 text-zinc-600">{s.consigneeName}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {s.vesselName !== "—" ? s.vesselName : "—"}
                    {s.voyage !== "—" && s.vesselName !== "—" ? ` / ${s.voyage}` : ""}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{s.etaDisplay}</td>
                  <td className="px-4 py-3 text-zinc-500">{s.alias || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(s)}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(s.id)}
                        disabled={terminatingId === s.id}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {terminatingId === s.id ? "..." : "Terminate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Terminate confirmation dialog */}
      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-zinc-900">Terminate Shipment?</h3>
            <p className="mt-2 text-sm text-zinc-600">
              This will permanently remove the shipment from the active list. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTerminateConfirm}
                className="rounded-xl border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Yes, Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
