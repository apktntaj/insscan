import {
  createShipment,
  generateShipmentNumber,
  isValidDate,
  normalizeCreateShipmentInput,
  shipmentNumberPrefix,
  validateCreateShipmentInput,
  type CreateShipmentInput,
  type Shipment,
} from "../domain/shipment";
import {
  ShipmentSequenceExhaustedError,
  type ShipmentRepository,
} from "../ports/shipment-repository";
import { errorMessage, type UseCaseResult } from "./result";

export function createCreateShipmentUseCase(
  repository: ShipmentRepository,
  clock: () => Date = () => new Date(),
) {
  async function execute(input: CreateShipmentInput): Promise<UseCaseResult<Shipment>> {
    const validation = validateCreateShipmentInput(input);
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

    const normalized = normalizeCreateShipmentInput(input);
    if (!isValidDate(normalized.eta)) {
      return { ok: false, error: { code: "INVALID_DATE", message: "ETA is not a valid date", field: "eta" } };
    }
    if (normalized.customNotificationDate && !isValidDate(normalized.customNotificationDate)) {
      return {
        ok: false,
        error: { code: "INVALID_DATE", message: "Custom notification date is not a valid date", field: "customNotificationDate" },
      };
    }

    const now = clock();
    const timestamp = now.toISOString();
    const prefix = shipmentNumberPrefix(normalized.consigneeName, now);
    try {
      const saved = await repository.createNext(prefix, (serial) => createShipment({
        ...normalized,
        shipmentNumber: generateShipmentNumber(normalized.consigneeName, serial, now),
        createdAt: timestamp,
        updatedAt: timestamp,
      }));
      return { ok: true, data: saved };
    } catch (error) {
      if (error instanceof ShipmentSequenceExhaustedError) {
        return {
          ok: false,
          error: { code: "SERIAL_EXHAUSTED", message: "Nomor shipment bulanan telah mencapai 999." },
        };
      }
      return {
        ok: false,
        error: { code: "STORAGE_ERROR", message: errorMessage(error, "Failed to save shipment record") },
      };
    }
  }
  return { execute };
}
