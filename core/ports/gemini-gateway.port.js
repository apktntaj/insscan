/**
 * Gemini Gateway Port - Core Layer
 * 
 * Defines the interface for Gemini AI extraction service.
 * This port is implemented by the GeminiService in the infrastructure layer.
 * 
 * @module core/ports/gemini-gateway
 */

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
 * Gemini Gateway Interface
 * 
 * Extracts Bill of Lading data from PDF text using AI.
 * 
 * @typedef {Object} GeminiGateway
 * @property {(text: string) => Promise<GeminiExtractionResult>} extractFromText - Extracts BL fields from text
 */

// This is a port interface - no implementation here
// Implementation is provided by infrastructure/services/gemini.service.js
