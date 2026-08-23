"use client";

/**
 * ShipmentTable Component
 * Presentation Layer — Feature component
 *
 * @description Renders the sorted/filtered shipment list with search, edit, and terminate actions.
 */

import React, { useState } from "react";
import AlertBadge from "@/app/features/shipments/presentation/components/AlertBadge";
import { PencilIcon, SearchIcon, ShipIcon, Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * @param {{
 *   shipments: Object[],
 *   loading: boolean,
 *   query: string,
 *   onQueryChange: (q: string) => void,
 *   onEdit: (shipment: Object) => void,
 *   onTerminate: (id: number) => Promise<void>,
 *   alertsByShipmentId?: Map<number, Object>,
 * }} props
 */
export default function ShipmentTable({ shipments = [], loading, query, onQueryChange, onEdit, onTerminate, alertsByShipmentId }) {
  const [terminatingId, setTerminatingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  async function handleTerminateConfirm() {
    if (!confirmId) return;
    setTerminatingId(confirmId);
    setConfirmId(null);
    await onTerminate(confirmId);
    setTerminatingId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <InputGroup className="max-w-sm">
        <InputGroupAddon><SearchIcon /></InputGroupAddon>
        <InputGroupInput
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Cari B/L, shipper, consignee, atau alias"
          aria-label="Cari shipment"
        />
      </InputGroup>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment #</TableHead>
              <TableHead>Nomor B/L</TableHead>
              <TableHead>Shipper</TableHead>
              <TableHead>Consignee</TableHead>
              <TableHead>Vessel / Voyage</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><ShipIcon /></EmptyMedia>
                      <EmptyTitle>{query ? "Shipment tidak ditemukan" : "Belum ada shipment"}</EmptyTitle>
                      <EmptyDescription>
                        {query ? "Coba kata kunci lain." : "Tambahkan shipment pertama untuk mulai memantau pekerjaan."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              shipments.map((s) => (
                <TableRow
                  key={s.id}
                  data-state={s.isNotificationDue ? "selected" : undefined}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{s.shipmentNumber}</span>
                      {s.isNotificationDue && (
                        <Badge variant="secondary">H-1</Badge>
                      )}
                      {alertsByShipmentId && (() => {
                        const alertResult = alertsByShipmentId.get(s.id);
                        return alertResult ? (
                          <AlertBadge alerts={alertResult.alerts} highestRisk={alertResult.highestRisk} />
                        ) : null;
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>{s.blNumber}</TableCell>
                  <TableCell>{s.shipperName}</TableCell>
                  <TableCell>{s.consigneeName}</TableCell>
                  <TableCell>
                    {s.vesselName !== "—" ? s.vesselName : "—"}
                    {s.voyage !== "—" && s.vesselName !== "—" ? ` / ${s.voyage}` : ""}
                  </TableCell>
                  <TableCell>{s.etaDisplay}</TableCell>
                  <TableCell>{s.alias || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(s)}
                      >
                        <PencilIcon data-icon="inline-start" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => setConfirmId(s.id)}
                        disabled={terminatingId === s.id}
                      >
                        <Trash2Icon data-icon="inline-start" />
                        {terminatingId === s.id ? "..." : "Hapus"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Terminate confirmation dialog */}
      <AlertDialog open={confirmId !== null} onOpenChange={(open) => { if (!open) setConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia><Trash2Icon /></AlertDialogMedia>
            <AlertDialogTitle>Hapus shipment?</AlertDialogTitle>
            <AlertDialogDescription>
              Shipment akan dihapus permanen dari daftar aktif. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleTerminateConfirm}>Ya, hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
