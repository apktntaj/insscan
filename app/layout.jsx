import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Navbar } from "./presentation/components";
import { navLinks } from "./presentation/config/nav-links";

export const metadata = {
  title: "Pesisir | BL Scanner & INScann",
  description: "Klik untuk salin data BL dan validasi HS code dalam satu workspace.",
};

export default function RootLayout({ children }) {
  return (
    <html data-theme="light" lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased [font-family:ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">
        <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-zinc-50/85 backdrop-blur-xl">
          <Navbar links={navLinks} />
        </header>
        <main className="min-h-[82vh]">
          <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-8 sm:px-8 lg:px-12">
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
