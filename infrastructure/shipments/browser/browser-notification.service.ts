import type { Shipment } from "@core/shipments/domain/shipment";
import type { NotificationPermissionState, NotificationService, ShipmentReminderReason } from "@core/shipments/ports/notification-service";

export function createBrowserNotificationService(): NotificationService {
  function getPermission(): NotificationPermissionState {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  }

  async function requestPermission(): Promise<boolean> {
    if (getPermission() === "unsupported") return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    return (await Notification.requestPermission()) === "granted";
  }

  function notify(shipment: Shipment, reason: ShipmentReminderReason): boolean {
    if (getPermission() !== "granted") return false;
    const label = shipment.alias ? `${shipment.shipmentNumber} (${shipment.alias})` : shipment.shipmentNumber;
    const body = reason === "eta_tomorrow"
      ? `${label}: ETA besok. Siapkan dokumen dan pekerjaan kedatangan.`
      : `${label}: tanggal pengingat telah tiba atau terlewat.`;
    try {
      new Notification("Pengingat shipment Pesisir", {
        body,
        icon: "/logo-pesisir.png",
        tag: `shipment-${shipment.id}-${reason}`,
      });
      return true;
    } catch {
      return false;
    }
  }

  return { getPermission, requestPermission, notify };
}

export const browserNotificationService = createBrowserNotificationService();
