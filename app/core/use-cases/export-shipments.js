/**
 * Export Shipments Use Case
 * Application Business Rules
 *
 * @description Generates an Excel file from all shipment records, then deletes them on success.
 * If Excel generation fails, records are NOT deleted.
 */

/**
 * Creates the Export Shipments use case
 * @param {import('../ports/shipment-repository.port').ShipmentRepository} repository
 * @param {(rows: Object[], filename: string) => void} downloadFn - xlsx download function (from infrastructure)
 * @param {(shipment: Object) => Object} toExcelRowFn - presenter mapping function
 * @returns {{ execute: () => Promise<{ok: boolean, error?: Object}> }}
 */
export function createExportShipmentsUseCase(repository, downloadFn, toExcelRowFn) {
  /**
   * @returns {Promise<{ok: boolean, error?: Object}>}
   */
  async function execute() {
    try {
      const shipments = await repository.listAll();

      if (shipments.length === 0) {
        return {
          ok: false,
          error: { code: "NO_RECORDS", message: "No shipment records to export" },
        };
      }

      const rows = shipments.map(toExcelRowFn);
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `shipments_export_${timestamp}.xlsx`;

      // This will throw if xlsx generation fails
      downloadFn(rows, filename);

      // Only delete after successful download
      await repository.deleteAll();

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "EXPORT_ERROR",
          message: err?.message || "Failed to export shipment records",
        },
      };
    }
  }

  return { execute };
}
