# Implementation Plan: Shipment Management

## Overview

Implement a browser-local shipment tracking module following Clean Architecture. Layers are built in dependency order: entities → ports → use cases → infrastructure → adapters → presentation → route.

## Tasks

- [x] 1. Set up core entities and ports
  - [x] 1.1 Create `app/core/entities/shipment.js` — Shipment entity factory, validation helpers (`isValidDate`, `isRequiredFieldPresent`), and status constants
    - _Requirements: 1.1, 1.5, 1.6, 1.7, 9.3, 9.4_
  - [x] 1.2 Create `app/core/entities/public-holidays.js` — hardcoded Indonesian public holidays list for current year and `getHMinusOne(targetDate)` helper
    - _Requirements: 7.1, 7.2_
  - [ ]* 1.3 Write property test for `getHMinusOne` (Property 15: H-1 is always a working day before the target date)
    - **Property 15: H-1 is always a working day before the target date**
    - **Validates: Requirements 7.1, 7.2**
  - [ ]* 1.4 Write property test for `isValidDate` (Property 17: Date validation correctly classifies inputs)
    - **Property 17: Date validation correctly classifies inputs**
    - **Validates: Requirements 9.3, 9.5**
  - [x] 1.5 Create `app/core/ports/shipment-repository.port.js` — JSDoc typedef for `ShipmentRepository` interface and `validateShipmentRepository` guard
    - _Requirements: 8.6_
  - [x] 1.6 Create `app/core/ports/notification-service.port.js` — JSDoc typedef for `NotificationServicePort` and `validateNotificationService` guard
    - _Requirements: 7.4, 7.6_

- [x] 2. Implement use cases
  - [x] 2.1 Create `app/core/use-cases/create-shipment.js` — validate required fields, enforce 500-record cap, check uniqueness, persist via repository port; return `{ ok, data/error }` shape
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.3, 9.1, 9.2, 9.4_
  - [ ]* 2.2 Write property test for `createShipment` — Property 1 (round-trip), Property 2 (increments count), Property 3 (limit blocks), Property 4 (required field validation), Property 5 (uniqueness)
    - **Property 1: Shipment creation round-trip — Validates: Requirements 1.1, 1.2**
    - **Property 2: Create increments active count — Validates: Requirements 1.3, 2.1**
    - **Property 3: Record limit blocks creation — Validates: Requirements 1.4, 2.3**
    - **Property 4: Required field validation rejects incomplete inputs — Validates: Requirements 1.5, 9.4**
    - **Property 5: Shipment number and B/L number uniqueness — Validates: Requirements 1.6, 1.7, 9.1, 9.2**
  - [x] 2.3 Create `app/core/use-cases/edit-shipment.js` — strip immutable fields from update payload, persist via repository port; return `{ ok, data/error }` shape
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 2.4 Write property test for `editShipment` — Property 8 (immutable fields preserved) and Property 9 (edit round-trip)
    - **Property 8: Immutable fields cannot be changed via edit — Validates: Requirements 4.2**
    - **Property 9: Edit round-trip persists mutable changes — Validates: Requirements 4.4**
  - [x] 2.5 Create `app/core/use-cases/terminate-shipment.js` — mark record terminated via repository port; return `{ ok, error }` shape
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 2.6 Write property test for `terminateShipment` — Property 10 (excluded from active list) and Property 11 (decrements count)
    - **Property 10: Terminated record is excluded from active list — Validates: Requirements 5.3**
    - **Property 11: Terminate decrements active count — Validates: Requirements 5.4**
  - [x] 2.7 Create `app/core/use-cases/list-shipments.js` — fetch active records sorted by ETA asc (nulls last), apply optional search query across blNumber/shipperName/consigneeName/alias
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 2.8 Write property test for `listShipments` — Property 6 (sorted by ETA ascending) and Property 7 (search returns only matching records)
    - **Property 6: List is sorted by ETA ascending — Validates: Requirements 3.2**
    - **Property 7: Search returns only matching records — Validates: Requirements 3.3, 3.4**
  - [x] 2.9 Create `app/core/use-cases/export-shipments.js` — fetch all records, build Excel rows via presenter, call xlsx download, delete all on success; abort delete on failure; return `{ ok, error }` shape
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  - [ ]* 2.10 Write property test for `exportShipments` — Property 12 (export completeness), Property 13 (clears records), Property 14 (failed export preserves records)
    - **Property 12: Export output is complete and well-structured — Validates: Requirements 6.3, 6.4**
    - **Property 13: Successful export clears all records — Validates: Requirements 6.6, 6.7**
    - **Property 14: Failed export leaves records intact — Validates: Requirements 6.8**
  - [x] 2.11 Create `app/core/use-cases/schedule-notifications.js` — start 3-hour polling loop; on each tick compute H-1 for ETA and customNotificationDate, fire notification if due and not already sent today (sessionStorage dedup)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ]* 2.12 Write property test for notification due check — Property 16 (notification due check is correct)
    - **Property 16: Notification due check is correct — Validates: Requirements 7.3**

- [x] 3. Checkpoint — core logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement infrastructure services
  - [x] 4.1 Create `app/infrastructure/services/indexeddb.service.js` — open/create `shipment_management_db` v1 with `shipments` object store and all indexes; implement `create`, `update`, `terminate`, `findById`, `listActive`, `countActive`, `listAll`, `deleteAll`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [x] 4.2 Create `app/infrastructure/services/browser-notification.service.js` — `requestPermission`, `scheduleForShipment`, `startPolling`, `stopPolling`; fallback to in-app alert when permission denied
    - _Requirements: 7.3, 7.4, 7.6, 7.7_

- [x] 5. Implement adapters
  - [x] 5.1 Create `app/adapters/presenters/shipment.presenter.js` — `toViewModel(shipment)`, `toExcelRow(shipment)`, `toExcelRows(shipments)`; format dates for display, resolve "—" for nulls
    - _Requirements: 6.3, 6.4, 10.1_
  - [x] 5.2 Create `app/adapters/controllers/shipment.controller.js` — factory `createShipmentController(repo, notifService)` wiring all use cases; export singleton `shipmentController`
    - _Requirements: 1.1, 3.1, 4.1, 5.1, 6.1, 7.4_

- [x] 6. Implement presentation layer
  - [x] 6.1 Create `app/presentation/hooks/useShipments.js` — `shipments`, `count`, `loading`, `error` state; expose `createShipment`, `editShipment`, `terminateShipment`, `exportShipments`, `refresh`, `setQuery`
    - _Requirements: 10.3, 10.4_
  - [x] 6.2 Create `app/presentation/components/features/ShipmentForm.jsx` — controlled form for create/edit; immutable fields rendered as `readOnly` in edit mode; inline validation errors; loading state on submit
    - _Requirements: 1.1, 4.2, 4.3, 9.3, 9.4, 9.5, 10.1, 10.2_
  - [x] 6.3 Create `app/presentation/components/features/ShipmentTable.jsx` — table rendering sorted/filtered shipments; search input; terminate action per row with confirmation; loading skeleton
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 10.2_
  - [x] 6.4 Create `app/presentation/components/features/ShipmentExportButton.jsx` — export button + DaisyUI confirmation modal warning about record deletion; calls `exportShipments`; shows loading and error states
    - _Requirements: 6.1, 6.2, 6.8, 10.2, 10.3_
  - [x] 6.5 Create `app/presentation/components/features/ShipmentManager.jsx` — root feature component; record counter badge (`N/500`); limit warning banner; renders ShipmentTable, ShipmentForm modal, ShipmentExportButton; initialises notification scheduling
    - _Requirements: 2.2, 2.3, 2.4, 7.4, 10.1, 10.2, 10.4_

- [x] 7. Wire route and navigation
  - [x] 7.1 Create `app/shipments/page.jsx` — Next.js App Router page rendering `<ShipmentManager />`
    - _Requirements: 10.1_
  - [x] 7.2 Update `app/presentation/components/index.js` to export `ShipmentManager`, `ShipmentTable`, `ShipmentForm`, `ShipmentExportButton`
    - _Requirements: 10.1_
  - [x] 7.3 Update `app/presentation/config/nav-links.js` to add Shipments nav link (`/shipments`)
    - _Requirements: 10.1_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use **fast-check** with minimum 100 iterations per property
- Unit tests validate specific examples and edge cases
