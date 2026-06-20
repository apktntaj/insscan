"use client";

import React, { useState, useCallback } from "react";
import { questions, getRandomQuestions } from "../../config/exercise-config";

const QUIZ_SIZE = 10;

/**
 * @typedef {"idle" | "answered" | "finished"} QuizState
 */

/**
 * Badge skor di akhir kuis.
 * @param {{ correct: number, total: number }} props
 */
function ScoreBadge({ correct, total }) {
  const pct = Math.round((correct / total) * 100);
  const color =
    pct >= 80
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : pct >= 60
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-2 text-lg font-bold ${color}`}>
      <span>
        {correct} / {total}
      </span>
      <span className="text-sm font-medium opacity-70">({pct}%)</span>
    </div>
  );
}

/**
 * Mengacak urutan pilihan jawaban dan mengembalikan array terurut acak
 * beserta mapping index-baru → index-asli.
 * Stabil selama komponen tidak di-unmount (dihitung sekali via useState init).
 *
 * @param {string[]} choices - pilihan jawaban asli
 * @returns {{ text: string, originalIndex: number }[]}
 */
function useShuffledChoices(choices) {
  const [shuffled] = useState(() => {
    const indexed = choices.map((text, originalIndex) => ({ text, originalIndex }));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    return indexed;
  });
  return shuffled;
}

/**
 * Satu kartu soal pilihan ganda dengan urutan pilihan yang diacak.
 * @param {{ question: import("../../config/exercise-config").Question, index: number, total: number, onAnswer: (isCorrect: boolean) => void }} props
 */
function QuestionCard({ question, index, total, onAnswer }) {
  const [selected, setSelected] = useState(null);
  // shuffledChoices: array { text, originalIndex } — urutan acak, stabil per mount
  const shuffledChoices = useShuffledChoices(question.pilihanJawaban);

  /**
   * @param {number} shuffledIdx - posisi dalam array yang sudah diacak
   */
  function handleSelect(shuffledIdx) {
    if (selected !== null) return;
    setSelected(shuffledIdx);
    const originalIndex = shuffledChoices[shuffledIdx].originalIndex;
    onAnswer(String(originalIndex) === question.jawaban);
  }

  /**
   * Tentukan style tiap pilihan setelah user menjawab.
   * Jawaban benar ditandai hijau berdasarkan originalIndex, bukan posisi tampil.
   * @param {number} shuffledIdx
   */
  function getStyle(shuffledIdx) {
    if (selected === null) {
      return "border-zinc-200 bg-white text-zinc-700 hover:border-cyan-300 hover:bg-cyan-50/30 cursor-pointer";
    }
    const isCorrectChoice =
      String(shuffledChoices[shuffledIdx].originalIndex) === question.jawaban;
    if (isCorrectChoice) {
      return "border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold";
    }
    if (selected === shuffledIdx) {
      return "border-red-400 bg-red-50 text-red-700";
    }
    return "border-zinc-200 bg-white text-zinc-400 opacity-60";
  }

  const isCorrect =
    selected !== null &&
    String(shuffledChoices[selected].originalIndex) === question.jawaban;

  // Teks jawaban yang benar (untuk ditampilkan di feedback)
  const correctText = question.pilihanJawaban[Number(question.jawaban)];
  // Posisi tampil (A/B/C/D) dari jawaban yang benar setelah diacak
  const correctShuffledIdx = shuffledChoices.findIndex(
    (c) => String(c.originalIndex) === question.jawaban
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm sm:px-8">
      {/* Header soal */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700">
            {index + 1} / {total}
          </span>
          <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
            {question.tentang}
          </span>
        </div>
      </div>

      {/* Pertanyaan */}
      <p className="mb-6 text-sm font-medium leading-7 text-zinc-800 sm:text-base">
        {question.pertanyaan}
      </p>

      {/* Pilihan jawaban — urutan diacak */}
      <ul className="space-y-2.5" role="radiogroup" aria-label="Pilihan jawaban">
        {shuffledChoices.map((choice, shuffledIdx) => (
          <li key={shuffledIdx}>
            <button
              role="radio"
              aria-checked={selected === shuffledIdx}
              onClick={() => handleSelect(shuffledIdx)}
              disabled={selected !== null}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${getStyle(shuffledIdx)}`}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                {String.fromCharCode(65 + shuffledIdx)}
              </span>
              <span className="leading-6">{choice.text}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Feedback */}
      {selected !== null && (
        <div
          className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
            isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {isCorrect ? (
            "✓ Tepat sekali!"
          ) : (
            <>
              ✗ Kurang tepat. Jawaban yang benar adalah{" "}
              <span className="font-bold">
                {String.fromCharCode(65 + correctShuffledIdx)}. {correctText}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ringkasan hasil kuis.
 * @param {{ correct: number, total: number, onRestart: () => void }} props
 */
function ResultPanel({ correct, total, onRestart }) {
  const pct = Math.round((correct / total) * 100);
  const grade =
    pct >= 90
      ? { label: "Luar Biasa!", desc: "Penguasaan materi kamu sangat baik." }
      : pct >= 75
      ? { label: "Bagus!", desc: "Kamu sudah paham sebagian besar materi." }
      : pct >= 60
      ? { label: "Cukup", desc: "Masih ada beberapa hal yang perlu diulang." }
      : { label: "Perlu Belajar Lagi", desc: "Coba baca ulang materi dan ulangi latihan." };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm sm:px-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-600">
        Hasil Latihan
      </p>
      <h2 className="mb-3 text-2xl font-bold text-zinc-900 sm:text-3xl">{grade.label}</h2>
      <p className="mb-6 text-sm text-zinc-500">{grade.desc}</p>

      <div className="mb-8 flex justify-center">
        <ScoreBadge correct={correct} total={total} />
      </div>

      {/* Progress bar */}
      <div className="mx-auto mb-8 max-w-xs">
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-400">{pct}% jawaban benar</p>
      </div>

      <button
        onClick={onRestart}
        className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
      >
        Coba Lagi
      </button>
    </div>
  );
}

/**
 * Halaman latihan soal kepabeanan interaktif.
 */
export default function ExercisePage() {
  const [quizQuestions, setQuizQuestions] = useState(() => getRandomQuestions(QUIZ_SIZE));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleAnswer = useCallback(
    (isCorrect) => {
      if (answered) return;
      setAnswered(true);
      if (isCorrect) setCorrectCount((c) => c + 1);
    },
    [answered]
  );

  function handleNext() {
    if (currentIndex + 1 >= quizQuestions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswered(false);
    }
  }

  function handleRestart() {
    setQuizQuestions(getRandomQuestions(QUIZ_SIZE));
    setCurrentIndex(0);
    setCorrectCount(0);
    setAnswered(false);
    setFinished(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const currentQuestion = quizQuestions[currentIndex];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm sm:px-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-600">
          Latihan Soal
        </p>
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Uji Pemahaman Kepabeanan</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {QUIZ_SIZE} soal dipilih secara acak dari bank soal. Pilih jawaban yang paling tepat.
        </p>
        {!finished && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>
                Soal {currentIndex + 1} dari {quizQuestions.length}
              </span>
              <span>{correctCount} benar</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                style={{
                  width: `${((currentIndex + (answered ? 1 : 0)) / quizQuestions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Konten: soal atau hasil */}
      {finished ? (
        <ResultPanel correct={correctCount} total={quizQuestions.length} onRestart={handleRestart} />
      ) : (
        <>
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            index={currentIndex}
            total={quizQuestions.length}
            onAnswer={handleAnswer}
          />

          {/* Tombol lanjut */}
          {answered && (
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                {currentIndex + 1 >= quizQuestions.length ? "Lihat Hasil" : "Soal Berikutnya"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
