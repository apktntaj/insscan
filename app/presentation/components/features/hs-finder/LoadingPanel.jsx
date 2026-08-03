"use client"
import React from "react";

export default function LoadingPanel({ statusLabel }) {
  const label = statusLabel || "Sedang memproses...";
  return (
    <div className="mt-4 p-4 border rounded flex items-center gap-4">
      <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" />
      <div>{label}</div>
    </div>
  );
}
