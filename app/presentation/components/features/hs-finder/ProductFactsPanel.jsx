"use client";

import React, { useEffect, useState } from "react";

const FIELDS = [
  ["productName", "Nama produk"],
  ["materialComposition", "Material / komposisi"],
  ["primaryFunction", "Fungsi utama"],
  ["workingPrinciple", "Prinsip kerja"],
  ["physicalForm", "Bentuk fisik"],
  ["processingState", "Kondisi / tingkat pengolahan"],
  ["intendedUse", "Penggunaan"],
  ["isPartOrAccessory", "Bagian atau aksesori"],
  ["isSetOrMixture", "Set atau campuran"],
  ["packaging", "Kemasan / penyajian"],
  ["technicalSpecifications", "Spesifikasi teknis"],
];

function cloneFacts(facts) {
  return Object.fromEntries(
    FIELDS.map(([field]) => [field, { ...(facts?.[field] ?? { value: null, confidence: null, evidence: null }) }])
  );
}

export default function ProductFactsPanel({ analysis, onSubmitAnswers, onConfirm, busy = false }) {
  const [facts, setFacts] = useState(() => cloneFacts(analysis?.facts));
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    setFacts(cloneFacts(analysis?.facts));
    setAnswers({});
  }, [analysis]);

  if (!analysis) return null;

  const requiredFactsPresent = ["productName", "primaryFunction", "physicalForm"]
    .every((field) => facts[field]?.value !== null && facts[field]?.value !== "");

  function updateFact(field, value) {
    setFacts((current) => ({
      ...current,
      [field]: { ...current[field], value: value === "" ? null : value, evidence: "Dikonfirmasi pengguna" },
    }));
  }

  function submitAnswers() {
    const payload = analysis.questions.flatMap((question) => {
      const answer = answers[question]?.trim();
      return answer ? [{ question, answer }] : [];
    });
    onSubmitAnswers(facts, payload);
  }

  return (
    <section className="border-t border-zinc-200 pt-6">
      <h2 className="text-lg font-semibold text-zinc-900">Periksa detail barang</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Status: {analysis.status === "ready_for_classification" ? "detail cukup" : "perlu detail tambahan"}.
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Koreksi hasil analisis dan lengkapi nilai yang masih kosong.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {FIELDS.map(([field, label]) => {
          const fact = facts[field];
          const isBoolean = field === "isPartOrAccessory" || field === "isSetOrMixture";
          return (
            <label key={field} className="block text-sm">
              <span className="font-medium text-zinc-800">{label}</span>
              {isBoolean ? (
                <select
                  value={fact.value === null ? "" : String(fact.value)}
                  onChange={(event) => updateFact(field, event.target.value === "" ? null : event.target.value === "true")}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                >
                  <option value="">Belum diketahui</option>
                  <option value="true">Ya</option>
                  <option value="false">Tidak</option>
                </select>
              ) : (
                <input
                  value={fact.value ?? ""}
                  onChange={(event) => updateFact(field, event.target.value)}
                  placeholder="Belum diketahui"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                />
              )}
              {fact.evidence && <span className="mt-1 block text-xs text-zinc-500">Sumber: {fact.evidence}</span>}
            </label>
          );
        })}
      </div>

      {analysis.questions.length > 0 && (
        <div className="mt-6 border-t border-zinc-200 pt-5">
          <h3 className="font-medium text-zinc-900">Pertanyaan lanjutan</h3>
          <div className="mt-3 space-y-3">
            {analysis.questions.map((question) => (
              <label key={question} className="block text-sm text-zinc-800">
                {question}
                <input
                  value={answers[question] ?? ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question]: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={submitAnswers}
            className="mt-4 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50"
          >
            {busy ? "Menganalisis…" : "Kirim jawaban dan periksa ulang"}
          </button>
        </div>
      )}

      {analysis.status === "needs_details" && analysis.questions.length === 0 && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onSubmitAnswers(facts, [])}
          className="mt-4 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50"
        >
          Periksa ulang detail yang diedit
        </button>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={busy || analysis.status !== "ready_for_classification" || !requiredFactsPresent}
          onClick={() => onConfirm(facts)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Konfirmasi dan lanjutkan klasifikasi
        </button>
      </div>
    </section>
  );
}
