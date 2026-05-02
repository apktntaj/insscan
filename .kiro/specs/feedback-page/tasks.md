# Implementation Plan: Feedback Page

## Overview

Implementasi halaman `/feedback` yang terdiri dari tiga section independen: Roadmap Board, Suggestion Form, dan Support Section. Pendekatan: implementasi helper functions terlebih dahulu, lalu komponen UI, kemudian halaman dan konfigurasi navigasi.

## Tasks

- [x] 1. Buat file konfigurasi `feedback-config.js`
  - Buat `app/presentation/config/feedback-config.js` dengan ekspor `WHATSAPP_NUMBER`, `QRIS_IMAGE_PATH`, dan `roadmapItems`
  - Isi `roadmapItems` dengan data awal: Cek Lartas (`"live"`), Shipments (`"live"`), BL Scanner (`"in-progress"`), Notifikasi ETA (`"planned"`)
  - Tambahkan JSDoc `@typedef` untuk `FeatureStatus`, `FeatureItem`, dan `FeedbackConfig`
  - Pastikan setiap `FeatureItem` memiliki `id` kebab-case unik, `name`, `description` (maks 2 kalimat), dan `status` yang valid
  - _Requirements: 3.4, 4.1, 4.2, 4.3, 8.5_

- [x] 2. Implementasi helper functions di `RoadmapBoard.jsx`
  - [x] 2.1 Implementasi `getStatusLabel(status)`
    - Buat fungsi yang memetakan `"live"` → `"Tersedia"`, `"in-progress"` → `"Sedang Dikerjakan"`, `"planned"` → `"Direncanakan"`
    - Tambahkan fallback `"Unknown"` untuk status tidak dikenal (tidak throw)
    - Tambahkan JSDoc dengan 3 contoh input-output
    - _Requirements: 3.3_

  - [x] 2.2 Implementasi `getStatusStyle(status)`
    - Buat fungsi yang mengembalikan `{ badge, dot }` Tailwind classes per status: emerald untuk `"live"`, sky untuk `"in-progress"`, zinc untuk `"planned"`
    - Tambahkan fallback ke style zinc untuk status tidak dikenal
    - Tambahkan JSDoc dengan 3 contoh input-output
    - _Requirements: 3.2_

  - [x] 2.3 Implementasi `sortByStatus(items)`
    - Buat pure function yang mengurutkan `FeatureItem[]` berdasarkan `STATUS_ORDER = { live: 0, "in-progress": 1, planned: 2 }`
    - Gunakan `.slice().sort()` agar tidak mengubah array asli
    - Tambahkan JSDoc dengan 2 contoh input-output
    - _Requirements: 3.5_

  - [ ]* 2.4 Tulis property tests untuk helper functions di `feedback-utils.property.test.js`
    - **Property 1: `getStatusLabel` — setiap status menghasilkan label non-empty yang unik**
    - **Validates: Requirements 3.3**
    - **Property 2: `getStatusStyle` — setiap pasang status berbeda menghasilkan `badge` class yang berbeda**
    - **Validates: Requirements 3.2**
    - **Property 3: `sortByStatus` — output selalu berurutan live → in-progress → planned, array asli tidak diubah**
    - **Validates: Requirements 3.5**
    - Install `fast-check` sebagai dev dependency: `npm install fast-check --save-dev`
    - Lokasi: `app/presentation/components/features/__tests__/feedback-utils.property.test.js`

- [x] 3. Implementasi helper function `buildWhatsAppUrl` di `SuggestionForm.jsx`
  - [x] 3.1 Implementasi `buildWhatsAppUrl(phoneNumber)`
    - Buat fungsi yang mengembalikan `"https://wa.me/" + phoneNumber`
    - Tambahkan JSDoc dengan 2 contoh input-output
    - _Requirements: 6.1_

  - [ ]* 3.2 Tulis property test untuk `buildWhatsAppUrl`
    - **Property 4: `buildWhatsAppUrl` — selalu menghasilkan URL yang diawali `https://wa.me/` dan diakhiri nomor persis**
    - **Validates: Requirements 6.1**
    - Gunakan `fc.stringMatching(/^62\d{8,12}$/)` sebagai arbitrary
    - Lokasi: `app/presentation/components/features/__tests__/feedback-utils.property.test.js`

- [x] 4. Implementasi komponen `RoadmapBoard.jsx`
  - Buat `app/presentation/components/features/RoadmapBoard.jsx`
  - Terima prop `{ items: FeatureItem[] }`, panggil `sortByStatus(items)` sebelum render
  - Render setiap item dengan nama, deskripsi, dan badge status menggunakan `getStatusLabel` dan `getStatusStyle`
  - Gunakan elemen semantik yang sesuai (list, heading jika diperlukan)
  - Pastikan layout tidak menyebabkan horizontal scroll pada lebar 320px (gunakan Tailwind responsive utilities)
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 7.2_

- [x] 5. Implementasi komponen `SuggestionForm.jsx`
  - Buat `app/presentation/components/features/SuggestionForm.jsx`
  - Terima prop `{ waNumber: string }`, bangun URL dengan `buildWhatsAppUrl(waNumber)`
  - Render teks penjelasan singkat sebelum tombol/link
  - Render `<a>` dengan `href`, `target="_blank"`, `rel="noopener noreferrer"`, dan `aria-label` yang mengandung "WhatsApp"
  - Label link harus deskriptif (contoh: "Kirim Saran via WhatsApp")
  - Pastikan tombol tidak terpotong pada lebar 320px
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.3, 7.5_

- [x] 6. Implementasi komponen `SupportSection.jsx`
  - Buat `app/presentation/components/features/SupportSection.jsx`
  - Terima prop `{ qrisImagePath: string }`
  - Render QRIS image menggunakan `next/image` dengan `src={qrisImagePath}` dan `alt` yang mengandung "QRIS" dan menjelaskan tujuan donasi
  - Render teks personal indie hacker: konteks developer dan ajakan kolaborasi/freelance
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [-] 7. Checkpoint — Pastikan semua tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Buat halaman `/feedback`
  - Buat `app/feedback/page.jsx` sebagai Next.js Server Component (tanpa `"use client"`)
  - Import `roadmapItems`, `WHATSAPP_NUMBER`, `QRIS_IMAGE_PATH` dari `feedback-config.js`
  - Import dan render `<RoadmapBoard items={roadmapItems} />`, `<SuggestionForm waNumber={WHATSAPP_NUMBER} />`, `<SupportSection qrisImagePath={QRIS_IMAGE_PATH} />`
  - Gunakan elemen semantik: `<main>`, minimal dua `<section>`, `<h1>`, minimal dua `<h2>`
  - Tambahkan `<title>` yang mengandung "Feedback" dan nama platform (gunakan Next.js `metadata` export)
  - Gunakan layout global yang sama seperti halaman lain (Navbar via `app/layout.jsx`)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1, 7.4_

- [ ] 9. Update `nav-links.js` — ganti `mailto:` dengan `/feedback`
  - Edit `app/presentation/config/nav-links.js`: ubah entri `"Feedback"` dari `href: "mailto:alamasyarie@outlook.com"` menjadi `href: "/feedback"`
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 10. Export komponen baru dari `index.js`
  - Tambahkan ekspor `RoadmapBoard`, `SuggestionForm`, dan `SupportSection` ke `app/presentation/components/index.js`
  - _Requirements: 2.1_

- [ ] 11. Tulis unit tests (example-based) di `FeedbackPage.test.jsx`
  - [ ]* 11.1 Tulis unit tests untuk nav-links config
    - Verifikasi `navLinks` mengandung entri `href: "/feedback"` dan tidak ada `"mailto:"`
    - _Requirements: 1.1_

  - [ ]* 11.2 Tulis unit tests untuk `RoadmapBoard`
    - Verifikasi render nama, deskripsi, dan label status setiap item
    - Verifikasi item `"live"` muncul sebelum item `"planned"` di DOM
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ]* 11.3 Tulis unit tests untuk `SuggestionForm`
    - Verifikasi `href`, `target="_blank"`, `rel="noopener noreferrer"`, dan `aria-label` pada link
    - Verifikasi teks penjelasan ada sebelum tombol
    - _Requirements: 5.2, 6.1, 6.3, 6.4, 7.5_

  - [ ]* 11.4 Tulis unit tests untuk `SupportSection`
    - Verifikasi `src` dan `alt` QRIS image
    - Verifikasi teks indie hacker dan ajakan kolaborasi ada di DOM
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 11.5 Tulis unit tests untuk struktur semantik halaman Feedback
    - Verifikasi ada `<main>`, minimal dua `<section>`, `<h1>`, minimal dua `<h2>`
    - _Requirements: 7.4_

  - [ ]* 11.6 Tulis unit tests untuk integritas data `roadmapItems`
    - Verifikasi ada minimal satu item per status, semua deskripsi non-empty, Cek Lartas dan Shipments ada dengan status `"live"`
    - _Requirements: 3.4, 4.1, 4.4_

  - Lokasi: `app/presentation/components/features/__tests__/FeedbackPage.test.jsx`

- [ ] 12. Final checkpoint — Pastikan semua tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Urutan implementasi mengikuti prinsip "wish list before implementation": helper functions dulu, baru komponen yang menggunakannya
- Tidak ada API call atau state management — semua data statis dari `feedback-config.js`
- Install `fast-check` diperlukan sebelum menjalankan property tests: `npm install fast-check --save-dev`
- Mock `next/image` dan `next/link` mungkin diperlukan di environment test
- Setiap task mereferensikan requirement spesifik untuk traceability
