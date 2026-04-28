/**
 * Shipment Controller
 * Interface Adapters Layer
 *
 * @description Wires all shipment use cases together and exposes a unified controller
 * consumed by the React hook (useShipments)
 */

import { createCreateShipmentUseCase } from "../../core/use-cases/create-shipment";
import { createEditShipmentUseCase } from "../../core/use-cases/edit-shipment";
import { createTerminateShipmentUseCase } from "../../core/use-cases/terminate-shipment";
import { createListShipmentsUseCase } from "../../core/use-cases/list-shipments";
import { createExportShipmentsUseCase } from "../../core/use-cases/export-shipments";
import { createScheduleNotificationsUseCase } from "../../core/use-cases/schedule-notifications";
import { toExcelRow, toViewModels } from "../presenters/shipment.presenter";
import { downloadAsExcel } from "../../infrastructure/excel/excel.service";
import { indexedDbShipmentRepository } from "../../infrastructure/services/indexeddb.service";
import { browserNotificationService } from "../../infrastructure/services/browser-notification.service";

/**
 * Creates the Shipment controller with injected dependencies
 * @param {import('../../core/ports/shipment-repository.port').ShipmentRepository} repository
 * @param {import('../../core/ports/notification-service.port').NotificationServicePort} notificationService
 * @returns {Object} Controller methods
 */
export function createShipmentController(repository, notificationService) {
  const createUseCase = createCreateShipmentUseCase(repository);
  const editUseCase = createEditShipmentUseCase(repository);
  const terminateUseCase = createTerminateShipmentUseCase(repository);
  const listUseCase = createListShipmentsUseCase(repository);
  const exportUseCase = createExportShipmentsUseCase(repository, downloadAsExcel, toExcelRow);
  const notifyUseCase = createScheduleNotificationsUseCase(repository, notificationService);

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
  browserNotificationService
);
