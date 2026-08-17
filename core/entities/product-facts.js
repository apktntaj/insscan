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

function normalizeFactField(raw) {
  const value = raw?.value;
  return Object.freeze({
    value:
      typeof value === "string" || typeof value === "boolean" || value === null
        ? value
        : null,
    confidence: CONFIDENCE_LEVELS.has(raw?.confidence) ? raw.confidence : null,
    evidence: typeof raw?.evidence === "string" && raw.evidence.trim()
      ? raw.evidence.trim().slice(0, 300)
      : null,
  });
}

function containsForbiddenClassificationKey(value) {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(
    ([key, child]) => FORBIDDEN_KEYS.test(key) || containsForbiddenClassificationKey(child)
  );
}

export function makeProductFactsAnalysis(raw) {
  if (!raw || typeof raw !== "object" || containsForbiddenClassificationKey(raw)) {
    return { ok: false, error: "PRODUCT_FACTS_INVALID_RESPONSE" };
  }

  const facts = {};
  for (const field of PRODUCT_FACT_FIELDS) facts[field] = normalizeFactField(raw.facts?.[field]);

  const missingByField = new Map();
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
      .filter((question) => typeof question === "string" && question.trim())
      .map((question) => question.trim().slice(0, 300))
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

export function productFactsToDescription(facts) {
  return PRODUCT_FACT_FIELDS
    .map((field) => {
      const value = facts?.[field]?.value;
      return value === null || value === "" || value === undefined ? null : `${field}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");
}
