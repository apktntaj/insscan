/**
 * Notification Service Port (Interface)
 * Defines the contract for the notification service
 *
 * @description Output port — implemented by the infrastructure layer (browser notification service)
 */

/**
 * @typedef {Object} NotificationServicePort
 * @property {() => Promise<boolean>} requestPermission  - Request browser notification permission
 * @property {(shipment: import('../entities/shipment').Shipment) => void} scheduleForShipment
 * @property {() => void} startPolling  - Checks for due notifications every 3 hours
 * @property {() => void} stopPolling
 */

/**
 * Validates that an object implements the NotificationServicePort interface
 * @param {Object} service - Object to validate
 * @throws {Error} If service doesn't implement required methods
 */
export function validateNotificationService(service) {
  const required = ["requestPermission", "scheduleForShipment", "startPolling", "stopPolling"];

  for (const method of required) {
    if (typeof service?.[method] !== "function") {
      throw new Error(`NotificationServicePort must implement "${method}" method`);
    }
  }
}
