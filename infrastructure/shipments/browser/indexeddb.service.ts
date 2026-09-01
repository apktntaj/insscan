import { SHIPMENT_STAGE, type Shipment } from "@core/shipments/domain/shipment";
import {
  ShipmentSequenceExhaustedError,
  type ShipmentConflict,
  type ShipmentRepository,
} from "@core/shipments/ports/shipment-repository";

export const SHIPMENT_DB_NAME = "shipment_management_db";
export const SHIPMENT_DB_VERSION = 2;
export const SHIPMENT_STORE_NAME = "shipments";

let database: IDBDatabase | null = null;
let opening: Promise<IDBDatabase> | null = null;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  const { promise, resolve, reject } = Promise.withResolvers<T>();
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  return promise;
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  transaction.oncomplete = () => resolve();
  transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  return promise;
}

function abortSafely(transaction: IDBTransaction): void {
  try {
    transaction.abort();
  } catch {
    // Transaction already completed or aborted.
  }
}

function normalizeLegacyRecord(record: Record<string, unknown>, migrationTimestamp: string) {
  const completed = record.status === "terminated";
  return {
    ...record,
    shipmentNumber: typeof record.shipmentNumber === "string" ? record.shipmentNumber : "",
    blNumber: typeof record.blNumber === "string" ? record.blNumber : "",
    shipperName: typeof record.shipperName === "string" ? record.shipperName : "",
    consigneeName: typeof record.consigneeName === "string" ? record.consigneeName : "",
    vesselName: typeof record.vesselName === "string" ? record.vesselName : null,
    voyage: typeof record.voyage === "string" ? record.voyage : null,
    portOfLoading: typeof record.portOfLoading === "string" ? record.portOfLoading : null,
    portOfDischarge: typeof record.portOfDischarge === "string" ? record.portOfDischarge : null,
    eta: typeof record.eta === "string" ? record.eta : "",
    customNotificationDate: typeof record.customNotificationDate === "string" ? record.customNotificationDate : null,
    alias: typeof record.alias === "string" ? record.alias : null,
    notes: typeof record.notes === "string" ? record.notes : null,
    stage: completed ? SHIPMENT_STAGE.COMPLETED : SHIPMENT_STAGE.PRE_ARRIVAL,
    completedAt: completed
      ? (typeof record.updatedAt === "string" ? record.updatedAt : migrationTimestamp)
      : null,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : migrationTimestamp,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : migrationTimestamp,
    status: undefined,
  };
}

export function openShipmentDatabase(): Promise<IDBDatabase> {
  if (database) return Promise.resolve(database);
  if (opening) return opening;
  const { promise, resolve, reject } = Promise.withResolvers<IDBDatabase>();
  opening = promise;
  const request = indexedDB.open(SHIPMENT_DB_NAME, SHIPMENT_DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const transaction = request.transaction;
      if (!transaction) return;
      let store: IDBObjectStore;
      if (!db.objectStoreNames.contains(SHIPMENT_STORE_NAME)) {
        store = db.createObjectStore(SHIPMENT_STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("shipment_number", "shipmentNumber", { unique: true });
        store.createIndex("bl_number", "blNumber", { unique: true });
        store.createIndex("eta", "eta");
        store.createIndex("alias", "alias");
        store.createIndex("custom_notification_date", "customNotificationDate");
      } else {
        store = transaction.objectStore(SHIPMENT_STORE_NAME);
      }
      if (!store.indexNames.contains("stage")) store.createIndex("stage", "stage");
      if (store.indexNames.contains("status")) store.deleteIndex("status");

      if (event.oldVersion < 2 && event.oldVersion > 0) {
        const migrationTimestamp = new Date().toISOString();
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          const migrated = normalizeLegacyRecord(cursor.value as Record<string, unknown>, migrationTimestamp);
          delete migrated.status;
          cursor.update(migrated);
          cursor.continue();
        };
      }
    };
    request.onsuccess = () => {
      database = request.result;
      database.onversionchange = () => {
        database?.close();
        database = null;
        opening = null;
      };
      opening = null;
      resolve(database);
    };
    request.onerror = () => {
      opening = null;
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };
    request.onblocked = () => {
      opening = null;
      reject(new Error("IndexedDB upgrade blocked by another open tab"));
    };
  return promise;
}

async function listAll(): Promise<Shipment[]> {
  const db = await openShipmentDatabase();
  const transaction = db.transaction(SHIPMENT_STORE_NAME, "readonly");
  const request = transaction.objectStore(SHIPMENT_STORE_NAME).getAll();
  const records = await requestResult(request) as Shipment[];
  await transactionComplete(transaction);
  return records;
}

async function findById(id: number): Promise<Shipment | null> {
  const db = await openShipmentDatabase();
  const transaction = db.transaction(SHIPMENT_STORE_NAME, "readonly");
  const record = await requestResult(transaction.objectStore(SHIPMENT_STORE_NAME).get(id)) as Shipment | undefined;
  await transactionComplete(transaction);
  return record ?? null;
}

async function update(id: number, updates: Partial<Shipment>): Promise<Shipment> {
  const db = await openShipmentDatabase();
  const transaction = db.transaction(SHIPMENT_STORE_NAME, "readwrite");
  const store = transaction.objectStore(SHIPMENT_STORE_NAME);
  const existing = await requestResult(store.get(id)) as Shipment | undefined;
  if (!existing) {
    transaction.abort();
    throw new Error(`Shipment ${id} not found`);
  }
  const updated = { ...existing, ...updates, id };
  await requestResult(store.put(updated));
  await transactionComplete(transaction);
  return updated;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function createNext(prefixInput: string, build: (serial: number) => Shipment): Promise<Shipment> {
  const prefix = prefixInput.trim().toUpperCase();
  const db = await openShipmentDatabase();
  const transaction = db.transaction(SHIPMENT_STORE_NAME, "readwrite");
  const store = transaction.objectStore(SHIPMENT_STORE_NAME);
  try {
    const existing = await requestResult(store.getAll()) as Shipment[];
    const pattern = new RegExp(`^${escapeRegExp(prefix)}(\\d{3})$`);
    let maximum = 0;
    for (const shipment of existing) {
      const match = pattern.exec(shipment.shipmentNumber.toUpperCase());
      if (match) maximum = Math.max(maximum, Number.parseInt(match[1], 10));
    }
    if (maximum >= 999) {
      transaction.abort();
      throw new ShipmentSequenceExhaustedError(prefix);
    }
    const shipment = build(maximum + 1);
    const { id: _id, ...record } = shipment;
    const id = await requestResult(store.add(record)) as IDBValidKey;
    await transactionComplete(transaction);
    return { ...shipment, id: Number(id) };
  } catch (error) {
    abortSafely(transaction);
    throw error;
  }
}

async function importMany(records: readonly Omit<Shipment, "id">[]): Promise<{
  imported: Shipment[];
  conflicts: ShipmentConflict[];
}> {
  const db = await openShipmentDatabase();
  const transaction = db.transaction(SHIPMENT_STORE_NAME, "readwrite");
  const store = transaction.objectStore(SHIPMENT_STORE_NAME);
  const existing = await requestResult(store.getAll()) as Shipment[];
  const shipmentNumbers = new Set(existing.map((record) => record.shipmentNumber.trim().toUpperCase()));
  const blNumbers = new Set(existing.map((record) => record.blNumber.trim().toUpperCase()));
  const imported: Shipment[] = [];
  const conflicts: ShipmentConflict[] = [];
  try {
    for (const record of records) {
      const shipmentNumber = record.shipmentNumber.trim().toUpperCase();
      const blNumber = record.blNumber.trim().toUpperCase();
      if (shipmentNumbers.has(shipmentNumber) || blNumbers.has(blNumber)) {
        conflicts.push({ shipmentNumber, blNumber });
        continue;
      }
      const id = await requestResult(store.add({ ...record, shipmentNumber, blNumber })) as IDBValidKey;
      shipmentNumbers.add(shipmentNumber);
      blNumbers.add(blNumber);
      imported.push({ ...record, shipmentNumber, blNumber, id: Number(id) });
    }
    await transactionComplete(transaction);
    return { imported, conflicts };
  } catch (error) {
    abortSafely(transaction);
    throw error;
  }
}

export const indexedDbShipmentRepository: ShipmentRepository = {
  createNext,
  update,
  findById,
  listAll,
  importMany,
};

/** Test-only lifecycle hook; closes cached handles without deleting user data. */
export function closeShipmentDatabase(): void {
  database?.close();
  database = null;
  opening = null;
}
