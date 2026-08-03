"use client"
import React, { useState } from "react";

const CHAR_MIN = 3;
const CHAR_MAX = 2000;

export default function TextInputPanel({ onFind, initialValue = "" }) {
  const [text, setText] = useState(initialValue || "");
  const [touched, setTouched] = useState(false);

  const valid = text.trim().length >= CHAR_MIN && text.trim().length <= CHAR_MAX;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onFind(text.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-md">
      <label className="block text-sm font-medium mb-2">Deskripsi Barang (teks)</label>
      <textarea
        placeholder="Tuliskan deskripsi barang, mis. 'Mesin cuci otomatis, kapasitas 7kg'"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => setTouched(true)}
        className="w-full min-h-[120px] p-2 border rounded"
      />
      <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
        <div>
          {touched && text.trim().length < CHAR_MIN && (
            <span className="text-red-600">Deskripsi terlalu pendek (minimal {CHAR_MIN} karakter)</span>
          )}
        </div>
        <div>{text.length}/{CHAR_MAX}</div>
      </div>
      <div className="mt-3">
        <button
          type="submit"
          disabled={!valid}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Cari HS Code
        </button>
      </div>
    </form>
  );
}
