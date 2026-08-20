"use client";

import React, { useState } from "react";
import TextInputPanel from "@/app/features/hs-finder/presentation/components/details/TextInputPanel";
import LoadingPanel from "@/app/features/hs-finder/presentation/components/details/LoadingPanel";
import ResultPanel from "@/app/features/hs-finder/presentation/components/details/ResultPanel";
import ClarificationPanel from "@/app/features/hs-finder/presentation/components/details/ClarificationPanel";

const initialSession = {
  status: "idle", // idle | classifying | clarifying | done | error
  itemDescription: "",
  result: null,
  error: null,
};

export default function HsFinderPage() {
  const [session, setSession] = useState(initialSession);

  async function findHsCodes(description, clarificationAnswers = []) {
    setSession((current) => ({
      ...current,
      status: "classifying",
      itemDescription: description,
      error: null,
    }));

    try {
      const response = await fetch("/api/hs-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "find",
          text: description,
          source: "text",
          clarificationAnswers,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.errorMessage || "Permintaan HS Finder gagal.");
      }

      setSession((current) => ({
        ...current,
        status: json.data.status === "needs_clarification" ? "clarifying" : "done",
        result: json.data,
        error: null,
      }));
    } catch (error) {
      setSession((current) => ({
        ...current,
        status: "error",
        error: error.message,
      }));
    }
  }

  function handleTextFind(description) {
    findHsCodes(description);
  }

  function handleClarification(answers) {
    findHsCodes(session.itemDescription, answers);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6 py-6 sm:py-10">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">HS Finder</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Tulis deskripsi barang untuk mendapatkan beberapa kandidat HS code.
        </p>
      </header>

      <TextInputPanel
        onFind={handleTextFind}
        initialValue={session.itemDescription}
        busy={session.status === "classifying"}
      />

      {session.status === "classifying" && (
        <div className="border-t border-zinc-200 pt-4">
          <LoadingPanel statusLabel="Sedang menyusun rekomendasi…" />
        </div>
      )}

      {session.status === "clarifying" && session.result && (
        <ClarificationPanel result={session.result} onSubmit={handleClarification} />
      )}

      {session.status === "done" && session.result && (
        <ResultPanel result={session.result} onRetry={() => setSession(initialSession)} />
      )}

      {session.status === "error" && (
        <p role="alert" className="border-l-2 border-red-500 pl-3 text-sm text-red-700">
          Terjadi kesalahan: {session.error}
        </p>
      )}

      <p className="border-t border-zinc-200 pt-4 text-xs leading-5 text-zinc-500">
        Hasil merupakan kandidat berbasis AI, bukan penetapan klasifikasi resmi. Verifikasi dengan BTKI dan ketentuan yang berlaku.
      </p>
    </section>
  );
}
