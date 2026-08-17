import { makeProductFactsAnalysis, productFactsToDescription } from "../product-facts";

function rawFacts(overrides = {}) {
  return {
    facts: {
      productName: { value: "Laptop", confidence: "high", evidence: "laptop" },
      primaryFunction: { value: "Mengolah data", confidence: "high", evidence: "komputer" },
      physicalForm: { value: "Unit portabel lengkap", confidence: "high", evidence: "portabel" },
      materialComposition: { value: null, confidence: null, evidence: null },
      ...overrides,
    },
    missingFacts: [],
    questions: [],
  };
}

test("marks complete base facts ready for classification", () => {
  const result = makeProductFactsAnalysis(rawFacts());
  expect(result.ok).toBe(true);
  expect(result.data.status).toBe("ready_for_classification");
});

test("adds deterministic blockers for missing base facts", () => {
  const result = makeProductFactsAnalysis(rawFacts({ primaryFunction: { value: null } }));
  expect(result.data.status).toBe("needs_details");
  expect(result.data.missingFacts).toContainEqual(expect.objectContaining({
    field: "primaryFunction",
    blocking: true,
  }));
});

test("limits and de-duplicates follow-up questions", () => {
  const raw = rawFacts();
  raw.questions = ["A?", "A?", "B?", "C?", "D?"];
  const result = makeProductFactsAnalysis(raw);
  expect(result.data.questions).toEqual(["A?", "B?", "C?"]);
});

test("rejects classification fields returned by the extraction model", () => {
  const raw = rawFacts();
  raw.hsCode = "847130";
  expect(makeProductFactsAnalysis(raw)).toEqual({
    ok: false,
    error: "PRODUCT_FACTS_INVALID_RESPONSE",
  });
});

test("builds a normalized description only from known values", () => {
  const { data } = makeProductFactsAnalysis(rawFacts());
  const description = productFactsToDescription(data.facts);
  expect(description).toContain("productName: Laptop");
  expect(description).not.toContain("materialComposition");
});
