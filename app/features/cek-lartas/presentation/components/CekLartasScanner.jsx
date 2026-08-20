"use client";

import { useState } from "react";
import SingleInputPanel from "@/app/features/cek-lartas/presentation/components/cek-lartas/SingleInputPanel";
import FileInputPanel from "@/app/features/cek-lartas/presentation/components/cek-lartas/FileInputPanel";

/**
 * CekLartasScanner Component
 * Presentation Layer - Feature entry point
 *
 * @description Komponen utama halaman Cek Lartas.
 * Hanya bertanggung jawab merender mode toggle dan mendelegasikan ke
 * SingleInputPanel atau FileInputPanel sesuai mode aktif.
 *
 * @returns {JSX.Element}
 */
export default function CekLartasScanner() {
  const [mode, setMode] = useState("file");
  const isFile = mode === "file";

  return (
    <div className="space-y-3 overflow-x-clip">
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm" role="group" aria-label="Pilih metode pemeriksaan">
          <button type="button" aria-pressed={isFile} onClick={() => setMode("file")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${isFile ? "bg-cyan-800 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}>
            Upload Excel
          </button>
          <button type="button" aria-pressed={!isFile} onClick={() => setMode("single")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${!isFile ? "bg-cyan-800 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}>
            Satu HS Code
          </button>
        </div>
      </div>

      <p className="text-center text-xs leading-6 text-zinc-500">
        Excel dapat berisi beberapa sheet. Pesisir membaca HS code 8 digit dan memproses kode duplikat satu kali.
      </p>

      {/* Panel — label mode aktif ada di dalam masing-masing panel */}
      {isFile ? <FileInputPanel /> : <SingleInputPanel />}
    </div>
  );
}
