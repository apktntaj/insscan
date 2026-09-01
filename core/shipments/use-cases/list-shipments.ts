import { parseDateOnly, SHIPMENT_STAGE, type Shipment } from "../domain/shipment";
import type { ShipmentRepository } from "../ports/shipment-repository";
import { errorMessage, type UseCaseResult } from "./result";

export type ShipmentView = "open" | "completed";

const SEARCH_FIELDS: ReadonlyArray<keyof Pick<Shipment,
  "shipmentNumber" | "blNumber" | "shipperName" | "consigneeName" | "alias" |
  "vesselName" | "voyage" | "portOfLoading" | "portOfDischarge"
>> = [
  "shipmentNumber", "blNumber", "shipperName", "consigneeName", "alias",
  "vesselName", "voyage", "portOfLoading", "portOfDischarge",
];

export function createListShipmentsUseCase(repository: ShipmentRepository) {
  async function execute({ query, view }: { query?: string; view: ShipmentView }): Promise<UseCaseResult<Shipment[]>> {
    try {
      let shipments = (await repository.listAll()).filter((shipment) =>
        view === "completed"
          ? shipment.stage === SHIPMENT_STAGE.COMPLETED
          : shipment.stage !== SHIPMENT_STAGE.COMPLETED,
      );
      const normalizedQuery = query?.trim().toLocaleLowerCase();
      if (normalizedQuery) {
        shipments = shipments.filter((shipment) => SEARCH_FIELDS.some((field) =>
          (shipment[field] ?? "").toLocaleLowerCase().includes(normalizedQuery),
        ));
      }
      shipments.sort((a, b) => {
        if (view === "completed") {
          const aTime = a.completedAt ? Date.parse(a.completedAt) : Number.NEGATIVE_INFINITY;
          const bTime = b.completedAt ? Date.parse(b.completedAt) : Number.NEGATIVE_INFINITY;
          return bTime - aTime;
        }
        const aDate = parseDateOnly(a.eta)?.getTime() ?? Number.POSITIVE_INFINITY;
        const bDate = parseDateOnly(b.eta)?.getTime() ?? Number.POSITIVE_INFINITY;
        return aDate - bDate;
      });
      return { ok: true, data: shipments };
    } catch (error) {
      return { ok: false, error: { code: "STORAGE_ERROR", message: errorMessage(error, "Failed to list shipment records") } };
    }
  }
  return { execute };
}
