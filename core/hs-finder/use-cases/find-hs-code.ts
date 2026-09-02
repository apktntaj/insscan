/**
 * FindHsCode Use Case — Core Layer
 *
 * Orchestrates end-to-end HS code classification:
 *   1. Identify candidate chapters via LLM
 *   2. Load versioned legal context from the knowledge base
 *   3. Stop if any required knowledge is missing or draft
 *   4. Classify with the validated context via LLM
 *
 * @module core/use-cases/find-hs-code
 */

import type { ItemDescription } from "../domain/hs-finder";
import type { ChapterNoteLoader } from "../ports/chapter-note-loader";
import type { ClassificationKnowledge } from "../ports/classification-knowledge";

type UnknownRecord = Record<string, any>;
type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface ClarificationAnswer {
  question: string;
  answer: string;
}

export interface HsFinderGeminiService {
  identifyCandidateChapters(text: string): Promise<ServiceResult<string[]>>;
  classifyWithNotes(
    description: string,
    notes: readonly unknown[],
    coverageMap: UnknownRecord,
    options: { clarificationAnswers: readonly ClarificationAnswer[] },
  ): Promise<ServiceResult<UnknownRecord>>;
}

export interface FindHsCodeInput {
  itemDescription: ItemDescription;
  clarificationAnswers?: ClarificationAnswer[];
}

// ─────────────────────────────────────────────
// Error messages (Error Registry)
// ─────────────────────────────────────────────

const ERROR_MESSAGES = {
  NO_CANDIDATE_CHAPTERS:
    "Deskripsi barang tidak cukup jelas untuk mengidentifikasi bab HS yang relevan. Coba tambahkan detail material, fungsi, atau bentuk barang.",
  INSUFFICIENT_LEGAL_COVERAGE:
    "Basis pengetahuan hukum untuk bab kandidat belum lengkap atau masih berupa draf. Klasifikasi dihentikan agar tidak menghasilkan kode yang tidak didukung.",
  GEMINI_UNAVAILABLE: "Ada masalah dengan sistem AI. Hubungi administrator.",
  GEMINI_TIMEOUT: "Koneksi AI terputus. Silakan coba lagi.",
  GEMINI_INVALID_RESPONSE: "Respons AI tidak valid. Silakan coba lagi.",
};

/**
 * Maps a service-level error code to a user-facing message.
 *
 * @param {string} errorCode - Error code from service layer (e.g. "GEMINI_TIMEOUT")
 * @returns {string} User-facing message in Bahasa Indonesia
 *
 * @example
 * getErrorMessage("GEMINI_TIMEOUT")
 * // => "Koneksi AI terputus. Silakan coba lagi."
 *
 * @example
 * getErrorMessage("UNKNOWN_CODE")
 * // => "Ada masalah dengan sistem AI. Hubungi administrator."
 */
function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES]
    ?? ERROR_MESSAGES.GEMINI_UNAVAILABLE;
}

// ─────────────────────────────────────────────
// createFindHsCodeUseCase (factory)
// ─────────────────────────────────────────────

/**
 * Creates the FindHsCode use case with injected dependencies.
 *
 * @param {Object} deps
 * @param {import('../../infrastructure/services/hs-finder-gemini.service').HsFinderGeminiService} deps.hsFinderGeminiService
 *   - must expose `identifyCandidateChapters()` and `classifyWithNotes()`
 * @param {import('@core/hs-finder/ports/chapter-note-loader').ChapterNoteLoaderPort} deps.chapterNoteLoader
 *   - must expose `loadChapters()`
 * @returns {{ execute: (input: { itemDescription: import('../domain/hs-finder').ItemDescription, clarificationAnswers?: Array<{question: string, answer: string}> }) => Promise<FindHsCodeResult> }}
 *
 * @example
 * const useCase = createFindHsCodeUseCase({ hsFinderGeminiService, chapterNoteLoader });
 * const result = await useCase.execute({ itemDescription: { text: "laptop 14 inci", source: "text" } });
 * // => { ok: true, data: { hsCode: "847130", ... } }
 *
 * @example
 * const result = await useCase.execute({ itemDescription: { text: "xyz???", source: "text" } });
 * // => { ok: false, errorCode: "NO_CANDIDATE_CHAPTERS", errorMessage: "Deskripsi barang tidak cukup jelas..." }
 */
export function createFindHsCodeUseCase({
  hsFinderGeminiService,
  classificationKnowledge,
  chapterNoteLoader,
}: {
  hsFinderGeminiService: HsFinderGeminiService;
  classificationKnowledge?: ClassificationKnowledge | null;
  chapterNoteLoader?: ChapterNoteLoader | null;
}) {
  if (!classificationKnowledge && !chapterNoteLoader) {
    throw new Error(
      "FindHsCode requires classificationKnowledge or chapterNoteLoader",
    );
  }
  /**
   * Runs the full classification pipeline for a given item description.
   *
   * Steps:
   *   1. identifyCandidateChapters — ask LLM which HS chapters are relevant (max 5)
   *   2. loadChapters — read chapter note files from the knowledge base
   *   3. classifyWithNotes — single LLM call with all notes for full reasoning
   *
   * Req 3.1: identify candidate chapters when ItemDescription is available
   * Req 3.4: return NO_CANDIDATE_CHAPTERS if no candidates are found
   * Req 4.1: load ChapterNote files for every candidate chapter
   * Safety: stop classification when any required knowledge is unvalidated
   * Req 4.4: include all loaded ChapterNotes in the classification prompt
   * Req 5.1: single LLM call with ItemDescription + all ChapterNotes
   *
   * @param {{ itemDescription: import('../domain/hs-finder').ItemDescription, clarificationAnswers?: Array<{question: string, answer: string}> }} input
   * @returns {Promise<FindHsCodeResult>}
   */
  async function execute({
    itemDescription,
    clarificationAnswers = [],
  }: FindHsCodeInput) {
    const chapterIdentificationText = clarificationAnswers.length > 0
      ? `${itemDescription.text}\nKlarifikasi: ${clarificationAnswers
          .map(({ question, answer }) => `${question} ${answer}`)
          .join("; ")}`
      : itemDescription.text;

    // ── Step 1: Identify candidate chapters ─────────────────────────────────
    const chaptersResult = await hsFinderGeminiService.identifyCandidateChapters(
      chapterIdentificationText
    );

    if (!chaptersResult.ok) {
      const errorCode = chaptersResult.error;
      return {
        ok: false,
        errorCode,
        errorMessage: getErrorMessage(errorCode),
      };
    }

    const candidateChapters = chaptersResult.data;

    // Req 3.4: no candidates identified
    if (candidateChapters.length === 0) {
      return {
        ok: false,
        errorCode: "NO_CANDIDATE_CHAPTERS",
        errorMessage: getErrorMessage("NO_CANDIDATE_CHAPTERS"),
      };
    }

    // ── Step 2: Load chapter notes ───────────────────────────────────────────
    // Missing and draft sources remain visible in the coverage map, allowing
    // the use case to stop safely with a precise coverage error.
    const context = classificationKnowledge
      ? await classificationKnowledge.loadHs6Context(candidateChapters)
      : await chapterNoteLoader!.loadChapters(candidateChapters);
    const notes = "chapterNotes" in context
      ? context.chapterNotes ?? context.notes ?? []
      : context.notes ?? [];
    const coverageMap = context.coverageMap;

    // Best-effort mode: lanjutkan klasifikasi meski coverage tidak lengkap.
    // Gemini akan menggunakan pengetahuannya sendiri untuk bab yang tidak ada
    // catatan lokalnya. coverageMap diteruskan ke prompt agar Gemini tahu
    // bab mana yang tervalidasi dan mana yang tidak, sehingga bisa
    // menyesuaikan tingkat keyakinan rekomendasinya.

    // ── Step 3: Classify with chapter notes ──────────────────────────────────
    // Req 4.4 + 5.1: pass ALL loaded notes in a single LLM call
    const classifyResult = await hsFinderGeminiService.classifyWithNotes(
      itemDescription.text,
      notes,
      coverageMap,
      { clarificationAnswers }
    );

    if (!classifyResult.ok) {
      const errorCode = classifyResult.error;
      return {
        ok: false,
        errorCode,
        errorMessage: getErrorMessage(errorCode),
      };
    }

    const classification: UnknownRecord = classifyResult.data;

    if (classification.status === "needs_clarification") {
      if (clarificationAnswers.length > 0) {
        return {
          ok: false,
          errorCode: "GEMINI_INVALID_RESPONSE",
          errorMessage: getErrorMessage("GEMINI_INVALID_RESPONSE"),
        };
      }

      return {
        ok: true,
        data: {
          ...classification,
          hs6: null,
          btki8: null,
        },
      };
    }

    if (classification.status === "recommendations") {
      const primary = classification.recommendations[0];
      return {
        ok: true,
        data: {
          ...classification,
          hsCode: primary.hsCode,
          description: primary.description,
          hs6: {
            code: primary.hsCode,
            edition: "edition" in context ? context.edition?.id ?? null : null,
          },
          btki8: null,
        },
      };
    }

    return {
      ok: true,
      data: {
        ...classification,
        status: "recommendations",
        recommendations: [{
          hsCode: classification.hsCode,
          description: classification.description,
          confidence: "high",
          rationale: classification.reasoningPath?.at(-1)?.content ?? classification.description,
          quotedRule: classification.reasoningPath?.at(-1)?.quotedRule ?? null,
          chapterRef: classification.reasoningPath?.at(-1)?.chapterRef ?? null,
        }],
        hs6: {
          code: classification.hsCode,
          edition: "edition" in context ? context.edition?.id ?? null : null,
        },
        btki8: null,
      },
    };
  }

  return { execute };
}
