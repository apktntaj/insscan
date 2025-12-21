"use client";

import React from "react";

/**
 * Alert Component
 * Presentation Layer - Common UI component
 */
export default function Alert({ message, variant = "info" }) {
    const variants = {
        info: "alert-info",
        success: "alert-success",
        warning: "alert-warning",
        error: "alert-error",
    };

    return (
        <div className={`alert ${variants[variant]} my-4`}>
            <span>{message}</span>
        </div>
    );
}
