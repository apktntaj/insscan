import type { ChapterNote, CoverageMap } from "../domain/hs-finder";

export interface LegalEdition {
  id?: string;
  [key: string]: unknown;
}

export interface Hs6Context {
  chapterNotes?: readonly ChapterNote[];
  notes?: readonly ChapterNote[];
  coverageMap: CoverageMap;
  isComplete?: boolean;
  edition?: LegalEdition | null;
}

/** Storage-independent output port for versioned HS and BTKI knowledge. */
export interface ClassificationKnowledge {
  getActiveEditions(effectiveDate?: string): Promise<unknown>;
  listSections(): Promise<readonly unknown[]>;
  getSectionForChapter(chapterNumber: string): Promise<unknown | null>;
  searchSections(query: string, limit?: number): Promise<unknown[]>;
  loadHs6Context(chapterNumbers: readonly string[], editionId?: string): Promise<Hs6Context>;
  loadBtki8Children(hs6Code: string, editionId?: string): Promise<unknown>;
}

const REQUIRED_METHODS: ReadonlyArray<keyof ClassificationKnowledge> = [
  "getActiveEditions",
  "listSections",
  "getSectionForChapter",
  "searchSections",
  "loadHs6Context",
  "loadBtki8Children",
];

export function validateClassificationKnowledgePort(
  repository: Partial<ClassificationKnowledge> | null | undefined,
): asserts repository is ClassificationKnowledge {
  for (const method of REQUIRED_METHODS) {
    if (typeof repository?.[method] !== "function") {
      throw new Error(`ClassificationKnowledgePort must implement "${method}" method`);
    }
  }
}
