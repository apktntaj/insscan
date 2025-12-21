# 📖 Technical Requirements Document (TRD)

**Project:** Shipment ETA Tracking Platform  
**Version:** 1.0  
**Date:** December 20, 2025  
**Status:** Draft

---

## 1. Tech Stack Overview

### Frontend

| Technology                | Version | Purpose                                 |
| ------------------------- | ------- | --------------------------------------- |
| **Next.js**               | 14.x    | React framework dengan App Router       |
| **daisyUI**               | 4.x     | Component library berbasis Tailwind CSS |
| **Tailwind CSS**          | 3.x     | Utility-first CSS framework             |
| **React Hook Form**       | 7.x     | Form handling & validation              |
| **Zod**                   | 3.x     | Schema validation                       |
| **@supabase/supabase-js** | 2.x     | Supabase client SDK                     |

### Backend & Database

| Technology                  | Purpose                         |
| --------------------------- | ------------------------------- |
| **Supabase**                | Backend-as-a-Service (BaaS)     |
| **PostgreSQL**              | Database (via Supabase)         |
| **Supabase Auth**           | Authentication & Authorization  |
| **Supabase Storage**        | File storage untuk BL documents |
| **Supabase Edge Functions** | Serverless functions            |
| **Supabase Realtime**       | Real-time subscriptions         |

### Third-Party Services

| Service                                      | Purpose                                   |
| -------------------------------------------- | ----------------------------------------- |
| **OpenAI GPT-4 Vision / Google Document AI** | OCR & data extraction dari Bill of Lading |
| **Xendit**                                   | Payment gateway untuk subscription        |
| **Shipping Line APIs**                       | Fetch ETA data (prioritas)                |
| **Puppeteer/Playwright**                     | Web scraping ETA (fallback)               |

### Infrastructure

| Service            | Purpose                     |
| ------------------ | --------------------------- |
| **Vercel**         | Hosting Next.js application |
| **Supabase Cloud** | Managed database & backend  |
| **GitHub Actions** | CI/CD pipeline              |

---

## 2. Database Schema (Supabase PostgreSQL)

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────────┐     ┌────────────────────┐
│     users       │     │    organizations    │     │   subscriptions    │
├─────────────────┤     ├─────────────────────┤     ├────────────────────┤
│ id (uuid) PK    │────<│ id (uuid) PK        │────<│ id (uuid) PK       │
│ email           │     │ name                │     │ organization_id FK │
│ full_name       │     │ address             │     │ plan_id FK         │
│ avatar_url      │     │ phone               │     │ status             │
│ role            │     │ created_at          │     │ current_period_end │
│ organization_id │>────│ updated_at          │     │ xendit_customer_id │
│ created_at      │     └─────────────────────┘     │ created_at         │
│ updated_at      │                                 └────────────────────┘
└─────────────────┘
         │
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                          shipments                               │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid) PK                                                     │
│ organization_id (uuid) FK                                        │
│ bl_number (varchar) - UNIQUE within org                         │
│ shipper_name (varchar)                                          │
│ shipper_address (text)                                          │
│ consignee_name (varchar)                                        │
│ consignee_address (text)                                        │
│ notify_party_name (varchar)                                     │
│ notify_party_address (text)                                     │
│ vessel_name (varchar)                                           │
│ voyage_number (varchar)                                         │
│ port_of_loading (varchar)                                       │
│ port_of_discharge (varchar)                                     │
│ description_of_goods (text)                                     │
│ container_quantity (integer)                                    │
│ weight (decimal)                                                │
│ weight_unit (varchar) - KG/LBS                                  │
│ bl_issued_date (date)                                           │
│ eta (timestamp with timezone)                                   │
│ eta_source (varchar) - api/scraping/manual                      │
│ eta_last_updated (timestamp)                                    │
│ status (varchar) - on_schedule/eta_changed/arriving_soon/arrived/completed │
│ created_by (uuid) FK -> users                                   │
│ created_at (timestamp)                                          │
│ updated_at (timestamp)                                          │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│    shipment_documents       │     │      eta_history            │
├─────────────────────────────┤     ├─────────────────────────────┤
│ id (uuid) PK                │     │ id (uuid) PK                │
│ shipment_id (uuid) FK       │     │ shipment_id (uuid) FK       │
│ file_name (varchar)         │     │ previous_eta (timestamp)    │
│ file_path (varchar)         │     │ new_eta (timestamp)         │
│ file_type (varchar)         │     │ source (varchar)            │
│ file_size (integer)         │     │ created_at (timestamp)      │
│ document_type (varchar)     │     └─────────────────────────────┘
│ created_at (timestamp)      │
└─────────────────────────────┘

┌─────────────────────────────┐     ┌─────────────────────────────┐
│         plans               │     │    payment_history          │
├─────────────────────────────┤     ├─────────────────────────────┤
│ id (uuid) PK                │     │ id (uuid) PK                │
│ name (varchar)              │     │ organization_id (uuid) FK   │
│ price (decimal)             │     │ subscription_id (uuid) FK   │
│ currency (varchar)          │     │ xendit_invoice_id (varchar) │
│ billing_period (varchar)    │     │ amount (decimal)            │
│ shipment_limit (integer)    │     │ currency (varchar)          │
│ features (jsonb)            │     │ status (varchar)            │
│ is_active (boolean)         │     │ paid_at (timestamp)         │
│ created_at (timestamp)      │     │ created_at (timestamp)      │
└─────────────────────────────┘     └─────────────────────────────┘

┌─────────────────────────────┐
│       credits               │
├─────────────────────────────┤
│ id (uuid) PK                │
│ organization_id (uuid) FK   │
│ balance (integer)           │
│ created_at (timestamp)      │
│ updated_at (timestamp)      │
└─────────────────────────────┘

┌─────────────────────────────┐
│    credit_transactions      │
├─────────────────────────────┤
│ id (uuid) PK                │
│ organization_id (uuid) FK   │
│ type (varchar) - topup/usage│
│ amount (integer)            │
│ description (text)          │
│ reference_id (uuid)         │
│ reference_type (varchar)    │
│ created_at (timestamp)      │
└─────────────────────────────┘
```

### SQL Migration Scripts

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    billing_period VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    shipment_limit INTEGER, -- NULL for unlimited
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'member', -- admin, member
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, past_due, trialing
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    xendit_customer_id VARCHAR(255),
    xendit_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments table
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    bl_number VARCHAR(100) NOT NULL,
    shipper_name VARCHAR(255),
    shipper_address TEXT,
    consignee_name VARCHAR(255),
    consignee_address TEXT,
    notify_party_name VARCHAR(255),
    notify_party_address TEXT,
    vessel_name VARCHAR(255),
    voyage_number VARCHAR(100),
    port_of_loading VARCHAR(255),
    port_of_discharge VARCHAR(255),
    description_of_goods TEXT,
    container_quantity INTEGER,
    weight DECIMAL(12, 2),
    weight_unit VARCHAR(10) DEFAULT 'KG',
    bl_issued_date DATE,
    eta TIMESTAMP WITH TIME ZONE,
    eta_source VARCHAR(50), -- api, scraping, manual
    eta_last_updated TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'on_schedule', -- on_schedule, eta_changed, arriving_soon, arrived, completed
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, bl_number)
);

-- Shipment Documents table
CREATE TABLE shipment_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    document_type VARCHAR(100) DEFAULT 'bill_of_lading', -- bill_of_lading, invoice, packing_list, etc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ETA History table
CREATE TABLE eta_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    previous_eta TIMESTAMP WITH TIME ZONE,
    new_eta TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credits table
CREATE TABLE credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Transactions table
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- topup, usage
    amount INTEGER NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type VARCHAR(50), -- shipment, subscription, etc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment History table
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    xendit_invoice_id VARCHAR(255),
    xendit_payment_id VARCHAR(255),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    status VARCHAR(50), -- pending, paid, failed, expired
    payment_method VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_shipments_organization ON shipments(organization_id);
CREATE INDEX idx_shipments_bl_number ON shipments(bl_number);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_eta ON shipments(eta);
CREATE INDEX idx_eta_history_shipment ON eta_history(shipment_id);
CREATE INDEX idx_credit_transactions_org ON credit_transactions(organization_id);
CREATE INDEX idx_payment_history_org ON payment_history(organization_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE eta_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Shipments policies
CREATE POLICY "Users can view shipments in their organization" ON shipments
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert shipments to their organization" ON shipments
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update shipments in their organization" ON shipments
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete shipments in their organization" ON shipments
    FOR DELETE USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Shipment Documents policies
CREATE POLICY "Users can view documents of their shipments" ON shipment_documents
    FOR SELECT USING (
        shipment_id IN (
            SELECT id FROM shipments WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert documents to their shipments" ON shipment_documents
    FOR INSERT WITH CHECK (
        shipment_id IN (
            SELECT id FROM shipments WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ETA History policies
CREATE POLICY "Users can view ETA history of their shipments" ON eta_history
    FOR SELECT USING (
        shipment_id IN (
            SELECT id FROM shipments WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Credits policies
CREATE POLICY "Users can view their organization credits" ON credits
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Credit Transactions policies
CREATE POLICY "Users can view their organization credit transactions" ON credit_transactions
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Subscriptions policies
CREATE POLICY "Users can view their organization subscription" ON subscriptions
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Payment History policies
CREATE POLICY "Users can view their organization payment history" ON payment_history
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );
```

---

## 3. Authentication Flow (Supabase Auth)

### Authentication Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SIGN UP                                                      │
│     └── Email + Password                                        │
│         ├── Supabase creates auth.users record                  │
│         ├── Trigger creates users record                        │
│         ├── Create new organization                             │
│         ├── Assign user to organization                         │
│         ├── Create initial credits (free trial)                 │
│         └── Send email verification                             │
│                                                                  │
│  2. SIGN IN                                                      │
│     └── Email + Password / Magic Link / OAuth (Google)          │
│         ├── Validate credentials                                │
│         ├── Return JWT token                                    │
│         └── Client stores in localStorage/cookie                │
│                                                                  │
│  3. SESSION MANAGEMENT                                           │
│     └── Supabase handles automatically                          │
│         ├── JWT refresh                                         │
│         ├── Session persistence                                 │
│         └── Auto sign-out on expiry                             │
│                                                                  │
│  4. PROTECTED ROUTES                                             │
│     └── Middleware checks session                               │
│         ├── Valid → proceed                                     │
│         └── Invalid → redirect to /login                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Supabase Auth Configuration

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}
```

### Database Trigger for User Creation

```sql
-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Create a new organization for the user
    INSERT INTO organizations (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.email))
    RETURNING id INTO new_org_id;

    -- Create user profile
    INSERT INTO users (id, email, full_name, organization_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        new_org_id,
        'admin'
    );

    -- Create initial credits (10 free credits for trial)
    INSERT INTO credits (organization_id, balance)
    VALUES (new_org_id, 10);

    -- Log credit transaction
    INSERT INTO credit_transactions (organization_id, type, amount, description)
    VALUES (new_org_id, 'topup', 10, 'Initial free credits');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 4. API Endpoints

### Next.js API Routes Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts        # OAuth callback handler
│   │   └── [...supabase]/
│   │       └── route.ts        # Supabase auth routes
│   │
│   ├── shipments/
│   │   ├── route.ts            # GET (list), POST (create)
│   │   ├── [id]/
│   │   │   ├── route.ts        # GET, PUT, DELETE single shipment
│   │   │   └── eta/
│   │   │       └── route.ts    # POST - fetch ETA for shipment
│   │   ├── upload-bl/
│   │   │   └── route.ts        # POST - upload & extract BL data
│   │   └── export/
│   │       └── route.ts        # POST - export to Excel
│   │
│   ├── eta/
│   │   ├── fetch/
│   │   │   └── route.ts        # POST - fetch ETA by BL number
│   │   └── update-all/
│   │       └── route.ts        # POST - cron job to update all ETAs
│   │
│   ├── credits/
│   │   ├── route.ts            # GET - get current balance
│   │   └── topup/
│   │       └── route.ts        # POST - initiate credit top-up
│   │
│   ├── payments/
│   │   ├── webhook/
│   │   │   └── route.ts        # POST - Xendit webhook handler
│   │   ├── create-invoice/
│   │   │   └── route.ts        # POST - create Xendit invoice
│   │   └── history/
│   │       └── route.ts        # GET - payment history
│   │
│   └── users/
│       ├── route.ts            # GET current user, PUT update profile
│       └── organization/
│           └── route.ts        # GET, PUT organization details
```

### API Specifications

#### Shipments API

```typescript
// POST /api/shipments
// Create new shipment
interface CreateShipmentRequest {
  bl_number: string;
  shipper_name?: string;
  shipper_address?: string;
  consignee_name?: string;
  consignee_address?: string;
  notify_party_name?: string;
  notify_party_address?: string;
  vessel_name?: string;
  voyage_number?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
  description_of_goods?: string;
  container_quantity?: number;
  weight?: number;
  weight_unit?: "KG" | "LBS";
  bl_issued_date?: string; // ISO date
  eta?: string; // ISO datetime
}

interface CreateShipmentResponse {
  success: boolean;
  data?: Shipment;
  error?: string;
}

// GET /api/shipments
// List shipments with pagination & filters
interface ListShipmentsQuery {
  page?: number;
  limit?: number;
  status?: ShipmentStatus;
  search?: string;
  sort_by?: "eta" | "created_at" | "bl_number";
  sort_order?: "asc" | "desc";
}

interface ListShipmentsResponse {
  success: boolean;
  data: {
    shipments: Shipment[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
```

#### Upload BL API

```typescript
// POST /api/shipments/upload-bl
// Upload Bill of Lading and extract data
interface UploadBLRequest {
  file: File; // FormData
}

interface UploadBLResponse {
  success: boolean;
  data?: {
    extracted_data: Partial<CreateShipmentRequest>;
    confidence_scores: Record<string, number>;
    file_url: string;
  };
  error?: string;
}
```

#### ETA API

```typescript
// POST /api/eta/fetch
// Fetch ETA for a specific BL
interface FetchETARequest {
  bl_number: string;
  shipping_line?: string;
}

interface FetchETAResponse {
  success: boolean;
  data?: {
    eta: string; // ISO datetime
    vessel_name: string;
    voyage_number: string;
    current_status: string;
    source: "api" | "scraping" | "manual";
  };
  error?: string;
}
```

#### Export API

```typescript
// POST /api/shipments/export
// Export shipments to Excel
interface ExportRequest {
  shipment_ids: string[];
  format: "xlsx" | "csv";
}

interface ExportResponse {
  success: boolean;
  data?: {
    download_url: string;
    expires_at: string;
  };
  error?: string;
}
```

#### Credits API

```typescript
// GET /api/credits
// Get current credit balance
interface CreditsResponse {
  success: boolean;
  data: {
    balance: number;
    transactions: CreditTransaction[];
  };
}

// POST /api/credits/topup
// Initiate credit top-up
interface TopupRequest {
  amount: number; // Credit amount to purchase
  payment_method?: string;
}

interface TopupResponse {
  success: boolean;
  data?: {
    invoice_url: string;
    invoice_id: string;
    amount: number;
    expires_at: string;
  };
  error?: string;
}
```

---

## 5. Xendit Payment Integration

### Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW (XENDIT)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User clicks "Top Up Credits"                                │
│     └── Select credit package (e.g., 50 credits = Rp 100.000)  │
│                                                                  │
│  2. Frontend calls POST /api/credits/topup                      │
│     └── Backend creates Xendit Invoice                          │
│         ├── Set amount, currency, customer details              │
│         ├── Set callback URL for webhook                        │
│         └── Return invoice_url to frontend                      │
│                                                                  │
│  3. Redirect user to Xendit payment page                        │
│     └── User completes payment (VA, e-wallet, card, etc.)       │
│                                                                  │
│  4. Xendit sends webhook to /api/payments/webhook               │
│     └── Verify webhook signature                                │
│     └── If payment successful:                                  │
│         ├── Update payment_history status = 'paid'              │
│         ├── Add credits to organization                         │
│         ├── Create credit_transaction record                    │
│         └── Send confirmation email (optional)                  │
│                                                                  │
│  5. User redirected back to app                                 │
│     └── Show success message with updated credit balance        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Xendit API Integration

```typescript
// lib/xendit.ts
import Xendit from "xendit-node";

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
});

// Create Invoice for Credit Top-up
export async function createInvoice(params: {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
}) {
  const { Invoice } = xenditClient;

  const invoice = await Invoice.createInvoice({
    externalId: params.externalId,
    amount: params.amount,
    currency: "IDR",
    payerEmail: params.payerEmail,
    description: params.description,
    invoiceDuration: 86400, // 24 hours
    successRedirectUrl: params.successRedirectUrl,
    failureRedirectUrl: params.failureRedirectUrl,
    paymentMethods: [
      "BCA",
      "BNI",
      "MANDIRI",
      "OVO",
      "DANA",
      "SHOPEEPAY",
      "CREDIT_CARD",
    ],
  });

  return invoice;
}

// Verify Webhook Signature
export function verifyWebhookSignature(
  webhookId: string,
  payload: string,
  signature: string
): boolean {
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN!)
    .update(payload)
    .digest("hex");

  return signature === expectedSignature;
}
```

### Credit Packages Configuration

```typescript
// config/credit-packages.ts
export const CREDIT_PACKAGES = [
  {
    id: "starter",
    credits: 10,
    price: 25000, // IDR
    description: "10 Credits",
    popular: false,
  },
  {
    id: "basic",
    credits: 50,
    price: 100000,
    description: "50 Credits",
    popular: true,
  },
  {
    id: "professional",
    credits: 100,
    price: 175000,
    description: "100 Credits (Save 12.5%)",
    popular: false,
  },
  {
    id: "enterprise",
    credits: 500,
    price: 750000,
    description: "500 Credits (Save 25%)",
    popular: false,
  },
];

// Credit usage per action
export const CREDIT_COSTS = {
  UPLOAD_BL: 1, // 1 credit per BL upload & extraction
  FETCH_ETA: 0, // Free (included in upload)
  EXPORT_EXCEL: 0, // Free
};
```

---

## 6. Document Processing (OCR)

### BL Data Extraction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 BL DATA EXTRACTION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User uploads BL document (PDF/Image)                        │
│     └── Supported: PDF, JPG, PNG, WEBP                          │
│                                                                  │
│  2. File uploaded to Supabase Storage                           │
│     └── Bucket: 'bl-documents'                                  │
│     └── Path: {org_id}/{timestamp}_{filename}                   │
│                                                                  │
│  3. Call Document AI / Vision API                               │
│     └── Option A: OpenAI GPT-4 Vision                           │
│     └── Option B: Google Document AI                            │
│     └── Option C: Azure Document Intelligence                   │
│                                                                  │
│  4. AI extracts structured data                                 │
│     └── Parse BL fields                                         │
│     └── Return confidence scores                                │
│                                                                  │
│  5. Return extracted data to frontend                           │
│     └── Auto-fill form fields                                   │
│     └── Highlight low-confidence fields                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### OpenAI Vision Implementation

```typescript
// lib/ocr/openai-vision.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BL_EXTRACTION_PROMPT = `
You are an expert at reading Bill of Lading (BL) documents. 
Extract the following information from the provided document image:

1. BL Number (Bill of Lading Number)
2. Shipper Name
3. Shipper Address
4. Consignee Name
5. Consignee Address
6. Notify Party Name
7. Notify Party Address
8. Vessel Name
9. Voyage Number
10. Port of Loading (PoL)
11. Port of Discharge (PoD)
12. Description of Goods
13. Number of Containers/Packages
14. Weight (include unit: KG or LBS)
15. BL Issue Date

Return the data as a JSON object with the following structure:
{
  "bl_number": "",
  "shipper_name": "",
  "shipper_address": "",
  "consignee_name": "",
  "consignee_address": "",
  "notify_party_name": "",
  "notify_party_address": "",
  "vessel_name": "",
  "voyage_number": "",
  "port_of_loading": "",
  "port_of_discharge": "",
  "description_of_goods": "",
  "container_quantity": 0,
  "weight": 0,
  "weight_unit": "KG",
  "bl_issued_date": "YYYY-MM-DD",
  "confidence_scores": {
    "bl_number": 0.95,
    // ... confidence for each field (0-1)
  }
}

If a field cannot be found, leave it as empty string or null.
`;

export async function extractBLData(
  imageUrl: string
): Promise<ExtractedBLData> {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: BL_EXTRACTION_PROMPT },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result;
}
```

---

## 7. ETA Fetching Strategy

### Multi-Source ETA Fetching

```
┌─────────────────────────────────────────────────────────────────┐
│                    ETA FETCHING STRATEGY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Priority 1: Direct API Integration                             │
│  ├── Maersk API                                                 │
│  ├── MSC API                                                    │
│  ├── CMA CGM API                                                │
│  ├── COSCO API                                                  │
│  └── Other shipping lines with public APIs                      │
│                                                                  │
│  Priority 2: Aggregator Services                                │
│  ├── MarineTraffic API                                          │
│  ├── Searates API                                               │
│  └── Container tracking platforms                               │
│                                                                  │
│  Priority 3: Web Scraping (Fallback)                           │
│  ├── Shipping line websites                                     │
│  └── Port authority websites                                    │
│                                                                  │
│  Priority 4: Manual Input                                       │
│  └── User enters ETA manually                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ETA Update Cron Job

```typescript
// Supabase Edge Function: update-eta-cron
// Schedule: Every 6 hours

import { createClient } from "@supabase/supabase-js";
import { fetchETAFromProvider } from "./eta-providers";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  // Get all active shipments (not arrived/completed)
  const { data: shipments, error } = await supabase
    .from("shipments")
    .select("*")
    .not("status", "in", '("arrived","completed")')
    .order("eta", { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  const results = [];

  for (const shipment of shipments || []) {
    try {
      const etaResult = await fetchETAFromProvider(shipment.bl_number);

      if (etaResult && etaResult.eta !== shipment.eta) {
        // ETA changed - update and log history
        await supabase.from("eta_history").insert({
          shipment_id: shipment.id,
          previous_eta: shipment.eta,
          new_eta: etaResult.eta,
          source: etaResult.source,
        });

        // Calculate new status
        const newStatus = calculateStatus(etaResult.eta);

        await supabase
          .from("shipments")
          .update({
            eta: etaResult.eta,
            eta_source: etaResult.source,
            eta_last_updated: new Date().toISOString(),
            status:
              shipment.status === "on_schedule" ? "eta_changed" : newStatus,
            vessel_name: etaResult.vessel_name || shipment.vessel_name,
            voyage_number: etaResult.voyage_number || shipment.voyage_number,
          })
          .eq("id", shipment.id);

        results.push({ shipment_id: shipment.id, status: "updated" });
      } else {
        results.push({ shipment_id: shipment.id, status: "unchanged" });
      }
    } catch (err) {
      results.push({
        shipment_id: shipment.id,
        status: "error",
        error: err.message,
      });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
});

function calculateStatus(eta: string): string {
  const etaDate = new Date(eta);
  const now = new Date();
  const diffDays = Math.ceil(
    (etaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) return "arrived";
  if (diffDays <= 3) return "arriving_soon";
  return "on_schedule";
}
```

---

## 8. Frontend Architecture

### Page Structure

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx           # Login page
│   ├── register/
│   │   └── page.tsx           # Registration page
│   ├── forgot-password/
│   │   └── page.tsx           # Forgot password
│   └── layout.tsx             # Auth layout (no sidebar)
│
├── (dashboard)/
│   ├── layout.tsx             # Dashboard layout with sidebar
│   ├── page.tsx               # Dashboard home (shipment list)
│   ├── shipments/
│   │   ├── page.tsx           # Shipment list
│   │   ├── new/
│   │   │   └── page.tsx       # New shipment (upload BL)
│   │   └── [id]/
│   │       ├── page.tsx       # Shipment detail
│   │       └── edit/
│   │           └── page.tsx   # Edit shipment
│   ├── credits/
│   │   └── page.tsx           # Credit balance & top-up
│   ├── settings/
│   │   ├── page.tsx           # General settings
│   │   └── organization/
│   │       └── page.tsx       # Organization settings
│   └── billing/
│       └── page.tsx           # Billing & payment history
│
├── layout.tsx                  # Root layout
├── page.tsx                    # Landing page
└── globals.css                 # Global styles
```

### Component Structure

```
components/
├── ui/                         # daisyUI + custom components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Alert.tsx
│   ├── Loading.tsx
│   └── ...
│
├── forms/
│   ├── ShipmentForm.tsx        # Shipment create/edit form
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── ...
│
├── shipments/
│   ├── ShipmentTable.tsx       # Shipment list table
│   ├── ShipmentCard.tsx        # Shipment summary card
│   ├── ShipmentStatus.tsx      # Status badge component
│   ├── ETADisplay.tsx          # ETA with history
│   └── BLUploader.tsx          # BL upload component
│
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Navbar.tsx
│
├── credits/
│   ├── CreditBalance.tsx
│   ├── CreditPackages.tsx
│   └── TopupModal.tsx
│
└── providers/
    ├── AuthProvider.tsx
    ├── ThemeProvider.tsx
    └── ToastProvider.tsx
```

### State Management

```typescript
// Using React Query for server state
// hooks/useShipments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useShipments(filters?: ShipmentFilters) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["shipments", filters],
    queryFn: async () => {
      let query = supabase
        .from("shipments")
        .select("*")
        .order("eta", { ascending: true });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.search) {
        query = query.or(
          `bl_number.ilike.%${filters.search}%,shipper_name.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (shipment: CreateShipmentInput) => {
      const { data, error } = await supabase
        .from("shipments")
        .insert(shipment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}
```

### daisyUI Theme Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        shiptrack: {
          primary: "#3B82F6", // Blue
          secondary: "#6366F1", // Indigo
          accent: "#10B981", // Emerald
          neutral: "#1F2937", // Gray
          "base-100": "#FFFFFF",
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        },
      },
      "light",
      "dark",
    ],
    defaultTheme: "shiptrack",
  },
};
```

---

## 9. Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Xendit
XENDIT_SECRET_KEY=xnd_development_xxx
XENDIT_PUBLIC_KEY=xnd_public_development_xxx
XENDIT_WEBHOOK_VERIFICATION_TOKEN=your-webhook-token

# OpenAI (for BL extraction)
OPENAI_API_KEY=sk-xxx

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=ShipTrack

# Feature Flags
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=false
NEXT_PUBLIC_ENABLE_MAGIC_LINK=true
```

---

## 10. Security Considerations

### Security Checklist

- [ ] **Authentication**

  - [ ] Supabase Auth with email verification
  - [ ] Secure session management
  - [ ] Password strength requirements
  - [ ] Rate limiting on auth endpoints

- [ ] **Authorization**

  - [ ] Row Level Security (RLS) on all tables
  - [ ] Role-based access control
  - [ ] Organization-level data isolation

- [ ] **Data Protection**

  - [ ] HTTPS only
  - [ ] Encrypted sensitive data at rest
  - [ ] Secure file uploads (type validation, size limits)
  - [ ] Sanitize user inputs

- [ ] **Payment Security**

  - [ ] Xendit webhook signature verification
  - [ ] Server-side payment validation
  - [ ] No sensitive payment data stored locally

- [ ] **API Security**
  - [ ] API rate limiting
  - [ ] Input validation with Zod
  - [ ] CORS configuration
  - [ ] SQL injection prevention (Supabase handles)

---

## 11. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                         ┌─────────────┐                         │
│                         │   Vercel    │                         │
│                         │  (Next.js)  │                         │
│                         └──────┬──────┘                         │
│                                │                                │
│              ┌─────────────────┼─────────────────┐              │
│              │                 │                 │              │
│              ▼                 ▼                 ▼              │
│     ┌────────────────┐ ┌────────────┐ ┌─────────────────┐      │
│     │   Supabase     │ │   Xendit   │ │    OpenAI       │      │
│     ├────────────────┤ │  Payment   │ │  Vision API     │      │
│     │ - PostgreSQL   │ │  Gateway   │ │  (OCR)          │      │
│     │ - Auth         │ └────────────┘ └─────────────────┘      │
│     │ - Storage      │                                          │
│     │ - Edge Funcs   │                                          │
│     │ - Realtime     │                                          │
│     └────────────────┘                                          │
│                                                                  │
│     ┌─────────────────────────────────────────────────┐        │
│     │              GitHub Actions (CI/CD)              │        │
│     │  - Lint & Test                                   │        │
│     │  - Build                                         │        │
│     │  - Deploy to Vercel                             │        │
│     │  - Run Supabase migrations                       │        │
│     └─────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Development Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Setup project structure (Next.js + daisyUI)
- [ ] Configure Supabase project
- [ ] Create database schema & migrations
- [ ] Implement authentication (signup, login, logout)
- [ ] Setup basic layout & navigation

### Phase 2: Core Features (Week 3-4)

- [ ] Implement BL upload & OCR extraction
- [ ] Create shipment CRUD operations
- [ ] Build shipment dashboard & table
- [ ] Implement search & filter functionality

### Phase 3: ETA Tracking (Week 5)

- [ ] Integrate ETA fetching APIs
- [ ] Create ETA update cron job
- [ ] Implement ETA history tracking
- [ ] Add status indicators

### Phase 4: Export & Credits (Week 6)

- [ ] Implement Excel export functionality
- [ ] Integrate Xendit payment
- [ ] Create credit system
- [ ] Build billing page

### Phase 5: Polish & Launch (Week 7-8)

- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Beta testing
- [ ] Production deployment

---

## 13. Appendix

### Package.json Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "@tanstack/react-query": "^5.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zod": "^3.x",
    "openai": "^4.x",
    "xendit-node": "^1.x",
    "exceljs": "^4.x",
    "date-fns": "^3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/react": "^18.x",
    "@types/node": "^20.x",
    "tailwindcss": "^3.x",
    "daisyui": "^4.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x",
    "eslint": "^8.x",
    "eslint-config-next": "14.x",
    "prettier": "^3.x",
    "prettier-plugin-tailwindcss": "^0.5.x"
  }
}
```

### Useful Commands

```bash
# Development
npm run dev

# Build
npm run build

# Supabase CLI
npx supabase login
npx supabase init
npx supabase link --project-ref your-project-ref
npx supabase db push
npx supabase db diff -f migration_name
npx supabase functions deploy function-name

# Generate types from Supabase
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

---

**Document Status:** Complete  
**Last Updated:** December 20, 2025
