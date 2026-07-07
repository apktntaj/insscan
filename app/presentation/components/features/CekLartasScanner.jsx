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
 *
 * @returns {JSX.Element}
 */
export default function CekLartasScanner() {
  const [mode, setMode] = useState("file");
  const isFile = mode === "file";

  return (
    <div className="space-y-3 overflow-x-clip">
      {/* Toggle button — centered */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setMode(isFile ? "single" : "file")}
          aria-label={isFile ? "Beralih ke mode tunggal" : "Beralih ke mode file"}
          className="rounded-full border border-sky-200 px-4 py-1.5 text-xs font-medium text-cyan-700 transition hover:bg-sky-50"
        >
          Klik untuk mode  {isFile ? "single" : "multiple"}
        </button>
      </div>

      {/* Panel — label mode aktif ada di dalam masing-masing panel */}
      {isFile ? <FileInputPanel /> : <SingleInputPanel />}
    </div>
  );
}
