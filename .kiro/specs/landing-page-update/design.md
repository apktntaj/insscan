# Design Document

## Fitur: Landing Page Update

---

## Overview

Pembaruan ini memodifikasi satu file — `app/page.jsx` — untuk mencerminkan dua modul aktif platform: **Cek Lartas** dan **Shipments**. Tidak ada komponen baru, API call, atau state management yang terlibat. Seluruh perubahan bersifat konten/copy: memperbarui data arrays (`productCards`, `quickFlow`) dan teks inline di JSX, serta menghapus semua referensi ke BL Scanner.

Karena ini adalah perubahan konten murni pada halaman statis, tidak ada arsitektur baru yang diperkenalkan. Design ini mendokumentasikan bentuk data yang digunakan, kontrak fungsi render, dan contoh konkret nilai sebelum/sesudah.

---

## Architecture

Tidak ada perubahan arsitektur. `app/page.jsx` adalah React Server Component (Next.js App Router) yang merender konten statis. Alur data tetap sama:

```
app/page.jsx
  ├── const productCards = [...]   ← array data kartu produk
  ├── const quickFlow = [...]      ← array langkah alur cepat
  └── export default function Home()
        ├── <section> Hero Section
        │     ├── <h1> headline
        │     ├── <p> deskripsi
        │     └── <Link> CTA buttons
        ├── <section> Product Cards
        │     └── productCards.map(card => <article>)
        └── <section> Alur Cepat
              └── quickFlow.map(step => <li>)
```

Tidak ada dependency baru. Hanya `next/link` yang digunakan (sudah ada).

---

## Components and Interfaces

Tidak ada komponen baru. Satu-satunya file yang dimodifikasi adalah `app/page.jsx`.

### Komponen yang Dimodifikasi

**`Home` (default export dari `app/page.jsx`)**

- Input: tidak ada (Server Component tanpa props)
- Output: JSX — halaman landing yang dirender
- Perubahan: teks headline, deskripsi, CTA labels, CTA hrefs, isi `productCards`, isi `quickFlow`

---

## Data Models

### 1. Data Shapes

```js
/**
 * Merepresentasikan satu kartu produk di Product Cards Section.
 *
 * @typedef {Object} ProductCard
 * @property {string} title       — Nama modul, ditampilkan sebagai heading kartu
 * @property {string} description — Deskripsi singkat fungsi modul
 * @property {string[]} points    — Daftar fitur/poin utama modul (2–4 item)
 * @property {string} href        — Route tujuan CTA, harus diawali "/"
 * @property {string} cta         — Label teks CTA button
 * @property {string} accent      — Tailwind gradient class untuk dekorasi kartu
 * @property {string} dot         — Tailwind bg class untuk bullet point
 *
 * Invariant: href harus "/cek-lartas" atau "/shipments" — tidak boleh "/blscann" atau "/inscann"
 * Invariant: array productCards harus berisi tepat 2 elemen
 */

/**
 * Merepresentasikan satu langkah di Alur Cepat Section.
 *
 * @typedef {string} QuickFlowStep
 * Teks instruksi satu langkah alur kerja.
 *
 * Invariant: array quickFlow harus berisi tepat 3 elemen
 * Invariant: tidak boleh mengandung kata "BL Scanner", "INScann", atau "BL copy-chain"
 */
```

### 2. Nilai Data Setelah Pembaruan

#### `productCards` (setelah update)

```js
const productCards = [
  {
    title: "Cek Lartas",
    description:
      "Verifikasi HS code, tarif bea masuk, pajak, dan status LARTAS langsung dari sumber INSW.",
    points: [
      "Cek HS code single maupun batch dari file Excel.",
      "Lihat tarif BM, PPN, PPH, dan PPH Non-API.",
      "Periksa status LARTAS dan detail regulasi impor.",
    ],
    href: "/cek-lartas",
    cta: "Buka Cek Lartas",
    accent: "from-cyan-500/20 to-sky-500/20",
    dot: "bg-cyan-500",
  },
  {
    title: "Shipments",
    description:
      "Kelola data pengiriman dan pantau status shipment dalam satu tampilan terpusat.",
    points: [
      "Input dan edit data pengiriman secara manual.",
      "Pantau status dan estimasi kedatangan.",
      "Ekspor data ke Excel untuk dokumentasi bea cukai.",
    ],
    href: "/shipments",
    cta: "Lihat Shipments",
    accent: "from-sky-500/20 to-cyan-500/20",
    dot: "bg-sky-500",
  },
];
```

#### `quickFlow` (setelah update)

```js
const quickFlow = [
  "Input data pengiriman di modul Shipments — catat nomor BL, shipper, dan estimasi kedatangan.",
  "Verifikasi HS code dan status LARTAS di modul Cek Lartas sebelum proses kepabeanan.",
  "Ekspor atau catat hasil untuk keperluan dokumentasi dan pelaporan bea cukai.",
];
```

#### Teks Hero Section (setelah update)

```js
// Headline (h1):
"Workspace operasional untuk Cek Lartas dan manajemen Shipments."

// Deskripsi (p):
"Gunakan Cek Lartas untuk verifikasi HS code, tarif, dan status LARTAS dari INSW. Kelola data pengiriman di modul Shipments untuk tracking dan dokumentasi bea cukai."

// CTA pertama:
href="/cek-lartas", label="Buka Cek Lartas"

// CTA kedua:
href="/shipments", label="Lihat Shipments"
```

---

## Function Contracts

### `Home()` — komponen halaman utama

```js
/**
 * Merender halaman landing Pesisir Platform.
 * Menampilkan Hero Section, Product Cards Section, dan Alur Cepat Section
 * berdasarkan data statis productCards dan quickFlow.
 *
 * @returns {JSX.Element}
 *
 * @example
 * // Render menghasilkan h1 yang mengandung "Cek Lartas" dan "Shipments"
 * render(<Home />)
 * // => <h1>...Cek Lartas...Shipments...</h1>
 *
 * @example
 * // Render menghasilkan tepat 2 elemen article (kartu produk)
 * render(<Home />)
 * // => querySelectorAll('article').length === 2
 */
export default function Home() { ... }
```

### Wish List (helper implisit dalam JSX)

Tidak ada helper function baru yang diperlukan. Semua render dilakukan via `.map()` inline di JSX, mengikuti pola yang sudah ada di file.

---

## Correctness Properties

Berdasarkan prework analysis, **semua acceptance criteria diklasifikasikan sebagai EXAMPLE atau SMOKE** — tidak ada yang cocok untuk property-based testing.

Alasan PBT tidak applicable untuk fitur ini:
- Tidak ada fungsi murni dengan input space yang besar
- Tidak ada transformasi data, parsing, atau algoritma
- Semua konten adalah data statis hardcoded di array dan string JSX
- Tidak ada logika kondisional yang bergantung pada input variabel
- Menjalankan 100 iterasi tidak akan menemukan bug lebih banyak dari 1–2 contoh

Pengujian yang tepat untuk fitur ini adalah **example-based unit tests** menggunakan React Testing Library, yang memverifikasi konten rendered output.

---

## Error Handling

Tidak ada error handling baru yang diperlukan. Halaman ini adalah Server Component statis tanpa:
- API calls yang bisa gagal
- State yang bisa invalid
- Input pengguna yang perlu divalidasi
- Async operations

Satu-satunya "error" yang mungkin adalah broken link (href salah), yang dicegah dengan mendefinisikan href secara eksplisit di data shape `ProductCard` dan diverifikasi via example tests.

---

## Testing Strategy

Karena fitur ini adalah perubahan konten statis, strategi pengujian menggunakan **example-based unit tests** saja. PBT tidak applicable (lihat bagian Correctness Properties).

### Unit Tests (React Testing Library)

Semua test berada di `app/__tests__/page.test.jsx` (atau `app/page.test.jsx`).

#### Kelompok 1: Hero Section

| Test | Verifikasi |
|------|-----------|
| Hero headline menyebut kedua modul | `h1` mengandung "Cek Lartas" dan "Shipments" |
| Hero headline tidak menyebut BL Scanner | `h1` tidak mengandung "BL Scanner" atau "BL copy-chain" |
| CTA pertama mengarah ke /cek-lartas | Link dengan teks "Buka Cek Lartas" memiliki `href="/cek-lartas"` |
| CTA kedua mengarah ke /shipments | Link dengan teks "Lihat Shipments" memiliki `href="/shipments"` |
| Tidak ada referensi /blscann di Hero | Tidak ada `href` yang mengandung "/blscann" atau "/inscann" |

#### Kelompok 2: Product Cards Section

| Test | Verifikasi |
|------|-----------|
| Tepat dua kartu produk | `querySelectorAll('article').length === 2` |
| Kartu Cek Lartas ada dan benar | Kartu dengan judul "Cek Lartas" dan `href="/cek-lartas"` |
| Kartu Shipments ada dan benar | Kartu dengan judul "Shipments" dan `href="/shipments"` |
| Tidak ada kartu BL Scanner | Tidak ada teks "BL Scanner" di section kartu |
| Tidak ada teks "coming soon" | Tidak ada teks "coming soon" di seluruh halaman |

#### Kelompok 3: Alur Cepat Section

| Test | Verifikasi |
|------|-----------|
| Tepat tiga langkah | `querySelectorAll('ol li').length === 3` |
| Langkah 1 tentang Shipments | Teks langkah 1 mengandung "Shipments" atau "pengiriman" |
| Langkah 2 tentang Cek Lartas/LARTAS | Teks langkah 2 mengandung "HS code" atau "LARTAS" |
| Langkah 3 tentang ekspor/dokumentasi | Teks langkah 3 mengandung "ekspor" atau "dokumentasi" |
| Tidak ada referensi BL Scanner | Tidak ada teks "BL Scanner" di Alur Cepat |

#### Kelompok 4: Kebersihan Kode (Smoke)

| Test | Verifikasi |
|------|-----------|
| Tidak ada href /blscann atau /inscann | Semua Link href tidak mengandung "/blscann" atau "/inscann" |
| Tidak ada teks "INScann" | Rendered output tidak mengandung "INScann" |
| Tidak ada teks "BL copy-chain" | Rendered output tidak mengandung "BL copy-chain" |

### Contoh Test (React Testing Library)

```js
import { render, screen } from "@testing-library/react";
import Home from "../page";

describe("Landing Page — Hero Section", () => {
  it("menampilkan headline yang menyebut Cek Lartas dan Shipments", () => {
    render(<Home />);
    const headline = screen.getByRole("heading", { level: 1 });
    expect(headline).toHaveTextContent("Cek Lartas");
    expect(headline).toHaveTextContent("Shipments");
  });

  it("tidak menyebut BL Scanner di headline", () => {
    render(<Home />);
    const headline = screen.getByRole("heading", { level: 1 });
    expect(headline).not.toHaveTextContent("BL Scanner");
    expect(headline).not.toHaveTextContent("BL copy-chain");
  });

  it("CTA pertama mengarah ke /cek-lartas dengan label yang benar", () => {
    render(<Home />);
    const ctaPrimary = screen.getByRole("link", { name: "Buka Cek Lartas" });
    expect(ctaPrimary).toHaveAttribute("href", "/cek-lartas");
  });

  it("CTA kedua mengarah ke /shipments dengan label yang benar", () => {
    render(<Home />);
    const ctaSecondary = screen.getByRole("link", { name: "Lihat Shipments" });
    expect(ctaSecondary).toHaveAttribute("href", "/shipments");
  });
});

describe("Landing Page — Product Cards Section", () => {
  it("menampilkan tepat dua kartu produk", () => {
    render(<Home />);
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(2);
  });

  it("tidak menampilkan kartu BL Scanner", () => {
    render(<Home />);
    expect(screen.queryByText(/BL Scanner/i)).not.toBeInTheDocument();
  });
});

describe("Landing Page — Alur Cepat Section", () => {
  it("menampilkan tepat tiga langkah", () => {
    render(<Home />);
    const heading = screen.getByText("Alur Cepat");
    const section = heading.closest("section");
    const steps = section.querySelectorAll("li");
    expect(steps).toHaveLength(3);
  });
});
```

### Catatan Implementasi

- Gunakan `@testing-library/react` dan `@testing-library/jest-dom` (sudah ada di project via Jest config)
- Mock `next/link` jika diperlukan untuk environment test
- Tidak perlu mock API atau service apapun — halaman ini sepenuhnya statis
