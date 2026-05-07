/**
 * BLExtractorService - Core Layer
 * 
 * Extracts shipment fields from Bill of Lading text using pattern matching.
 * Uses rule-based extraction with confidence scoring.
 */

/**
 * @typedef {Object} ExtractedField
 * @property {string|null} value - Extracted value (null if not found)
 * @property {number} confidence - Confidence score 0-1
 * @property {string} [matchedPattern] - Pattern that matched (for debugging)
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {ExtractedField} blNumber
 * @property {ExtractedField} shipperName
 * @property {ExtractedField} consigneeName
 * @property {ExtractedField} vesselName
 * @property {ExtractedField} voyage
 * @property {ExtractedField} portOfLoading
 * @property {ExtractedField} portOfDischarge
 * @property {ExtractedField} eta
 * @property {number} overallConfidence - Average confidence across all fields
 * @property {number} foundFieldsCount - Number of fields with non-null values
 */

/**
 * Pattern library for field extraction.
 * Each field has multiple patterns to match different B/L formats.
 * Patterns ordered by priority: specific patterns first, generic fallbacks last.
 */
const FIELD_PATTERNS = {
  blNumber: {
    patterns: [
      // With keywords (original)
      { regex: /B\/L\s*NO\.?\s*:?\s*([A-Z0-9]+)/i, keyword: 'B/L NO', priority: 1 },
      { regex: /BILL\s*OF\s*LADING\s*NO\.?\s*:?\s*([A-Z0-9]+)/i, keyword: 'BILL OF LADING NO', priority: 2 },
      { regex: /BL\s*NUMBER\s*:?\s*([A-Z0-9]+)/i, keyword: 'BL NUMBER', priority: 3 },
      { regex: /B\/L\s*:?\s*([A-Z0-9]{8,})/i, keyword: 'B/L', priority: 4 },
      // Without keywords - pattern-based (fallback for PDFs without text labels)
      { regex: /\b([A-Z]{3,5}\d{8,12})\b/i, keyword: 'PATTERN: ALPHA+DIGITS', priority: 5 },
      { regex: /\b([A-Z]{2,4}[A-Z0-9]{10,})\b/i, keyword: 'PATTERN: MIXED', priority: 6 },
    ]
  },
  
  shipperName: {
    patterns: [
      // With keywords (original)
      { regex: /SHIPPER\s*\n([^\n]+(?:\n(?!CONSIGNEE|NOTIFY PARTY)[^\n]+){0,5})/i, keyword: 'SHIPPER', priority: 1 },
      { regex: /SHIPPER\s*:?\s*\n?\s*([A-Z0-9\s,\.&\-()]+?)(?=\n\n|CONSIGNEE|NOTIFY|$)/is, keyword: 'SHIPPER', priority: 2 },
      { regex: /CONSIGNOR\s*:?\s*\n?\s*([A-Z0-9\s,\.&\-()]+?)(?=\n\n|CONSIGNEE|NOTIFY|$)/is, keyword: 'CONSIGNOR', priority: 3 },
      // Without keywords - assume first company name in document
      { regex: /^([A-Z][A-Z0-9\s,\.&\-()]+?(?:CO\.|LTD|INC|LLC|PT\.|CV\.)[^\n]*(?:\n(?!TEL|FAX|EMAIL)[^\n]+){0,5})/im, keyword: 'PATTERN: FIRST COMPANY', priority: 4 },
    ]
  },
  
  consigneeName: {
    patterns: [
      // With keywords (original)
      { regex: /CONSIGNEE\s*\n([^\n]+(?:\n(?!NOTIFY PARTY|PLACE OF)[^\n]+){0,5})/i, keyword: 'CONSIGNEE', priority: 1 },
      { regex: /CONSIGNEE\s*:?\s*\n?\s*([A-Z0-9\s,\.&\-()]+?)(?=\n\n|NOTIFY|VESSEL|$)/is, keyword: 'CONSIGNEE', priority: 2 },
      { regex: /NOTIFY\s*PARTY\s*:?\s*\n?\s*([A-Z0-9\s,\.&\-()]+?)(?=\n\n|VESSEL|PORT|$)/is, keyword: 'NOTIFY PARTY', priority: 3 },
      // Without keywords - assume second company name after TEL/FAX block
      { regex: /(?:TEL|FAX):[^\n]+\n[^\n]*\n\s*([A-Z][A-Z0-9\s,\.&\-()]+?(?:CO\.|LTD|INC|LLC|PT\.|CV\.)[^\n]*(?:\n(?!TEL|FAX|EMAIL|PLACE|PORT|OCEAN)[^\n]+){0,5})/im, keyword: 'PATTERN: SECOND COMPANY', priority: 4 },
    ]
  },
  
  vesselName: {
    patterns: [
      // With keywords (original)
      { regex: /OCEAN\s+VESSEL\s*\n\s*([A-Z0-9\s\-]+?)(?=\s*\n|\s{3,})/i, keyword: 'OCEAN VESSEL', priority: 1 },
      { regex: /VESSEL\s*NAME\s*:?\s*([A-Z0-9\s\-]+?)(?=\n|VOYAGE|VOY|$)/i, keyword: 'VESSEL NAME', priority: 2 },
      { regex: /VESSEL\s*:?\s*([A-Z0-9\s\-]+?)(?=\n|VOYAGE|VOY|$)/i, keyword: 'VESSEL', priority: 3 },
      // Without keywords - pattern: 2-3 capitalized words before voyage number
      { regex: /\b([A-Z][A-Z\s]{5,30}?)\s+\d{3,5}[A-Z]?\b/i, keyword: 'PATTERN: NAME BEFORE VOYAGE', priority: 4 },
    ]
  },
  
  voyage: {
    patterns: [
      // With keywords (original)
      { regex: /VOY\.?\s+NO\.?\s*\n\s*([A-Z0-9\-]+)/i, keyword: 'VOY. NO.', priority: 1 },
      { regex: /VOYAGE\s*NO\.?\s*:?\s*([A-Z0-9\-]+)/i, keyword: 'VOYAGE NO', priority: 2 },
      { regex: /VOYAGE\s*:?\s*([A-Z0-9\-]+)/i, keyword: 'VOYAGE', priority: 3 },
      { regex: /VOY\.?\s*:?\s*([A-Z0-9\-]+)/i, keyword: 'VOY', priority: 4 },
      // Without keywords - pattern: 3-5 digits followed by optional letter
      { regex: /\b(\d{3,5}[A-Z]?)\b/i, keyword: 'PATTERN: DIGITS+LETTER', priority: 5 },
    ]
  },
  
  portOfLoading: {
    patterns: [
      // Try table-based layout first
      { regex: /PORT\s+OF\s+LOADING\s*\n\s*([A-Z\s,]+?)(?=\s*\n)/i, keyword: 'PORT OF LOADING', priority: 1 },
      // Fallback: original patterns
      { regex: /PORT\s*OF\s*LOADING\s*:?\s*([A-Z\s,]+?)(?=\n|PORT\s*OF\s*DISCHARGE|$)/i, keyword: 'PORT OF LOADING', priority: 2 },
      { regex: /POL\s*:?\s*([A-Z\s,]+?)(?=\n|POD|$)/i, keyword: 'POL', priority: 3 },
      { regex: /PLACE\s*OF\s*RECEIPT\s*:?\s*([A-Z\s,]+?)(?=\n|PORT|$)/i, keyword: 'PLACE OF RECEIPT', priority: 4 },
    ]
  },
  
  portOfDischarge: {
    patterns: [
      // Try table-based layout first
      { regex: /PORT\s+OF\s+DISCHARGE\s*\n\s*([A-Z\s,]+?)(?=\s*\n)/i, keyword: 'PORT OF DISCHARGE', priority: 1 },
      // Fallback: original patterns
      { regex: /PORT\s*OF\s*DISCHARGE\s*:?\s*([A-Z\s,]+?)(?=\n|PLACE|$)/i, keyword: 'PORT OF DISCHARGE', priority: 2 },
      { regex: /POD\s*:?\s*([A-Z\s,]+?)(?=\n|PLACE|$)/i, keyword: 'POD', priority: 3 },
      { regex: /PLACE\s*OF\s*DELIVERY\s*:?\s*([A-Z\s,]+?)(?=\n|$)/i, keyword: 'PLACE OF DELIVERY', priority: 4 },
    ]
  },
  
  eta: {
    patterns: [
      { regex: /ETA\s*:?\s*(\d{4}-\d{2}-\d{2})/i, keyword: 'ETA', priority: 1 },
      { regex: /ETA\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i, keyword: 'ETA', priority: 2 },
      { regex: /ETA\s*:?\s*([A-Z]+\s+\d{1,2},?\s+\d{4})/i, keyword: 'ETA', priority: 3 },
      { regex: /ESTIMATED\s*TIME\s*OF\s*ARRIVAL\s*:?\s*(\d{4}-\d{2}-\d{2})/i, keyword: 'ESTIMATED TIME OF ARRIVAL', priority: 4 },
      { regex: /ESTIMATED\s*TIME\s*OF\s*ARRIVAL\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i, keyword: 'ESTIMATED TIME OF ARRIVAL', priority: 5 },
      { regex: /ETD\s*:?\s*(\d{4}-\d{2}-\d{2})/i, keyword: 'ETD', priority: 6 },
      { regex: /ETD\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i, keyword: 'ETD', priority: 7 },
    ]
  }
};

export { FIELD_PATTERNS };

/**
 * Extracts a single field from text using multiple patterns.
 * Returns the candidate with highest confidence.
 * 
 * @param {string} text - Raw text from PDF
 * @param {Object} fieldConfig - Field configuration with patterns
 * @param {string} fieldName - Name of the field being extracted
 * @returns {ExtractedField}
 */
function extractField(text, fieldConfig, fieldName = '') {
  const candidates = [];

  for (const patternConfig of fieldConfig.patterns) {
    const match = text.match(patternConfig.regex);

    if (match && match[1]) {
      const rawValue = match[1].trim();
      const normalizedValue = rawValue.toUpperCase();
      const confidence = calculateConfidence(normalizedValue, patternConfig.keyword, text, fieldName);

      candidates.push({
        value: normalizedValue,
        confidence,
        matchedPattern: patternConfig.keyword,
        priority: patternConfig.priority || 999
      });
    }
  }

  if (candidates.length === 0) {
    return { value: null, confidence: 0, matchedPattern: null };
  }

  candidates.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) > 0.1) return b.confidence - a.confidence;
    return a.priority - b.priority;
  });

  return candidates[0];
}

/**
 * Extracts all shipment fields from Bill of Lading text.
 * 
 * @param {string} text - Raw text extracted from PDF
 * @returns {ExtractionResult}
 * 
 * @example
 * const result = extractBLFields("B/L NO: ABCD123\nSHIPPER: PT X");
 * // {
 * //   blNumber: { value: "ABCD123", confidence: 0.95 },
 * //   shipperName: { value: "PT X", confidence: 0.85 },
 * //   ...
 * // }
 */
export function extractBLFields(text) {
  const blNumber = extractField(text, FIELD_PATTERNS.blNumber, 'blNumber');
  const shipperName = extractField(text, FIELD_PATTERNS.shipperName, 'shipperName');
  const consigneeName = extractField(text, FIELD_PATTERNS.consigneeName, 'consigneeName');
  const vesselName = extractField(text, FIELD_PATTERNS.vesselName, 'vesselName');
  const voyage = extractField(text, FIELD_PATTERNS.voyage, 'voyage');
  const portOfLoading = extractField(text, FIELD_PATTERNS.portOfLoading, 'portOfLoading');
  const portOfDischarge = extractField(text, FIELD_PATTERNS.portOfDischarge, 'portOfDischarge');

  const etaRaw = extractField(text, FIELD_PATTERNS.eta, 'eta');
  const eta = etaRaw.value ? normalizeDate(etaRaw.value) : etaRaw;

  const fields = [blNumber, shipperName, consigneeName, vesselName, voyage, portOfLoading, portOfDischarge, eta];
  const foundFieldsCount = fields.filter(f => f.value !== null).length;
  const overallConfidence = foundFieldsCount > 0
    ? fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length
    : 0;

  return { blNumber, shipperName, consigneeName, vesselName, voyage, portOfLoading, portOfDischarge, eta, overallConfidence, foundFieldsCount };
}

/**
 * Normalizes extracted date to YYYY-MM-DD format.
 * 
 * @param {string} dateStr - Date string in various formats
 * @returns {ExtractedField}
 */
function normalizeDate(dateStr) {
  const normalized = parseDateString(dateStr);
  
  if (!normalized) {
    return {
      value: null,
      confidence: 0,
      matchedPattern: null
    };
  }
  
  return {
    value: normalized,
    confidence: 0.8, // Date parsing has inherent uncertainty
    matchedPattern: 'DATE'
  };
}

/**
 * Calculates confidence score based on pattern match quality.
 * Adjusted for Indonesian B/L format (multi-line addresses, table layout).
 * 
 * @param {string} value - Extracted value
 * @param {string} keyword - Keyword that matched
 * @param {string} context - Full text context
 * @param {string} fieldName - Name of the field being extracted
 * @returns {number} Confidence score 0-1
 * 
 * @example
 * calculateConfidence("MAEU123456789", "B/L NO", text, "blNumber") // 0.95
 * calculateConfidence("PT X\nJAKARTA", "SHIPPER", text, "shipperName") // 0.85
 */
function calculateConfidence(value, keyword, context, fieldName = '') {
  let score = 0.5; // Base score
  
  // Boost for exact keyword match (keyword appears in context near value)
  if (context.toUpperCase().includes(keyword.toUpperCase())) {
    score += 0.2;
  }
  
  // Field-specific scoring adjustments
  if (fieldName === 'shipperName' || fieldName === 'consigneeName') {
    // Multi-line addresses are expected and good
    if (value.includes('\n')) {
      score += 0.15; // Boost for multi-line (more complete address)
    }
    
    // Company name indicators (PT, CV, LLC, CO, LTD, INC)
    if (/\b(PT\.?|CV\.?|LLC|CO\.?|LTD\.?|INC\.?)\b/i.test(value)) {
      score += 0.1;
    }
    
    // Don't penalize commas and periods in addresses
    const addressChars = (value.match(/[,\.]/g) || []).length;
    if (addressChars > 0 && addressChars < value.length * 0.5) {
      score += 0.05; // Slight boost for structured address
    }
  } else {
    // For other fields, boost for value length
    if (value.length > 5) {
      score += 0.1;
    }
    if (value.length > 10) {
      score += 0.1;
    }
    
    // Boost for alphanumeric pattern (typical for BL numbers, voyage)
    if (/^[A-Z]{3,4}\d+$/.test(value)) {
      score += 0.1;
    }
    
    // Penalty for excessive special characters (might be noise)
    const specialCharCount = (value.match(/[^A-Z0-9\s]/g) || []).length;
    if (specialCharCount > value.length * 0.3) {
      score -= 0.1;
    }
  }
  
  // Clamp to [0, 1] range
  return Math.max(0, Math.min(1, score));
}

/**
 * Parses various date formats and converts to YYYY-MM-DD.
 * 
 * @param {string} dateStr - Date string in various formats
 * @returns {string|null} Date in YYYY-MM-DD format or null if invalid
 * 
 * @example
 * parseDateString("2025-01-15") // "2025-01-15"
 * parseDateString("15/01/2025") // "2025-01-15"
 * parseDateString("JANUARY 15, 2025") // "2025-01-15"
 * parseDateString("invalid") // null
 */
function parseDateString(dateStr) {
  if (!dateStr) return null;
  
  const cleaned = dateStr.trim().toUpperCase();
  
  // Format 1: YYYY-MM-DD (already correct)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Format 2: DD/MM/YYYY
  const ddmmyyyyMatch = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month}-${day}`;
  }
  
  // Format 3: "MONTH DD, YYYY" or "MONTH DD YYYY"
  const monthNames = {
    'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04',
    'MAY': '05', 'JUNE': '06', 'JULY': '07', 'AUGUST': '08',
    'SEPTEMBER': '09', 'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12',
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
    'JUN': '06', 'JUL': '07', 'AUG': '08', 'SEP': '09',
    'OCT': '10', 'NOV': '11', 'DEC': '12'
  };
  
  const monthTextMatch = cleaned.match(/^([A-Z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthTextMatch) {
    const [, monthName, day, year] = monthTextMatch;
    const month = monthNames[monthName];
    
    if (month) {
      const paddedDay = day.padStart(2, '0');
      return `${year}-${month}-${paddedDay}`;
    }
  }
  
  // Format 4: Try parsing with Date constructor as fallback
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Invalid date
  }
  
  return null;
}
