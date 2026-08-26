import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navbar from "@/app/shared/components/Navbar";
import DonationBanner from "@/app/shared/components/DonationBanner";
import { navLinks } from "@/app/shared/config/nav-links";
import Link from "next/link";
import { SITE_URL } from "@/app/shared/config/site-metadata";
import { TooltipProvider } from "@/components/ui/tooltip";
import InstallPwaButton from "@/app/shared/components/InstallPwaButton";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pesisir — Platform Operasional PPJK & Freight Forwarder",
    template: "%s | Pesisir",
  },
  description:
    "Alat bantu gratis untuk staf PPJK dan freight forwarder. Cek LARTAS batch dari Excel, kelola data shipment, dan ekstrak data B/L dalam satu workspace.",
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
    icon: "/pwa-icon-192.png",
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Pesisir",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <TooltipProvider>
          <DonationBanner />
          <header className="fixed inset-x-0 top-9 z-40 border-b bg-background/90 backdrop-blur-xl">
            <Navbar links={navLinks} />
          </header>
          <main className="flex-1 pt-25">
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
                <Link className="hover:text-foreground" href="/refund-policy">Kebijakan Donasi</Link>
              </nav>
            </aside>
          </footer>
          <InstallPwaButton />
          <Analytics />
        </TooltipProvider>
      </body>
    </html>
  );
}
