# 📋 PRD: BL Parser Extension - Browser Extension SaaS

**Document Version:** 2.0 (Pivoted Product)  
**Date:** December 23, 2025  
**Status:** MVP Ready for Development

---

## 1. Executive Summary

**BL Parser Extension** adalah Chrome browser extension yang mengotomatisasi proses pengisian form shipment dengan parsing dokumen Bill of Lading. User upload PDF dokumen BL sekali, sistem extract 15 data field dan menyimpannya. Lalu saat user membuka website (CEISA atau internal software), mereka bisa mengetik shortcut keyboard (mis: `sh` + Ctrl+Shift) dan sistem otomatis mengisi dengan data dari BL yang sudah diparsing.

**Target User:** Staff operasional PPJK / Freight Forwarder  
**Core Value:** **Parsing BL cepat + Auto-fill form via keyboard shortcuts**  
**Business Model:** Credit-based (1 parsing = 1 kredit) + Referral incentive

### Why Pivot?

Dari kompleksitas full tracking system (ETA, notifications, realtime updates), kami fokus pada **core problem yang paling valuable**: **Otomatisasi input shipment form**. Ini mudah dibangun, bisa langsung digunakan, dan complement dengan sistem internal yang sudah ada di setiap PPJK.

---

## 2. Problem Statement

### Masalah Utama

Staff operasional PPJK menghadapi **masalah serius saat mengisi form shipment**:

| Masalah                   | Dampak                                                                          |
| ------------------------- | ------------------------------------------------------------------------------- |
| **Input Manual Dari BL**  | Staff harus baca BL, ketik ulang data ke form/sistem. 10-15 menit per shipment! |
| **Rentan Human Error**    | Salah ketik nomor BL, nama shipper, address, dll → masalah di Bea Cukai         |
| **Duplikasi Data**        | Sama data diinput berkali-kali (Excel, CEISA, internal system)                  |
| **Inefficient Workflow**  | 2-3 jam per hari terbuang hanya untuk input data                                |
| **Data di Banyak Tempat** | Info shipment tersebar di email, WhatsApp, Excel → chaos                        |

### Current Workflow (Manual & Inefficient)

```
1. Klien kirim dokumen BL (PDF/photo) via email/WhatsApp
2. Staff membuka dokumen, membaca field per field
3. Staff mengetik manual ke Excel/CEISA: No BL, Shipper, Consignee, Vessel, dll
4. Jika salah ketik → Issue di Bea Cukai
5. Repeat untuk setiap shipment (50-100 per bulan)
6. Total waktu terbuang: 2-3 jam/hari
```

### Why This Product?

Saat ini tidak ada solusi yang:

- ✅ Terhubung langsung dengan CEISA & internal software PPJK
- ✅ Parse BL otomatis
- ✅ Quick data entry via keyboard shortcut
- ✅ Affordable & credit-based (flexible)

**BL Parser Extension menyelesaikan ini.**

---

## 3. Solution Overview

**Browser extension yang parse BL → extract 15 field → auto-fill form via keyboard shortcuts**

### How It Works

```
Step 1: User uploads B/L PDF
        ↓
        System parses text, extracts 15 fields:
        - Shipper, Shipper Address, Consignee, Consignee Address
        - Notify Party, Notify Party Address
        - Vessel, Voyage Number, Port of Loading, Port of Discharge
        - Description of Goods, Container Quantity, Weight, B/L Issued Date
        - B/L Number
        ↓
Step 2: User selects parsed document as "active" in extension popup
        ↓
Step 3: User opens CEISA or internal software
        ↓
Step 4: User types shortcut (e.g., "sh" + Ctrl+Shift) in form field
        ↓
Step 5: Extension auto-fills field with parsed data (e.g., shipper name)
        ↓
Step 6: Repeat for all 15 fields
        ↓
Result: Form completely filled in 2-3 minutes (vs 15 minutes manual)
```

### Keyboard Shortcuts (All 15 Fields)

| Field                 | Shortcut  | Example                      |
| --------------------- | --------- | ---------------------------- |
| Bill of Lading Number | `bid_num` | HKG1234567                   |
| Shipper               | `sh`      | PT Maju Sejahtera            |
| Shipper Address       | `sha`     | Jln. Ahmad Yani, Jakarta     |
| Consignee             | `cn`      | ABC Company Ltd              |
| Consignee Address     | `cna`     | 15 High Street, London       |
| Notify Party          | `np`      | XYZ Logistics                |
| Notify Party Address  | `npa`     | Pasir Ris, Singapore         |
| Vessel                | `vs`      | EVER GIVEN                   |
| Voyage Number         | `vn`      | 2025E                        |
| Port of Loading       | `pol`     | TANJUNG PELEPAS              |
| Port of Discharge     | `pod`     | SINGAPORE                    |
| Description of Goods  | `dg`      | Electronics - Computer Parts |
| Container Quantity    | `cq`      | 40                           |
| Weight                | `wt`      | 25000                        |
| B/L Issued Date       | `bid`     | 2025-01-15                   |

---

## 4. MVP Scope

### What's Included (Phase 1)

✅ **Extension Features**

- Chrome browser extension (Manifest v3)
- Upload B/L PDF (text-based only)
- Parse dokumen → extract 15 fields
- Keyboard shortcuts (Ctrl+Shift+code) → auto-fill form
- Local storage untuk parsed documents
- Credit deduction (1 credit per parsing)

✅ **Website Features**

- Landing page
- User registration (with optional referral code)
- Login
- User dashboard (credit balance, usage history, referral stats)
- Payment page (Xendit integration)

✅ **Backend**

- Express.js API
- PostgreSQL database
- User authentication (JWT)
- PDF parsing service
- Credit tracking system
- Xendit payment webhook
- Referral system with fraud prevention

✅ **Monetization**

- Sign-up: 10 credits free
- Top-up pricing: 50k→17cr, 150k→60cr, 400k→150cr, 1m→550cr
- 1 credit = 1 B/L parsing
- Referral: Referrer gets 3/5 of referee's purchased credits

### What's NOT Included (Phase 2+)

❌ **Future Features**

- Image-based PDF (OCR) - Phase 2
- Shipment tracking/ETA updates - Future
- Email/WhatsApp notifications - Future
- Document generation (PIB/BC 1.1) - Future
- Team collaboration - Future
- Bulk upload - Future

---

## 5. User Personas

### Persona 1: Operasional Staff PPJK

- **Name:** Budi (Staff Operasional)
- **Age:** 28
- **Pain Point:** Ketik ulang data BL manual 50+ kali per bulan
- **Goal:** Cepat input shipment, minimize error
- **Behavior:** Multitasking, sering buka multiple windows
- **How BL Parser helps:** Shortcut keyboard → fill form in 2 min instead of 15 min

### Persona 2: PPJK Manager

- **Name:** Siti (Kepala Operasional)
- **Age:** 35
- **Pain Point:** Staff spending 2-3 jam daily on manual data entry
- **Goal:** Increase productivity, reduce human error
- **Behavior:** Track team efficiency, budget conscious
- **How BL Parser helps:** Reduce operational cost (2 FTE hours saved/day), improve accuracy

---

## 6. Success Metrics (MVP Goals)

| Metric                      | Target                         | Why It Matters    |
| --------------------------- | ------------------------------ | ----------------- |
| **Extension Installs**      | 100+ in month 1                | Market validation |
| **User Signups**            | 50+                            | Active user base  |
| **Time Saved per Shipment** | 15 min → 2 min                 | Core value prop   |
| **Parsing Accuracy**        | >95%                           | Quality metric    |
| **Payment Conversion Rate** | 20% (10 signups → 2 customers) | Revenue           |
| **Referral Success Rate**   | 10% (1 in 10 converts)         | Growth            |
| **Monthly Active Users**    | 30+                            | Retention         |
| **Extension Rating**        | >4.5 stars                     | Product quality   |

---

## 7. Business Model

### Revenue Streams

**1. Credit-Based Parsing**

- User sign-up: 10 credits free
- 1 parsing = 1 credit
- Top-up tiers (see below)

**2. Top-Up Pricing**
| Amount (IDR) | Credits | Price/Credit |
|------|---------|--------------|
| 50,000 | 17 | Rp 2,941 |
| 150,000 | 60 | Rp 2,500 |
| 400,000 | 150 | Rp 2,667 |
| 1,000,000 | 550 | Rp 1,818 |

**3. Referral Program**

- Referrer earns **3/5 of referee's purchased credits**
- Example: Referee buys 60 credits → Referrer gets 36 credits
- Max 17 referrals per referrer

### Unit Economics

**Assumptions:**

- Average revenue per top-up: Rp 150,000 (tier 2)
- Credits per top-up: 60 credits
- Conversion rate: 20% (10 signups → 2 paying customers)

**Monthly (50 signups):**

- Paying customers: 10
- Revenue: 10 × Rp 150,000 = **Rp 1.5M**
- Cost: ~Rp 100k (AWS/server) = **Rp 1.4M profit**

**Annual (600 signups):**

- Paying customers: 120
- Revenue: 120 × Rp 150,000 × 12 = **Rp 216M**
- Cost: ~Rp 1.5M/year = **Rp 214.5M profit**

---

## 8. Monetization: Referral Fraud Prevention

### Why Referral?

Growth lever untuk market yang price-sensitive. Users senang membawa teman jika dapat incentive.

### Fraud Prevention Measures

**To prevent users from gaming the system:**

1. **7-Day Waiting Period** - Referral reward tidak langsung, tunggu 7 hari (prevent refund chargeback)
2. **Minimum Usage (5 credits)** - Referee harus gunakan minimal 5 credits (prove genuine usage)
3. **Only Paid Top-ups Count** - Free 10 initial credits tidak count (hanya paid top-up yang trigger referral)
4. **Email Verification** - Email harus verified (prevent bot accounts)
5. **IP/Device Check** - Different IP/device dari referrer (prevent same person multiple accounts)
6. **Max 17 Referrals/Month** - Limit per user (prevent farming)

### Example Flow

```
User A (Referrer) share code: ABC12XY9
      ↓
User B (Referee) sign up with code ABC12XY9
      ↓
User B get 10 free credits + email verification required
      ↓
User B top-up Rp 150,000 (60 credits)
      ↓
System wait 7 days...
      ↓
Day 8: User B used ≥5 credits, IP verified, device verified
      ↓
System verify referral → User A get 36 credits (60 × 3/5)
```

---

## 9. Competitive Advantage

| Feature                          | BL Parser       | Manual Process | Other Tools\*     |
| -------------------------------- | --------------- | -------------- | ----------------- |
| **Parse B/L otomatis**           | ✅              | ❌             | Limited           |
| **Keyboard shortcuts**           | ✅ (Ctrl+Shift) | ❌             | ❌                |
| **Works with CEISA**             | ✅              | N/A            | ?                 |
| **Works with internal software** | ✅              | N/A            | ?                 |
| **Credit-based pricing**         | ✅              | N/A            | ❌ (subscription) |
| **Referral program**             | ✅              | N/A            | ❌                |
| **Simple & lightweight**         | ✅              | -              | ❌ (complex)      |

\*No direct competitors in Indonesian market for this specific use case

---

## 10. Implementation Timeline (MVP)

| Phase                   | Duration | Deliverables                         |
| ----------------------- | -------- | ------------------------------------ |
| **Backend Core**        | Week 1-2 | Express setup, DB, auth, PDF parsing |
| **Referral & Payments** | Week 2-3 | Xendit integration, fraud prevention |
| **Extension**           | Week 3-4 | Manifest v3, popup, content script   |
| **Website**             | Week 4-5 | Landing, auth, dashboard, payments   |
| **Testing & Deploy**    | Week 5-6 | Tests, Chrome Web Store submit       |

**Total:** 6 weeks to MVP launch

---

## 11. Go-to-Market Strategy

### Launch Phase (Week 1-4 after deploy)

1. **Direct Outreach**

   - Email PPJK list (5-10 target companies)
   - WhatsApp groups untuk customs brokers
   - LinkedIn posts

2. **Content Marketing**

   - Blog post: "Hemat 2 Jam/Hari dengan BL Parser"
   - Demo video: 30 detik showing before/after

3. **Referral Incentive**
   - First 100 users: bonus 20 credits (vs 10 normal)
   - Early adopter: get free upgrades

### Growth Phase (Month 2+)

- Monitor referral metrics
- Optimize based on feedback
- Plan Phase 2 features (image OCR, bulk upload)

---

## 12. Key Risks & Mitigations

| Risk                                               | Probability | Impact | Mitigation                                      |
| -------------------------------------------------- | ----------- | ------ | ----------------------------------------------- |
| **Low adoption**                                   | Medium      | High   | Heavy referral program, free credits            |
| **PDF parsing inaccuracy**                         | Low         | Medium | Use robust pdf-parse library, allow manual edit |
| **Payment issues (Xendit)**                        | Low         | High   | Test thoroughly, backup payment method          |
| **Browser extension rejection** (Chrome Web Store) | Low         | High   | Follow all guidelines, test early, support team |
| **Fraud in referral system**                       | Medium      | Low    | Multi-layer fraud detection                     |

---

## 13. Glossary

| Term                     | Definition                                               |
| ------------------------ | -------------------------------------------------------- |
| **B/L (Bill of Lading)** | Dokumen pengiriman yang berisi detail kargo              |
| **PPJK**                 | Perusahaan Pengurusan Jasa Kepabeanan (customs broker)   |
| **Credit**               | Virtual currency untuk membayar per parsing              |
| **Shortcut**             | Keyboard code (e.g., "sh") yang trigger auto-fill        |
| **Referral Code**        | Unique 10-char code untuk invite friend (e.g., ABC12XY9) |
| **Xendit**               | Payment gateway untuk top-up kredit                      |
| **Content Script**       | Browser extension file yang inject data ke website       |

---

**Document Status:** Complete - MVP Ready  
**Last Updated:** December 23, 2025  
**Next Step:** Development kickoff & GitHub repo creation

---

## 14. FAQ

**Q: Apakah extension ini aman?**  
A: Ya. Semua parsing terjadi di server kami. Extension hanya menyimpan token & shortcut mapping locally. Password tidak pernah dikirim ke website (hanya JWT token).

**Q: Bagaimana jika PDF parsing gagal?**  
A: User bisa edit manual semua field sebelum disimpan. Atau upload ulang dengan PDF yang lebih jelas.

**Q: Boleh pakai lebih dari 1 browser atau komputer?**  
A: Ya, selama login dengan akun yang sama. Setiap device dapat akses semua parsed documents.

**Q: Gimana dengan GDPR/Privacy?**  
A: Raw PDF text disimpan untuk audit trail. User bisa request data deletion anytime. Comply dengan Indonesian privacy laws.

**Q: Kalau parsing salah, bisa refund kredit?**  
A: Refund policy: Jika parsing <80% accuracy, user bisa request manual review & potential refund (max 3x per month).

---

**Document Status:** Complete - MVP Specification Ready  
**Last Updated:** December 23, 2025  
**Version:** 2.0 (Pivoted Product - Browser Extension SaaS)
