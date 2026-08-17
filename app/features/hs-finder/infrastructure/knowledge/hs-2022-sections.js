/**
 * Statically imported HS 2022 Section index.
 *
 * Keeping this import static guarantees that Next.js includes the knowledge in
 * the Vercel deployment bundle; no runtime filesystem discovery is required.
 */
import sectionRecords from "@/app/features/hs-finder/infrastructure/knowledge/hs-2022-sections.data";

const sections = Object.freeze(
  sectionRecords.map((section) =>
    Object.freeze({
      ...section,
      chapters: Object.freeze([...section.chapters]),
      reservedChapters: Object.freeze([...(section.reservedChapters ?? [])]),
      legalNotes: Object.freeze([...section.legalNotes]),
      navigation: Object.freeze({
        keywords: Object.freeze([...section.navigation.keywords]),
        redirects: Object.freeze([...section.navigation.redirects]),
      }),
    })
  )
);

const sectionsByNumber = new Map(sections.map((section) => [section.number, section]));
const sectionsByChapter = new Map();

for (const section of sections) {
  for (const chapter of section.chapters) {
    if (sectionsByChapter.has(chapter)) {
      throw new Error(`Duplicate HS chapter mapping: ${chapter}`);
    }
    sectionsByChapter.set(chapter, { section, reserved: false });
  }
  for (const chapter of section.reservedChapters) {
    if (sectionsByChapter.has(chapter)) {
      throw new Error(`Duplicate HS chapter mapping: ${chapter}`);
    }
    sectionsByChapter.set(chapter, { section, reserved: true });
  }
}

export function listHs2022Sections() {
  return sections;
}

export function getHs2022Section(sectionNumber) {
  return sectionsByNumber.get(sectionNumber) ?? null;
}

export function getHs2022SectionForChapter(chapterNumber) {
  const normalized = String(chapterNumber).padStart(2, "0");
  return sectionsByChapter.get(normalized) ?? null;
}

function normalizeSearchText(value) {
  return String(value)
    .toLocaleLowerCase("id-ID")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Navigation-only search. Scores candidates; it does not classify goods. */
export function searchHs2022Sections(query, limit = 5) {
  const tokens = [...new Set(normalizeSearchText(query).split(" ").filter(Boolean))];
  if (tokens.length === 0) return [];

  return sections
    .map((section) => {
      const title = normalizeSearchText(section.title);
      const keywords = section.navigation.keywords.map(normalizeSearchText);
      const score = tokens.reduce((total, token) => {
        if (keywords.some((keyword) => keyword === token)) return total + 3;
        if (keywords.some((keyword) => keyword.includes(token))) return total + 2;
        if (title.includes(token)) return total + 1;
        return total;
      }, 0);
      return { section, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.section.ordinal - b.section.ordinal)
    .slice(0, Math.max(0, limit));
}
