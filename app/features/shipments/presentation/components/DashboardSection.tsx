"use client";

import { ClockAlertIcon, ListIcon, RadarIcon, TriangleAlertIcon } from "lucide-react";
import { ACTIVE_SHIPMENT_STAGES, SHIPMENT_STAGE_LABELS, type ShipmentStage } from "@core/shipments/domain/shipment";
import DashboardWidget from "./DashboardWidget";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type WorkFilter = "all" | "attention" | "overdue" | "arriving_soon";

export default function DashboardSection({ metrics, workFilter, stageFilter, resultCount, onWorkFilterChange, onStageFilterChange, onReset }: {
  metrics: { totalActive: number; needsAttention: number; overdue: number; arrivingSoon: number };
  workFilter: WorkFilter;
  stageFilter: ShipmentStage | "all";
  resultCount: number;
  onWorkFilterChange: (filter: WorkFilter) => void;
  onStageFilterChange: (filter: ShipmentStage | "all") => void;
  onReset: () => void;
}) {
  const cards = [
    { filter: "all" as const, title: "Semua aktif", value: metrics.totalActive, icon: <ListIcon /> },
    { filter: "attention" as const, title: "Perlu perhatian", value: metrics.needsAttention, icon: <RadarIcon /> },
    { filter: "overdue" as const, title: "ETA terlewat", value: metrics.overdue, icon: <TriangleAlertIcon /> },
    { filter: "arriving_soon" as const, title: "Tiba 1–3 hari", value: metrics.arrivingSoon, icon: <ClockAlertIcon /> },
  ];
  return (
    <section className="flex flex-col gap-4" aria-label="Filter antrean kerja">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <DashboardWidget key={card.filter} {...card} active={workFilter === card.filter} onClick={() => onWorkFilterChange(card.filter)} />)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup variant="outline" value={[workFilter]} onValueChange={(values) => values[0] && onWorkFilterChange(values[0] as WorkFilter)} aria-label="Filter pekerjaan">
          <ToggleGroupItem value="all">Semua</ToggleGroupItem>
          <ToggleGroupItem value="attention">Perhatian</ToggleGroupItem>
          <ToggleGroupItem value="overdue">Terlewat</ToggleGroupItem>
          <ToggleGroupItem value="arriving_soon">1–3 hari</ToggleGroupItem>
        </ToggleGroup>
        <Select value={stageFilter} onValueChange={(value) => onStageFilterChange(value as ShipmentStage | "all")}>
          <SelectTrigger aria-label="Filter tahap"><SelectValue placeholder="Semua tahap" /></SelectTrigger>
          <SelectContent><SelectGroup><SelectItem value="all">Semua tahap</SelectItem>{ACTIVE_SHIPMENT_STAGES.map((stage) => <SelectItem key={stage} value={stage}>{SHIPMENT_STAGE_LABELS[stage]}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{resultCount} hasil</span>
        {(workFilter !== "all" || stageFilter !== "all") && <Button type="button" variant="ghost" onClick={onReset}>Reset filter</Button>}
      </div>
    </section>
  );
}
