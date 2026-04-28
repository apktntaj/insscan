/**
 * Shipment Entity
 * Enterprise Business Rules — Pure domain object
 *
 * @description Represents a shipment record with all tracking fields
 */

export const SHIPMENT_STATUS = Object.freeze({
  ACTIVE: "active",
  TERMINATED: "terminated",
});

/**
 * Creates a Shipment entity
 * @param {Object} params
 * @param {number|null}  params.id
 * @param {string}       params.shipmentNumber   - Required, unique, immutable
 * @param {string}       params.blNumber         - Required, unique, immutable
 * @param {string}       params.shipperName      - Required
 * @param {string}       params.consigneeName    - Required
 * @param {string|null}  params.vesselName
 * @param {string|null}  params.voyage
 * @param {string|null}  params.portOfLoading
 * @param {string|null}  params.portOfDischarge
 * @param {string|null}  params.eta              - ISO 8601 date string
 * @param {string|null}  params.customNotificationDate - ISO 8601 date string
 * @param {string|null}  params.alias
 * @param {string|null}  params.notes
 * @param {'active'|'terminated'} params.status
 * @param {string}       params.createdAt        - ISO 8601 timestamp
 * @param {string}       params.updatedAt        - ISO 8601 timestamp
 * @returns {Shipment}
 */
export function createShipment({
  id = null,
  shipmentNumber,
  blNumber,
  shipperName,
  consigneeName,
  vesselName = null,
  voyage = null,
  portOfLoading = null,
  portOfDischarge = null,
  eta = null,
  customNotificationDate = null,
  alias = null,
  notes = null,
  status = SHIPMENT_STATUS.ACTIVE,
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString(),
}) {
  return Object.freeze({
    id,
    shipmentNumber,
    blNumber,
    shipperName,
    consigneeName,
    vesselName,
    voyage,
    portOfLoading,
    portOfDischarge,
    eta,
    customNotificationDate,
    alias,
    notes,
    status,
    createdAt,
    updatedAt,
  });
}

/**
 * Validates that a date string is a valid ISO 8601 date (YYYY-MM-DD or full ISO timestamp)
 * @param {string|null|undefined} value
 * @returns {boolean}
 */
export function isValidDate(value) {
  if (!value || typeof value !== "string" || value.trim() === "") return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/**
 * Validates that a required field is non-empty
 * @param {string|null|undefined} value
 * @returns {boolean}
 */
export function isRequiredFieldPresent(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates all required fields on a shipment input
 * @param {Object} input
 * @returns {{ valid: boolean, missingFields: string[] }}
 */
export function validateRequiredFields(input) {
  const required = ["shipmentNumber", "blNumber", "shipperName", "consigneeName"];
  const missingFields = required.filter((f) => !isRequiredFieldPresent(input?.[f]));
  return { valid: missingFields.length === 0, missingFields };
}
