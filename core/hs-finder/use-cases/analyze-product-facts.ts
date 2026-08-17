import { makeProductFactsAnalysis } from "../domain/product-facts";

type UnknownRecord = Record<string, any>;

export interface ProductFactsInput {
  description: string;
  previousFacts?: UnknownRecord | null;
  answers?: readonly UnknownRecord[];
}

export interface ProductFactsGateway {
  extractProductFacts(input: ProductFactsInput): Promise<
    | { ok: true; data: UnknownRecord }
    | { ok: false; error: string }
  >;
}

export function createAnalyzeProductFactsUseCase({
  productFactsGateway,
}: {
  productFactsGateway: ProductFactsGateway;
}) {
  async function execute({
    description,
    previousFacts = null,
    answers = [],
  }: ProductFactsInput) {
    const result = await productFactsGateway.extractProductFacts({
      description,
      previousFacts,
      answers,
    });
    if (!result.ok) return result;

    const analysis = makeProductFactsAnalysis(result.data);
    return analysis.ok ? analysis : { ok: false as const, error: analysis.error };
  }

  return { execute };
}
