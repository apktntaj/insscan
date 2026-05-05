# Design Document: BL Gemini Auto-Scan

## Overview

The BL Gemini Auto-Scan feature integrates Google's Gemini AI SDK to automatically extract shipment data from Bill of Lading (BL) PDF documents. This feature replaces the existing rule-based pattern matching extraction system with AI-powered extraction to improve accuracy across diverse BL formats.

### Architecture Approach

The design follows Clean Architecture principles with clear separation between:
- **Core Layer**: Business logic for extraction orchestration and data validation
- **Adapters Layer**: Data transformation between extraction results and form data
- **Infrastructure Layer**: External service integrations (Gemini API, browser storage)
- **Presentation Layer**: React components for PDF upload and form display

### Key Design Decisions

1. **Fallback Strategy**: Gemini extraction is primary, with rule-based extraction as fallback when API is unavailable
2. **Client-Side Processing**: All PDF parsing and data storage happens in the browser for data privacy
3. **Usage Tracking**: Daily limits (5 BL/day) enforced via browser localStorage to manage API costs
4. **Confidence Scoring**: Each extracted field includes a confidence score to guide user review
5. **Graceful Degradation**: System falls back to manual clipboard mode when extraction fails

## Architecture

### Layer Responsibilities

```
┌─────────────────────────────────────────────────────────┐
│ Presentation Layer                                       │
│ - ShipmentFormWithPDF (PDF viewer + form)              │
│ - ShipmentForm (displays extracted data)               │
│ - Confidence indicators (visual feedback)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Adapters Layer                                          │
│ - FormFillerService (extraction → form data)           │
│ - ShipmentController (orchestrates use case)           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Core Layer                                              │
│ - ExtractBLWithGemini use case (orchestration)         │
│ - BLExtractorService (rule-based fallback)             │
│ - Validation logic (confidence thresholds)             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Infrastructure Layer                                    │
│ - GeminiService (API client)                           │
│ - PDFParserService (text extraction)                   │
│ - UsageTrackerService (daily limits)                   │
│ - IndexedDBService (shipment persistence)              │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. User uploads PDF → PDFParserService extracts text
2. UsageTrackerService checks daily limit
3. ExtractBLWithGemini use case calls GeminiService
4. GeminiService sends text to Gemini API with structured prompt
5. Response parsed and validated → ExtractionResult
6. FormFillerService transforms to form data
7. ShipmentForm displays with confidence indicators
8. User reviews/edits → saves to IndexedDB

### Error Handling Strategy

- **Missing API Key**: Fall back to rule-based extraction immediately
- **API Timeout**: Fall back to rule-based extraction after 10s
- **Rate Limit**: Display user-friendly message, switch to manual mode
- **Invalid Response**: Fall back to rule-based extraction
- **Low Confidence**: Display warning, allow user to review/edit
- **Daily Limit Reached**: Block upload, display countdown to reset

## Components and Interfaces

### Core Layer

#### Port: GeminiGateway

```javascript
/**
 * @typedef {Object} GeminiGateway
 * @property {(text: string) => Promise<GeminiExtractionResult>} extractFromText
 */
```

#### Use Case: ExtractBLWithGemini

**Purpose**: Orchestrates BL extraction using Gemini with fallback to rule-based extraction

**Dependencies**:
- GeminiGateway (infrastructure)
- BLExtractorService (core, fallback)
- UsageTrackerService (infrastructure)

**Flow**:
1. Check daily usage limit
2. Attempt Gemini extraction
3. On failure, fall back to rule-based extraction
4. Validate and return result with metadata

### Adapters Layer

#### FormFillerService

**Purpose**: Transforms ExtractionResult to form-compatible data structure

**Input**: ExtractionResult (from core)
**Output**: FormData (for presentation)

**Responsibilities**:
- Map field names (extraction → form)
- Convert null values to empty strings
- Attach confidence scores as metadata
- Set auto-fill flag

### Infrastructure Layer

#### GeminiService

**Purpose**: Communicates with Google Gemini API for text extraction

**Configuration**:
- API Key from environment (GEMINI_API_KEY)
- Timeout: 10 seconds
- Rate limit: 1 request/second

**Responsibilities**:
- Send structured prompt to Gemini API
- Parse JSON response
- Validate response structure
- Handle API errors and timeouts

#### UsageTrackerService

**Purpose**: Tracks and enforces daily BL upload limits

**Storage**: localStorage
**Limit**: 5 extractions per day per browser
**Reset**: Midnight local time (00:00 WIB)

**Responsibilities**:
- Check current usage count
- Increment count on successful extraction
- Reset count at midnight
- Provide remaining count for UI display

### Presentation Layer

#### ShipmentFormWithPDF (Enhanced)

**New Responsibilities**:
- Trigger auto-extraction on PDF upload
- Display extraction progress indicator
- Show extraction method used (Gemini vs rule-based)
- Display remaining daily upload count
- Handle daily limit reached state

#### ShipmentForm (Enhanced)

**New Responsibilities**:
- Display confidence indicators per field
- Highlight low-confidence fields (yellow < 0.5, red < 0.3)
- Show overall confidence score
- Display tooltip explaining confidence scores

## Data Models

### Data Shapes

```javascript
/**
 * Result from Gemini API extraction
 * @typedef {Object} GeminiExtractionResult
 * @property {boolean} ok - Whether extraction succeeded
 * @property {ExtractionData} [data] - Extracted data (if ok=true)
 * @property {ExtractionError} [error] - Error details (if ok=false)
 */

/**
 * Extracted data from Gemini
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
 * Single extracted field with confidence
 * @typedef {Object} ExtractedField
 * @property {string|null} value - Extracted value (null if not found)
 * @property {number} confidence - Confidence score 0-1
 * @property {string} [matchedPattern] - Pattern/method used (for debugging)
 */

/**
 * Extraction error details
 * @typedef {Object} ExtractionError
 * @property {ErrorCode} code - Machine-readable error code
 * @property {string} message - User-facing message in Bahasa Indonesia
 * @property {string} [technicalDetails] - Technical details for logging
 */

/**
 * Error codes for extraction failures
 * @typedef {"MISSING_API_KEY" | "INVALID_API_KEY" | "TIMEOUT" | "RATE_LIMIT_EXCEEDED" | "INVALID_RESPONSE_FORMAT" | "API_ERROR" | "DAILY_LIMIT_REACHED"} ErrorCode
 */

/**
 * Form data with confidence metadata
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
 * @property {string} _extractionMethod - "gemini" or "rule-based"
 */

/**
 * Usage tracking data stored in localStorage
 * @typedef {Object} UsageData
 * @property {string} date - YYYY-MM-DD format
 * @property {number} count - Number of extractions today
 * @property {number} limit - Daily limit (5)
 */

/**
 * Gemini API request payload
 * @typedef {Object} GeminiRequest
 * @property {string} text - PDF text content
 * @property {string} prompt - Structured extraction prompt
 * @property {number} temperature - Randomness (0 = deterministic)
 * @property {number} maxTokens - Response length limit
 */

/**
 * Gemini API response (expected structure)
 * @typedef {Object} GeminiResponse
 * @property {Object} data - Extracted fields
 * @property {string} data.blNumber
 * @property {string} data.shipperName
 * @property {string} data.consigneeName
 * @property {string} data.vesselName
 * @property {string} data.voyage
 * @property {string} data.portOfLoading
 * @property {string} data.portOfDischarge
 * @property {string} data.eta
 * @property {Object} confidence - Confidence scores per field
 * @property {number} confidence.blNumber
 * @property {number} confidence.shipperName
 * @property {number} confidence.consigneeName
 * @property {number} confidence.vesselName
 * @property {number} confidence.voyage
 * @property {number} confidence.portOfLoading
 * @property {number} confidence.portOfDischarge
 * @property {number} confidence.eta
 */
```

### Data Invariants

1. **Confidence scores must be in range [0, 1]**
   - Enforced by: `normalizeConfidence()` in GeminiService
   - Invalid values default to 0.5

2. **ETA must be YYYY-MM-DD format if present**
   - Enforced by: `validateEtaFormat()` in GeminiService
   - Invalid dates set to null

3. **Usage count cannot exceed daily limit**
   - Enforced by: `canExtract()` in UsageTrackerService
   - Checked before extraction attempt

4. **Extraction method must be "gemini" or "rule-based"**
   - Enforced by: ExtractBLWithGemini use case
   - Set based on which service succeeded

## Function Contracts

### Infrastructure Layer

#### GeminiService

```javascript
/**
 * Creates Gemini API client
 * @param {string} apiKey - Gemini API key from environment
 * @returns {GeminiGateway}
 */
function createGeminiService(apiKey)

/**
 * Extracts BL fields from PDF text using Gemini API
 * @param {string} text - Raw text from PDF
 * @returns {Promise<GeminiExtractionResult>}
 */
async function extractFromText(text)

/**
 * Builds structured prompt for Gemini API
 * @param {string} text - PDF text content
 * @returns {string} - Formatted prompt with instructions and examples
 */
function buildExtractionPrompt(text)

/**
 * Parses Gemini API JSON response into ExtractionData
 * @param {unknown} response - Raw API response
 * @returns {{ ok: true, data: ExtractionData } | { ok: false, error: ExtractionError }}
 */
function parseGeminiResponse(response)

/**
 * Normalizes confidence score to [0, 1] range
 * @param {unknown} value - Raw confidence value
 * @returns {number} - Clamped value between 0 and 1
 */
function normalizeConfidence(value)

/**
 * Validates ETA date format (YYYY-MM-DD)
 * @param {string|null} eta - Date string
 * @returns {string|null} - Valid date or null
 */
function validateEtaFormat(eta)
```

#### UsageTrackerService

```javascript
/**
 * Checks if user can perform extraction today
 * @returns {Promise<{ ok: true, remaining: number } | { ok: false, error: ExtractionError }>}
 */
async function canExtract()

/**
 * Increments usage count for today
 * @returns {Promise<void>}
 */
async function incrementUsage()

/**
 * Gets current usage data for today
 * @returns {Promise<UsageData>}
 */
async function getUsageData()

/**
 * Resets usage count (called at midnight)
 * @returns {Promise<void>}
 */
async function resetUsage()

/**
 * Gets today's date in YYYY-MM-DD format (WIB timezone)
 * @returns {string}
 */
function getTodayDate()
```

### Core Layer

#### ExtractBLWithGemini Use Case

```javascript
/**
 * Creates the ExtractBLWithGemini use case
 * @param {GeminiGateway} geminiGateway
 * @param {UsageTrackerService} usageTracker
 * @returns {{ execute: (text: string) => Promise<GeminiExtractionResult> }}
 */
function createExtractBLWithGeminiUseCase(geminiGateway, usageTracker)

/**
 * Executes BL extraction with Gemini (with fallback)
 * @param {string} text - PDF text content
 * @returns {Promise<GeminiExtractionResult>}
 */
async function execute(text)

/**
 * Attempts Gemini extraction with timeout
 * @param {string} text - PDF text content
 * @returns {Promise<GeminiExtractionResult>}
 */
async function attemptGeminiExtraction(text)

/**
 * Falls back to rule-based extraction
 * @param {string} text - PDF text content
 * @returns {Promise<GeminiExtractionResult>}
 */
async function fallbackToRuleBased(text)

/**
 * Converts rule-based ExtractionResult to GeminiExtractionResult format
 * @param {import('./bl-extractor.service').ExtractionResult} ruleBasedResult
 * @returns {ExtractionData}
 */
function convertRuleBasedResult(ruleBasedResult)
```

### Adapters Layer

#### FormFillerService (Enhanced)

```javascript
/**
 * Converts GeminiExtractionResult to form data
 * @param {ExtractionData} extraction
 * @returns {FormData}
 */
function toFormDataFromGemini(extraction)

/**
 * Maps extraction field names to form field names
 * @param {ExtractionData} extraction
 * @returns {Object}
 */
function mapFieldNames(extraction)

/**
 * Converts null values to empty strings for form compatibility
 * @param {Object} fields
 * @returns {Object}
 */
function nullToEmptyString(fields)
```

## Wish List (Helper Functions)

### GeminiService Helpers

```javascript
/**
 * Validates API key format
 * @param {string} apiKey
 * @returns {boolean}
 */
function isValidApiKey(apiKey)

/**
 * Implements rate limiting (1 req/sec)
 * @returns {Promise<void>}
 */
async function waitForRateLimit()

/**
 * Logs API request for monitoring
 * @param {Object} metadata
 * @returns {void}
 */
function logApiRequest(metadata)

/**
 * Sanitizes PDF text before sending to API
 * @param {string} text
 * @returns {string}
 */
function sanitizeText(text)
```

### UsageTrackerService Helpers

```javascript
/**
 * Loads usage data from localStorage
 * @returns {UsageData|null}
 */
function loadUsageData()

/**
 * Saves usage data to localStorage
 * @param {UsageData} data
 * @returns {void}
 */
function saveUsageData(data)

/**
 * Checks if date is today
 * @param {string} date - YYYY-MM-DD
 * @returns {boolean}
 */
function isToday(date)

/**
 * Calculates time until midnight WIB
 * @returns {number} - Milliseconds until reset
 */
function timeUntilMidnight()
```

### ExtractBLWithGemini Helpers

```javascript
/**
 * Determines if Gemini is available
 * @returns {boolean}
 */
function isGeminiAvailable()

/**
 * Logs extraction method used
 * @param {string} method - "gemini" or "rule-based"
 * @param {string} reason - Why this method was used
 * @returns {void}
 */
function logExtractionMethod(method, reason)

/**
 * Calculates overall confidence from field scores
 * @param {Object.<string, number>} scores
 * @returns {number}
 */
function calculateOverallConfidence(scores)
```

## Examples

### Example 1: Successful Gemini Extraction

**Input**:
```javascript
const pdfText = `
BILL OF LADING
B/L NO: MAEU123456789
SHIPPER: PT MAJU JAYA
JAKARTA, INDONESIA
CONSIGNEE: CV KARYA UTAMA
SURABAYA, INDONESIA
VESSEL: EVER GIVEN
VOYAGE: 123N
PORT OF LOADING: SINGAPORE
PORT OF DISCHARGE: TANJUNG PRIOK
ETA: 2025-02-15
`;

const result = await extractBLWithGemini.execute(pdfText);
```

**Output**:
```javascript
{
  ok: true,
  data: {
    blNumber: { value: "MAEU123456789", confidence: 0.95 },
    shipperName: { value: "PT MAJU JAYA", confidence: 0.90 },
    consigneeName: { value: "CV KARYA UTAMA", confidence: 0.90 },
    vesselName: { value: "EVER GIVEN", confidence: 0.92 },
    voyage: { value: "123N", confidence: 0.88 },
    portOfLoading: { value: "SINGAPORE", confidence: 0.93 },
    portOfDischarge: { value: "TANJUNG PRIOK", confidence: 0.93 },
    eta: { value: "2025-02-15", confidence: 0.85 },
    overallConfidence: 0.91,
    foundFieldsCount: 8,
    extractionMethod: "gemini"
  }
}
```

### Example 2: Gemini Timeout → Fallback to Rule-Based

**Input**:
```javascript
const pdfText = `
B/L NO: ABCD987654321
SHIPPER: PT EKSPOR INDONESIA
...
`;

// Gemini API times out after 10 seconds
const result = await extractBLWithGemini.execute(pdfText);
```

**Output**:
```javascript
{
  ok: true,
  data: {
    blNumber: { value: "ABCD987654321", confidence: 0.75 },
    shipperName: { value: "PT EKSPOR INDONESIA", confidence: 0.70 },
    consigneeName: { value: null, confidence: 0 },
    vesselName: { value: null, confidence: 0 },
    voyage: { value: null, confidence: 0 },
    portOfLoading: { value: null, confidence: 0 },
    portOfDischarge: { value: null, confidence: 0 },
    eta: { value: null, confidence: 0 },
    overallConfidence: 0.18,
    foundFieldsCount: 2,
    extractionMethod: "rule-based"
  }
}
```

### Example 3: Daily Limit Reached

**Input**:
```javascript
// User has already extracted 5 BLs today
const canExtractResult = await usageTracker.canExtract();
```

**Output**:
```javascript
{
  ok: false,
  error: {
    code: "DAILY_LIMIT_REACHED",
    message: "Batas harian tercapai (5 BL per hari). Coba lagi besok ya.",
    technicalDetails: "Usage count: 5/5, resets at midnight WIB"
  }
}
```

### Example 4: Form Data Transformation

**Input**:
```javascript
const extractionData = {
  blNumber: { value: "MAEU123456789", confidence: 0.95 },
  shipperName: { value: "PT MAJU JAYA", confidence: 0.90 },
  consigneeName: { value: "CV KARYA UTAMA", confidence: 0.90 },
  vesselName: { value: "EVER GIVEN", confidence: 0.92 },
  voyage: { value: "123N", confidence: 0.88 },
  portOfLoading: { value: "SINGAPORE", confidence: 0.93 },
  portOfDischarge: { value: "TANJUNG PRIOK", confidence: 0.93 },
  eta: { value: "2025-02-15", confidence: 0.85 },
  overallConfidence: 0.91,
  foundFieldsCount: 8,
  extractionMethod: "gemini"
};

const formData = toFormDataFromGemini(extractionData);
```

**Output**:
```javascript
{
  blNumber: "MAEU123456789",
  shipperName: "PT MAJU JAYA",
  consigneeName: "CV KARYA UTAMA",
  vesselName: "EVER GIVEN",
  voyage: "123N",
  portOfLoading: "SINGAPORE",
  portOfDischarge: "TANJUNG PRIOK",
  eta: "2025-02-15",
  _confidenceScores: {
    blNumber: 0.95,
    shipperName: 0.90,
    consigneeName: 0.90,
    vesselName: 0.92,
    voyage: 0.88,
    portOfLoading: 0.93,
    portOfDischarge: 0.93,
    eta: 0.85
  },
  _isAutoFilled: true,
  _extractionMethod: "gemini"
}
```

### Example 5: Gemini Prompt Structure

**Input**:
```javascript
const pdfText = "B/L NO: MAEU123456789\nSHIPPER: PT MAJU JAYA\n...";
const prompt = buildExtractionPrompt(pdfText);
```

**Output**:
```javascript
`You are a Bill of Lading (BL) data extraction assistant. Extract the following fields from the BL document text below. Return your response as JSON.

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
    ...
  },
  "confidence": {
    "blNumber": 0.95,
    "shipperName": 0.90,
    ...
  }
}

BL Document Text:
${pdfText}
`
```

### Example 6: Usage Tracking Flow

**Input**:
```javascript
// Morning: First extraction
await usageTracker.incrementUsage();
const data1 = await usageTracker.getUsageData();

// Afternoon: Fifth extraction
await usageTracker.incrementUsage();
await usageTracker.incrementUsage();
await usageTracker.incrementUsage();
await usageTracker.incrementUsage();
const data2 = await usageTracker.getUsageData();

// Attempt sixth extraction
const canExtract = await usageTracker.canExtract();
```

**Output**:
```javascript
// data1
{
  date: "2025-01-30",
  count: 1,
  limit: 5
}

// data2
{
  date: "2025-01-30",
  count: 5,
  limit: 5
}

// canExtract
{
  ok: false,
  error: {
    code: "DAILY_LIMIT_REACHED",
    message: "Batas harian tercapai (5 BL per hari). Coba lagi besok ya."
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property-Based Testing Applicability Assessment

This feature involves:
- External API integration (Gemini API)
- PDF text parsing and transformation
- Browser storage operations (localStorage)
- UI state management and display

**Assessment**: Property-based testing is **partially applicable** for this feature. While some components involve external services and UI rendering (not suitable for PBT), the core data transformation and validation logic can benefit from property-based testing.

**PBT-Suitable Components**:
- Data parsing and validation (Gemini response → ExtractionData)
- Confidence score normalization
- Field mapping (extraction → form data)
- Date format validation

**Not PBT-Suitable Components**:
- Gemini API integration (external service, use integration tests)
- Usage tracking (browser storage, use example-based tests)
- UI rendering (use snapshot/visual tests)
- PDF parsing (external library, use example-based tests)

Given the mixed nature of this feature, I will include correctness properties for the data transformation and validation logic that is suitable for property-based testing.


### Property Reflection

After analyzing all acceptance criteria, I identified the following properties suitable for property-based testing:

**Identified Properties**:
1. Response parsing handles varying structures (1.4)
2. Missing fields are set to null (2.2, 4.4)
3. Confidence scores are in valid range [0, 1] (2.3, 4.5)
4. Overall confidence is average of field scores (2.4)
5. Found fields count matches non-null fields (2.5)
6. Invalid confidence defaults to 0.5 (4.6)
7. Date validation works for any date string (4.7)
8. Invalid dates are set to null (4.8)
9. Extraction result transforms to valid form data (5.7)
10. Usage count tracks extraction attempts correctly (13.1)
11. Usage count increments only on success (13.7)
12. Extraction allowed when count < 5 (13.4)

**Redundancy Analysis**:
- Properties 2 and 4 (missing fields → null) are the same behavior, can be combined
- Properties 3 and 6 (confidence validation and defaulting) can be combined into one comprehensive property
- Properties 7 and 8 (date validation and null handling) can be combined
- Properties 10, 11, 12 (usage tracking) can be combined into one comprehensive property about usage tracking invariants

**Final Properties After Reflection**:
1. **Response parsing handles varying structures** - Tests parsing robustness
2. **Missing or invalid fields are normalized** - Combines null handling for missing fields
3. **Confidence scores are normalized to valid range** - Combines validation and defaulting
4. **Overall confidence is average of field scores** - Tests calculation correctness
5. **Found fields count matches non-null fields** - Tests counting logic
6. **Date validation and normalization** - Combines date validation and null handling
7. **Extraction result transforms to valid form data** - Tests data transformation
8. **Usage tracking maintains invariants** - Combines all usage tracking behaviors

### Correctness Properties

### Property 1: Response Parsing Robustness

*For any* JSON response structure (valid or malformed), the `parseGeminiResponse` function SHALL either return a valid ExtractionData structure with all required fields present, or return an error with code "INVALID_RESPONSE_FORMAT".

**Validates: Requirements 1.4, 4.1, 4.2, 4.3**

### Property 2: Missing Field Normalization

*For any* extraction result with a subset of fields present, all missing fields SHALL be set to null with confidence 0, ensuring the result structure always contains all 8 required fields (blNumber, shipperName, consigneeName, vesselName, voyage, portOfLoading, portOfDischarge, eta).

**Validates: Requirements 2.2, 4.4**

### Property 3: Confidence Score Normalization

*For any* confidence score value (including invalid values like negative numbers, values > 1, non-numeric values, null, or undefined), the `normalizeConfidence` function SHALL return a numeric value in the range [0, 1], defaulting invalid values to 0.5.

**Validates: Requirements 2.3, 4.5, 4.6**

### Property 4: Overall Confidence Calculation

*For any* set of field confidence scores, the calculated overall confidence SHALL equal the arithmetic mean of all field scores, and SHALL be in the range [0, 1].

**Validates: Requirements 2.4**

### Property 5: Found Fields Count Accuracy

*For any* extraction result, the `foundFieldsCount` SHALL equal the number of fields with non-null values, and SHALL be in the range [0, 8].

**Validates: Requirements 2.5**

### Property 6: Date Validation and Normalization

*For any* date string, the `validateEtaFormat` function SHALL return either a valid date in YYYY-MM-DD format or null. Valid inputs in formats DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD SHALL be normalized to YYYY-MM-DD. Invalid date strings SHALL return null.

**Validates: Requirements 4.7, 4.8**

### Property 7: Extraction to Form Data Transformation

*For any* valid ExtractionData structure, the `toFormDataFromGemini` function SHALL produce a FormData structure where:
- All field names are correctly mapped
- Null values are converted to empty strings
- Confidence scores are preserved in `_confidenceScores`
- `_isAutoFilled` is set to true
- `_extractionMethod` matches the input extraction method

**Validates: Requirements 5.7**

### Property 8: Usage Tracking Invariants

*For any* sequence of extraction attempts (successful or failed), the usage tracker SHALL maintain these invariants:
- Usage count is always in range [0, 5]
- Count increments only after successful extractions
- Count does not increment after failed extractions
- Extraction is allowed when count < 5
- Extraction is blocked when count = 5
- Count resets to 0 when date changes

**Validates: Requirements 13.1, 13.4, 13.7**

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing API key → Fall back to rule-based extraction
   - Invalid API key → Fall back to rule-based extraction
   - User message: "Ada masalah dengan sistem. Silakan hubungi admin."

2. **API Errors**
   - Timeout (> 10s) → Fall back to rule-based extraction
   - Rate limit exceeded → Display error, switch to manual mode
   - Network error → Fall back to rule-based extraction
   - User message: "Koneksi terputus. Coba lagi atau isi manual ya."

3. **Data Errors**
   - Invalid PDF → Display error, switch to manual mode
   - No text extracted → Display error, switch to manual mode
   - User message: "File tidak bisa dibaca. Coba file lain atau isi manual."

4. **Validation Errors**
   - Invalid response format → Fall back to rule-based extraction
   - Missing fields → Set to null, continue
   - Invalid confidence scores → Default to 0.5, continue
   - Invalid date format → Set to null, continue

5. **Usage Limit Errors**
   - Daily limit reached → Block upload, display countdown
   - User message: "Batas harian tercapai (5 BL per hari). Coba lagi besok ya."

### Error Handling Principles

1. **Fail Gracefully**: Never crash the application. Always provide a fallback or alternative path.
2. **User-Friendly Messages**: Display messages in Bahasa Indonesia with actionable guidance.
3. **Technical Logging**: Log detailed error information for debugging without exposing to users.
4. **Fallback Chain**: Gemini → Rule-based → Manual clipboard mode.
5. **Data Privacy**: Never log extracted field values, only metadata (field count, confidence scores).

### Error Response Structure

All error responses follow this structure:

```javascript
{
  ok: false,
  error: {
    code: "ERROR_CODE",
    message: "User-facing message in Bahasa Indonesia",
    technicalDetails: "Technical details for logging (optional)"
  }
}
```

## Testing Strategy

### Unit Tests

**Purpose**: Test individual functions and components in isolation

**Coverage**:
- GeminiService: API client, prompt building, response parsing
- UsageTrackerService: Usage counting, limit enforcement, reset logic
- FormFillerService: Data transformation, field mapping
- ExtractBLWithGemini use case: Orchestration logic, fallback behavior
- Helper functions: Confidence normalization, date validation, field counting

**Approach**:
- Mock external dependencies (Gemini API, localStorage)
- Test specific examples and edge cases
- Verify error handling for each error code
- Test boundary conditions (count = 0, count = 5, confidence = 0, confidence = 1)

**Example Tests**:
```javascript
describe('normalizeConfidence', () => {
  it('should clamp values to [0, 1] range', () => {
    expect(normalizeConfidence(-0.5)).toBe(0);
    expect(normalizeConfidence(1.5)).toBe(1);
    expect(normalizeConfidence(0.7)).toBe(0.7);
  });

  it('should default invalid values to 0.5', () => {
    expect(normalizeConfidence(null)).toBe(0.5);
    expect(normalizeConfidence(undefined)).toBe(0.5);
    expect(normalizeConfidence('invalid')).toBe(0.5);
  });
});
```

### Property-Based Tests

**Purpose**: Verify universal properties hold across many generated inputs

**Library**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Coverage**:
- Response parsing robustness (Property 1)
- Missing field normalization (Property 2)
- Confidence score normalization (Property 3)
- Overall confidence calculation (Property 4)
- Found fields count accuracy (Property 5)
- Date validation and normalization (Property 6)
- Extraction to form data transformation (Property 7)
- Usage tracking invariants (Property 8)

**Example Property Test**:
```javascript
import fc from 'fast-check';

describe('Property: Confidence Score Normalization', () => {
  it('should normalize any value to [0, 1] range', () => {
    fc.assert(
      fc.property(
        fc.anything(), // Generate any value
        (value) => {
          const normalized = normalizeConfidence(value);
          // Property: result is always a number in [0, 1]
          expect(typeof normalized).toBe('number');
          expect(normalized).toBeGreaterThanOrEqual(0);
          expect(normalized).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 } // Run 100 iterations
    );
  });
});

// Tag: Feature: bl-gemini-auto-scan, Property 3: For any confidence score value, normalizeConfidence returns a value in [0, 1]
```

### Integration Tests

**Purpose**: Test interactions between components and external services

**Coverage**:
- Gemini API integration (with mock server)
- localStorage usage tracking
- PDF parsing → extraction → form filling flow
- Fallback from Gemini to rule-based extraction
- Error handling end-to-end

**Approach**:
- Use mock Gemini API server
- Test with real PDF samples (3+ different formats)
- Verify data flows correctly through all layers
- Test rate limiting behavior
- Test daily limit enforcement

**Example Integration Test**:
```javascript
describe('Integration: Gemini Extraction Flow', () => {
  it('should extract BL data and fill form', async () => {
    // Setup mock Gemini API
    mockGeminiApi.mockResponse({
      data: { blNumber: 'MAEU123', shipperName: 'PT X', ... },
      confidence: { blNumber: 0.95, shipperName: 0.90, ... }
    });

    // Upload PDF
    const pdfFile = loadTestPDF('standard-bl.pdf');
    const result = await extractBLWithGemini.execute(pdfFile);

    // Verify extraction succeeded
    expect(result.ok).toBe(true);
    expect(result.data.extractionMethod).toBe('gemini');

    // Verify form data transformation
    const formData = toFormDataFromGemini(result.data);
    expect(formData.blNumber).toBe('MAEU123');
    expect(formData._isAutoFilled).toBe(true);
  });
});
```

### End-to-End Tests

**Purpose**: Test complete user workflows in browser environment

**Coverage**:
- Upload PDF → auto-extraction → form display → save
- Gemini failure → fallback to rule-based → form display
- Daily limit reached → error message → manual mode
- Low confidence → warning display → user review

**Approach**:
- Use Playwright or Cypress for browser automation
- Test with real PDF files
- Verify UI state changes
- Test error message display
- Test confidence indicator display

### Test Data

**BL Formats to Test**:
1. Standard format (clear labels, single-line fields)
2. Table-based format (fields in table cells)
3. Multi-line format (addresses spanning multiple lines)
4. Minimal format (missing optional fields)
5. Malformed format (poor OCR quality, missing labels)

**Test PDFs**:
- `test/fixtures/bl-standard.pdf`
- `test/fixtures/bl-table-based.pdf`
- `test/fixtures/bl-multiline.pdf`
- `test/fixtures/bl-minimal.pdf`
- `test/fixtures/bl-malformed.pdf`

### Testing Checklist

- [ ] All 8 correctness properties have property-based tests
- [ ] Each property test runs minimum 100 iterations
- [ ] All error codes have unit tests
- [ ] Fallback to rule-based extraction is tested
- [ ] Daily limit enforcement is tested
- [ ] Confidence score display is tested
- [ ] All 5 BL formats are tested
- [ ] Integration tests cover Gemini API mocking
- [ ] End-to-end tests cover complete user workflows
- [ ] Test coverage > 80% for core and adapters layers

## Implementation Notes

### Environment Setup

Add to `.env.example`:
```
# Gemini API Configuration
GEMINI_API_KEY=your_api_key_here
```

Add to `.gitignore` (if not already present):
```
.env
.env.local
```

### Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.1.0"
  },
  "devDependencies": {
    "fast-check": "^3.15.0"
  }
}
```

### File Structure

```
app/
├── core/
│   ├── services/
│   │   └── bl-extractor.service.js (existing, fallback)
│   ├── use-cases/
│   │   └── extract-bl-with-gemini.js (new)
│   └── ports/
│       └── gemini-gateway.port.js (new)
├── adapters/
│   └── services/
│       └── form-filler.service.js (existing, enhance)
├── infrastructure/
│   └── services/
│       ├── gemini.service.js (new)
│       └── usage-tracker.service.js (new)
└── presentation/
    └── components/
        └── features/
            ├── ShipmentFormWithPDF.jsx (existing, enhance)
            └── ShipmentForm.jsx (existing, enhance)
```

### Migration Strategy

1. **Phase 1**: Implement GeminiService and UsageTrackerService
2. **Phase 2**: Implement ExtractBLWithGemini use case with fallback
3. **Phase 3**: Enhance ShipmentFormWithPDF to trigger Gemini extraction
4. **Phase 4**: Enhance ShipmentForm to display confidence indicators
5. **Phase 5**: Add property-based tests for all 8 properties
6. **Phase 6**: Integration testing with mock Gemini API
7. **Phase 7**: End-to-end testing with real PDFs

### Performance Considerations

1. **Rate Limiting**: 1 request/second to avoid API throttling
2. **Timeout**: 10 seconds to prevent long waits
3. **Caching**: Consider caching extraction results by PDF hash (future enhancement)
4. **Lazy Loading**: Load Gemini SDK only when needed
5. **Memory Management**: Clear PDF text from memory after extraction

### Security Considerations

1. **API Key Protection**: Never expose API key in client-side code or logs
2. **Data Privacy**: Send only text content to API, not original PDF
3. **HTTPS Only**: All API requests must use HTTPS
4. **No Logging of PII**: Never log extracted field values
5. **Browser Storage**: Usage data in localStorage is per-browser, not per-user

### Monitoring and Observability

**Metrics to Track**:
- Extraction success rate (Gemini vs rule-based)
- Average confidence scores
- API response times
- Fallback frequency
- Daily usage patterns
- Error frequency by error code

**Logging Strategy**:
```javascript
// Good: Log metadata without PII
console.log('[Gemini] Extraction complete', {
  method: 'gemini',
  foundFields: 8,
  overallConfidence: 0.91,
  responseTime: 1234
});

// Bad: Don't log extracted values
console.log('[Gemini] Extracted BL:', extractedData); // ❌
```

### Future Enhancements

1. **Caching**: Cache extraction results by PDF hash to avoid re-processing
2. **Batch Processing**: Support multiple BL uploads at once
3. **User Feedback Loop**: Allow users to correct extractions and improve prompts
4. **Confidence Tuning**: Adjust confidence thresholds based on user feedback
5. **Multi-Language Support**: Support BLs in languages other than English/Indonesian
6. **OCR Integration**: Add OCR for image-based PDFs
7. **Field Validation**: Add business logic validation (e.g., valid port codes)
8. **Analytics Dashboard**: Show extraction accuracy trends over time

---

**Design Document Version**: 1.0  
**Last Updated**: 2025-01-30  
**Status**: Ready for Implementation
