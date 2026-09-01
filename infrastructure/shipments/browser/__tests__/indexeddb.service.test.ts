import "fake-indexeddb/auto";
import { createShipment } from "@core/shipments/domain/shipment";
import { ShipmentSequenceExhaustedError } from "@core/shipments/ports/shipment-repository";
import {
  closeShipmentDatabase,
  indexedDbShipmentRepository,
  openShipmentDatabase,
  SHIPMENT_DB_NAME,
  SHIPMENT_STORE_NAME,
} from "../indexeddb.service";

function complete(transaction: IDBTransaction): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  transaction.oncomplete = () => resolve();
  transaction.onabort = () => reject(transaction.error);
  transaction.onerror = () => reject(transaction.error);
  return promise;
}

async function deleteDatabase() {
  closeShipmentDatabase();
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const request = indexedDB.deleteDatabase(SHIPMENT_DB_NAME);
  request.onsuccess = () => resolve();
  request.onerror = () => reject(request.error);
  await promise;
}

async function createVersionOne(records: Record<string, unknown>[]) {
  const { promise, resolve, reject } = Promise.withResolvers<IDBDatabase>();
  const request = indexedDB.open(SHIPMENT_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const store = request.result.createObjectStore(SHIPMENT_STORE_NAME, { keyPath: "id", autoIncrement: true });
    store.createIndex("shipment_number", "shipmentNumber", { unique: true });
    store.createIndex("bl_number", "blNumber", { unique: true });
    store.createIndex("status", "status");
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
  const db = await promise;
  const transaction = db.transaction(SHIPMENT_STORE_NAME, "readwrite");
  for (const record of records) transaction.objectStore(SHIPMENT_STORE_NAME).add(record);
  await complete(transaction);
  db.close();
}

const base = {
  shipmentNumber: "CONAUG26001",
  blNumber: "BL-1",
  shipperName: "SHIPPER",
  consigneeName: "CONSIGNEE",
  eta: "2026-08-28",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
};

describe("indexedDbShipmentRepository", () => {
  beforeEach(deleteDatabase);
  afterAll(deleteDatabase);

  test("migrates version-one active and terminated records in place", async () => {
    await createVersionOne([
      { ...base, id: 1, status: "active" },
      { ...base, id: 2, shipmentNumber: "CONAUG26002", blNumber: "BL-2", status: "terminated" },
    ]);
    await openShipmentDatabase();
    const records = await indexedDbShipmentRepository.listAll();
    expect(records.map(({ id, stage, completedAt }) => ({ id, stage, completedAt }))).toEqual([
      { id: 1, stage: "pre_arrival", completedAt: null },
      { id: 2, stage: "completed", completedAt: base.updatedAt },
    ]);
  });

  test("allocates different suffixes for concurrent creation", async () => {
    const build = (serial: number) => createShipment({ ...base, blNumber: `BL-CONCURRENT-${serial}`, shipmentNumber: `CONAUG26${String(serial).padStart(3, "0")}` });
    const records = await Promise.all([
      indexedDbShipmentRepository.createNext("conaug26", build),
      indexedDbShipmentRepository.createNext("CONAUG26", build),
    ]);
    expect(records.map((record) => record.shipmentNumber).sort()).toEqual(["CONAUG26001", "CONAUG26002"]);
  });

  test("ignores malformed suffixes and rejects suffix 999", async () => {
    const record = createShipment({ ...base, shipmentNumber: "CONAUG26BAD" });
    const { id: _recordId, ...malformedRecord } = record;
    await indexedDbShipmentRepository.importMany([malformedRecord]);
    const build = (serial: number) => createShipment({ ...base, blNumber: `BL-NEW-${serial}`, shipmentNumber: `CONAUG26${String(serial).padStart(3, "0")}` });
    expect((await indexedDbShipmentRepository.createNext("CONAUG26", build)).shipmentNumber).toBe("CONAUG26001");
    const max = createShipment({ ...base, blNumber: "BL-999", shipmentNumber: "CONAUG26999" });
    const { id: _id, ...maxRecord } = max;
    await indexedDbShipmentRepository.importMany([maxRecord]);
    await expect(indexedDbShipmentRepository.createNext("CONAUG26", build)).rejects.toBeInstanceOf(ShipmentSequenceExhaustedError);
  });
});
