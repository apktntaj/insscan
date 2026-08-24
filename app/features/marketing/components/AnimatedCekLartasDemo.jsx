"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const DURATION_SECONDS = 24;
const DEMO_ROWS = [
  { code: "3824.99.99", lartas: "Ada", docs: "Dok 20 · 2 izin" },
  { code: "8471.30.90", lartas: "Ada", docs: "Dok 20 · 4 izin" },
  { code: "6204.62.00", lartas: "Ada", docs: "Dok 40 · 1 izin" },
  { code: "8504.40.90", lartas: "Tidak Ada", docs: "—" },
];

function phaseLabel(second) {
  if (second < 3) return "Membaca invoice-impor.xlsx";
  if (second < 6) return "12 HS code ditemukan · 10 unik";
  if (second < 12) return "Mengambil data dari INSW";
  if (second < 16) return "Status dan persyaratan LARTAS tersusun";
  if (second < 19) return "Membuka detail regulasi";
  if (second < 22) return "Hasil siap diekspor";
  return "Coba dengan data kamu";
}

export default function AnimatedCekLartasDemo() {
  const containerRef = useRef(null);
  const [second, setSecond] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      setReduceMotion(media.matches);
      if (media.matches) setSecond(20);
    };
    syncPreference();
    media.addEventListener?.("change", syncPreference);
    return () => media.removeEventListener?.("change", syncPreference);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || !isVisible) return;
    const timer = window.setInterval(
      () => setSecond((current) => (current + 1) % DURATION_SECONDS),
      1000
    );
    return () => window.clearInterval(timer);
  }, [isVisible, reduceMotion]);

  const detected = second >= 3;
  const fetching = second >= 6 && second < 12;
  const showResults = second >= 11;
  const showRegulation = second >= 16 && second < 20;
  const exported = second >= 19;
  const showCta = second >= 21;
  const progress = fetching ? Math.min(((second - 6) / 5) * 100, 100) : second >= 12 ? 100 : 0;
  const visibleRowCount = showResults ? Math.min(Math.max(second - 10, 1), DEMO_ROWS.length) : 0;

  return (
    <div ref={containerRef} className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-cyan-950/5">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3 sm:px-5">
        <div className="flex gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div>
        <p className="rounded-full bg-white px-3 py-1 font-mono text-[10px] text-zinc-400 shadow-sm">pesisir.id/cek-lartas</p>
        <span className="w-10 text-right text-[10px] text-zinc-400">DEMO</span>
      </div>

      <div className="relative min-h-[31rem] bg-gradient-to-br from-white via-sky-50/30 to-cyan-50/60 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="space-y-3 lg:w-[34%]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Input Excel</p>
            <div className={`rounded-2xl border bg-white p-4 shadow-sm transition-all duration-700 ${second < 3 ? "translate-y-2 border-cyan-300 shadow-cyan-100" : "translate-y-0 border-zinc-200"}`}>
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl" aria-hidden="true">▦</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-800">invoice-impor.xlsx</p><p className="text-xs text-zinc-400">3 sheet · data demonstrasi</p></div></div>
              <div className="mt-4 grid grid-cols-3 gap-1.5" aria-hidden="true">{Array.from({ length: 12 }).map((_, index) => <span key={index} className={`h-5 rounded transition-colors duration-500 ${detected && index < 10 ? "bg-cyan-100 ring-1 ring-cyan-300" : "bg-zinc-100"}`} />)}</div>
            </div>
            <div className={`rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 transition-all duration-500 ${detected ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}><p className="text-sm font-semibold text-cyan-900">12 HS code ditemukan</p><p className="mt-0.5 text-xs text-cyan-700">10 unik · duplikat diproses sekali</p></div>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Hasil pemeriksaan</p><p className="mt-1 text-sm text-zinc-500">Status dan dokumen LARTAS</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${exported ? "bg-emerald-100 text-emerald-700" : fetching ? "bg-cyan-100 text-cyan-700" : "bg-zinc-100 text-zinc-500"}`}>{exported ? "Siap diekspor" : fetching ? "Memproses…" : "Menunggu"}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-gradient-to-r from-sky-800 to-cyan-500 transition-[width] duration-700" style={{ width: `${progress}%` }} /></div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="grid grid-cols-[1.2fr_.8fr_1.4fr] gap-2 bg-zinc-50 px-3 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-400 sm:text-[10px]"><span>HS Code</span><span>LARTAS</span><span>Persyaratan</span></div>
              <div className="min-h-[13rem]">{DEMO_ROWS.map((row, index) => <div key={row.code} className={`grid grid-cols-[1.2fr_.8fr_1.4fr] gap-2 border-t border-zinc-100 px-3 py-3 text-[10px] transition-all duration-500 sm:text-xs ${index < visibleRowCount ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}><span className="font-mono font-semibold text-zinc-800">{row.code}</span><span className={row.lartas === "Ada" ? "font-semibold text-cyan-700" : "text-zinc-400"}>{row.lartas}</span><span className="text-zinc-500">{row.docs}</span></div>)}</div>
            </div>
          </div>
        </div>

        <div className={`absolute inset-x-4 bottom-4 rounded-2xl border border-cyan-200 bg-white p-4 shadow-2xl transition-all duration-500 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-80 ${showRegulation ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}><p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-700">Dokumen Pabean 20</p><p className="mt-1 text-sm font-semibold text-zinc-900">Persetujuan Impor</p><p className="mt-2 text-xs leading-5 text-zinc-500">Detail regulasi, masa berlaku, dan tautan dokumen tersedia untuk diperiksa.</p></div>

        <div className={`absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-zinc-900 p-4 text-white shadow-2xl transition-all duration-500 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96 ${showCta ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}><div><p className="text-sm font-semibold">Coba dengan data kamu</p><p className="mt-0.5 text-xs text-zinc-300">Gratis tanpa kuota harian</p></div><Link href="/cek-lartas" className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-zinc-900">Mulai cek</Link></div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-white px-4 py-3 sm:px-5"><p className="text-xs font-medium text-zinc-600" aria-live="polite">{phaseLabel(second)}</p><button type="button" onClick={() => setSecond(0)} className="text-xs text-cyan-700 hover:text-cyan-800" aria-label="Putar ulang simulasi">Putar ulang</button></div>
    </div>
  );
}
