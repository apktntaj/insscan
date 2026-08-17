import { makeProductFactsAnalysis } from "../entities/product-facts.js";

export function createAnalyzeProductFactsUseCase({ productFactsGateway }) {
  async function execute({ description, previousFacts = null, answers = [] }) {
    const result = await productFactsGateway.extractProductFacts({
      description,
      previousFacts,
      answers,
    });
    if (!result.ok) return result;

    const analysis = makeProductFactsAnalysis(result.data);
    return analysis.ok
      ? analysis
      : { ok: false, error: analysis.error };
  }

  return { execute };
}
