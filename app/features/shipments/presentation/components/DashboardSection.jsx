"use client";

/**
 * DashboardSection Component
 * Presentation Layer — Feature component
 *
 * @description Main dashboard section rendered above the shipment table.
 * Displays 4 metric widgets, a refresh indicator, and the actionable items list.
 */

import React, { useMemo } from "react";
import { useDashboard, formatRefreshTimestamp } from "@/app/features/shipments/presentation/hooks/useDashboard";
import DashboardWidget from "@/app/features/shipments/presentation/components/DashboardWidget";
import ActionableList from "@/app/features/shipments/presentation/components/ActionableList";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Refresh indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{refreshLabel}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={manualRefresh}
            disabled={isRefreshing}
            aria-label="Muat ulang dashboard"
          >
            {isRefreshing ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
            Muat ulang
          </Button>
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
          label="Segera Tiba"
          value={metrics.arrivingSoon}
          variant={metrics.arrivingSoon > 0 ? "warning" : "default"}
        />
        <DashboardWidget
          label="Terlambat"
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
        <h3 className="mb-2 text-sm font-medium">Perlu Tindakan</h3>
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
