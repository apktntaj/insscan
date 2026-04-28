/**
 * Browser Notification Service
 * Infrastructure Layer — Notification adapter
 *
 * @description Implements NotificationServicePort using the Web Notifications API.
 * Falls back to an in-app callback when browser notifications are unavailable or denied.
 */

/**
 * Creates the browser notification service
 * @param {{ onFallbackNotification?: (message: string) => void }} [options]
 * @returns {import('../../core/ports/notification-service.port').NotificationServicePort}
 */
export function createBrowserNotificationService(options = {}) {
  const { onFallbackNotification } = options;

  /**
   * Requests browser notification permission
   * @returns {Promise<boolean>} true if granted
   */
  async function requestPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;

    const result = await Notification.requestPermission();
    return result === "granted";
  }

  /**
   * Fires a notification for a shipment
   * @param {Object} shipment
   * @param {string} [dateLabel] - "ETA" or "Custom Date"
   */
  function scheduleForShipment(shipment, dateLabel = "ETA") {
    const label = shipment.alias ? `${shipment.shipmentNumber} (${shipment.alias})` : shipment.shipmentNumber;
    const message = `Reminder: ${label} — ${dateLabel} is tomorrow (H-1)`;

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Shipment Reminder", {
          body: message,
          icon: "/logo-pesisir.png",
          tag: `shipment-${shipment.id}-${dateLabel}`,
        });
        return;
      } catch {
        // Fall through to fallback
      }
    }

    // Fallback: in-app notification via callback
    if (typeof onFallbackNotification === "function") {
      onFallbackNotification(message);
    }
  }

  // Polling is managed by the use case; these are no-ops here
  // (the use case owns the interval logic)
  function startPolling() {}
  function stopPolling() {}

  return {
    requestPermission,
    scheduleForShipment,
    startPolling,
    stopPolling,
  };
}

/** Singleton instance */
export const browserNotificationService = createBrowserNotificationService();
