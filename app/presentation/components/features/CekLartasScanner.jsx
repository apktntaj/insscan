"use client";

import { useState } from "react";
import SingleInputPanel from "./cek-lartas/SingleInputPanel";
import FileInputPanel from "./cek-lartas/FileInputPanel";

/**
 * CekLartasScanner Component
 * Presentation Layer - Feature entry point
 *
 * @description Komponen utama halaman Cek Lartas.
 * Hanya bertanggung jawab merender mode toggle dan mendelegasikan ke
 * SingleInputPanel atau FileInputPanel sesuai mode aktif.
 * State mode disimpan di sini; state fetch/file ada di masing-masing hook dalam sub-panel.
 *
 * @returns {JSX.Element}
 *
 * @example
 * // Render awal: mode = "single"
 * // → ModeToggle dengan "Input Tunggal" aktif
 * // → SingleInputPanel dirender
 *
 * @example
 * // Setelah klik "Input File / Banyak HS Code":
 * // → mode = "file"
 * // → FileInputPanel dirender
 */
export default function CekLartasScanner() {
  const [mode, setMode] = useState("single");

  return (
    <div className="space-y-6 overflow-x-clip">
      {/* Mode Toggle */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`rounded-2xl border p-4 text-left transition ${
            mode === "single"
              ? "border-sky-200 bg-gradient-to-br from-sky-900 to-cyan-700 text-white shadow-sm"
              : "border-zinc-200 bg-white text-zinc-700 hover:border-sky-100 hover:bg-sky-50/50"
          }`}
        >
          <p className={`text-sm font-semibold ${mode === "single" ? "text-white" : "text-zinc-900"}`}>
            Input Tunggal
          </p>
          <p className={`mt-1 text-xs leading-relaxed ${mode === "single" ? "text-sky-200" : "text-zinc-500"}`}>
            Cek satu HS code dengan tampilan card yang mudah dibaca.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("file")}
          className={`rounded-2xl border p-4 text-left transition ${
            mode === "file"
              ? "border-sky-200 bg-gradient-to-br from-sky-900 to-cyan-700 text-white shadow-sm"
              : "border-zinc-200 bg-white text-zinc-700 hover:border-sky-100 hover:bg-sky-50/50"
          }`}
        >
          <p className={`text-sm font-semibold ${mode === "file" ? "text-white" : "text-zinc-900"}`}>
            Input File / Banyak HS Code
          </p>
          <p className={`mt-1 text-xs leading-relaxed ${mode === "file" ? "text-sky-200" : "text-zinc-500"}`}>
            Upload file Excel berisi banyak HS code, hasil ditampilkan sebagai tabel matriks LARTAS.
          </p>
        </button>
      </div>

      {/* Panel sesuai mode aktif */}
      {mode === "single" ? <SingleInputPanel /> : <FileInputPanel />}
    </div>
  );
}
