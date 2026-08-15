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
  const required = ["blNumber", "shipperName", "consigneeName", "eta"];
  const missingFields = required.filter((f) => !isRequiredFieldPresent(input?.[f]));
  return { valid: missingFields.length === 0, missingFields };
}

/**
 * Legal entity prefixes to strip when extracting consignee initials.
 * Covers common Indonesian and international entity types.
 */
const ENTITY_PREFIXES = new Set([
  "PT", "CV", "UD", "PD", "TB", "FA", "NV", "BV", "LLC", "LTD", "INC",
  "CORP", "CO", "PTE", "SDN", "BHD", "TBK", "PERSERO", "THE",
]);

/**
 * Extracts initials from a consignee name, skipping legal entity prefixes.
 * Example: "PT Maju Bersama" → "MB", "CV Karya Utama" → "KU"
 * @param {string} consigneeName
 * @returns {string} Uppercase initials (2–4 chars)
 */
export function extractConsigneeInitials(consigneeName) {
  if (!consigneeName || typeof consigneeName !== "string") return "XX";

  const words = consigneeName
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !ENTITY_PREFIXES.has(w));

  if (words.length === 0) return "XX";

  // Take first letter of each meaningful word, up to 4 chars
  return words.map((w) => w[0]).join("").slice(0, 4);
}

const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/**
 * Generates a shipment number in the format: {INITIALS}{MON}{YY}{NNN}
 * Example: "MBJAN26001"
 * @param {string} consigneeName - Used to derive initials
 * @param {number} serial - Monthly serial number (1-based)
 * @param {Date} [date] - Defaults to current date
 * @returns {string}
 */
export function generateShipmentNumber(consigneeName, serial, date = new Date()) {
  const initials = extractConsigneeInitials(consigneeName);
  const month = MONTH_ABBR[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  const paddedSerial = String(serial).padStart(3, "0");
  return `${initials}${month}${year}${paddedSerial}`;
}
