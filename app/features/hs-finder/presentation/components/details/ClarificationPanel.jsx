"use client";

import React, { useState } from "react";

export default function ClarificationPanel({ result, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const questions = Array.isArray(result?.questions) ? result.questions.slice(0, 2) : [];
  const complete = questions.length > 0 && questions.every((question) => answers[question]?.trim());

  function handleSubmit(event) {
    event.preventDefault();
    if (!complete) return;
    onSubmit(questions.map((question) => ({
      question,
      answer: answers[question].trim(),
    })));
  }

  return (
    <section className="border-t border-zinc-200 pt-6">
      <h2 className="text-lg font-semibold text-zinc-900">Perlu klarifikasi singkat</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{result.clarificationReason}</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {questions.map((question) => (
          <label key={question} className="block text-sm text-zinc-800">
            <span className="font-medium">{question}</span>
            <input
              value={answers[question] ?? ""}
              onChange={(event) => setAnswers((current) => ({
                ...current,
                [question]: event.target.value,
              }))}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
        ))}

        <button
          type="submit"
          disabled={!complete}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Lanjutkan klasifikasi
        </button>
      </form>
    </section>
  );
}
