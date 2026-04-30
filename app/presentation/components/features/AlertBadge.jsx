"use client";

/**
 * AlertBadge Component
 * Presentation Layer — Feature component
 *
 * @description Displays a colored badge indicating the highest risk level for a shipment.
 * Shows a tooltip with the list of active alerts on hover.
 * Not rendered if alerts is empty or highestRisk is null.
 */

import React, { useState } from "react";

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
 *   alerts: Object[],
 *   highestRisk: 'high' | 'medium' | 'low' | null,
 * }} props
 */
export default function AlertBadge({ alerts, highestRisk }) {
  const [open, setOpen] = useState(false);

  if (!alerts || alerts.length === 0 || !highestRisk) return null;

  const style = RISK_STYLES[highestRisk] ?? RISK_STYLES.low;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.badge} cursor-pointer`}
        aria-label={`${alerts.length} alert${alerts.length > 1 ? "s" : ""}, highest risk: ${highestRisk}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {alerts.length}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Active Alerts
          </p>
          <ul className="space-y-2">
            {alerts.map((alert, i) => {
              const s = RISK_STYLES[alert.riskLevel] ?? RISK_STYLES.low;
              return (
                <li key={i} className="flex items-start gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                  <span className="text-xs text-zinc-700 leading-snug">{alert.message}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
