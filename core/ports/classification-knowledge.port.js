/**
 * Storage-independent contract for versioned HS and BTKI legal knowledge.
 *
 * The core classification flow must depend on this port, never directly on
 * JSON, Markdown, a database, or a vector index. Exact lookup remains the
 * source of legal rules; semantic search may only propose candidates.
 *
 * @typedef {Object} ClassificationKnowledgePort
 * @property {(effectiveDate?: string) => Promise<Object>} getActiveEditions
 * @property {() => Promise<readonly Object[]>} listSections
 * @property {(chapterNumber: string) => Promise<Object|null>} getSectionForChapter
 * @property {(query: string, limit?: number) => Promise<Object[]>} searchSections
 * @property {(chapterNumbers: string[], editionId?: string) => Promise<Object>} loadHs6Context
 * @property {(hs6Code: string, editionId?: string) => Promise<Object>} loadBtki8Children
 */

const REQUIRED_METHODS = [
  "getActiveEditions",
  "listSections",
  "getSectionForChapter",
  "searchSections",
  "loadHs6Context",
  "loadBtki8Children",
];

export function validateClassificationKnowledgePort(repository) {
  for (const method of REQUIRED_METHODS) {
    if (typeof repository?.[method] !== "function") {
      throw new Error(`ClassificationKnowledgePort must implement "${method}" method`);
    }
  }
}
