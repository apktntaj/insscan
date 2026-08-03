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
      if (!res.ok) throw new Error("Network response was not ok");
      const json = await res.json();
      return json;
    } catch (err) {
      setSession((s) => ({ ...s, status: "error", error: err.message }));
      return null;
    }
  }

  async function handleTextFind(description) {
    setSession((s) => ({ ...s, itemDescription: description }));
    const json = await callApi({ action: "find", itemDescription: description });
    if (json) setSession((s) => ({ ...s, status: "done", result: json }));
  }

  async function handlePhotoIdentify(file) {
    // convert to base64
    const base64 = await fileToDataUrl(file);
    const mimeType = file.type || "image/jpeg";
    const json = await callApi({ action: "identify_photo", imageBase64: base64.split(",")[1], mimeType });
    if (json && json.itemDescription) {
      setSession((s) => ({ ...s, status: "idle", itemDescription: json.itemDescription }));
    }
    return json;
  }

  async function handleUseDescription(description) {
    // proceed to classification
    await handleTextFind(description);
  }

  function handleRetry() {
    setSession(initialSession);
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">HS Finder</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInputPanel onFind={handleTextFind} initialValue={session.itemDescription} />
        <PhotoInputPanel onIdentify={handlePhotoIdentify} onUseDescription={handleUseDescription} />
      </div>

      {session.status === "loading" && <LoadingPanel />}

      {session.status === "done" && session.result && (
        <ResultPanel result={session.result} onRetry={handleRetry} />
      )}

      {session.status === "error" && (
        <div className="mt-4 text-red-600">Terjadi kesalahan: {session.error}</div>
      )}
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
