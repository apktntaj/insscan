"use client";

import React from "react";

/**
 * Custom File Input
 * Renders a styled label with a visible button and placeholder text while
 * keeping the native file input accessible but visually hidden.
 */
export default function Input({
    handleChange,
    accept = ".xls,.xlsx",
    className = "",
    ariaLabel = "Pilih file Excel (.xls, .xlsx)",
    selectedFileName = "",
    placeholder = "Masukkan invoice dalam format excel",
}) {
    return (
        <label
            aria-label={ariaLabel}
            className={`relative flex items-center gap-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 ${className}`}
        >
            <span className="inline-flex items-center justify-center shrink-0 rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-50 hover:bg-zinc-800">
                Pilih File
            </span>

            <span className={`truncate ${selectedFileName ? "text-zinc-800" : "text-zinc-400"}`}>
                {selectedFileName || placeholder}
            </span>

            <input
                type="file"
                accept={accept}
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                onChange={handleChange}
            />
        </label>
    );
}
