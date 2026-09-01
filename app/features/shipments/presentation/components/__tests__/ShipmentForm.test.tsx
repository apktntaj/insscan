/** @jest-environment jsdom */
import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ShipmentForm from "../ShipmentForm";

jest.mock("@/app/features/bl-extraction/infrastructure/usage-tracker.service", () => ({
  createUsageTrackerService: () => ({ canExtract: jest.fn(), incrementUsage: jest.fn() }),
}));
jest.mock("@/app/features/bl-extraction/infrastructure/pdf-parser.service", () => ({ parsePDF: jest.fn() }));
jest.mock("@/app/features/bl-extraction/infrastructure/bl-extraction-api.service", () => ({ extractBlViaApi: jest.fn() }));
jest.mock("@/app/features/bl-extraction/adapters/form-filler.service", () => ({ toFormDataFromGemini: jest.fn() }));

describe("ShipmentForm", () => {
  test("focuses the first invalid field", async () => {
    render(<ShipmentForm isOpen onClose={jest.fn()} onSubmit={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Buat shipment" }));
    await waitFor(() => expect(screen.getByLabelText(/Nomor B\/L/)).toHaveFocus());
    expect(screen.getByText("Nomor B/L wajib diisi.")).toBeInTheDocument();
  });

  test("recovers from a thrown submit without closing", async () => {
    const onClose = jest.fn();
    render(<ShipmentForm isOpen onClose={onClose} onSubmit={jest.fn(async () => { throw new Error("storage down"); })} />);
    fireEvent.change(screen.getByLabelText(/Nomor B\/L/), { target: { value: "BL-1" } });
    fireEvent.change(screen.getByLabelText(/Nama shipper/), { target: { value: "SHIPPER" } });
    fireEvent.change(screen.getByLabelText(/Nama consignee/), { target: { value: "CONSIGNEE" } });
    fireEvent.change(screen.getByLabelText(/ETA/), { target: { value: "2026-08-28" } });
    fireEvent.click(screen.getByRole("button", { name: "Buat shipment" }));
    expect(await screen.findByText("storage down")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buat shipment" })).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
