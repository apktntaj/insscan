"use client";

/**
 * ShipmentInputModeSelector Component
 * 
 * Modal untuk memilih mode input shipment:
 * 1. Manual Input - form kosong tanpa PDF
 * 2. Upload PDF - dengan Smart-Scan + fallback Click-to-Fill
 */

import React from "react";

export default function ShipmentInputModeSelector({ isOpen, onClose, onSelectMode }) {
  if (!isOpen) return null;

  const modes = [
    {
      id: "manual",
      title: "Input Manual",
      description: "Isi form shipment secara manual tanpa upload file",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      id: "with-pdf",
      title: "Upload PDF",
      description: "Upload B/L PDF dengan Smart-Scan otomatis + Click-to-Fill",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      badge: "Rekomendasi",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Pilih Mode Input Shipment</h2>
            <p className="mt-0.5 text-sm text-zinc-500">Pilih cara input data yang paling sesuai</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode options */}
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                onSelectMode(mode.id);
                onClose();
              }}
              className="group relative flex flex-col items-center gap-3 rounded-2xl border-2 border-zinc-200 bg-white p-8 text-center transition hover:border-zinc-900 hover:bg-zinc-50"
            >
              {mode.badge && (
                <span className="absolute -top-2 right-4 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {mode.badge}
                </span>
              )}
              <div className="text-zinc-600 group-hover:text-zinc-900">{mode.icon}</div>
              <div>
                <h3 className="font-semibold text-zinc-900">{mode.title}</h3>
                <p className="mt-1 text-xs text-zinc-500">{mode.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
