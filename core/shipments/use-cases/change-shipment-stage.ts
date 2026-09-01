import { SHIPMENT_STAGE, type Shipment, type ShipmentStage } from "../domain/shipment";
import type { ShipmentRepository } from "../ports/shipment-repository";
import { errorMessage, type UseCaseResult } from "./result";

export function createChangeShipmentStageUseCase(
  repository: ShipmentRepository,
  clock: () => Date = () => new Date(),
) {
  async function execute(id: number, stage: ShipmentStage): Promise<UseCaseResult<Shipment>> {
    try {
      const existing = await repository.findById(id);
      if (!existing) {
        return { ok: false, error: { code: "NOT_FOUND", message: "Shipment tidak ditemukan." } };
      }
      if (existing.stage === stage) return { ok: true, data: existing };
      const updatedAt = clock().toISOString();
      return {
        ok: true,
        data: await repository.update(id, {
          stage,
          completedAt: stage === SHIPMENT_STAGE.COMPLETED ? updatedAt : null,
          updatedAt,
        }),
      };
    } catch (error) {
      return { ok: false, error: { code: "STORAGE_ERROR", message: errorMessage(error, "Failed to change shipment stage") } };
    }
  }
  return { execute };
}
