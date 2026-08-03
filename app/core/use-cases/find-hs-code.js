/**
 * FindHsCode Use Case — Core Layer
 *
 * Orchestrates end-to-end HS code classification:
 *   1. Identify candidate chapters via LLM
 *   2. Load chapter notes from knowledge base
 *   3. Classify with chapter notes via LLM
 *
 * @module core/use-cases/find-hs-code
 */

// ─────────────────────────────────────────────
// Error messages (Error Registry)
// ─────────────────────────────────────────────

const ERROR_MESSAGES = {
  NO_CANDIDATE_CHAPTERS:
    "Deskripsi barang tidak cukup jelas untuk mengidentifikasi bab HS yang relevan. Coba tambahkan detail material, fungsi, atau bentuk barang.",
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
function getErrorMessage(errorCode) {
  return ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.GEMINI_UNAVAILABLE;
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
 * @param {import('../../core/ports/chapter-note-loader.port').ChapterNoteLoaderPort} deps.chapterNoteLoader
 *   - must expose `loadChapters()`
 * @returns {{ execute: (input: { itemDescription: import('../entities/hs-finder').ItemDescription }) => Promise<FindHsCodeResult> }}
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
export function createFindHsCodeUseCase({ hsFinderGeminiService, chapterNoteLoader }) {
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
   * Req 4.3: continue classification even if all chapters are unvalidated
   * Req 4.4: include all loaded ChapterNotes in the classification prompt
   * Req 5.1: single LLM call with ItemDescription + all ChapterNotes
   *
   * @param {{ itemDescription: import('../entities/hs-finder').ItemDescription }} input
   * @returns {Promise<FindHsCodeResult>}
   */
  async function execute({ itemDescription }) {
    // ── Step 1: Identify candidate chapters ─────────────────────────────────
    const chaptersResult = await hsFinderGeminiService.identifyCandidateChapters(
      itemDescription.text
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
    // Req 4.3: graceful degradation — loadChapters never rejects; missing files
    // produce "unvalidated" entries in the coverageMap instead of errors.
    const { notes, coverageMap } = await chapterNoteLoader.loadChapters(candidateChapters);

    // ── Step 3: Classify with chapter notes ──────────────────────────────────
    // Req 4.4 + 5.1: pass ALL loaded notes in a single LLM call
    const classifyResult = await hsFinderGeminiService.classifyWithNotes(
      itemDescription.text,
      notes,
      coverageMap
    );

    if (!classifyResult.ok) {
      const errorCode = classifyResult.error;
      return {
        ok: false,
        errorCode,
        errorMessage: getErrorMessage(errorCode),
      };
    }

    return {
      ok: true,
      data: classifyResult.data,
    };
  }

  return { execute };
}
