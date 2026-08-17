/**
 * HS Finder Entities
 * Enterprise Business Rules — Pure domain objects and factory functions for HS Finder.
 */

// ─────────────────────────────────────────────
// @typedef definitions
// ─────────────────────────────────────────────

/**
 * Status ketersediaan ChapterNote untuk suatu bab.
 * @typedef {"validated" | "draft" | "unvalidated"} CoverageStatus
 */

/**
 * Satu file catatan bab yang berhasil dimuat dari knowledge base.
 * @typedef {Object} ChapterNote
 * @property {string} chapterNumber  - Nomor bab dua digit, e.g. "84"
 * @property {string} title          - Judul bab, e.g. "Mesin dan Peralatan Mekanik"
 * @property {string} content        - Isi lengkap file .md
 * @property {CoverageStatus} status - "validated" karena file ini ada
 */

/**
 * Deskripsi barang yang sudah dinormalisasi, siap digunakan untuk klasifikasi.
 * @typedef {Object} ItemDescription
 * @property {string} text             - Teks deskripsi (sudah di-trim)
 * @property {"text" | "photo"} source - Asal input
 */

/**
 * Satu langkah dalam reasoning path.
 * @typedef {Object} ReasoningStep
 * @property {number} stepNumber           - Urutan langkah (1–5)
 * @property {string} title                - Label langkah
 * @property {string} content              - Penjelasan langkah
 * @property {string|null} quotedRule      - Teks aturan yang dikutip dari ChapterNote (null jika tidak ada)
 * @property {string|null} chapterRef      - Nomor bab yang dikutip (null jika tidak ada)
 * @property {CoverageStatus|null} coverage - Status coverage bab yang dikutip (null jika tidak ada kutipan)
 */

/**
 * Peta coverage per bab kandidat.
 * @typedef {Object} CoverageMap
 * @property {Record<string, CoverageStatus>} chapters - Map dari nomor bab ke CoverageStatus
 * @property {boolean} hasUnvalidated - true jika ada setidaknya satu bab "unvalidated"
 */

/**
 * Hasil klasifikasi final.
 * @typedef {Object} ClassificationResult
 * @property {string} hsCode                    - HS code 6-digit, e.g. "847130"
 * @property {string} description               - Deskripsi resmi subheading
 * @property {ReasoningStep[]} reasoningPath    - Array tepat 5 langkah reasoning
 * @property {CoverageMap} coverageMap          - Status coverage semua bab kandidat
 */

/**
 * Status session finder.
 * @typedef {"idle" | "identifying_photo" | "identifying_chapters" | "loading_notes" | "classifying" | "done" | "error"} FinderStatus
 */

/**
 * State lengkap satu sesi pencarian HS code.
 * @typedef {Object} FinderSession
 * @property {FinderStatus} status
 * @property {string} rawInput
 * @property {ItemDescription|null} itemDescription
 * @property {string[]|null} candidateChapters
 * @property {ClassificationResult|null} result
 * @property {string|null} errorMessage
 */

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const MIN_DESCRIPTION_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 2000;
const HS_CODE_PATTERN = /^\d{6}$/;
const REASONING_STEPS_REQUIRED = 5;
const RECOMMENDATION_CONFIDENCE_LEVELS = new Set(["high", "medium", "low"]);
const MAX_RECOMMENDATIONS = 3;
const MAX_CLARIFICATION_QUESTIONS = 2;

// ─────────────────────────────────────────────
// makeItemDescription
// ─────────────────────────────────────────────

/**
 * Validates and normalises a raw item description string.
 * Trims whitespace first, then enforces length constraints.
 *
 * Invariants:
 *  - Trimmed length must be >= 3 characters
 *  - Trimmed length must be <= 2000 characters
 *
 * @param {string} text   - Raw description text (may contain leading/trailing whitespace)
 * @param {"text" | "photo"} source - Input origin
 * @returns {{ ok: true, data: ItemDescription } | { ok: false, error: string }}
 *
 * @example
 * makeItemDescription("  laptop 14 inci prosesor Intel  ", "text")
 * // => { ok: true, data: { text: "laptop 14 inci prosesor Intel", source: "text" } }
 *
 * @example
 * makeItemDescription("ok", "text")
 * // => { ok: false, error: "Deskripsi barang terlalu singkat." }
 */
export function makeItemDescription(text, source) {
  const trimmed = text.trim();

  if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
    return { ok: false, error: "Deskripsi barang terlalu singkat." };
  }

  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      error: "Deskripsi terlalu panjang (maksimum 2.000 karakter).",
    };
  }

  return {
    ok: true,
    data: Object.freeze({ text: trimmed, source }),
  };
}

// ─────────────────────────────────────────────
// makeClassificationResult
// ─────────────────────────────────────────────

/**
 * Validates a raw parsed JSON object from Gemini and constructs a ClassificationResult.
 *
 * Invariants:
 *  - hsCode must match /^\d{6}$/
 *  - reasoningPath must have exactly 5 steps
 *  - reasoningPath[i].stepNumber must equal i + 1 (steps ordered 1–5)
 *
 * @param {Object} raw - Parsed JSON from Gemini classification response
 * @returns {{ ok: true, data: ClassificationResult } | { ok: false, error: string }}
 *
 * @example
 * makeClassificationResult({
 *   hsCode: "847130",
 *   description: "Mesin pengolah data portabel",
 *   reasoningPath: [
 *     { stepNumber: 1, title: "Identifikasi Barang", content: "...", quotedRule: null, chapterRef: null, coverage: null },
 *     { stepNumber: 2, title: "Eliminasi Bab", content: "...", quotedRule: "...", chapterRef: "84", coverage: "validated" },
 *     { stepNumber: 3, title: "Konfirmasi Bab", content: "...", quotedRule: "...", chapterRef: "84", coverage: "validated" },
 *     { stepNumber: 4, title: "Penentuan Heading", content: "...", quotedRule: "...", chapterRef: "84", coverage: "validated" },
 *     { stepNumber: 5, title: "Penentuan Subheading", content: "...", quotedRule: "...", chapterRef: "84", coverage: "validated" },
 *   ],
 *   coverageMap: { chapters: { "84": "validated" }, hasUnvalidated: false }
 * })
 * // => { ok: true, data: { hsCode: "847130", ... } }
 *
 * @example
 * makeClassificationResult({ hsCode: "8471", description: "...", reasoningPath: [], coverageMap: { chapters: {}, hasUnvalidated: false } })
 * // => { ok: false, error: "HS code tidak valid: harus 6 digit angka." }
 */
export function makeClassificationResult(raw) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Data klasifikasi tidak valid." };
  }

  const { hsCode, description, reasoningPath, coverageMap } = raw;

  // Validate hsCode
  if (typeof hsCode !== "string" || !HS_CODE_PATTERN.test(hsCode)) {
    return { ok: false, error: "HS code tidak valid: harus 6 digit angka." };
  }

  // Validate description
  if (typeof description !== "string" || description.trim().length === 0) {
    return { ok: false, error: "Deskripsi subheading tidak boleh kosong." };
  }

  // Validate reasoningPath
  if (!Array.isArray(reasoningPath)) {
    return { ok: false, error: "reasoningPath harus berupa array." };
  }

  if (reasoningPath.length !== REASONING_STEPS_REQUIRED) {
    return {
      ok: false,
      error: `reasoningPath harus memiliki tepat ${REASONING_STEPS_REQUIRED} langkah (ditemukan ${reasoningPath.length}).`,
    };
  }

  for (let i = 0; i < reasoningPath.length; i++) {
    const step = reasoningPath[i];
    if (!step || typeof step !== "object") {
      return { ok: false, error: `Langkah ${i + 1} dalam reasoningPath tidak valid.` };
    }
    if (step.stepNumber !== i + 1) {
      return {
        ok: false,
        error: `Langkah ke-${i + 1} memiliki stepNumber ${step.stepNumber}, diharapkan ${i + 1}.`,
      };
    }
  }

  // Validate coverageMap
  if (!coverageMap || typeof coverageMap !== "object") {
    return { ok: false, error: "coverageMap tidak valid." };
  }

  if (typeof coverageMap.chapters !== "object" || coverageMap.chapters === null) {
    return { ok: false, error: "coverageMap.chapters tidak valid." };
  }

  if (typeof coverageMap.hasUnvalidated !== "boolean") {
    return { ok: false, error: "coverageMap.hasUnvalidated harus boolean." };
  }

  return {
    ok: true,
    data: Object.freeze({
      hsCode,
      description: description.trim(),
      reasoningPath: reasoningPath.map((step) => Object.freeze({ ...step })),
      coverageMap: Object.freeze({
        chapters: { ...coverageMap.chapters },
        hasUnvalidated: coverageMap.hasUnvalidated,
      }),
    }),
  };
}

// ─────────────────────────────────────────────
// makeClassificationDecision
// ─────────────────────────────────────────────

/**
 * Validates the adaptive classification response. Clarification is allowed only
 * when one or two targeted answers are required; otherwise ranked HS6
 * recommendations are returned directly.
 */
export function makeClassificationDecision(raw) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Data keputusan klasifikasi tidak valid." };
  }

  const coverageMap = raw.coverageMap;
  if (
    !coverageMap ||
    typeof coverageMap !== "object" ||
    !coverageMap.chapters ||
    typeof coverageMap.chapters !== "object" ||
    typeof coverageMap.hasUnvalidated !== "boolean"
  ) {
    return { ok: false, error: "coverageMap tidak valid." };
  }

  const normalizedCoverage = Object.freeze({
    chapters: Object.freeze({ ...coverageMap.chapters }),
    hasUnvalidated: coverageMap.hasUnvalidated,
  });

  if (raw.status === "needs_clarification") {
    const questions = [...new Set(
      (Array.isArray(raw.questions) ? raw.questions : [])
        .filter((question) => typeof question === "string" && question.trim())
        .map((question) => question.trim().slice(0, 300))
    )].slice(0, MAX_CLARIFICATION_QUESTIONS);
    const reason = typeof raw.clarificationReason === "string"
      ? raw.clarificationReason.trim().slice(0, 500)
      : "";

    if (questions.length === 0 || !reason) {
      return { ok: false, error: "Permintaan klarifikasi tidak valid." };
    }

    return {
      ok: true,
      data: Object.freeze({
        status: "needs_clarification",
        clarificationReason: reason,
        questions: Object.freeze(questions),
        recommendations: Object.freeze([]),
        coverageMap: normalizedCoverage,
      }),
    };
  }

  if (raw.status !== "recommendations" || !Array.isArray(raw.recommendations)) {
    return { ok: false, error: "Status keputusan klasifikasi tidak valid." };
  }

  const recommendations = [];
  const seenCodes = new Set();
  for (const item of raw.recommendations.slice(0, MAX_RECOMMENDATIONS)) {
    const hsCode = typeof item?.hsCode === "string" ? item.hsCode.trim() : "";
    const description = typeof item?.description === "string" ? item.description.trim() : "";
    const rationale = typeof item?.rationale === "string" ? item.rationale.trim() : "";
    if (
      !HS_CODE_PATTERN.test(hsCode) ||
      !description ||
      !rationale ||
      !RECOMMENDATION_CONFIDENCE_LEVELS.has(item?.confidence) ||
      seenCodes.has(hsCode)
    ) {
      continue;
    }

    seenCodes.add(hsCode);
    recommendations.push(Object.freeze({
      hsCode,
      description: description.slice(0, 500),
      confidence: item.confidence,
      rationale: rationale.slice(0, 1000),
      quotedRule: typeof item.quotedRule === "string" && item.quotedRule.trim()
        ? item.quotedRule.trim().slice(0, 1000)
        : null,
      chapterRef: typeof item.chapterRef === "string" && /^\d{2}$/.test(item.chapterRef)
        ? item.chapterRef
        : null,
    }));
  }

  if (recommendations.length === 0) {
    return { ok: false, error: "Tidak ada rekomendasi HS code yang valid." };
  }

  return {
    ok: true,
    data: Object.freeze({
      status: "recommendations",
      clarificationReason: null,
      questions: Object.freeze([]),
      recommendations: Object.freeze(recommendations),
      coverageMap: normalizedCoverage,
    }),
  };
}

// ─────────────────────────────────────────────
// makeCoverageMap
// ─────────────────────────────────────────────

/**
 * Builds a CoverageMap from the list of candidate chapters and the chapters
 * that were successfully loaded from the knowledge base.
 *
 * Rules:
 *  - Every candidate appears in the output chapters map
 *  - Candidates present in loadedChapterNumbers → "validated"
 *  - Candidates absent from loadedChapterNumbers → "unvalidated"
 *  - hasUnvalidated = true iff at least one chapter is "unvalidated"
 *
 * @param {string[]} candidateChapters       - All candidate chapter numbers
 * @param {string[]} loadedChapterNumbers    - Chapter numbers successfully loaded
 * @returns {CoverageMap}
 *
 * @example
 * makeCoverageMap(["84", "85", "90"], ["84", "85"])
 * // => { chapters: { "84": "validated", "85": "validated", "90": "unvalidated" }, hasUnvalidated: true }
 *
 * @example
 * makeCoverageMap(["84", "85"], ["84", "85"])
 * // => { chapters: { "84": "validated", "85": "validated" }, hasUnvalidated: false }
 */
export function makeCoverageMap(candidateChapters, loadedChapterNumbers) {
  const loadedSet = new Set(loadedChapterNumbers);

  /** @type {Record<string, CoverageStatus>} */
  const chapters = {};
  let hasUnvalidated = false;

  for (const chapter of candidateChapters) {
    if (loadedSet.has(chapter)) {
      chapters[chapter] = "validated";
    } else {
      chapters[chapter] = "unvalidated";
      hasUnvalidated = true;
    }
  }

  return Object.freeze({ chapters: Object.freeze(chapters), hasUnvalidated });
}
