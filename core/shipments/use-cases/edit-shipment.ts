/**
 * Edit Shipment Use Case
 * Application Business Rules
 *
 * @description Updates mutable fields of an existing shipment; immutable fields are always stripped
 */

import { isValidDate, type Shipment } from "../domain/shipment";
import type { ShipmentRepository } from "../ports/shipment-repository";
import { errorMessage, type UseCaseResult } from "./result";

/** Fields that can never be changed after creation */
const IMMUTABLE_FIELDS = ["shipmentNumber", "blNumber", "id", "createdAt", "status"];
type MutableShipment = { -readonly [Key in keyof Shipment]?: Shipment[Key] };

/**
 * Creates the Edit Shipment use case
 * @param {import('../ports/shipment-repository.port').ShipmentRepository} repository
 * @returns {{ execute: (id: number, updates: Object) => Promise<{ok: boolean, data?: Object, error?: Object}> }}
 */
export function createEditShipmentUseCase(repository: ShipmentRepository) {
  /**
   * @param {number} id
   * @param {Object} updates - Fields to update (immutable fields are ignored)
   * @returns {Promise<{ok: boolean, data?: Object, error?: Object}>}
   */
  async function execute(
    id: number,
    updates: Partial<Shipment>,
  ): Promise<UseCaseResult<Shipment>> {
    if (!id && id !== 0) {
      return { ok: false, error: { code: "INVALID_ID", message: "Shipment id is required" } };
    }

    // Strip immutable fields
    const safeUpdates: MutableShipment & Record<string, unknown> = { ...updates };
    for (const field of IMMUTABLE_FIELDS) {
      delete safeUpdates[field];
    }

    // Validate date fields if provided
    if (safeUpdates.eta !== undefined && safeUpdates.eta && !isValidDate(safeUpdates.eta)) {
      return {
        ok: false,
        error: { code: "INVALID_DATE", message: "ETA is not a valid date", field: "eta" },
      };
    }
    if (
      safeUpdates.customNotificationDate !== undefined &&
      safeUpdates.customNotificationDate &&
      !isValidDate(safeUpdates.customNotificationDate)
    ) {
      return {
        ok: false,
        error: {
          code: "INVALID_DATE",
          message: "Custom notification date is not a valid date",
          field: "customNotificationDate",
        },
      };
    }

    safeUpdates.updatedAt = new Date().toISOString();

    try {
      const updated = await repository.update(id, safeUpdates);
      return { ok: true, data: updated };
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE_ERROR",
          message: errorMessage(err, "Failed to update shipment record"),
        },
      };
    }
  }

  return { execute };
}
