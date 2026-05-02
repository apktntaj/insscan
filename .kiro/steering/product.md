---
inclusion: always
---

# Product Overview

**Pesisir** (branded as InsScan internally) is a browser-based operational platform for PPJK (customs broker) and freight forwarder staff in Indonesia. The core value proposition is eliminating manual data entry from Bill of Lading documents and centralizing shipment tracking.

The UI language is **Bahasa Indonesia**. All user-facing text, labels, and copy must be written in Indonesian.

## Live Modules

- **Cek Lartas** (`/cek-lartas`) — Batch HS code lookup against the INSW API. Users upload an Excel file with HS codes and get back tariff rates, import taxes, and LARTAS (import restriction) status for each code.
- **Shipments** (`/shipments`) — Shipment management dashboard. Users track BL numbers, shippers, and ETA. Data is stored in the browser (IndexedDB), not on a server. Supports Excel export.
- **Feedback** (`/feedback`) — Roadmap board and user feedback channel via WhatsApp. Configured entirely from `app/presentation/config/feedback-config.js`.

## In-Progress / Planned

- **BL Scanner** — Parses Bill of Lading PDFs to auto-fill shipment data. Target: reduce entry time from 15 minutes to seconds.
- **ETA Notifications** — Browser notifications when vessel ETA changes or approaches.
- **BL Parser Extension** — Future pivot to a browser extension that auto-fills CEISA and internal PPJK software forms. Uses credit-based monetization (1 credit = 1 parse).

## Target Users

Operational staff at PPJK companies and freight forwarder teams who currently manage shipment data across email, WhatsApp, and Excel spreadsheets.

## Key Constraints

- **Client-side data storage**: Shipment data lives in IndexedDB in the user's browser. No server-side persistence for shipment records. Do not introduce server-side storage for this data without explicit instruction.
- **INSW API dependency**: HS code and LARTAS data comes from the Indonesian National Single Window (INSW) API. Authenticated (CMS token) and public endpoints both exist — see `app/infrastructure/services/insw-api.service.js`.
- **Static config pattern**: Feature-specific static data (roadmap items, WhatsApp number, QRIS path) lives in `app/presentation/config/`. Components must read from config files — never hardcode this data inline.
- **No active auth or database**: `next-auth` and `@prisma/client` are installed but not actively used. Do not assume auth or DB are available unless explicitly enabled.
