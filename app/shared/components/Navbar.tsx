"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface NavigationLink {
  id?: number;
  label: string;
  href: string;
}

interface NavbarProps {
  links?: NavigationLink[];
  authSlot?: ReactNode;
  mobileAuthSlot?: ReactNode;
}

function isCurrentRoute(pathname: string, href: string): boolean {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export default function Navbar({
  links = [],
  authSlot,
  mobileAuthSlot,
}: NavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const mainLinks = [{ label: "Beranda", href: "/" }, ...links];

  return (
    <nav className="workspace-container flex h-16 items-center justify-between" aria-label="Navigasi utama">
      <Link className="flex items-center gap-2.5" href="/" aria-label="Pesisir, beranda">
        <Image
          src="/logo-container.svg"
          width={36}
          height={36}
          alt=""
          className="size-9 object-contain"
          priority
        />
        <span className="font-heading text-lg font-semibold tracking-tight">Pesisir</span>
      </Link>

      <div className="hidden items-center gap-1 lg:flex">
        {mainLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={buttonVariants({
              variant: isCurrentRoute(pathname, link.href) ? "secondary" : "ghost",
            })}
          >
            {link.label}
          </Link>
        ))}
        <div className="ml-2">{authSlot}</div>
      </div>

      <div className="lg:hidden">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger render={<Button variant="outline" size="icon" />}>
            <MenuIcon />
            <span className="sr-only">Buka menu navigasi</span>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu Pesisir</SheetTitle>
              <SheetDescription>Akses alat kerja kepabeanan Anda.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    buttonVariants({
                      variant: isCurrentRoute(pathname, link.href) ? "secondary" : "ghost",
                    }),
                    "w-full justify-start",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-auto p-4">{mobileAuthSlot}</div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
