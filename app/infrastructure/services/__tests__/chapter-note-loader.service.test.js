/**
 * Tests for chapter-note-loader.service.js
 * Covers: readChapterFile, loadChapters, listAvailableChapters, createChapterNoteLoaderService
 * Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.4
 */

import {
  readChapterFile,
  createChapterNoteLoaderService,
} from "../chapter-note-loader.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// readChapterFile — Unit tests (against real files on disk)
// ─────────────────────────────────────────────────────────────────────────────

describe("readChapterFile", () => {
  test("returns ok=true and a ChapterNote for an existing chapter", async () => {
    const result = await readChapterFile("84");
    expect(result.ok).toBe(true);
    expect(result.data.chapterNumber).toBe("84");
    expect(typeof result.data.title).toBe("string");
    expect(result.data.title.length).toBeGreaterThan(0);
    expect(typeof result.data.content).toBe("string");
    expect(result.data.content.length).toBeGreaterThan(0);
    expect(result.data.status).toBe("validated");
  });

  test("parses title from heading # Bab {nn} — {title}", async () => {
    const result = await readChapterFile("84");
    expect(result.ok).toBe(true);
    // Should NOT include the "# Bab 84 —" prefix
    expect(result.data.title).not.toMatch(/^#/);
    expect(result.data.title).not.toMatch(/Bab 84/);
  });

  test("returns ok=false for a chapter that does not exist", async () => {
    const result = await readChapterFile("99");
    expect(result.ok).toBe(false);
    expect(typeof result.error).toBe("string");
    expect(result.error).toMatch(/chapter-99\.md/);
  });

  test("returns ok=false (not throw) for a non-existent chapter", async () => {
    await expect(readChapterFile("00")).resolves.toMatchObject({ ok: false });
  });

  test("content includes the full file text", async () => {
    const result = await readChapterFile("85");
    expect(result.ok).toBe(true);
    // The file has sections beyond the first heading
    expect(result.data.content.length).toBeGreaterThan(50);
  });

  test("status is always 'validated' when file exists", async () => {
    for (const num of ["01", "84", "85"]) {
      const result = await readChapterFile(num);
      if (result.ok) {
        expect(result.data.status).toBe("validated");
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// loadChapters — Unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("createChapterNoteLoaderService — loadChapters", () => {
  const service = createChapterNoteLoaderService();

  test("loads existing chapters and returns notes array", async () => {
    const { notes, coverageMap } = await service.loadChapters(["84", "85"]);
    expect(notes).toHaveLength(2);
    expect(notes[0].chapterNumber).toBe("84");
    expect(notes[1].chapterNumber).toBe("85");
    expect(coverageMap.chapters["84"]).toBe("validated");
    expect(coverageMap.chapters["85"]).toBe("validated");
    expect(coverageMap.hasUnvalidated).toBe(false);
  });

  test("skips missing chapters silently and marks them unvalidated", async () => {
    const { notes, coverageMap } = await service.loadChapters(["84", "85", "90"]);
    expect(notes).toHaveLength(2);
    expect(coverageMap.chapters["84"]).toBe("validated");
    expect(coverageMap.chapters["85"]).toBe("validated");
    expect(coverageMap.chapters["90"]).toBe("unvalidated");
    expect(coverageMap.hasUnvalidated).toBe(true);
  });

  test("returns empty notes and empty coverageMap for empty input", async () => {
    const { notes, coverageMap } = await service.loadChapters([]);
    expect(notes).toHaveLength(0);
    expect(coverageMap.chapters).toEqual({});
    expect(coverageMap.hasUnvalidated).toBe(false);
  });

  test("all chapters missing → notes is empty, all unvalidated", async () => {
    const { notes, coverageMap } = await service.loadChapters(["90", "91", "92"]);
    expect(notes).toHaveLength(0);
    expect(coverageMap.chapters["90"]).toBe("unvalidated");
    expect(coverageMap.hasUnvalidated).toBe(true);
  });

  test("every requested chapter number appears as a key in coverageMap.chapters", async () => {
    const requested = ["84", "85", "90"];
    const { coverageMap } = await service.loadChapters(requested);
    for (const num of requested) {
      expect(Object.prototype.hasOwnProperty.call(coverageMap.chapters, num)).toBe(true);
    }
  });

  test("returns ChapterNote objects with correct shape", async () => {
    const { notes } = await service.loadChapters(["84"]);
    expect(notes).toHaveLength(1);
    const note = notes[0];
    expect(note).toHaveProperty("chapterNumber");
    expect(note).toHaveProperty("title");
    expect(note).toHaveProperty("content");
    expect(note).toHaveProperty("status", "validated");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// listAvailableChapters — Unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("createChapterNoteLoaderService — listAvailableChapters", () => {
  const service = createChapterNoteLoaderService();

  test("returns a non-empty array of chapter number strings", async () => {
    const chapters = await service.listAvailableChapters();
    expect(Array.isArray(chapters)).toBe(true);
    expect(chapters.length).toBeGreaterThan(0);
  });

  test("all returned values are two-digit strings", async () => {
    const chapters = await service.listAvailableChapters();
    for (const num of chapters) {
      expect(typeof num).toBe("string");
      expect(num).toMatch(/^\d{2}$/);
    }
  });

  test("returns a sorted array", async () => {
    const chapters = await service.listAvailableChapters();
    const sorted = [...chapters].sort();
    expect(chapters).toEqual(sorted);
  });

  test("includes known chapters from the knowledge base", async () => {
    const chapters = await service.listAvailableChapters();
    // These files are known to exist
    expect(chapters).toContain("84");
    expect(chapters).toContain("85");
    expect(chapters).toContain("01");
  });

  test("does not include non-chapter files (README.md etc.)", async () => {
    const chapters = await service.listAvailableChapters();
    for (const num of chapters) {
      // Every entry must look like a valid two-digit number
      expect(num).toMatch(/^\d{2}$/);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createChapterNoteLoaderService — factory and interface
// ─────────────────────────────────────────────────────────────────────────────

describe("createChapterNoteLoaderService", () => {
  test("returns an object with loadChapters and listAvailableChapters methods", () => {
    const service = createChapterNoteLoaderService();
    expect(typeof service.loadChapters).toBe("function");
    expect(typeof service.listAvailableChapters).toBe("function");
  });

  test("satisfies validateChapterNoteLoader without throwing", async () => {
    const { validateChapterNoteLoader } = await import(
      "../../../core/ports/chapter-note-loader.port.js"
    );
    const service = createChapterNoteLoaderService();
    expect(() => validateChapterNoteLoader(service)).not.toThrow();
  });

  test("multiple factory calls share the same cache (second load is a cache hit)", async () => {
    const service1 = createChapterNoteLoaderService();
    const service2 = createChapterNoteLoaderService();

    // Warm cache via service1
    const r1 = await service1.loadChapters(["87"]);
    // service2 should return the same cached data
    const r2 = await service2.loadChapters(["87"]);

    expect(r1.notes[0].content).toBe(r2.notes[0].content);
  });
});
