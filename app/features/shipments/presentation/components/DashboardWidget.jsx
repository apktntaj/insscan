"use client";

/**
 * DashboardWidget Component
 * Presentation Layer — Reusable metric widget
 *
 * @description Displays a single metric (label + value) with a color variant.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * @param {{
 *   label: string,
 *   value: number,
 *   variant?: 'default' | 'danger' | 'warning' | 'info',
 *   icon?: React.ReactNode,
 * }} props
 */
export default function DashboardWidget({ label, value, variant = "default", icon }) {
  return (
    <Card size="sm" className={variant === "danger" ? "text-destructive" : variant === "info" ? "bg-secondary text-secondary-foreground" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xs uppercase tracking-wide">
          {label}
          {icon}
        </CardTitle>
      </CardHeader>
      <CardContent><span className="text-3xl font-semibold tabular-nums">{value}</span></CardContent>
    </Card>
  );
}
