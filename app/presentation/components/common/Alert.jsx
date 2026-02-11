"use client";

import React from "react";

/**
 * Alert Component
 * Presentation Layer - Common UI component
 */
export default function Alert({ message, variant = "info" }) {
    const variants = {
        info: "border-zinc-200 bg-white text-zinc-700",
        success: "border-zinc-200 bg-white text-zinc-700",
        warning: "border-zinc-200 bg-white text-zinc-700",
        error: "border-zinc-200 bg-white text-zinc-700",
    };

    return (
        <div className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm ${variants[variant]}`}>
            <span>{message}</span>
        </div>
    );
}
