export interface ExtractedField {
  value: string | null;
  confidence: number;
  matchedPattern?: string;
}

export interface ExtractionData {
  blNumber: ExtractedField;
  shipperName: ExtractedField;
  consigneeName: ExtractedField;
  vesselName: ExtractedField;
  voyage: ExtractedField;
  portOfLoading: ExtractedField;
  portOfDischarge: ExtractedField;
  eta: ExtractedField;
  overallConfidence: number;
  foundFieldsCount: number;
  extractionMethod: "gemini" | "rule-based";
}

export interface ExtractionError {
  code: string;
  message: string;
  technicalDetails?: string;
}

export type GeminiExtractionResult =
  | { ok: true; data: ExtractionData; error?: never }
  | { ok: false; data?: never; error: ExtractionError };

/** AI extraction output port; implementations live outside core. */
export interface GeminiGateway {
  extractFromText(text: string): Promise<GeminiExtractionResult>;
}
