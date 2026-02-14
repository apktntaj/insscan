"use client";

import React from "react";

/**
 * Title Component
 * Presentation Layer - Common UI component
 */
export default function Title({ title, descs = [] }) {
    return (
        <div className="py-10 text-center sm:py-14">
            <h1 className="mt-1 bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl" style={{ fontFamily: 'var(--font-logo)' }}>
                {title}
            </h1>
            <div className="mx-auto mt-4 max-w-3xl space-y-1">
                {descs.map((desc, index) => (
                    <p key={index} className="text-sm leading-7 text-zinc-600 sm:text-base">
                        {desc}
                    </p>
                ))}
            </div>
        </div>
    );
}
