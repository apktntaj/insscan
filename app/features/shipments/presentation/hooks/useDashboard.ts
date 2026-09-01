"use client";

import { useEffect, useMemo, useState } from "react";
import { evaluateDataQualityAlerts, RISK_LEVEL_ORDER, type AlertResult } from "@core/shipments/use-cases/evaluate-data-quality-alerts";
import { diffCalendarDays, evaluateShipmentStatusAlerts, startOfDay } from "@core/shipments/use-cases/evaluate-shipment-status-alerts";
import { evaluateDueReminders } from "@core/shipments/use-cases/evaluate-due-reminders";
import { parseDateOnly, SHIPMENT_STAGE } from "@core/shipments/domain/shipment";
import type { ShipmentViewModel } from "../../adapters/presenters/shipment.presenter";

export function aggregateAlerts(...groups: readonly AlertResult[][]): Map<number, AlertResult> {
  const result = new Map<number, AlertResult>();
  for (const alertResult of groups.flat()) {
    const existing = result.get(alertResult.shipmentId);
    if (!existing) {
      result.set(alertResult.shipmentId, { ...alertResult, alerts: [...alertResult.alerts] });
      continue;
    }
    const alerts = [...existing.alerts, ...alertResult.alerts];
    const highestRisk = alerts.reduce((highest, alert) =>
      RISK_LEVEL_ORDER[alert.riskLevel] > RISK_LEVEL_ORDER[highest] ? alert.riskLevel : highest,
    alerts[0].riskLevel);
    result.set(alertResult.shipmentId, { shipmentId: alertResult.shipmentId, alerts, highestRisk });
  }
  return result;
}

export function useDashboard({ shipments }: { shipments: readonly ShipmentViewModel[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    const interval = window.setInterval(updateClock, 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") updateClock();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const openShipments = useMemo(() => shipments.filter((shipment): shipment is ShipmentViewModel & { id: number } =>
    shipment.id !== null && shipment.stage !== SHIPMENT_STAGE.COMPLETED,
  ), [shipments]);

  const alertsByShipmentId = useMemo(() => aggregateAlerts(
    evaluateDataQualityAlerts(openShipments, { now }),
    evaluateShipmentStatusAlerts(openShipments, { now }),
  ), [openShipments, now]);

  const metrics = useMemo(() => {
    let arrivingSoon = 0;
    let overdue = 0;
    let needsAttention = 0;
    const today = startOfDay(now);
    for (const shipment of openShipments) {
      const eta = parseDateOnly(shipment.eta);
      if (eta) {
        const days = diffCalendarDays(eta, today);
        if (days < 0) overdue += 1;
        else if (days >= 1 && days <= 3) arrivingSoon += 1;
      }
      if (alertsByShipmentId.has(shipment.id)) needsAttention += 1;
    }
    return { totalActive: openShipments.length, needsAttention, overdue, arrivingSoon };
  }, [alertsByShipmentId, now, openShipments]);

  const actionableItems = useMemo(() => openShipments
    .filter((shipment) => alertsByShipmentId.has(shipment.id))
    .sort((a, b) => {
      const aRisk = alertsByShipmentId.get(a.id)?.highestRisk ?? "low";
      const bRisk = alertsByShipmentId.get(b.id)?.highestRisk ?? "low";
      return RISK_LEVEL_ORDER[bRisk] - RISK_LEVEL_ORDER[aRisk];
    }), [alertsByShipmentId, openShipments]);

  const dueReminders = useMemo(() => evaluateDueReminders(openShipments, now), [now, openShipments]);

  return { now, metrics, alertsByShipmentId, actionableItems, dueReminders };
}
