/**
 * Gemini Service - Infrastructure Layer
 * 
 * Communicates with Google Gemini API for Bill of Lading text extraction.
 * Implements the GeminiGateway port interface.
 * 
 * @module infrastructure/services/gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * @typedef {Object} ExtractedField
 * @property {string|null} value - Extracted value (null if not found)
 * @property {number} confidence - Confidence score 0-1
 * @property {string} [matchedPattern] - Pattern/method used (for debugging)
 */

/**
 * @typedef {Object} ExtractionData
 * @property {ExtractedField} blNumber
 * @property {ExtractedField} shipperName
 * @property {ExtractedField} consigneeName
 * @property {ExtractedField} vesselName
 * @property {ExtractedField} voyage
 * @property {ExtractedField} portOfLoading
 * @property {ExtractedField} portOfDischarge
 * @property {ExtractedField} eta
 * @property {number} overallConfidence - Average confidence (0-1)
 * @property {number} foundFieldsCount - Number of non-null fields
 * @property {"gemini" | "rule-based"} extractionMethod
 */

/**
 * @typedef {Object} ExtractionError
 * @property {string} code - Machine-readable error code
 * @property {string} message - User-facing message in Bahasa Indonesia
 * @property {string} [technicalDetails] - Technical details for logging
 */

/**
 * @typedef {Object} GeminiExtractionResult
 * @property {boolean} ok - Whether extraction succeeded
 * @property {ExtractionData} [data] - Extracted data (if ok=true)
 * @property {ExtractionError} [error] - Error details (if ok=false)
 */

/**
 * @typedef {Object} GeminiGateway
 * @property {(text: string) => Promise<GeminiExtractionResult>} extractFromText
 */

// Rate limiting state
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

/**
 * Creates Gemini API client
 * @param {string} apiKey - Gemini API key from environment
 * @returns {GeminiGateway}
 */
export function createGeminiService(apiKey) {
  // Validate API key
  if (!apiKey || !isValidApiKey(apiKey)) {
    return {
      extractFromText: async () => ({
        ok: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Ada masalah dengan sistem. Silakan hubungi admin.',
          technicalDetails: 'API key is missing or invalid'
        }
      })
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Use gemini-2.5-flash

  return {
    extractFromText: async (text, pdfFile = null) => {
      try {
        // Rate limiting
        await waitForRateLimit();

        // Log request
        const requestStartTime = Date.now();
        logApiRequest({
          timestamp: new Date().toISOString(),
          hasPdfFile: !!pdfFile,
          textLength: text?.length || 0
        });

        let result;

        // If PDF file is provided, use it directly for better accuracy
        if (pdfFile) {
          console.log('[Gemini] Using PDF file directly for extraction');
          
          // Convert PDF to base64
          const arrayBuffer = await pdfFile.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          );

          // Build prompt for PDF
          const prompt = buildExtractionPrompt('');

          // Make API call with PDF
          result = await Promise.race([
            model.generateContent([
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: base64
                }
              },
              { text: prompt }
            ]),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('TIMEOUT')), 10000)
            )
          ]);
        } else {
          // Fallback to text-only
          console.log('[Gemini] Using text extraction (fallback)');
          
          // Sanitize input
          const sanitizedText = sanitizeText(text);

          // Build prompt
          const prompt = buildExtractionPrompt(sanitizedText);

          // Make API call with timeout
          result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('TIMEOUT')), 10000)
            )
          ]);
        }

        const responseTime = Date.now() - requestStartTime;

        // Parse response
        const response = await result.response;
        const responseText = response.text();

        // Parse and validate
        const parsed = parseGeminiResponse(responseText);

        if (!parsed.ok) {
          return parsed;
        }

        // Log success with detailed field data
        console.log('[Gemini] ========== EXTRACTION COMPLETE ==========');
        console.log('[Gemini] Response Time:', responseTime, 'ms');
        console.log('[Gemini] Extraction Method: gemini');
        console.log('[Gemini] Overall Confidence:', parsed.data.overallConfidence);
        console.log('[Gemini] Found Fields Count:', parsed.data.foundFieldsCount);
        console.log('[Gemini] ========== EXTRACTED FIELDS ==========');
        console.log('[Gemini] BL Number:', parsed.data.blNumber);
        console.log('[Gemini] Shipper Name:', parsed.data.shipperName);
        console.log('[Gemini] Consignee Name:', parsed.data.consigneeName);
        console.log('[Gemini] Vessel Name:', parsed.data.vesselName);
        console.log('[Gemini] Voyage:', parsed.data.voyage);
        console.log('[Gemini] Port of Loading:', parsed.data.portOfLoading);
        console.log('[Gemini] Port of Discharge:', parsed.data.portOfDischarge);
        console.log('[Gemini] ETA:', parsed.data.eta);
        console.log('[Gemini] ========================================');

        return parsed;

      } catch (error) {
        // Handle timeout
        if (error.message === 'TIMEOUT') {
          return {
            ok: false,
            error: {
              code: 'TIMEOUT',
              message: 'Koneksi terputus. Coba lagi atau isi manual ya.',
              technicalDetails: 'API request exceeded 10 second timeout'
            }
          };
        }

        // Handle rate limit
        if (error.message?.includes('rate limit') || error.message?.includes('429')) {
          return {
            ok: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Terlalu banyak permintaan. Tunggu sebentar ya.',
              technicalDetails: error.message
            }
          };
        }

        // Log full error for debugging
        console.error('[Gemini] ========== API ERROR DETAILS ==========');
        console.error('[Gemini] Error name:', error.name);
        console.error('[Gemini] Error message:', error.message);
        console.error('[Gemini] Error stack:', error.stack);
        console.error('[Gemini] Full error object:', error);
        console.error('[Gemini] ==========================================');

        // Handle generic API error
        return {
          ok: false,
          error: {
            code: 'API_ERROR',
            message: 'Koneksi terputus. Coba lagi atau isi manual ya.',
            technicalDetails: `${error.name}: ${error.message}`
          }
        };
      }
    }
  };
}

/**
 * Validates API key format
 * @param {string} apiKey
 * @returns {boolean}
 */
function isValidApiKey(apiKey) {
  return typeof apiKey === 'string' && apiKey.length > 10;
}

/**
 * Implements rate limiting (1 req/sec)
 * @returns {Promise<void>}
 */
async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Logs API request for monitoring
 * @param {Object} metadata
 * @returns {void}
 */
function logApiRequest(metadata) {
  console.log('[Gemini] API request', metadata);
}

/**
 * Sanitizes PDF text before sending to API
 * @param {string} text
 * @returns {string}
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove excessive whitespace
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50000); // Limit to 50k characters
}

/**
 * Builds structured prompt for Gemini API
 * @param {string} text - PDF text content
 * @returns {string} - Formatted prompt with instructions and examples
 */
function buildExtractionPrompt(text) {
  return `You are a Bill of Lading (BL) data extraction assistant. Extract the following fields from the BL document text below. Return your response as JSON.

Required fields:
- blNumber: Bill of Lading number (e.g., "MAEU123456789")
- shipperName: Shipper company name (e.g., "PT MAJU JAYA")
- consigneeName: Consignee company name (e.g., "CV KARYA UTAMA")
- vesselName: Vessel/ship name (e.g., "EVER GIVEN")
- voyage: Voyage number (e.g., "123N")
- portOfLoading: Port of loading (e.g., "SINGAPORE")
- portOfDischarge: Port of discharge (e.g., "TANJUNG PRIOK")
- eta: Estimated time of arrival in YYYY-MM-DD format (e.g., "2025-02-15")

For each field, provide:
1. The extracted value (or null if not found)
2. A confidence score between 0 and 1

Response format:
{
  "data": {
    "blNumber": "...",
    "shipperName": "...",
    "consigneeName": "...",
    "vesselName": "...",
    "voyage": "...",
    "portOfLoading": "...",
    "portOfDischarge": "...",
    "eta": "..."
  },
  "confidence": {
    "blNumber": 0.95,
    "shipperName": 0.90,
    "consigneeName": 0.90,
    "vesselName": 0.92,
    "voyage": 0.88,
    "portOfLoading": 0.93,
    "portOfDischarge": 0.93,
    "eta": 0.85
  }
}

BL Document Text:
${text}`;
}

/**
 * Parses Gemini API JSON response into ExtractionData
 * @param {string} responseText - Raw API response text
 * @returns {GeminiExtractionResult}
 */
function parseGeminiResponse(responseText) {
  try {
    console.log('[Gemini] ========== RAW RESPONSE ==========');
    console.log('[Gemini] Response length:', responseText.length);
    console.log('[Gemini] Raw response:', responseText);
    console.log('[Gemini] =======================================');
    
    // Extract JSON from response (may be wrapped in markdown code blocks)
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    console.log('[Gemini] Cleaned JSON text:', jsonText);

    const response = JSON.parse(jsonText);
    
    console.log('[Gemini] Parsed JSON:', response);

    // Validate structure
    if (!response.data || !response.confidence) {
      return {
        ok: false,
        error: {
          code: 'INVALID_RESPONSE_FORMAT',
          message: 'File tidak bisa dibaca. Coba file lain atau isi manual.',
          technicalDetails: 'Response missing data or confidence fields'
        }
      };
    }

    // Required fields
    const fieldNames = [
      'blNumber',
      'shipperName',
      'consigneeName',
      'vesselName',
      'voyage',
      'portOfLoading',
      'portOfDischarge',
      'eta'
    ];

    // Build extraction data with validation
    const extractionData = {};
    const confidenceScores = {};

    for (const fieldName of fieldNames) {
      const value = response.data[fieldName];
      const confidence = response.confidence[fieldName];

      // Normalize value
      const normalizedValue = (value === null || value === undefined || value === '') ? null : String(value);

      // Normalize confidence
      const normalizedConfidence = normalizeConfidence(confidence);

      // Special handling for eta field
      if (fieldName === 'eta' && normalizedValue !== null) {
        const validatedEta = validateEtaFormat(normalizedValue);
        extractionData[fieldName] = {
          value: validatedEta,
          confidence: validatedEta === null ? 0 : normalizedConfidence
        };
      } else {
        extractionData[fieldName] = {
          value: normalizedValue,
          confidence: normalizedValue === null ? 0 : normalizedConfidence
        };
      }

      confidenceScores[fieldName] = extractionData[fieldName].confidence;
    }

    // Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(confidenceScores);

    // Count found fields
    const foundFieldsCount = fieldNames.filter(
      name => extractionData[name].value !== null
    ).length;

    return {
      ok: true,
      data: {
        ...extractionData,
        overallConfidence,
        foundFieldsCount,
        extractionMethod: 'gemini'
      }
    };

  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'INVALID_RESPONSE_FORMAT',
        message: 'File tidak bisa dibaca. Coba file lain atau isi manual.',
        technicalDetails: `JSON parse error: ${error.message}`
      }
    };
  }
}

/**
 * Normalizes confidence score to [0, 1] range
 * @param {unknown} value - Raw confidence value
 * @returns {number} - Clamped value between 0 and 1
 */
function normalizeConfidence(value) {
  // Handle invalid values
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return 0.5;
  }

  // Clamp to [0, 1]
  if (value < 0) return 0;
  if (value > 1) return 1;

  return value;
}

/**
 * Validates ETA date format (YYYY-MM-DD)
 * @param {string|null} eta - Date string
 * @returns {string|null} - Valid date or null
 */
function validateEtaFormat(eta) {
  if (!eta || typeof eta !== 'string') {
    return null;
  }

  // Try to parse various date formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/ // DD/MM/YYYY
  ];

  for (let i = 0; i < formats.length; i++) {
    const match = eta.match(formats[i]);
    if (match) {
      let year, month, day;

      if (i === 0) {
        // YYYY-MM-DD
        [, year, month, day] = match;
      } else {
        // DD-MM-YYYY or DD/MM/YYYY
        [, day, month, year] = match;
      }

      // Validate date components
      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);

      if (yearNum < 1900 || yearNum > 2100) return null;
      if (monthNum < 1 || monthNum > 12) return null;
      if (dayNum < 1 || dayNum > 31) return null;

      // Return in YYYY-MM-DD format
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Calculates overall confidence from field scores
 * @param {Object.<string, number>} scores
 * @returns {number}
 */
function calculateOverallConfidence(scores) {
  const values = Object.values(scores);
  if (values.length === 0) return 0;

  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;

  return Math.round(average * 100) / 100; // Round to 2 decimal places
}
