"use client";

import React from "react";

/**
 * Title Component
 * Presentation Layer - Common UI component
 */
export default function Title({ title, descs = [] }) {
    return (
        <div className="text-center py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                {title}
            </h1>
            {descs.map((desc, index) => (
                <p key={index} className="text-base-content/70">
                    {desc}
                </p>
            ))}
        </div>
    );
}
