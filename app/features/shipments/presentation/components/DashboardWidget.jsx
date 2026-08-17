"use client";

/**
 * DashboardWidget Component
 * Presentation Layer — Reusable metric widget
 *
 * @description Displays a single metric (label + value) with a color variant.
 */

import React from "react";

/** @type {Record<string, string>} */
const VARIANT_CLASSES = {
  default: "bg-zinc-50 border-zinc-200 text-zinc-900",
  danger:  "bg-red-50 border-red-200 text-red-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  info:    "bg-sky-50 border-sky-200 text-sky-700",
};

const LABEL_CLASSES = {
  default: "text-zinc-500",
  danger:  "text-red-500",
  warning: "text-amber-600",
  info:    "text-sky-600",
};

/**
 * @param {{
 *   label: string,
 *   value: number,
 *   variant?: 'default' | 'danger' | 'warning' | 'info',
 *   icon?: React.ReactNode,
 * }} props
 */
export default function DashboardWidget({ label, value, variant = "default", icon }) {
  const containerClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.default;
  const labelClass = LABEL_CLASSES[variant] ?? LABEL_CLASSES.default;

  return (
    <div className={`flex flex-col gap-1 rounded-2xl border px-5 py-4 ${containerClass}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium uppercase tracking-wide ${labelClass}`}>
          {label}
        </span>
        {icon && <span className="opacity-60">{icon}</span>}
      </div>
      <span className="text-3xl font-bold tabular-nums">{value}</span>
    </div>
  );
}
