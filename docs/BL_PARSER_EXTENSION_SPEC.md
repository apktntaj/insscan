# 📋 Bill of Lading Parser Extension - SaaS Platform

**Project Name:** BL Parser Extension  
**Status:** Planning Phase  
**Date:** December 23, 2025  
**Version:** 1.0 - MVP Specification

---

## Project Overview

A browser extension that automatically parses Bill of Lading (B/L) documents to extract key shipment information and enable quick data insertion into custom internal software via keyboard shortcuts. Users upload text-based PDF B/L documents, which are parsed server-side, stored with keyboard mappings, and accessed via shortcut keys while browsing.

**Primary Value:** PPJK (Customs Brokers) and Freight Forwarders can instantly populate shipment forms without manual data entry from B/L documents.

**Target Users:** PPJK/Freight Forwarder offices using CEISA or internal custom software

---

## 1. Architecture & Tech Stack (New Project)

### Backend Service

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | 4.x | Web framework |
| **PostgreSQL** | 14+ | Primary database |
| **Prisma** | 5.x | Database ORM & migrations |
| **pdf-parse** | 1.x | PDF text extraction (text-based PDFs) |
| **JWT (jsonwebtoken)** | 9.x | Token-based authentication |
| **Xendit SDK** | (latest) | Payment gateway integration |
| **Dotenv** | 16.x | Environment configuration |

### Frontend - Website (Next.js)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.x | Frontend framework |
| **React** | 18.x | UI library |
| **TailwindCSS** | 3.x | Styling |
| **daisyUI** | 4.x | Component library |

### Browser Extension

| Technology | Purpose |
|------------|---------|
| **Manifest v3** | Chrome Extension specification |
| **Chrome Storage API** | Local data persistence |
| **Content Scripts** | Inject shortcuts into websites |
| **Service Workers** | Background operations & API communication |

### Hosting & Infrastructure

| Service | Purpose |
|---------|---------|
| **Railway / Render** | Backend API hosting (Node.js) |
| **PostgreSQL Cloud** | Managed database |
| **Vercel** | Website hosting (Next.js) |
| **Chrome Web Store** | Extension distribution |

---

## 2. Database Schema

### Overview

Credit-based monetization with referral system and fraud prevention.

### Core Tables

#### `users`
```sql
- id (UUID PK)
- email (VARCHAR UNIQUE)
- password_hash (VARCHAR)
- credits (INTEGER DEFAULT 10)
- referral_code (VARCHAR UNIQUE) -- e.g., ABC12XY9
- referred_by_code (VARCHAR FK) -- referral code that referred this user
- ip_address (VARCHAR) -- for fraud detection
- created_at, updated_at
```

#### `parsed_documents`
```sql
- id (UUID PK)
- user_id (UUID FK)
- bl_number (VARCHAR)
- shipper, shipper_address, consignee, consignee_address
- notify_party, notify_party_address
- vessel, voyage_number, port_of_loading, port_of_discharge
- description_goods, container_quantity, weight, bl_issued_date
- raw_text (TEXT) -- full PDF text for audit/re-parse
- confidence_scores (JSONB) -- {shipper: 0.95, consignee: 0.87, ...}
- parsed_at, created_at
```

#### `credit_transactions`
```sql
- id (UUID PK)
- user_id (UUID FK)
- type (VARCHAR) -- 'signup' (+10), 'topup', 'usage' (-1), 'referral'
- amount (INTEGER) -- positive or negative
- reference_id (UUID) -- links to document_id or payment_id
- description (TEXT)
- created_at
```

#### `referral_codes`
```sql
- id (UUID PK)
- user_id (UUID FK UNIQUE)
- code (VARCHAR UNIQUE) -- e.g., ABC12XY9
- max_referrals (INTEGER DEFAULT 17)
- referral_count (INTEGER DEFAULT 0)
- created_at
```

#### `referral_rewards` (fraud prevention layer)
```sql
- id (UUID PK)
- referrer_user_id (UUID FK)
- referee_user_id (UUID FK)
- referral_code (VARCHAR FK)
- credits_earned (INTEGER) -- 3/5 of referee's topup
- status (VARCHAR) -- 'pending', 'verified', 'failed'
- payment_amount (INTEGER) -- amount referee paid in IDR
- referee_usage (INTEGER DEFAULT 0) -- credits used by referee
- waiting_period_end (TIMESTAMP) -- 7 days after payment
- email_verified (BOOLEAN DEFAULT FALSE)
- ip_verified (BOOLEAN DEFAULT FALSE)
- device_verified (BOOLEAN DEFAULT FALSE)
- verified_at (TIMESTAMP)
- created_at, updated_at
```

#### `payment_transactions`
```sql
- id (UUID PK)
- user_id (UUID FK)
- amount_idr (INTEGER)
- credits_purchased (INTEGER)
- xendit_invoice_id (VARCHAR UNIQUE)
- xendit_payment_id (VARCHAR)
- status (VARCHAR) -- 'pending', 'paid', 'failed', 'expired'
- payment_method (VARCHAR) -- 'bank_transfer', 'credit_card', etc
- paid_at (TIMESTAMP)
- created_at, updated_at
```

#### `payment_tiers` (configuration)
```sql
- id (UUID PK)
- amount_idr (INTEGER UNIQUE) -- 50000, 150000, 400000, 1000000
- credits (INTEGER) -- 17, 60, 150, 550
- discount_percent (DECIMAL DEFAULT 0)
- is_active (BOOLEAN DEFAULT TRUE)
- display_order (INTEGER)
- created_at
```

---

## 3. Keyboard Shortcuts Mapping

All 15 B/L fields with shortcut codes (trigger: Ctrl+Shift+code):

| Field | Shortcut | Example |
|-------|----------|---------|
| Bill of Lading Number | `bid_num` | HKG1234567 |
| Shipper | `sh` | PT Maju Sejahtera |
| Shipper Address | `sha` | Jln. Ahmad Yani, Jakarta |
| Consignee | `cn` | ABC Company Ltd |
| Consignee Address | `cna` | 15 High Street, London |
| Notify Party | `np` | XYZ Logistics |
| Notify Party Address | `npa` | Pasir Ris, Singapore |
| Vessel | `vs` | EVER GIVEN |
| Voyage Number | `vn` | 2025E |
| Port of Loading | `pol` | TANJUNG PELEPAS |
| Port of Discharge | `pod` | SINGAPORE |
| Description of Goods | `dg` | Electronics - Computer Parts |
| Container Quantity | `cq` | 40 |
| Weight | `wt` | 25000 |
| B/L Issued Date | `bid` | 2025-01-15 |

---

## 4. Backend API Specification (Node.js/Express)

### Authentication Endpoints

#### `POST /api/auth/signup`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "referral_code": "ABC12XY9" // optional
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "credits": 10,
  "referral_code": "XYZ98AB1",
  "token": "jwt_token_here"
}
```

#### `POST /api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "credits": 25,
  "token": "jwt_token_here"
}
```

---

### Document Parsing Endpoints

#### `POST /api/documents/parse`
**Headers:** `Authorization: Bearer <jwt_token>`  
**Request:** Multipart form-data with PDF file

**Response (200):**
```json
{
  "id": "document_uuid",
  "bl_number": "BL123456789",
  "shipper": "PT Maju Sejahtera",
  "shipper_address": "Jln. Ahmad Yani, Jakarta",
  "consignee": "ABC Company Ltd",
  "consignee_address": "15 High Street, London",
  "notify_party": "XYZ Logistics",
  "notify_party_address": "Pasir Ris, Singapore",
  "vessel": "EVER GIVEN",
  "voyage_number": "2025E",
  "port_of_loading": "TANJUNG PELEPAS",
  "port_of_discharge": "SINGAPORE",
  "description_goods": "Electronics - Computer Parts",
  "container_quantity": 40,
  "weight": 25000,
  "bl_issued_date": "2025-01-15",
  "confidence_scores": {
    "bl_number": 0.98,
    "shipper": 0.92,
    "consignee": 0.95,
    "vessel": 0.99
  }
}
```

**Logic:**
- Verify JWT, check user has ≥1 credit
- Use pdf-parse to extract text from PDF
- Apply regex/pattern matching for 15 fields
- Calculate confidence score per field (0-1)
- Deduct 1 credit immediately
- Store parsed document + raw text
- Return data + confidence scores

**Error (402 - Insufficient Credits):**
```json
{
  "error": "Insufficient credits. You have 0 credits.",
  "required_credits": 1
}
```

#### `GET /api/documents`
**Headers:** `Authorization: Bearer <jwt_token>`

**Response (200):**
```json
{
  "documents": [
    {
      "id": "doc_uuid_1",
      "bl_number": "BL123456789",
      "shipper": "PT Maju Sejahtera",
      "parsed_at": "2025-01-20T10:30:00Z"
    }
  ]
}
```

---

### Credit & User Endpoints

#### `GET /api/user/credits`
**Headers:** `Authorization: Bearer <jwt_token>`

**Response (200):**
```json
{
  "credits": 47,
  "email": "user@example.com",
  "referral_code": "XYZ98AB1",
  "recent_transactions": [
    {"type": "signup", "amount": 10, "created_at": "2025-01-15T08:00:00Z"},
    {"type": "topup", "amount": 60, "created_at": "2025-01-18T14:30:00Z"},
    {"type": "usage", "amount": -1, "reference_id": "doc_uuid_1", "created_at": "2025-01-20T10:30:00Z"}
  ]
}
```

---

### Payment Endpoints

#### `GET /api/payments/tiers`
**Response (200):**
```json
{
  "tiers": [
    {"amount_idr": 50000, "credits": 17},
    {"amount_idr": 150000, "credits": 60},
    {"amount_idr": 400000, "credits": 150},
    {"amount_idr": 1000000, "credits": 550}
  ]
}
```

#### `POST /api/payments/create-invoice`
**Headers:** `Authorization: Bearer <jwt_token>`

**Request:**
```json
{"amount_idr": 150000}
```

**Response (201):**
```json
{
  "id": "payment_uuid",
  "xendit_invoice_id": "inv_1234567890",
  "invoice_url": "https://checkout.xendit.co/web/...",
  "amount_idr": 150000,
  "credits": 60,
  "status": "pending",
  "expires_at": "2025-01-21T14:30:00Z"
}
```

#### `POST /api/payments/xendit-webhook`
**Headers:** `X-Xendit-Callback-Token: <secret_token>`

**Request Body (from Xendit):**
```json
{
  "id": "inv_1234567890",
  "payment_id": "pay_1234567890",
  "status": "PAID",
  "paid_amount": 150000
}
```

**Logic:**
- Verify Xendit callback signature
- Find & update payment transaction to 'paid'
- Add credits to user account
- Create credit transaction entry
- **Trigger referral check:**
  - If referee has valid referral code, create `referral_rewards` entry
  - Set status to 'pending'
  - Calculate credits: `60 * (3/5) = 36 credits`
  - Set `waiting_period_end` to 7 days from now
  - Store payment amount & IP for fraud detection

---

### Referral Endpoints

#### `GET /api/referral/check/{code}`
**Response (200):**
```json
{
  "valid": true,
  "referrer_name": "User A",
  "bonus_info": "You'll both receive referral bonuses!"
}
```

#### `GET /api/referral/status`
**Headers:** `Authorization: Bearer <jwt_token>`

**Response (200):**
```json
{
  "referral_code": "XYZ98AB1",
  "total_referrals": 5,
  "max_referrals": 17,
  "total_earnings": 180,
  "referrals": [
    {
      "referee_email": "referee1@example.com",
      "status": "verified",
      "credits_earned": 36,
      "earned_at": "2025-01-20T12:00:00Z"
    }
  ]
}
```

---

## 5. Browser Extension (Chrome Manifest v3)

### manifest.json
```json
{
  "manifest_version": 3,
  "name": "BL Parser - Auto Fill from Bill of Lading",
  "version": "1.0.0",
  "description": "Parse B/L documents and auto-fill forms with keyboard shortcuts",
  "permissions": ["storage", "activeTab", "scripting", "tabs"],
  "host_permissions": ["https://*.ceisa.com/*", "<all_urls>"],
  "background": {"service_worker": "background.js"},
  "action": {"default_popup": "popup.html", "default_title": "BL Parser"},
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "run_at": "document_end"
  }],
  "icons": {
    "16": "images/icon-16.png",
    "48": "images/icon-48.png",
    "128": "images/icon-128.png"
  }
}
```

### Key Components

1. **popup.html** - Login form, document list, shortcuts display
2. **background.js** - JWT token storage, API communication, periodic sync
3. **content.js** - Keyboard shortcut interception (Ctrl+Shift+shortcut) & text injection

### Extension Usage Flow

```
User opens Chrome Extension
  ↓
popup.html shows:
  - Login form (if not authenticated) OR
  - List of parsed B/L documents
  - Select active document
  - Credit balance
  ↓
User clicks "Upload B/L" 
  → File input → Send to /api/documents/parse
  → If success: document appears in list
  → If error (no credits): show "top up needed"
  ↓
User selects B/L as "active"
  → Stored in chrome.storage.local
  ↓
User navigates to CEISA or internal software
  → Opens form (shipper name field, etc)
  → Types "sh" + Ctrl+Shift
  → content.js intercepts → Replaces with shipper value
  → Text auto-filled in form
```

---

## 6. Website (Next.js) Pages

### 1. `/` - Landing Page
- Hero section with value proposition
- Feature showcase (quick parsing, keyboard shortcuts, credit system)
- Pricing tiers with comparison
- FAQ section
- CTA: "Download Extension" button

### 2. `/signup` - Registration
- Email/password form
- Optional referral code input field
- Terms & conditions checkbox
- Form validation (email format, password strength)
- "Sign Up" button

### 3. `/login` - Login
- Email/password form
- "Remember me" checkbox
- "Forgot password?" link (Phase 2)
- "Sign Up" link for new users

### 4. `/dashboard` - User Dashboard
- Current credit balance (prominently displayed)
- Credit usage history (table format)
- Referral code (copy to clipboard button)
- Referral stats (total referrals, earnings, pending verification)
- Link to payment page
- Extension settings/preferences

### 5. `/payments` - Payment Page
- Payment tier selection (visual cards)
- Amount display in IDR + credits you get
- "Select & Pay" button
- Redirect to Xendit checkout
- Order confirmation after payment

---

## 7. Monetization: Credit System

### Sign-up Bonus
- **10 credits** upon registration (free)

### Top-up Pricing
| Amount (IDR) | Credits | Price/Credit | Discount |
|------|---------|--------------|----------|
| 50,000 | 17 | 2,941 | - |
| 150,000 | 60 | 2,500 | ~15% |
| 400,000 | 150 | 2,667 | ~9% |
| 1,000,000 | 550 | 1,818 | ~38% |

### Usage
- **1 credit** per B/L document parsing

### Referral Program
**Incentive:** Referrer gets **3/5** of referee's purchased credits
- Example: Referee buys 60 credits → Referrer earns 36 credits

**Conditions (Fraud Prevention):**
1. **7-day waiting period** after referee's payment (prevent refund abuse)
2. **Minimum 5 credits usage** by referee (prove they actually use service)
3. **Only paid top-ups count** (free 10 initial credits excluded)
4. **Email verified** (bot prevention)
5. **Different IP/device** from referrer (prevent single person farming)
6. **Max 17 referrals** per referrer

**Referral Link Format:** `app.com/join/ABC12XY9` (10-char alphanumeric code)

---

## 8. Implementation Roadmap (MVP - 6 Weeks)

### Phase 1: Backend Core (Week 1-2)
- [ ] Express.js project setup
- [ ] PostgreSQL + Prisma schema & migrations
- [ ] Authentication endpoints
- [ ] PDF parsing service (pdf-parse + field extraction)
- [ ] Document storage endpoints
- [ ] Credit tracking system
- [ ] Error handling & validation

### Phase 2: Referral & Payments (Week 2-3)
- [ ] Referral code generation (10-char alphanumeric)
- [ ] Referral tables & tracking
- [ ] Fraud prevention logic (7-day wait, usage check, IP/device verification)
- [ ] Xendit payment integration
- [ ] Payment webhook handler
- [ ] Referral endpoints
- [ ] Payment tier seeding

### Phase 3: Browser Extension (Week 3-4)
- [ ] Manifest v3 setup
- [ ] Popup UI (HTML/CSS)
- [ ] Login/token storage in chrome.storage
- [ ] Document upload form
- [ ] Document list display
- [ ] Content script + keyboard shortcut interception
- [ ] Text injection to input fields

### Phase 4: Website Frontend (Week 4-5)
- [ ] Landing page design
- [ ] Auth pages (signup/login)
- [ ] Dashboard page
- [ ] Payment page (Xendit integration)
- [ ] Responsive design (mobile-first)

### Phase 5: Testing & Deployment (Week 5-6)
- [ ] Unit & integration tests (backend)
- [ ] Extension testing (Chrome)
- [ ] Security audit
- [ ] Load testing
- [ ] Deploy backend (Railway/Render)
- [ ] Deploy frontend (Vercel)
- [ ] Chrome Web Store submission & approval

---

## 9. Key Architecture Decisions

✅ **Node.js/Express (not Next.js) for backend**
- Express is lightweight for heavy PDF processing
- Cheaper hosting than Vercel
- Can independently scale from frontend

✅ **Text-based PDFs only (MVP)**
- 99%+ extraction accuracy with pdf-parse
- No OCR complexity/cost for Phase 1
- Image-based PDFs in Phase 2 (Tesseract.js or external OCR)

✅ **PostgreSQL with Prisma**
- Full control for fraud detection (IP, device verification)
- Credit/payment transaction accuracy
- Stateless API perfect for extension

✅ **JWT token authentication**
- Stateless for extension (no session required)
- Mobile-friendly (future app support)
- Token rotation possible for security

✅ **Xendit for payments**
- IDR-native (target Indonesian market)
- Webhook verification for security
- Simple integration

✅ **Referral code format: 10-char alphanumeric**
- Short & shareable
- Hard to brute force (vs user IDs)
- Clean URL structure: `/join/ABC12XY9`

---

## 10. Success Metrics (MVP Goals)

- **Extension installs:** 100+ in first month
- **User signups:** 50+
- **Payment conversion:** 20% (10 signups → 2 customers)
- **Referral success rate:** 10% (1 in 10 referrals becomes paying customer)
- **Document parsing accuracy:** >95%
- **Extension rating:** >4.5 stars on Chrome Web Store
- **Monthly recurring users:** 30+

---

## 11. Known Constraints & Future Phases

### MVP (Phase 1)
- Text-based PDFs only
- Single "active" document per user
- Manual credit refills only
- No export/sharing features

### Phase 2 (Future)
- Image-based PDF OCR support (Tesseract.js)
- Multiple active documents
- Subscription option (auto-refill)
- Document sharing between team members
- Bulk document parsing
- Custom shortcut mapping per user

---

**Document Status:** Complete - Ready for Review  
**Last Updated:** December 23, 2025  
**Author:** Discussed with user (Indonesian context)  
**Next Step:** Approve spec → Create GitHub repos → Development kickoff
