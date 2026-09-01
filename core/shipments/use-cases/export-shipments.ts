import type { Shipment } from "../domain/shipment";
import type { ShipmentRepository } from "../ports/shipment-repository";
import { errorMessage, type UseCaseResult } from "./result";

type ExportRow = Record<string, unknown>;
export interface ShipmentExcelArtifact {
  filename: string;
  rows: ExportRow[];
}

export function createExportShipmentsUseCase(
  repository: ShipmentRepository,
  clock: () => Date,
  toExcelRow: (shipment: Shipment) => ExportRow,
) {
  async function execute(): Promise<UseCaseResult<ShipmentExcelArtifact>> {
    try {
      const shipments = await repository.listAll();
      if (shipments.length === 0) {
        return { ok: false, error: { code: "NO_RECORDS", message: "No shipment records to export" } };
      }
      return {
        ok: true,
        data: {
          filename: `shipments_export_${clock().toISOString().slice(0, 10)}.xlsx`,
          rows: shipments.map(toExcelRow),
        },
      };
    } catch (error) {
      return { ok: false, error: { code: "EXPORT_ERROR", message: errorMessage(error, "Failed to export shipment records") } };
    }
  }
  return { execute };
}
