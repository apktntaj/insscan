"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CreateShipmentInput, EditShipmentInput, ShipmentStage } from "@core/shipments/domain/shipment";
import type { ShipmentView } from "@core/shipments/use-cases/list-shipments";
import { shipmentController } from "../../adapters/controllers/shipment.controller";
import type { ShipmentViewModel } from "../../adapters/presenters/shipment.presenter";

export function useShipments({ query, view }: { query: string; view: ShipmentView }) {
  const [shipments, setShipments] = useState<ShipmentViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const sequence = useRef(0);
  const firstLoad = useRef(true);
  const latest = useRef({ query, view });
  latest.current = { query, view };

  const refresh = useCallback(async () => {
    const requestSequence = ++sequence.current;
    firstLoad.current ? setLoading(true) : setRefreshing(true);
    try {
      const result = await shipmentController.listShipments(latest.current);
      if (requestSequence !== sequence.current) return;
      if (result.ok) {
        setShipments(result.data);
        setError(null);
      } else {
        setError(result.error.message);
      }
      setLastRefreshedAt(new Date());
    } catch (caught) {
      if (requestSequence === sequence.current) {
        setError(caught instanceof Error ? caught.message : "Data shipment gagal dimuat.");
      }
    } finally {
      if (requestSequence === sequence.current) {
        setLoading(false);
        setRefreshing(false);
        firstLoad.current = false;
      }
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void refresh(), 250);
    return () => window.clearTimeout(timeout);
  }, [query, view, refresh]);

  const mutate = useCallback(async <T,>(operation: () => Promise<T & { ok: boolean }>) => {
    const result = await operation();
    if (result.ok) await refresh();
    return result;
  }, [refresh]);

  return {
    shipments,
    count: shipments.length,
    loading,
    refreshing,
    error,
    lastRefreshedAt,
    refresh,
    createShipment: (input: CreateShipmentInput) => mutate(() => shipmentController.createShipment(input)),
    editShipment: (id: number, input: EditShipmentInput) => mutate(() => shipmentController.editShipment(id, input)),
    changeStage: (id: number, stage: ShipmentStage) => mutate(() => shipmentController.changeStage(id, stage)),
    exportExcel: shipmentController.exportExcel,
    exportBackup: shipmentController.exportBackup,
    inspectBackup: shipmentController.inspectBackup,
    importBackup: shipmentController.importBackup,
  };
}
