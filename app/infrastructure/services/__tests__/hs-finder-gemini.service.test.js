/**
 * Tests for hs-finder-gemini.service.js
 *
 * Covers all exported helper functions and the factory function.
 * Live Gemini API calls are NOT tested here — only pure helper logic.
 *
 * Requirements: 2.5, 3.1, 4.4, 5.1, 5.6, 8.1, 8.2, 8.3, 8.4
 */

import fc from "fast-check";
import {
  buildPhotoIdentificationPrompt,
  buildClassificationPrompt,
  parseChapterListResponse,
  parseClassificationResponse,
  createHsFinderGeminiService,
} from "../hs-finder-gemini.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const VALID_COVERAGE_MAP = {
  chapters: { "84": "validated" },
  hasUnvalidated: false,
};

const VALID_CHAPTER_NOTE = {
  chapterNumber: "84",
  title: "Mesin dan Peralatan Mekanik",
  content: "# Bab 84 — Mesin dan Peralatan Mekanik\n\nIsi catatan bab 84.",
  status: "validated",
};

const VALID_CLASSIFICATION_RESPONSE = JSON.stringify({
  hsCode: "847130",
  description: "Mesin pengolah data portabel, berat tidak lebih dari 10 kg",
  reasoningPath: [
    { stepNumber: 1, title: "Identifikasi Barang", content: "Laptop Intel i7", quotedRule: null, chapterRef: null, coverage: null },
    { stepNumber: 2, title: "Eliminasi Bab", content: "Bab lain dieliminasi", quotedRule: "kutipan dari catatan bab 84", chapterRef: "84", coverage: "validated" },
    { stepNumber: 3, title: "Konfirmasi Bab", content: "Bab 84 dikonfirmasi", quotedRule: "kutipan lain dari catatan bab 84", chapterRef: "84", coverage: "validated" },
    { stepNumber: 4, title: "Penentuan Heading", content: "Heading 8471", quotedRule: "kutipan untuk heading", chapterRef: "84", coverage: "validated" },
    { stepNumber: 5, title: "Penentuan Subheading", content: "Subheading 847130", quotedRule: "kutipan untuk subheading", chapterRef: "84", coverage: "validated" },
  ],
  coverageMap: { chapters: { "84": "validated" }, hasUnvalidated: false },
});

// ─────────────────────────────────────────────────────────────────────────────
// buildPhotoIdentificationPrompt
// ─────────────────────────────────────────────────────────────────────────────

describe("buildPhotoIdentificationPrompt", () => {
  test("returns a non-empty string", () => {
    const prompt = buildPhotoIdentificationPrompt();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  test("contains key Bahasa Indonesia terms for identification", () => {
    const prompt = buildPhotoIdentificationPrompt();
    expect(prompt).toMatch(/Bahasa Indonesia/i);
    expect(prompt).toMatch(/identifikasi/i);
  });

  test("asks for name, material, function, and form", () => {
    const prompt = buildPhotoIdentificationPrompt();
    expect(prompt).toMatch(/nama/i);
    expect(prompt).toMatch(/material|bahan/i);
    expect(prompt).toMatch(/fungsi/i);
    expect(prompt).toMatch(/bentuk/i);
  });

  test("includes TIDAK_DAPAT_DIIDENTIFIKASI fallback instruction", () => {
    const prompt = buildPhotoIdentificationPrompt();
    expect(prompt).toContain("TIDAK_DAPAT_DIIDENTIFIKASI");
  });

  test("is deterministic — same output every call", () => {
    expect(buildPhotoIdentificationPrompt()).toBe(buildPhotoIdentificationPrompt());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildClassificationPrompt
// ─────────────────────────────────────────────────────────────────────────────

describe("buildClassificationPrompt", () => {
  test("returns a string containing the item description", () => {
    const prompt = buildClassificationPrompt("laptop Intel i7", [VALID_CHAPTER_NOTE], VALID_COVERAGE_MAP);
    expect(prompt).toContain("laptop Intel i7");
  });

  test("includes mandatory citation instruction (Req 5.6)", () => {
    const prompt = buildClassificationPrompt("laptop", [], VALID_COVERAGE_MAP);
    expect(prompt).toContain("Setiap kesimpulan harus mengutip teks spesifik dari catatan bab yang disediakan.");
    expect(prompt).toContain("Jangan membuat klaim tanpa dasar dari catatan bab.");
  });

  test("includes chapter note content when notes are provided", () => {
    const prompt = buildClassificationPrompt("laptop", [VALID_CHAPTER_NOTE], VALID_COVERAGE_MAP);
    expect(prompt).toContain("BAB 84");
    expect(prompt).toContain("Isi catatan bab 84");
  });

  test("includes TERVALIDASI label for validated chapters", () => {
    const prompt = buildClassificationPrompt("laptop", [VALID_CHAPTER_NOTE], VALID_COVERAGE_MAP);
    expect(prompt).toContain("TERVALIDASI");
  });

  test("includes BELUM TERVALIDASI label for unvalidated chapter notes", () => {
    const unvalidatedNote = { ...VALID_CHAPTER_NOTE, status: "unvalidated" };
    const prompt = buildClassificationPrompt("laptop", [unvalidatedNote], VALID_COVERAGE_MAP);
    expect(prompt).toContain("BELUM TERVALIDASI");
  });

  test("includes fallback message when no chapter notes are provided", () => {
    const prompt = buildClassificationPrompt("laptop", [], VALID_COVERAGE_MAP);
    expect(prompt).toContain("Tidak ada catatan bab yang tersedia");
  });

  test("embeds the coverageMap as JSON in the output format section", () => {
    const prompt = buildClassificationPrompt("laptop", [], VALID_COVERAGE_MAP);
    expect(prompt).toContain('"hasUnvalidated"');
  });

  test("includes JSON format instructions with all 5 reasoning steps", () => {
    const prompt = buildClassificationPrompt("laptop", [], VALID_COVERAGE_MAP);
    expect(prompt).toContain('"stepNumber": 1');
    expect(prompt).toContain('"stepNumber": 5');
    expect(prompt).toContain("Identifikasi Barang");
    expect(prompt).toContain("Penentuan Subheading");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseChapterListResponse — unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("parseChapterListResponse", () => {
  test("parses a plain JSON array of valid chapter numbers", () => {
    const result = parseChapterListResponse('["84", "85", "90"]');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(["84", "85", "90"]);
  });

  test("strips ```json code fences before parsing", () => {
    const result = parseChapterListResponse('```json\n["84", "85"]\n```');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(["84", "85"]);
  });

  test("strips plain ``` code fences before parsing", () => {
    const result = parseChapterListResponse('```\n["84"]\n```');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(["84"]);
  });

  test("truncates to max 5 chapters when more are provided", () => {
    const result = parseChapterListResponse('["01","02","03","04","05","06","07"]');
    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(5);
    expect(result.data).toEqual(["01", "02", "03", "04", "05"]);
  });

  test("silently skips items that are not 2-digit numeric strings", () => {
    const result = parseChapterListResponse('["84", "8", "abc", "123", "85"]');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(["84", "85"]);
  });

  test("returns ok=false for non-JSON input", () => {
    const result = parseChapterListResponse("Maaf, saya tidak bisa menjawab.");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("GEMINI_INVALID_RESPONSE");
  });

  test("returns ok=false when parsed value is not an array", () => {
    const result = parseChapterListResponse('{"chapter": "84"}');
    expect(result.ok).toBe(false);
    expect(result.error).toBe("GEMINI_INVALID_RESPONSE");
  });

  test("returns ok=true with empty array when all items are invalid", () => {
    const result = parseChapterListResponse('["abc", "1", "123"]');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  test("returns ok=true with empty array for empty JSON array", () => {
    const result = parseChapterListResponse("[]");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseChapterListResponse — property-based tests
// Validates: Requirements 3.2
// ─────────────────────────────────────────────────────────────────────────────

describe("parseChapterListResponse — property-based", () => {
  /**
   * **Validates: Requirements 3.2**
   * Property: output array length is always 0–5 regardless of input
   */
  test("output array never exceeds 5 items for any array input", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 0, maxLength: 20 }),
        (items) => {
          const input = JSON.stringify(items);
          const result = parseChapterListResponse(input);
          if (result.ok) {
            expect(result.data.length).toBeLessThanOrEqual(5);
          }
        }
      )
    );
  });

  /**
   * **Validates: Requirements 3.2**
   * Property: all items in output match /^\d{2}$/
   */
  test("all returned chapter numbers are 2-digit strings", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
        (items) => {
          const input = JSON.stringify(items);
          const result = parseChapterListResponse(input);
          if (result.ok) {
            for (const item of result.data) {
              expect(item).toMatch(/^\d{2}$/);
            }
          }
        }
      )
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseClassificationResponse — unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("parseClassificationResponse", () => {
  test("parses a valid classification JSON response", () => {
    const result = parseClassificationResponse(VALID_CLASSIFICATION_RESPONSE);
    expect(result.ok).toBe(true);
    expect(result.data.hsCode).toBe("847130");
    expect(result.data.description).toBeTruthy();
    expect(result.data.reasoningPath).toHaveLength(5);
  });

  test("strips ```json code fences before parsing", () => {
    const fenced = `\`\`\`json\n${VALID_CLASSIFICATION_RESPONSE}\n\`\`\``;
    const result = parseClassificationResponse(fenced);
    expect(result.ok).toBe(true);
    expect(result.data.hsCode).toBe("847130");
  });

  test("strips plain ``` code fences before parsing", () => {
    const fenced = `\`\`\`\n${VALID_CLASSIFICATION_RESPONSE}\n\`\`\``;
    const result = parseClassificationResponse(fenced);
    expect(result.ok).toBe(true);
  });

  test("returns ok=false for non-JSON input", () => {
    const result = parseClassificationResponse("Maaf, saya tidak bisa menjawab.");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("GEMINI_INVALID_RESPONSE");
  });

  test("returns ok=false when hsCode is not 6 digits", () => {
    const bad = JSON.stringify({
      ...JSON.parse(VALID_CLASSIFICATION_RESPONSE),
      hsCode: "8471",
    });
    const result = parseClassificationResponse(bad);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("GEMINI_INVALID_RESPONSE");
  });

  test("returns ok=false when reasoningPath has wrong number of steps", () => {
    const parsed = JSON.parse(VALID_CLASSIFICATION_RESPONSE);
    parsed.reasoningPath = parsed.reasoningPath.slice(0, 3);
    const result = parseClassificationResponse(JSON.stringify(parsed));
    expect(result.ok).toBe(false);
    expect(result.error).toBe("GEMINI_INVALID_RESPONSE");
  });

  test("returns ok=false when coverageMap is missing", () => {
    const parsed = JSON.parse(VALID_CLASSIFICATION_RESPONSE);
    delete parsed.coverageMap;
    const result = parseClassificationResponse(JSON.stringify(parsed));
    expect(result.ok).toBe(false);
    expect(result.error).toBe("GEMINI_INVALID_RESPONSE");
  });

  test("preserves coverageMap data in the returned ClassificationResult", () => {
    const result = parseClassificationResponse(VALID_CLASSIFICATION_RESPONSE);
    expect(result.ok).toBe(true);
    expect(result.data.coverageMap.chapters["84"]).toBe("validated");
    expect(result.data.coverageMap.hasUnvalidated).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createHsFinderGeminiService — factory tests (no API calls)
// ─────────────────────────────────────────────────────────────────────────────

describe("createHsFinderGeminiService", () => {
  test("returns an object with three method functions", () => {
    const service = createHsFinderGeminiService("valid-api-key-12345");
    expect(typeof service.identifyFromPhoto).toBe("function");
    expect(typeof service.identifyCandidateChapters).toBe("function");
    expect(typeof service.classifyWithNotes).toBe("function");
  });

  test("returns GEMINI_UNAVAILABLE for null API key", async () => {
    const service = createHsFinderGeminiService(null);
    const r1 = await service.identifyFromPhoto("base64", "image/jpeg");
    const r2 = await service.identifyCandidateChapters("laptop");
    const r3 = await service.classifyWithNotes("laptop", [], VALID_COVERAGE_MAP);
    expect(r1).toEqual({ ok: false, error: "GEMINI_UNAVAILABLE" });
    expect(r2).toEqual({ ok: false, error: "GEMINI_UNAVAILABLE" });
    expect(r3).toEqual({ ok: false, error: "GEMINI_UNAVAILABLE" });
  });

  test("returns GEMINI_UNAVAILABLE for empty string API key", async () => {
    const service = createHsFinderGeminiService("");
    const result = await service.identifyCandidateChapters("laptop");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("GEMINI_UNAVAILABLE");
  });

  test("returns GEMINI_UNAVAILABLE for a key that is too short (<=10 chars)", async () => {
    const service = createHsFinderGeminiService("short");
    const result = await service.classifyWithNotes("test", [], VALID_COVERAGE_MAP);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("GEMINI_UNAVAILABLE");
  });

  test("returns an object (not throws) for a valid-length API key", () => {
    expect(() => createHsFinderGeminiService("a-valid-looking-key-12345")).not.toThrow();
  });
});
