/**
 * Shipment Presenter
 * Interface Adapters Layer
 *
 * @description Transforms Shipment entities to view models and Excel export rows
 */

import { isNotificationDue } from "../../core/entities/public-holidays";

/**
 * Formats an ISO date string to a locale-friendly display string
 * @param {string|null} isoDate
 * @returns {string}
 */
function formatDateDisplay(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Transforms a Shipment entity to a flat view model safe for rendering
 * @param {Object} shipment
 * @returns {Object}
 */
export function toViewModel(shipment) {
  return {
    id: shipment.id,
    shipmentNumber: shipment.shipmentNumber || "",
    blNumber: shipment.blNumber || "",
    shipperName: shipment.shipperName || "",
    consigneeName: shipment.consigneeName || "",
    vesselName: shipment.vesselName || "—",
    voyage: shipment.voyage || "—",
    portOfLoading: shipment.portOfLoading || "—",
    portOfDischarge: shipment.portOfDischarge || "—",
    etaDisplay: formatDateDisplay(shipment.eta),
    eta: shipment.eta || null,
    customDateDisplay: formatDateDisplay(shipment.customNotificationDate),
    customNotificationDate: shipment.customNotificationDate || null,
    alias: shipment.alias || "",
    notes: shipment.notes || "",
    status: shipment.status,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    isNotificationDue:
      isNotificationDue(shipment.eta) || isNotificationDue(shipment.customNotificationDate),
  };
}

/**
 * Transforms a Shipment entity to an Excel export row
 * @param {Object} shipment
 * @returns {Object}
 */
export function toExcelRow(shipment) {
  return {
    "Shipment Number": shipment.shipmentNumber || "",
    "B/L Number": shipment.blNumber || "",
    "Shipper Name": shipment.shipperName || "",
    "Consignee Name": shipment.consigneeName || "",
    "Vessel Name": shipment.vesselName || "",
    Voyage: shipment.voyage || "",
    "Port of Loading": shipment.portOfLoading || "",
    "Port of Discharge": shipment.portOfDischarge || "",
    ETA: shipment.eta || "",
    "Custom Notification Date": shipment.customNotificationDate || "",
    Alias: shipment.alias || "",
    Notes: shipment.notes || "",
    Status: shipment.status || "",
    "Created At": shipment.createdAt || "",
  };
}

/**
 * Transforms an array of Shipment entities to Excel export rows
 * @param {Object[]} shipments
 * @returns {Object[]}
 */
export function toExcelRows(shipments) {
  return shipments.map(toExcelRow);
}

/**
 * Transforms an array of Shipment entities to view models
 * @param {Object[]} shipments
 * @returns {Object[]}
 */
export function toViewModels(shipments) {
  return shipments.map(toViewModel);
}
