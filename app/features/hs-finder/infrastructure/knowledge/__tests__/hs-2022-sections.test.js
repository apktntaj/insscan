import {
  getHs2022Section,
  getHs2022SectionForChapter,
  listHs2022Sections,
  searchHs2022Sections,
} from "@/app/features/hs-finder/infrastructure/knowledge/hs-2022-sections";

test("contains all 21 Sections in ordinal order", () => {
  const sections = listHs2022Sections();
  expect(sections).toHaveLength(21);
  expect(sections.map(({ ordinal }) => ordinal)).toEqual(
    Array.from({ length: 21 }, (_, index) => index + 1)
  );
});

test("maps every Chapter 01-97 to exactly one Section", () => {
  for (let chapter = 1; chapter <= 97; chapter += 1) {
    const result = getHs2022SectionForChapter(String(chapter));
    expect(result).not.toBeNull();
  }
});

test("marks reserved Chapter 77 without treating it as an active chapter", () => {
  const result = getHs2022SectionForChapter("77");
  expect(result.section.number).toBe("XV");
  expect(result.reserved).toBe(true);
  expect(result.section.chapters).not.toContain("77");
});

test("maps machinery Chapters 84 and 85 to Section XVI", () => {
  expect(getHs2022SectionForChapter("84").section.number).toBe("XVI");
  expect(getHs2022SectionForChapter("85").section.number).toBe("XVI");
  expect(getHs2022Section("XVI").chapters).toEqual(["84", "85"]);
});

test("returns null for unknown Sections and Chapters", () => {
  expect(getHs2022Section("XXII")).toBeNull();
  expect(getHs2022SectionForChapter("98")).toBeNull();
});

test("Sections I-V have complete reviewed Section-note coverage", () => {
  const reviewed = listHs2022Sections().slice(0, 5);
  expect(reviewed.map(({ status }) => status)).toEqual(Array(5).fill("validated"));
  expect(reviewed.map(({ legalNotes }) => legalNotes.length)).toEqual([2, 1, 0, 1, 0]);

  for (const section of reviewed) {
    expect(section.noteCoverage).toBe("complete");
    expect(section.source.regulation).toBe("26/PMK.010/2022");
    expect(section.source.attachment).toBe("II");
  }
});

test("every legal note has a stable ID, exact source, and validated status", () => {
  const notes = listHs2022Sections().slice(0, 5).flatMap(({ legalNotes }) => legalNotes);
  expect(notes.map(({ id }) => id)).toEqual([
    "HS2022-SECTION-I-NOTE-1",
    "HS2022-SECTION-I-NOTE-2",
    "HS2022-SECTION-II-NOTE-1",
    "HS2022-SECTION-IV-NOTE-1",
  ]);
  expect(notes.every(({ source, status }) => source.pdfPage && status === "validated")).toBe(true);
});

test("search uses Section records as a navigation index", () => {
  expect(searchHs2022Sections("ikan segar")[0].section.number).toBe("I");
  expect(searchHs2022Sections("kopi dan tanaman")[0].section.number).toBe("II");
  expect(searchHs2022Sections("minyak nabati")[0].section.number).toBe("III");
  expect(searchHs2022Sections("tembakau nikotin")[0].section.number).toBe("IV");
  expect(searchHs2022Sections("bijih mineral")[0].section.number).toBe("V");
});
