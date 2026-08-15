/**
 * HS Finder Gemini Service — Infrastructure Layer
 *
 * Provides Gemini API calls specifically for the HS Finder feature:
 * photo identification, candidate chapter identification, and full
 * classification with chapter notes. Prompts and error codes are
 * intentionally separate from the BL extractor gemini.service.js.
 *
 * @module infrastructure/services/hs-finder-gemini
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { makeClassificationResult } from "@core/entities/hs-finder.js";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.5-flash";
const PHOTO_TIMEOUT_MS = 45_000;
const CHAPTER_TIMEOUT_MS = 45_000;
const CLASSIFICATION_TIMEOUT_MS = 60_000;
const MAX_CANDIDATE_CHAPTERS = 5;
const CHAPTER_NUMBER_PATTERN = /^\d{2}$/;
const MIN_PHOTO_DESCRIPTION_LENGTH = 5;

/**
 * Adds a stage-specific deadline and always releases its timer afterward.
 * Gemini 2.5 may need longer for the final classification prompt because it
 * includes chapter notes and a structured reasoning response.
 */
async function withTimeout(promise, timeoutMs) {
  let timeoutId;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─────────────────────────────────────────────
// Helpers — prompt builders
// ─────────────────────────────────────────────

/**
 * Builds the photo identification prompt in Bahasa Indonesia.
 * Asks Gemini Vision to describe the item's name, material, function, and form.
 *
 * @returns {string} Prompt string for Gemini Vision
 *
 * @example
 * buildPhotoIdentificationPrompt()
 * // => "Kamu adalah ahli identifikasi barang..."
 */
export function buildPhotoIdentificationPrompt() {
  return `Kamu adalah ahli identifikasi barang untuk keperluan klasifikasi bea cukai.

Perhatikan foto yang diberikan dan identifikasi barang yang ada di dalam foto.

Berikan deskripsi singkat dalam Bahasa Indonesia yang mencakup:
- Nama barang
- Material atau bahan utama
- Fungsi atau kegunaan utama
- Bentuk fisik

Tulis deskripsi dalam 2–4 kalimat saja. Jangan gunakan format JSON atau bullet point — tulis sebagai teks biasa.

Jika kamu tidak dapat mengidentifikasi barang dari foto ini, jawab tepat dengan kata: TIDAK_DAPAT_DIIDENTIFIKASI`;
}

/**
 * Builds the full classification prompt including all chapter notes and
 * explicit instruction to cite specific rules per reasoning step.
 *
 * @param {string} itemDescription - Normalized item description text
 * @param {import('../../core/entities/hs-finder').ChapterNote[]} chapterNotes - Loaded chapter notes
 * @param {import('../../core/entities/hs-finder').CoverageMap} coverageMap - Coverage status per chapter
 * @returns {string} Full prompt string for Gemini classification call
 *
 * @example
 * buildClassificationPrompt("laptop 14 inci", [{ chapterNumber: "84", title: "Mesin...", content: "...", status: "validated" }], { chapters: { "84": "validated" }, hasUnvalidated: false })
 * // => "Kamu adalah ahli klasifikasi HS code..."
 *
 * @example
 * buildClassificationPrompt("kain polyester", [], { chapters: { "55": "unvalidated" }, hasUnvalidated: true })
 * // => "Kamu adalah ahli klasifikasi HS code..." (includes unvalidated disclaimer)
 */
export function buildClassificationPrompt(itemDescription, chapterNotes, coverageMap) {
  const notesSection = chapterNotes.length > 0
    ? chapterNotes.map((note) => {
        const statusLabel = note.status === "validated" ? "TERVALIDASI" : "BELUM TERVALIDASI";
        return `--- BAB ${note.chapterNumber} [${statusLabel}] ---\n${note.content}\n`;
      }).join("\n")
    : "(Tidak ada catatan bab yang tersedia — gunakan pengetahuan umum dan tandai setiap langkah dengan ⚠️ tidak ada catatan tervalidasi)";

  return `Kamu adalah ahli klasifikasi HS code. Tugasmu mengklasifikasikan barang berikut berdasarkan HANYA catatan bab yang disediakan di bawah ini.

PENTING:
- Setiap kesimpulan HARUS mengutip teks spesifik dari catatan bab yang disediakan.
- Jangan membuat klaim berdasarkan pengetahuan umum jika tidak ada kutipan yang mendukung.
- Untuk bab yang ditandai [BELUM TERVALIDASI], gunakan pengetahuan umummu tapi tandai setiap langkah dengan "⚠️ tidak ada catatan tervalidasi untuk bab ini".
- Setiap kesimpulan harus mengutip teks spesifik dari catatan bab yang disediakan. Jangan membuat klaim tanpa dasar dari catatan bab.

BARANG YANG DIKLASIFIKASIKAN:
${itemDescription}

CATATAN BAB YANG TERSEDIA:
${notesSection}

FORMAT OUTPUT (JSON saja, tanpa markdown code fence):
{
  "hsCode": "6 digit angka, contoh: 847130",
  "description": "deskripsi subheading dalam Bahasa Indonesia",
  "reasoningPath": [
    {
      "stepNumber": 1,
      "title": "Identifikasi Barang",
      "content": "Deskripsikan nama barang, material utama, fungsi, dan bentuk fisik.",
      "quotedRule": null,
      "chapterRef": null,
      "coverage": null
    },
    {
      "stepNumber": 2,
      "title": "Eliminasi Bab",
      "content": "Jelaskan bab mana yang dieliminasi dan mengapa, kutip teks dari catatan bab.",
      "quotedRule": "teks kutipan langsung dari catatan bab",
      "chapterRef": "nomor bab 2 digit, contoh: 84",
      "coverage": "validated atau unvalidated"
    },
    {
      "stepNumber": 3,
      "title": "Konfirmasi Bab",
      "content": "Jelaskan mengapa bab ini yang paling tepat, kutip teks dari catatan bab.",
      "quotedRule": "teks kutipan langsung dari catatan bab",
      "chapterRef": "nomor bab 2 digit",
      "coverage": "validated atau unvalidated"
    },
    {
      "stepNumber": 4,
      "title": "Penentuan Heading",
      "content": "Jelaskan heading (4-digit) yang dipilih beserta alasan.",
      "quotedRule": "teks kutipan langsung dari catatan bab",
      "chapterRef": "nomor bab 2 digit",
      "coverage": "validated atau unvalidated"
    },
    {
      "stepNumber": 5,
      "title": "Penentuan Subheading",
      "content": "Jelaskan subheading (6-digit) yang dipilih beserta alasan.",
      "quotedRule": "teks kutipan langsung dari catatan bab",
      "chapterRef": "nomor bab 2 digit",
      "coverage": "validated atau unvalidated"
    }
  ],
  "coverageMap": ${JSON.stringify(coverageMap)}
}

Pastikan:
1. hsCode berisi tepat 6 digit angka (tanpa titik atau spasi)
2. reasoningPath berisi tepat 5 langkah dengan stepNumber 1 sampai 5 berurutan
3. Setiap langkah yang mengutip aturan (stepNumber 2–5) harus mengisi quotedRule dengan kutipan nyata dari catatan bab
4. Output hanya JSON murni — tidak ada teks pengantar, tidak ada code fence`;
}

// ─────────────────────────────────────────────
// Helpers — response parsers
// ─────────────────────────────────────────────

/**
 * Strips markdown code fences from a string.
 *
 * @param {string} text - Raw response text potentially wrapped in code fences
 * @returns {string} Text with code fences removed
 *
 * @example
 * stripCodeFences("```json\n[\"84\"]\n```")
 * // => "[\"84\"]"
 *
 * @example
 * stripCodeFences("[\"84\"]")
 * // => "[\"84\"]"
 */
function stripCodeFences(text) {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

/**
 * Parses a Gemini response containing a JSON array of chapter numbers.
 * Validates each item matches /^\d{2}$/ and truncates to max 5.
 * Invalid (non-2-digit-numeric) items are silently skipped.
 *
 * @param {string} responseText - Raw text from Gemini response
 * @returns {{ ok: true, data: string[] } | { ok: false, error: string }}
 *
 * @example
 * parseChapterListResponse('```json\n["84", "85", "90"]\n```')
 * // => { ok: true, data: ["84", "85", "90"] }
 *
 * @example
 * parseChapterListResponse('["01","02","03","04","05","06","07"]')
 * // => { ok: true, data: ["01","02","03","04","05"] }
 */
export function parseChapterListResponse(responseText) {
  try {
    const cleaned = stripCodeFences(responseText);
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      return { ok: false, error: "GEMINI_INVALID_RESPONSE" };
    }

    const valid = parsed
      .filter((item) => typeof item === "string" && CHAPTER_NUMBER_PATTERN.test(item))
      .slice(0, MAX_CANDIDATE_CHAPTERS);

    return { ok: true, data: valid };
  } catch {
    return { ok: false, error: "GEMINI_INVALID_RESPONSE" };
  }
}

/**
 * Parses a Gemini response containing a full classification result JSON.
 * Strips code fences, parses JSON, then validates via makeClassificationResult().
 *
 * @param {string} responseText - Raw text from Gemini response
 * @returns {{ ok: true, data: import('../../core/entities/hs-finder').ClassificationResult } | { ok: false, error: string }}
 *
 * @example
 * parseClassificationResponse('{"hsCode":"847130","description":"...","reasoningPath":[...],"coverageMap":{...}}')
 * // => { ok: true, data: { hsCode: "847130", ... } }
 *
 * @example
 * parseClassificationResponse("tidak valid json")
 * // => { ok: false, error: "GEMINI_INVALID_RESPONSE" }
 */
export function parseClassificationResponse(responseText) {
  try {
    const cleaned = stripCodeFences(responseText);
    const raw = JSON.parse(cleaned);
    const result = makeClassificationResult(raw);
    if (!result.ok) {
      return { ok: false, error: "GEMINI_INVALID_RESPONSE" };
    }
    return result;
  } catch {
    return { ok: false, error: "GEMINI_INVALID_RESPONSE" };
  }
}

// ─────────────────────────────────────────────
// createHsFinderGeminiService (factory)
// ─────────────────────────────────────────────

/**
 * Factory function that creates a Gemini service for the HS Finder feature.
 * Uses prompts tailored for item identification and HS classification —
 * completely separate from the BL extractor in gemini.service.js.
 *
 * @param {string} geminiApiKey - Google Gemini API key
 * @returns {{ identifyFromPhoto: Function, identifyCandidateChapters: Function, classifyWithNotes: Function }}
 *
 * @example
 * const service = createHsFinderGeminiService(process.env.GEMINI_API_KEY);
 * const result = await service.identifyCandidateChapters("laptop 14 inci Intel i7");
 * // => { ok: true, data: ["84", "85"] }
 *
 * @example
 * const service = createHsFinderGeminiService("invalid-key");
 * // service methods still exist but will return GEMINI_UNAVAILABLE errors at call time
 */
export function createHsFinderGeminiService(geminiApiKey) {
  if (!geminiApiKey || typeof geminiApiKey !== "string" || geminiApiKey.length <= 10) {
    return {
      identifyFromPhoto: async () => ({ ok: false, error: "GEMINI_UNAVAILABLE" }),
      identifyCandidateChapters: async () => ({ ok: false, error: "GEMINI_UNAVAILABLE" }),
      classifyWithNotes: async () => ({ ok: false, error: "GEMINI_UNAVAILABLE" }),
    };
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  // ─────────────────────────────────────────────
  // identifyFromPhoto
  // ─────────────────────────────────────────────

  /**
   * Sends an image to Gemini Vision for item identification in Bahasa Indonesia.
   * Returns a text description (name, material, function, form).
   *
   * @param {string} imageBase64 - Base64-encoded image data
   * @param {string} mimeType - Image MIME type, e.g. "image/jpeg"
   * @returns {Promise<{ ok: true, data: string } | { ok: false, error: string }>}
   * Error codes: GEMINI_TIMEOUT, GEMINI_UNAVAILABLE, PHOTO_UNIDENTIFIABLE
   *
   * @example
   * await service.identifyFromPhoto(base64Jpg, "image/jpeg")
   * // => { ok: true, data: "Laptop 14 inci dengan casing aluminium, berfungsi sebagai komputer portabel." }
   *
   * @example
   * await service.identifyFromPhoto(blurryBase64, "image/jpeg")
   * // => { ok: false, error: "PHOTO_UNIDENTIFIABLE" }
   */
  async function identifyFromPhoto(imageBase64, mimeType) {
    const prompt = buildPhotoIdentificationPrompt();

    try {
      const result = await withTimeout(
        model.generateContent([
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt },
        ]),
        PHOTO_TIMEOUT_MS
      );

      const responseText = result.response.text().trim();

      if (!responseText || responseText.length < MIN_PHOTO_DESCRIPTION_LENGTH) {
        return { ok: false, error: "PHOTO_UNIDENTIFIABLE" };
      }

      if (responseText.includes("TIDAK_DAPAT_DIIDENTIFIKASI")) {
        return { ok: false, error: "PHOTO_UNIDENTIFIABLE" };
      }

      return { ok: true, data: responseText };
    } catch (err) {
      return _mapError(err);
    }
  }

  // ─────────────────────────────────────────────
  // identifyCandidateChapters
  // ─────────────────────────────────────────────

  /**
   * Asks Gemini to identify up to 5 HS chapter numbers most relevant to the item.
   * Returns an array of 2-digit numeric strings.
   *
   * @param {string} itemDescription - Normalized item description text
   * @returns {Promise<{ ok: true, data: string[] } | { ok: false, error: string }>}
   * Error codes: NO_CANDIDATE_CHAPTERS, GEMINI_TIMEOUT, GEMINI_UNAVAILABLE, GEMINI_INVALID_RESPONSE
   *
   * @example
   * await service.identifyCandidateChapters("laptop 14 inci prosesor Intel i7")
   * // => { ok: true, data: ["84", "85"] }
   *
   * @example
   * await service.identifyCandidateChapters("xyz???")
   * // => { ok: false, error: "NO_CANDIDATE_CHAPTERS" }
   */
  async function identifyCandidateChapters(itemDescription) {
    const prompt = `Kamu adalah ahli klasifikasi HS code. Berdasarkan deskripsi barang di bawah ini, identifikasi maksimum 5 nomor bab HS yang paling mungkin relevan.

BARANG:
${itemDescription}

Kembalikan HANYA array JSON berisi nomor bab sebagai string 2 digit. Contoh: ["84", "85", "90"]

Jangan sertakan penjelasan apapun — hanya array JSON.`;

    try {
      const result = await withTimeout(
        model.generateContent(prompt),
        CHAPTER_TIMEOUT_MS
      );

      const responseText = result.response.text().trim();
      const parsed = parseChapterListResponse(responseText);

      if (!parsed.ok) {
        return { ok: false, error: "GEMINI_INVALID_RESPONSE" };
      }

      if (parsed.data.length === 0) {
        return { ok: false, error: "NO_CANDIDATE_CHAPTERS" };
      }

      return { ok: true, data: parsed.data };
    } catch (err) {
      return _mapError(err);
    }
  }

  // ─────────────────────────────────────────────
  // classifyWithNotes
  // ─────────────────────────────────────────────

  /**
   * Sends a single LLM call with the item description and all chapter notes.
   * Returns a full ClassificationResult with 5-step reasoning path.
   *
   * @param {string} itemDescription - Normalized item description text
   * @param {import('../../core/entities/hs-finder').ChapterNote[]} chapterNotes - Loaded chapter notes
   * @param {import('../../core/entities/hs-finder').CoverageMap} coverageMap - Coverage status per chapter
   * @returns {Promise<{ ok: true, data: import('../../core/entities/hs-finder').ClassificationResult } | { ok: false, error: string }>}
   * Error codes: GEMINI_TIMEOUT, GEMINI_UNAVAILABLE, GEMINI_INVALID_RESPONSE
   *
   * @example
   * await service.classifyWithNotes(
   *   "laptop 14 inci",
   *   [{ chapterNumber: "84", title: "Mesin...", content: "...", status: "validated" }],
   *   { chapters: { "84": "validated" }, hasUnvalidated: false }
   * )
   * // => { ok: true, data: { hsCode: "847130", description: "...", reasoningPath: [...], coverageMap: {...} } }
   *
   * @example
   * await service.classifyWithNotes("kain poliester", [], { chapters: { "55": "unvalidated" }, hasUnvalidated: true })
   * // => { ok: true, data: { hsCode: "550920", ... } } or { ok: false, error: "GEMINI_INVALID_RESPONSE" }
   */
  async function classifyWithNotes(itemDescription, chapterNotes, coverageMap) {
    const prompt = buildClassificationPrompt(itemDescription, chapterNotes, coverageMap);

    try {
      const result = await withTimeout(
        model.generateContent(prompt),
        CLASSIFICATION_TIMEOUT_MS
      );

      const responseText = result.response.text().trim();
      return parseClassificationResponse(responseText);
    } catch (err) {
      return _mapError(err);
    }
  }

  return { identifyFromPhoto, identifyCandidateChapters, classifyWithNotes };
}

// ─────────────────────────────────────────────
// Private — error mapper
// ─────────────────────────────────────────────

/**
 * Maps a caught error to a standardised error code string.
 *
 * @param {Error} err
 * @returns {{ ok: false, error: string }}
 */
function _mapError(err) {
  console.error("[hs-finder-gemini] Gemini request failed:", {
    name: err?.name,
    status: err?.status,
    message: err?.message,
  });
  if (err.message === "TIMEOUT" || err.name === "AbortError") {
    return { ok: false, error: "GEMINI_TIMEOUT" };
  }
  if (
    err.message?.includes("API key") ||
    err.message?.includes("401") ||
    err.message?.includes("403") ||
    err.message?.includes("unavailable") ||
    err.message?.includes("Service Unavailable") ||
    err.message?.includes("503")
  ) {
    return { ok: false, error: "GEMINI_UNAVAILABLE" };
  }
  // Default to unavailable for unknown network/API errors
  return { ok: false, error: "GEMINI_UNAVAILABLE" };
}
