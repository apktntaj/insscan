import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Navbar } from "./presentation/components";
import { navLinks } from "./presentation/config/nav-links";

export const metadata = {
  metadataBase: new URL("https://pesisir.id"),
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
  openGraph: {
    title: "Pesisir — Platform Operasional PPJK & Freight Forwarder",
    description:
      "Platform operasional untuk staf PPJK dan freight forwarder. Cek LARTAS batch dari Excel, kelola data shipment, dan ekstrak data B/L — semua dalam satu workspace.",
    url: "https://pesisir.id",
    siteName: "Pesisir",
    locale: "id_ID",
    images: [
      {
        url: "https://pesisir.id/logo-pesisir.png",
        width: 1200,
        height: 630,
        alt: "Pesisir — Platform operasional PPJK dan freight forwarder",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pesisir — Platform Operasional PPJK & Freight Forwarder",
    description:
      "Platform operasional untuk staf PPJK dan freight forwarder. Cek LARTAS batch dari Excel, kelola data shipment, dan ekstrak data B/L — semua dalam satu workspace.",
    images: ["https://pesisir.id/logo-pesisir.png"],
  },
  alternates: {
    canonical: "https://pesisir.id",
  },
};

export default function RootLayout({ children }) {
  return (
    <html data-theme="light" lang="id" className="scroll-smooth">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased [font-family:ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">
        <header className="fixed top-0 left-0 right-0 z-40 border-b border-zinc-200/70 bg-zinc-50">
          <Navbar links={navLinks} />
        </header>
        <main className="min-h-[82vh] pt-16">
          <div className="mx-auto w-full max-w-7xl px-5 pb-8 pt-6 sm:px-8 lg:px-12">
            {children}
            <Analytics />
          </div>
        </main>
        <footer className="border-t border-zinc-200/70 bg-zinc-50/90">
          <aside className="mx-auto max-w-7xl px-5 py-6 text-center text-sm text-zinc-500 sm:px-8 lg:px-12">
            <p>Copyright © 2024 Semesta Raya Software</p>
          </aside>
        </footer>
      </body>
    </html>
  );
}
