"use client"
import React from "react";

export default function LoadingPanel({ statusLabel }) {
  const label = statusLabel || "Sedang memproses...";
  return (
    <p role="status" className="text-sm font-medium text-zinc-700">
      {label}
    </p>
  );
}
