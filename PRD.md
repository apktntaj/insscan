# 📋 PRD: Shipment ETA Tracking Platform

**Document Version:** 1.1  
**Date:** December 20, 2025  
**Status:** Final

---

## 1. Executive Summary

Aplikasi pelacakan shipment yang memungkinkan pengguna untuk:

1. **Upload Bill of Lading** → sistem otomatis mengisi form shipment
2. **Menyimpan data shipment** → dengan kemampuan edit sebelum disimpan
3. **Auto-fetch & update ETA** → sistem secara otomatis mencari dan memperbaharui jadwal ETA berdasarkan nomor BL
4. **Generate Excel** → untuk keperluan submit dokumen ke Bea Cukai saat mendekati waktu kedatangan

**Target User:** Staff operasional PPJK / Freight Forwarder  
**Core Value:** Otomatisasi input shipment + Real-time ETA tracking

---

## 2. Problem Statement

### Masalah Utama

Saat ini staff operasional PPJK menghadapi **dua masalah utama:**

#### 🔴 Problem 1: Tidak Ada Cara Efektif Memantau Shipment Secara Real-time

| Masalah                             | Dampak                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| **Pengecekan ETA Manual**           | Staff harus membuka website shipping line satu per satu untuk setiap shipment |
| **Tidak Ada Notifikasi Otomatis**   | Perubahan jadwal kapal tidak terdeteksi tepat waktu                           |
| **Data Tersebar**                   | Informasi shipment tersimpan di berbagai tempat (Excel, email, WhatsApp)      |
| **Keterlambatan Persiapan Dokumen** | Karena tidak tahu ETA pasti, persiapan dokumen kepabeanan sering terlambat    |

#### 🔴 Problem 2: Proses Pengisian Form yang Masih Manual

| Masalah                 | Dampak                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| **Input Satu Per Satu** | Staff harus mengetik ulang data dari Bill of Lading ke sistem/Excel |
| **Rentan Human Error**  | Salah ketik nomor BL, nama shipper, atau data lainnya               |
| **Waktu Terbuang**      | 10-15 menit per shipment hanya untuk input data                     |
| **Duplikasi Kerja**     | Data yang sama diinput berkali-kali di tempat berbeda               |

### Situasi Saat Ini (Current Workflow)

```
1. Klien mengirim dokumen Bill of Lading (PDF/foto) via email/WhatsApp
2. Staff membuka dokumen BL, membaca satu per satu field
3. Staff mengetik manual ke Excel: No BL, Shipper, Consignee, Vessel, dll
4. Staff membuka website shipping line untuk cek ETA
5. Staff mencatat ETA di Excel
6. Setiap hari, staff harus buka lagi website untuk cek apakah ETA berubah
7. Menjelang kedatangan, staff baru mulai siapkan dokumen Bea Cukai
8. Jika ETA berubah tanpa diketahui → dokumen terlambat → risiko demurrage
```

### Dampak Bisnis

- ⏱️ **Waktu terbuang:** 1-2 jam per hari untuk input data + cek ETA manual
- 📉 **Risiko kesalahan:** Human error saat input manual menyebabkan masalah di Bea Cukai
- 😤 **Customer experience buruk:** Klien harus bertanya untuk mendapat update status
- 💸 **Potensi kerugian:** Biaya demurrage/detention karena tidak siap saat kapal tiba
- 📋 **Dokumen terlambat:** Persiapan dokumen Bea Cukai mepet karena tidak tahu ETA pasti

---

## 3. Solusi yang Diusulkan

**Aplikasi Shipment Tracker dengan alur kerja:**

```
Upload BL → Auto-fill Form → Edit & Simpan → Auto-fetch ETA → Real-time Update → Generate Excel
```

### Fitur Utama:

1. **Upload Bill of Lading** — User upload file BL (PDF/gambar), sistem otomatis ekstrak data
2. **Auto-Fill Form** — Data dari BL otomatis mengisi form shipment
3. **Edit Sebelum Simpan** — User dapat mengedit/koreksi data sebelum menyimpan
4. **Auto-Fetch ETA** — Setelah disimpan, sistem otomatis mencari jadwal ETA berdasarkan nomor BL
5. **Real-time Update** — Sistem secara berkala memperbaharui ETA (setiap 6-12 jam)
6. **Dashboard Monitoring** — Tampilan semua shipment aktif dengan status ETA terkini
7. **Generate Excel** — Export data shipment ke format Excel untuk submit ke Bea Cukai

---

## 4. MVP (Minimum Viable Product)

### Scope MVP — Phase 1

**Fokus:** Upload BL → Auto-fill → Track ETA → Generate Excel

---

#### Feature 1: Upload Bill of Lading & Auto-Fill Form

**Deskripsi:** User upload dokumen Bill of Lading, sistem otomatis mengekstrak data dan mengisi form.

**User Flow:**

1. User klik "Tambah Shipment"
2. User upload file Bill of Lading (PDF atau gambar)
3. Sistem memproses dokumen dan mengekstrak data
4. Form otomatis terisi dengan data yang diekstrak
5. User mereview dan mengedit data jika perlu
6. User klik "Simpan"

**Data yang Diekstrak & Disimpan:**

- Nomor BL (Bill of Lading) — **required**
- Nama Shipper
- Nama Consignee
- Notify Party
- Nama Vessel / Voyage
- Port of Loading (PoL)
- Port of Discharge (PoD)
- Deskripsi barang (Description of Goods)
- Jumlah container / Quantity
- Berat (Weight)
- Tanggal BL issued

**Kemampuan Edit:**

- Semua field dapat diedit oleh user sebelum disimpan
- Jika ekstraksi gagal/tidak akurat, user bisa input manual
- Validasi: Nomor BL wajib diisi

---

#### Feature 2: Auto-Fetch ETA

**Deskripsi:** Setelah shipment disimpan, sistem otomatis mencari jadwal ETA berdasarkan nomor BL.

**Mekanisme:**

- Sistem melakukan lookup ke sumber data shipping line
- Informasi yang diambil: ETA, vessel name, voyage number, current status
- Data ETA disimpan dan ditampilkan di dashboard
- Jika tidak ditemukan, user bisa input ETA manual

**Sumber Data:**

- API shipping line (prioritas)
- Web scraping sebagai alternatif
- Manual input sebagai fallback

---

#### Feature 3: Periodic ETA Update (Real-time)

**Deskripsi:** Sistem secara berkala memperbaharui ETA untuk semua shipment aktif.

**Mekanisme:**

- Update otomatis setiap 6-12 jam
- Cek ulang ETA untuk setiap shipment yang belum arrived
- Jika ETA berubah:
  - Tampilkan indikator "ETA Updated"
  - Simpan riwayat perubahan ETA
  - (Future) Kirim notifikasi ke user

---

#### Feature 4: Shipment Dashboard

**Deskripsi:** Tampilan daftar semua shipment dengan informasi ETA terkini.

**Tampilan Dashboard:**

- Tabel dengan kolom: No BL, Shipper, Consignee, Vessel, ETA, Status, Last Updated
- Filter: berdasarkan status, tanggal ETA
- Search: berdasarkan nomor BL, shipper, atau consignee
- Sorting: berdasarkan ETA (terdekat dulu sebagai default)

**Status Shipment:**

- 🔵 **On Schedule** — ETA sesuai jadwal
- 🟡 **ETA Changed** — Ada perubahan jadwal
- 🟠 **Arriving Soon** — ETA dalam 3 hari (perlu siapkan dokumen)
- 🟢 **Arrived** — Kapal sudah tiba
- ⚪ **Completed** — Shipment selesai diproses

---

#### Feature 5: Generate Excel untuk Bea Cukai

**Deskripsi:** Export data shipment ke format Excel yang siap untuk keperluan submit dokumen Bea Cukai.

**Trigger:**

- Manual: User klik tombol "Export Excel" pada shipment tertentu
- Suggested: Sistem menyarankan export saat shipment H-3 dari ETA

**Data yang Di-export:**

- Semua informasi shipment (No BL, Shipper, Consignee, dll)
- Informasi ETA terkini
- Tanggal export
- Format sesuai kebutuhan Bea Cukai

**Output:**

- File Excel (.xlsx) yang bisa langsung digunakan untuk referensi submit dokumen

---

### User Flow Lengkap MVP

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW MVP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Upload BL                                                    │
│     └── User upload PDF/gambar Bill of Lading                   │
│                    ↓                                             │
│  2. Auto-Fill Form                                               │
│     └── Sistem ekstrak data → Form terisi otomatis              │
│                    ↓                                             │
│  3. Review & Edit                                                │
│     └── User cek data, edit jika perlu                          │
│                    ↓                                             │
│  4. Simpan                                                       │
│     └── Data tersimpan di database                              │
│                    ↓                                             │
│  5. Auto-Fetch ETA                                               │
│     └── Sistem cari ETA berdasarkan No BL                       │
│                    ↓                                             │
│  6. Dashboard Monitoring                                         │
│     └── Shipment muncul di dashboard dengan ETA                 │
│                    ↓                                             │
│  7. Real-time Update                                             │
│     └── ETA diupdate otomatis setiap 6-12 jam                   │
│                    ↓                                             │
│  8. Arriving Soon (H-3)                                          │
│     └── Status berubah → Sistem suggest "Generate Excel"        │
│                    ↓                                             │
│  9. Generate Excel                                               │
│     └── Export data untuk keperluan Bea Cukai                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Success Metrics MVP

| Metric                        | Target                               |
| ----------------------------- | ------------------------------------ |
| Akurasi ekstraksi data BL     | 85%+ field terisi dengan benar       |
| Akurasi ETA fetch             | 90% berhasil mendapat ETA            |
| Waktu input shipment          | Dari 15 menit → 2 menit per shipment |
| Jumlah shipment yang di-track | 50+ shipment aktif                   |
| User adoption                 | 80% staff menggunakan aplikasi       |

---

## 5. Future Phases (Post-MVP)

Fitur yang akan dikembangkan setelah MVP berhasil:

**Phase 2:**

- Notifikasi WhatsApp/Email saat ETA berubah atau mendekati arrival
- Client portal untuk self-service tracking
- Bulk upload (multiple BL sekaligus)

**Phase 3:**

- Document automation (generate dokumen PIB/BC 1.1)
- Integrasi langsung dengan sistem Bea Cukai
- Multi-user dengan role management
- Riwayat dan analytics shipment

---

## 6. Glossary

| Istilah                 | Definisi                                                             |
| ----------------------- | -------------------------------------------------------------------- |
| **BL (Bill of Lading)** | Dokumen pengiriman yang berisi detail kargo dan kontrak pengangkutan |
| **ETA**                 | Estimated Time of Arrival - perkiraan waktu kedatangan kapal         |
| **PPJK**                | Perusahaan Pengurusan Jasa Kepabeanan (customs clearance company)    |
| **PoL**                 | Port of Loading - pelabuhan muat                                     |
| **PoD**                 | Port of Discharge - pelabuhan bongkar                                |
| **Demurrage**           | Biaya denda karena keterlambatan pengembalian container              |
| **Shipper**             | Pengirim barang                                                      |
| **Consignee**           | Penerima barang                                                      |

---

**Document Status:** Draft - Fokus Problem Statement & MVP  
**Last Updated:** December 20, 2025
