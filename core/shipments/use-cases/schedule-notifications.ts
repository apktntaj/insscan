/**
 * Schedule Notifications Use Case
 * Application Business Rules
 *
 * @description Starts a 3-hour polling loop that fires browser notifications
 * at H-1 (one working day before ETA or custom notification date).
 * Uses an injected notification-history port to avoid duplicate notifications.
 */

import { isNotificationDue, toIsoDateString } from "../domain/public-holidays";
import {
  createInMemoryNotificationHistory,
  type NotificationHistory,
} from "../ports/notification-history";
import type { NotificationService } from "../ports/notification-service";
import type { ShipmentRepository } from "../ports/shipment-repository";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // DEV: 5 minutes (change to 3 * 60 * 60 * 1000 for production)

/**
 * Creates the Schedule Notifications use case
 * @param {import('../ports/shipment-repository.port').ShipmentRepository} repository
 * @param {import('../ports/notification-service.port').NotificationServicePort} notificationService
 * @returns {{ start: () => void, stop: () => void, checkNow: () => Promise<void> }}
 */
export function createScheduleNotificationsUseCase(
  repository: ShipmentRepository,
  notificationService: NotificationService,
  notificationHistory: NotificationHistory = createInMemoryNotificationHistory(),
) {
  let intervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Checks all active shipments and fires notifications for those due today
   */
  async function checkNow(): Promise<void> {
    const today = new Date();
    const todayStr = toIsoDateString(today);

    let shipments;
    try {
      shipments = await repository.listActive();
    } catch {
      return;
    }

    for (const shipment of shipments) {
      // Check ETA notification
      if (shipment.eta && isNotificationDue(shipment.eta, today)) {
        const key = `notified_${shipment.id}_eta_${todayStr}`;
        if (!notificationHistory.has(key)) {
          notificationService.scheduleForShipment(shipment, "ETA");
          notificationHistory.mark(key);
        }
      }

      // Check custom notification date
      if (shipment.customNotificationDate && isNotificationDue(shipment.customNotificationDate, today)) {
        const key = `notified_${shipment.id}_custom_${todayStr}`;
        if (!notificationHistory.has(key)) {
          notificationService.scheduleForShipment(shipment, "Custom Date");
          notificationHistory.mark(key);
        }
      }
    }
  }

  /**
   * Starts the 3-hour polling loop and runs an immediate check
   */
  function start(): void {
    if (intervalId !== null) return; // already running
    checkNow();
    intervalId = setInterval(checkNow, POLL_INTERVAL_MS);
  }

  /**
   * Stops the polling loop
   */
  function stop(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return { start, stop, checkNow };
}
