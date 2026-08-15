/**
 * Shipment Repository Port (Interface)
 * Defines the contract for shipment data persistence
 *
 * @description Output port — implemented by the infrastructure layer (IndexedDB service)
 */

/**
 * @typedef {Object} ShipmentRepository
 * @property {(shipment: import('../entities/shipment').Shipment) => Promise<import('../entities/shipment').Shipment>} create
 * @property {(id: number, updates: Partial<import('../entities/shipment').Shipment>) => Promise<import('../entities/shipment').Shipment>} update
 * @property {(id: number) => Promise<void>} terminate
 * @property {(id: number) => Promise<import('../entities/shipment').Shipment|null>} findById
 * @property {(query?: string) => Promise<import('../entities/shipment').Shipment[]>} listActive  - sorted by ETA asc, nulls last
 * @property {() => Promise<number>} countActive
 * @property {() => Promise<import('../entities/shipment').Shipment[]>} listAll  - for export
 * @property {() => Promise<void>} deleteAll  - called after successful export
 */

/**
 * Validates that an object implements the ShipmentRepository interface
 * @param {Object} repo - Object to validate
 * @throws {Error} If repo doesn't implement required methods
 */
export function validateShipmentRepository(repo) {
  const required = [
    "create",
    "update",
    "terminate",
    "findById",
    "listActive",
    "countActive",
    "listAll",
    "deleteAll",
  ];

  for (const method of required) {
    if (typeof repo?.[method] !== "function") {
      throw new Error(`ShipmentRepository must implement "${method}" method`);
    }
  }
}
