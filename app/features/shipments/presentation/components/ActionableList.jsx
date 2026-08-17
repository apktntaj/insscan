"use client";

/**
 * ActionableList Component
 * Presentation Layer — Feature component
 *
 * @description Displays a list of shipments that need attention (medium/high alerts).
 * Shows "Semua shipment dalam kondisi baik" when the list is empty.
 * Clicking an item opens the edit form for that shipment.
 */

import React from "react";

/** @type {Record<string, { badge: string, dot: string, label: string }>} */
const RISK_STYLES = {
  high: {
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
    label: "High",
  },
  medium: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    label: "Medium",
  },
  low: {
    badge: "bg-zinc-100 text-zinc-600 border-zinc-200",
    dot: "bg-zinc-400",
    label: "Low",
  },
};

/**
 * @param {{
 *   items: Object[],
 *   onEditShipment: (shipmentId: number) => void,
 * }} props
 */
export default function ActionableList({ items, onEditShipment }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 shrink-0 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-sm font-medium text-green-700">Semua shipment dalam kondisi baik</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const riskStyle = RISK_STYLES[item.highestRisk] ?? RISK_STYLES.low;

        return (
          <li key={item.shipmentId}>
            <button
              type="button"
              onClick={() => onEditShipment(item.shipmentId)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-zinc-900">
                    {item.shipmentNumber}
                  </span>
                  {item.alias && (
                    <span className="text-xs text-zinc-400">({item.alias})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.etaDisplay && item.etaDisplay !== "—" && (
                    <span className="text-xs text-zinc-500">ETA: {item.etaDisplay}</span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${riskStyle.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${riskStyle.dot}`} />
                    {riskStyle.label}
                  </span>
                </div>
              </div>

              {/* Alert list */}
              <ul className="mt-2 space-y-1.5">
                {item.alerts.map((alert, i) => {
                  const alertStyle = RISK_STYLES[alert.riskLevel] ?? RISK_STYLES.low;
                  return (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${alertStyle.dot}`} />
                      <div>
                        <p className="text-xs text-zinc-700">{alert.message}</p>
                        <p className="text-[11px] text-zinc-400">{alert.suggestedAction}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
