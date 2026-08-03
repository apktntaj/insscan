"use client"
import React, { useState } from "react";

function formatHs(hs) {
  if (!hs) return "-";
  // insert dot after 2 and after 4 for 6-digit
  const cleaned = hs.replace(/\./g, "");
  if (cleaned.length === 6) return `${cleaned.slice(0,4)}.${cleaned.slice(4)}`.replace(/(\d{2})(\d{2})\.(\d{2})/, `$1.$2.$3`).replace(/^\./, "");
  return hs;
}

export default function ResultPanel({ result, onRetry }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!result) return null;

  const { hsCode, description, reasoningPath = [], coverage = [] } = result;

  return (
    <div className="mt-6 p-4 border rounded">
      <div className="flex items-baseline gap-4">
        <div className="text-3xl font-bold">{formatHs(hsCode)}</div>
        <div className="text-gray-600">{description}</div>
      </div>

      {coverage && coverage.some((c) => c === "unvalidated") && (
        <div className="mt-2 text-yellow-700">Disclaimer: beberapa bab mungkin belum tervalidasi.</div>
      )}

      <div className="mt-4">
        <div className="font-medium mb-2">Reasoning Path</div>
        <div className="space-y-2">
          {reasoningPath.map((step, idx) => (
            <div key={idx} className="border rounded">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full text-left px-3 py-2 flex justify-between items-center"
              >
                <div>
                  <span className="font-medium">Langkah {idx + 1}</span> — {step.summary || step.title}
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-sm ${step.validated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {step.validated ? 'Tervalidasi' : 'Belum Tervalidasi'}
                  </span>
                </div>
              </button>
              {openIndex === idx && (
                <div className="px-3 py-2 text-sm text-gray-700">{step.reason || step.detail || JSON.stringify(step)}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <button onClick={onRetry} className="px-3 py-2 bg-gray-200 rounded">Cari Ulang</button>
      </div>
    </div>
  );
}
