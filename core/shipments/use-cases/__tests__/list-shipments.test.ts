import { createShipment, SHIPMENT_STAGE } from "../../domain/shipment";
import type { ShipmentRepository } from "../../ports/shipment-repository";
import { createListShipmentsUseCase } from "../list-shipments";

const base = { blNumber: "BL-1", shipperName: "SHIPPER", consigneeName: "CONSIGNEE", eta: "2026-08-30", createdAt: "2026-08-01T00:00:00Z", updatedAt: "2026-08-01T00:00:00Z" };
const records = [
  createShipment({ ...base, id: 1, shipmentNumber: "CONAUG26001", vesselName: "MERATUS", portOfDischarge: "TANJUNG PRIOK" }),
  createShipment({ ...base, id: 2, shipmentNumber: "CONAUG26002", eta: "2026-08-28" }),
  createShipment({ ...base, id: 3, shipmentNumber: "CONAUG26003", stage: SHIPMENT_STAGE.COMPLETED, completedAt: "2026-08-27T00:00:00Z" }),
  createShipment({ ...base, id: 4, shipmentNumber: "CONAUG26004", stage: SHIPMENT_STAGE.COMPLETED, completedAt: "2026-08-28T00:00:00Z" }),
];
const repository = { listAll: jest.fn(async () => records) } as unknown as ShipmentRepository;
const useCase = createListShipmentsUseCase(repository);

describe("list shipments", () => {
  test("searches shipment, vessel, and port fields", async () => {
    for (const query of ["CONAUG26001", "meratus", "priok"]) {
      const result = await useCase.execute({ query, view: "open" });
      expect(result.ok && result.data.map((record) => record.id)).toEqual([1]);
    }
  });

  test("separates open and completed views with correct sorting", async () => {
    const open = await useCase.execute({ view: "open" });
    const completed = await useCase.execute({ view: "completed" });
    expect(open.ok && open.data.map((record) => record.id)).toEqual([2, 1]);
    expect(completed.ok && completed.data.map((record) => record.id)).toEqual([4, 3]);
  });
});
