import type { Shipment } from "../domain/shipment";

export interface ShipmentConflict {
  shipmentNumber: string;
  blNumber: string;
}

export class ShipmentSequenceExhaustedError extends Error {
  constructor(prefix: string) {
    super(`Shipment sequence for ${prefix} has reached 999`);
    this.name = "ShipmentSequenceExhaustedError";
  }
}

/** Persistence output port. Number allocation and imports are atomic operations. */
export interface ShipmentRepository {
  createNext(prefix: string, build: (serial: number) => Shipment): Promise<Shipment>;
  update(id: number, updates: Partial<Shipment>): Promise<Shipment>;
  findById(id: number): Promise<Shipment | null>;
  listAll(): Promise<Shipment[]>;
  importMany(records: readonly Omit<Shipment, "id">[]): Promise<{
    imported: Shipment[];
    conflicts: ShipmentConflict[];
  }>;
}

export function validateShipmentRepository(
  repository: Partial<ShipmentRepository> | null | undefined,
): asserts repository is ShipmentRepository {
  const required: ReadonlyArray<keyof ShipmentRepository> = [
    "createNext",
    "update",
    "findById",
    "listAll",
    "importMany",
  ];
  for (const method of required) {
    if (typeof repository?.[method] !== "function") {
      throw new Error(`ShipmentRepository must implement "${method}" method`);
    }
  }
}
