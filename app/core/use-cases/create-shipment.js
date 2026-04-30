/**
 * Create Shipment Use Case
 * Application Business Rules
 *
 * @description Validates input, enforces record cap and uniqueness, persists shipment
 */

import { createShipment, validateRequiredFields, isValidDate, generateShipmentNumber, extractConsigneeInitials } from "../entities/shipment";

export const MAX_RECORD_LIMIT = 500;

/**
 * Determines the next monthly serial number for shipment number generation.
 * Counts existing active shipments whose shipment number starts with the same
 * initials+month+year prefix, then returns count + 1.
 * @param {Object[]} existingShipments - All active shipments
 * @param {string} prefix - e.g. "MBJAN26"
 * @returns {number}
 */
function getNextSerial(existingShipments, prefix) {
  const matching = existingShipments.filter((s) =>
    s.shipmentNumber && s.shipmentNumber.toUpperCase().startsWith(prefix.toUpperCase())
  );
  return matching.length + 1;
}

/**
 * Creates the Create Shipment use case
 * @param {import('../ports/shipment-repository.port').ShipmentRepository} repository
 * @returns {{ execute: (input: Object) => Promise<{ok: boolean, data?: Object, error?: Object}> }}
 */
export function createCreateShipmentUseCase(repository) {
  /**
   * @param {Object} input - Shipment field values
   * @returns {Promise<{ok: boolean, data?: Object, error?: Object}>}
   */
  async function execute(input) {
    // 1. Validate required fields
    const { valid, missingFields } = validateRequiredFields(input);
    if (!valid) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Missing required fields: ${missingFields.join(", ")}`,
          fields: missingFields,
        },
      };
    }

    // 2. Validate date fields if provided
    if (input.eta && !isValidDate(input.eta)) {
      return {
        ok: false,
        error: { code: "INVALID_DATE", message: "ETA is not a valid date", field: "eta" },
      };
    }
    if (input.customNotificationDate && !isValidDate(input.customNotificationDate)) {
      return {
        ok: false,
        error: {
          code: "INVALID_DATE",
          message: "Custom notification date is not a valid date",
          field: "customNotificationDate",
        },
      };
    }

    // 3. Enforce record cap
    const count = await repository.countActive();
    if (count >= MAX_RECORD_LIMIT) {
      return {
        ok: false,
        error: {
          code: "RECORD_LIMIT_REACHED",
          message: `Maximum record limit of ${MAX_RECORD_LIMIT} reached. Please export records before adding more.`,
        },
      };
    }

    // 4. Fetch existing records (needed for uniqueness checks and serial generation)
    const existing = await repository.listActive();

    // 5. Auto-generate shipment number
    const now = new Date();
    const MONTH_ABBR = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const initials = extractConsigneeInitials(input.consigneeName);
    const month = MONTH_ABBR[now.getMonth()];
    const year = String(now.getFullYear()).slice(-2);
    const prefix = `${initials}${month}${year}`;
    const serial = getNextSerial(existing, prefix);
    const shipmentNumber = generateShipmentNumber(input.consigneeName, serial, now);

    // 6. Check uniqueness — shipment number
    const dupShipmentNumber = existing.find(
      (s) => s.shipmentNumber.trim().toLowerCase() === shipmentNumber.trim().toLowerCase()
    );
    if (dupShipmentNumber) {
      return {
        ok: false,
        error: {
          code: "DUPLICATE_SHIPMENT_NUMBER",
          message: `Shipment number "${shipmentNumber}" already exists`,
          field: "shipmentNumber",
        },
      };
    }

    // 7. Check uniqueness — B/L number
    const dupBlNumber = existing.find(
      (s) => s.blNumber.trim().toLowerCase() === input.blNumber.trim().toLowerCase()
    );
    if (dupBlNumber) {
      return {
        ok: false,
        error: {
          code: "DUPLICATE_BL_NUMBER",
          message: `B/L number "${input.blNumber}" already exists`,
          field: "blNumber",
        },
      };
    }

    // 8. Persist
    const shipment = createShipment({
      ...input,
      shipmentNumber,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    try {
      const saved = await repository.create(shipment);
      return { ok: true, data: saved };
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE_ERROR",
          message: err?.message || "Failed to save shipment record",
        },
      };
    }
  }

  return { execute };
}
