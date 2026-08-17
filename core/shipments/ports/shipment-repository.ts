import type { Shipment } from "../domain/shipment";

/** Persistence output port; IndexedDB and future databases implement this. */
export interface ShipmentRepository {
  create(shipment: Shipment): Promise<Shipment>;
  update(id: number, updates: Partial<Shipment>): Promise<Shipment>;
  terminate(id: number): Promise<void>;
  findById(id: number): Promise<Shipment | null>;
  listActive(query?: string): Promise<Shipment[]>;
  countActive(): Promise<number>;
  listAll(): Promise<Shipment[]>;
  deleteAll(): Promise<void>;
}

export function validateShipmentRepository(
  repository: Partial<ShipmentRepository> | null | undefined,
): asserts repository is ShipmentRepository {
  const required: ReadonlyArray<keyof ShipmentRepository> = [
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
    if (typeof repository?.[method] !== "function") {
      throw new Error(`ShipmentRepository must implement "${method}" method`);
    }
  }
}
