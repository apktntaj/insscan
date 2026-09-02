/**
 * HS Finder Presenter
 * Interface Adapters Layer
 *
 * @description Transforms ClassificationResult domain objects to view models
 * ready for rendering in the UI.
 */

import type {
  ClassificationResult,
  CoverageMap,
  CoverageStatus,
} from "@core/hs-finder/domain/hs-finder";

export interface ReasoningStepViewModel {
  stepNumber: number;
  title: string;
  content: string;
  quotedRule: string | null;
  chapterRef: string | null;
  coverageLabel: string | null;
  coverage: CoverageStatus | null;
}

export interface CoverageMapViewModel {
  chapters: Record<string, CoverageStatus>;
  hasUnvalidated: boolean;
}

export interface ClassificationResultViewModel {
  hsCode: string;
  hsCodeFormatted: string;
  description: string;
  reasoningPath: readonly ReasoningStepViewModel[];
  coverageMap: CoverageMapViewModel;
  hasUnvalidated: boolean;
}
// ─────────────────────────────────────────────
// @typedef definitions
// ─────────────────────────────────────────────

/**
 * @typedef {Object} ReasoningStepViewModel
 * @property {number} stepNumber
 * @property {string} title
 * @property {string} content
 * @property {string|null} quotedRule
 * @property {string|null} chapterRef
 * @property {string|null} coverageLabel  - "Tervalidasi" | "Belum Tervalidasi" | null
 * @property {string|null} coverage       - raw "validated" | "unvalidated" | null
 */

/**
 * @typedef {Object} CoverageMapViewModel
 * @property {Record<string, string>} chapters - Map dari nomor bab ke CoverageStatus
 * @property {boolean} hasUnvalidated
 */

/**
 * @typedef {Object} ClassificationResultViewModel
 * @property {string} hsCode           - Raw 6-digit code e.g. "847130"
 * @property {string} hsCodeFormatted  - With dots e.g. "8471.30"
 * @property {string} description      - Subheading description
 * @property {ReasoningStepViewModel[]} reasoningPath
 * @property {CoverageMapViewModel} coverageMap
 * @property {boolean} hasUnvalidated  - Shortcut for showing disclaimer
 */

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Formats a raw 6-digit HS code into dotted notation: XXXX.XX
 *
 * @param {string} hsCode - Raw 6-digit HS code, e.g. "847130"
 * @returns {string} Formatted code with dot, e.g. "8471.30"
 *
 * @example
 * formatHsCode("847130")
 * // => "8471.30"
 *
 * @example
 * formatHsCode("010121")
 * // => "0101.21"
 */
function formatHsCode(hsCode: string): string {
  return `${hsCode.slice(0, 4)}.${hsCode.slice(4, 6)}`;
}

/**
 * Maps a raw CoverageStatus to a human-readable Bahasa Indonesia label.
 * Returns null if status is null or unrecognised.
 *
 * @param {string|null} coverage - "validated" | "unvalidated" | null
 * @returns {string|null} "Tervalidasi" | "Belum Tervalidasi" | null
 *
 * @example
 * toCoverageLabel("validated")
 * // => "Tervalidasi"
 *
 * @example
 * toCoverageLabel("unvalidated")
 * // => "Belum Tervalidasi"
 *
 * @example
 * toCoverageLabel(null)
 * // => null
 */
function toCoverageLabel(coverage: CoverageStatus | null): string | null {
  if (coverage === "validated") return "Tervalidasi";
  if (coverage === "unvalidated") return "Belum Tervalidasi";
  return null;
}

// ─────────────────────────────────────────────
// presentClassificationResult
// ─────────────────────────────────────────────

/**
 * Transforms a ClassificationResult domain object into a ClassificationResultViewModel
 * ready for rendering. Formats the HS code with dots and maps coverage statuses to
 * human-readable Bahasa Indonesia labels.
 *
 * @param {import('@core/hs-finder/domain/hs-finder').ClassificationResult} result
 * @returns {ClassificationResultViewModel}
 *
 * @example
 * presentClassificationResult({
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
 * // => { hsCode: "847130", hsCodeFormatted: "8471.30", description: "Mesin pengolah data portabel", ... }
 *
 * @example
 * presentClassificationResult({
 *   hsCode: "550920",
 *   description: "Benang dari serat stapel sintetik",
 *   reasoningPath: [
 *     { stepNumber: 1, title: "Identifikasi Barang", content: "...", quotedRule: null, chapterRef: null, coverage: null },
 *     { stepNumber: 2, title: "Eliminasi Bab", content: "...", quotedRule: null, chapterRef: "55", coverage: "unvalidated" },
 *     { stepNumber: 3, title: "Konfirmasi Bab", content: "...", quotedRule: null, chapterRef: "55", coverage: "unvalidated" },
 *     { stepNumber: 4, title: "Penentuan Heading", content: "...", quotedRule: null, chapterRef: "55", coverage: "unvalidated" },
 *     { stepNumber: 5, title: "Penentuan Subheading", content: "...", quotedRule: null, chapterRef: "55", coverage: "unvalidated" },
 *   ],
 *   coverageMap: { chapters: { "55": "unvalidated" }, hasUnvalidated: true }
 * })
 * // => { hsCode: "550920", hsCodeFormatted: "5509.20", ..., hasUnvalidated: true }
 */
export function presentClassificationResult(
  result: ClassificationResult,
): ClassificationResultViewModel {
  const reasoningPath: ReasoningStepViewModel[] = result.reasoningPath.map((step) => ({
    stepNumber: step.stepNumber,
    title: step.title,
    content: step.content,
    quotedRule: step.quotedRule ?? null,
    chapterRef: step.chapterRef ?? null,
    coverageLabel: toCoverageLabel(step.coverage ?? null),
    coverage: step.coverage ?? null,
  }));

  return {
    hsCode: result.hsCode,
    hsCodeFormatted: formatHsCode(result.hsCode),
    description: result.description,
    reasoningPath,
    coverageMap: {
      chapters: { ...result.coverageMap.chapters },
      hasUnvalidated: result.coverageMap.hasUnvalidated,
    } satisfies CoverageMapViewModel,
    hasUnvalidated: result.coverageMap.hasUnvalidated,
  };
}
