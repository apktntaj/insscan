/**
 * IndexedDB Service
 * Infrastructure Layer — Storage adapter
 *
 * @description Implements ShipmentRepository port using browser IndexedDB.
 * Database: shipment_management_db v1, object store: shipments
 */

import { SHIPMENT_STATUS } from "../../core/entities/shipment";

const DB_NAME = "shipment_management_db";
const DB_VERSION = 1;
const STORE_NAME = "shipments";

/** @type {IDBDatabase|null} */
let _db = null;

/**
 * Opens (or creates) the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function openDb() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        store.createIndex("shipment_number", "shipmentNumber", { unique: true });
        store.createIndex("bl_number", "blNumber", { unique: true });
        store.createIndex("eta", "eta", { unique: false });
        store.createIndex("alias", "alias", { unique: false });
        store.createIndex("custom_notification_date", "customNotificationDate", { unique: false });
        store.createIndex("status", "status", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      _db = event.target.result;
      resolve(_db);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to open IndexedDB: ${event.target.error?.message}`));
    };
  });
}

/**
 * Wraps an IDBRequest in a Promise
 * @template T
 * @param {IDBRequest} request
 * @returns {Promise<T>}
 */
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(request.error?.message || "IndexedDB request failed"));
  });
}

/**
 * Creates a new shipment record
 * @param {Object} shipment
 * @returns {Promise<Object>}
 */
async function create(shipment) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Remove id so autoIncrement assigns one
    const { id: _id, ...data } = shipment;
    const request = store.add(data);

    request.onsuccess = () => {
      const newId = request.result;
      // Read back the saved record
      const getRequest = store.get(newId);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(new Error("Failed to read back created shipment"));
    };

    request.onerror = () => {
      const err = request.error;
      if (err?.name === "ConstraintError") {
        reject(new Error("CONSTRAINT_ERROR: shipment number or B/L number already exists"));
      } else {
        reject(new Error(err?.message || "Failed to create shipment"));
      }
    };
  });
}

/**
 * Updates mutable fields of an existing shipment
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
async function update(id, updates) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (!existing) {
        reject(new Error(`Shipment ${id} not found`));
        return;
      }

      const updated = { ...existing, ...updates, id };
      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve(updated);
      putRequest.onerror = () => reject(new Error(putRequest.error?.message || "Failed to update shipment"));
    };

    getRequest.onerror = () => reject(new Error(getRequest.error?.message || "Failed to find shipment"));
  });
}

/**
 * Marks a shipment as terminated
 * @param {number} id
 * @returns {Promise<void>}
 */
async function terminate(id) {
  await update(id, { status: SHIPMENT_STATUS.TERMINATED, updatedAt: new Date().toISOString() });
}

/**
 * Finds a shipment by id (any status)
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function findById(id) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const result = await promisifyRequest(store.get(id));
  return result ?? null;
}

/**
 * Lists all active shipments (status === 'active')
 * @returns {Promise<Object[]>}
 */
async function listActive() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("status");
    const request = index.getAll(SHIPMENT_STATUS.ACTIVE);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error(request.error?.message || "Failed to list active shipments"));
  });
}

/**
 * Counts active shipments
 * @returns {Promise<number>}
 */
async function countActive() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("status");
    const request = index.count(SHIPMENT_STATUS.ACTIVE);
    request.onsuccess = () => resolve(request.result || 0);
    request.onerror = () => reject(new Error(request.error?.message || "Failed to count active shipments"));
  });
}

/**
 * Lists all shipments regardless of status (for export)
 * @returns {Promise<Object[]>}
 */
async function listAll() {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const result = await promisifyRequest(store.getAll());
  return result || [];
}

/**
 * Deletes all shipment records (called after successful export)
 * @returns {Promise<void>}
 */
async function deleteAll() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(request.error?.message || "Failed to delete all shipments"));
  });
}

/**
 * ShipmentRepository implementation backed by IndexedDB
 * Implements the ShipmentRepository port
 */
export const indexedDbShipmentRepository = {
  create,
  update,
  terminate,
  findById,
  listActive,
  countActive,
  listAll,
  deleteAll,
};
