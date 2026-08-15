/**
 * ExtractBLWithGemini Use Case - Core Layer
 *
 * Orchestrates BL extraction using Gemini AI with fallback to rule-based extraction.
 *
 * @module core/use-cases/extract-bl-with-gemini
 */

import { extractBLFields } from '../services/bl-extractor.service.js';

/**
 * Creates the ExtractBLWithGemini use case
 * @param {Object} geminiGateway - Gemini API gateway
 * @param {Object} usageTracker - Usage tracking service
 * @returns {{ execute: (text: string, pdfFile?: File) => Promise<Object> }}
 */
export function createExtractBLWithGeminiUseCase(geminiGateway, usageTracker) {
  async function execute(text, pdfFile = null) {
    const canExtractResult = await usageTracker.canExtract();

    if (!canExtractResult.ok) {
      return { ok: false, error: canExtractResult.error };
    }

    const geminiAvailable = isGeminiAvailable(geminiGateway);

    if (!geminiAvailable) {
      return await fallbackToRuleBased(text);
    }

    const geminiResult = await attemptGeminiExtraction(text, geminiGateway, pdfFile);

    if (geminiResult.ok) {
      await usageTracker.incrementUsage();
      return geminiResult;
    }

    const errorCode = geminiResult.error?.code;

    if (errorCode === 'DAILY_LIMIT_REACHED') {
      return geminiResult;
    }

    return await fallbackToRuleBased(text);
  }

  return { execute };
}

async function attemptGeminiExtraction(text, geminiGateway, pdfFile = null) {
  try {
    return await geminiGateway.extractFromText(text, pdfFile);
  } catch (error) {
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

async function fallbackToRuleBased(text) {
  try {
    const ruleBasedResult = extractBLFields(text);
    return { ok: true, data: convertRuleBasedResult(ruleBasedResult) };
  } catch (error) {
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

function isGeminiAvailable(geminiGateway) {
  return geminiGateway && typeof geminiGateway.extractFromText === 'function';
}

function calculateOverallConfidence(scores) {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}
