/**
 * Chapter Note Loader Port (Interface)
 * Defines the contract for loading `.md` chapter note files from the knowledge base.
 *
 * @description Output port — implemented by the infrastructure layer
 * (infrastructure/services/chapter-note-loader.service.js).
 *
 * Enables dependency injection into the use case layer so that
 * `find-hs-code.js` is decoupled from the filesystem.
 *
 * @module core/ports/chapter-note-loader
 */

/**
 * Status ketersediaan ChapterNote untuk suatu bab.
 * @typedef {import('../entities/hs-finder').CoverageStatus} CoverageStatus
 */

/**
 * Satu file catatan bab yang berhasil dimuat dari knowledge base.
 * @typedef {import('../entities/hs-finder').ChapterNote} ChapterNote
 */

/**
 * Peta coverage per bab kandidat.
 * @typedef {import('../entities/hs-finder').CoverageMap} CoverageMap
 */

/**
 * Hasil dari loadChapters — catatan bab yang berhasil dimuat beserta peta coverage-nya.
 * @typedef {Object} LoadChaptersResult
 * @property {ChapterNote[]} notes       - Array catatan bab yang berhasil dimuat (hanya bab yang file-nya ada)
 * @property {CoverageMap}  coverageMap  - Peta coverage untuk semua bab yang diminta
 */

/**
 * Chapter Note Loader Port Interface.
 *
 * Implementasi harus membaca file `.md` dari direktori `harmonized-system/chapters/`.
 *
 * @typedef {Object} ChapterNoteLoaderPort
 *
 * @property {(chapterNumbers: string[]) => Promise<LoadChaptersResult>} loadChapters
 *   Muat file `.md` untuk setiap nomor bab yang diminta.
 *   - Input: array nomor bab, e.g. `["84", "85", "90"]`
 *   - Output: `{ notes, coverageMap }` — bab yang tidak ada file-nya masuk ke
 *     `coverageMap` sebagai `"unvalidated"`. File bertanda DRAFT dimuat untuk
 *     audit, tetapi coverage-nya `"draft"`, bukan `"validated"`.
 *
 * @property {() => Promise<string[]>} listAvailableChapters
 *   Scan direktori chapters dan kembalikan daftar nomor bab yang ada file-nya.
 *   - Input: tidak ada
 *   - Output: array nomor bab yang tersedia, e.g. `["01", "84", "85"]`
 *   - Dipanggil saat startup untuk auto-deteksi knowledge base tanpa konfigurasi tambahan.
 */

/**
 * Validates that an object implements the ChapterNoteLoaderPort interface.
 *
 * @param {Object} loader - Object to validate
 * @throws {Error} If loader doesn't implement required methods
 *
 * @example
 * validateChapterNoteLoader(myLoaderService); // passes silently
 *
 * @example
 * validateChapterNoteLoader({}); // throws Error
 */
export function validateChapterNoteLoader(loader) {
  const required = ["loadChapters", "listAvailableChapters"];

  for (const method of required) {
    if (typeof loader?.[method] !== "function") {
      throw new Error(`ChapterNoteLoaderPort must implement "${method}" method`);
    }
  }
}
