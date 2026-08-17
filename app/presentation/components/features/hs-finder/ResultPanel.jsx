"use client";

import React from "react";

function formatHs(hsCode) {
  if (!hsCode) return "-";
  const cleaned = hsCode.replace(/\./g, "");
  return cleaned.length === 6
    ? `${cleaned.slice(0, 4)}.${cleaned.slice(4)}`
    : hsCode;
}

const CONFIDENCE_LABELS = {
  high: "Keyakinan tinggi",
  medium: "Keyakinan sedang",
  low: "Keyakinan rendah",
};

export default function ResultPanel({ result, onRetry }) {
  if (!result) return null;

  const recommendations = Array.isArray(result.recommendations) && result.recommendations.length
    ? result.recommendations
    : [{
        hsCode: result.hsCode,
        description: result.description,
        confidence: "high",
        rationale: null,
        quotedRule: null,
      }];

  return (
    <section className="border-t border-zinc-200 pt-6">
      <h2 className="text-lg font-semibold text-zinc-900">Rekomendasi HS code</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Diurutkan dari kandidat yang paling kuat berdasarkan informasi yang tersedia.
      </p>

      <div className="mt-4 space-y-5">
        {recommendations.map((recommendation, index) => (
          <article key={recommendation.hsCode} className="border-l-2 border-zinc-300 pl-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-semibold text-zinc-900">
                {index + 1}. {formatHs(recommendation.hsCode)}
              </h3>
              <span className="text-xs text-zinc-500">
                {CONFIDENCE_LABELS[recommendation.confidence] ?? "Kandidat"}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-zinc-700">{recommendation.description}</p>
            {recommendation.rationale && (
              <p className="mt-2 text-sm leading-6 text-zinc-600">{recommendation.rationale}</p>
            )}
            {recommendation.quotedRule && (
              <blockquote className="mt-2 text-xs leading-5 text-zinc-500">
                Dasar catatan: “{recommendation.quotedRule}”
              </blockquote>
            )}
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-md border border-zinc-300 px-3 py-2 text-sm"
      >
        Cari ulang
      </button>
    </section>
  );
}
