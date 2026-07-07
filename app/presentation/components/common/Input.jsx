"use client";

import React from "react";

/**
 * Input Component
 * Presentation Layer - Common UI component
 */
export default function Input({ handleChange, accept = ".xls,.xlsx", className = "", ariaLabel = "Pilih file Excel (.xls, .xlsx)" }) {
    return (
        <input
            type="file"
            accept={accept}
            aria-label={ariaLabel}
            className={`block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-zinc-50 hover:file:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${className}`}
            onChange={handleChange}
        />
    );
}
