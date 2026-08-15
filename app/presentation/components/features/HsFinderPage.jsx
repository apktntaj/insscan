"use client"
import React, { useState } from "react";
import TextInputPanel from "./hs-finder/TextInputPanel";
import PhotoInputPanel from "./hs-finder/PhotoInputPanel";
import LoadingPanel from "./hs-finder/LoadingPanel";
import ResultPanel from "./hs-finder/ResultPanel";

const initialSession = {
  status: "idle", // idle | loading | done | error
  itemDescription: null,
  result: null,
  error: null,
};

export default function HsFinderPage() {
  const [session, setSession] = useState(initialSession);

  async function callApi(payload) {
    setSession((s) => ({ ...s, status: "loading", error: null }));
    try {
      const res = await fetch("/api/hs-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.errorMessage || "Permintaan HS Finder gagal.");
      }
      return json.data;
    } catch (err) {
      setSession((s) => ({ ...s, status: "error", error: err.message }));
      return null;
    }
  }

  async function handleTextFind(description) {
    setSession((s) => ({ ...s, itemDescription: description }));
    const data = await callApi({ action: "find", text: description, source: "text" });
    if (data) setSession((s) => ({ ...s, status: "done", result: data }));
  }

  async function handlePhotoIdentify(file) {
    // convert to base64
    const base64 = await fileToDataUrl(file);
    const mimeType = file.type || "image/jpeg";
    const data = await callApi({ action: "identify_photo", imageBase64: base64.split(",")[1], mimeType });
    if (data?.itemDescription) {
      setSession((s) => ({ ...s, status: "idle", itemDescription: data.itemDescription }));
    }
    return data;
  }

  async function handleUseDescription(description) {
    // proceed to classification
    await handleTextFind(description);
  }

  function handleRetry() {
    setSession(initialSession);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 sm:py-10">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Pesisir AI</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">HS Finder</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-600">Jelaskan barang atau unggah foto untuk mendapatkan kandidat HS code beserta alur pertimbangannya. Hasil AI wajib diverifikasi sebelum digunakan.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextInputPanel onFind={handleTextFind} initialValue={session.itemDescription} />
        <PhotoInputPanel onIdentify={handlePhotoIdentify} onUseDescription={handleUseDescription} />
      </div>

      {session.status === "loading" && <LoadingPanel />}

      {session.status === "done" && session.result && (
        <ResultPanel result={session.result} onRetry={handleRetry} />
      )}

      {session.status === "error" && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Terjadi kesalahan: {session.error}</div>
      )}

      <p className="text-center text-xs leading-6 text-zinc-500">HS Finder memberikan kandidat berbasis AI, bukan penetapan klasifikasi resmi. Verifikasi dengan BTKI, catatan bagian/bab, dan ketentuan yang berlaku.</p>
    </div>
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
