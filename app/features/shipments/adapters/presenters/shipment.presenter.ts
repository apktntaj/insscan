import {
  parseDateOnly,
  SHIPMENT_STAGE_LABELS,
  type Shipment,
} from "@core/shipments/domain/shipment";

export interface ShipmentViewModel extends Shipment {
  etaDisplay: string;
  customDateDisplay: string;
  completedAtDisplay: string;
  stageLabel: string;
}

export function formatDateDisplay(value: string | null): string {
  if (!value) return "—";
  const dateOnly = parseDateOnly(value);
  const date = dateOnly ?? new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function toViewModel(shipment: Shipment): ShipmentViewModel {
  return {
    ...shipment,
    etaDisplay: formatDateDisplay(shipment.eta),
    customDateDisplay: formatDateDisplay(shipment.customNotificationDate),
    completedAtDisplay: formatDateDisplay(shipment.completedAt),
    stageLabel: SHIPMENT_STAGE_LABELS[shipment.stage],
  };
}

export function toViewModels(shipments: readonly Shipment[]): ShipmentViewModel[] {
  return shipments.map(toViewModel);
}

export function toExcelRow(shipment: Shipment): Record<string, unknown> {
  return {
    "Nomor Shipment": shipment.shipmentNumber,
    "Nomor B/L": shipment.blNumber,
    Shipper: shipment.shipperName,
    Consignee: shipment.consigneeName,
    Kapal: shipment.vesselName ?? "",
    Voyage: shipment.voyage ?? "",
    "Port of Loading": shipment.portOfLoading ?? "",
    "Port of Discharge": shipment.portOfDischarge ?? "",
    ETA: shipment.eta,
    "Tanggal Pengingat": shipment.customNotificationDate ?? "",
    Alias: shipment.alias ?? "",
    Catatan: shipment.notes ?? "",
    Tahap: SHIPMENT_STAGE_LABELS[shipment.stage],
    "Kode Tahap": shipment.stage,
    Dibuat: shipment.createdAt,
    Diperbarui: shipment.updatedAt,
    Diselesaikan: shipment.completedAt ?? "",
  };
}
