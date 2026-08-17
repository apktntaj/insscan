import {
  extractBLFields,
  type ExtractedField,
  type ExtractionResult,
} from "../domain/bl-extractor";

export interface ExtractionError {
  code: string;
  message: string;
  technicalDetails?: string;
}

export interface ExtractionData extends ExtractionResult {
  extractionMethod: "gemini" | "rule-based";
}

export type ExtractionUseCaseResult =
  | { ok: true; data: ExtractionData }
  | { ok: false; error: ExtractionError };

export interface GeminiExtractionGateway {
  extractFromText(text: string, attachment?: unknown): Promise<ExtractionUseCaseResult>;
}

export interface ExtractionUsageTracker {
  canExtract(): Promise<
    | { ok: true; remaining: number }
    | { ok: false; error: ExtractionError }
  >;
  incrementUsage(): Promise<void>;
}

export function createExtractBLWithGeminiUseCase(
  geminiGateway: GeminiExtractionGateway | null | undefined,
  usageTracker: ExtractionUsageTracker,
) {
  async function execute(
    text: string,
    attachment: unknown = null,
  ): Promise<ExtractionUseCaseResult> {
    const canExtractResult = await usageTracker.canExtract();
    if (!canExtractResult.ok) return canExtractResult;

    if (!isGeminiAvailable(geminiGateway)) return fallbackToRuleBased(text);

    const geminiResult = await attemptGeminiExtraction(text, geminiGateway, attachment);
    if (geminiResult.ok) {
      await usageTracker.incrementUsage();
      return geminiResult;
    }

    return geminiResult.error.code === "DAILY_LIMIT_REACHED"
      ? geminiResult
      : fallbackToRuleBased(text);
  }

  return { execute };
}

async function attemptGeminiExtraction(
  text: string,
  geminiGateway: GeminiExtractionGateway,
  attachment: unknown = null,
): Promise<ExtractionUseCaseResult> {
  try {
    return await geminiGateway.extractFromText(text, attachment);
  } catch (error) {
    return extractionFailure(
      "Koneksi terputus. Coba lagi atau isi manual ya.",
      error,
    );
  }
}

async function fallbackToRuleBased(text: string): Promise<ExtractionUseCaseResult> {
  try {
    return { ok: true, data: convertRuleBasedResult(extractBLFields(text)) };
  } catch (error) {
    return extractionFailure(
      "File tidak bisa dibaca. Coba file lain atau isi manual.",
      error,
    );
  }
}

function convertRuleBasedResult(ruleBasedResult: ExtractionResult): ExtractionData {
  return { ...ruleBasedResult, extractionMethod: "rule-based" };
}

function isGeminiAvailable(
  gateway: GeminiExtractionGateway | null | undefined,
): gateway is GeminiExtractionGateway {
  return Boolean(gateway && typeof gateway.extractFromText === "function");
}

function extractionFailure(message: string, error: unknown): ExtractionUseCaseResult {
  return {
    ok: false,
    error: {
      code: "API_ERROR",
      message,
      technicalDetails: error instanceof Error ? error.message : String(error),
    },
  };
}

/** Utility retained for adapters that aggregate individual confidence scores. */
export function calculateOverallConfidence(scores: Record<string, number>): number {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

export type { ExtractedField };
