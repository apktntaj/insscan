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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  return {
    extractFromText: async (text, pdfFile = null) => {
      try {
        await waitForRateLimit();

        const requestStartTime = Date.now();
        let result;

        if (pdfFile) {
          const arrayBuffer = await pdfFile.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          );

          const prompt = buildExtractionPrompt('');

          result = await Promise.race([
            model.generateContent([
              { inlineData: { mimeType: 'application/pdf', data: base64 } },
              { text: prompt }
            ]),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('TIMEOUT')), 10000)
            )
          ]);
        } else {
          const sanitizedText = sanitizeText(text);
          const prompt = buildExtractionPrompt(sanitizedText);

          result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('TIMEOUT')), 10000)
            )
          ]);
        }

        const response = await result.response;
        const responseText = response.text();
        const parsed = parseGeminiResponse(responseText);

        return parsed;

      } catch (error) {
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

function isValidApiKey(apiKey) {
  return typeof apiKey === 'string' && apiKey.length > 10;
}

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\s+/g, ' ').trim().substring(0, 50000);
}

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

function parseGeminiResponse(responseText) {
  try {
    let jsonText = responseText.trim();

    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const response = JSON.parse(jsonText);

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

    const fieldNames = [
      'blNumber', 'shipperName', 'consigneeName', 'vesselName',
      'voyage', 'portOfLoading', 'portOfDischarge', 'eta'
    ];

    const extractionData = {};
    const confidenceScores = {};

    for (const fieldName of fieldNames) {
      const value = response.data[fieldName];
      const confidence = response.confidence[fieldName];
      const normalizedValue = (value === null || value === undefined || value === '') ? null : String(value);
      const normalizedConfidence = normalizeConfidence(confidence);

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

    const overallConfidence = calculateOverallConfidence(confidenceScores);
    const foundFieldsCount = fieldNames.filter(name => extractionData[name].value !== null).length;

    return {
      ok: true,
      data: { ...extractionData, overallConfidence, foundFieldsCount, extractionMethod: 'gemini' }
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

function normalizeConfidence(value) {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) return 0.5;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function validateEtaFormat(eta) {
  if (!eta || typeof eta !== 'string') return null;

  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  ];

  for (let i = 0; i < formats.length; i++) {
    const match = eta.match(formats[i]);
    if (match) {
      let year, month, day;
      if (i === 0) { [, year, month, day] = match; }
      else { [, day, month, year] = match; }

      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);

      if (yearNum < 1900 || yearNum > 2100) return null;
      if (monthNum < 1 || monthNum > 12) return null;
      if (dayNum < 1 || dayNum > 31) return null;

      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return null;
}

function calculateOverallConfidence(scores) {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}
