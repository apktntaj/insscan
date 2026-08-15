/**
 * List Shipments Use Case
 * Application Business Rules
 *
 * @description Returns active shipments sorted by ETA ascending (nulls last),
 * with optional case-insensitive search across key fields
 */

/**
 * Creates the List Shipments use case
 * @param {import('../ports/shipment-repository.port').ShipmentRepository} repository
 * @returns {{ execute: (query?: string) => Promise<{ok: boolean, data?: Object[], error?: Object}> }}
 */
export function createListShipmentsUseCase(repository) {
  /**
   * @param {string} [query] - Optional search string
   * @returns {Promise<{ok: boolean, data?: Object[], error?: Object}>}
   */
  async function execute(query) {
    try {
      let shipments = await repository.listActive();

      // Filter by search query
      if (query && query.trim().length > 0) {
        const q = query.trim().toLowerCase();
        shipments = shipments.filter((s) => {
          return (
            (s.blNumber || "").toLowerCase().includes(q) ||
            (s.shipperName || "").toLowerCase().includes(q) ||
            (s.consigneeName || "").toLowerCase().includes(q) ||
            (s.alias || "").toLowerCase().includes(q)
          );
        });
      }

      // Sort by ETA ascending, nulls last
      shipments = [...shipments].sort((a, b) => {
        if (!a.eta && !b.eta) return 0;
        if (!a.eta) return 1;
        if (!b.eta) return -1;
        return new Date(a.eta) - new Date(b.eta);
      });

      return { ok: true, data: shipments };
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE_ERROR",
          message: err?.message || "Failed to list shipment records",
        },
      };
    }
  }

  return { execute };
}
