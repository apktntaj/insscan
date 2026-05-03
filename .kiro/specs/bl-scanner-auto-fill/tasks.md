# Implementation Plan: BL Scanner Auto-Fill

## Overview

This implementation plan converts the BL Scanner Auto-Fill design into actionable coding tasks. The feature adds automatic PDF parsing and form auto-fill capabilities to the existing BL Scanner, reducing manual data entry time from 15 minutes to seconds.

**Implementation Language**: JavaScript (React/Next.js)

**Architecture**: Clean Architecture with client-side processing for data privacy

**Key Components**:
- PDFParserService (Infrastructure) - Extract text from PDF
- BLExtractorService (Core) - Pattern matching and field extraction
- FormFillerService (Adapter) - Convert extraction to form data
- Enhanced BlScanner (Presentation) - Orchestrate workflow
- Enhanced ShipmentForm (Presentation) - Display confidence indicators

## Tasks

- [x] 1. Set up infrastructure and dependencies
  - Install fast-check library for property-based testing: `npm install --save-dev fast-check`
  - Verify pdfjs-dist is available (already in package.json)
  - Create directory structure for new services
  - _Requirements: 1.1, 9.5, 10.1_

- [x] 2. Implement PDFParserService (Infrastructure Layer)
  - [x] 2.1 Create PDFParserService with parsePDF function
    - Create file `app/infrastructure/services/pdf-parser.service.js`
    - Implement `parsePDF(file)` function that returns `Promise<PDFParseResult>`
    - Use pdfjs-dist to load PDF document
    - Extract text from all pages sequentially
    - Combine text with page separators (`\n--- PAGE ${pageNum} ---\n`)
    - Handle multi-page PDFs (up to 10 pages)
    - Return result object with `{ ok, text, pageCount, error }`
    - _Requirements: 1.2, 1.4, 12.1, 12.4_
  
  - [x] 2.2 Add file validation to PDFParserService
    - Implement file type validation (check MIME type and .pdf extension)
    - Add file size validation (warn if > 5MB)
    - Return appropriate error codes: `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`
    - _Requirements: 1.1, 1.3, 9.4_
  
  - [x] 2.3 Add error handling for PDF parsing
    - Handle corrupted PDF files (catch pdfjs-dist errors)
    - Handle empty PDFs (no text content)
    - Handle timeout scenarios (> 5 seconds)
    - Return error codes: `PDF_PARSE_FAILED`, `NO_TEXT_EXTRACTED`, `TIMEOUT`
    - _Requirements: 1.3, 1.5, 8.1_
  
  - [ ]* 2.4 Write unit tests for PDFParserService
    - Test valid PDF with correct MIME type returns success
    - Test non-PDF file returns `INVALID_FILE_TYPE` error
    - Test PDF with wrong MIME but .pdf extension returns success
    - Test null/undefined file returns error
    - Test multi-page PDF combines all pages with separators
    - Test empty PDF returns `NO_TEXT_EXTRACTED` error
    - _Requirements: 1.1, 1.2, 1.3, 12.1_

- [x] 3. Implement BLExtractorService (Core Layer)
  - [x] 3.1 Create pattern library for field extraction
    - Create file `app/core/services/bl-extractor.service.js`
    - Define regex patterns for B/L Number (keywords: "B/L NO", "BILL OF LADING NO", "BL NUMBER")
    - Define regex patterns for Shipper (keywords: "SHIPPER", "CONSIGNOR")
    - Define regex patterns for Consignee (keywords: "CONSIGNEE", "NOTIFY PARTY")
    - Define regex patterns for Vessel (keywords: "VESSEL", "VESSEL NAME")
    - Define regex patterns for Voyage (keywords: "VOYAGE", "VOY", "VOYAGE NO")
    - Define regex patterns for Port of Loading (keywords: "PORT OF LOADING", "POL", "PLACE OF RECEIPT")
    - Define regex patterns for Port of Discharge (keywords: "PORT OF DISCHARGE", "POD", "PLACE OF DELIVERY")
    - Define regex patterns for ETA (keywords: "ETA", "ESTIMATED TIME OF ARRIVAL", "ETD")
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  
  - [x] 3.2 Implement extractBLFields function
    - Create `extractBLFields(text)` function that returns `ExtractionResult`
    - For each field, apply all relevant patterns to find candidate values
    - Extract value and calculate confidence score for each match
    - Select candidate with highest confidence when multiple matches found
    - Normalize all extracted values to uppercase
    - Mark fields as null when no pattern matches
    - Assign confidence score of 0 to null fields
    - Calculate `overallConfidence` as average of all field confidences
    - Calculate `foundFieldsCount` as count of non-null fields
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.9, 3.10, 12.2, 12.3_
  
  - [x] 3.3 Implement confidence scoring algorithm
    - Create `calculateConfidence(value, pattern, context)` helper function
    - Base score: 0.5
    - Boost for exact keyword match: +0.2
    - Boost for value length > 5 chars: +0.1
    - Boost for value length > 10 chars: +0.1
    - Boost for alphanumeric pattern (typical BL format): +0.1
    - Penalty for excessive special characters: -0.1
    - Clamp result to [0, 1] range
    - _Requirements: 2.9_
  
  - [x] 3.4 Implement date parsing and normalization
    - Create helper function to parse various date formats
    - Support formats: YYYY-MM-DD, DD/MM/YYYY, "MONTH DD, YYYY"
    - Convert all dates to YYYY-MM-DD format
    - Return null for invalid date formats
    - _Requirements: 2.8, 4.9_
  
  - [ ]* 3.5 Write unit tests for BLExtractorService
    - Test B/L Number extraction with "B/L NO: ABCD123" returns "ABCD123"
    - Test B/L Number extraction with "BILL OF LADING NO ABCD123" returns "ABCD123"
    - Test missing B/L Number returns null with confidence 0
    - Test multiple B/L numbers returns highest confidence candidate
    - Test date parsing "ETA: 2025-01-15" returns "2025-01-15"
    - Test date parsing "ETA 15/01/2025" converts to "2025-01-15"
    - Test date parsing "ETA: JANUARY 15, 2025" converts to "2025-01-15"
    - Test invalid date format returns null
    - Test uppercase normalization for all extracted values
    - Test confidence score calculation for various scenarios
    - _Requirements: 2.1, 2.8, 2.9, 2.10, 3.1, 3.9, 3.10_
  
  - [ ]* 3.6 Write property test for Property 1: PDF File Validation
    - **Property 1: PDF File Validation**
    - **Validates: Requirements 1.1**
    - Generate arbitrary file objects with various MIME types and extensions
    - Assert validation returns true only for PDF MIME type or .pdf extension
    - Use fast-check with 100 iterations
    - _Requirements: 1.1_
  
  - [ ]* 3.7 Write property test for Property 2: Field Extraction Completeness
    - **Property 2: Field Extraction Completeness**
    - **Validates: Requirements 2.1-2.8, 3.1-3.8**
    - Generate arbitrary text with embedded field patterns and keywords
    - Assert extractor finds all fields that have matching patterns present
    - Use fast-check with 100 iterations
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  
  - [ ]* 3.8 Write property test for Property 3: Confidence Score Validity
    - **Property 3: Confidence Score Validity**
    - **Validates: Requirements 2.9**
    - Generate arbitrary extraction results
    - Assert all field confidence scores are numbers in range [0, 1]
    - Assert fields with null values have confidence score of 0
    - Use fast-check with 100 iterations
    - _Requirements: 2.9_
  
  - [ ]* 3.9 Write property test for Property 4: Missing Field Null Marking
    - **Property 4: Missing Field Null Marking**
    - **Validates: Requirements 2.10**
    - Generate arbitrary text without specific field patterns
    - Assert extraction result marks those fields as null
    - Use fast-check with 100 iterations
    - _Requirements: 2.10_
  
  - [ ]* 3.10 Write property test for Property 5: Highest Confidence Selection
    - **Property 5: Highest Confidence Selection**
    - **Validates: Requirements 3.9**
    - Generate text with multiple candidate values for same field
    - Assert extractor selects candidate with highest confidence score
    - Use fast-check with 100 iterations
    - _Requirements: 3.9_
  
  - [ ]* 3.11 Write property test for Property 6: Uppercase Normalization
    - **Property 6: Uppercase Normalization**
    - **Validates: Requirements 3.10**
    - Generate arbitrary extracted field values with mixed case
    - Assert all values are normalized to uppercase in extraction result
    - Use fast-check with 100 iterations
    - _Requirements: 3.10_
  
  - [ ]* 3.12 Write property test for Property 9: Multi-Page Text Aggregation
    - **Property 9: Multi-Page Text Aggregation**
    - **Validates: Requirements 12.1, 12.2, 12.4**
    - Generate arbitrary multi-page PDF text arrays
    - Assert parser extracts from all pages and combines with separators
    - Assert sequential order is preserved
    - Use fast-check with 100 iterations
    - _Requirements: 12.1, 12.2, 12.4_

- [x] 4. Checkpoint - Ensure core services tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement FormFillerService (Adapter Layer)
  - [x] 5.1 Create FormFillerService with toFormData function
    - Create file `app/adapters/services/form-filler.service.js`
    - Implement `toFormData(extraction)` function that returns `FormData`
    - Map all 8 extraction fields to form field names
    - Convert null values to empty strings
    - Preserve non-null values as-is (already uppercase from extractor)
    - Create `_confidenceScores` object mapping field names to confidence values
    - Set `_isAutoFilled` flag to true
    - Ensure ETA is in YYYY-MM-DD format
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_
  
  - [ ]* 5.2 Write unit tests for FormFillerService
    - Test extraction result with all fields maps correctly to form data
    - Test null values convert to empty strings
    - Test non-null values are preserved
    - Test confidence scores map correctly to field names
    - Test _isAutoFilled flag is set to true
    - Test ETA date format is YYYY-MM-DD
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_
  
  - [ ]* 5.3 Write property test for Property 7: Extraction to Form Data Mapping
    - **Property 7: Extraction to Form Data Mapping**
    - **Validates: Requirements 4.2-4.10**
    - Generate arbitrary extraction results
    - Assert all 8 fields map correctly to form data
    - Assert null values convert to empty strings
    - Assert non-null values are preserved
    - Use fast-check with 100 iterations
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

- [x] 6. Enhance ShipmentForm component with confidence indicators
  - [x] 6.1 Add autoFillData and isAutoFilled props to ShipmentForm
    - Modify `app/presentation/components/features/ShipmentForm.jsx`
    - Add optional `autoFillData` prop (FormData with _confidenceScores)
    - Add optional `isAutoFilled` prop (boolean flag)
    - When autoFillData provided, initialize form state with auto-fill values
    - _Requirements: 4.1, 5.1_
  
  - [x] 6.2 Implement confidence indicator display
    - Create helper function `getConfidenceIndicator(score)` that returns indicator type
    - Return "warning" for scores < 0.7 (red)
    - Return "neutral" for scores 0.7-0.9 (yellow)
    - Return "success" for scores > 0.9 (green)
    - Add visual indicator next to each form field based on confidence
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 6.3 Add confidence tooltips and summary badge
    - Add tooltip on hover showing exact confidence score value
    - Create summary badge showing count of low confidence fields (< 0.7)
    - Display info banner when isAutoFilled is true: "Data diisi otomatis dari PDF. Silakan review sebelum save."
    - _Requirements: 5.1, 6.4, 6.5, 8.4_
  
  - [ ]* 6.4 Write property test for Property 8: Confidence Indicator Correctness
    - **Property 8: Confidence Indicator Correctness**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - Generate arbitrary confidence scores in range [0, 1]
    - Assert indicator type is "warning" for < 0.7
    - Assert indicator type is "neutral" for 0.7-0.9
    - Assert indicator type is "success" for > 0.9
    - Use fast-check with 100 iterations
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. Enhance BlScanner component with auto-fill mode
  - [x] 7.1 Add mode toggle and state management
    - Modify `app/presentation/components/features/BlScanner.jsx`
    - Add state: `mode` ("auto-fill" | "click-to-copy"), default "auto-fill"
    - Add state: `isProcessing` (boolean for loading indicator)
    - Add state: `extractionResult` (ExtractionResult object)
    - Add state: `showForm` (boolean to control form modal)
    - Add state: `formInitialData` (FormData for auto-fill)
    - Add toggle button to switch between modes
    - Save mode preference to localStorage
    - Load mode preference from localStorage on mount
    - _Requirements: 7.1, 7.2, 7.3, 7.5_
  
  - [x] 7.2 Implement auto-fill workflow orchestration
    - When file selected in auto-fill mode, trigger parsing automatically
    - Show loading indicator during parsing and extraction
    - Call PDFParserService.parsePDF(file) to extract text
    - If parsing fails, show error message and fallback to click-to-copy mode
    - Call BLExtractorService.extractBLFields(text) to extract fields
    - If no fields found, show warning and fallback to click-to-copy mode
    - Call FormFillerService.toFormData(extraction) to prepare form data
    - Set formInitialData and showForm to true to open ShipmentForm
    - _Requirements: 4.1, 8.3, 9.5_
  
  - [x] 7.3 Add error handling and user feedback
    - Display error message for invalid file type: "File harus berformat PDF."
    - Display error message for parse failure: "Gagal memproses PDF. Pastikan file valid dan berbasis teks."
    - Display error message for no text: "PDF tidak mengandung teks yang dapat dibaca."
    - Display warning for no fields found: "Tidak dapat menemukan field shipment di PDF." with list of missing fields
    - Display warning for low confidence: "Ekstraksi berhasil tapi confidence rendah. Periksa data dengan teliti."
    - Display success message: "Ekstraksi selesai. Form akan dibuka otomatis."
    - Display warning for large files: "File besar. Proses mungkin memakan waktu lebih lama."
    - Show loading indicator during processing
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.4_
  
  - [x] 7.4 Implement automatic fallback to click-to-copy mode
    - When parsing fails completely, automatically switch mode to "click-to-copy"
    - Show notification: "Auto-fill gagal. Beralih ke mode click-to-copy."
    - When extraction finds no fields, automatically switch mode to "click-to-copy"
    - User can manually switch back to auto-fill mode via toggle
    - _Requirements: 7.4_

- [x] 8. Wire ShipmentForm submission to existing workflow
  - [x] 8.1 Connect auto-filled form to createShipment use case
    - When ShipmentForm opened from BlScanner with autoFillData, pass data as initialData
    - Pass isAutoFilled flag to ShipmentForm
    - Use existing onSubmit handler that calls createShipment use case
    - After successful save, show success message and redirect to /shipments
    - _Requirements: 11.2, 11.3, 11.4_
  
  - [x] 8.2 Ensure form validation works with auto-filled data
    - Verify required field validation (blNumber, shipperName, consigneeName, eta)
    - Show validation errors in Indonesian for empty required fields
    - Allow user to edit all auto-filled fields
    - Accept user corrections without additional validation
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 9. Checkpoint - Ensure integration works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Add performance optimizations
  - [x] 10.1 Implement async processing without UI blocking
    - Ensure PDF parsing runs asynchronously
    - Ensure extraction runs asynchronously
    - Use async/await pattern throughout
    - Show loading states during processing
    - _Requirements: 9.5_
  
  - [x] 10.2 Add memory cleanup
    - Revoke PDF file URL after parsing completes: `URL.revokeObjectURL(fileUrl)`
    - Clear extracted text from state after form opens
    - Clear extraction result after form closes
    - _Requirements: 10.4_
  
  - [x] 10.3 Verify performance targets
    - Test PDF parsing (1MB file) completes in < 2 seconds
    - Test field extraction completes in < 1 second
    - Test form filling completes in < 500 milliseconds
    - Test total workflow (1MB PDF) completes in < 4 seconds
    - _Requirements: 1.5, 9.1, 9.2, 9.3_

- [x] 11. Add data privacy safeguards
  - [x] 11.1 Verify client-side only processing
    - Confirm PDFParserService runs entirely in browser
    - Confirm BLExtractorService runs entirely in browser
    - Confirm no PDF or extracted data sent to server
    - Confirm no data saved to IndexedDB or localStorage (except mode preference)
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [x] 12. Integration testing and polish
  - [ ]* 12.1 Write integration test for complete workflow
    - Test: Upload valid PDF → extract → open form → submit → verify shipment created
    - Test: Upload invalid file → verify error message → fallback to click-to-copy
    - Test: Extract with low confidence → verify warnings → manual correction → submit
    - Test: Multi-page PDF → verify all pages processed → verify data extracted
    - Test: Mode switching → verify localStorage persistence → verify behavior changes
    - _Requirements: 1.1, 1.2, 2.1-2.10, 4.1-4.10, 7.1-7.5, 11.1-11.5, 12.1-12.5_
  
  - [x] 12.2 Verify UI consistency with existing design system
    - Ensure BlScanner UI matches existing design patterns
    - Ensure ShipmentForm enhancements match existing styling
    - Ensure error messages use consistent Indonesian language
    - Ensure loading indicators match existing patterns
    - Ensure confidence indicators are visually clear
    - _Requirements: 11.1_
  
  - [x] 12.3 Test with real Bill of Lading PDFs
    - Test with Maersk B/L format
    - Test with MSC B/L format
    - Test with CMA CGM B/L format
    - Test with various multi-page PDFs (2-10 pages)
    - Test with large PDFs (> 3MB)
    - Test with scanned PDFs (should fallback to click-to-copy)
    - Document any pattern adjustments needed for different shipping lines
    - _Requirements: 3.1-3.10, 12.1-12.5_

- [x] 13. Final checkpoint and documentation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all acceptance criteria are met
  - Confirm feature is ready for production use

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check library with minimum 100 iterations
- All code follows Clean Architecture principles with clear layer separation
- All user-facing text must be in Bahasa Indonesia
- Client-side processing ensures data privacy (no server uploads)
- Existing ShipmentForm and BlScanner components are enhanced, not replaced
- Mode toggle allows fallback to click-to-copy if auto-fill fails

## Testing Strategy

**Unit Tests**: Specific examples, edge cases, error conditions
**Property Tests**: Universal correctness properties with 100+ iterations
**Integration Tests**: End-to-end workflow with real PDF files

## Performance Targets

| Operation | Target |
|-----------|--------|
| File validation | < 10ms |
| PDF parsing (1MB) | < 2s |
| Field extraction | < 1s |
| Form filling | < 500ms |
| Total (1MB PDF) | < 4s |
