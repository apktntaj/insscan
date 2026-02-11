"use client";

import React from "react";

/**
 * Button Component
 * Presentation Layer - Common UI component
 */
export default function Button({ children, onClick, disabled, variant = "primary", className = "" }) {
    const baseStyles =
        "inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-45";

    const variants = {
        primary: "border-zinc-900 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 hover:border-zinc-800",
        secondary: "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100",
        ghost: "border-zinc-200 bg-transparent text-zinc-700 hover:bg-zinc-100",
    };

    return (
        <button
            type="button"
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
