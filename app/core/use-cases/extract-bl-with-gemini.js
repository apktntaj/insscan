/**
 * ExtractBLWithGemini Use Case - Core Layer
 * 
 * Orchestrates BL extraction using Gemini AI with fallback to rule-based extraction.
 * Implements the extraction workflow with usage tracking and error handling.
 * 
 * @module core/use-cases/extract-bl-with-gemini
 */

import { extractBLFields } from '../services/bl-extractor.service.js';

/**
 * @typedef {import('../ports/gemini-gateway.port.js').GeminiGateway} GeminiGateway
 * @typedef {import('../ports/gemini-gateway.port.js').GeminiExtractionResult} GeminiExtractionResult
 * @typedef {import('../ports/gemini-gateway.port.js').ExtractionData} ExtractionData
 */

/**
 * Creates the ExtractBLWithGemini use case
 * @param {GeminiGateway} geminiGateway - Gemini API gateway
 * @param {Object} usageTracker - Usage tracking service
 * @returns {{ execute: (text: string) => Promise<GeminiExtractionResult> }}
 */
export function createExtractBLWithGeminiUseCase(geminiGateway, usageTracker) {
  /**
   * Executes BL extraction with Gemini (with fallback)
   * @param {string} text - PDF text content
   * @param {File} [pdfFile] - Optional PDF file for direct processing
   * @returns {Promise<GeminiExtractionResult>}
   */
  async function execute(text, pdfFile = null) {
    console.log('[ExtractBLWithGemini] ========== STARTING EXTRACTION ==========');
    console.log('[ExtractBLWithGemini] Text length:', text.length);
    console.log('[ExtractBLWithGemini] Has PDF file:', !!pdfFile);
    
    // Check daily usage limit
    const canExtractResult = await usageTracker.canExtract();
    console.log('[ExtractBLWithGemini] Usage check:', canExtractResult);
    
    if (!canExtractResult.ok) {
      console.log('[ExtractBLWithGemini] Daily limit reached');
      return {
        ok: false,
        error: canExtractResult.error
      };
    }

    // Check if Gemini is available
    const geminiAvailable = isGeminiAvailable(geminiGateway);
    console.log('[ExtractBLWithGemini] Gemini available:', geminiAvailable);
    
    if (!geminiAvailable) {
      logExtractionMethod('rule-based', 'Gemini not configured');
      return await fallbackToRuleBased(text);
    }

    // Attempt Gemini extraction
    console.log('[ExtractBLWithGemini] Attempting Gemini extraction...');
    const geminiResult = await attemptGeminiExtraction(text, geminiGateway, pdfFile);
    
    console.log('[ExtractBLWithGemini] Gemini result:', {
      ok: geminiResult.ok,
      error: geminiResult.error?.code,
      method: geminiResult.data?.extractionMethod
    });

    // If Gemini succeeded, increment usage and return
    if (geminiResult.ok) {
      await usageTracker.incrementUsage();
      logExtractionMethod('gemini', 'Success');
      console.log('[ExtractBLWithGemini] ========== EXTRACTION COMPLETE (GEMINI) ==========');
      return geminiResult;
    }

    // If Gemini failed, fall back to rule-based
    const errorCode = geminiResult.error?.code;
    logExtractionMethod('rule-based', `Gemini failed: ${errorCode}`);

    // For certain errors, don't fall back - return error directly
    if (errorCode === 'DAILY_LIMIT_REACHED') {
      return geminiResult;
    }

    // Fall back to rule-based extraction
    console.log('[ExtractBLWithGemini] Falling back to rule-based...');
    const fallbackResult = await fallbackToRuleBased(text);
    console.log('[ExtractBLWithGemini] ========== EXTRACTION COMPLETE (FALLBACK) ==========');
    return fallbackResult;
  }

  return { execute };
}

/**
 * Attempts Gemini extraction with timeout
 * @param {string} text - PDF text content
 * @param {GeminiGateway} geminiGateway - Gemini API gateway
 * @param {File} [pdfFile] - Optional PDF file
 * @returns {Promise<GeminiExtractionResult>}
 */
async function attemptGeminiExtraction(text, geminiGateway, pdfFile = null) {
  try {
    console.log('[ExtractBLWithGemini] Attempting Gemini extraction...');
    const result = await geminiGateway.extractFromText(text, pdfFile);
    return result;
  } catch (error) {
    console.error('[ExtractBLWithGemini] Gemini extraction error:', error);
    return {
      ok: false,
      error: {
        code: 'API_ERROR',
        message: 'Koneksi terputus. Coba lagi atau isi manual ya.',
        technicalDetails: error.message
      }
    };
  }
}

/**
 * Falls back to rule-based extraction
 * @param {string} text - PDF text content
 * @returns {Promise<GeminiExtractionResult>}
 */
async function fallbackToRuleBased(text) {
  try {
    console.log('[ExtractBLWithGemini] Falling back to rule-based extraction...');
    const ruleBasedResult = extractBLFields(text);
    const converted = convertRuleBasedResult(ruleBasedResult);

    return {
      ok: true,
      data: converted
    };
  } catch (error) {
    console.error('[ExtractBLWithGemini] Rule-based extraction error:', error);
    return {
      ok: false,
      error: {
        code: 'API_ERROR',
        message: 'File tidak bisa dibaca. Coba file lain atau isi manual.',
        technicalDetails: error.message
      }
    };
  }
}

/**
 * Converts rule-based ExtractionResult to GeminiExtractionResult format
 * @param {import('../services/bl-extractor.service.js').ExtractionResult} ruleBasedResult
 * @returns {ExtractionData}
 */
function convertRuleBasedResult(ruleBasedResult) {
  return {
    blNumber: ruleBasedResult.blNumber,
    shipperName: ruleBasedResult.shipperName,
    consigneeName: ruleBasedResult.consigneeName,
    vesselName: ruleBasedResult.vesselName,
    voyage: ruleBasedResult.voyage,
    portOfLoading: ruleBasedResult.portOfLoading,
    portOfDischarge: ruleBasedResult.portOfDischarge,
    eta: ruleBasedResult.eta,
    overallConfidence: ruleBasedResult.overallConfidence,
    foundFieldsCount: ruleBasedResult.foundFieldsCount,
    extractionMethod: 'rule-based'
  };
}

/**
 * Determines if Gemini is available
 * @param {GeminiGateway} geminiGateway
 * @returns {boolean}
 */
function isGeminiAvailable(geminiGateway) {
  return geminiGateway && typeof geminiGateway.extractFromText === 'function';
}

/**
 * Logs extraction method used
 * @param {string} method - "gemini" or "rule-based"
 * @param {string} reason - Why this method was used
 * @returns {void}
 */
function logExtractionMethod(method, reason) {
  console.log('[ExtractBLWithGemini] Extraction method:', {
    method,
    reason
  });
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
