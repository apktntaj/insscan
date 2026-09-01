import {
  isValidDate,
  normalizeEditShipmentInput,
  validateEditShipmentInput,
  type EditShipmentInput,
  type Shipment,
} from "../domain/shipment";
import type { ShipmentRepository } from "../ports/shipment-repository";
import { errorMessage, type UseCaseResult } from "./result";

export function createEditShipmentUseCase(
  repository: ShipmentRepository,
  clock: () => Date = () => new Date(),
) {
  async function execute(id: number, input: EditShipmentInput): Promise<UseCaseResult<Shipment>> {
    if (!Number.isInteger(id) || id < 0) {
      return { ok: false, error: { code: "INVALID_ID", message: "Shipment id is required" } };
    }
    const validation = validateEditShipmentInput(input);
    if (!validation.valid) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Missing required fields: ${validation.missingFields.join(", ")}`,
          fields: validation.missingFields,
        },
      };
    }
    const updates = normalizeEditShipmentInput(input);
    if (!isValidDate(updates.eta)) {
      return { ok: false, error: { code: "INVALID_DATE", message: "ETA is not a valid date", field: "eta" } };
    }
    if (updates.customNotificationDate && !isValidDate(updates.customNotificationDate)) {
      return {
        ok: false,
        error: { code: "INVALID_DATE", message: "Custom notification date is not a valid date", field: "customNotificationDate" },
      };
    }
    try {
      const updated = await repository.update(id, { ...updates, updatedAt: clock().toISOString() });
      return { ok: true, data: updated };
    } catch (error) {
      return { ok: false, error: { code: "STORAGE_ERROR", message: errorMessage(error, "Failed to update shipment record") } };
    }
  }
  return { execute };
}
