"use client";

import React from "react";

/**
 * Input Component
 * Presentation Layer - Common UI component
 */
export default function Input({ handleChange, accept = ".xls,.xlsx", className = "" }) {
    return (
        <input
            type="file"
            accept={accept}
            className={`file-input file-input-bordered file-input-sm md:file-input-md w-full md:max-w-xs ${className}`}
            onChange={handleChange}
        />
    );
}
