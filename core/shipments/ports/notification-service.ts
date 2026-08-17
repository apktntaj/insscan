import type { Shipment } from "../domain/shipment";

/** Browser-independent notification output port. */
export interface NotificationService {
  requestPermission(): Promise<boolean>;
  scheduleForShipment(shipment: Shipment, reason?: string): void;
  startPolling(): void;
  stopPolling(): void;
}

export function validateNotificationService(
  service: Partial<NotificationService> | null | undefined,
): asserts service is NotificationService {
  const required: ReadonlyArray<keyof NotificationService> = [
    "requestPermission",
    "scheduleForShipment",
    "startPolling",
    "stopPolling",
  ];

  for (const method of required) {
    if (typeof service?.[method] !== "function") {
      throw new Error(`NotificationServicePort must implement "${method}" method`);
    }
  }
}
