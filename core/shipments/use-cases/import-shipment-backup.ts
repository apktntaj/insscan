import {
  createShipment,
  isValidDate,
  SHIPMENT_STAGE,
  type Shipment,
  type ShipmentStage,
} from "../domain/shipment";
import type { ShipmentConflict, ShipmentRepository } from "../ports/shipment-repository";
import { errorMessage, type UseCaseResult } from "./result";

export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export interface BackupImportPreview {
  records: readonly Omit<Shipment, "id">[];
  total: number;
  importable: number;
  skipped: number;
  conflicts: readonly ShipmentConflict[];
}

export interface BackupImportResult {
  imported: number;
  skipped: number;
  conflicts: ShipmentConflict[];
}

const stages = new Set<ShipmentStage>(Object.values(SHIPMENT_STAGE));
const optionalFields = ["vesselName", "voyage", "portOfLoading", "portOfDischarge", "customNotificationDate", "alias", "notes"] as const;

function isIsoInstant(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function parseRecord(value: unknown): Omit<Shipment, "id"> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const requiredStrings = ["shipmentNumber", "blNumber", "shipperName", "consigneeName", "eta"] as const;
  if (requiredStrings.some((field) => typeof record[field] !== "string" || (record[field] as string).trim() === "")) return null;
  if (!isValidDate(record.eta as string)) return null;
  if (optionalFields.some((field) => record[field] !== null && typeof record[field] !== "string")) return null;
  if (record.customNotificationDate !== null && !isValidDate(record.customNotificationDate as string)) return null;
  if (typeof record.stage !== "string" || !stages.has(record.stage as ShipmentStage)) return null;
  if (!isIsoInstant(record.createdAt) || !isIsoInstant(record.updatedAt)) return null;
  if (record.completedAt !== null && !isIsoInstant(record.completedAt)) return null;
  if (record.stage === SHIPMENT_STAGE.COMPLETED && record.completedAt === null) return null;
  if (record.stage !== SHIPMENT_STAGE.COMPLETED && record.completedAt !== null) return null;

  const normalized = createShipment({
    shipmentNumber: record.shipmentNumber as string,
    blNumber: record.blNumber as string,
    shipperName: record.shipperName as string,
    consigneeName: record.consigneeName as string,
    eta: record.eta as string,
    vesselName: record.vesselName as string | null,
    voyage: record.voyage as string | null,
    portOfLoading: record.portOfLoading as string | null,
    portOfDischarge: record.portOfDischarge as string | null,
    customNotificationDate: record.customNotificationDate as string | null,
    alias: record.alias as string | null,
    notes: record.notes as string | null,
    stage: record.stage as ShipmentStage,
    completedAt: record.completedAt as string | null,
    createdAt: record.createdAt as string,
    updatedAt: record.updatedAt as string,
  });
  const { id: _id, ...withoutId } = normalized;
  return withoutId;
}

export function createImportShipmentBackupUseCase(repository: ShipmentRepository) {
  async function inspect(jsonText: string): Promise<UseCaseResult<BackupImportPreview>> {
    if (new TextEncoder().encode(jsonText).byteLength > MAX_BACKUP_BYTES) {
      return { ok: false, error: { code: "FILE_TOO_LARGE", message: "Backup melebihi batas 10 MiB." } };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return { ok: false, error: { code: "INVALID_BACKUP", message: "File backup bukan JSON yang valid." } };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: { code: "INVALID_BACKUP", message: "Struktur backup tidak valid." } };
    }
    const backup = parsed as Record<string, unknown>;
    if (backup.schemaVersion !== 2 || !isIsoInstant(backup.exportedAt) || !Array.isArray(backup.shipments)) {
      return { ok: false, error: { code: "UNSUPPORTED_BACKUP", message: "Hanya backup schema version 2 yang didukung." } };
    }
    const records = backup.shipments.map(parseRecord);
    if (records.some((record) => record === null)) {
      return { ok: false, error: { code: "INVALID_BACKUP", message: "Satu atau lebih record shipment tidak valid." } };
    }

    try {
      const existing = await repository.listAll();
      const shipmentNumbers = new Set(existing.map((record) => record.shipmentNumber.trim().toUpperCase()));
      const blNumbers = new Set(existing.map((record) => record.blNumber.trim().toUpperCase()));
      const conflicts: ShipmentConflict[] = [];
      for (const record of records as Omit<Shipment, "id">[]) {
        if (shipmentNumbers.has(record.shipmentNumber) || blNumbers.has(record.blNumber)) {
          conflicts.push({ shipmentNumber: record.shipmentNumber, blNumber: record.blNumber });
        } else {
          shipmentNumbers.add(record.shipmentNumber);
          blNumbers.add(record.blNumber);
        }
      }
      return {
        ok: true,
        data: {
          records: records as Omit<Shipment, "id">[],
          total: records.length,
          importable: records.length - conflicts.length,
          skipped: conflicts.length,
          conflicts,
        },
      };
    } catch (error) {
      return { ok: false, error: { code: "STORAGE_ERROR", message: errorMessage(error, "Failed to inspect shipment backup") } };
    }
  }

  async function execute(preview: BackupImportPreview): Promise<UseCaseResult<BackupImportResult>> {
    try {
      const result = await repository.importMany(preview.records);
      return {
        ok: true,
        data: { imported: result.imported.length, skipped: result.conflicts.length, conflicts: result.conflicts },
      };
    } catch (error) {
      return { ok: false, error: { code: "STORAGE_ERROR", message: errorMessage(error, "Failed to restore shipment backup") } };
    }
  }
  return { inspect, execute };
}
