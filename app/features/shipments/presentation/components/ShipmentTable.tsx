"use client";

import { MoreHorizontalIcon, PencilIcon, SearchIcon, ShipIcon } from "lucide-react";
import type { AlertResult } from "@core/shipments/use-cases/evaluate-data-quality-alerts";
import type { ShipmentView } from "@core/shipments/use-cases/list-shipments";
import type { ShipmentViewModel } from "../../adapters/presenters/shipment.presenter";
import AlertBadge from "./AlertBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  shipments?: readonly ShipmentViewModel[];
  loading: boolean;
  query: string;
  view?: ShipmentView;
  onQueryChange: (query: string) => void;
  onOpen?: (shipment: ShipmentViewModel) => void;
  onEdit: (shipment: ShipmentViewModel) => void;
  onStage?: (shipment: ShipmentViewModel) => void;
  onComplete?: (shipment: ShipmentViewModel) => void;
  alertsByShipmentId?: Map<number, AlertResult>;
}

function Actions({ shipment, view = "open", onEdit, onStage = () => {}, onComplete = () => {} }: Pick<Props, "view" | "onEdit" | "onStage" | "onComplete"> & { shipment: ShipmentViewModel }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" onClick={(event) => event.stopPropagation()} />}>
        <MoreHorizontalIcon /><span className="sr-only">Tindakan {shipment.shipmentNumber}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onEdit(shipment)}><PencilIcon />Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStage(shipment)}>{view === "completed" ? "Buka kembali" : "Ubah tahap"}</DropdownMenuItem>
          {view === "open" && <DropdownMenuItem onClick={() => onComplete(shipment)}>Tandai selesai</DropdownMenuItem>}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ShipmentTable(props: Props) {
  const {
    shipments = [],
    loading,
    query,
    view = "open",
    onQueryChange,
    onOpen = () => {},
    onEdit,
    onStage = () => {},
    onComplete = () => {},
    alertsByShipmentId = new Map<number, AlertResult>(),
  } = props;
  return (
    <div className="flex flex-col gap-4">
      <InputGroup className="max-w-xl">
        <InputGroupAddon><SearchIcon /></InputGroupAddon>
        <InputGroupInput value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Cari nomor shipment, B/L, kapal, voyage, atau port" aria-label="Cari shipment" />
      </InputGroup>

      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-20 w-full" />)}</div>
      ) : shipments.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader><EmptyMedia variant="icon"><ShipIcon /></EmptyMedia><EmptyTitle>{query ? "Shipment tidak ditemukan" : `Belum ada shipment ${view === "completed" ? "selesai" : "aktif"}`}</EmptyTitle><EmptyDescription>{query ? "Coba kata kunci atau filter lain." : "Shipment akan tampil di antrean ini."}</EmptyDescription></EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="hidden max-h-[34rem] overflow-auto rounded-xl border md:block">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow><TableHead>Shipment / B/L</TableHead><TableHead>Tahap</TableHead><TableHead>Kapal / rute</TableHead><TableHead>{view === "completed" ? "Selesai" : "ETA"}</TableHead><TableHead>Risiko</TableHead><TableHead className="text-right">Tindakan</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => {
                  const alert = shipment.id === null ? undefined : alertsByShipmentId.get(shipment.id);
                  return (
                    <TableRow key={shipment.id} tabIndex={0} className="cursor-pointer" onClick={() => onOpen(shipment)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(shipment); }}>
                      <TableCell><span className="font-medium">{shipment.shipmentNumber}</span><br /><span className="text-sm text-muted-foreground">{shipment.blNumber}</span></TableCell>
                      <TableCell><Badge variant="secondary">{shipment.stageLabel}</Badge></TableCell>
                      <TableCell>{shipment.vesselName || "—"}{shipment.voyage ? ` / ${shipment.voyage}` : ""}<br /><span className="text-sm text-muted-foreground">{shipment.portOfLoading || "—"} → {shipment.portOfDischarge || "—"}</span></TableCell>
                      <TableCell>{view === "completed" ? shipment.completedAtDisplay : shipment.etaDisplay}</TableCell>
                      <TableCell>{alert ? <AlertBadge alerts={alert.alerts} highestRisk={alert.highestRisk} /> : "Tidak ada"}</TableCell>
                      <TableCell className="text-right"><Actions shipment={shipment} view={view} onEdit={onEdit} onStage={onStage} onComplete={onComplete} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {shipments.map((shipment) => {
              const alert = shipment.id === null ? undefined : alertsByShipmentId.get(shipment.id);
              return (
                <Card key={shipment.id} role="button" tabIndex={0} onClick={() => onOpen(shipment)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(shipment); }}>
                  <CardHeader className="flex-row items-start justify-between">
                    <div><CardTitle>{shipment.shipmentNumber}</CardTitle><p className="text-sm text-muted-foreground">B/L {shipment.blNumber}</p></div>
                    <Actions shipment={shipment} view={view} onEdit={onEdit} onStage={onStage} onComplete={onComplete} />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2"><Badge variant="secondary">{shipment.stageLabel}</Badge>{alert && <AlertBadge alerts={alert.alerts} highestRisk={alert.highestRisk} />}</div>
                    <p className="text-sm">{view === "completed" ? `Selesai ${shipment.completedAtDisplay}` : `ETA ${shipment.etaDisplay}`}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
