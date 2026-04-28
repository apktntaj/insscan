"use client";

/**
 * useShipments Hook
 * Presentation Layer — State bridge between UI and controller
 *
 * @description Manages shipment list state and exposes controller actions
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { shipmentController } from "../../adapters/controllers/shipment.controller";

/**
 * @returns {{
 *   shipments: Object[],
 *   count: number,
 *   loading: boolean,
 *   error: string|null,
 *   query: string,
 *   setQuery: (q: string) => void,
 *   refresh: () => Promise<void>,
 *   createShipment: (input: Object) => Promise<{ok: boolean, data?: Object, error?: Object}>,
 *   editShipment: (id: number, updates: Object) => Promise<{ok: boolean, data?: Object, error?: Object}>,
 *   terminateShipment: (id: number) => Promise<{ok: boolean, error?: Object}>,
 *   exportShipments: () => Promise<{ok: boolean, error?: Object}>,
 * }}
 */
export function useShipments() {
  const [shipments, setShipments] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const queryRef = useRef(query);
  queryRef.current = query;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listResult, newCount] = await Promise.all([
        shipmentController.listShipments(queryRef.current),
        shipmentController.getCount(),
      ]);

      if (listResult.ok) {
        setShipments(listResult.data);
      } else {
        setError(listResult.error?.message || "Failed to load shipments");
      }
      setCount(newCount);
    } catch (err) {
      setError(err?.message || "Unexpected error loading shipments");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when query changes
  useEffect(() => {
    refresh();
  }, [query, refresh]);

  const createShipment = useCallback(
    async (input) => {
      const result = await shipmentController.createShipment(input);
      if (result.ok) await refresh();
      return result;
    },
    [refresh]
  );

  const editShipment = useCallback(
    async (id, updates) => {
      const result = await shipmentController.editShipment(id, updates);
      if (result.ok) await refresh();
      return result;
    },
    [refresh]
  );

  const terminateShipment = useCallback(
    async (id) => {
      const result = await shipmentController.terminateShipment(id);
      if (result.ok) await refresh();
      return result;
    },
    [refresh]
  );

  const exportShipments = useCallback(async () => {
    const result = await shipmentController.exportShipments();
    if (result.ok) await refresh();
    return result;
  }, [refresh]);

  return {
    shipments,
    count,
    loading,
    error,
    query,
    setQuery,
    refresh,
    createShipment,
    editShipment,
    terminateShipment,
    exportShipments,
  };
}
