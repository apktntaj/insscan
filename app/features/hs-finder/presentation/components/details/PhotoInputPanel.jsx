"use client"
import React, { useState, useRef } from "react";

export default function PhotoInputPanel({ onIdentify, onUseDescription }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [identifying, setIdentifying] = useState(false);
  const [identifiedDesc, setIdentifiedDesc] = useState("");
  const fileRef = useRef();

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setIdentifiedDesc("");
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function handleIdentify() {
    if (!file) return;
    setIdentifying(true);
    try {
      const json = await onIdentify(file);
      if (json && json.itemDescription) setIdentifiedDesc(json.itemDescription);
    } finally {
      setIdentifying(false);
    }
  }

  function handleUse() {
    if (!identifiedDesc) return;
    onUseDescription(identifiedDesc);
  }

  return (
    <div className="p-4 border rounded-md">
      <label className="block text-sm font-medium mb-2">Unggah Foto Barang</label>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex items-center justify-center border-dashed border-2 p-6 rounded bg-gray-50 mb-3 cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="preview" className="max-h-40 object-contain" />
        ) : (
          <div className="text-center text-sm text-gray-600">Tarik & lepaskan gambar di sini atau klik untuk memilih</div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleIdentify}
          disabled={!file || identifying}
          className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {identifying ? "Mengidentifikasi..." : "Identifikasi Foto"}
        </button>
        <button
          onClick={() => { setFile(null); setPreview(null); setIdentifiedDesc(""); }}
          className="px-3 py-2 bg-gray-200 rounded"
        >
          Hapus
        </button>
      </div>

      {identifiedDesc && (
        <div className="mt-3">
          <label className="text-sm font-medium">Deskripsi teridentifikasi (bisa diedit)</label>
          <textarea
            value={identifiedDesc}
            onChange={(e) => setIdentifiedDesc(e.target.value)}
            className="w-full p-2 border rounded mt-1"
            rows={4}
          />
          <div className="mt-2">
            <button onClick={handleUse} className="px-3 py-2 bg-blue-600 text-white rounded">Gunakan Deskripsi Ini</button>
          </div>
        </div>
      )}
    </div>
  );
}
