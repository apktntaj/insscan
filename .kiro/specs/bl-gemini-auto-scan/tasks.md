# Implementation Plan: BL Gemini Auto-Scan

## Overview

This implementation plan converts the BL Gemini Auto-Scan feature design into actionable coding tasks. The feature integrates Google's Gemini AI SDK to automatically extract shipment data from Bill of Lading PDFs, replacing the existing rule-based pattern matching system with AI-powered extraction.

The implementation follows Clean Architecture principles with clear separation between core business logic, adapters, infrastructure services, and presentation components. The system includes a fallback strategy to rule-based extraction when Gemini is unavailable, ensuring graceful degradation.

## Tasks

- [x] 1. Set up Gemini SDK and environment configuration
  - Install `@google/generative-ai` package via npm
  - Add `GEMINI_API_KEY` to `.env.example` with documentation comment
  - Verify `.env` is in `.gitignore` to prevent credential leakage
  - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4_

- [x] 2. Implement GeminiService (Infrastructure Layer)
  - [x] 2.1 Create GeminiService with API client initialization
    - Create file `app/infrastructure/services/gemini.service.js`
    - Implement `createGeminiService(apiKey)` factory function
    - Initialize Gemini API client with API key from environment
    - Return GeminiGateway port interface implementation
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Implement structured prompt builder
    - Implement `buildExtractionPrompt(text)` function
    - Include all 8 required field names and expected formats
    - Specify JSON response format with data and confidence objects
    - Include instruction to return null for missing fields
    - Specify date format as YYYY-MM-DD for eta field
    - Add examples of valid BL formats in prompt
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 2.3 Implement extractFromText with timeout and error handling
    - Implement `extractFromText(text)` async function
    - Send structured prompt to Gemini API with 10-second timeout
    - Handle timeout errors and return error with code "TIMEOUT"
    - Handle missing/invalid API key and return error with code "INVALID_API_KEY"
    - Handle API failures and return error with failure reason
    - Handle rate limit errors and return error with code "RATE_LIMIT_EXCEEDED"
    - _Requirements: 1.3, 1.5, 1.6, 1.7, 10.5_

  - [x] 2.4 Implement response parsing and validation
    - Implement `parseGeminiResponse(response)` function
    - Parse JSON response into ExtractionData structure
    - Return error with code "INVALID_RESPONSE_FORMAT" for invalid JSON
    - Set missing fields to null with confidence 0
    - Validate confidence scores are numeric values between 0 and 1
    - Default invalid confidence scores to 0.5
    - Validate eta field matches YYYY-MM-DD format if present
    - Set eta to null if format is invalid
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 2.5 Implement helper functions
    - Implement `normalizeConfidence(value)` to clamp values to [0, 1] range
    - Implement `validateEtaFormat(eta)` to validate and normalize date format
    - Implement `isValidApiKey(apiKey)` to validate API key format
    - Implement `sanitizeText(text)` to clean PDF text before sending to API
    - _Requirements: 4.5, 4.6, 4.7, 4.8_

  - [ ]* 2.6 Write unit tests for GeminiService
    - Test API client initialization with valid and invalid API keys
    - Test prompt builder includes all required fields and instructions
    - Test extractFromText handles timeout, invalid key, and API errors
    - Test parseGeminiResponse handles valid and malformed JSON
    - Test normalizeConfidence clamps values correctly
    - Test validateEtaFormat handles various date formats
    - _Requirements: 12.1, 12.6_

- [x] 3. Implement UsageTrackerService (Infrastructure Layer)
  - [x] 3.1 Create UsageTrackerService with localStorage integration
    - Create file `app/infrastructure/services/usage-tracker.service.js`
    - Implement `canExtract()` to check if user can extract today
    - Implement `incrementUsage()` to increment daily count
    - Implement `getUsageData()` to retrieve current usage data
    - Implement `resetUsage()` to reset count at midnight
    - Implement `getTodayDate()` to get current date in YYYY-MM-DD format (WIB timezone)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.6_

  - [x] 3.2 Implement usage limit enforcement
    - Check usage count is less than 5 before allowing extraction
    - Return error with code "DAILY_LIMIT_REACHED" when limit reached
    - Increment count only after successful extraction, not on failures
    - Reset count to 0 at midnight local time (00:00 WIB)
    - _Requirements: 13.4, 13.5, 13.6, 13.7_

  - [x] 3.3 Implement helper functions
    - Implement `loadUsageData()` to load from localStorage
    - Implement `saveUsageData(data)` to save to localStorage
    - Implement `isToday(date)` to check if date is today
    - Implement `timeUntilMidnight()` to calculate milliseconds until reset
    - _Requirements: 13.1, 13.2, 13.6_

  - [ ]* 3.4 Write unit tests for UsageTrackerService
    - Test canExtract allows extraction when count < 5
    - Test canExtract blocks extraction when count = 5
    - Test incrementUsage increments count correctly
    - Test resetUsage resets count to 0
    - Test date change triggers reset
    - _Requirements: 12.1, 13.4, 13.7_

- [x] 4. Checkpoint - Ensure infrastructure services are working
  - Run all unit tests for GeminiService and UsageTrackerService
  - Verify API key is read from environment correctly
  - Verify localStorage operations work in browser environment
  - Ask the user if questions arise

- [x] 5. Implement ExtractBLWithGemini use case (Core Layer)
  - [x] 5.1 Create GeminiGateway port interface
    - Create file `app/core/ports/gemini-gateway.port.js`
    - Define GeminiGateway interface with extractFromText method
    - Document expected input (text string) and output (GeminiExtractionResult)
    - _Requirements: 1.3, 1.4_

  - [x] 5.2 Implement ExtractBLWithGemini use case with fallback logic
    - Create file `app/core/use-cases/extract-bl-with-gemini.js`
    - Implement `createExtractBLWithGeminiUseCase(geminiGateway, usageTracker)` factory
    - Implement `execute(text)` to orchestrate extraction workflow
    - Check daily usage limit before attempting extraction
    - Attempt Gemini extraction with timeout
    - Fall back to rule-based extraction on Gemini failure
    - Fall back to rule-based extraction when API key is missing
    - Fall back to rule-based extraction on API timeout
    - Log which extraction method was used for debugging
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.3 Implement helper functions for use case
    - Implement `attemptGeminiExtraction(text)` with timeout handling
    - Implement `fallbackToRuleBased(text)` using existing BLExtractorService
    - Implement `convertRuleBasedResult(ruleBasedResult)` to convert to GeminiExtractionResult format
    - Implement `isGeminiAvailable()` to check if Gemini is configured
    - Implement `logExtractionMethod(method, reason)` for debugging
    - Implement `calculateOverallConfidence(scores)` to compute average confidence
    - _Requirements: 2.4, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 5.4 Write unit tests for ExtractBLWithGemini use case
    - Test execute calls Gemini when API key is configured
    - Test execute falls back to rule-based when Gemini fails
    - Test execute falls back to rule-based when API key is missing
    - Test execute falls back to rule-based on timeout
    - Test execute checks usage limit before extraction
    - Test execute returns error when daily limit reached
    - Test calculateOverallConfidence computes correct average
    - _Requirements: 12.2, 12.6, 12.7_

- [x] 6. Enhance FormFillerService (Adapters Layer)
  - [x] 6.1 Add Gemini extraction result transformation
    - Open file `app/adapters/services/form-filler.service.js`
    - Implement `toFormDataFromGemini(extraction)` function
    - Map extraction field names to form field names
    - Convert null values to empty strings for form compatibility
    - Attach confidence scores to `_confidenceScores` metadata field
    - Set `_isAutoFilled` flag to true
    - Set `_extractionMethod` to match input extraction method
    - _Requirements: 5.7_

  - [x] 6.2 Implement helper functions
    - Implement `mapFieldNames(extraction)` to map field names
    - Implement `nullToEmptyString(fields)` to convert nulls
    - _Requirements: 5.7_

  - [ ]* 6.3 Write unit tests for FormFillerService enhancements
    - Test toFormDataFromGemini maps all fields correctly
    - Test toFormDataFromGemini converts null to empty string
    - Test toFormDataFromGemini preserves confidence scores
    - Test toFormDataFromGemini sets _isAutoFilled to true
    - Test toFormDataFromGemini sets _extractionMethod correctly
    - _Requirements: 12.1_

- [x] 7. Checkpoint - Ensure core logic and adapters are working
  - Run all unit tests for use case and adapters
  - Verify fallback logic works correctly
  - Verify data transformation produces correct form data
  - Ask the user if questions arise

- [x] 8. Enhance ShipmentFormWithPDF component (Presentation Layer)
  - [x] 8.1 Add auto-extraction trigger on PDF upload
    - Open file `app/presentation/components/features/ShipmentFormWithPDF.jsx`
    - Add state for extraction loading indicator
    - Add state for extraction method used (gemini vs rule-based)
    - Add state for remaining daily upload count
    - Trigger ExtractBLWithGemini use case when PDF is uploaded in auto-fill mode
    - Display loading indicator while extraction is in progress
    - _Requirements: 5.1, 5.2_

  - [x] 8.2 Handle extraction success and failure
    - Open Shipment_Form with extracted data when extraction succeeds
    - Display error message and switch to Click_To_Copy_Mode when extraction fails
    - Display warning and switch to Click_To_Copy_Mode when zero fields extracted
    - Pass ExtractionResult to FormFillerService for transformation
    - Display which extraction method was used in status message
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 6.5_

  - [x] 8.3 Implement error message display in Bahasa Indonesia
    - Display "Ada masalah dengan sistem. Silakan hubungi admin." for missing API key
    - Display "Koneksi terputus. Coba lagi atau isi manual ya." for API timeout
    - Display "File tidak bisa dibaca. Coba file lain atau isi manual." for invalid PDF
    - Display "Data berhasil diambil. Tolong cek lagi ya, mungkin ada yang kurang tepat." for low confidence (< 0.5)
    - Display "Berhasil! Form akan terbuka otomatis." for high confidence (≥ 0.5)
    - Display "Batas harian tercapai (5 BL per hari). Coba lagi besok ya." for daily limit reached
    - Log technical error details for debugging without displaying to users
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 8.4 Add daily usage limit display
    - Display remaining upload count below upload button (e.g., "Sisa upload hari ini: 3/5")
    - Check usage limit before allowing PDF upload
    - Block upload and display error message when limit reached
    - _Requirements: 13.8_

- [x] 9. Enhance ShipmentForm component (Presentation Layer)
  - [x] 9.1 Add confidence indicator display
    - Open file `app/presentation/components/features/ShipmentForm.jsx`
    - Display confidence indicator for each auto-filled field
    - Highlight fields with confidence < 0.5 in yellow
    - Highlight fields with confidence < 0.3 in red
    - Display fields with confidence ≥ 0.5 normally
    - Display overall confidence score at top of form
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 9.2 Add confidence tooltip
    - Display tooltip explaining confidence scores when hovering over indicators
    - Include explanation in Bahasa Indonesia
    - _Requirements: 9.6_

- [x] 10. Checkpoint - Ensure UI components are working
  - Test PDF upload triggers extraction
  - Test loading indicator displays during extraction
  - Test error messages display correctly in Bahasa Indonesia
  - Test confidence indicators display correctly
  - Test daily usage limit display and enforcement
  - Ask the user if questions arise

- [ ] 11. Implement property-based tests for correctness properties
  - [ ]* 11.1 Write property test for response parsing robustness
    - **Property 1: Response Parsing Robustness**
    - **Validates: Requirements 1.4, 4.1, 4.2, 4.3**
    - Use fast-check to generate various JSON structures (valid and malformed)
    - Verify parseGeminiResponse returns valid ExtractionData or error
    - Verify all 8 required fields are present in successful results
    - Run minimum 100 iterations

  - [ ]* 11.2 Write property test for missing field normalization
    - **Property 2: Missing Field Normalization**
    - **Validates: Requirements 2.2, 4.4**
    - Use fast-check to generate extraction results with random subsets of fields
    - Verify all missing fields are set to null with confidence 0
    - Verify result always contains all 8 required fields
    - Run minimum 100 iterations

  - [ ]* 11.3 Write property test for confidence score normalization
    - **Property 3: Confidence Score Normalization**
    - **Validates: Requirements 2.3, 4.5, 4.6**
    - Use fast-check to generate any value (negative, > 1, non-numeric, null, undefined)
    - Verify normalizeConfidence returns numeric value in [0, 1]
    - Verify invalid values default to 0.5
    - Run minimum 100 iterations

  - [ ]* 11.4 Write property test for overall confidence calculation
    - **Property 4: Overall Confidence Calculation**
    - **Validates: Requirements 2.4**
    - Use fast-check to generate sets of field confidence scores
    - Verify calculated overall confidence equals arithmetic mean
    - Verify result is in range [0, 1]
    - Run minimum 100 iterations

  - [ ]* 11.5 Write property test for found fields count accuracy
    - **Property 5: Found Fields Count Accuracy**
    - **Validates: Requirements 2.5**
    - Use fast-check to generate extraction results with random non-null fields
    - Verify foundFieldsCount equals number of non-null values
    - Verify count is in range [0, 8]
    - Run minimum 100 iterations

  - [ ]* 11.6 Write property test for date validation and normalization
    - **Property 6: Date Validation and Normalization**
    - **Validates: Requirements 4.7, 4.8**
    - Use fast-check to generate various date strings (valid and invalid formats)
    - Verify validateEtaFormat returns YYYY-MM-DD or null
    - Verify valid dates in DD-MM-YYYY or DD/MM/YYYY are normalized
    - Verify invalid dates return null
    - Run minimum 100 iterations

  - [ ]* 11.7 Write property test for extraction to form data transformation
    - **Property 7: Extraction to Form Data Transformation**
    - **Validates: Requirements 5.7**
    - Use fast-check to generate valid ExtractionData structures
    - Verify toFormDataFromGemini produces valid FormData
    - Verify field names are correctly mapped
    - Verify null values converted to empty strings
    - Verify confidence scores preserved in _confidenceScores
    - Verify _isAutoFilled is true and _extractionMethod matches input
    - Run minimum 100 iterations

  - [ ]* 11.8 Write property test for usage tracking invariants
    - **Property 8: Usage Tracking Invariants**
    - **Validates: Requirements 13.1, 13.4, 13.7**
    - Use fast-check to generate sequences of extraction attempts (success/failure)
    - Verify usage count always in range [0, 5]
    - Verify count increments only on success
    - Verify extraction allowed when count < 5
    - Verify extraction blocked when count = 5
    - Verify count resets when date changes
    - Run minimum 100 iterations

- [ ] 12. Checkpoint - Ensure property-based tests pass
  - Run all 8 property-based tests
  - Verify each test runs minimum 100 iterations
  - Fix any property violations discovered
  - Ask the user if questions arise

- [ ] 13. Implement integration tests with mock Gemini API
  - [ ]* 13.1 Set up mock Gemini API server
    - Create mock server that simulates Gemini API responses
    - Support successful extraction responses
    - Support error responses (timeout, rate limit, invalid response)
    - _Requirements: 12.1_

  - [ ]* 13.2 Write integration test for successful Gemini extraction flow
    - Test PDF upload → Gemini extraction → form data transformation
    - Verify all 8 fields extracted correctly
    - Verify confidence scores calculated correctly
    - Verify extraction method is "gemini"
    - _Requirements: 12.2, 12.4_

  - [ ]* 13.3 Write integration test for Gemini failure → fallback flow
    - Test Gemini timeout triggers fallback to rule-based extraction
    - Test Gemini API error triggers fallback to rule-based extraction
    - Test missing API key triggers fallback to rule-based extraction
    - Verify extraction method is "rule-based" after fallback
    - _Requirements: 12.2, 12.7_

  - [ ]* 13.4 Write integration test for daily limit enforcement
    - Test usage count increments after successful extraction
    - Test usage count does not increment after failed extraction
    - Test extraction blocked when count reaches 5
    - Test error message displayed when limit reached
    - _Requirements: 12.1_

  - [ ]* 13.5 Write integration test for rate limiting
    - Test requests are limited to 1 per second
    - Test requests are queued when made within 1 second
    - _Requirements: 12.1_

- [ ] 14. Implement end-to-end tests with real PDF samples
  - [ ]* 14.1 Create test PDF fixtures
    - Create `test/fixtures/bl-standard.pdf` (clear labels, single-line fields)
    - Create `test/fixtures/bl-table-based.pdf` (fields in table cells)
    - Create `test/fixtures/bl-multiline.pdf` (addresses spanning multiple lines)
    - Create `test/fixtures/bl-minimal.pdf` (missing optional fields)
    - Create `test/fixtures/bl-malformed.pdf` (poor OCR quality, missing labels)
    - _Requirements: 12.3_

  - [ ]* 14.2 Write end-to-end test for standard BL format
    - Test upload bl-standard.pdf → extraction → form display → save
    - Verify all 8 fields extracted correctly
    - Verify high confidence scores (≥ 0.5)
    - Verify success message displayed
    - _Requirements: 12.3, 12.4_

  - [ ]* 14.3 Write end-to-end test for table-based BL format
    - Test upload bl-table-based.pdf → extraction → form display
    - Verify fields extracted from table cells
    - _Requirements: 12.3, 12.4_

  - [ ]* 14.4 Write end-to-end test for multi-line BL format
    - Test upload bl-multiline.pdf → extraction → form display
    - Verify multi-line addresses extracted correctly
    - _Requirements: 12.3, 12.4_

  - [ ]* 14.5 Write end-to-end test for minimal BL format
    - Test upload bl-minimal.pdf → extraction → form display
    - Verify missing fields set to null
    - Verify low foundFieldsCount
    - _Requirements: 12.3, 12.4_

  - [ ]* 14.6 Write end-to-end test for malformed BL format
    - Test upload bl-malformed.pdf → extraction → fallback → form display
    - Verify fallback to rule-based extraction
    - Verify low confidence warning displayed
    - _Requirements: 12.3, 12.4_

  - [ ]* 14.7 Write end-to-end test for low confidence warning
    - Test extraction with overall confidence < 0.5
    - Verify warning message displayed in Bahasa Indonesia
    - Verify yellow/red highlights on low-confidence fields
    - _Requirements: 12.4_

  - [ ]* 14.8 Write end-to-end test for daily limit reached
    - Test 5 successful extractions in same day
    - Test 6th extraction blocked with error message
    - Verify countdown to reset displayed
    - _Requirements: 12.4_

- [ ] 15. Final checkpoint - Ensure all tests pass and feature is complete
  - Run complete test suite (unit + property + integration + e2e)
  - Verify test coverage > 80% for core and adapters layers
  - Verify all 8 correctness properties pass
  - Verify all error codes have test coverage
  - Verify all 5 BL formats tested
  - Test feature manually in browser with real PDF
  - Ask the user if questions arise

- [x] 16. Add monitoring and logging
  - [x] 16.1 Implement extraction metrics logging
    - Log extraction success rate (Gemini vs rule-based)
    - Log average confidence scores
    - Log API response times
    - Log fallback frequency
    - Log error frequency by error code
    - Never log extracted field values (PII protection)
    - _Requirements: 11.2, 11.3_

  - [x] 16.2 Implement API request logging
    - Log each API request with timestamp
    - Log request metadata (file size, page count)
    - Never log API key or extracted values
    - _Requirements: 10.3, 10.4, 11.5_

- [x] 17. Documentation and cleanup
  - [x] 17.1 Update README with Gemini integration instructions
    - Document how to obtain Gemini API key
    - Document environment variable setup
    - Document daily usage limits
    - Document fallback behavior

  - [x] 17.2 Add inline code documentation
    - Add JSDoc comments to all exported functions
    - Document data shapes with @typedef
    - Document error codes and their meanings
    - Add examples for complex functions

  - [x] 17.3 Clean up temporary files and debug code
    - Remove console.log statements used during development
    - Remove commented-out code
    - Verify no API keys or sensitive data in code

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across many generated inputs
- Unit tests validate specific examples and edge cases
- Integration tests verify component interactions with mocked external services
- End-to-end tests verify complete user workflows with real PDF samples
- All user-facing messages must be in Bahasa Indonesia
- Never log extracted field values (PII protection)
- API key must never be exposed in client-side code or logs
- Fallback chain: Gemini → Rule-based → Manual clipboard mode
