"use client";

import { useState } from "react";
import { WHATSAPP_NUMBER } from "../../../../presentation/config/feedback-config";

const WA_MESSAGE = encodeURIComponent(
  "Halo, saya ingin berlangganan Pesisir Pro (Cek Lartas unlimited) Rp26.000/bulan."
);
const WA_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WA_MESSAGE}`;

/**
 * Modal input kode akses Pro.
 * Menampilkan input untuk unlock key dan CTA beli via WhatsApp.
 *
 * @param {{ onActivate: (key: string) => { ok: boolean, error?: string }, onClose: () => void }} props
 * @returns {JSX.Element}
 */
export default function UnlockModal({ onActivate, onClose }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const result = onActivate(input);
    if (result.ok) {
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } else {
      setError(result.error ?? "Kode tidak valid.");
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-8">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-zinc-900">Masukkan Kode Akses</p>
            <p className="mt-1 text-sm text-zinc-500">
              Aktifkan akses Pro untuk query unlimited tanpa batas harian.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Tutup"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            ✓ Akses Pro aktif! Selamat menggunakan Pesisir tanpa batas.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600" htmlFor="unlock-key">
                Kode akses
              </label>
              <input
                id="unlock-key"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                placeholder="Masukkan kode akses"
                autoComplete="off"
                spellCheck={false}
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
              {error ? (
                <p className="text-xs text-red-500">{error}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={!input.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-sky-900 to-cyan-700 px-4 py-3 text-sm font-medium text-white transition hover:from-sky-800 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Aktifkan
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-100" />
          <span className="text-xs text-zinc-400">belum punya kode?</span>
          <div className="h-px flex-1 bg-zinc-100" />
        </div>

        {/* CTA beli */}
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Beli Pro — Rp26.000/bulan via WhatsApp
        </a>
      </div>
    </div>
  );
}
