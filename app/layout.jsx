import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "./presentation/components";
import { navLinks } from "./presentation/config/nav-links";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "INSScan | Home Page",
  description: "Upload and done.",
};

export default function RootLayout({ children }) {
  return (
    <html data-theme="bumblebee" lang="en">
      <body className={`${inter.className} text-slate-800 lg:px-20`}>
        <header>
          <Navbar links={navLinks} />
        </header>
        <main className="min-h-[80vh] flex">
          {children}
          <Analytics />
        </main>
        <footer className="footer footer-center p-4 bg-base-800 text-base-content">
          <aside>
            <p>Copyright © 2024 Semesta Raya Software</p>
          </aside>
        </footer>
      </body>
    </html>
  );
}
