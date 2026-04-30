# Requirements Document

## Introduction

The Shipment Management feature provides a simple, browser-based record system for tracking shipments with automated notifications. This feature enables PPJK and freight forwarder staff t o record shipment information, manage up to 500 total shipment records, export records to Excel (which clears all records), and receive automated notifications one working day before ETA or custom dates. The system uses browser-local storage (IndexedDB) and is designed for single-user use.

## Glossary

- **Shipment_Manager**: The browser-based system component that manages shipment records
- **Storage_Service**: The IndexedDB-based persistence layer for shipment data
- **Export_Service**: The component responsible for generating Excel files from shipment records
- **Notification_Service**: The component that sends automated notifications based on dates
- **Max_Record_Limit**: The maximum total number of shipment records allowed in the system at any time (500 records)
- **Record_Counter**: The component tracking the current total number of shipment records in the system
- **ETA**: Estimated Time of Arrival for a shipment
- **Custom_Date**: A user-specified date for notification purposes
- **B/L_Number**: Bill of Lading number — a unique identifier issued by the carrier for a shipment
- **Voyage**: The vessel voyage number associated with a shipment
- **Alias**: A short, user-friendly name assigned to a shipment record for easy identification and recall
- **Notes**: A free-text field for storing additional remarks or context about a shipment
- **Working_Day**: A day that is not a Saturday, Sunday, or public holiday; used to calculate H-1 notification timing
- **H-1**: One working day before the target date (ETA or Custom_Date)

## Requirements

### Requirement 1: Shipment Record Creation

**User Story:** As an operational staff member, I want to create shipment records with essential information, so that I can track my shipments in the browser.

#### Acceptance Criteria

1. THE Shipment_Manager SHALL allow creation of shipment records with the following fields: shipment number (required), B/L_Number (required), shipper name (required), consignee name (required), vessel name, voyage, port of loading, port of discharge, ETA, custom notification date, alias, and notes
2. WHEN a shipment record is created, THE Storage_Service SHALL persist the record to IndexedDB
3. WHEN a shipment record is created, THE Record_Counter SHALL increment the current shipment count
4. IF the current shipment count equals or exceeds the Max_Record_Limit, THEN THE Shipment_Manager SHALL prevent creation of new shipment records and display a message instructing the user to export records before adding more
5. WHEN a shipment record is created, THE Shipment_Manager SHALL validate that all required fields contain valid data
6. WHEN a shipment record is created, THE Shipment_Manager SHALL validate that the shipment number is unique among all existing records
7. WHEN a shipment record is created, THE Shipment_Manager SHALL validate that the B/L_Number is unique among all existing records

### Requirement 2: Total Record Limit Enforcement

**User Story:** As an operational staff member, I want to be informed when the record limit is reached, so that I know to export and clear records before adding more.

#### Acceptance Criteria

1. THE Record_Counter SHALL track the total number of shipment records currently stored in the system
2. WHEN the Record_Counter reaches 500, THE Shipment_Manager SHALL display a warning message indicating the maximum record limit has been reached and that an export is required to add new records
3. WHEN the Record_Counter equals or exceeds 500, THE Shipment_Manager SHALL disable the create shipment button
4. THE Shipment_Manager SHALL display the current count and remaining capacity (e.g., "450/500 records used")

### Requirement 3: Shipment Record Viewing

**User Story:** As an operational staff member, I want to view my shipment records sorted by nearest ETA, so that I can quickly identify upcoming shipments.

#### Acceptance Criteria

1. THE Shipment_Manager SHALL display all shipment records in a table or list view
2. THE Shipment_Manager SHALL sort shipment records by ETA in ascending order by default (nearest ETA first)
3. THE Shipment_Manager SHALL allow users to search shipment records by B/L_Number, shipper name, consignee name, or alias
4. WHEN a search query is entered, THE Shipment_Manager SHALL display only records matching the query across the searchable fields

### Requirement 4: Shipment Record Editing

**User Story:** As an operational staff member, I want to edit shipment records, so that I can correct or update information over time.

#### Acceptance Criteria

1. THE Shipment_Manager SHALL allow users to edit existing shipment records
2. WHEN a user attempts to edit a shipment record, THE Shipment_Manager SHALL allow modification of all fields except shipment number and B/L_Number
3. THE Shipment_Manager SHALL display shipment number and B/L_Number as read-only fields in the edit form
4. WHEN an edited shipment record is saved, THE Storage_Service SHALL update the record in IndexedDB

### Requirement 5: Shipment Record Termination

**User Story:** As an operational staff member, I want to terminate a shipment record entered with incorrect immutable fields, so that I can remove erroneous records from the system.

#### Acceptance Criteria

1. THE Shipment_Manager SHALL provide a terminate action for shipment records to handle cases where the shipment number or B/L_Number was entered incorrectly
2. WHEN a user initiates termination of a shipment record, THE Shipment_Manager SHALL display a confirmation dialog requiring explicit confirmation before proceeding
3. WHEN a termination is confirmed, THE Storage_Service SHALL mark the record as terminated and remove it from the active record list
4. WHEN a record is terminated, THE Record_Counter SHALL decrement the current shipment count
5. THE Shipment_Manager SHALL NOT provide a general delete function for shipment records; termination is the only removal mechanism outside of export

### Requirement 6: Excel Export Functionality

**User Story:** As an operational staff member, I want to export all shipment records to Excel, so that I can share data with colleagues and clear the system for new records.

#### Acceptance Criteria

1. THE Shipment_Manager SHALL provide an export button that triggers Excel file generation
2. WHEN the export button is clicked, THE Shipment_Manager SHALL display a confirmation dialog warning that all records will be permanently deleted after export
3. WHEN the export is confirmed, THE Export_Service SHALL generate an Excel file containing all shipment records with all fields
4. THE Export_Service SHALL format the Excel file with column headers matching the shipment field names
5. THE Export_Service SHALL name the exported file with a timestamp (e.g., "shipments_export_2025-01-15.xlsx")
6. WHEN the Excel export completes successfully, THE Storage_Service SHALL delete all shipment records from IndexedDB
7. WHEN the Excel export completes successfully, THE Record_Counter SHALL reset to zero
8. IF the Excel export fails, THEN THE Shipment_Manager SHALL display an error message and SHALL NOT delete any records from IndexedDB

### Requirement 7: Automated Notification System

**User Story:** As an operational staff member, I want to receive automated notifications one working day before ETA or custom dates, so that I can prepare and take timely action on shipments.

#### Acceptance Criteria

1. WHEN a shipment record contains an ETA date, THE Notification_Service SHALL schedule a notification for H-1 (one Working_Day before the ETA)
2. WHEN a shipment record contains a Custom_Date, THE Notification_Service SHALL schedule a notification for H-1 (one Working_Day before the Custom_Date)
3. WHEN the current date matches a scheduled H-1 notification date, THE Notification_Service SHALL display a browser notification containing the shipment number, alias (if set), and the relevant date
4. THE Notification_Service SHALL check for due notifications every 3 hours
5. WHEN a user inputs or updates an ETA or Custom_Date, THE Notification_Service SHALL update the notification schedule accordingly
6. THE Notification_Service SHALL request browser notification permissions on first use
7. IF browser notifications are not permitted, THEN THE Notification_Service SHALL display in-app notifications instead

### Requirement 8: Browser Storage Management

**User Story:** As an operational staff member, I want my shipment data stored locally in the browser, so that I can access it without requiring a backend server.

#### Acceptance Criteria

1. THE Storage_Service SHALL use IndexedDB as the primary storage mechanism
2. THE Storage_Service SHALL create a database named "shipment_management_db" with version 1
3. THE Storage_Service SHALL create an object store named "shipments" with an auto-incrementing primary key
4. THE Storage_Service SHALL create indexes for shipment_number, bl_number, eta, alias, and custom_notification_date fields
5. WHEN the browser storage quota is exceeded, THE Storage_Service SHALL display an error message to the user
6. THE Storage_Service SHALL provide methods for create, read, update, list, and terminate operations on shipment records

### Requirement 9: Data Validation and Error Handling

**User Story:** As an operational staff member, I want the system to validate my input data, so that I can avoid errors and maintain data quality.

#### Acceptance Criteria

1. WHEN a user submits a shipment record, THE Shipment_Manager SHALL validate that the shipment number is unique within all existing records
2. WHEN a user submits a shipment record, THE Shipment_Manager SHALL validate that the B/L_Number is unique within all existing records
3. WHEN a user inputs an ETA or Custom_Date, THE Shipment_Manager SHALL validate that the date is in a valid format (ISO 8601 or locale-specific)
4. IF a required field is empty, THEN THE Shipment_Manager SHALL display a validation error message and prevent record creation
5. IF a date field contains an invalid date, THEN THE Shipment_Manager SHALL display a validation error message
6. WHEN a storage operation fails, THE Shipment_Manager SHALL display a user-friendly error message with guidance on how to resolve the issue

### Requirement 10: User Interface and Experience

**User Story:** As an operational staff member, I want an intuitive and responsive interface, so that I can efficiently manage shipment records.

#### Acceptance Criteria

1. THE Shipment_Manager SHALL provide a form interface for creating and editing shipment records
2. THE Shipment_Manager SHALL use DaisyUI components consistent with the existing InsScan design system
3. THE Shipment_Manager SHALL display loading indicators during storage operations and Excel export
4. THE Shipment_Manager SHALL display success messages after successful create, update, terminate, and export operations
5. THE Shipment_Manager SHALL be responsive and functional on desktop browsers (Chrome, Firefox, Safari, Edge)

### Requirement 11: ETA sebagai Field Wajib

**User Story:** As an operational staff member, I want ETA to be a required field when creating or editing a shipment, so that the dashboard and alert engine always have the data needed to evaluate shipment status accurately.

#### Acceptance Criteria

1. WHEN a user submits a shipment creation form, THE Shipment_Manager SHALL validate that the ETA field contains a valid date value
2. IF the ETA field is empty or contains an invalid date when creating a shipment, THEN THE Shipment_Manager SHALL display a validation error message and prevent record creation
3. WHEN a user submits a shipment edit form, THE Shipment_Manager SHALL validate that the ETA field contains a valid date value
4. IF the ETA field is empty or contains an invalid date when editing a shipment, THEN THE Shipment_Manager SHALL display a validation error message and prevent the update from being saved
5. THE Shipment_Manager SHALL visually mark the ETA field as required (e.g., with an asterisk or "required" label) in both the create and edit forms
