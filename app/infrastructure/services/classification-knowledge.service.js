/** Filesystem adapter for the versioned classification knowledge port. */
import { createChapterNoteLoaderService } from "./chapter-note-loader.service.js";
import hsManifest from "../knowledge/manifests/hs-2022.json";
import btkiManifest from "../knowledge/manifests/btki-current.json";
import {
  getHs2022SectionForChapter,
  listHs2022Sections,
  searchHs2022Sections,
} from "../knowledge/hs-2022-sections.js";

export function createClassificationKnowledgeService() {
  const legacyLoader = createChapterNoteLoaderService();

  async function getActiveEditions() {
    return { hs: hsManifest, btki: btkiManifest };
  }

  async function listSections() {
    return listHs2022Sections();
  }

  async function getSectionForChapter(chapterNumber) {
    return getHs2022SectionForChapter(chapterNumber);
  }

  async function searchSections(query, limit) {
    return searchHs2022Sections(query, limit);
  }

  async function loadHs6Context(chapterNumbers) {
    const editions = await getActiveEditions();
    const { notes, coverageMap } = await legacyLoader.loadChapters(chapterNumbers);
    const sectionEntries = chapterNumbers
      .map((chapter) => getHs2022SectionForChapter(chapter))
      .filter(Boolean);
    const sections = [...new Map(
      sectionEntries.map(({ section }) => [section.number, section])
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

  async function loadBtki8Children(hs6Code) {
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
