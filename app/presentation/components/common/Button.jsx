"use client";

import React from "react";

/**
 * Button Component
 * Presentation Layer - Common UI component
 */
export default function Button({ children, onClick, disabled, variant = "primary", className = "" }) {
    const baseStyles = "btn transition-all duration-200";
    const variants = {
        primary: "btn-primary",
        secondary: "btn-secondary",
        ghost: "btn-ghost",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
