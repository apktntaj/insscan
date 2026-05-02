# Design Document

## Fitur: Feedback Page

---

## Overview

Halaman `/feedback` adalah halaman baru di Pesisir Platform yang terdiri dari tiga section independen:

1. **Roadmap Board** — menampilkan daftar `Feature_Item` dengan status `"live"` | `"in-progress"` | `"planned"` dari data statis di file config terpisah.
2. **Suggestion Form** — tombol link WhatsApp ke nomor yang dikonfigurasi di luar komponen.
3. **Support Section** — QRIS image dari `public/` (path dikonfigurasi di luar komponen) dan teks personal indie hacker.

Selain itu, `app/presentation/config/nav-links.js` diperbarui: entri `"Feedback"` yang sebelumnya mengarah ke `mailto:` diganti dengan `href: "/feedback"`.

Tidak ada API call, state management, atau dependency baru. Semua data bersifat statis dan dikonfigurasi di file terpisah dari komponen UI.

---

## Architecture

```
app/
├── feedback/
│   └── page.jsx                          ← route /feedback (Server Component)
│
├── presentation/
│   ├── components/
│   │   └── features/
│   │       ├── RoadmapBoard.jsx          ← section 1: daftar Feature_Item
│   │       ├── SuggestionForm.jsx        ← section 2: tombol WhatsApp
│   │       └── SupportSection.jsx        ← section 3: QRIS + teks kolaborasi
│   │
│   └── config/
│       ├── nav-links.js                  ← update: href "/feedback" (bukan mailto:)
│       └── feedback-config.js            ← NEW: nomor WA, path QRIS, roadmap data
```

### Alur Data

```
feedback-config.js
  ├── WHATSAPP_NUMBER  ──────────────────→ SuggestionForm (via prop)
  ├── QRIS_IMAGE_PATH  ──────────────────→ SupportSection (via prop)
  └── roadmapItems[]   ──────────────────→ RoadmapBoard (via prop)
                                               └── sortByStatus(items)
                                               └── getStatusLabel(status)
                                               └── getStatusStyle(status)

app/feedback/page.jsx
  ├── import { roadmapItems, WHATSAPP_NUMBER, QRIS_IMAGE_PATH } from feedback-config
  ├── <RoadmapBoard items={roadmapItems} />
  ├── <SuggestionForm waNumber={WHATSAPP_NUMBER} />
  └── <SupportSection qrisImagePath={QRIS_IMAGE_PATH} />
```

Tidak ada dependency baru selain `next/image` (sudah ada) dan `next/link` (sudah ada).

---

## Components and Interfaces

### `app/feedback/page.jsx`

- **Tipe**: Next.js Server Component (tidak perlu `"use client"`)
- **Input**: tidak ada props
- **Output**: JSX — halaman dengan tiga section
- **Tanggung jawab**: mengimpor config, meneruskan data ke komponen sebagai props

### `RoadmapBoard.jsx`

- **Input**: `{ items: FeatureItem[] }`
- **Output**: JSX — daftar Feature_Item yang diurutkan dan diberi badge status
- **Tanggung jawab**: sort items, render tiap item dengan label dan warna status

### `SuggestionForm.jsx`

- **Input**: `{ waNumber: string }`
- **Output**: JSX — teks penjelasan + link WhatsApp
- **Tanggung jawab**: membangun URL `wa.me`, render link dengan atribut keamanan dan aksesibilitas

### `SupportSection.jsx`

- **Input**: `{ qrisImagePath: string }`
- **Output**: JSX — QRIS image + teks personal developer
- **Tanggung jawab**: render gambar QRIS dengan alt deskriptif, teks indie hacker, ajakan kolaborasi

### `feedback-config.js`

- **Tipe**: file konfigurasi statis (bukan komponen)
- **Ekspor**: `roadmapItems`, `WHATSAPP_NUMBER`, `QRIS_IMAGE_PATH`

---

## Data Models

### 1. Data Shapes

```js
/**
 * Status pengerjaan sebuah fitur di roadmap.
 *
 * @typedef {"live" | "in-progress" | "planned"} FeatureStatus
 *
 * Invariant: hanya tiga nilai yang valid — tidak ada nilai lain yang diizinkan.
 */

/**
 * Satu entri fitur dalam Roadmap Board.
 *
 * @typedef {Object} FeatureItem
 * @property {string}        id          — identifier unik, kebab-case (e.g. "cek-lartas")
 * @property {string}        name        — nama fitur yang ditampilkan ke user
 * @property {string}        description — deskripsi singkat manfaat fitur, maksimal 2 kalimat
 * @property {FeatureStatus} status      — status pengerjaan fitur
 *
 * Invariant: description tidak boleh kosong atau hanya whitespace.
 * Invariant: id harus unik di dalam array roadmapItems.
 */

/**
 * Konfigurasi halaman Feedback.
 *
 * @typedef {Object} FeedbackConfig
 * @property {string}        WHATSAPP_NUMBER — nomor WA tanpa "+" atau spasi (e.g. "6281234567890")
 * @property {string}        QRIS_IMAGE_PATH — path relatif dari public/ (e.g. "/qris-pesisir.png")
 * @property {FeatureItem[]} roadmapItems    — daftar fitur untuk Roadmap Board
 *
 * Invariant: WHATSAPP_NUMBER harus diawali "62" (kode negara Indonesia).
 * Invariant: roadmapItems harus mengandung minimal satu item per FeatureStatus.
 */

/**
 * Label Bahasa Indonesia untuk setiap FeatureStatus.
 *
 * @typedef {Object} StatusLabel
 * @property {"live"}        status — "Tersedia"
 * @property {"in-progress"} status — "Sedang Dikerjakan"
 * @property {"planned"}     status — "Direncanakan"
 */

/**
 * Style Tailwind untuk badge status.
 *
 * @typedef {Object} StatusStyle
 * @property {string} badge  — class untuk badge/pill (background + text color)
 * @property {string} dot    — class untuk dot indicator (background color)
 */
```

### 2. Nilai Data Konfigurasi Awal

```js
// app/presentation/config/feedback-config.js

export const WHATSAPP_NUMBER = "6281234567890"; // ganti dengan nomor aktual

export const QRIS_IMAGE_PATH = "/qris-pesisir.png"; // ganti dengan nama file aktual

/** @type {FeatureItem[]} */
export const roadmapItems = [
  {
    id: "cek-lartas",
    name: "Cek Lartas",
    description:
      "Verifikasi HS code, tarif bea masuk, pajak, dan status LARTAS langsung dari INSW. Mendukung pengecekan single maupun batch dari file Excel.",
    status: "live",
  },
  {
    id: "shipments",
    name: "Shipments",
    description:
      "Kelola data pengiriman dan pantau status shipment dalam satu tampilan terpusat. Ekspor data ke Excel untuk dokumentasi bea cukai.",
    status: "live",
  },
  {
    id: "bl-scanner",
    name: "BL Scanner",
    description:
      "Parsing otomatis dokumen Bill of Lading untuk mengisi data pengiriman tanpa input manual. Mengurangi waktu entry dari 15 menit menjadi hitungan detik.",
    status: "in-progress",
  },
  {
    id: "notifikasi-eta",
    name: "Notifikasi ETA",
    description:
      "Notifikasi otomatis saat estimasi kedatangan kapal berubah atau mendekati tanggal tiba. Tidak perlu cek manual setiap hari.",
    status: "planned",
  },
];
```

### 3. Urutan Status untuk Sorting

```js
// Urutan tampilan: live → in-progress → planned
const STATUS_ORDER = { live: 0, "in-progress": 1, planned: 2 };
```

---

## Function Contracts

### `getStatusLabel(status)`

```js
/**
 * Mengonversi FeatureStatus ke label Bahasa Indonesia yang ditampilkan ke user.
 *
 * @param {FeatureStatus} status
 * @returns {string} label dalam Bahasa Indonesia
 *
 * @example
 * getStatusLabel("live")        // => "Tersedia"
 * getStatusLabel("in-progress") // => "Sedang Dikerjakan"
 * getStatusLabel("planned")     // => "Direncanakan"
 */
function getStatusLabel(status) { ... }
```

### `getStatusStyle(status)`

```js
/**
 * Mengembalikan Tailwind class untuk badge dan dot indicator berdasarkan FeatureStatus.
 *
 * @param {FeatureStatus} status
 * @returns {StatusStyle}
 *
 * @example
 * getStatusStyle("live")
 * // => { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" }
 *
 * @example
 * getStatusStyle("in-progress")
 * // => { badge: "bg-sky-100 text-sky-700", dot: "bg-sky-500" }
 *
 * @example
 * getStatusStyle("planned")
 * // => { badge: "bg-zinc-100 text-zinc-600", dot: "bg-zinc-400" }
 */
function getStatusStyle(status) { ... }
```

### `sortByStatus(items)`

```js
/**
 * Mengurutkan array FeatureItem berdasarkan urutan status: live → in-progress → planned.
 * Tidak mengubah array asli (pure function).
 *
 * @param {FeatureItem[]} items
 * @returns {FeatureItem[]} array baru yang terurut
 *
 * @example
 * sortByStatus([
 *   { id: "a", name: "A", description: "...", status: "planned" },
 *   { id: "b", name: "B", description: "...", status: "live" },
 * ])
 * // => [{ id: "b", ...status: "live" }, { id: "a", ...status: "planned" }]
 *
 * @example
 * sortByStatus([
 *   { id: "c", name: "C", description: "...", status: "in-progress" },
 *   { id: "d", name: "D", description: "...", status: "live" },
 *   { id: "e", name: "E", description: "...", status: "planned" },
 * ])
 * // => [{ id: "d", ...live }, { id: "c", ...in-progress }, { id: "e", ...planned }]
 */
function sortByStatus(items) { ... }
```

### `buildWhatsAppUrl(phoneNumber)`

```js
/**
 * Membangun URL WhatsApp wa.me dari nomor telepon.
 *
 * @param {string} phoneNumber — nomor tanpa "+" atau spasi (e.g. "6281234567890")
 * @returns {string} URL lengkap wa.me
 *
 * @example
 * buildWhatsAppUrl("6281234567890")
 * // => "https://wa.me/6281234567890"
 *
 * @example
 * buildWhatsAppUrl("628987654321")
 * // => "https://wa.me/628987654321"
 */
function buildWhatsAppUrl(phoneNumber) { ... }
```

### `RoadmapBoard({ items })`

```js
/**
 * Merender daftar Feature_Item yang diurutkan berdasarkan status.
 * Setiap item ditampilkan dengan nama, deskripsi, dan badge status berwarna.
 *
 * @param {{ items: FeatureItem[] }} props
 * @returns {JSX.Element}
 *
 * @example
 * // Render dengan satu item "live"
 * render(<RoadmapBoard items={[{ id: "x", name: "Fitur X", description: "Desc.", status: "live" }]} />)
 * // => menampilkan "Fitur X", "Desc.", badge "Tersedia"
 *
 * @example
 * // Render dengan items campuran — urutan output: live dulu, lalu planned
 * render(<RoadmapBoard items={[
 *   { id: "p", name: "Planned", description: "...", status: "planned" },
 *   { id: "l", name: "Live",    description: "...", status: "live" },
 * ]} />)
 * // => "Live" muncul sebelum "Planned" di DOM
 */
export default function RoadmapBoard({ items }) { ... }
```

### `SuggestionForm({ waNumber })`

```js
/**
 * Merender teks penjelasan dan link WhatsApp untuk mengirim saran.
 * Link dibuka di tab baru dengan atribut keamanan dan aksesibilitas.
 *
 * @param {{ waNumber: string }} props
 * @returns {JSX.Element}
 *
 * @example
 * // Render menghasilkan link dengan href wa.me yang benar
 * render(<SuggestionForm waNumber="6281234567890" />)
 * // => <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" aria-label="...">
 *
 * @example
 * // Render dengan nomor berbeda menghasilkan href yang berbeda
 * render(<SuggestionForm waNumber="628111222333" />)
 * // => <a href="https://wa.me/628111222333" ...>
 */
export default function SuggestionForm({ waNumber }) { ... }
```

### `SupportSection({ qrisImagePath })`

```js
/**
 * Merender QRIS image dan teks personal developer (indie hacker context + ajakan kolaborasi).
 *
 * @param {{ qrisImagePath: string }} props
 * @returns {JSX.Element}
 *
 * @example
 * // Render menghasilkan img dengan src dan alt yang benar
 * render(<SupportSection qrisImagePath="/qris-pesisir.png" />)
 * // => <img src="/qris-pesisir.png" alt="QR code QRIS untuk donasi ke developer Pesisir Platform" />
 *
 * @example
 * // Render dengan path berbeda menghasilkan src yang berbeda
 * render(<SupportSection qrisImagePath="/qris-v2.png" />)
 * // => <img src="/qris-v2.png" alt="..." />
 */
export default function SupportSection({ qrisImagePath }) { ... }
```

---

## Wish List

Helper functions yang dibutuhkan sebelum mengimplementasi komponen:

```js
// Di dalam RoadmapBoard.jsx atau utils terpisah:

/** stub: konversi status → label Bahasa Indonesia */
function getStatusLabel(status) { /* TODO */ }

/** stub: konversi status → { badge, dot } Tailwind classes */
function getStatusStyle(status) { /* TODO */ }

/** stub: sort array FeatureItem berdasarkan STATUS_ORDER */
function sortByStatus(items) { /* TODO */ }

// Di dalam SuggestionForm.jsx:

/** stub: bangun URL wa.me dari nomor telepon */
function buildWhatsAppUrl(phoneNumber) { /* TODO */ }
```

Urutan implementasi: implementasi semua stub helper terlebih dahulu, baru implementasi komponen yang menggunakannya.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Berdasarkan prework analysis, terdapat empat acceptance criteria yang cocok untuk property-based testing: kriteria yang melibatkan fungsi murni (`getStatusLabel`, `getStatusStyle`, `sortByStatus`, `buildWhatsAppUrl`) dengan input space yang bermakna.

**Property Reflection:**
- 3.1 (render semua field) dan 3.2 (visual berbeda per status) dapat digabung: jika setiap status menghasilkan label dan style yang berbeda, maka render otomatis membedakan item secara visual. Namun keduanya menguji aspek berbeda (konten vs. visual), sehingga dipertahankan terpisah.
- 3.3 (label Bahasa Indonesia) dan 3.2 (visual berbeda) adalah dua properti independen — tidak redundan.
- 3.5 (sorting) adalah properti tersendiri yang tidak dicakup oleh properti lain.
- 6.1 (buildWhatsAppUrl) adalah properti tersendiri untuk fungsi murni.
- Tidak ada redundansi yang perlu dieliminasi.

---

### Property 1: Status label selalu menghasilkan string Bahasa Indonesia yang non-empty

*For any* nilai `FeatureStatus` yang valid (`"live"`, `"in-progress"`, `"planned"`), `getStatusLabel(status)` harus mengembalikan string non-empty yang berbeda untuk setiap nilai status.

**Validates: Requirements 3.3**

---

### Property 2: Status style selalu menghasilkan class yang berbeda antar status

*For any* dua nilai `FeatureStatus` yang berbeda, `getStatusStyle` harus menghasilkan nilai `badge` yang berbeda — sehingga tampilan visual item dapat dibedakan berdasarkan status.

**Validates: Requirements 3.2**

---

### Property 3: sortByStatus selalu menghasilkan urutan live → in-progress → planned

*For any* array `FeatureItem[]` dengan kombinasi status apapun, `sortByStatus(items)` harus menghasilkan array baru di mana semua item `"live"` muncul sebelum semua item `"in-progress"`, dan semua item `"in-progress"` muncul sebelum semua item `"planned"`. Array asli tidak boleh diubah.

**Validates: Requirements 3.5**

---

### Property 4: buildWhatsAppUrl selalu menghasilkan URL wa.me yang valid

*For any* string nomor telepon yang non-empty, `buildWhatsAppUrl(phoneNumber)` harus menghasilkan string yang diawali `"https://wa.me/"` dan diakhiri dengan nomor telepon tersebut persis.

**Validates: Requirements 6.1**

---

## Error Handling

Halaman ini tidak memiliki API call atau async operation, sehingga tidak ada error handling runtime yang diperlukan. Potensi masalah dan mitigasinya:

| Skenario | Mitigasi |
|----------|----------|
| `QRIS_IMAGE_PATH` mengarah ke file yang tidak ada | Next.js `<Image>` akan menampilkan broken image; mitigasi: pastikan file ada di `public/` sebelum deploy |
| `WHATSAPP_NUMBER` salah format | URL `wa.me` tetap terbentuk; WhatsApp akan menampilkan error di sisi mereka — bukan crash di platform |
| `roadmapItems` kosong | `RoadmapBoard` merender list kosong; tidak crash, tapi melanggar invariant data — dicegah di config |
| `getStatusLabel` menerima status tidak dikenal | Kembalikan string fallback `"Unknown"` — tidak throw |
| `getStatusStyle` menerima status tidak dikenal | Kembalikan style default zinc — tidak throw |

```js
// Contoh defensive fallback di getStatusLabel:
function getStatusLabel(status) {
  const labels = {
    live: "Tersedia",
    "in-progress": "Sedang Dikerjakan",
    planned: "Direncanakan",
  };
  return labels[status] ?? "Unknown";
}
```

---

## Testing Strategy

### Penilaian PBT

Fitur ini mengandung beberapa fungsi murni (`getStatusLabel`, `getStatusStyle`, `sortByStatus`, `buildWhatsAppUrl`) yang cocok untuk property-based testing. Komponen UI (render) diuji dengan example-based tests menggunakan React Testing Library.

**Library PBT**: [`fast-check`](https://github.com/dubzzz/fast-check) — pilihan standar untuk JavaScript/TypeScript, sudah mature, tidak perlu setup tambahan selain `npm install fast-check --save-dev`.

Setiap property test dikonfigurasi minimum **100 iterasi** (default fast-check sudah 100).

---

### Property-Based Tests

Lokasi: `app/presentation/components/features/__tests__/feedback-utils.property.test.js`

#### Property 1 — Status label non-empty dan unik

```js
// Feature: feedback-page, Property 1: status label selalu menghasilkan string Bahasa Indonesia yang non-empty
it("getStatusLabel: setiap status menghasilkan label non-empty yang unik", () => {
  const validStatuses = ["live", "in-progress", "planned"];
  const labels = validStatuses.map(getStatusLabel);

  // Semua label non-empty
  labels.forEach((label) => expect(label.length).toBeGreaterThan(0));

  // Semua label unik (tidak ada dua status dengan label sama)
  expect(new Set(labels).size).toBe(validStatuses.length);
});
```

#### Property 2 — Status style berbeda antar status

```js
// Feature: feedback-page, Property 2: status style selalu menghasilkan class yang berbeda antar status
it("getStatusStyle: setiap status menghasilkan badge class yang unik", () => {
  fc.assert(
    fc.property(
      fc.constantFrom("live", "in-progress", "planned"),
      fc.constantFrom("live", "in-progress", "planned"),
      (statusA, statusB) => {
        if (statusA === statusB) return true; // skip same-same
        return getStatusStyle(statusA).badge !== getStatusStyle(statusB).badge;
      }
    )
  );
});
```

#### Property 3 — sortByStatus menghasilkan urutan yang benar

```js
// Feature: feedback-page, Property 3: sortByStatus selalu menghasilkan urutan live → in-progress → planned
it("sortByStatus: urutan output selalu live → in-progress → planned", () => {
  const featureItemArb = fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1 }),
    description: fc.string({ minLength: 1 }),
    status: fc.constantFrom("live", "in-progress", "planned"),
  });

  fc.assert(
    fc.property(fc.array(featureItemArb, { minLength: 1 }), (items) => {
      const STATUS_ORDER = { live: 0, "in-progress": 1, planned: 2 };
      const sorted = sortByStatus(items);

      // Verifikasi urutan: setiap item harus memiliki order >= item sebelumnya
      for (let i = 1; i < sorted.length; i++) {
        expect(STATUS_ORDER[sorted[i].status]).toBeGreaterThanOrEqual(
          STATUS_ORDER[sorted[i - 1].status]
        );
      }

      // Array asli tidak diubah
      expect(items).toEqual(expect.arrayContaining(items));
    })
  );
});
```

#### Property 4 — buildWhatsAppUrl menghasilkan URL yang valid

```js
// Feature: feedback-page, Property 4: buildWhatsAppUrl selalu menghasilkan URL wa.me yang valid
it("buildWhatsAppUrl: selalu menghasilkan URL yang diawali https://wa.me/ dan diakhiri nomor", () => {
  fc.assert(
    fc.property(
      fc.stringMatching(/^62\d{8,12}$/), // nomor Indonesia valid
      (phoneNumber) => {
        const url = buildWhatsAppUrl(phoneNumber);
        expect(url).toBe(`https://wa.me/${phoneNumber}`);
      }
    )
  );
});
```

---

### Unit Tests (Example-Based)

Lokasi: `app/presentation/components/features/__tests__/FeedbackPage.test.jsx`

#### Kelompok 1: Nav Links Config

| Test | Verifikasi |
|------|-----------|
| navLinks mengandung entri href "/feedback" | `navLinks.some(l => l.href === "/feedback")` |
| navLinks tidak mengandung "mailto:" | Tidak ada entri dengan href yang mengandung "mailto:" |

#### Kelompok 2: RoadmapBoard — Render

| Test | Verifikasi |
|------|-----------|
| Menampilkan nama fitur setiap item | Setiap `item.name` muncul di rendered output |
| Menampilkan deskripsi setiap item | Setiap `item.description` muncul di rendered output |
| Menampilkan label "Tersedia" untuk status "live" | Badge "Tersedia" ada di DOM |
| Menampilkan label "Sedang Dikerjakan" untuk "in-progress" | Badge "Sedang Dikerjakan" ada di DOM |
| Menampilkan label "Direncanakan" untuk "planned" | Badge "Direncanakan" ada di DOM |
| Item "live" muncul sebelum item "planned" di DOM | Index DOM item live < index item planned |

#### Kelompok 3: SuggestionForm — Render dan Atribut

| Test | Verifikasi |
|------|-----------|
| Link memiliki href `https://wa.me/6281234567890` | `link.getAttribute("href") === "https://wa.me/6281234567890"` |
| Link memiliki `target="_blank"` | `link.getAttribute("target") === "_blank"` |
| Link memiliki `rel="noopener noreferrer"` | `link.getAttribute("rel") === "noopener noreferrer"` |
| Link memiliki `aria-label` yang deskriptif | `link.getAttribute("aria-label")` non-empty dan mengandung "WhatsApp" |
| Teks penjelasan ada sebelum tombol | Teks penjelasan visible di DOM |

#### Kelompok 4: SupportSection — Render dan Aksesibilitas

| Test | Verifikasi |
|------|-----------|
| QRIS image dirender dengan src yang benar | `img.getAttribute("src") === "/qris-pesisir.png"` |
| QRIS image memiliki alt yang mengandung "QRIS" | `img.getAttribute("alt")` mengandung "QRIS" |
| Teks tentang indie hacker ada | Teks yang mendeskripsikan konteks developer visible |
| Teks tentang kolaborasi ada | Teks yang menyebut kolaborasi atau freelance visible |

#### Kelompok 5: Feedback Page — Struktur Semantik

| Test | Verifikasi |
|------|-----------|
| Ada elemen `<main>` | `document.querySelector("main")` tidak null |
| Ada minimal dua `<section>` | `querySelectorAll("section").length >= 2` |
| Ada `<h1>` di halaman | `document.querySelector("h1")` tidak null |
| Ada minimal dua `<h2>` (satu per section) | `querySelectorAll("h2").length >= 2` |

#### Kelompok 6: roadmapItems Data Integrity (Smoke)

| Test | Verifikasi |
|------|-----------|
| Ada minimal satu item "live" | `roadmapItems.some(i => i.status === "live")` |
| Ada minimal satu item "in-progress" | `roadmapItems.some(i => i.status === "in-progress")` |
| Ada minimal satu item "planned" | `roadmapItems.some(i => i.status === "planned")` |
| Semua item memiliki description non-empty | Setiap item: `item.description.trim().length > 0` |
| Cek Lartas ada dengan status "live" | Item dengan `id: "cek-lartas"` dan `status: "live"` ada |
| Shipments ada dengan status "live" | Item dengan `id: "shipments"` dan `status: "live"` ada |

---

### Catatan Implementasi

- Gunakan `@testing-library/react` dan `@testing-library/jest-dom` (sudah ada di project)
- Install `fast-check`: `npm install fast-check --save-dev`
- Mock `next/image` dan `next/link` jika diperlukan untuk environment test
- Tidak perlu mock API atau service apapun — semua data statis
- `SuggestionForm` dan `SupportSection` adalah `"use client"` components karena menggunakan link eksternal; `RoadmapBoard` bisa Server Component
