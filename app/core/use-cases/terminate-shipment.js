/**
 * Terminate Shipment Use Case
 * Application Business Rules
 *
 * @description Marks a shipment as terminated and removes it from the active list
 */

/**
 * Creates the Terminate Shipment use case
 * @param {import('../ports/shipment-repository.port').ShipmentRepository} repository
 * @returns {{ execute: (id: number) => Promise<{ok: boolean, error?: Object}> }}
 */
export function createTerminateShipmentUseCase(repository) {
  /**
   * @param {number} id
   * @returns {Promise<{ok: boolean, error?: Object}>}
   */
  async function execute(id) {
    if (!id && id !== 0) {
      return { ok: false, error: { code: "INVALID_ID", message: "Shipment id is required" } };
    }

    try {
      const existing = await repository.findById(id);
      if (!existing) {
        return { ok: false, error: { code: "NOT_FOUND", message: `Shipment ${id} not found` } };
      }
      if (existing.status === "terminated") {
        return {
          ok: false,
          error: { code: "ALREADY_TERMINATED", message: `Shipment ${id} is already terminated` },
        };
      }

      await repository.terminate(id);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE_ERROR",
          message: err?.message || "Failed to terminate shipment record",
        },
      };
    }
  }

  return { execute };
}
