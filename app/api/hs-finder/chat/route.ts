/**
 * HS Finder Chat API Route
 * Infrastructure Layer — Next.js App Router endpoint
 *
 * POST /api/hs-finder/chat
 *
 * Menjalankan pipeline klasifikasi dan mengemit progress via NDJSON streaming.
 * Setiap baris output adalah satu event JSON yang diakhiri newline.
 *
 * Events yang dikirim:
 *   { "event": "step", "label": "...", "detail": "..." }
 *   { "event": "clarification", "reason": "...", "questions": [...] }
 *   { "event": "result", "recommendations": [...], "coverageMap": {...} }
 *   { "event": "error", "errorMessage": "..." }
 *
 * @module api/hs-finder/chat
 */

import "server-only";
import { createClassificationKnowledgeService } from "@/app/features/hs-finder/infrastructure/services/classification-knowledge.service";
import { createHsFinderGeminiService } from "@/app/features/hs-finder/infrastructure/services/hs-finder-gemini.service";
import {
  createFindHsCodeUseCase,
  type HsFinderGeminiService,
  type ClarificationAnswer,
} from "@core/hs-finder/use-cases/find-hs-code";
import { makeItemDescription } from "@core/hs-finder/domain/hs-finder";

export const maxDuration = 60;

// ─────────────────────────────────────────────
// Dependency wiring (module level)
// ─────────────────────────────────────────────

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error(
    "[hs-finder/chat] GEMINI_API_KEY is not set. " +
      "All /api/hs-finder/chat requests will return GEMINI_UNAVAILABLE."
  );
}

const classificationKnowledge = createClassificationKnowledgeService();
const hsFinderGeminiService = createHsFinderGeminiService(
  geminiApiKey ?? "",
) as unknown as HsFinderGeminiService;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const encoder = new TextEncoder();

function emitLine(controller: ReadableStreamDefaultController<Uint8Array>, payload: Record<string, unknown>): void {
  controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
}

function emitStep(
  controller: ReadableStreamDefaultController<Uint8Array>,
  label: string,
  detail: string,
): void {
  emitLine(controller, { event: "step", label, detail });
}

function emitError(
  controller: ReadableStreamDefaultController<Uint8Array>,
  errorMessage: string,
  errorCode?: string,
): void {
  emitLine(controller, { event: "error", errorMessage, errorCode });
}

/** Peta error code ke pesan Bahasa Indonesia yang dilihat pengguna. */
const ERROR_MESSAGES: Record<string, string> = {
  NO_CANDIDATE_CHAPTERS:
    "Deskripsi barang tidak cukup jelas untuk mengidentifikasi bab HS yang relevan. Coba tambahkan detail material, fungsi, atau bentuk barang.",
  INSUFFICIENT_LEGAL_COVERAGE:
    "Basis pengetahuan hukum untuk bab kandidat belum lengkap. Klasifikasi dihentikan agar tidak menghasilkan kode yang tidak didukung.",
  GEMINI_QUOTA_EXHAUSTED:
    "Kuota AI gratis untuk hari ini telah habis. Silakan coba lagi besok.",
  GEMINI_UNAVAILABLE: "Ada masalah dengan sistem AI. Hubungi administrator.",
  GEMINI_TIMEOUT: "Koneksi AI terputus. Silakan coba lagi.",
  GEMINI_INVALID_RESPONSE: "Respons AI tidak valid. Silakan coba lagi.",
};

function errorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.GEMINI_UNAVAILABLE;
}

function normalizeAnswers(raw: unknown): ClarificationAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 2).flatMap((item: unknown) => {
    if (typeof (item as Record<string, unknown>)?.question !== "string") return [];
    if (typeof (item as Record<string, unknown>)?.answer !== "string") return [];
    const question = String((item as Record<string, unknown>).question).trim().slice(0, 300);
    const answer = String((item as Record<string, unknown>).answer).trim().slice(0, 1000);
    return question && answer ? [{ question, answer }] : [];
  });
}

// ─────────────────────────────────────────────
// Pipeline
// ─────────────────────────────────────────────

/**
 * Menjalankan pipeline klasifikasi secara step-by-step dan mengemit
 * events ke controller stream.
 *
 * Pipeline:
 *   1. identifyCandidateChapters → emit step
 *   2. loadHs6Context            → emit step
 *   3. classifyWithNotes         → emit step
 *   4. emit clarification atau result
 */
async function runPipeline(
  controller: ReadableStreamDefaultController<Uint8Array>,
  descriptionText: string,
  clarificationAnswers: ClarificationAnswer[],
): Promise<void> {
  // ── Step 1: Identifikasi bab kandidat ─────────────────────────────────────
  emitStep(controller, "Mengidentifikasi bab HS yang relevan", "");

  const chapterIdentificationText =
    clarificationAnswers.length > 0
      ? `${descriptionText}\nKlarifikasi: ${clarificationAnswers
          .map(({ question, answer }) => `${question} ${answer}`)
          .join("; ")}`
      : descriptionText;

  const chaptersResult = await hsFinderGeminiService.identifyCandidateChapters(
    chapterIdentificationText,
  );

  if (!chaptersResult.ok) {
    emitError(controller, errorMessage(chaptersResult.error), chaptersResult.error);
    return;
  }

  const candidateChapters = chaptersResult.data;

  if (candidateChapters.length === 0) {
    emitError(controller, errorMessage("NO_CANDIDATE_CHAPTERS"), "NO_CANDIDATE_CHAPTERS");
    return;
  }

  emitStep(
    controller,
    "Mengidentifikasi bab HS yang relevan",
    `→ Bab ${candidateChapters.join(", Bab ")}`,
  );

  // ── Step 2: Muat catatan bab ──────────────────────────────────────────────
  emitStep(controller, "Memuat catatan bab", "");

  const context = await classificationKnowledge.loadHs6Context(candidateChapters);
  const notes = context.chapterNotes ?? context.notes ?? [];
  const coverageMap = context.coverageMap;

  const coverageDetail = candidateChapters
    .map((ch) => {
      const status = coverageMap.chapters[ch];
      // ✓ = catatan lokal tervalidasi, ~ = pakai pengetahuan internal Gemini
      return `Bab ${ch} ${status === "validated" ? "✓" : "~"}`;
    })
    .join("  ");

  emitStep(controller, "Memuat catatan bab", coverageDetail);

  // ── Step 3: Klasifikasi ───────────────────────────────────────────────────
  emitStep(controller, "Menerapkan aturan klasifikasi", "");

  const classifyResult = await hsFinderGeminiService.classifyWithNotes(
    descriptionText,
    notes,
    coverageMap as unknown as Record<string, unknown>,
    { clarificationAnswers },
  );

  if (!classifyResult.ok) {
    emitError(controller, errorMessage(classifyResult.error), classifyResult.error);
    return;
  }

  const classification = classifyResult.data as Record<string, unknown>;

  // Ambil kutipan aturan dari rekomendasi pertama untuk detail step
  const primaryQuotedRule =
    Array.isArray(classification.recommendations) &&
    classification.recommendations.length > 0
      ? (classification.recommendations[0] as Record<string, unknown>).quotedRule
      : null;

  emitStep(
    controller,
    "Menerapkan aturan klasifikasi",
    typeof primaryQuotedRule === "string" ? `"${primaryQuotedRule.slice(0, 120)}…"` : "Aturan diterapkan",
  );

  // ── Emit hasil ───────────────────────────────────────────────────────────
  if (classification.status === "needs_clarification") {
    emitLine(controller, {
      event: "clarification",
      reason: classification.clarificationReason ?? "",
      questions: Array.isArray(classification.questions) ? classification.questions : [],
    });
    return;
  }

  if (classification.status === "recommendations") {
    emitStep(controller, "Selesai", "");
    emitLine(controller, {
      event: "result",
      recommendations: Array.isArray(classification.recommendations)
        ? classification.recommendations
        : [],
      coverageMap,
    });
    return;
  }

  // Fallback: format lama (hsCode + reasoningPath)
  emitStep(controller, "Selesai", "");
  emitLine(controller, {
    event: "result",
    recommendations: [
      {
        hsCode: classification.hsCode,
        description: classification.description,
        confidence: "high",
        rationale:
          Array.isArray(classification.reasoningPath) && classification.reasoningPath.length > 0
            ? (classification.reasoningPath.at(-1) as Record<string, unknown>)?.content
            : null,
        quotedRule:
          Array.isArray(classification.reasoningPath) && classification.reasoningPath.length > 0
            ? (classification.reasoningPath.at(-1) as Record<string, unknown>)?.quotedRule
            : null,
      },
    ],
    coverageMap,
  });
}

// ─────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────

/**
 * Handles POST /api/hs-finder/chat.
 *
 * Request body:
 *   {
 *     message: string;
 *     context?: {
 *       previousMessage: string;
 *       clarificationReason: string;
 *       answers: { question: string; answer: string }[];
 *     };
 *   }
 *
 * Response: streaming NDJSON, Content-Type: application/x-ndjson
 */
export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        emitError(controller, "Permintaan tidak valid.");
        controller.close();
      },
    });
    return new Response(stream, {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
    });
  }

  const rawMessage = body?.message;
  if (typeof rawMessage !== "string" || rawMessage.trim().length < 3) {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        emitError(
          controller,
          "Deskripsi barang terlalu singkat. Minimal 3 karakter.",
        );
        controller.close();
      },
    });
    return new Response(stream, {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
    });
  }

  const descResult = makeItemDescription(rawMessage.trim(), "text");
  if (!descResult.ok || !descResult.data) {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        emitError(controller, descResult.error ?? "Permintaan tidak valid.");
        controller.close();
      },
    });
    return new Response(stream, {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
    });
  }

  // Susun teks deskripsi: jika ada context klarifikasi, gabungkan dengan jawaban
  const contextRaw = body?.context as Record<string, unknown> | undefined;
  const clarificationAnswers = normalizeAnswers(contextRaw?.answers);

  // Teks yang dikirim ke pipeline: pesan user saat ini
  // (clarificationAnswers dikirim terpisah ke classifyWithNotes)
  const descriptionText = descResult.data.text;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await runPipeline(controller, descriptionText, clarificationAnswers);
      } catch (err) {
        console.error("[hs-finder/chat] Unexpected error:", err);
        emitError(
          controller,
          "Ada masalah dengan sistem AI. Hubungi administrator.",
          "GEMINI_UNAVAILABLE",
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
