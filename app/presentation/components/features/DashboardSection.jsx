"use client";

/**
 * DashboardSection Component
 * Presentation Layer — Feature component
 *
 * @description Main dashboard section rendered above the shipment table.
 * Displays 4 metric widgets, a refresh indicator, and the actionable items list.
 */

import React, { useMemo } from "react";
import { useDashboard, formatRefreshTimestamp } from "../../hooks/useDashboard";
import DashboardWidget from "./DashboardWidget";
import ActionableList from "./ActionableList";

/**
 * @param {{
 *   shipments: Object[],
 *   loading: boolean,
 *   refresh: () => Promise<void>,
 *   lastRefreshedAt: Date|null,
 *   onEditShipment: (shipment: Object) => void,
 * }} props
 */
export default function DashboardSection({ shipments, loading, refresh, lastRefreshedAt, onEditShipment }) {
  const {
    metrics,
    actionableItems,
    alertsByShipmentId,
    isRefreshing,
    manualRefresh,
  } = useDashboard({ shipments, loading, refresh });

  const now = useMemo(() => new Date(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const refreshLabel = formatRefreshTimestamp(lastRefreshedAt, now);

  function handleEditShipment(shipmentId) {
    const shipment = (shipments ?? []).find((s) => s.id === shipmentId);
    if (shipment) onEditShipment(shipment);
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Refresh indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">{refreshLabel}</span>
          <button
            type="button"
            onClick={manualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Refresh dashboard"
          >
            {isRefreshing ? (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Metric widgets */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardWidget
          label="Total Aktif"
          value={metrics.totalActive}
          variant="default"
        />
        <DashboardWidget
          label="Arriving Soon"
          value={metrics.arrivingSoon}
          variant={metrics.arrivingSoon > 0 ? "warning" : "default"}
        />
        <DashboardWidget
          label="Overdue"
          value={metrics.overdue}
          variant={metrics.overdue > 0 ? "danger" : "default"}
        />
        <DashboardWidget
          label="Perlu Perhatian"
          value={metrics.needsAttention}
          variant="info"
        />
      </div>

      {/* Actionable items */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-700">Perlu Tindakan</h3>
        <ActionableList
          items={actionableItems}
          onEditShipment={handleEditShipment}
        />
      </div>
    </div>
  );
}

/**
 * Expose alertsByShipmentId so ShipmentManager can pass it to ShipmentTable.
 * This is a hook-based approach — lift useDashboard to ShipmentManager instead.
 * See ShipmentManager.jsx for the integration pattern.
 */
export { useDashboard };
