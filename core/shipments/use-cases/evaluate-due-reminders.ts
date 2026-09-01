import { parseDateOnly, SHIPMENT_STAGE, type Shipment } from "../domain/shipment";
import { diffCalendarDays, startOfDay } from "./evaluate-shipment-status-alerts";

export interface DueReminder {
  shipmentId: number;
  reason: "eta_tomorrow" | "custom_due";
  targetDate: string;
  daysOverdue: number;
}

export function evaluateDueReminders(shipments: readonly Shipment[], now: Date): DueReminder[] {
  const today = startOfDay(now);
  const reminders: DueReminder[] = [];
  for (const shipment of shipments) {
    if (shipment.id === null || shipment.stage === SHIPMENT_STAGE.COMPLETED) continue;
    const custom = parseDateOnly(shipment.customNotificationDate);
    if (custom) {
      const days = diffCalendarDays(custom, today);
      if (days <= 0) {
        reminders.push({ shipmentId: shipment.id, reason: "custom_due", targetDate: shipment.customNotificationDate!, daysOverdue: Math.abs(days) });
      }
    }
    const eta = parseDateOnly(shipment.eta);
    if (eta && diffCalendarDays(eta, today) === 1) {
      reminders.push({ shipmentId: shipment.id, reason: "eta_tomorrow", targetDate: shipment.eta, daysOverdue: 0 });
    }
  }
  return reminders.sort((a, b) => {
    const aRank = a.reason === "custom_due" ? (a.daysOverdue > 0 ? 0 : 1) : 2;
    const bRank = b.reason === "custom_due" ? (b.daysOverdue > 0 ? 0 : 1) : 2;
    if (aRank !== bRank) return aRank - bRank;
    if (aRank === 0 && a.daysOverdue !== b.daysOverdue) return b.daysOverdue - a.daysOverdue;
    return a.shipmentId - b.shipmentId;
  });
}
