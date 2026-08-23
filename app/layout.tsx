import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navbar from "@/app/shared/components/Navbar";
import { navLinks } from "@/app/shared/config/nav-links";
import Link from "next/link";
import { WHATSAPP_NUMBER } from "@/app/features/feedback/config/feedback-config";
import { SITE_URL } from "@/app/shared/config/site-metadata";
import AuthNav from "@/app/features/auth/components/AuthNav";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pesisir — Platform Operasional PPJK & Freight Forwarder",
    template: "%s | Pesisir",
  },
  description:
    "Platform operasional untuk staf PPJK dan freight forwarder. Cek LARTAS batch dari Excel, kelola data shipment, dan ekstrak data B/L — semua dalam satu workspace.",
  keywords: [
    "cek lartas",
    "PPJK",
    "freight forwarder",
    "HS code",
    "INSW",
    "shipment tracking",
    "bea cukai",
    "impor",
    "kepabeanan",
    "bill of lading",
  ],
  authors: [{ name: "Semesta Raya Software" }],
  creator: "Semesta Raya Software",
  icons: {
    icon: "logo-container.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="font-sans">
      <body className="flex min-h-screen flex-col">
        <TooltipProvider>
          <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
            <Navbar
              links={navLinks}
              authSlot={<AuthNav />}
              mobileAuthSlot={<AuthNav mobile />}
            />
          </header>
          <main className="flex-1 pt-16">
            <div className="workspace-container py-6 sm:py-8">{children}</div>
          </main>
          <footer className="border-t bg-card/70">
            <aside className="workspace-container flex flex-col gap-5 py-8 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-medium text-foreground">Pesisir oleh Semesta Raya Software</p>
                <p className="mt-1 text-xs">Alat bantu independen untuk operasional kepabeanan.</p>
              </div>
              <nav aria-label="Informasi hukum dan dukungan" className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                <Link className="hover:text-foreground" href="/privacy">Privasi</Link>
                <Link className="hover:text-foreground" href="/terms">Ketentuan</Link>
                <Link className="hover:text-foreground" href="/refund-policy">Pembatalan & Refund</Link>
                <a className="hover:text-foreground" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">Dukungan WhatsApp</a>
              </nav>
            </aside>
          </footer>
          <Analytics />
        </TooltipProvider>
      </body>
    </html>
  );
}
