"use client";

import React from "react";

/**
 * Title Component
 * Presentation Layer - Common UI component
 */
export default function Title({ title, descs = [] }) {
    return (
        <div className="py-10 text-center sm:py-14">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">PESISIR Data Explorer</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">{title}</h1>
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
