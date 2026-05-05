"use client";

import React from "react";

/**
 * Title Component
 * Presentation Layer - Common UI component
 */
export default function Title({ title, descs = [], variant = "default", eyebrow = "" }) {
    const isModern = variant === "modern";

    if (isModern) {
        return (
            <section className="relative px-6 py-6 text-center sm:px-10 sm:py-8">
                <div className="pointer-events-none fixed right-[14%] top-[15vh] h-40 w-40 rounded-full bg-sky-300/40 blur-3xl" />
                <div className="pointer-events-none fixed left-[7%] top-[15vh] h-48 w-48 rounded-full bg-cyan-300/40 blur-3xl" />

                <div className="relative">
                    {eyebrow ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">{eyebrow}</p>
                    ) : null}
                    <h1 className="mt-2 bg-gradient-to-r from-sky-900 to-cyan-700 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl" style={{ fontFamily: "var(--font-logo)" }}>
                        {title}
                    </h1>
                    {descs.length > 0 && (
                        <div className="mx-auto mt-4 max-w-3xl space-y-1">
                            {descs.map((desc, index) => (
                                <p key={index} className="text-sm leading-7 text-zinc-700 sm:text-base">
                                    {desc}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        );
    }

    return (
        <div className="py-10 text-center sm:py-14">
            <h1 className="mt-1 bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl" style={{ fontFamily: "var(--font-logo)" }}>
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
