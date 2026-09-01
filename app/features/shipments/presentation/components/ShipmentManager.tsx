"use client";

import { useMemo, useState } from "react";
import { BellIcon, HardDriveIcon, PlusIcon, TriangleAlertIcon } from "lucide-react";
import {
  ACTIVE_SHIPMENT_STAGES,
  SHIPMENT_STAGE,
  SHIPMENT_STAGE_LABELS,
  type CreateShipmentInput,
  type EditShipmentInput,
  type ShipmentStage,
} from "@core/shipments/domain/shipment";
import type { ShipmentView } from "@core/shipments/use-cases/list-shipments";
import { browserNotificationService } from "@infrastructure/shipments/browser/browser-notification.service";
import { sessionNotificationHistory } from "@infrastructure/shipments/browser/session-notification-history";
import type { ShipmentViewModel } from "../../adapters/presenters/shipment.presenter";
import { useDashboard } from "../hooks/useDashboard";
import { useShipments } from "../hooks/useShipments";
import { useShipmentReminders } from "../hooks/useShipmentReminders";
import DashboardSection, { type WorkFilter } from "./DashboardSection";
import ShipmentBackupActions from "./ShipmentBackupActions";
import ShipmentDetailsSheet from "./ShipmentDetailsSheet";
import ShipmentForm from "./ShipmentForm";
import ShipmentTable from "./ShipmentTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ShipmentManager() {
  const [view, setView] = useState<ShipmentView>("open");
  const [query, setQuery] = useState("");
  const [workFilter, setWorkFilter] = useState<WorkFilter>("all");
  const [stageFilter, setStageFilter] = useState<ShipmentStage | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShipmentViewModel | null>(null);
  const [detailTarget, setDetailTarget] = useState<ShipmentViewModel | null>(null);
  const [stageTarget, setStageTarget] = useState<ShipmentViewModel | null>(null);
  const [targetStage, setTargetStage] = useState<ShipmentStage>(SHIPMENT_STAGE.PRE_ARRIVAL);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const shipmentsState = useShipments({ query, view });
  const dashboard = useDashboard({ shipments: shipmentsState.shipments });
  const reminders = useShipmentReminders({
    shipments: shipmentsState.shipments,
    dueReminders: dashboard.dueReminders,
    notificationService: browserNotificationService,
    history: sessionNotificationHistory,
  });

  const filtered = useMemo(() => shipmentsState.shipments.filter((shipment) => {
    if (view === "completed") return true;
    if (stageFilter !== "all" && shipment.stage !== stageFilter) return false;
    const alert = shipment.id === null ? undefined : dashboard.alertsByShipmentId.get(shipment.id);
    if (workFilter === "attention") return alert !== undefined;
    if (workFilter === "overdue") return alert?.alerts.some((item) => item.ruleId === "ETA_OVERDUE") ?? false;
    if (workFilter === "arriving_soon") return alert?.alerts.some((item) => item.ruleId === "ARRIVING_SOON") ?? false;
    return true;
  }), [dashboard.alertsByShipmentId, shipmentsState.shipments, stageFilter, view, workFilter]);

  function changeView(next: ShipmentView) {
    setView(next);
    setWorkFilter("all");
    setStageFilter("all");
    setDetailTarget(null);
  }

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(shipment: ShipmentViewModel) {
    setDetailTarget(null);
    setEditTarget(shipment);
    setFormOpen(true);
  }

  function openStage(shipment: ShipmentViewModel) {
    setDetailTarget(null);
    setStageTarget(shipment);
    setTargetStage(shipment.stage === SHIPMENT_STAGE.COMPLETED ? SHIPMENT_STAGE.CUSTOMS_PROCESS : shipment.stage);
  }

  function openComplete(shipment: ShipmentViewModel) {
    setDetailTarget(null);
    setStageTarget(shipment);
    setTargetStage(SHIPMENT_STAGE.COMPLETED);
  }

  async function submitStage() {
    if (!stageTarget?.id) return;
    const result = await shipmentsState.changeStage(stageTarget.id, targetStage);
    setStageTarget(null);
    setMessage({ text: result.ok ? targetStage === SHIPMENT_STAGE.COMPLETED ? "Shipment ditandai selesai." : "Tahap shipment diperbarui." : result.error.message, error: !result.ok });
  }

  async function submitForm(input: CreateShipmentInput | EditShipmentInput) {
    const result = editTarget?.id
      ? await shipmentsState.editShipment(editTarget.id, input as EditShipmentInput)
      : await shipmentsState.createShipment(input as CreateShipmentInput);
    if (result.ok) setMessage({ text: editTarget ? "Perubahan shipment tersimpan." : "Shipment baru berhasil dibuat.", error: false });
    return result;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><Badge variant="secondary">Workspace pribadi PPJK</Badge><h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Shipment impor laut</h1><p className="mt-2 text-muted-foreground">Pantau tahap, ETA, pengingat, dan pekerjaan shipment pada perangkat ini.</p></div>
        <div className="flex flex-wrap gap-2">
          <ShipmentBackupActions disabled={shipmentsState.count === 0} onExportExcel={shipmentsState.exportExcel} onExportBackup={shipmentsState.exportBackup} onInspectBackup={shipmentsState.inspectBackup} onImportBackup={shipmentsState.importBackup} onImported={shipmentsState.refresh} onMessage={(text, error = false) => setMessage({ text, error })} />
          <Button type="button" onClick={openCreate}><PlusIcon data-icon="inline-start" />Shipment baru</Button>
        </div>
      </div>

      <Alert><HardDriveIcon /><AlertTitle>Data tersimpan lokal di browser ini</AlertTitle><AlertDescription>Data tidak tersinkron antarperangkat. Unduh backup JSON secara berkala untuk pemulihan atau pindah perangkat.</AlertDescription></Alert>
      {message && <Alert variant={message.error ? "destructive" : "default"}>{message.error && <TriangleAlertIcon />}<AlertDescription>{message.text}</AlertDescription></Alert>}
      {shipmentsState.error && <Alert variant="destructive"><TriangleAlertIcon /><AlertTitle>Data shipment gagal dimuat</AlertTitle><AlertDescription>{shipmentsState.error}</AlertDescription></Alert>}
      {view === "open" && dashboard.dueReminders.length > 0 && (
        <Alert>
          <BellIcon />
          <AlertTitle>{dashboard.dueReminders.length} pengingat perlu ditindaklanjuti</AlertTitle>
          <AlertDescription>
            <ul className="flex list-disc flex-col gap-1 pl-4">
              {dashboard.dueReminders.map((reminder) => {
                const shipment = shipmentsState.shipments.find((item) => item.id === reminder.shipmentId);
                return <li key={`${reminder.shipmentId}-${reminder.reason}`}>{shipment?.shipmentNumber}: {reminder.reason === "eta_tomorrow" ? "ETA besok" : reminder.daysOverdue ? `pengingat terlewat ${reminder.daysOverdue} hari` : "pengingat hari ini"}</li>;
              })}
            </ul>
            <p className="mt-2">Notifikasi browser hanya bekerja selama halaman Pesisir terbuka.</p>
            {reminders.notificationPermission === "default" && <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void reminders.enableNotifications()}>Aktifkan notifikasi browser</Button>}
            {reminders.notificationPermission === "denied" && <span className="mt-2 block">Izin notifikasi ditolak; pengingat di halaman tetap aktif.</span>}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={view} onValueChange={(value) => changeView(value as ShipmentView)}><TabsList><TabsTrigger value="open">Aktif</TabsTrigger><TabsTrigger value="completed">Selesai</TabsTrigger></TabsList></Tabs>
      {view === "open" && <DashboardSection metrics={dashboard.metrics} workFilter={workFilter} stageFilter={stageFilter} resultCount={filtered.length} onWorkFilterChange={setWorkFilter} onStageFilterChange={setStageFilter} onReset={() => { setWorkFilter("all"); setStageFilter("all"); }} />}

      <ShipmentTable shipments={filtered} loading={shipmentsState.loading} query={query} view={view} onQueryChange={setQuery} onOpen={setDetailTarget} onEdit={openEdit} onStage={openStage} onComplete={openComplete} alertsByShipmentId={dashboard.alertsByShipmentId} />

      <ShipmentDetailsSheet shipment={detailTarget} alertResult={detailTarget?.id ? dashboard.alertsByShipmentId.get(detailTarget.id) : undefined} open={detailTarget !== null} onOpenChange={(open) => !open && setDetailTarget(null)} onEdit={openEdit} onChangeStage={openStage} onComplete={openComplete} />

      <AlertDialog open={stageTarget !== null} onOpenChange={(open) => !open && setStageTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{targetStage === SHIPMENT_STAGE.COMPLETED ? "Tandai shipment selesai?" : stageTarget?.stage === SHIPMENT_STAGE.COMPLETED ? "Buka kembali shipment" : "Ubah tahap shipment"}</AlertDialogTitle><AlertDialogDescription>Pilih tahap operasional tujuan. Riwayat shipment tetap tersimpan.</AlertDialogDescription></AlertDialogHeader>
          {targetStage !== SHIPMENT_STAGE.COMPLETED && <Select value={targetStage} onValueChange={(value) => setTargetStage(value as ShipmentStage)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{ACTIVE_SHIPMENT_STAGES.map((stage) => <SelectItem key={stage} value={stage}>{SHIPMENT_STAGE_LABELS[stage]}</SelectItem>)}</SelectGroup></SelectContent></Select>}
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => void submitStage()}>{targetStage === SHIPMENT_STAGE.COMPLETED ? "Tandai selesai" : "Simpan tahap"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShipmentForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={submitForm} initialData={editTarget ?? undefined} isEditMode={editTarget !== null} />
    </div>
  );
}
