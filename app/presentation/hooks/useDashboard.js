"use client";

/**
 * useDashboard Hook
 * Presentation Layer — Orchestrates dashboard state
 *
 * @description Runs both alert engines whenever shipments change,
 * computes metrics, builds actionable items list, and tracks refresh state.
 * Receives data from useShipments as props — no direct IndexedDB access.
 */

import { useMemo, useState, useCallback } from "react";
import { evaluateDataQualityAlerts } from "../../core/use-cases/evaluate-data-quality-alerts";
import { evaluateShipmentStatusAlerts } from "../../core/use-cases/evaluate-shipment-status-alerts";
import { startOfDay, diffCalendarDays, parseISODate } from "../../core/use-cases/evaluate-shipment-status-alerts";
import { RISK_LEVEL_ORDER } from "../../core/use-cases/evaluate-data-quality-alerts";

// ---------------------------------------------------------------------------
// Pure Helpers (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Returns the difference in whole minutes between two Dates (dateA - dateB).
 * @param {Date} dateA
 * @param {Date} dateB
 * @returns {number}
 *
 * @example
 * diffMinutes(new Date('2025-04-30T14:45:00'), new Date('2025-04-30T14:30:00'))
 * // => 15
 *
 * @example
 * diffMinutes(new Date('2025-04-30T14:30:00'), new Date('2025-04-30T14:45:00'))
 * // => -15
 */
export function diffMinutes(dateA, dateB) {
  return Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60));
}

/**
 * Formats a Date into a human-readable "last refreshed" string.
 * @param {Date | null} timestamp
 * @param {Date} now
 * @returns {string}
 *
 * @example
 * formatRefreshTimestamp(null, new Date())
 * // => "Belum dimuat"
 *
 * @example
 * formatRefreshTimestamp(new Date('2025-04-30T14:30:00'), new Date('2025-04-30T14:31:30'))
 * // => "Baru saja"
 *
 * @example
 * formatRefreshTimestamp(new Date('2025-04-30T14:00:00'), new Date('2025-04-30T14:45:00'))
 * // => "Diperbarui 45 menit lalu"
 *
 * @example
 * formatRefreshTimestamp(new Date('2025-04-30T09:15:30'), new Date('2025-04-30T14:00:00'))
 * // => "Diperbarui 09:15:30"
 */
export function formatRefreshTimestamp(timestamp, now) {
  if (!timestamp) return "Belum dimuat";

  const mins = diffMinutes(now, timestamp);

  if (mins < 1) return "Baru saja";
  if (mins < 60) return `Diperbarui ${mins} menit lalu`;

  // Same day — show time
  const tsDay = startOfDay(timestamp).getTime();
  const nowDay = startOfDay(now).getTime();
  if (tsDay === nowDay) {
    const hh = String(timestamp.getHours()).padStart(2, "0");
    const mm = String(timestamp.getMinutes()).padStart(2, "0");
    const ss = String(timestamp.getSeconds()).padStart(2, "0");
    return `Diperbarui ${hh}:${mm}:${ss}`;
  }

  // Different day
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const dd = String(timestamp.getDate()).padStart(2, "0");
  const mon = months[timestamp.getMonth()];
  const hh = String(timestamp.getHours()).padStart(2, "0");
  const mm2 = String(timestamp.getMinutes()).padStart(2, "0");
  return `Diperbarui ${dd} ${mon} ${hh}:${mm2}`;
}

/**
 * Merges two AlertResult objects for the same shipment.
 * Combines alerts arrays and recomputes highestRisk.
 * @param {Object} existing - AlertResult
 * @param {Object} incoming - AlertResult
 * @returns {Object} merged AlertResult
 *
 * @example
 * mergeAlertResults(
 *   { shipmentId: 1, alerts: [alertA], highestRisk: 'low' },
 *   { shipmentId: 1, alerts: [alertB], highestRisk: 'high' }
 * )
 * // => { shipmentId: 1, alerts: [alertA, alertB], highestRisk: 'high' }
 */
function mergeAlertResults(existing, incoming) {
  const merged = [...existing.alerts, ...incoming.alerts];
  const highestRisk = merged.reduce((best, alert) => {
    return (RISK_LEVEL_ORDER[alert.riskLevel] ?? 0) > (RISK_LEVEL_ORDER[best] ?? 0)
      ? alert.riskLevel
      : best;
  }, merged[0].riskLevel);
  return { shipmentId: existing.shipmentId, alerts: merged, highestRisk };
}

/**
 * Merges AlertResult arrays from both engines into a Map keyed by shipmentId.
 * @param {Object[]} dataQualityResults
 * @param {Object[]} statusResults
 * @returns {Map<number, Object>}
 *
 * @example
 * aggregateAlerts(
 *   [{ shipmentId: 1, alerts: [{ ruleId: 'MISSING_ETA_ONLY', ... }], highestRisk: 'medium' }],
 *   [{ shipmentId: 1, alerts: [{ ruleId: 'STALE_ENTRY', ... }], highestRisk: 'low' }]
 * )
 * // => Map { 1 => { shipmentId: 1, alerts: [MISSING_ETA_ONLY, STALE_ENTRY], highestRisk: 'medium' } }
 *
 * @example
 * aggregateAlerts([], [])
 * // => Map {}
 */
export function aggregateAlerts(dataQualityResults, statusResults) {
  const map = new Map();

  for (const result of [...dataQualityResults, ...statusResults]) {
    if (map.has(result.shipmentId)) {
      map.set(result.shipmentId, mergeAlertResults(map.get(result.shipmentId), result));
    } else {
      map.set(result.shipmentId, { ...result, alerts: [...result.alerts] });
    }
  }

  return map;
}

/**
 * Computes DashboardMetrics from shipments and their alert results.
 * @param {Object[]} shipments
 * @param {Map<number, Object>} alertsByShipmentId
 * @param {Date} now
 * @returns {{ totalActive: number, arrivingSoon: number, overdue: number, needsAttention: number }}
 *
 * @example
 * computeMetrics(
 *   [
 *     { id: 1, status: 'active', eta: '2025-04-29' },
 *     { id: 2, status: 'active', eta: '2025-05-02' },
 *     { id: 3, status: 'terminated', eta: '2025-04-28' }
 *   ],
 *   new Map(),
 *   new Date('2025-04-30')
 * )
 * // => { totalActive: 2, arrivingSoon: 1, overdue: 1, needsAttention: 0 }
 *
 * @example
 * computeMetrics([], new Map(), new Date())
 * // => { totalActive: 0, arrivingSoon: 0, overdue: 0, needsAttention: 0 }
 */
export function computeMetrics(shipments, alertsByShipmentId, now) {
  const today = startOfDay(now);
  let totalActive = 0;
  let arrivingSoon = 0;
  let overdue = 0;
  let needsAttention = 0;

  for (const s of shipments) {
    if (s.status !== "active") continue;
    totalActive++;

    const etaDate = parseISODate(s.eta);
    if (etaDate) {
      const etaNorm = startOfDay(etaDate);
      const diff = diffCalendarDays(etaNorm, today);
      if (diff < 0) overdue++;
      else if (diff >= 1 && diff <= 3) arrivingSoon++;
    }

    const alertResult = alertsByShipmentId.get(s.id);
    if (alertResult) {
      const hasHighOrMedium = alertResult.alerts.some(
        (a) => a.riskLevel === "high" || a.riskLevel === "medium"
      );
      if (hasHighOrMedium) needsAttention++;
    }
  }

  return { totalActive, arrivingSoon, overdue, needsAttention };
}

// ---------------------------------------------------------------------------
// useDashboard Hook
// ---------------------------------------------------------------------------

/**
 * useDashboard Hook
 * @param {{ shipments: Object[], loading: boolean, refresh: () => Promise<void> }} props
 * @returns {{
 *   metrics: Object,
 *   actionableItems: Object[],
 *   alertsByShipmentId: Map<number, Object>,
 *   lastRefreshedAt: Date|null,
 *   isRefreshing: boolean,
 *   manualRefresh: () => Promise<void>,
 * }}
 */
export function useDashboard({ shipments, loading, refresh }) {
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const now = useMemo(() => new Date(), [shipments]); // eslint-disable-line react-hooks/exhaustive-deps

  // Run both engines whenever shipments change
  const alertsByShipmentId = useMemo(() => {
    const safeShipments = shipments ?? [];
    const dqResults = evaluateDataQualityAlerts(safeShipments, { now });
    const ssResults = evaluateShipmentStatusAlerts(safeShipments, { now });
    return aggregateAlerts(dqResults, ssResults);
  }, [shipments, now]);

  // Compute metrics
  const metrics = useMemo(() => {
    return computeMetrics(shipments ?? [], alertsByShipmentId, now);
  }, [shipments, alertsByShipmentId, now]);

  // Build actionable items — shipments with medium/high alerts, sorted high→medium→low
  const actionableItems = useMemo(() => {
    const safeShipments = shipments ?? [];
    const items = [];

    for (const s of safeShipments) {
      if (s.status !== "active") continue;
      const alertResult = alertsByShipmentId.get(s.id);
      if (!alertResult) continue;

      const hasHighOrMedium = alertResult.alerts.some(
        (a) => a.riskLevel === "high" || a.riskLevel === "medium"
      );
      if (!hasHighOrMedium) continue;

      const sortedAlerts = [...alertResult.alerts].sort(
        (a, b) => (RISK_LEVEL_ORDER[b.riskLevel] ?? 0) - (RISK_LEVEL_ORDER[a.riskLevel] ?? 0)
      );

      items.push({
        shipmentId: s.id,
        shipmentNumber: s.shipmentNumber,
        alias: s.alias || "",
        eta: s.eta || "",
        etaDisplay: s.etaDisplay || s.eta || "—",
        highestRisk: alertResult.highestRisk,
        alerts: sortedAlerts,
      });
    }

    // Sort items: high → medium → low
    return items.sort(
      (a, b) => (RISK_LEVEL_ORDER[b.highestRisk] ?? 0) - (RISK_LEVEL_ORDER[a.highestRisk] ?? 0)
    );
  }, [shipments, alertsByShipmentId]);

  const manualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      setLastRefreshedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  return {
    metrics,
    actionableItems,
    alertsByShipmentId,
    lastRefreshedAt,
    isRefreshing: isRefreshing || loading,
    manualRefresh,
  };
}
