"use client";

import { CheckCircle2Icon, PencilIcon, RouteIcon } from "lucide-react";
import type { AlertResult } from "@core/shipments/use-cases/evaluate-data-quality-alerts";
import { SHIPMENT_STAGE } from "@core/shipments/domain/shipment";
import type { ShipmentViewModel } from "../../adapters/presenters/shipment.presenter";
import AlertBadge from "./AlertBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-medium">{value || "—"}</dd></div>;
}

export default function ShipmentDetailsSheet({
  shipment,
  alertResult,
  open,
  onOpenChange,
  onEdit,
  onChangeStage,
  onComplete,
}: {
  shipment: ShipmentViewModel | null;
  alertResult?: AlertResult;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (shipment: ShipmentViewModel) => void;
  onChangeStage: (shipment: ShipmentViewModel) => void;
  onComplete: (shipment: ShipmentViewModel) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{shipment?.shipmentNumber ?? "Detail shipment"}</SheetTitle>
          <SheetDescription>Informasi read-only. Gunakan tindakan eksplisit untuk mengubah data atau tahap.</SheetDescription>
        </SheetHeader>
        {shipment && (
          <div className="flex flex-col gap-6 px-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{shipment.stageLabel}</Badge>
              {alertResult && <AlertBadge alerts={alertResult.alerts} highestRisk={alertResult.highestRisk} />}
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Nomor B/L" value={shipment.blNumber} />
              <Detail label="Alias" value={shipment.alias} />
              <Detail label="Shipper" value={shipment.shipperName} />
              <Detail label="Consignee" value={shipment.consigneeName} />
            </dl>
            <Separator />
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Kapal" value={shipment.vesselName} />
              <Detail label="Voyage" value={shipment.voyage} />
              <Detail label="Port of loading" value={shipment.portOfLoading} />
              <Detail label="Port of discharge" value={shipment.portOfDischarge} />
              <Detail label="ETA" value={shipment.etaDisplay} />
              <Detail label="Tanggal pengingat" value={shipment.customDateDisplay} />
            </dl>
            {alertResult && (
              <div className="flex flex-col gap-3">
                <h3 className="font-medium">Peringatan aktif</h3>
                {alertResult.alerts.map((alert) => (
                  <div key={alert.ruleId} className="rounded-lg border p-3">
                    <p className="font-medium">{alert.message}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Saran: {alert.suggestedAction}</p>
                  </div>
                ))}
              </div>
            )}
            <Separator />
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Catatan" value={shipment.notes} />
              <Detail label="Dibuat" value={new Date(shipment.createdAt).toLocaleString("id-ID")} />
              <Detail label="Diperbarui" value={new Date(shipment.updatedAt).toLocaleString("id-ID")} />
              <Detail label="Diselesaikan" value={shipment.completedAt ? new Date(shipment.completedAt).toLocaleString("id-ID") : "—"} />
            </dl>
          </div>
        )}
        {shipment && (
          <SheetFooter>
            <Button variant="outline" onClick={() => onEdit(shipment)}><PencilIcon data-icon="inline-start" />Edit</Button>
            <Button variant="outline" onClick={() => onChangeStage(shipment)}><RouteIcon data-icon="inline-start" />Ubah tahap</Button>
            {shipment.stage !== SHIPMENT_STAGE.COMPLETED && (
              <Button onClick={() => onComplete(shipment)}><CheckCircle2Icon data-icon="inline-start" />Tandai selesai</Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
