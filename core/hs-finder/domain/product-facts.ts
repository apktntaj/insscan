/** Product facts required before legal HS classification begins. */

export const PRODUCT_FACT_FIELDS = Object.freeze([
  "productName",
  "materialComposition",
  "primaryFunction",
  "workingPrinciple",
  "physicalForm",
  "processingState",
  "intendedUse",
  "isPartOrAccessory",
  "isSetOrMixture",
  "packaging",
  "technicalSpecifications",
]);

const REQUIRED_BASE_FIELDS = ["productName", "primaryFunction", "physicalForm"];
const CONFIDENCE_LEVELS = new Set(["low", "medium", "high", null]);
const FORBIDDEN_KEYS = /^(hsCode|candidateCode|chapter|heading|subheading|tariffPost)$/i;

type FactValue = string | boolean | null;
type ConfidenceLevel = "low" | "medium" | "high" | null;

export interface ProductFact {
  value: FactValue;
  confidence: ConfidenceLevel;
  evidence: string | null;
}

export type ProductFacts = Record<string, ProductFact>;

export interface MissingProductFact {
  field: string;
  reason: string;
  blocking: boolean;
}

export interface ProductFactsAnalysis {
  status: "needs_details" | "ready_for_classification";
  facts: Readonly<ProductFacts>;
  missingFacts: readonly MissingProductFact[];
  questions: readonly string[];
}

export type ProductFactsAnalysisResult =
  | { ok: true; data: Readonly<ProductFactsAnalysis> }
  | { ok: false; error: string };

type UnknownRecord = Record<string, any>;

function normalizeFactField(raw: UnknownRecord | null | undefined): Readonly<ProductFact> {
  const value = raw?.value;
  return Object.freeze({
    value:
      typeof value === "string" || typeof value === "boolean" || value === null
        ? value
        : null,
    confidence: CONFIDENCE_LEVELS.has(raw?.confidence) ? raw?.confidence : null,
    evidence: typeof raw?.evidence === "string" && raw.evidence.trim()
      ? raw.evidence.trim().slice(0, 300)
      : null,
  });
}

function containsForbiddenClassificationKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(
    ([key, child]) => FORBIDDEN_KEYS.test(key) || containsForbiddenClassificationKey(child)
  );
}

export function makeProductFactsAnalysis(
  raw: UnknownRecord | null | undefined,
): ProductFactsAnalysisResult {
  if (!raw || typeof raw !== "object" || containsForbiddenClassificationKey(raw)) {
    return { ok: false, error: "PRODUCT_FACTS_INVALID_RESPONSE" };
  }

  const facts: ProductFacts = {};
  for (const field of PRODUCT_FACT_FIELDS) facts[field] = normalizeFactField(raw.facts?.[field]);

  const missingByField = new Map<string, MissingProductFact>();
  for (const item of Array.isArray(raw.missingFacts) ? raw.missingFacts : []) {
    if (!PRODUCT_FACT_FIELDS.includes(item?.field)) continue;
    missingByField.set(item.field, {
      field: item.field,
      reason: typeof item.reason === "string" ? item.reason.trim().slice(0, 300) : "Informasi diperlukan untuk klasifikasi.",
      blocking: item.blocking !== false,
    });
  }

  for (const field of REQUIRED_BASE_FIELDS) {
    if (facts[field].value === null || facts[field].value === "") {
      missingByField.set(field, {
        field,
        reason: "Informasi dasar ini harus dikonfirmasi sebelum klasifikasi.",
        blocking: true,
      });
    }
  }

  const missingFacts = [...missingByField.values()];
  const questions = [...new Set(
    (Array.isArray(raw.questions) ? raw.questions : [])
      .filter((question: unknown): question is string => typeof question === "string" && Boolean(question.trim()))
      .map((question: string) => question.trim().slice(0, 300))
  )].slice(0, 3);
  const hasBlockingFacts = missingFacts.some(({ blocking }) => blocking);

  return {
    ok: true,
    data: Object.freeze({
      status: hasBlockingFacts ? "needs_details" : "ready_for_classification",
      facts: Object.freeze(facts),
      missingFacts: Object.freeze(missingFacts),
      questions: Object.freeze(questions),
    }),
  };
}

export function productFactsToDescription(facts: ProductFacts | null | undefined): string {
  return PRODUCT_FACT_FIELDS
    .map((field) => {
      const value = facts?.[field]?.value;
      return value === null || value === "" || value === undefined ? null : `${field}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");
}
