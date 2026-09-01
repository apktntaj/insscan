import {
  createShipment,
  generateShipmentNumber,
  isValidDate,
  normalizeCreateShipmentInput,
  validateCreateShipmentInput,
} from "../shipment";

describe("shipment domain", () => {
  test("rejects blank required fields", () => {
    expect(validateCreateShipmentInput({ blNumber: " ", shipperName: "A", consigneeName: "B", eta: "2026-08-28" }))
      .toEqual({ valid: false, missingFields: ["blNumber"] });
  });

  test("generates the documented monthly number", () => {
    expect(generateShipmentNumber("PT Mitra Bersama", 7, new Date(2026, 7, 28))).toBe("MBAUG26007");
  });

  test("normalizes identity fields but preserves notes capitalization", () => {
    const normalized = normalizeCreateShipmentInput({
      blNumber: " bl-1 ", shipperName: " Shipper ", consigneeName: " Consignee ", eta: "2026-08-28", notes: " Keep This ",
    });
    expect(normalized.blNumber).toBe("BL-1");
    expect(normalized.notes).toBe("Keep This");
    expect(createShipment({ ...normalized, shipmentNumber: " conaug26001 " }).shipmentNumber).toBe("CONAUG26001");
  });

  test("validates date-only values without timezone parsing", () => {
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(isValidDate("2026-02-31")).toBe(false);
    expect(isValidDate("2026-8-28")).toBe(false);
  });
});
