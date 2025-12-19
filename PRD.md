# 📋 PRD: INSScan Enhancement - PPJK Workflow Automation Platform

**Document Version:** 1.0  
**Date:** December 20, 2025  
**Status:** Draft - Ready for Validation

---

## 1. Executive Summary

INSScan saat ini adalah **verification tool** untuk HS Code & tarif lookup. PRD ini adalah roadmap untuk **evolusi menjadi platform comprehensive** yang mengotomatisasi seluruh workflow kepabeanan PPJK, dari dokumentasi hingga tracking & client portal.

**Target User:** PPJK berpengalaman & bersertifikat  
**Problem Solved:** Dokumentasi manual, tracking status, komunikasi klien, perhitungan biaya, update regulasi  
**Timeline:** 3 phases, 6-9 bulan untuk MVP complete

---

## 2. Problem Statement & Opportunity

### Current State (Pain Points)

| #   | Pain Point                        | Impact                                   | Frequency        |
| --- | --------------------------------- | ---------------------------------------- | ---------------- |
| 1   | **Dokumentasi Rumit & Berulang**  | Kesalahan → denda/pemeriksaan fisik      | Setiap clearance |
| 2   | **Tracking Status Barang Manual** | Klien kebingungan, support load tinggi   | Setiap shipment  |
| 3   | **Komunikasi Fragmented**         | Email/WhatsApp chaos, info duplikat      | Setiap hari      |
| 4   | **Perhitungan Biaya Manual**      | Error hitung pajak, dispute dengan klien | Setiap shipment  |
| 5   | **Update Regulasi Outdated**      | Compliance risk, missed LARTAS changes   | Weekly           |
| 6   | **Manajemen Dokumen Tersebar**    | Sulit trace, archive, audit trail        | Ongoing          |

### Opportunity

**Total addressable time saved per PPJK employee:** 8-12 jam/minggu  
**Cost reduction:** 15-20% dari operational expense  
**Competitive advantage:** PPJK dengan tools modern → attract more clients

---

## 3. Product Vision

**INSScan 2.0:** Comprehensive PPJK operations platform yang mengintegrasikan:

- 📄 **Document Automation** (OCR, auto-fill, template)
- 📍 **Real-time Tracking** (shipment status, milestone alerts)
- 👥 **Client Portal** (transparency, self-service inquiry)
- 💰 **Financial Automation** (cost calculation, invoice generation)
- 📢 **Regulatory Intelligence** (LARTAS alerts, policy updates)
- 🗂️ **Document Management** (centralized, searchable, audit-ready)

---

## 4. Feature Roadmap by Phase

### PHASE 1: Core Enhancement (Weeks 1-4) ⭐ START HERE

**Focus:** Extend existing INSScan + add basic tracking

#### Feature 1.1: Document Auto-Fill with OCR (Priority: HIGH)

**Problem:** Manual fill dokumen PIB/PEB memakan waktu, error-prone  
**Solution:** Upload dokumen (PDF/image) → OCR extract → auto-fill form kepabeanan

**Requirements:**

- Upload dokumen: PDF, PNG, JPG
- OCR engine: Tesseract/Google Vision API (ambil: invoice number, HS Code, CIF value, shipper)
- Auto-populate form dengan extracted data
- Manual edit available (user verify & correct OCR errors)
- Template support: PIB, PEB, Invoice, Packing List

**Success Metrics:**

- 90% data extraction accuracy
- Time save: 15 min → 2 min per document
- User adoption: 60%+ use OCR feature

**Effort:** 3 weeks (backend 2w + frontend 1w)

---

#### Feature 1.2: Basic Shipment Tracking (Priority: HIGH)

**Problem:** Klien/PPJK tidak bisa track status barang real-time  
**Solution:** Dashboard dengan status: Submitted → Checked → Cleared → Released

**Requirements:**

- Shipment record: shipper, HS Code, qty, status, location
- Status workflow: Dokumen disiapkan → Submitted ke Bea Cukai → In-checking → Cleared → Released
- Timeline view: milestone + expected vs actual date
- Filter/search: by AWB/BL, shipper, status
- Notification: status change → alert ke PPJK + klien

**Success Metrics:**

- 95% shipment visibility
- Real-time status update delay: <5 min
- User adoption: 80%

**Effort:** 2 weeks (backend 1.5w + frontend 1w)

---

#### Feature 1.3: Riwayat HS Code + Refresh Mechanism (Priority: MEDIUM)

**Problem:** PPJK query kode HS yang sama berulang kali, data bisa outdated  
**Solution:** Local history + manual refresh + age indicator

**Requirements:**

- Save setiap HS Code lookup: code, tarif, LARTAS, timestamp, user
- Search UI: cari by code/barang, filter by date
- Display: show cached data + "Last checked: X days ago"
- Refresh button: update data dari API INSW terbaru
- Auto-alert: jika data > 30 hari, suggest refresh

**Success Metrics:**

- 70%+ reuse dari riwayat
- API calls reduced 40%
- Time per lookup: 5s → 1s (cached)

**Effort:** 1 week (simple, leverage existing db structure)

---

### PHASE 2: Client & Financial Automation (Weeks 5-8)

**Focus:** Client visibility + cost calculation

#### Feature 2.1: Client Portal (Lite Version)

**Problem:** Klien tidak bisa cek status sendiri, support load tinggi  
**Solution:** Portal terbatas untuk klien view shipment status & download dokumen

**Requirements:**

- Client login (email, invite-only)
- View assigned shipments: status, timeline, milestones
- Download: invoice, receipt, clearance certificate (tidak sensitive docs)
- FAQ/knowledge base: regulasi, larangan import, prosedur clearance
- Contact form: direct to assigned PPJK staff

**Success Metrics:**

- 50%+ klien use portal
- Support ticket reduced 30%
- Client satisfaction: >4/5

**Effort:** 2 weeks

---

#### Feature 2.2: Cost Calculator & Invoice Generator (Priority: HIGH)

**Problem:** Perhitungan pajak manual, delay invoice, dispute dengan klien  
**Solution:** Auto-calculate BM/PPN/PPh + generate professional invoice

**Requirements:**

- Input: HS Code, CIF value, weight, origin country, payment term
- Calculate: BM% + PPN% + PPh% + pelabuhan fee → total cost
- Rules engine: apply discount policies, special rates per klien
- Invoice template: auto-generate PDF (logo, terms, breakdown)
- Export: to accounting system (format: CSV/Excel)

**Success Metrics:**

- Calculation accuracy: 99%
- Invoice generation time: <1 min
- Accounting integration: 100%

**Effort:** 2 weeks

---

### PHASE 3: Advanced Integration (Weeks 9-12+)

**Focus:** Real-time integration + intelligence

#### Feature 3.1: Regulatory Intelligence & LARTAS Alerts

**Problem:** LARTAS/larangan berubah, PPJK miss update  
**Solution:** Auto-fetch policy changes + alert untuk barang restricted

**Requirements:**

- Sync dengan Bea Cukai API (INSW 2.0): daily fetch LARTAS updates
- When user upload HS Code → check if LARTAS changed recently
- Alert: "⚠️ HS Code 6204620000 baru kena LARTAS IMPORT sejak Dec 15" + action guide
- Dashboard: "Regulatory updates" feed (latest policies, effective date)

**Success Metrics:**

- LARTAS coverage: 100% (all categories)
- Alert latency: <24 jam from policy publish
- Zero missed LARTAS incidents

**Effort:** 2 weeks

---

#### Feature 3.2: End-to-End System Integration

**Problem:** Data masih manual antara Bea Cukai portal, pelabuhan, forwarder  
**Solution:** API integration ke sistem eksternal (Bea Cukai, pelabuhan, trucking)

**Requirements:**

- Bea Cukai integration: submit PIB/PEB → track status real-time (jika API available)
- Pelabuhan integration: get cargo status (jika API available, e.g., Tanjung Priok)
- Trucking integration: get shipment location (GPS, ETA)
- Webhook: external system ping INSScan when milestone reached

**Success Metrics:**

- Real-time sync (delay <5 min)
- Integration coverage: Bea Cukai 100%, Pelabuhan 50%, Trucking 30%

**Effort:** 3-4 weeks (depends on API availability & documentation)

---

#### Feature 3.3: Document Management System (DMS)

**Problem:** Dokumen tersebar, audit trail unclear  
**Solution:** Centralized DMS dengan versioning, permission, archive

**Requirements:**

- Upload & organize: folder by shipment, auto-tag by type (invoice, packing list, etc.)
- Version control: track changes, restore old version
- Permission: client view own, PPJK view all
- Search: full-text search across documents (OCR indexed)
- Retention policy: auto-archive after 2 years, purge after 5 years
- Audit log: who accessed what, when

**Success Metrics:**

- 100% document centralization
- Search accuracy: >95%
- Compliance audit-ready

**Effort:** 2-3 weeks

---

## 5. Feature Priority Matrix

```
IMPACT (Business Value)
        ↑
     HIGH
        |  1.1(OCR)  2.1(Portal)  3.1(LARTAS)
        |  1.2(Track)  2.2(Invoice)  3.2(Integration)
        |  1.3(History)  3.3(DMS)
     LOW |
        └─────────────────────────────→ EFFORT
                LOW          HIGH
```

**Recommended Sequence:**

1. **Phase 1** (Weeks 1-4): Riwayat HS Code → Doc OCR → Basic Tracking
2. **Phase 2** (Weeks 5-8): Cost Calculator → Client Portal
3. **Phase 3** (Weeks 9+): LARTAS Alerts → System Integration → DMS

---

## 6. User Stories & Acceptance Criteria

### Story 1.1: OCR Document Upload

```
As a PPJK employee,
I want to upload invoice/packing list image,
So that form fields auto-populate & I save 15 min per document.

Acceptance Criteria:
- ✅ Accept PDF, PNG, JPG (max 10MB)
- ✅ Extract: invoice #, shipper, HS Code, qty, CIF value
- ✅ Accuracy ≥90% for structured data
- ✅ Manual edit available for OCR errors
- ✅ Error handling: fallback to manual entry if OCR fails
```

### Story 1.2: Shipment Tracking Dashboard

```
As a PPJK employee & client,
I want to see shipment status in real-time,
So that I can monitor progress & proactively address delays.

Acceptance Criteria:
- ✅ Status: Preparing Docs → Submitted → Checking → Cleared → Released
- ✅ Timeline: actual vs expected date, delay alert
- ✅ Filter: by AWB, shipper, status, date range
- ✅ Notification: SMS/email when status changes
- ✅ Client view (lite): see own shipment only
```

### Story 1.3: HS Code History + Refresh

```
As a PPJK employee,
I want to search previous HS Code lookups,
So that I don't query API repeatedly for same code.

Acceptance Criteria:
- ✅ Save history: code, tarif, LARTAS, date, user
- ✅ Search: by HS code, barang name, date range
- ✅ Show: data age indicator + "refresh" button
- ✅ Auto-alert: if data > 30 days
- ✅ Refresh: re-query API, update record
```

---

## 7. Technical Architecture Overview

### Tech Stack (Maintain Existing)

- **Frontend:** Next.js 14, React 18, Tailwind CSS, DaisyUI
- **Backend:** Next.js API Routes, Node.js
- **Database:** Prisma ORM + PostgreSQL (recommended for scalability)
- **External APIs:** INSW, Google Vision API (OCR), potentially Bea Cukai API
- **DevOps:** Vercel (current), optional: Docker for local integration

### Database Schema Addition (Phase 1)

```sql
-- Riwayat HS Code
CREATE TABLE hs_code_history (
  id UUID PRIMARY KEY,
  hs_code VARCHAR(8),
  tarif_bm DECIMAL,
  tarif_ppn DECIMAL,
  lartas_import BOOLEAN,
  lartas_border BOOLEAN,
  checked_at TIMESTAMP,
  user_id UUID FOREIGN KEY,
  created_at TIMESTAMP,
  UNIQUE(hs_code, user_id)
);

-- Shipment Tracking
CREATE TABLE shipments (
  id UUID PRIMARY KEY,
  awb_bl VARCHAR(50) UNIQUE,
  shipper_id UUID FOREIGN KEY,
  hs_codes JSONB[],
  status ENUM('preparing', 'submitted', 'checking', 'cleared', 'released'),
  submitted_date DATE,
  cleared_date DATE,
  released_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Shipment Timeline (milestones)
CREATE TABLE shipment_milestones (
  id UUID PRIMARY KEY,
  shipment_id UUID FOREIGN KEY,
  milestone_type ENUM('submitted', 'in_checking', 'cleared', 'released'),
  scheduled_date DATE,
  actual_date DATE,
  notes TEXT,
  created_at TIMESTAMP
);
```

---

## 8. Success Metrics & KPIs

### Phase 1 Metrics

| Metric                | Target             | Measurement               |
| --------------------- | ------------------ | ------------------------- |
| **Feature Adoption**  | 60%+ use OCR       | % active users / total    |
| **Time Saved**        | 8-10 hrs/week      | User time tracking survey |
| **Error Reduction**   | 30% fewer mistakes | Support ticket analysis   |
| **API Efficiency**    | 40% fewer calls    | API usage logs            |
| **User Satisfaction** | 4.0/5.0            | In-app NPS survey         |

### Phase 2 Metrics

| Metric                     | Target             | Measurement             |
| -------------------------- | ------------------ | ----------------------- |
| **Client Portal Adoption** | 50%+ klien login   | % unique logins         |
| **Support Reduction**      | 25% fewer tickets  | Support ticket volume   |
| **Invoice Time**           | <1 min per invoice | Timer in app            |
| **Calculation Accuracy**   | 99%                | Spot check 100 invoices |

### Phase 3 Metrics

| Metric                   | Target               | Measurement            |
| ------------------------ | -------------------- | ---------------------- |
| **LARTAS Alert Latency** | <24 hrs from publish | Internal testing       |
| **System Integration**   | 90% auto-sync        | Data consistency check |
| **Document Search**      | >95% relevance       | Query test coverage    |

---

## 9. Risks & Mitigation

| Risk                          | Impact                            | Mitigation                                |
| ----------------------------- | --------------------------------- | ----------------------------------------- |
| **OCR Accuracy < 85%**        | Users frustrated, abandon feature | Implement ML training, fallback to manual |
| **Bea Cukai API unavailable** | Phase 3 delayed                   | Parallel: build manual status entry UI    |
| **User adoption < 40%**       | ROI negative                      | Change management: training, incentives   |
| **Data privacy/compliance**   | Legal issue                       | Encrypt sensitive docs, SOC 2 audit       |
| **Integration complexity**    | Timeline slip                     | Scope down Phase 3, prioritize INSW only  |

---

## 10. Go-to-Market Plan

### Pre-Launch (Week 0-1)

- ✅ Beta testing with 5-10 PPJK users
- ✅ Gather feedback, iterate
- ✅ Prepare training materials (video, docs)

### Launch Phase 1 (Week 4)

- 📢 Announce to existing 500+ users via email
- 📊 Demo: before/after workflow video
- 🎁 Early adopter incentive: 1 month free upgrade
- 📞 On-call support first 2 weeks

### Feedback Loop (Week 4-8)

- 📋 Weekly user interviews (5 users)
- 📊 Dashboard metrics tracking
- 🔄 Iterate based on real usage data

### Phase 2 Launch (Week 8)

- Client portal intro
- Cost calculator highlight
- Customer testimonial campaign

---

## 11. Resource Plan

### Team Composition

- **1 Senior Backend Engineer** (3-4 months): database design, OCR integration, API development
- **1 Senior Frontend Engineer** (3-4 months): UI/UX, dashboard, client portal
- **1 DevOps Engineer** (part-time, 4 months): infrastructure, deployment, monitoring
- **1 Product Manager** (full-time): roadmap, user research, prioritization
- **1 QA Engineer** (part-time, 4 months): testing, edge cases

### Estimated Budget

- **Development:** $50K-70K (3-4 months, 2-3 engineers)
- **Infrastructure & APIs:** $5K-10K (OCR, database, hosting)
- **User Research & Training:** $3K-5K
- **Total:** $58K-85K for MVP (Phase 1 + 2)

---

## 12. Definition of Done

**MVP is complete when:**

- ✅ Phase 1 all features launched & >50% user adoption
- ✅ Phase 2 features launched & >30% user adoption
- ✅ Zero critical bugs, <5 P2 bugs
- ✅ User satisfaction ≥4.0/5
- ✅ Performance: page load <2s, API <500ms
- ✅ Security: encrypted data, SOC 2 audit passed
- ✅ Documentation: user guide, API docs, admin guide complete

---

## 13. Next Steps

1. **Validate Concept** (This Week)

   - [ ] Share PRD dengan 3-5 PPJK users
   - [ ] Collect feedback on feature priority
   - [ ] Adjust Phase 1 scope based on feedback

2. **Technical Design** (Week 1-2)

   - [ ] Create detailed API specs
   - [ ] Database schema finalized
   - [ ] OCR vendor selection (Google Vision? Tesseract?)

3. **Development** (Week 3+)
   - [ ] Start Phase 1 implementation
   - [ ] Weekly sprint reviews
   - [ ] Continuous user feedback integration

---

## Appendix: Glossary

- **PPJK:** Perusahaan Pengurusan Jasa Kepabeanan (customs clearance company)
- **HS Code:** Harmonized System code (8-digit commodity classification)
- **LARTAS:** Larangan/Terbatas (restricted/prohibited items)
- **PIB:** Pemberitahuan Impor Barang (import notification)
- **PEB:** Pemberitahuan Ekspor Barang (export notification)
- **BM:** Bea Masuk (import duty)
- **PPN:** Pajak Pertambahan Nilai (VAT)
- **CIF:** Cost, Insurance, Freight (valuation basis)
- **AWB/BL:** Air Waybill / Bill of Lading (shipping docs)
- **INSW:** Indonesia National Single Window (customs system)

---

**Document Status:** Ready for stakeholder review & user validation  
**Last Updated:** December 20, 2025
