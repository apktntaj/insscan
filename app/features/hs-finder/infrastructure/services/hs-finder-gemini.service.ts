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

import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  makeClassificationDecision,
  makeClassificationResult,
} from "@core/hs-finder/domain/hs-finder";
import type { ProductFactsInput, ProductFactsGateway } from "@core/hs-finder/use-cases/analyze-product-facts";
import type {
  ClarificationAnswer,
  HsFinderGeminiService,
} from "@core/hs-finder/use-cases/find-hs-code";
import type { ChapterNote, CoverageMap } from "@core/hs-finder/domain/hs-finder";

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };
type ProductFactsService = Pick<ProductFactsGateway, "extractProductFacts">;
type GeminiService = HsFinderGeminiService & ProductFactsService & {
  identifyFromPhoto(imageBase64: string, mimeType: string): Promise<ServiceResult<string>>;
};
type ProductFactsPromptInput = ProductFactsInput;
type ClassificationOptions = {
  clarificationAnswers?: readonly ClarificationAnswer[];
};
type UnknownRecord = Record<string, unknown>;

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.5-flash";
const PHOTO_TIMEOUT_MS = 45_000;
const PRODUCT_FACTS_TIMEOUT_MS = 45_000;
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
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
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

export function buildProductFactsPrompt({
  description,
  previousFacts = null,
  answers = [],
}: ProductFactsPromptInput): string {
  const priorContext = previousFacts
    ? `\nFAKTA DARI PUTARAN SEBELUMNYA:\n${JSON.stringify(previousFacts)}\n`
    : "";
  const answerContext = answers.length
    ? `\nJAWABAN PENGGUNA:\n${JSON.stringify(answers)}\n`
    : "";

  return `Kamu mengekstrak fakta produk untuk persiapan klasifikasi kepabeanan.

ATURAN WAJIB:
1. Gunakan hanya informasi yang dinyatakan pengguna. Jangan menebak fakta produk.
2. Informasi yang tidak diketahui harus bernilai null.
3. evidence harus berupa kutipan singkat dari input pengguna; gunakan null bila tidak ada.
4. Jangan menentukan atau menyebut kode HS, bab, pos, subpos, atau pos tarif.
5. Tandai fakta yang belum ada dan dapat mengubah klasifikasi sebagai blocking=true.
6. Buat maksimum 3 pertanyaan lanjutan yang singkat dan spesifik.
7. Kembalikan JSON murni tanpa markdown.

DESKRIPSI AWAL:
${description}
${priorContext}${answerContext}
FORMAT JSON:
{
  "facts": {
    "productName": {"value": "string atau null", "confidence": "low|medium|high|null", "evidence": "string atau null"},
    "materialComposition": {"value": "string atau null", "confidence": "low|medium|high|null", "evidence": "string atau null"},
    "primaryFunction": {"value": "string atau null", "confidence": "low|medium|high|null", "evidence": "string atau null"},
    "workingPrinciple": {"value": "string atau null", "confidence": "low|medium|high|null", "evidence": "string atau null"},
    "physicalForm": {"value": "string atau null", "confidence": "low|medium|high|null", "evidence": "string atau null"},
    "processingState": {"value": "string atau null", "confidence": "low|medium|high|null", "evidence": "string atau null"},
    "intendedUse": {"value": "string atau null", "confidence": "low|medium|high|null", "evidence": "string atau null"},
    "isPartOrAccessory": {"value": "boolean atau null", "confidence": "low|medium|high|null", "evidence": "string atau null"},
    "isSetOrMixture": {"value": "boolean atau null", "confidence": "low|medium|high|null", "evidence": "string atau null"},
    "packaging": {"value": "string atau null", "confidence": "low|medium|high|null", "evidence": "string atau null"},
    "technicalSpecifications": {"value": "string atau null", "confidence": "low|medium|high|null", "evidence": "string atau null"}
  },
  "missingFacts": [{"field": "nama field", "reason": "alasan", "blocking": true}],
  "questions": ["maksimum tiga pertanyaan"]
}`;
}

/**
 * Builds an adaptive classification prompt. It asks for ranked recommendations
 * by default and permits targeted clarification only for materially different
 * chapters or headings supported by the available legal notes.
 *
 * @param {string} itemDescription - Normalized item description text
 * @param {import('@core/hs-finder/domain/hs-finder').ChapterNote[]} chapterNotes - Loaded chapter notes
 * @param {import('@core/hs-finder/domain/hs-finder').CoverageMap} coverageMap - Coverage status per chapter
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
export function buildClassificationPrompt(
  itemDescription: string,
  chapterNotes: readonly ChapterNote[],
  coverageMap: CoverageMap,
  { clarificationAnswers = [] }: ClassificationOptions = {},
): string {
  // Pisahkan catatan yang tervalidasi dari yang tidak
  const validatedNotes = chapterNotes.filter((n: ChapterNote) => n.status === "validated");
  const unvalidatedChapters = Object.entries(coverageMap.chapters)
    .filter(([, status]) => status === "unvalidated")
    .map(([ch]) => ch);

  const notesSection = validatedNotes.length > 0
    ? validatedNotes
        .map((note: ChapterNote) => `--- BAB ${note.chapterNumber} [TERVALIDASI] ---\n${note.content}\n`)
        .join("\n")
    : "(Tidak ada catatan bab lokal. Gunakan pengetahuan HS kamu.)";

  const unvalidatedNote = unvalidatedChapters.length > 0
    ? `\nCATATAN: Bab ${unvalidatedChapters.join(", ")} tidak tersedia di knowledge base lokal. ` +
      `Gunakan pengetahuan HS kamu untuk bab ini, dan tandai rekomendasi yang bersandar pada bab tersebut dengan confidence "medium" atau "low".\n`
    : "";

  const answersSection = clarificationAnswers.length
    ? `\nJAWABAN KLARIFIKASI PENGGUNA:\n${JSON.stringify(clarificationAnswers)}\n`
    : "";
  const clarificationRule = clarificationAnswers.length > 0
    ? "Pengguna sudah menjawab klarifikasi. Jangan ajukan pertanyaan lagi; berikan rekomendasi terbaik dari informasi yang tersedia."
    : "Jika perbedaannya tidak material menurut kriteria di atas, jangan bertanya dan langsung berikan rekomendasi.";

  return `Kamu adalah ahli klasifikasi HS code berdasarkan BTKI (Buku Tarif Kepabeanan Indonesia).

## METODOLOGI KLASIFIKASI (KUMHS)

Terapkan urutan berikut secara ketat:
1. Identifikasi barang secara faktual: bahan, komposisi, fungsi, bentuk, cara kerja, kondisi, penggunaan.
2. Terapkan KUMHS — aturan interpretasi yang memandu penentuan pos dan subpos.
3. Periksa Catatan Bagian (Section Notes) yang relevan — berlaku lintas-Bab dalam satu Bagian.
4. Periksa Catatan Bab (Chapter Notes) yang relevan — definisi, inklusi, pengecualian.
5. Baca uraian heading/pos kandidat dan bandingkan dengan fakta barang, bukan kata kunci.
6. Periksa Catatan Subpos (Subheading Notes) sebelum memilih subpos.
7. Tentukan subheading HS6.

Penting:
- Klasifikasi tidak boleh hanya berdasarkan nama dagang atau label pemasaran.
- Catatan Bagian dan Catatan Bab bersifat legal — pengecualian di sana mengalahkan kecocokan nama.
- Jika barang tampak cocok dengan heading tapi dikecualikan oleh Catatan Bab, heading itu harus dikeluarkan dari kandidat.
- Catatan Subpos menentukan pilihan antara dua subpos berdasarkan kriteria teknis, bukan asumsi.

## BARANG
${itemDescription}
${answersSection}${unvalidatedNote}
## CATATAN BAB LOKAL
${notesSection}

## ATURAN KEPUTUSAN
1. Berikan 2–3 rekomendasi HS6 diurutkan dari yang terkuat. Satu saja jika hanya satu yang dapat dipertanggungjawabkan.
2. Ajukan klarifikasi HANYA jika informasi yang hilang dapat memindahkan hasil secara material ke bab berbeda (2 digit) atau heading berbeda (4 digit) — karena pengecualian catatan bagian/bab, status bagian/aksesori, komposisi, tingkat pengolahan, atau fungsi utama.
3. Jangan bertanya jika ketidakpastian hanya memengaruhi subheading dalam heading yang sama.
4. Maksimum 2 pertanyaan, singkat, masing-masing membedakan cabang klasifikasi yang berbeda.
5. quotedRule harus kutipan nyata dari catatan yang tersedia atau pengetahuan HS yang dapat diverifikasi. Jangan mengarang aturan.
6. ${clarificationRule}

Jika klarifikasi benar-benar diperlukan, keluarkan:
{
  "status": "needs_clarification",
  "clarificationReason": "jelaskan singkat dua cabang bab/heading yang dapat berubah dan dasar catatannya",
  "questions": ["maksimum dua pertanyaan pembeda"],
  "recommendations": [],
  "coverageMap": ${JSON.stringify(coverageMap)}
}

Jika klarifikasi tidak diperlukan, keluarkan:
{
  "status": "recommendations",
  "clarificationReason": null,
  "questions": [],
  "recommendations": [
    {
      "hsCode": "6 digit angka tanpa titik",
      "description": "deskripsi subheading dalam Bahasa Indonesia",
      "confidence": "high|medium|low",
      "rationale": "alasan ringkas berdasarkan KUMHS dan catatan yang berlaku",
      "quotedRule": "kutipan nyata dari catatan bab atau aturan HS yang relevan",
      "chapterRef": "nomor bab 2 digit"
    }
  ],
  "coverageMap": ${JSON.stringify(coverageMap)}
}

Output hanya JSON murni tanpa markdown.`;
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
function stripCodeFences(text: string): string {
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
export function parseChapterListResponse(responseText: string): ServiceResult<string[]> {
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
 * @returns {{ ok: true, data: import('@core/hs-finder/domain/hs-finder').ClassificationResult } | { ok: false, error: string }}
 *
 * @example
 * parseClassificationResponse('{"hsCode":"847130","description":"...","reasoningPath":[...],"coverageMap":{...}}')
 * // => { ok: true, data: { hsCode: "847130", ... } }
 *
 * @example
 * parseClassificationResponse("tidak valid json")
 * // => { ok: false, error: "GEMINI_INVALID_RESPONSE" }
 */
export function parseClassificationResponse(
  responseText: string,
): ServiceResult<UnknownRecord> {
  try {
    const cleaned = stripCodeFences(responseText);
    const raw = JSON.parse(cleaned);
    const result = raw?.status
      ? makeClassificationDecision(raw)
      : makeClassificationResult(raw);
    if (!result.ok) {
      return { ok: false, error: "GEMINI_INVALID_RESPONSE" };
    }
    return { ok: true, data: raw };
  } catch {
    return { ok: false, error: "GEMINI_INVALID_RESPONSE" };
  }
}

export function parseProductFactsResponse(responseText: string): ServiceResult<UnknownRecord> {
  try {
    const parsed = JSON.parse(stripCodeFences(responseText));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "GEMINI_INVALID_RESPONSE" };
    }
    return { ok: true, data: parsed };
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
export function createHsFinderGeminiService(geminiApiKey: string | undefined): GeminiService {
  if (!geminiApiKey || typeof geminiApiKey !== "string" || geminiApiKey.length <= 10) {
    return {
      identifyFromPhoto: async () => ({ ok: false, error: "GEMINI_UNAVAILABLE" }),
      extractProductFacts: async () => ({ ok: false, error: "GEMINI_UNAVAILABLE" }),
      identifyCandidateChapters: async () => ({ ok: false, error: "GEMINI_UNAVAILABLE" }),
      classifyWithNotes: async () => ({ ok: false, error: "GEMINI_UNAVAILABLE" }),
    };
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  async function extractProductFacts(
    input: ProductFactsInput,
  ): Promise<ServiceResult<UnknownRecord>> {
    const prompt = buildProductFactsPrompt(input);
    try {
      const result = await withTimeout(
        model.generateContent(prompt),
        PRODUCT_FACTS_TIMEOUT_MS
      );
      return parseProductFactsResponse(result.response.text().trim());
    } catch (err) {
      return mapGeminiError(err);
    }
  }

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
  async function identifyFromPhoto(
    imageBase64: string,
    mimeType: string,
  ): Promise<ServiceResult<string>> {
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
      return mapGeminiError(err);
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
  async function identifyCandidateChapters(
    itemDescription: string,
  ): Promise<ServiceResult<string[]>> {
    const prompt = `Kamu adalah ahli klasifikasi HS code. Berdasarkan deskripsi barang di bawah ini, identifikasi maksimum 5 nomor bab HS yang paling mungkin relevan.

Sertakan semua bab yang masih masuk akal apabila informasi tentang fungsi utama, bahan, tingkat pengolahan, atau status bagian/aksesori dapat memindahkan klasifikasi ke bab yang berbeda. Jangan tambahkan bab yang hanya bersifat spekulatif.

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
      return mapGeminiError(err);
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
   * @param {import('@core/hs-finder/domain/hs-finder').ChapterNote[]} chapterNotes - Loaded chapter notes
   * @param {import('@core/hs-finder/domain/hs-finder').CoverageMap} coverageMap - Coverage status per chapter
   * @returns {Promise<{ ok: true, data: import('@core/hs-finder/domain/hs-finder').ClassificationResult } | { ok: false, error: string }>}
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
  async function classifyWithNotes(
    itemDescription: string,
    chapterNotes: readonly ChapterNote[],
    coverageMap: CoverageMap,
    options: ClassificationOptions = {},
  ): Promise<ServiceResult<UnknownRecord>> {
    const prompt = buildClassificationPrompt(itemDescription, chapterNotes, coverageMap, options);

    try {
      const result = await withTimeout(
        model.generateContent(prompt),
        CLASSIFICATION_TIMEOUT_MS
      );

      const responseText = result.response.text().trim();
      return parseClassificationResponse(responseText);
    } catch (err) {
      return mapGeminiError(err);
    }
  }

  return { extractProductFacts, identifyFromPhoto, identifyCandidateChapters, classifyWithNotes };
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
export function mapGeminiError(err: unknown): { ok: false; error: string } {
  const error = err instanceof Error ? err : new Error(String(err));
  const message = error.message.toLowerCase();

  console.error("[hs-finder-gemini] Gemini request failed:", {
    name: error.name,
    message: error.message,
  });
  if (error.message === "TIMEOUT" || error.name === "AbortError") {
    return { ok: false, error: "GEMINI_TIMEOUT" };
  }
  if (
    message.includes("resource_exhausted") ||
    message.includes("quota") ||
    message.includes("429")
  ) {
    return { ok: false, error: "GEMINI_QUOTA_EXHAUSTED" };
  }
  if (
    message.includes("api key") ||
    message.includes("401") ||
    message.includes("403") ||
    message.includes("unavailable") ||
    message.includes("service unavailable") ||
    message.includes("503")
  ) {
    return { ok: false, error: "GEMINI_UNAVAILABLE" };
  }
  // Default to unavailable for unknown network/API errors
  return { ok: false, error: "GEMINI_UNAVAILABLE" };
}
