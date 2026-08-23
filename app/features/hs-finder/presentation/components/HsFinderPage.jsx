"use client";

import React, { useState } from "react";
import TextInputPanel from "@/app/features/hs-finder/presentation/components/details/TextInputPanel";
import LoadingPanel from "@/app/features/hs-finder/presentation/components/details/LoadingPanel";
import ResultPanel from "@/app/features/hs-finder/presentation/components/details/ResultPanel";
import ClarificationPanel from "@/app/features/hs-finder/presentation/components/details/ClarificationPanel";
import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    <section className="mx-auto flex max-w-3xl flex-col gap-6 py-4 sm:py-8">
      <header>
        <Badge variant="secondary">Asisten klasifikasi</Badge>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">HS Finder</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Susun informasi barang dan bandingkan beberapa kandidat HS code sebagai titik awal riset klasifikasi.
        </p>
      </header>

      <TextInputPanel
        onFind={handleTextFind}
        initialValue={session.itemDescription}
        busy={session.status === "classifying"}
      />

      {session.status === "classifying" && (
        <div className="flex flex-col gap-4">
          <Separator />
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
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Analisis belum berhasil</AlertTitle>
          <AlertDescription>{session.error}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <InfoIcon />
        <AlertDescription>
          Hasil merupakan kandidat berbasis AI, bukan penetapan resmi. Verifikasi dengan BTKI dan ketentuan yang berlaku.
        </AlertDescription>
      </Alert>
    </section>
  );
}
