/** Filesystem adapter for the versioned classification knowledge port. */
import { createChapterNoteLoaderService } from "@/app/features/hs-finder/infrastructure/services/chapter-note-loader.service";
import hsManifestJson from "@/app/features/hs-finder/infrastructure/knowledge/manifests/hs-2022.json";
import btkiManifestJson from "@/app/features/hs-finder/infrastructure/knowledge/manifests/btki-current.json";
import {
  getHs2022SectionForChapter,
  listHs2022Sections,
  searchHs2022Sections,
} from "@/app/features/hs-finder/infrastructure/knowledge/hs-2022-sections";
import type { ClassificationKnowledge, Hs6Context, LegalEdition } from "@core/hs-finder/ports/classification-knowledge";
import type { ChapterNote, CoverageMap } from "@core/hs-finder/domain/hs-finder";
import type {
  HsSection,
  HsSectionChapter,
  HsSectionSearchResult,
} from "@/app/features/hs-finder/infrastructure/knowledge/hs-2022-sections";

type Edition = LegalEdition & { status: string };
type ActiveEditions = { hs: Edition; btki: Edition };
type BtkiChildren = {
  edition: Edition;
  parentHs6: string;
  tariffPosts: readonly unknown[];
  isComplete: boolean;
};

const hsManifest: Edition = hsManifestJson;
const btkiManifest: Edition = btkiManifestJson;
export function createClassificationKnowledgeService(): ClassificationKnowledge {
  const legacyLoader = createChapterNoteLoaderService();

  async function getActiveEditions(): Promise<ActiveEditions> {
    return { hs: hsManifest, btki: btkiManifest };
  }

  async function listSections(): Promise<readonly HsSection[]> {
    return listHs2022Sections();
  }

  async function getSectionForChapter(
    chapterNumber: string,
  ): Promise<HsSectionChapter | null> {
    return getHs2022SectionForChapter(chapterNumber);
  }

  async function searchSections(
    query: string,
    limit?: number,
  ): Promise<HsSectionSearchResult[]> {
    return searchHs2022Sections(query, limit);
  }

  async function loadHs6Context(
    chapterNumbers: readonly string[],
  ): Promise<Hs6Context & Record<string, unknown>> {
    const editions = await getActiveEditions();
    const { notes, coverageMap }: {
      notes: readonly ChapterNote[];
      coverageMap: CoverageMap;
    } = await legacyLoader.loadChapters(chapterNumbers);
    const sectionEntries = chapterNumbers
      .map((chapter) => getHs2022SectionForChapter(chapter))
      .filter((entry): entry is HsSectionChapter => entry !== null);
    const sections = [...new Map<string, HsSection>(
      sectionEntries.map(({ section }) => [section.number, section]),
    ).values()];

    return {
      edition: editions.hs,
      rules: [],
      sections,
      sectionNotes: sections.flatMap((section) => section.legalNotes),
      chapterNotes: notes,
      headings: [],
      coverageMap,
      isComplete:
        editions.hs.status === "validated" &&
        sections.every((section) => section.status === "validated") &&
        !coverageMap.hasUnvalidated &&
        notes.length === chapterNumbers.length,
    };
  }

  async function loadBtki8Children(hs6Code: string): Promise<BtkiChildren> {
    const { btki } = await getActiveEditions();
    return {
      edition: btki,
      parentHs6: hs6Code,
      tariffPosts: [],
      isComplete: false,
    };
  }

  return {
    getActiveEditions,
    listSections,
    getSectionForChapter,
    searchSections,
    loadHs6Context,
    loadBtki8Children,
  };
}
