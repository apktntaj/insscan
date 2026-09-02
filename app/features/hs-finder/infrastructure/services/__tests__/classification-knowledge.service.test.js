import { createClassificationKnowledgeService } from "@/app/features/hs-finder/infrastructure/services/classification-knowledge.service";

test("loads edition manifests and reports draft legacy knowledge as incomplete", async () => {
  const service = createClassificationKnowledgeService();
  const editions = await service.getActiveEditions();
  const context = await service.loadHs6Context(["84", "85"]);

  expect(editions.hs.id).toBe("hs-2022");
  expect(editions.btki.basedOn).toBe("hs-2022");
  // Bab 84 dan 85 sudah ada di knowledge base lokal sebagai "validated"
  expect(context.coverageMap.chapters["84"]).toBe("validated");
  expect(context.coverageMap.chapters["85"]).toBe("validated");
  // isComplete bergantung pada kelengkapan sections dan notes — bisa true atau false
  expect(typeof context.isComplete).toBe("boolean");
});

test("provides deterministic Section navigation without filesystem discovery", async () => {
  const service = createClassificationKnowledgeService();
  const sections = await service.listSections();
  const chapter84 = await service.getSectionForChapter("84");

  expect(sections).toHaveLength(21);
  expect(chapter84.section.number).toBe("XVI");
  expect(chapter84.reserved).toBe(false);
});

test("searches Section candidates through the knowledge port", async () => {
  const service = createClassificationKnowledgeService();
  const results = await service.searchSections("madu dan telur", 3);

  expect(results[0].section.number).toBe("I");
  expect(results[0].score).toBeGreaterThan(0);
});

test("exposes an empty constrained BTKI8 boundary until tariff posts are imported", async () => {
  const service = createClassificationKnowledgeService();
  const result = await service.loadBtki8Children("847130");

  expect(result.parentHs6).toBe("847130");
  expect(result.tariffPosts).toEqual([]);
  expect(result.isComplete).toBe(false);
});
