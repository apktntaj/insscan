import { createShipment, SHIPMENT_STAGE, type ShipmentStage } from "../../domain/shipment";
import { evaluateDueReminders } from "../evaluate-due-reminders";

const make = (
  id: number,
  eta: string,
  customNotificationDate: string | null = null,
  stage: ShipmentStage = SHIPMENT_STAGE.PRE_ARRIVAL,
) => createShipment({
  id,
  shipmentNumber: `CONAUG26${String(id).padStart(3, "0")}`,
  blNumber: `BL-${id}`,
  shipperName: "SHIPPER",
  consigneeName: "CONSIGNEE",
  eta,
  customNotificationDate,
  stage,
});

describe("evaluateDueReminders", () => {
  test("returns exact due reasons in operational order", () => {
    const result = evaluateDueReminders([
      make(1, "2026-09-01", "2026-08-28"),
      make(2, "2026-08-29", "2026-08-27"),
      make(3, "2026-08-29"),
      make(4, "invalid", "invalid"),
      make(5, "2026-08-29", "2026-08-27", SHIPMENT_STAGE.COMPLETED),
    ], new Date(2026, 7, 28, 12));
    expect(result).toEqual([
      { shipmentId: 2, reason: "custom_due", targetDate: "2026-08-27", daysOverdue: 1 },
      { shipmentId: 1, reason: "custom_due", targetDate: "2026-08-28", daysOverdue: 0 },
      { shipmentId: 2, reason: "eta_tomorrow", targetDate: "2026-08-29", daysOverdue: 0 },
      { shipmentId: 3, reason: "eta_tomorrow", targetDate: "2026-08-29", daysOverdue: 0 },
    ]);
  });
});
