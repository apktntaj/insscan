"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navbar Component
 * Presentation Layer - Navigation component
 */
export default function Navbar({ links = [] }) {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    const mainLinks = [
        { label: "Home", href: "/" },
        { label: "Cek Lartas", href: "/cek-lartas" },
        // { label: "BL Scanner", href: "/blscann" },
        ...links,
    ];

    return (
        <>
            <nav className="mx-auto flex h-[3.5rem] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
                {/* Logo — kiri */}
                <Link className="group relative flex items-center gap-2" href="/">
                    <span className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-sky-300/55 to-cyan-300/55 opacity-0 transition group-hover:opacity-100" />
                    <Image
                        src="/logo-container.svg"
                        width={40}
                        height={40}
                        alt="Pesisir Logo"
                        className="relative h-9 w-9 object-contain sm:h-10 sm:w-10"
                        priority
                    />
                    <span className="relative bg-gradient-to-r from-sky-800 to-cyan-600 bg-clip-text text-[1.1rem] font-bold leading-none tracking-tight text-transparent sm:text-[1.2rem]">
                        Pesisir
                    </span>
                </Link>

                {/* Desktop links — tengah/kanan */}
                <div className="hidden lg:flex lg:items-center lg:gap-2">
                    {mainLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                className={`relative px-4 py-2 text-sm font-medium transition ${
                                    isActive
                                        ? "text-sky-800"
                                        : "text-zinc-500 hover:text-zinc-800"
                                }`}
                                href={link.href}
                            >
                                {isActive && (
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-sky-300/50 via-cyan-200/40 to-sky-400/30 blur-md"
                                    />
                                )}
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Hamburger — kanan, mobile only */}
                <button
                    aria-label="Buka menu navigasi"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(true)}
                    className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 shadow-sm lg:hidden"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                    </svg>
                </button>
            </nav>

            {/* Backdrop */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Slide-in drawer dari kanan */}
            <div
                className={`fixed right-0 top-0 z-50 flex h-full w-64 flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
                    menuOpen ? "translate-x-0" : "translate-x-full"
                }`}
                style={{ backgroundColor: "#ffffff" }}
                role="dialog"
                aria-modal="true"
                aria-label="Menu navigasi"
            >
                {/* Tombol tutup */}
                <div className="flex items-center justify-end px-5 py-4">
                    <button
                        aria-label="Tutup menu navigasi"
                        onClick={() => setMenuOpen(false)}
                        className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-500 shadow-sm hover:text-zinc-800"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Menu links */}
                <nav className="flex flex-col px-6 pt-2">
                    {mainLinks.map((link, index) => {
                        const isActive = pathname === link.href;
                        const isLast = index === mainLinks.length - 1;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMenuOpen(false)}
                                className={`py-4 text-sm font-medium transition ${
                                    isLast ? "" : "border-b border-zinc-100"
                                } ${
                                    isActive
                                        ? "text-sky-700"
                                        : "text-zinc-700 hover:text-sky-700"
                                }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
