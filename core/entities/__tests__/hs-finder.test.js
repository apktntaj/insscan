/**
 * Tests for hs-finder.js entities
 * Covers: makeItemDescription, makeClassificationResult, makeCoverageMap
 * Requirements: 1.2, 1.3, 1.4, 1.5, 4.2, 5.2, 5.4
 */

import * as fc from "fast-check";
import {
  makeItemDescription,
  makeClassificationResult,
  makeCoverageMap,
} from "../hs-finder.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a minimal valid raw ClassificationResult for testing.
 * @param {Partial<Object>} overrides
 */
function validRaw(overrides = {}) {
  return {
    hsCode: "847130",
    description: "Mesin pengolah data portabel",
    reasoningPath: [
      { stepNumber: 1, title: "Identifikasi Barang", content: "Laptop.", quotedRule: null, chapterRef: null, coverage: null },
      { stepNumber: 2, title: "Eliminasi Bab", content: "Bukan tekstil.", quotedRule: "Catatan Bab 84", chapterRef: "84", coverage: "validated" },
      { stepNumber: 3, title: "Konfirmasi Bab", content: "Bab 84 sesuai.", quotedRule: "Catatan Bab 84", chapterRef: "84", coverage: "validated" },
      { stepNumber: 4, title: "Penentuan Heading", content: "Heading 8471.", quotedRule: "84.71", chapterRef: "84", coverage: "validated" },
      { stepNumber: 5, title: "Penentuan Subheading", content: "8471.30.", quotedRule: "8471.30", chapterRef: "84", coverage: "validated" },
    ],
    coverageMap: {
      chapters: { "84": "validated" },
      hasUnvalidated: false,
    },
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// makeItemDescription — Unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("makeItemDescription", () => {
  describe("valid inputs", () => {
    test("returns ok=true and trimmed text for a normal description", () => {
      const result = makeItemDescription("  laptop 14 inci prosesor Intel  ", "text");
      expect(result.ok).toBe(true);
      expect(result.data.text).toBe("laptop 14 inci prosesor Intel");
      expect(result.data.source).toBe("text");
    });

    test("accepts exactly 3 characters after trim", () => {
      const result = makeItemDescription("   abc   ", "text");
      expect(result.ok).toBe(true);
      expect(result.data.text).toBe("abc");
    });

    test("accepts exactly 2000 characters", () => {
      const text = "a".repeat(2000);
      const result = makeItemDescription(text, "text");
      expect(result.ok).toBe(true);
      expect(result.data.text).toBe(text);
    });

    test("accepts source 'photo'", () => {
      const result = makeItemDescription("sebuah laptop", "photo");
      expect(result.ok).toBe(true);
      expect(result.data.source).toBe("photo");
    });
  });

  describe("invalid inputs", () => {
    test("returns error for input shorter than 3 chars after trim", () => {
      const result = makeItemDescription("ok", "text");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Deskripsi barang terlalu singkat.");
    });

    test("returns error for empty string", () => {
      const result = makeItemDescription("", "text");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Deskripsi barang terlalu singkat.");
    });

    test("returns error for whitespace-only string", () => {
      const result = makeItemDescription("   ", "text");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Deskripsi barang terlalu singkat.");
    });

    test("returns error for input exceeding 2000 chars after trim", () => {
      const text = "a".repeat(2001);
      const result = makeItemDescription(text, "text");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Deskripsi terlalu panjang (maksimum 2.000 karakter).");
    });

    test("returns error for 2 chars that would be valid without trim constraint", () => {
      // 2 chars should fail, trimming doesn't help here
      const result = makeItemDescription("ab", "text");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Deskripsi barang terlalu singkat.");
    });
  });

  describe("trimming behaviour", () => {
    test("trims leading whitespace", () => {
      const result = makeItemDescription("   kipas angin", "text");
      expect(result.ok).toBe(true);
      expect(result.data.text).toBe("kipas angin");
    });

    test("trims trailing whitespace", () => {
      const result = makeItemDescription("kipas angin   ", "text");
      expect(result.ok).toBe(true);
      expect(result.data.text).toBe("kipas angin");
    });

    test("a 2001-char string padded with whitespace at boundary: trim fixes it to valid", () => {
      // 2000 chars of content, surrounded by whitespace — should be ok
      const text = "  " + "a".repeat(2000) + "  ";
      const result = makeItemDescription(text, "text");
      expect(result.ok).toBe(true);
      expect(result.data.text.length).toBe(2000);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// makeItemDescription — Property-based tests
// Validates: Requirements 1.2, 1.3, 1.4, 1.5
// ─────────────────────────────────────────────────────────────────────────────

describe("makeItemDescription — property tests", () => {
  /**
   * Property 1: ok=true iff trimmed length is in [3, 2000].
   * data.text is always text.trim().
   *
   * Validates: Requirements 1.2, 1.3, 1.4, 1.5
   */
  test("ok=true iff trimmed length >= 3 AND <= 2000; data.text === text.trim()", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 2100 }),
        fc.constantFrom("text", "photo"),
        (text, source) => {
          const trimmed = text.trim();
          const result = makeItemDescription(text, source);

          if (trimmed.length >= 3 && trimmed.length <= 2000) {
            expect(result.ok).toBe(true);
            expect(result.data.text).toBe(trimmed);
            expect(result.data.source).toBe(source);
          } else {
            expect(result.ok).toBe(false);
            expect(typeof result.error).toBe("string");
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  test("data.text is always text.trim() when ok=true", () => {
    fc.assert(
      fc.property(
        // Only generate strings whose trim is in [3, 2000]
        fc.string({ minLength: 3, maxLength: 2000 }).filter(
          (s) => s.trim().length >= 3 && s.trim().length <= 2000
        ),
        (text) => {
          const result = makeItemDescription(text, "text");
          expect(result.ok).toBe(true);
          expect(result.data.text).toBe(text.trim());
        }
      ),
      { numRuns: 300 }
    );
  });

  test("error message matches expected text for too-short inputs", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 2 }).filter((s) => s.trim().length < 3),
        (text) => {
          const result = makeItemDescription(text, "text");
          expect(result.ok).toBe(false);
          expect(result.error).toBe("Deskripsi barang terlalu singkat.");
        }
      ),
      { numRuns: 200 }
    );
  });

  test("error message matches expected text for too-long inputs", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2001, maxLength: 4000 }),
        (text) => {
          // Ensure the trimmed version is also > 2000
          const padded = text.trim().length <= 2000
            ? "a".repeat(2001) + text
            : text;
          const result = makeItemDescription(padded, "text");
          if (!result.ok) {
            expect(result.error).toBe(
              "Deskripsi terlalu panjang (maksimum 2.000 karakter)."
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// makeCoverageMap — Unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("makeCoverageMap", () => {
  test("marks loaded chapters as validated", () => {
    const result = makeCoverageMap(["84", "85", "90"], ["84", "85"]);
    expect(result.chapters["84"]).toBe("validated");
    expect(result.chapters["85"]).toBe("validated");
  });

  test("marks missing chapters as unvalidated", () => {
    const result = makeCoverageMap(["84", "85", "90"], ["84", "85"]);
    expect(result.chapters["90"]).toBe("unvalidated");
  });

  test("hasUnvalidated is true when at least one chapter is unvalidated", () => {
    const result = makeCoverageMap(["84", "85", "90"], ["84", "85"]);
    expect(result.hasUnvalidated).toBe(true);
  });

  test("hasUnvalidated is false when all chapters are validated", () => {
    const result = makeCoverageMap(["84", "85"], ["84", "85"]);
    expect(result.chapters["84"]).toBe("validated");
    expect(result.chapters["85"]).toBe("validated");
    expect(result.hasUnvalidated).toBe(false);
  });

  test("returns empty chapters for empty candidate list", () => {
    const result = makeCoverageMap([], []);
    expect(result.chapters).toEqual({});
    expect(result.hasUnvalidated).toBe(false);
  });

  test("extra loaded chapters not in candidates do not appear in output", () => {
    const result = makeCoverageMap(["84"], ["84", "85", "90"]);
    expect(Object.keys(result.chapters)).toEqual(["84"]);
  });

  test("all candidates appear in output even when none are loaded", () => {
    const result = makeCoverageMap(["84", "85", "90"], []);
    expect(result.chapters["84"]).toBe("unvalidated");
    expect(result.chapters["85"]).toBe("unvalidated");
    expect(result.chapters["90"]).toBe("unvalidated");
    expect(result.hasUnvalidated).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// makeCoverageMap — Property-based tests
// Validates: Requirement 4.2
// ─────────────────────────────────────────────────────────────────────────────

describe("makeCoverageMap — property tests", () => {
  // Generator: unique chapter number strings like "01"–"99"
  const chapterNumberArb = fc.integer({ min: 1, max: 99 }).map((n) =>
    String(n).padStart(2, "0")
  );

  const uniqueArrayArb = fc
    .array(chapterNumberArb, { minLength: 0, maxLength: 20 })
    .map((arr) => [...new Set(arr)]);

  /**
   * Property 3: CoverageMap is consistent with inputs.
   *
   * Validates: Requirement 4.2
   */
  test("every candidate appears as a key in output.chapters", () => {
    fc.assert(
      fc.property(uniqueArrayArb, uniqueArrayArb, (candidates, loaded) => {
        const result = makeCoverageMap(candidates, loaded);
        for (const chapter of candidates) {
          expect(Object.prototype.hasOwnProperty.call(result.chapters, chapter)).toBe(true);
        }
      }),
      { numRuns: 300 }
    );
  });

  test("loaded chapters that are in candidates are marked validated", () => {
    fc.assert(
      fc.property(uniqueArrayArb, uniqueArrayArb, (candidates, loaded) => {
        const result = makeCoverageMap(candidates, loaded);
        const candidateSet = new Set(candidates);
        for (const chapter of loaded) {
          if (candidateSet.has(chapter)) {
            expect(result.chapters[chapter]).toBe("validated");
          }
        }
      }),
      { numRuns: 300 }
    );
  });

  test("candidates not in loaded are marked unvalidated", () => {
    fc.assert(
      fc.property(uniqueArrayArb, uniqueArrayArb, (candidates, loaded) => {
        const result = makeCoverageMap(candidates, loaded);
        const loadedSet = new Set(loaded);
        for (const chapter of candidates) {
          if (!loadedSet.has(chapter)) {
            expect(result.chapters[chapter]).toBe("unvalidated");
          }
        }
      }),
      { numRuns: 300 }
    );
  });

  test("hasUnvalidated is true iff at least one candidate is unvalidated", () => {
    fc.assert(
      fc.property(uniqueArrayArb, uniqueArrayArb, (candidates, loaded) => {
        const result = makeCoverageMap(candidates, loaded);
        const loadedSet = new Set(loaded);
        const anyUnvalidated = candidates.some((c) => !loadedSet.has(c));
        expect(result.hasUnvalidated).toBe(anyUnvalidated);
      }),
      { numRuns: 300 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// makeClassificationResult — Unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("makeClassificationResult", () => {
  test("returns ok=true for a valid raw object", () => {
    const result = makeClassificationResult(validRaw());
    expect(result.ok).toBe(true);
    expect(result.data.hsCode).toBe("847130");
  });

  test("preserves all fields on success", () => {
    const result = makeClassificationResult(validRaw());
    expect(result.ok).toBe(true);
    expect(result.data.description).toBe("Mesin pengolah data portabel");
    expect(result.data.reasoningPath).toHaveLength(5);
    expect(result.data.coverageMap.hasUnvalidated).toBe(false);
  });

  test("rejects hsCode with fewer than 6 digits", () => {
    const result = makeClassificationResult(validRaw({ hsCode: "8471" }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/6 digit/);
  });

  test("rejects hsCode with more than 6 digits", () => {
    const result = makeClassificationResult(validRaw({ hsCode: "84713099" }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/6 digit/);
  });

  test("rejects hsCode with non-numeric characters", () => {
    const result = makeClassificationResult(validRaw({ hsCode: "84713X" }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/6 digit/);
  });

  test("rejects reasoningPath with fewer than 5 steps", () => {
    const result = makeClassificationResult(
      validRaw({ reasoningPath: validRaw().reasoningPath.slice(0, 3) })
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/5/);
  });

  test("rejects reasoningPath with more than 5 steps", () => {
    const extra = { stepNumber: 6, title: "Extra", content: "...", quotedRule: null, chapterRef: null, coverage: null };
    const result = makeClassificationResult(
      validRaw({ reasoningPath: [...validRaw().reasoningPath, extra] })
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/5/);
  });

  test("rejects reasoningPath with out-of-order stepNumbers", () => {
    const steps = validRaw().reasoningPath.map((s, i) =>
      i === 2 ? { ...s, stepNumber: 10 } : s
    );
    const result = makeClassificationResult(validRaw({ reasoningPath: steps }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/stepNumber/);
  });

  test("rejects null input", () => {
    const result = makeClassificationResult(null);
    expect(result.ok).toBe(false);
  });

  test("rejects non-object input", () => {
    const result = makeClassificationResult("not an object");
    expect(result.ok).toBe(false);
  });

  test("trims description whitespace", () => {
    const result = makeClassificationResult(validRaw({ description: "  Laptop  " }));
    expect(result.ok).toBe(true);
    expect(result.data.description).toBe("Laptop");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// makeClassificationResult — Property-based tests
// Validates: Requirements 5.2, 5.4
// ─────────────────────────────────────────────────────────────────────────────

describe("makeClassificationResult — property tests", () => {
  // Generator for valid 6-digit HS codes
  const validHsCodeArb = fc
    .integer({ min: 0, max: 999999 })
    .map((n) => String(n).padStart(6, "0"));

  // Generator for a single valid ReasoningStep at position i (1-indexed)
  const makeStepArb = (stepNumber) =>
    fc.record({
      stepNumber: fc.constant(stepNumber),
      title: fc.string({ minLength: 1, maxLength: 50 }),
      content: fc.string({ minLength: 1, maxLength: 200 }),
      quotedRule: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
      chapterRef: fc.option(fc.string({ minLength: 2, maxLength: 2 }), { nil: null }),
      coverage: fc.option(fc.constantFrom("validated", "unvalidated"), { nil: null }),
    });

  // Generator for a valid 5-step reasoning path
  const validReasoningPathArb = fc
    .tuple(
      makeStepArb(1),
      makeStepArb(2),
      makeStepArb(3),
      makeStepArb(4),
      makeStepArb(5)
    )
    .map(([s1, s2, s3, s4, s5]) => [s1, s2, s3, s4, s5]);

  const validCoverageMapArb = fc.record({
    chapters: fc.dictionary(
      fc.integer({ min: 1, max: 99 }).map((n) => String(n).padStart(2, "0")),
      fc.constantFrom("validated", "unvalidated")
    ),
    hasUnvalidated: fc.boolean(),
  });

  /**
   * Property 4: hsCode always matches /^\d{6}$/ when ok=true.
   *
   * Validates: Requirement 5.4
   */
  test("hsCode always matches /^\\d{6}$/ when ok=true", () => {
    fc.assert(
      fc.property(
        validHsCodeArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        validReasoningPathArb,
        validCoverageMapArb,
        (hsCode, description, reasoningPath, coverageMap) => {
          const result = makeClassificationResult({
            hsCode,
            description,
            reasoningPath,
            coverageMap,
          });
          if (result.ok) {
            expect(/^\d{6}$/.test(result.data.hsCode)).toBe(true);
          }
        }
      ),
      { numRuns: 300 }
    );
  });

  /**
   * Property 5: reasoningPath always has exactly 5 steps with stepNumber === i+1.
   *
   * Validates: Requirement 5.2
   */
  test("reasoningPath.length === 5 and stepNumbers are 1–5 in order when ok=true", () => {
    fc.assert(
      fc.property(
        validHsCodeArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        validReasoningPathArb,
        validCoverageMapArb,
        (hsCode, description, reasoningPath, coverageMap) => {
          const result = makeClassificationResult({
            hsCode,
            description,
            reasoningPath,
            coverageMap,
          });
          if (result.ok) {
            expect(result.data.reasoningPath).toHaveLength(5);
            result.data.reasoningPath.forEach((step, i) => {
              expect(step.stepNumber).toBe(i + 1);
            });
          }
        }
      ),
      { numRuns: 300 }
    );
  });

  test("invalid hsCode (not 6 digits) always results in ok=false", () => {
    // Generate strings that definitely do NOT match /^\d{6}$/
    const invalidHsCodeArb = fc
      .string({ minLength: 0, maxLength: 10 })
      .filter((s) => !/^\d{6}$/.test(s));

    fc.assert(
      fc.property(
        invalidHsCodeArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        validReasoningPathArb,
        validCoverageMapArb,
        (hsCode, description, reasoningPath, coverageMap) => {
          const result = makeClassificationResult({
            hsCode,
            description,
            reasoningPath,
            coverageMap,
          });
          expect(result.ok).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  test("wrong step count always results in ok=false", () => {
    fc.assert(
      fc.property(
        validHsCodeArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        // Lengths that are NOT 5
        fc.integer({ min: 0, max: 10 }).filter((n) => n !== 5),
        validCoverageMapArb,
        (hsCode, description, stepCount, coverageMap) => {
          const steps = Array.from({ length: stepCount }, (_, i) => ({
            stepNumber: i + 1,
            title: "T",
            content: "C",
            quotedRule: null,
            chapterRef: null,
            coverage: null,
          }));
          const result = makeClassificationResult({
            hsCode,
            description,
            reasoningPath: steps,
            coverageMap,
          });
          expect(result.ok).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});
