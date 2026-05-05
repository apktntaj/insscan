# Requirements Document

## Introduction

The BL Gemini Auto-Scan feature integrates Google's Gemini SDK to automatically extract shipment data from Bill of Lading (BL) documents during the shipment creation process. This feature replaces the existing rule-based extraction system with AI-powered extraction to improve accuracy and handle diverse BL formats.

Currently, the system uses pattern-matching extraction (`bl-extractor.service.js`) which has limited accuracy with non-standard BL formats. The Gemini integration will provide more robust extraction by understanding document context and structure, reducing manual data entry time from 15 minutes to under 1 minute per shipment.

The feature will be integrated into the existing shipment creation workflow, maintaining the current user experience while improving extraction quality behind the scenes.

## Glossary

- **BL_Scanner**: The UI component that handles PDF upload and displays extracted data
- **Gemini_Service**: Infrastructure service that communicates with Google Gemini API
- **Extraction_Engine**: Core service that orchestrates the extraction workflow
- **Shipment_Form**: UI component that displays and allows editing of shipment data
- **PDF_Parser**: Infrastructure service that extracts raw text from PDF files
- **Form_Filler**: Adapter service that transforms extracted data into form-compatible format
- **IndexedDB_Repository**: Infrastructure service that persists shipment data in browser storage
- **API_Key**: Environment variable containing the Gemini API authentication key
- **Extraction_Result**: Data structure containing extracted fields and confidence scores
- **BL_Document**: Bill of Lading PDF file uploaded by the user
- **Confidence_Score**: Numeric value (0-1) indicating extraction reliability for a field
- **Auto_Fill_Mode**: Scanner mode where extraction happens automatically on PDF upload
- **Click_To_Copy_Mode**: Scanner mode where users manually click text to copy values
- **Usage_Tracker**: Service that tracks and enforces daily BL upload limits per user

## Requirements

### Requirement 1: Gemini API Integration

**User Story:** As a developer, I want to integrate the Gemini SDK, so that the system can send BL documents to Gemini for extraction.

#### Acceptance Criteria

1. THE Gemini_Service SHALL accept an API_Key from environment configuration
2. WHEN the API_Key is missing or invalid, THE Gemini_Service SHALL return an error with code "INVALID_API_KEY"
3. THE Gemini_Service SHALL send PDF text content to the Gemini API with a structured extraction prompt
4. WHEN the Gemini API returns a response, THE Gemini_Service SHALL parse the response into an Extraction_Result
5. IF the Gemini API request fails, THEN THE Gemini_Service SHALL return an error with the failure reason
6. THE Gemini_Service SHALL include a timeout of 10 seconds for API requests
7. IF the API request exceeds the timeout, THEN THE Gemini_Service SHALL return an error with code "TIMEOUT"

### Requirement 2: Structured Data Extraction

**User Story:** As a PPJK staff member, I want the system to extract all shipment fields from the BL, so that I don't have to manually type them.

#### Acceptance Criteria

1. THE Extraction_Engine SHALL extract the following fields from BL_Document text: blNumber, shipperName, consigneeName, vesselName, voyage, portOfLoading, portOfDischarge, eta
2. WHEN a field cannot be extracted, THE Extraction_Engine SHALL set the field value to null
3. THE Extraction_Engine SHALL calculate a Confidence_Score for each extracted field
4. THE Extraction_Engine SHALL calculate an overall Confidence_Score as the average of all field scores
5. THE Extraction_Engine SHALL count the number of fields with non-null values as foundFieldsCount
6. THE Extraction_Engine SHALL return an Extraction_Result containing all extracted fields, confidence scores, and metadata

### Requirement 3: Gemini Prompt Engineering

**User Story:** As a developer, I want to provide Gemini with a clear extraction prompt, so that it returns data in the expected format.

#### Acceptance Criteria

1. THE Gemini_Service SHALL send a prompt that specifies all required field names and their expected formats
2. THE Gemini_Service SHALL instruct Gemini to return data in JSON format
3. THE Gemini_Service SHALL include examples of valid BL formats in the prompt
4. THE Gemini_Service SHALL instruct Gemini to return null for fields that cannot be found
5. THE Gemini_Service SHALL request confidence scores for each extracted field
6. THE Gemini_Service SHALL specify date format as DD-MM-YYY for the eta field

### Requirement 4: Response Parsing and Validation

**User Story:** As a developer, I want to validate Gemini responses, so that invalid data doesn't reach the form.

#### Acceptance Criteria

1. THE Gemini_Service SHALL parse the Gemini API JSON response into an Extraction_Result
2. WHEN the response is not valid JSON, THE Gemini_Service SHALL return an error with code "INVALID_RESPONSE_FORMAT"
3. THE Gemini_Service SHALL validate that all expected fields are present in the response
4. WHEN required fields are missing from the response, THE Gemini_Service SHALL set them to null
5. THE Gemini_Service SHALL validate that confidence scores are numeric values between 0 and 1
6. WHEN a confidence score is invalid, THE Gemini_Service SHALL default it to 0.5
7. THE Gemini_Service SHALL validate that the eta field matches the format YYYY-MM-DD if present
8. WHEN the eta format is invalid, THE Gemini_Service SHALL set eta to null

### Requirement 5: Auto-Fill Workflow Integration

**User Story:** As a PPJK staff member, I want the extraction to happen automatically when I upload a BL PDF, so that I can immediately review and save the data.

#### Acceptance Criteria

1. WHEN a user uploads a BL_Document in Auto_Fill_Mode, THE BL_Scanner SHALL trigger the extraction workflow
2. THE BL_Scanner SHALL display a loading indicator while extraction is in progress
3. WHEN extraction completes successfully, THE BL_Scanner SHALL open the Shipment_Form with extracted data
4. WHEN extraction fails, THE BL_Scanner SHALL display an error message and switch to Click_To_Copy_Mode
5. WHEN extraction returns zero fields, THE BL_Scanner SHALL display a warning and switch to Click_To_Copy_Mode
6. THE BL_Scanner SHALL pass the Extraction_Result to the Form_Filler for transformation
7. THE Form_Filler SHALL convert the Extraction_Result into form-compatible data format

### Requirement 6: Fallback to Rule-Based Extraction

**User Story:** As a developer, I want the system to fall back to rule-based extraction when Gemini is unavailable, so that the feature degrades gracefully.

#### Acceptance Criteria

1. WHEN the API_Key is not configured, THE Extraction_Engine SHALL use the existing rule-based extractor
2. WHEN the Gemini API returns an error, THE Extraction_Engine SHALL fall back to the rule-based extractor
3. WHEN the Gemini API times out, THE Extraction_Engine SHALL fall back to the rule-based extractor
4. THE Extraction_Engine SHALL log which extraction method was used for debugging
5. THE BL_Scanner SHALL display which extraction method was used in the status message

### Requirement 7: Environment Configuration

**User Story:** As a developer, I want to configure the Gemini API key via environment variables, so that credentials are not hardcoded.

#### Acceptance Criteria

1. THE Gemini_Service SHALL read the API_Key from the environment variable GEMINI_API_KEY
2. WHEN GEMINI_API_KEY is not set, THE Gemini_Service SHALL return an error with code "MISSING_API_KEY"
3. THE system SHALL include GEMINI_API_KEY in the .env.example file with documentation
4. THE .gitignore file SHALL exclude .env to prevent credential leakage

### Requirement 8: Error Handling and User Feedback

**User Story:** As a PPJK staff member, I want clear error messages when extraction fails, so that I know what to do next.

#### Acceptance Criteria

1. WHEN extraction fails due to missing API_Key, THE BL_Scanner SHALL display "Ada masalah dengan sistem. Silakan hubungi admin."
2. WHEN extraction fails due to API timeout, THE BL_Scanner SHALL display "Koneksi terputus. Coba lagi atau isi manual ya."
3. WHEN extraction fails due to invalid PDF, THE BL_Scanner SHALL display "File tidak bisa dibaca. Coba file lain atau isi manual."
4. WHEN extraction returns low confidence (< 0.5), THE BL_Scanner SHALL display "Data berhasil diambil. Tolong cek lagi ya, mungkin ada yang kurang tepat."
5. WHEN extraction succeeds with high confidence (≥ 0.5), THE BL_Scanner SHALL display "Berhasil! Form akan terbuka otomatis."
6. THE BL_Scanner SHALL display all error messages in Bahasa Indonesia
7. THE BL_Scanner SHALL log technical error details (error codes, stack traces) for debugging without displaying them to users

### Requirement 9: Confidence Score Display

**User Story:** As a PPJK staff member, I want to see confidence scores for extracted fields, so that I know which fields to double-check.

#### Acceptance Criteria

1. THE Shipment_Form SHALL display a confidence indicator for each auto-filled field
2. WHEN a field has confidence < 0.5, THE Shipment_Form SHALL highlight the field in yellow
3. WHEN a field has confidence < 0.3, THE Shipment_Form SHALL highlight the field in red
4. WHEN a field has confidence ≥ 0.5, THE Shipment_Form SHALL display the field normally
5. THE Shipment_Form SHALL display the overall Confidence_Score at the top of the form
6. THE Shipment_Form SHALL display a tooltip explaining confidence scores when hovering over indicators

### Requirement 10: Performance and Rate Limiting

**User Story:** As a developer, I want to manage API usage, so that costs remain predictable and the system doesn't exceed rate limits.

#### Acceptance Criteria

1. THE Gemini_Service SHALL limit requests to 1 request per second
2. WHEN a request is made within 1 second of the previous request, THE Gemini_Service SHALL queue the request
3. THE Gemini_Service SHALL log each API request with timestamp and token count for monitoring
4. THE Gemini_Service SHALL include request metadata (file size, page count) in logs
5. WHEN the API returns a rate limit error, THE Gemini_Service SHALL return an error with code "RATE_LIMIT_EXCEEDED"

### Requirement 11: Data Privacy and Security

**User Story:** As a PPJK staff member, I want my BL data to remain private, so that sensitive shipment information is protected.

#### Acceptance Criteria

1. THE Gemini_Service SHALL send only text content to the Gemini API, not the original PDF file
2. THE Gemini_Service SHALL not log or store extracted field values
3. THE Gemini_Service SHALL clear PDF text from memory after extraction completes
4. THE BL_Scanner SHALL clear the Extraction_Result from memory after the form is saved
5. THE system SHALL not persist API_Key in browser storage or logs
6. THE Gemini_Service SHALL use HTTPS for all API requests

### Requirement 12: Testing and Validation

**User Story:** As a developer, I want to test the Gemini integration with sample BLs, so that I can verify extraction accuracy.

#### Acceptance Criteria

1. THE system SHALL include a test suite for the Gemini_Service with mock API responses
2. THE system SHALL include a test suite for the Extraction_Engine with sample BL text
3. THE test suite SHALL include at least 3 different BL formats (standard, table-based, multi-line)
4. THE test suite SHALL verify that all 8 required fields are extracted correctly
5. THE test suite SHALL verify that confidence scores are calculated correctly
6. THE test suite SHALL verify that error handling works for all error codes
7. THE test suite SHALL verify that fallback to rule-based extraction works when Gemini fails

### Requirement 13: Daily Usage Limit

**User Story:** As a system administrator, I want to limit BL uploads to 5 per user per day, so that the system prevents abuse and manages API costs.

#### Acceptance Criteria

1. THE Usage_Tracker SHALL track the number of BL extractions per user per day
2. THE Usage_Tracker SHALL store usage counts in browser storage (localStorage or IndexedDB)
3. WHEN a user attempts to upload a BL_Document, THE BL_Scanner SHALL check the current day's usage count
4. WHEN the usage count is less than 5, THE BL_Scanner SHALL allow the extraction to proceed
5. WHEN the usage count reaches 5, THE BL_Scanner SHALL block the upload and display "Batas harian tercapai (5 BL per hari). Coba lagi besok ya."
6. THE Usage_Tracker SHALL reset the usage count at midnight local time (00:00 WIB)
7. THE Usage_Tracker SHALL increment the usage count only after a successful extraction attempt, not on failures
8. THE BL_Scanner SHALL display the remaining upload count (e.g., "Sisa upload hari ini: 3/5") below the upload button
