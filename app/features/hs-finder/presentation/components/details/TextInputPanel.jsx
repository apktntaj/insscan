"use client"
import React, { useState } from "react";

const CHAR_MIN = 3;
const CHAR_MAX = 2000;
const GRI_DETAILS_MAX = 500;

function buildClassificationText(description, griDetails) {
  const normalizedDescription = description.trim();
  const normalizedDetails = griDetails.trim();
  return normalizedDetails
    ? `${normalizedDescription}\nInformasi komposisi/wadah/kemasan untuk KUM HS: ${normalizedDetails}`
    : normalizedDescription;
}

export default function TextInputPanel({ onFind, initialValue = "", busy = false }) {
  const [text, setText] = useState(initialValue || "");
  const [griDetails, setGriDetails] = useState("");
  const [touched, setTouched] = useState(false);

  const classificationText = buildClassificationText(text, griDetails);
  const valid = text.trim().length >= CHAR_MIN && classificationText.length <= CHAR_MAX;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onFind(classificationText);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="product-description" className="block text-sm font-medium text-zinc-900">
          Deskripsi barang
        </label>
        <p className="mt-1 text-xs text-zinc-500">
          Sertakan nama, bahan, fungsi, bentuk, dan spesifikasi utama jika diketahui.
        </p>
      </div>

      <textarea
        id="product-description"
        placeholder="Contoh: Mesin cuci otomatis untuk rumah tangga, kapasitas 7 kg"
        value={text}
        maxLength={CHAR_MAX}
        disabled={busy}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => setTouched(true)}
        className="min-h-36 w-full rounded-md border border-zinc-300 p-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
      />

      <div>
        <label htmlFor="gri-details" className="block text-sm font-medium text-zinc-900">
          Bahan lain, wadah, atau kemasan
          <span className="ml-1 font-normal text-zinc-500">(opsional)</span>
        </label>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Untuk penerapan KUM HS 2, 3, dan 5: sebutkan campuran atau komposisi bahan,
          wadah khusus yang dijual bersama barang, serta apakah kemasannya dapat digunakan berulang kali.
        </p>
        <textarea
          id="gri-details"
          placeholder="Contoh: 70% poliester dan 30% katun; disertai casing khusus; dikemas dalam botol kaca sekali pakai"
          value={griDetails}
          maxLength={GRI_DETAILS_MAX}
          disabled={busy}
          onChange={(e) => setGriDetails(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-md border border-zinc-300 p-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
        />
      </div>

      <div className="flex items-start justify-between gap-4 text-xs text-zinc-500">
        <div>
          {touched && text.trim().length < CHAR_MIN && (
            <span className="text-red-600">Deskripsi minimal {CHAR_MIN} karakter.</span>
          )}
          {touched && classificationText.length > CHAR_MAX && (
            <span className="text-red-600">Total informasi maksimum {CHAR_MAX.toLocaleString("id-ID")} karakter.</span>
          )}
        </div>
        <span>{classificationText.length}/{CHAR_MAX}</span>
      </div>

      <button
        type="submit"
        disabled={!valid || busy}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Menganalisis…" : "Analisis barang"}
      </button>
    </form>
  );
}
