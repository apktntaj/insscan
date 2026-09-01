import type { CreateShipmentInput, EditShipmentInput, ShipmentStage } from "@core/shipments/domain/shipment";
import { createChangeShipmentStageUseCase } from "@core/shipments/use-cases/change-shipment-stage";
import { createCreateShipmentUseCase } from "@core/shipments/use-cases/create-shipment";
import { createEditShipmentUseCase } from "@core/shipments/use-cases/edit-shipment";
import { createExportShipmentBackupUseCase } from "@core/shipments/use-cases/export-shipment-backup";
import { createExportShipmentsUseCase } from "@core/shipments/use-cases/export-shipments";
import {
  createImportShipmentBackupUseCase,
  type BackupImportPreview,
} from "@core/shipments/use-cases/import-shipment-backup";
import { createListShipmentsUseCase, type ShipmentView } from "@core/shipments/use-cases/list-shipments";
import type { ShipmentRepository } from "@core/shipments/ports/shipment-repository";
import { downloadAsExcel } from "@/app/shared/infrastructure/excel/excel.service";
import { indexedDbShipmentRepository } from "@infrastructure/shipments/browser/indexeddb.service";
import { downloadText } from "@infrastructure/shipments/browser/file-download.service";
import { toExcelRow, toViewModels } from "../presenters/shipment.presenter";

export function createShipmentController(
  repository: ShipmentRepository,
  clock: () => Date = () => new Date(),
) {
  const createUseCase = createCreateShipmentUseCase(repository, clock);
  const editUseCase = createEditShipmentUseCase(repository, clock);
  const changeStageUseCase = createChangeShipmentStageUseCase(repository, clock);
  const listUseCase = createListShipmentsUseCase(repository);
  const excelUseCase = createExportShipmentsUseCase(repository, clock, toExcelRow);
  const backupUseCase = createExportShipmentBackupUseCase(repository, clock);
  const importUseCase = createImportShipmentBackupUseCase(repository);

  return {
    createShipment: (input: CreateShipmentInput) => createUseCase.execute(input),
    editShipment: (id: number, input: EditShipmentInput) => editUseCase.execute(id, input),
    changeStage: (id: number, stage: ShipmentStage) => changeStageUseCase.execute(id, stage),
    async listShipments(options: { query?: string; view: ShipmentView }) {
      const result = await listUseCase.execute(options);
      return result.ok ? { ok: true as const, data: toViewModels(result.data) } : result;
    },
    async exportExcel() {
      const result = await excelUseCase.execute();
      if (!result.ok) return result;
      try {
        downloadAsExcel(result.data.rows, result.data.filename);
        return result;
      } catch (error) {
        return { ok: false as const, error: { code: "DOWNLOAD_ERROR", message: error instanceof Error ? error.message : "File Excel gagal diunduh." } };
      }
    },
    async exportBackup() {
      const result = await backupUseCase.execute();
      if (!result.ok) return result;
      try {
        downloadText(result.data);
        return result;
      } catch (error) {
        return { ok: false as const, error: { code: "DOWNLOAD_ERROR", message: error instanceof Error ? error.message : "Backup gagal diunduh." } };
      }
    },
    inspectBackup: (contents: string) => importUseCase.inspect(contents),
    importBackup: (preview: BackupImportPreview) => importUseCase.execute(preview),
  };
}

export const shipmentController = createShipmentController(indexedDbShipmentRepository);
export type ShipmentController = ReturnType<typeof createShipmentController>;
