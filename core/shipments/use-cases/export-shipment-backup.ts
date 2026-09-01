import type { ShipmentRepository } from "../ports/shipment-repository";
import { errorMessage, type UseCaseResult } from "./result";

export interface ShipmentBackupArtifact {
  filename: string;
  mimeType: "application/json";
  contents: string;
}

export function createExportShipmentBackupUseCase(
  repository: ShipmentRepository,
  clock: () => Date,
) {
  async function execute(): Promise<UseCaseResult<ShipmentBackupArtifact>> {
    try {
      const now = clock();
      const shipments = await repository.listAll();
      return {
        ok: true,
        data: {
          filename: `shipments_backup_${now.toISOString().slice(0, 10)}.json`,
          mimeType: "application/json",
          contents: JSON.stringify({ schemaVersion: 2, exportedAt: now.toISOString(), shipments }),
        },
      };
    } catch (error) {
      return { ok: false, error: { code: "EXPORT_ERROR", message: errorMessage(error, "Failed to export shipment backup") } };
    }
  }
  return { execute };
}
