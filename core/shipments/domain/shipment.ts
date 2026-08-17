/** Framework-agnostic shipment domain model. */

export const SHIPMENT_STATUS = Object.freeze({
  ACTIVE: "active",
  TERMINATED: "terminated",
} as const);

export type ShipmentStatus = typeof SHIPMENT_STATUS[keyof typeof SHIPMENT_STATUS];

export interface Shipment {
  readonly id: number | null;
  readonly shipmentNumber: string;
  readonly blNumber: string;
  readonly shipperName: string;
  readonly consigneeName: string;
  readonly vesselName: string | null;
  readonly voyage: string | null;
  readonly portOfLoading: string | null;
  readonly portOfDischarge: string | null;
  readonly eta: string | null;
  readonly customNotificationDate: string | null;
  readonly alias: string | null;
  readonly notes: string | null;
  readonly status: ShipmentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ShipmentParams {
  id?: number | null;
  shipmentNumber: string;
  blNumber: string;
  shipperName: string;
  consigneeName: string;
  vesselName?: string | null;
  voyage?: string | null;
  portOfLoading?: string | null;
  portOfDischarge?: string | null;
  eta?: string | null;
  customNotificationDate?: string | null;
  alias?: string | null;
  notes?: string | null;
  status?: ShipmentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type ShipmentInput = Omit<ShipmentParams, "shipmentNumber" | "createdAt" | "updatedAt"> & {
  shipmentNumber?: string;
};

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
}: ShipmentParams): Readonly<Shipment> {
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

export function isValidDate(value: string | null | undefined): boolean {
  if (!value || value.trim() === "") return false;
  return !Number.isNaN(new Date(value).getTime());
}

export function isRequiredFieldPresent(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateRequiredFields(
  input: Partial<ShipmentInput> | null | undefined,
): { valid: boolean; missingFields: string[] } {
  const required = [
    "blNumber",
    "shipperName",
    "consigneeName",
    "eta",
  ] as const;
  const missingFields = required.filter((field) => !isRequiredFieldPresent(input?.[field]));
  return { valid: missingFields.length === 0, missingFields };
}

const ENTITY_PREFIXES = new Set([
  "PT", "CV", "UD", "PD", "TB", "FA", "NV", "BV", "LLC", "LTD", "INC",
  "CORP", "CO", "PTE", "SDN", "BHD", "TBK", "PERSERO", "THE",
]);

export function extractConsigneeInitials(consigneeName: string): string {
  if (!consigneeName || typeof consigneeName !== "string") return "XX";

  const words = consigneeName
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !ENTITY_PREFIXES.has(word));

  return words.length === 0
    ? "XX"
    : words.map((word) => word[0]).join("").slice(0, 4);
}

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

export function generateShipmentNumber(
  consigneeName: string,
  serial: number,
  date: Date = new Date(),
): string {
  const initials = extractConsigneeInitials(consigneeName);
  const month = MONTH_ABBR[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${initials}${month}${year}${String(serial).padStart(3, "0")}`;
}
