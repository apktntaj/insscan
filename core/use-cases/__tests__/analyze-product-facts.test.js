import { createAnalyzeProductFactsUseCase } from "../analyze-product-facts.js";

test("normalizes gateway output and derives readiness deterministically", async () => {
  const productFactsGateway = {
    extractProductFacts: jest.fn().mockResolvedValue({
      ok: true,
      data: {
        facts: {
          productName: { value: "Laptop", confidence: "high", evidence: "laptop" },
          primaryFunction: { value: "Mengolah data", confidence: "high", evidence: "komputer" },
          physicalForm: { value: "Unit portabel", confidence: "high", evidence: "portabel" },
        },
        missingFacts: [],
        questions: [],
      },
    }),
  };
  const useCase = createAnalyzeProductFactsUseCase({ productFactsGateway });
  const result = await useCase.execute({ description: "laptop portabel" });

  expect(result.ok).toBe(true);
  expect(result.data.status).toBe("ready_for_classification");
});

test("passes previous facts and answers to the gateway", async () => {
  const productFactsGateway = {
    extractProductFacts: jest.fn().mockResolvedValue({ ok: false, error: "GEMINI_TIMEOUT" }),
  };
  const useCase = createAnalyzeProductFactsUseCase({ productFactsGateway });
  const previousFacts = { productName: { value: "Mesin" } };
  const answers = [{ question: "Fungsi?", answer: "Mengemas" }];

  const result = await useCase.execute({ description: "mesin", previousFacts, answers });
  expect(result).toEqual({ ok: false, error: "GEMINI_TIMEOUT" });
  expect(productFactsGateway.extractProductFacts).toHaveBeenCalledWith({
    description: "mesin",
    previousFacts,
    answers,
  });
});
