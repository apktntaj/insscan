/** Framework-independent shipment domain model and invariants. */

export const SHIPMENT_STAGE = Object.freeze({
  PRE_ARRIVAL: "pre_arrival",
  DOCUMENT_PREPARATION: "document_preparation",
  CUSTOMS_PROCESS: "customs_process",
  RELEASED: "released",
  DELIVERY: "delivery",
  COMPLETED: "completed",
} as const);

export type ShipmentStage = (typeof SHIPMENT_STAGE)[keyof typeof SHIPMENT_STAGE];

export const SHIPMENT_STAGE_LABELS: Readonly<Record<ShipmentStage, string>> = Object.freeze({
  pre_arrival: "Pra-kedatangan",
  document_preparation: "Dokumen & PIB",
  customs_process: "Proses pabean",
  released: "SPPB / release",
  delivery: "Pengantaran",
  completed: "Selesai",
});

export const ACTIVE_SHIPMENT_STAGES = Object.freeze([
  SHIPMENT_STAGE.PRE_ARRIVAL,
  SHIPMENT_STAGE.DOCUMENT_PREPARATION,
  SHIPMENT_STAGE.CUSTOMS_PROCESS,
  SHIPMENT_STAGE.RELEASED,
  SHIPMENT_STAGE.DELIVERY,
] as const);

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
  readonly eta: string;
  readonly customNotificationDate: string | null;
  readonly alias: string | null;
  readonly notes: string | null;
  readonly stage: ShipmentStage;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateShipmentInput {
  blNumber: string;
  shipperName: string;
  consigneeName: string;
  eta: string;
  vesselName?: string | null;
  voyage?: string | null;
  portOfLoading?: string | null;
  portOfDischarge?: string | null;
  customNotificationDate?: string | null;
  alias?: string | null;
  notes?: string | null;
}

export interface EditShipmentInput {
  shipperName: string;
  consigneeName: string;
  eta: string;
  vesselName?: string | null;
  voyage?: string | null;
  portOfLoading?: string | null;
  portOfDischarge?: string | null;
  customNotificationDate?: string | null;
  alias?: string | null;
  notes?: string | null;
}

export interface ShipmentParams extends CreateShipmentInput {
  id?: number | null;
  shipmentNumber: string;
  stage?: ShipmentStage;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnly(value: string | null | undefined): Date | null {
  if (typeof value !== "string") return null;
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export function isValidDate(value: string | null | undefined): boolean {
  return parseDateOnly(value) !== null;
}

export function isRequiredFieldPresent(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function identity(value: string): string {
  return value.trim().toUpperCase();
}

function optionalIdentity(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  return identity(value);
}

function optionalNotes(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
}

export function normalizeCreateShipmentInput(input: CreateShipmentInput): CreateShipmentInput {
  return {
    blNumber: identity(input.blNumber),
    shipperName: identity(input.shipperName),
    consigneeName: identity(input.consigneeName),
    eta: input.eta.trim(),
    vesselName: optionalIdentity(input.vesselName),
    voyage: optionalIdentity(input.voyage),
    portOfLoading: optionalIdentity(input.portOfLoading),
    portOfDischarge: optionalIdentity(input.portOfDischarge),
    customNotificationDate: input.customNotificationDate?.trim() || null,
    alias: optionalIdentity(input.alias),
    notes: optionalNotes(input.notes),
  };
}

export function normalizeEditShipmentInput(input: EditShipmentInput): EditShipmentInput {
  const { blNumber: _blNumber, ...normalized } = normalizeCreateShipmentInput({
    ...input,
    blNumber: "IMMUTABLE",
  });
  return normalized;
}

export function validateCreateShipmentInput(input: CreateShipmentInput | null | undefined) {
  const required = ["blNumber", "shipperName", "consigneeName", "eta"] as const;
  const missingFields = required.filter((field) => !isRequiredFieldPresent(input?.[field]));
  return { valid: missingFields.length === 0, missingFields };
}

export function validateEditShipmentInput(input: EditShipmentInput | null | undefined) {
  const required = ["shipperName", "consigneeName", "eta"] as const;
  const missingFields = required.filter((field) => !isRequiredFieldPresent(input?.[field]));
  return { valid: missingFields.length === 0, missingFields };
}

/** Kept as a compatibility name for data-quality callers; create validation is explicit. */
export const validateRequiredFields = validateCreateShipmentInput;

export function createShipment(params: ShipmentParams): Readonly<Shipment> {
  const normalized = normalizeCreateShipmentInput(params);
  const now = new Date().toISOString();
  return Object.freeze({
    id: params.id ?? null,
    shipmentNumber: identity(params.shipmentNumber),
    blNumber: normalized.blNumber,
    shipperName: normalized.shipperName,
    consigneeName: normalized.consigneeName,
    eta: normalized.eta,
    vesselName: normalized.vesselName ?? null,
    voyage: normalized.voyage ?? null,
    portOfLoading: normalized.portOfLoading ?? null,
    portOfDischarge: normalized.portOfDischarge ?? null,
    customNotificationDate: normalized.customNotificationDate ?? null,
    alias: normalized.alias ?? null,
    notes: normalized.notes ?? null,
    stage: params.stage ?? SHIPMENT_STAGE.PRE_ARRIVAL,
    completedAt: params.completedAt ?? null,
    createdAt: params.createdAt ?? now,
    updatedAt: params.updatedAt ?? now,
  });
}

const ENTITY_PREFIXES = new Set([
  "PT", "CV", "UD", "PD", "TB", "FA", "NV", "BV", "LLC", "LTD", "INC",
  "CORP", "CO", "PTE", "SDN", "BHD", "TBK", "PERSERO", "THE",
]);

export function extractConsigneeInitials(consigneeName: string): string {
  const words = consigneeName.trim().toUpperCase().split(/\s+/).filter((word) => word && !ENTITY_PREFIXES.has(word));
  return words.length ? words.map((word) => word[0]).join("").slice(0, 4) : "XX";
}

const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

export function shipmentNumberPrefix(consigneeName: string, date: Date): string {
  return `${extractConsigneeInitials(consigneeName)}${MONTH_ABBR[date.getMonth()]}${String(date.getFullYear()).slice(-2)}`;
}

export function generateShipmentNumber(consigneeName: string, serial: number, date: Date = new Date()): string {
  return `${shipmentNumberPrefix(consigneeName, date)}${String(serial).padStart(3, "0")}`;
}
