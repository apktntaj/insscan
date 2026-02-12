"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sora } from "next/font/google";
import { usePathname } from "next/navigation";

const brandFont = Sora({
    subsets: ["latin"],
    weight: ["600", "700"],
});

/**
 * Navbar Component
 * Presentation Layer - Navigation component
 */
export default function Navbar({ links = [] }) {
    const pathname = usePathname();
    const mainLinks = [
        { label: "Home", href: "/" },
        { label: "Scanner", href: "/inscann" },
        ...links,
    ];

    return (
        <nav className="mx-auto flex h-[3.5rem] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
            <div className="flex items-center gap-3">
                <div className="dropdown lg:hidden">
                    <button tabIndex={0} className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 shadow-sm">
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
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content z-[1] mt-3 w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg"
                    >
                        {mainLinks.map((link) => (
                            <li key={link.href}>
                                <Link className="rounded-lg text-zinc-700" href={link.href}>
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <Link className="flex items-center gap-1.5" href="/">
                    <Image
                        src="/logo-pesisir.png"
                        width={244}
                        height={65}
                        alt="Pesisir Logo"
                        className="h-[2.925rem] w-auto sm:h-[3.25rem]"
                        priority
                    />
                    <span
                        className={`${brandFont.className} text-[1.02rem] font-bold lowercase leading-none tracking-tight text-zinc-800 sm:text-[1.12rem]`}
                    >
                        Pesisir
                    </span>
                </Link>
            </div>

            <div className="hidden lg:flex lg:items-center lg:gap-2">
                {mainLinks.map((link) => {
                    const isActive = pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                isActive
                                    ? "bg-zinc-900 text-zinc-50"
                                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            }`}
                            href={link.href}
                        >
                            {link.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
