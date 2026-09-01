import { createShipment, type Shipment } from "../../domain/shipment";
import type { ShipmentRepository } from "../../ports/shipment-repository";
import { createExportShipmentBackupUseCase } from "../export-shipment-backup";
import { createImportShipmentBackupUseCase, MAX_BACKUP_BYTES } from "../import-shipment-backup";

const shipment = createShipment({
  id: 17,
  shipmentNumber: "CONAUG26001",
  blNumber: "BL-1",
  shipperName: "SHIPPER",
  consigneeName: "CONSIGNEE",
  eta: "2026-08-28",
  stage: "pre_arrival",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
});

function repository(initial = [shipment]): ShipmentRepository & { records: typeof shipment[] } {
  const repo = {
    records: [...initial],
    createNext: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    listAll: jest.fn(async () => [...repo.records]),
    importMany: jest.fn(async (records: readonly Omit<Shipment, "id">[]) => ({
      imported: records.map((record: Omit<Shipment, "id">, index: number) => ({ ...record, id: index + 100 })),
      conflicts: [],
    })),
  } as unknown as ShipmentRepository & { records: typeof shipment[] };
  return repo;
}

describe("shipment backup", () => {
  test("exports schema v2 and imports normalized records without file ids", async () => {
    const source = repository();
    const artifact = await createExportShipmentBackupUseCase(source, () => new Date("2026-08-28T12:00:00.000Z")).execute();
    expect(artifact.ok).toBe(true);
    if (!artifact.ok) return;
    expect(artifact.data.filename).toBe("shipments_backup_2026-08-28.json");

    const target = repository([]);
    const useCase = createImportShipmentBackupUseCase(target);
    const preview = await useCase.inspect(artifact.data.contents);
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    expect(preview.data).toMatchObject({ total: 1, importable: 1, skipped: 0 });
    expect("id" in preview.data.records[0]).toBe(false);
    expect((await useCase.execute(preview.data))).toMatchObject({ ok: true, data: { imported: 1, skipped: 0 } });
  });

  test("rejects malformed and oversized files without mutation", async () => {
    const target = repository([]);
    const useCase = createImportShipmentBackupUseCase(target);
    await expect(useCase.inspect("not-json")).resolves.toMatchObject({ ok: false });
    await expect(useCase.inspect("x".repeat(MAX_BACKUP_BYTES + 1))).resolves.toMatchObject({ ok: false });
    expect(target.importMany).not.toHaveBeenCalled();
  });

  test("marks database and in-file duplicates as conflicts", async () => {
    const target = repository();
    const payload = JSON.stringify({
      schemaVersion: 2,
      exportedAt: "2026-08-28T12:00:00.000Z",
      shipments: [shipment, { ...shipment, id: 99, shipmentNumber: "CONAUG26002", blNumber: "BL-2" }, { ...shipment, id: 100, shipmentNumber: "CONAUG26002", blNumber: "BL-3" }],
    });
    const result = await createImportShipmentBackupUseCase(target).inspect(payload);
    expect(result).toMatchObject({ ok: true, data: { total: 3, importable: 1, skipped: 2 } });
  });
});
