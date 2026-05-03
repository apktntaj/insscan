# Design Document: BL Scanner Auto-Fill

## Overview

BL Scanner Auto-Fill adalah enhancement dari existing BL Scanner (`/blscann`) yang menambahkan kemampuan ekstraksi otomatis dan auto-fill form shipment dari dokumen PDF Bill of Lading. Fitur ini mengimplementasikan pipeline parsing → extraction → auto-fill yang berjalan sepenuhnya client-side untuk menjaga privasi data.

### Goals

1. **Reduce manual data entry time** dari 15 menit menjadi beberapa detik
2. **Maintain data privacy** dengan processing sepenuhnya di browser (no server upload)
3. **Provide confidence feedback** agar user tahu field mana yang perlu dicek ulang
4. **Seamless integration** dengan existing shipment workflow tanpa breaking changes

### Non-Goals

- Server-side PDF processing atau storage
- OCR untuk scanned/image-based PDFs (hanya text-based PDFs)
- Machine learning untuk pattern recognition (menggunakan rule-based pattern matching)
- Multi-language support (fokus pada B/L dalam bahasa Inggris)

## Architecture

Mengikuti Clean Architecture dengan layer separation:

```
Presentation Layer (BlScanner component)
         ↓
    Controllers
         ↓
    Use Cases (PDF parsing, extraction, form filling)
         ↓
Infrastructure (pdfjs-dist, browser APIs)
```

### Component Interaction Flow

```
User uploads PDF
    ↓
BlScanner validates file
    ↓
PDFParserService extracts text
    ↓
BLExtractorService identifies fields
    ↓
FormFillerService populates ShipmentForm
    ↓
User reviews & corrects
    ↓
Submit to existing createShipment use case
```

### Key Design Decisions

1. **Client-side only**: Semua processing di browser untuk privacy dan menghindari server costs
2. **Rule-based extraction**: Pattern matching dengan keywords, bukan ML (simpler, predictable, maintainable)
3. **Confidence scoring**: Memberikan feedback visual untuk field dengan low confidence
4. **Fallback mode**: Tetap support click-to-copy jika auto-fill gagal
5. **Reuse existing components**: ShipmentForm tidak dimodifikasi, hanya menerima initial data

## Components and Interfaces

### 1. PDFParserService (Infrastructure Layer)

**Purpose**: Mengekstrak raw text dari PDF menggunakan pdfjs-dist

**Location**: `app/infrastructure/services/pdf-parser.service.js`

**Dependencies**: `pdfjs-dist`

**Interface**:
```javascript
/**
 * @typedef {Object} PDFParseResult
 * @property {boolean} ok
 * @property {string} [text] - Combined text from all pages
 * @property {number} [pageCount] - Number of pages processed
 * @property {string} [error] - Error message if parsing failed
 */

/**
 * Parses PDF file and extracts all text content
 * @param {File} file - PDF file object
 * @returns {Promise<PDFParseResult>}
 */
async function parsePDF(file)
```

### 2. BLExtractorService (Core Layer)

**Purpose**: Mengidentifikasi dan mengekstrak shipment fields dari raw text

**Location**: `app/core/services/bl-extractor.service.js`

**Interface**:
```javascript
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
 */

/**
 * Extracts shipment fields from PDF text
 * @param {string} text - Raw text from PDF
 * @returns {ExtractionResult}
 */
function extractBLFields(text)
```

### 3. FormFillerService (Adapter Layer)

**Purpose**: Mengkonversi ExtractionResult ke format yang diterima ShipmentForm

**Location**: `app/adapters/services/form-filler.service.js`

**Interface**:
```javascript
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
 */

/**
 * Converts extraction result to form data
 * @param {ExtractionResult} extraction
 * @returns {FormData}
 */
function toFormData(extraction)
```

### 4. Enhanced BlScanner Component (Presentation Layer)

**Purpose**: Orchestrates PDF upload, parsing, extraction, dan form opening

**Location**: `app/presentation/components/features/BlScanner.jsx` (enhanced)

**New State**:
```javascript
const [mode, setMode] = useState("auto-fill"); // "auto-fill" | "click-to-copy"
const [isProcessing, setIsProcessing] = useState(false);
const [extractionResult, setExtractionResult] = useState(null);
const [showForm, setShowForm] = useState(false);
const [formInitialData, setFormInitialData] = useState(null);
```

### 5. Enhanced ShipmentForm Component (Presentation Layer)

**Purpose**: Menerima initial data dan menampilkan confidence indicators

**Location**: `app/presentation/components/features/ShipmentForm.jsx` (enhanced)

**New Props**:
```javascript
/**
 * @param {Object} props
 * @param {FormData} [props.autoFillData] - Data from auto-fill
 * @param {boolean} [props.isAutoFilled] - Flag to show auto-fill indicators
 */
```

## Data Models

### ExtractedField

```javascript
/**
 * @typedef {Object} ExtractedField
 * @property {string|null} value - Extracted value, null if not found
 * @property {number} confidence - Confidence score 0.0-1.0
 *   - 0.0-0.69: Low confidence (red indicator)
 *   - 0.7-0.89: Medium confidence (yellow indicator)
 *   - 0.9-1.0: High confidence (green indicator)
 * @property {string} [matchedPattern] - Pattern name that matched (for debugging)
 * @property {number} [position] - Character position in text where found
 */
```

**Invariants**:
- `confidence` must be between 0 and 1 inclusive
- If `value` is null, `confidence` should be 0
- `value` should be trimmed and normalized (uppercase)

### ExtractionResult

```javascript
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
```

**Invariants**:
- All 8 field properties must be present
- `overallConfidence` is computed as average of all field confidences
- `foundFieldsCount` is count of fields where `value !== null`

### Pattern Definition

```javascript
/**
 * @typedef {Object} FieldPattern
 * @property {string} fieldName - Target field name
 * @property {RegExp[]} patterns - Array of regex patterns to try
 * @property {string[]} keywords - Keywords that must appear before value
 * @property {function(string): string} [normalizer] - Optional value normalizer
 * @property {function(string): number} [confidenceCalculator] - Optional confidence calculator
 */
```

### FormData (Auto-Fill)

```javascript
/**
 * @typedef {Object} AutoFillFormData
 * @property {string} blNumber
 * @property {string} shipperName
 * @property {string} consigneeName
 * @property {string} vesselName
 * @property {string} voyage
 * @property {string} portOfLoading
 * @property {string} portOfDischarge
 * @property {string} eta - YYYY-MM-DD format
 * @property {Object.<string, number>} _confidenceScores - Map of field name to confidence
 * @property {boolean} _isAutoFilled - Flag indicating data source
 */
```

**Invariants**:
- All string fields are uppercase
- `eta` must be valid YYYY-MM-DD format or empty string
- `_confidenceScores` keys must match field names
- Empty fields are represented as empty string, not null

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following properties that are suitable for property-based testing. Here's the reflection to eliminate redundancy:

**Identified Properties:**
1. Field extraction for all 8 fields (2.1-2.8) → Can be combined into single property about extraction
2. Confidence score assignment (2.9) → Separate property about confidence validity
3. Null handling for missing fields (2.10) → Separate property about null marking
4. Pattern matching with keywords (3.1-3.8) → Combined with property 1
5. Highest confidence selection (3.9) → Separate property about conflict resolution
6. Uppercase normalization (3.10) → Separate property about text normalization
7. Form field mapping (4.2-4.9) → Single property about extraction-to-form mapping
8. Null-to-empty mapping (4.10) → Part of property 7
9. Confidence indicator display (6.1-6.3) → Single property about indicator correctness
10. Multi-page text extraction (12.1-12.4) → Single property about page handling

**Redundancy Analysis:**
- Properties 1 and 4 are redundant - pattern matching is part of extraction, combine into one
- Property 7 and 8 are redundant - null handling is part of form mapping, combine into one
- File validation (1.1) is a simple property worth keeping separate

**Final Property Set (after removing redundancy):**
1. File validation correctly identifies PDFs
2. Field extraction finds values when patterns present
3. Confidence scores are always in valid range [0,1]
4. Missing fields are marked as null
5. Highest confidence candidate is selected when multiple matches exist
6. All extracted values are normalized to uppercase
7. Extraction result maps correctly to form data
8. Confidence indicators display correctly based on score ranges
9. Multi-page PDFs have all pages processed

### Property 1: PDF File Validation

*For any* file object, the validation function SHALL return true if and only if the file has PDF MIME type or .pdf extension.

**Validates: Requirements 1.1**

### Property 2: Field Extraction Completeness

*For any* text containing valid field patterns with their keywords, the extractor SHALL find and extract all fields that have matching patterns present in the text.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

### Property 3: Confidence Score Validity

*For any* extraction result, all field confidence scores SHALL be numbers in the range [0, 1] inclusive, and fields with null values SHALL have confidence score of 0.

**Validates: Requirements 2.9**

### Property 4: Missing Field Null Marking

*For any* text that does not contain a specific field's pattern, the extraction result SHALL mark that field's value as null.

**Validates: Requirements 2.10**

### Property 5: Highest Confidence Selection

*For any* text containing multiple candidate values for the same field, the extractor SHALL select the candidate with the highest confidence score.

**Validates: Requirements 3.9**

### Property 6: Uppercase Normalization

*For any* extracted field value, the value SHALL be normalized to uppercase before being stored in the extraction result.

**Validates: Requirements 3.10**

### Property 7: Extraction to Form Data Mapping

*For any* extraction result, converting it to form data SHALL map all eight fields correctly, with null values converted to empty strings and non-null values preserved.

**Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10**

### Property 8: Confidence Indicator Correctness

*For any* confidence score, the indicator type SHALL be "warning" for scores < 0.7, "neutral" for scores 0.7-0.9, and "success" for scores > 0.9.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 9: Multi-Page Text Aggregation

*For any* multi-page PDF, the parser SHALL extract text from all pages and combine them with page separators, preserving the sequential order.

**Validates: Requirements 12.1, 12.2, 12.4**

## Error Handling

### Error Categories

1. **File Validation Errors**
   - Invalid file type (not PDF)
   - Corrupted PDF file
   - File too large (> 5MB warning)

2. **Parsing Errors**
   - PDF parsing failure (pdfjs-dist error)
   - Empty PDF (no text content)
   - Timeout (> 5 seconds)

3. **Extraction Errors**
   - No fields found (all null)
   - Low confidence across all fields (< 0.5 average)
   - Required fields missing (blNumber, shipper, consignee)

4. **Form Errors**
   - Validation errors on submit (existing form validation)
   - Storage errors (IndexedDB failure)

### Error Handling Strategy

**Principle**: Fail gracefully with clear Indonesian error messages and fallback options.

```javascript
/**
 * @typedef {Object} ErrorResult
 * @property {boolean} ok - Always false for errors
 * @property {string} code - Error code for programmatic handling
 * @property {string} message - User-facing error message in Indonesian
 * @property {string} [suggestion] - Suggested action for user
 */
```

**Error Messages**:

| Error Code | Message | Suggestion |
|------------|---------|------------|
| `INVALID_FILE_TYPE` | "File harus berformat PDF." | "Pilih file dengan ekstensi .pdf" |
| `PDF_PARSE_FAILED` | "Gagal memproses PDF. Pastikan file valid dan berbasis teks." | "Coba file PDF lain atau gunakan mode click-to-copy" |
| `NO_TEXT_EXTRACTED` | "PDF tidak mengandung teks yang dapat dibaca." | "Gunakan mode click-to-copy untuk PDF scan" |
| `NO_FIELDS_FOUND` | "Tidak dapat menemukan field shipment di PDF." | "Periksa format dokumen atau isi manual" |
| `LOW_CONFIDENCE` | "Ekstraksi berhasil tapi confidence rendah. Periksa data dengan teliti." | "Review semua field sebelum save" |
| `TIMEOUT` | "Proses terlalu lama. File mungkin terlalu besar." | "Coba file yang lebih kecil" |

### Error Recovery

1. **Automatic Fallback**: Jika ekstraksi gagal total, otomatis switch ke click-to-copy mode
2. **Partial Success**: Jika beberapa field ditemukan, tetap buka form dengan field yang berhasil
3. **Retry Option**: User dapat retry dengan file yang sama atau berbeda
4. **Manual Override**: User selalu dapat edit atau isi manual field yang gagal diekstrak

## Testing Strategy

### Unit Tests

**Focus**: Specific examples, edge cases, and error conditions

**Test Files**:
- `app/infrastructure/services/__tests__/pdf-parser.service.test.js`
- `app/core/services/__tests__/bl-extractor.service.test.js`
- `app/adapters/services/__tests__/form-filler.service.test.js`

**Example Test Cases**:

1. **File Validation**
   - Valid PDF with correct MIME type → returns true
   - Non-PDF file → returns false
   - PDF with wrong MIME but correct extension → returns true
   - Null or undefined file → returns false

2. **Pattern Matching**
   - Text with "B/L NO: ABCD123" → extracts "ABCD123"
   - Text with "BILL OF LADING NO ABCD123" → extracts "ABCD123"
   - Text without B/L pattern → returns null
   - Multiple B/L numbers → returns highest confidence

3. **Date Parsing**
   - "ETA: 2025-01-15" → extracts "2025-01-15"
   - "ETA 15/01/2025" → converts to "2025-01-15"
   - "ETA: JANUARY 15, 2025" → converts to "2025-01-15"
   - Invalid date format → returns null

4. **Error Handling**
   - Corrupted PDF → returns error with code
   - Empty PDF → returns error with suggestion
   - Network timeout → returns timeout error

### Property-Based Tests

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Test Files**:
- `app/core/services/__tests__/bl-extractor.properties.test.js`
- `app/adapters/services/__tests__/form-filler.properties.test.js`

**Property Test Implementation**:

Each property test MUST include a comment tag referencing the design property:

```javascript
/**
 * Feature: bl-scanner-auto-fill, Property 3: Confidence Score Validity
 * For any extraction result, all field confidence scores SHALL be numbers 
 * in the range [0, 1] inclusive
 */
test('confidence scores are always in valid range', () => {
  fc.assert(
    fc.property(
      arbitraryExtractionResult(),
      (extraction) => {
        const fields = [
          extraction.blNumber,
          extraction.shipperName,
          extraction.consigneeName,
          extraction.vesselName,
          extraction.voyage,
          extraction.portOfLoading,
          extraction.portOfDischarge,
          extraction.eta
        ];
        
        return fields.every(field => 
          typeof field.confidence === 'number' &&
          field.confidence >= 0 &&
          field.confidence <= 1
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

**Generators (Arbitraries)**:

```javascript
// Generator for random text with embedded BL patterns
function arbitraryBLText() {
  return fc.record({
    blNumber: fc.option(fc.string({ minLength: 8, maxLength: 15 })),
    shipper: fc.option(fc.string({ minLength: 5, maxLength: 50 })),
    consignee: fc.option(fc.string({ minLength: 5, maxLength: 50 })),
    // ... other fields
  }).map(fields => generateTextWithFields(fields));
}

// Generator for extraction results
function arbitraryExtractionResult() {
  return fc.record({
    blNumber: arbitraryExtractedField(),
    shipperName: arbitraryExtractedField(),
    // ... other fields
  });
}

// Generator for extracted field
function arbitraryExtractedField() {
  return fc.record({
    value: fc.option(fc.string()),
    confidence: fc.float({ min: 0, max: 1 }),
    matchedPattern: fc.option(fc.string())
  });
}
```

### Integration Tests

**Focus**: End-to-end workflow with real PDF files and UI interactions

**Test Files**:
- `app/presentation/components/features/__tests__/BlScanner.integration.test.jsx`

**Test Cases**:
1. Upload valid PDF → extract → open form → submit → verify shipment created
2. Upload invalid file → verify error message → fallback to click-to-copy
3. Extract with low confidence → verify warnings → manual correction → submit
4. Multi-page PDF → verify all pages processed → verify data extracted
5. Mode switching → verify localStorage persistence → verify behavior changes

### Manual Testing Checklist

- [ ] Test dengan berbagai format B/L dari shipping lines berbeda (Maersk, MSC, CMA CGM, etc.)
- [ ] Test dengan PDF multi-halaman (2-10 pages)
- [ ] Test dengan PDF berukuran besar (> 3MB)
- [ ] Test dengan PDF scan (image-based) → harus fallback ke click-to-copy
- [ ] Test confidence indicators dengan berbagai kualitas ekstraksi
- [ ] Test mode switching dan localStorage persistence
- [ ] Test error handling untuk semua error scenarios
- [ ] Test integration dengan existing shipment workflow
- [ ] Test di berbagai browser (Chrome, Firefox, Safari, Edge)
- [ ] Test dengan slow network (throttling) untuk async behavior

## Implementation Plan

### Phase 1: Core Services (Week 1)

1. **PDFParserService**
   - Implement `parsePDF(file)` using pdfjs-dist
   - Handle multi-page PDFs
   - Error handling for corrupted files
   - Unit tests

2. **BLExtractorService**
   - Define pattern library for all 8 fields
   - Implement `extractBLFields(text)`
   - Confidence scoring algorithm
   - Unit tests + property tests

3. **FormFillerService**
   - Implement `toFormData(extraction)`
   - Date format conversion
   - Null-to-empty mapping
   - Unit tests + property tests

### Phase 2: UI Integration (Week 2)

4. **Enhanced BlScanner Component**
   - Add mode toggle (auto-fill / click-to-copy)
   - Integrate PDF parsing and extraction
   - Loading states and error messages
   - localStorage for mode preference

5. **Enhanced ShipmentForm Component**
   - Accept `autoFillData` prop
   - Display confidence indicators
   - Tooltip for confidence scores
   - Summary badge for low confidence fields

### Phase 3: Testing & Polish (Week 3)

6. **Property-Based Tests**
   - Implement all 9 properties with fast-check
   - Create generators for test data
   - Verify 100+ iterations per property

7. **Integration Tests**
   - End-to-end workflow tests
   - Error scenario tests
   - Browser compatibility tests

8. **Documentation & Deployment**
   - User guide in Indonesian
   - Developer documentation
   - Performance benchmarks
   - Deploy to production

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load pdfjs-dist worker only when needed
2. **Web Workers**: Run PDF parsing in Web Worker to avoid blocking UI
3. **Debouncing**: Debounce file input to prevent multiple simultaneous parses
4. **Caching**: Cache parsed text for retry scenarios
5. **Progressive Rendering**: Show extraction progress for large PDFs

### Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| File validation | < 10ms | Synchronous check |
| PDF parsing (1MB) | < 2s | Time to text extraction |
| Field extraction | < 1s | Time to ExtractionResult |
| Form filling | < 500ms | Time to form render |
| Total (1MB PDF) | < 4s | Upload to form ready |

### Memory Management

- Release PDF file URL after parsing: `URL.revokeObjectURL(fileUrl)`
- Clear extracted text from state after form opens
- Limit PDF size to 5MB to prevent browser memory issues
- Use streaming for very large PDFs (future enhancement)

## Security Considerations

### Data Privacy

1. **No Server Upload**: All processing happens client-side in browser
2. **No Persistence**: PDF and extracted text not saved to IndexedDB or localStorage
3. **Memory Cleanup**: Clear sensitive data from memory after use
4. **No Analytics**: Do not send PDF content or extracted data to analytics

### Input Validation

1. **File Type Check**: Validate MIME type and extension before processing
2. **File Size Limit**: Reject files > 5MB to prevent DoS
3. **Text Sanitization**: Sanitize extracted text before displaying in UI
4. **XSS Prevention**: Use React's built-in XSS protection for rendering

### Error Information Disclosure

- Error messages should not reveal system internals
- Log detailed errors to console for debugging, show generic messages to user
- Do not expose file paths or system information in error messages

## Future Enhancements

### Phase 4 (Future)

1. **OCR Support**: Integrate Tesseract.js for scanned PDFs
2. **Machine Learning**: Train model for better pattern recognition
3. **Template Library**: User-defined templates for different shipping lines
4. **Batch Processing**: Upload multiple PDFs and extract all at once
5. **Browser Extension**: Auto-fill CEISA and other external forms
6. **Credit System**: Monetization via credit-based parsing (1 credit = 1 parse)
7. **Cloud Sync**: Optional cloud backup of extraction templates (with user consent)

### Technical Debt

- Consider migrating to TypeScript for better type safety
- Add E2E tests with Playwright or Cypress
- Implement telemetry for extraction accuracy (anonymized)
- Create admin dashboard for pattern tuning
- Add A/B testing framework for pattern improvements

## Appendix

### Pattern Library Reference

**B/L Number Patterns**:
```javascript
const BL_PATTERNS = [
  /B\/L\s*NO\.?\s*:?\s*([A-Z0-9]+)/i,
  /BILL\s*OF\s*LADING\s*NO\.?\s*:?\s*([A-Z0-9]+)/i,
  /BL\s*NUMBER\s*:?\s*([A-Z0-9]+)/i,
];
```

**Shipper Patterns**:
```javascript
const SHIPPER_PATTERNS = [
  /SHIPPER\s*:?\s*\n?\s*([A-Z0-9\s,\.]+?)(?=\n\n|CONSIGNEE|$)/i,
  /CONSIGNOR\s*:?\s*\n?\s*([A-Z0-9\s,\.]+?)(?=\n\n|CONSIGNEE|$)/i,
];
```

**Date Patterns**:
```javascript
const DATE_PATTERNS = [
  /ETA\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
  /ETA\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
  /ESTIMATED\s*TIME\s*OF\s*ARRIVAL\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
];
```

### Confidence Scoring Algorithm

```javascript
/**
 * Calculates confidence score based on pattern match quality
 * @param {string} value - Extracted value
 * @param {string} pattern - Pattern that matched
 * @param {string} context - Surrounding text
 * @returns {number} Confidence score 0-1
 */
function calculateConfidence(value, pattern, context) {
  let score = 0.5; // Base score
  
  // Boost for exact keyword match
  if (pattern.includes('exact')) score += 0.2;
  
  // Boost for value length (longer = more likely correct)
  if (value.length > 5) score += 0.1;
  if (value.length > 10) score += 0.1;
  
  // Boost for alphanumeric pattern (typical for BL numbers)
  if (/^[A-Z]{4}\d+$/.test(value)) score += 0.1;
  
  // Penalty for special characters (might be noise)
  if (/[^A-Z0-9\s]/.test(value)) score -= 0.1;
  
  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, score));
}
```

### Example Extraction Flow

```
Input PDF: "BILL OF LADING NO: MAEU123456789\nSHIPPER: PT MAJU JAYA\n..."

1. Parse PDF → Extract text
   Result: "BILL OF LADING NO: MAEU123456789\nSHIPPER: PT MAJU JAYA\n..."

2. Extract fields
   - blNumber: { value: "MAEU123456789", confidence: 0.95, pattern: "BILL OF LADING NO" }
   - shipperName: { value: "PT MAJU JAYA", confidence: 0.85, pattern: "SHIPPER" }
   - ... (other fields)

3. Convert to form data
   {
     blNumber: "MAEU123456789",
     shipperName: "PT MAJU JAYA",
     _confidenceScores: { blNumber: 0.95, shipperName: 0.85, ... },
     _isAutoFilled: true
   }

4. Open ShipmentForm with data
   - Form fields populated
   - Green indicator on blNumber (0.95 > 0.9)
   - Yellow indicator on shipperName (0.85 in 0.7-0.9 range)
   - User reviews and submits
```
