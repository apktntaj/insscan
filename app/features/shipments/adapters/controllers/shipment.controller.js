/**
 * Shipment Controller
 * Interface Adapters Layer
 *
 * @description Wires all shipment use cases together and exposes a unified controller
 * consumed by the React hook (useShipments)
 */

import { createCreateShipmentUseCase } from "@core/shipments/use-cases/create-shipment";
import { createEditShipmentUseCase } from "@core/shipments/use-cases/edit-shipment";
import { createTerminateShipmentUseCase } from "@core/shipments/use-cases/terminate-shipment";
import { createListShipmentsUseCase } from "@core/shipments/use-cases/list-shipments";
import { createExportShipmentsUseCase } from "@core/shipments/use-cases/export-shipments";
import { createScheduleNotificationsUseCase } from "@core/shipments/use-cases/schedule-notifications";
import { toExcelRow, toViewModels } from "../presenters/shipment.presenter";
import { downloadAsExcel } from "@/app/shared/infrastructure/excel/excel.service";
import { indexedDbShipmentRepository } from "@/app/features/shipments/infrastructure/indexeddb.service";
import { browserNotificationService } from "@/app/features/shipments/infrastructure/browser-notification.service";
import { sessionNotificationHistory } from "@/app/features/shipments/infrastructure/session-notification-history";

/**
 * Creates the Shipment controller with injected dependencies
 * @param {import('@core/shipments/ports/shipment-repository').ShipmentRepository} repository
 * @param {import('@core/shipments/ports/notification-service').NotificationServicePort} notificationService
 * @returns {Object} Controller methods
 */
export function createShipmentController(
  repository,
  notificationService,
  notificationHistory,
) {
  const createUseCase = createCreateShipmentUseCase(repository);
  const editUseCase = createEditShipmentUseCase(repository);
  const terminateUseCase = createTerminateShipmentUseCase(repository);
  const listUseCase = createListShipmentsUseCase(repository);
  const exportUseCase = createExportShipmentsUseCase(repository, downloadAsExcel, toExcelRow);
  const notifyUseCase = createScheduleNotificationsUseCase(
    repository,
    notificationService,
    notificationHistory,
  );

  /**
   * Creates a new shipment record
   * @param {Object} input
   * @returns {Promise<{ok: boolean, data?: Object, error?: Object}>}
   */
  async function createShipment(input) {
    return createUseCase.execute(input);
  }

  /**
   * Edits an existing shipment record
   * @param {number} id
   * @param {Object} updates
   * @returns {Promise<{ok: boolean, data?: Object, error?: Object}>}
   */
  async function editShipment(id, updates) {
    return editUseCase.execute(id, updates);
  }

  /**
   * Terminates a shipment record
   * @param {number} id
   * @returns {Promise<{ok: boolean, error?: Object}>}
   */
  async function terminateShipment(id) {
    return terminateUseCase.execute(id);
  }

  /**
   * Lists active shipments with optional search query
   * @param {string} [query]
   * @returns {Promise<{ok: boolean, data?: Object[], error?: Object}>}
   */
  async function listShipments(query) {
    const result = await listUseCase.execute(query);
    if (!result.ok) return result;
    return { ok: true, data: toViewModels(result.data) };
  }

  /**
   * Returns the current active shipment count
   * @returns {Promise<number>}
   */
  async function getCount() {
    try {
      return await repository.countActive();
    } catch {
      return 0;
    }
  }

  /**
   * Exports all shipments to Excel and clears records
   * @returns {Promise<{ok: boolean, error?: Object}>}
   */
  async function exportShipments() {
    return exportUseCase.execute();
  }

  /**
   * Starts the notification polling loop
   */
  function startNotifications() {
    notifyUseCase.start();
  }

  /**
   * Stops the notification polling loop
   */
  function stopNotifications() {
    notifyUseCase.stop();
  }

  return {
    createShipment,
    editShipment,
    terminateShipment,
    listShipments,
    getCount,
    exportShipments,
    startNotifications,
    stopNotifications,
  };
}

/** Singleton controller wired with default infrastructure */
export const shipmentController = createShipmentController(
  indexedDbShipmentRepository,
  browserNotificationService,
  sessionNotificationHistory,
);
