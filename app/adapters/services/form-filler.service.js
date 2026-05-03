/**
 * FormFillerService - Adapter Layer
 * 
 * Converts extraction results to form data format.
 * Maps extracted fields to ShipmentForm field names.
 */

/**
 * @typedef {Object} FormData
 * @property {string} blNumber
 * @property {string} shipperName
 * @property {string} consigneeName
 * @property {string} vesselName
 * @property {string} voyage
 * @property {string} portOfLoading
 * @property {string} portOfDischarge
 * @property {string} eta - YYYY-MM-DD format
 * @property {Object.<string, number>} _confidenceScores - Field confidence map
 * @property {boolean} _isAutoFilled - Flag indicating data source
 */

/**
 * Converts extraction result to form data.
 * Null values are converted to empty strings.
 * All values are already uppercase from extractor.
 * 
 * @param {import('../../core/services/bl-extractor.service').ExtractionResult} extraction
 * @returns {FormData}
 * 
 * @example
 * const formData = toFormData(extractionResult);
 * // {
 * //   blNumber: "MAEU123456789",
 * //   shipperName: "PT MAJU JAYA",
 * //   eta: "2025-01-15",
 * //   _confidenceScores: { blNumber: 0.95, shipperName: 0.85, ... },
 * //   _isAutoFilled: true
 * // }
 */
export function toFormData(extraction) {
  // Map extraction fields to form field names
  const formData = {
    blNumber: extraction.blNumber.value || '',
    shipperName: extraction.shipperName.value || '',
    consigneeName: extraction.consigneeName.value || '',
    vesselName: extraction.vesselName.value || '',
    voyage: extraction.voyage.value || '',
    portOfLoading: extraction.portOfLoading.value || '',
    portOfDischarge: extraction.portOfDischarge.value || '',
    eta: extraction.eta.value || '',
    
    // Metadata for confidence indicators
    _confidenceScores: {
      blNumber: extraction.blNumber.confidence,
      shipperName: extraction.shipperName.confidence,
      consigneeName: extraction.consigneeName.confidence,
      vesselName: extraction.vesselName.confidence,
      voyage: extraction.voyage.confidence,
      portOfLoading: extraction.portOfLoading.confidence,
      portOfDischarge: extraction.portOfDischarge.confidence,
      eta: extraction.eta.confidence
    },
    
    // Flag to indicate auto-filled data
    _isAutoFilled: true
  };
  
  return formData;
}
