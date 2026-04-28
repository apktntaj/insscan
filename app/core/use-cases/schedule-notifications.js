/**
 * Schedule Notifications Use Case
 * Application Business Rules
 *
 * @description Starts a 3-hour polling loop that fires browser notifications
 * at H-1 (one working day before ETA or custom notification date).
 * Uses sessionStorage to avoid duplicate notifications within a session.
 */

import { isNotificationDue, toIsoDateString } from "../entities/public-holidays";

const POLL_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours

/**
 * Creates the Schedule Notifications use case
 * @param {import('../ports/shipment-repository.port').ShipmentRepository} repository
 * @param {import('../ports/notification-service.port').NotificationServicePort} notificationService
 * @returns {{ start: () => void, stop: () => void, checkNow: () => Promise<void> }}
 */
export function createScheduleNotificationsUseCase(repository, notificationService) {
  let intervalId = null;

  /**
   * Checks all active shipments and fires notifications for those due today
   */
  async function checkNow() {
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
        if (!hasBeenNotifiedToday(key)) {
          notificationService.scheduleForShipment(shipment, "ETA");
          markNotifiedToday(key);
        }
      }

      // Check custom notification date
      if (shipment.customNotificationDate && isNotificationDue(shipment.customNotificationDate, today)) {
        const key = `notified_${shipment.id}_custom_${todayStr}`;
        if (!hasBeenNotifiedToday(key)) {
          notificationService.scheduleForShipment(shipment, "Custom Date");
          markNotifiedToday(key);
        }
      }
    }
  }

  /**
   * Starts the 3-hour polling loop and runs an immediate check
   */
  function start() {
    if (intervalId !== null) return; // already running
    checkNow();
    intervalId = setInterval(checkNow, POLL_INTERVAL_MS);
  }

  /**
   * Stops the polling loop
   */
  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return { start, stop, checkNow };
}

function hasBeenNotifiedToday(key) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markNotifiedToday(key) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage unavailable — ignore
  }
}
