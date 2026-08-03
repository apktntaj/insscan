/**
 * Chapter Note Loader Service — Infrastructure Layer
 *
 * Reads `.md` chapter note files from the knowledge base directory,
 * parses headings, caches results in memory, and reports coverage.
 *
 * Implements the ChapterNoteLoaderPort interface.
 *
 * @module infrastructure/services/chapter-note-loader
 */

import fs from "fs/promises";
import path from "path";
import { makeCoverageMap } from "../../core/entities/hs-finder.js";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Absolute path to the chapters directory, resolved at runtime. */
const CHAPTERS_DIR = path.join(process.cwd(), "harmonized-system", "chapters");

/** Pattern for valid chapter filenames: chapter-{nn}.md */
const CHAPTER_FILE_PATTERN = /^chapter-(\d{2})\.md$/;

/** Pattern to extract the title from the first heading line: # Bab {nn} — {title} */
const HEADING_PATTERN = /^#\s+Bab\s+\d+\s+[—–-]\s+(.+)$/m;

// ─────────────────────────────────────────────
// Module-level cache (shared across all instances)
// ─────────────────────────────────────────────

/**
 * In-memory cache keyed by chapter number (e.g. "84").
 * Stores the result of readChapterFile so each file is read at most once.
 *
 * @type {Map<string, { ok: true, data: import('../../core/entities/hs-finder').ChapterNote } | { ok: false, error: string }>}
 */
const _cache = new Map();

// ─────────────────────────────────────────────
// readChapterFile (helper)
// ─────────────────────────────────────────────

/**
 * Reads a single chapter `.md` file and parses its title from the first heading.
 *
 * Heading format expected:  `# Bab {nn} — {Judul Bab}`
 *
 * Results are cached in the module-level `_cache` Map so the file is only
 * read from disk once per process lifetime.
 *
 * @param {string} chapterNumber - Two-digit chapter number, e.g. "84"
 * @returns {Promise<{ ok: true, data: import('../../core/entities/hs-finder').ChapterNote } | { ok: false, error: string }>}
 *
 * @example
 * await readChapterFile("84")
 * // => { ok: true, data: { chapterNumber: "84", title: "Reaktor Nuklir...", content: "...", status: "validated" } }
 *
 * @example
 * await readChapterFile("99")
 * // => { ok: false, error: "File tidak ditemukan: chapter-99.md" }
 */
export async function readChapterFile(chapterNumber) {
  if (_cache.has(chapterNumber)) {
    return _cache.get(chapterNumber);
  }

  const filename = `chapter-${chapterNumber}.md`;
  const filepath = path.join(CHAPTERS_DIR, filename);

  let content;
  try {
    content = await fs.readFile(filepath, "utf-8");
  } catch (err) {
    const result = { ok: false, error: `File tidak ditemukan: ${filename}` };
    _cache.set(chapterNumber, result);
    return result;
  }

  const headingMatch = content.match(HEADING_PATTERN);
  const title = headingMatch ? headingMatch[1].trim() : `Bab ${chapterNumber}`;

  /** @type {import('../../core/entities/hs-finder').ChapterNote} */
  const note = {
    chapterNumber,
    title,
    content,
    status: "validated",
  };

  const result = { ok: true, data: note };
  _cache.set(chapterNumber, result);
  return result;
}

// ─────────────────────────────────────────────
// loadChapters (method)
// ─────────────────────────────────────────────

/**
 * Loads `.md` files for the requested chapter numbers.
 *
 * Missing files are skipped silently (graceful degradation). The returned
 * `coverageMap` records every requested chapter as either "validated"
 * (file found) or "unvalidated" (file missing).
 *
 * @param {string[]} chapterNumbers - Array of chapter numbers to load, e.g. ["84", "85", "90"]
 * @returns {Promise<{ notes: import('../../core/entities/hs-finder').ChapterNote[], coverageMap: import('../../core/entities/hs-finder').CoverageMap }>}
 *
 * @example
 * await service.loadChapters(["84", "85", "90"])
 * // => {
 * //   notes: [ { chapterNumber: "84", ... }, { chapterNumber: "85", ... } ],
 * //   coverageMap: { chapters: { "84": "validated", "85": "validated", "90": "unvalidated" }, hasUnvalidated: true }
 * // }
 *
 * @example
 * await service.loadChapters([])
 * // => { notes: [], coverageMap: { chapters: {}, hasUnvalidated: false } }
 */
async function loadChapters(chapterNumbers) {
  const results = await Promise.all(
    chapterNumbers.map((num) => readChapterFile(num))
  );

  const notes = [];
  const loadedChapterNumbers = [];

  for (let i = 0; i < chapterNumbers.length; i++) {
    const result = results[i];
    if (result.ok) {
      notes.push(result.data);
      loadedChapterNumbers.push(chapterNumbers[i]);
    }
    // Missing files are skipped silently — they appear in coverageMap as "unvalidated"
  }

  const coverageMap = makeCoverageMap(chapterNumbers, loadedChapterNumbers);

  return { notes, coverageMap };
}

// ─────────────────────────────────────────────
// listAvailableChapters (method)
// ─────────────────────────────────────────────

/**
 * Scans the chapters directory and returns the sorted list of available
 * chapter numbers (files matching `chapter-{nn}.md`).
 *
 * Returns an empty array if the directory does not exist (graceful degradation).
 *
 * @returns {Promise<string[]>} Sorted array of two-digit chapter numbers, e.g. ["01", "02", "84", "85"]
 *
 * @example
 * await service.listAvailableChapters()
 * // => ["01", "02", "03", "04", "05", "39", "72", "84", "85", "87"]
 *
 * @example
 * // When directory is missing:
 * await service.listAvailableChapters()
 * // => []
 */
async function listAvailableChapters() {
  let filenames;
  try {
    filenames = await fs.readdir(CHAPTERS_DIR);
  } catch {
    return [];
  }

  const chapterNumbers = filenames
    .map((name) => {
      const match = name.match(CHAPTER_FILE_PATTERN);
      return match ? match[1] : null;
    })
    .filter(Boolean);

  chapterNumbers.sort();

  return chapterNumbers;
}

// ─────────────────────────────────────────────
// createChapterNoteLoaderService (factory)
// ─────────────────────────────────────────────

/**
 * Factory function that creates a ChapterNoteLoaderPort implementation.
 *
 * The module-level cache is shared across all instances created by this factory —
 * calling `createChapterNoteLoaderService()` multiple times does NOT reset the cache.
 *
 * @returns {import('../../core/ports/chapter-note-loader.port').ChapterNoteLoaderPort}
 *
 * @example
 * const loader = createChapterNoteLoaderService();
 * const available = await loader.listAvailableChapters();
 * // => ["01", "84", "85"]
 *
 * @example
 * const { notes, coverageMap } = await loader.loadChapters(["84", "99"]);
 * // notes.length === 1 (only "84" exists)
 * // coverageMap.chapters["99"] === "unvalidated"
 */
export function createChapterNoteLoaderService() {
  return { loadChapters, listAvailableChapters };
}
