import type { ChapterNote, CoverageMap } from "../domain/hs-finder";

export interface LoadChaptersResult {
  notes: readonly ChapterNote[];
  coverageMap: CoverageMap;
}

/** Output port for loading legal chapter notes without coupling core to files. */
export interface ChapterNoteLoader {
  loadChapters(chapterNumbers: readonly string[]): Promise<LoadChaptersResult>;
  listAvailableChapters(): Promise<string[]>;
}

export function validateChapterNoteLoader(
  loader: Partial<ChapterNoteLoader> | null | undefined,
): asserts loader is ChapterNoteLoader {
  const required: ReadonlyArray<keyof ChapterNoteLoader> = [
    "loadChapters",
    "listAvailableChapters",
  ];

  for (const method of required) {
    if (typeof loader?.[method] !== "function") {
      throw new Error(`ChapterNoteLoaderPort must implement "${method}" method`);
    }
  }
}
