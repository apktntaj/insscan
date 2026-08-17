import { makeClassificationDecision } from "../hs-finder.js";

const coverageMap = {
  chapters: { "84": "validated", "85": "validated" },
  hasUnvalidated: false,
};

test("accepts at most two targeted clarification questions", () => {
  const result = makeClassificationDecision({
    status: "needs_clarification",
    clarificationReason: "Barang dapat masuk Bab 84 atau 85 bergantung pada fungsi utamanya.",
    questions: ["Apa fungsi utamanya?", "Apakah barang merupakan bagian?", "Apa warnanya?"],
    recommendations: [],
    coverageMap,
  });

  expect(result.ok).toBe(true);
  expect(result.data.questions).toEqual([
    "Apa fungsi utamanya?",
    "Apakah barang merupakan bagian?",
  ]);
});

test("normalizes ranked recommendations and removes duplicate codes", () => {
  const recommendation = {
    hsCode: "847130",
    description: "Mesin pengolah data portabel",
    confidence: "high",
    rationale: "Fungsi utamanya adalah pengolahan data.",
    quotedRule: "Mesin pengolah data otomatis",
    chapterRef: "84",
  };
  const result = makeClassificationDecision({
    status: "recommendations",
    clarificationReason: null,
    questions: [],
    recommendations: [recommendation, recommendation],
    coverageMap,
  });

  expect(result.ok).toBe(true);
  expect(result.data.recommendations).toHaveLength(1);
  expect(result.data.recommendations[0].hsCode).toBe("847130");
});

test("rejects clarification without a material-impact reason", () => {
  const result = makeClassificationDecision({
    status: "needs_clarification",
    clarificationReason: "",
    questions: ["Apa bahannya?"],
    recommendations: [],
    coverageMap,
  });

  expect(result.ok).toBe(false);
});
