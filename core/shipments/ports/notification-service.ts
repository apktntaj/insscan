import type { Shipment } from "../domain/shipment";

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";
export type ShipmentReminderReason = "eta_tomorrow" | "custom_due";

export interface NotificationService {
  getPermission(): NotificationPermissionState;
  requestPermission(): Promise<boolean>;
  notify(shipment: Shipment, reason: ShipmentReminderReason): boolean;
}

export function validateNotificationService(service: Partial<NotificationService> | null | undefined): asserts service is NotificationService {
  for (const method of ["getPermission", "requestPermission", "notify"] as const) {
    if (typeof service?.[method] !== "function") throw new Error(`NotificationService must implement "${method}" method`);
  }
}
