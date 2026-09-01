import type { AlertResult } from "@core/shipments/use-cases/evaluate-data-quality-alerts";
import type { ShipmentViewModel } from "../../adapters/presenters/shipment.presenter";
import AlertBadge from "./AlertBadge";
import { Button } from "@/components/ui/button";

export default function ActionableList({ shipments, alertsByShipmentId, onOpen }: { shipments: readonly ShipmentViewModel[]; alertsByShipmentId: Map<number, AlertResult>; onOpen: (shipment: ShipmentViewModel) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {shipments.map((shipment) => {
        const alert = shipment.id === null ? undefined : alertsByShipmentId.get(shipment.id);
        return <Button key={shipment.id} type="button" variant="outline" className="h-auto justify-between" onClick={() => onOpen(shipment)}><span>{shipment.shipmentNumber}</span>{alert && <AlertBadge alerts={alert.alerts} highestRisk={alert.highestRisk} />}</Button>;
      })}
    </div>
  );
}
