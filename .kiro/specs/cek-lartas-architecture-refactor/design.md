# Dokumen Desain: Cek Lartas Architecture Refactor

## Overview

Refactoring ini memindahkan modul **Cek Lartas** dari arsitektur ad-hoc yang tumbuh organik ke
arsitektur berbasis prinsip **HtDP (How to Design Programs)** yang eksplisit. Ini adalah **pilot
module** — pola yang terbentuk di sini akan direplikasi ke modul lain.

Empat perubahan inti:

1. **Relokasi `core/`** — Pindah dari `app/core/` ke `core/` di root, agar framework-independence
   terbukti secara struktural, bukan hanya klaim.
2. **Eliminasi impossible states** — Entity `HsCode` diganti `Lartas` yang menggunakan
   `Map<KategoriLartas, LartasDetail[]>` sebagai pengganti empat boolean flags terpisah. TypeScript
   compiler yang menjaga invariant, bukan runtime check.
3. **Boundary parser eksplisit** — `parseInswResponse` di `core/cek-lartas/boundary.ts` menjadi
   satu-satunya titik masuk data dari INSW API ke dalam core. Setelah data melewati boundary,
   semua kode di core dapat mempercayai strukturnya.
4. **Use case yang bersih** — `fetchSingle` dan `fetchMultiple` tidak lagi membaca environment
   variables delay/retry. Itu infrastructure concern; use case hanya berisi business rules.

### Batas Scope

Refactoring ini menyentuh:
- `core/cek-lartas/` (modul baru, sepenuhnya TypeScript)
- `app/core/` (file hs-code dipindahkan; modul lain tetap di tempat)
- `app/cek-lartas/actions.ts` (Server Actions baru, menggantikan API routes)
- `app/adapters/presenters/hs-code.presenter.js` (thin adapter, transformasi Lartas[] ke view model)
- `app/infrastructure/services/insw-api.service.js` (implementasi HsCodeGateway sebagai plain object)
- `app/presentation/hooks/useCekLartasSingle.js` dan `useCekLartasFile.js` (panggil Server Action)
- `tsconfig.json` dan `jest.config.js` (tambah path alias `@core/*`)
- `docs/architecture/cek-lartas-refactor.md` (narasi perubahan)

Tidak disentuh: komponen React di `app/presentation/components/`, modul lain di `app/core/`,
`app/blscann/`, `app/feedback/`, dan seluruh infrastruktur di luar Cek Lartas.


---

## Architecture

### Struktur Folder Setelah Refactor

```
core/                              ← pindah ke root, keluar dari app/
└── cek-lartas/
    ├── types.ts                   ← HsCode, Lartas, KategoriLartas, LartasDetail, Tarif, RawInsw
    ├── ports.ts                   ← HsCodeGateway interface
    ├── boundary.ts                ← parseInswResponse (satu-satunya titik masuk data INSW)
    ├── hs-code.ts                 ← makeHsCode, isValidHsCode, formatHsCode, hasLartas, getLartasByKategori
    └── use-cases/
        └── fetch-lartas.ts        ← fetchSingle, fetchMultiple

app/
├── cek-lartas/
│   ├── actions.ts                 ← "use server", fetchLartas, fetchLartasBatch
│   └── page.jsx                   ← tidak berubah
├── adapters/
│   └── presenters/
│       └── hs-code.presenter.js   ← thin adapter, transformasi Lartas[] ke view model
├── infrastructure/
│   └── services/
│       └── insw-api.service.js    ← implementasi HsCodeGateway sebagai plain object
└── presentation/
    └── hooks/
        ├── useCekLartasSingle.js  ← panggil Server Action fetchLartas
        └── useCekLartasFile.js    ← panggil Server Action fetchLartasBatch
```

### Diagram Dependency Flow

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer                                     │
│  useCekLartasSingle.js  useCekLartasFile.js             │
└────────────────┬────────────────┬───────────────────────┘
                 │ panggil        │ panggil
                 ▼                ▼
┌─────────────────────────────────────────────────────────┐
│  Server Actions  (app/cek-lartas/actions.ts)            │
│  fetchLartas()   fetchLartasBatch()                     │
└────────────────┬────────────────────────────────────────┘
                 │ gunakan
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Core  (core/cek-lartas/)                               │
│  fetchSingle / fetchMultiple  (use-cases)               │
│  parseInswResponse             (boundary)               │
│  makeHsCode / hasLartas        (hs-code)                │
└────────────────┬────────────────────────────────────────┘
                 │ via HsCodeGateway port
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Infrastructure  (app/infrastructure/services/)         │
│  inswApiGateway  — implementasi HsCodeGateway           │
└─────────────────────────────────────────────────────────┘
```

### Keputusan Desain Utama

| Keputusan | Alasan |
|-----------|--------|
| `Map<KategoriLartas, LartasDetail[]>` bukan boolean flags | Menghilangkan impossible state: `hasLartasBorder: true` tapi `lartasBorderDetails: []` tidak mungkin terjadi |
| `makeHsCode` return `Result`, tidak throw | Konsisten dengan boundary philosophy — caller memutuskan cara handle error |
| `fetchSingle` terima `HsCode` bukan `string` | Validasi format sudah selesai sebelum use case dipanggil; use case tidak perlu re-validate |
| Gateway sebagai plain object, bukan class | Lebih ringan, lebih mudah di-mock di test, tidak ada `this` binding issues |
| Server Actions menggantikan API routes | App Router pattern; tidak perlu serialisasi HTTP manual untuk komunikasi client-server dalam app yang sama |
| Streaming dihilangkan | Menyederhanakan arsitektur secara signifikan; Server Action single-call cukup untuk UX yang ditargetkan |


---

## Components and Interfaces

### `core/cek-lartas/types.ts`

File ini berisi semua type definitions. Tidak ada fungsi di sini — hanya data shapes.

### `core/cek-lartas/ports.ts`

Mendefinisikan `HsCodeGateway` interface yang diimplementasikan oleh `inswApiGateway`.

### `core/cek-lartas/boundary.ts`

Berisi `parseInswResponse` — satu-satunya titik transformasi data mentah INSW ke tipe `Lartas`.

### `core/cek-lartas/hs-code.ts`

Berisi factory `makeHsCode` dan helper functions murni: `isValidHsCode`, `formatHsCode`,
`hasLartas`, `getLartasByKategori`.

### `core/cek-lartas/use-cases/fetch-lartas.ts`

Berisi `fetchSingle` dan `fetchMultiple` — orchestrasi panggilan ke gateway dan parsing.

### `app/cek-lartas/actions.ts`

Server Actions yang dipanggil langsung oleh hooks. Menghubungkan core dengan infrastruktur
(menyuntikkan `inswApiGateway` ke use case).

### `app/adapters/presenters/hs-code.presenter.js`

Thin adapter: mengubah `Lartas[]` ke view model untuk komponen React dan format Excel.
Tidak mengandung logika bisnis.

---

## Data Models

### 1. Data Shapes

Semua data shapes didefinisikan di `core/cek-lartas/types.ts` sebelum implementasi fungsi apapun,
sesuai prinsip HtDP "define data first".

```typescript
// core/cek-lartas/types.ts

/**
 * @typedef HsCode
 * Pure value object: identitas kode HS, tidak membawa tarif atau regulasi.
 * Invariant: code adalah string 2, 4, 6, atau 8 digit numerik.
 * Hanya dibuat melalui makeHsCode() — tidak pernah dikonstruksi langsung.
 */
export type HsCode = {
  readonly code: string;
};

/**
 * @typedef KategoriLartas
 * String union untuk tiga jalur pengawasan LARTAS.
 * Digunakan sebagai key di Map regulasi — satu Lartas bisa punya entry di semua kategori.
 * "border"       = regulasi impor yang diperiksa di border crossing
 * "post-border"  = regulasi impor yang diperiksa setelah barang masuk wilayah RI
 * "ekspor"       = regulasi ekspor
 */
export type KategoriLartas = "border" | "post-border" | "ekspor";

/**
 * @typedef LartasDetail
 * Satu entri regulasi LARTAS untuk satu izin/dokumen pada kategori tertentu.
 * Berlaku untuk semua kategori (border, post-border, ekspor).
 *
 * Invariant: namaIzin wajib ada (tidak boleh null/undefined).
 * Semua field lain nullable karena data INSW sering tidak lengkap.
 */
export type LartasDetail = {
  namaIzin: string;               // wajib — nama izin/regulasi (contoh: "Persetujuan Impor")
  kodeIzin: string | null;        // kode izin (contoh: "PI")
  noSkep: string | null;          // nomor SK/peraturan (contoh: "Permendag No. 36/2023")
  idDokumen: string | null;       // ID dokumen di sistem INSW
  dokumenPabean: string[] | null; // kode dokumen pabean (contoh: ["20", "40"])
  tanggalMulai: string | null;    // tanggal mulai berlaku (ISO string atau format INSW)
  tanggalAkhir: string | null;    // tanggal berakhir (null = berlaku selamanya)
  link: string | null;            // URL dokumen regulasi (PDF atau halaman web)
};

/**
 * @typedef Tarif
 * Data perpajakan impor untuk satu HS code.
 * Semua field nullable karena tidak semua HS code memiliki data lengkap di INSW.
 *
 * bm       = Bea Masuk MFN, contoh: "0.00%"
 * ppn      = Pajak Pertambahan Nilai, contoh: "12.00%"
 * pph      = PPh Pasal 22 (importir API), contoh: "10.00%"
 * pphNonApi = PPh Pasal 22 (importir non-API), contoh: "20.00%"
 */
export type Tarif = {
  bm: string | null;
  ppn: string | null;
  pph: string | null;
  pphNonApi: string | null;
};

/**
 * @typedef Lartas
 * Tipe inti modul Cek Lartas. Hasil query satu HS code ke INSW yang sudah diparse.
 *
 * regulasi menggunakan Map bukan flat boolean flags agar:
 * - Tidak ada impossible state (hasLartasBorder: true tapi lartasBorderDetails: [] tidak mungkin)
 * - Penambahan kategori baru di masa depan tidak memerlukan perubahan struktur
 * - "ada atau tidaknya LARTAS" cukup dicek dengan regulasi.size > 0 atau regulasi.has(kategori)
 *
 * Map kosong (size === 0) berarti tidak ada LARTAS untuk HS code ini.
 * Map.get(kategori) mengembalikan undefined jika tidak ada regulasi untuk kategori tersebut.
 */
export type Lartas = {
  hsCode: HsCode;
  tarif: Tarif;
  regulasi: Map<KategoriLartas, LartasDetail[]>;
};

/**
 * @typedef RawInsw
 * Data mentah dari gateway INSW sebelum parsing. Tipe "tidak dipercaya" — hanya ada di boundary.
 * Semua field optional karena API INSW tidak konsisten.
 *
 * Tipe ini hanya digunakan sebagai parameter parseInswResponse.
 * Setelah parsing berhasil, RawInsw tidak pernah bocor ke dalam core.
 */
export type RawInsw = {
  bm?: string | null;
  ppn?: string | null;
  pph?: string | null;
  pphNonApi?: string | null;
  hasLartasImport?: boolean;
  hasLartasBorder?: boolean;
  hasLartasPostBorder?: boolean;
  hasLartasExport?: boolean;
  lartasBorderDetails?: unknown[];
  lartasPostBorderDetails?: unknown[];
  lartasExportDetails?: unknown[];
  [key: string]: unknown;
};

/**
 * @typedef Result
 * Generic result type untuk operasi yang bisa gagal tanpa throw.
 * Digunakan oleh makeHsCode dan parseInswResponse.
 */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

### 2. HsCodeGateway Port

```typescript
// core/cek-lartas/ports.ts

import type { HsCode, RawInsw } from "./types";

/**
 * @typedef HsCodeGateway
 * Interface untuk sumber data HS code eksternal.
 * Diimplementasikan oleh infrastructure layer sebagai plain object (bukan class).
 *
 * Kontrak: fetchByCode menerima HsCode (bukan string mentah).
 * Caller bertanggung jawab memastikan HsCode sudah valid sebelum memanggil gateway.
 * Gateway mengembalikan null jika data tidak ditemukan — tidak throw.
 */
export interface HsCodeGateway {
  fetchByCode(code: HsCode): Promise<RawInsw | null>;
}
```


---

## Function Contracts

### File: `core/cek-lartas/hs-code.ts`

---

#### `makeHsCode`

```typescript
/**
 * Membuat HsCode yang valid dari string kode.
 * Validasi: hanya format 2, 4, 6, atau 8 digit numerik yang diterima.
 * Tidak throw — error dikembalikan sebagai { ok: false, error }.
 *
 * @param code - string kandidat kode HS
 * @returns Result<HsCode>
 *
 * @example
 * makeHsCode("84713090")
 * // => { ok: true, data: { code: "84713090" } }
 *
 * @example
 * makeHsCode("8471")
 * // => { ok: true, data: { code: "8471" } }
 *
 * @example
 * makeHsCode("847130")
 * // => { ok: true, data: { code: "847130" } }
 *
 * @example
 * makeHsCode("84")
 * // => { ok: true, data: { code: "84" } }
 *
 * @example
 * makeHsCode("8471309")   // 7 digit — tidak valid
 * // => { ok: false, error: "HS code harus 2, 4, 6, atau 8 digit numerik; diterima: \"8471309\"" }
 *
 * @example
 * makeHsCode("")
 * // => { ok: false, error: "HS code harus 2, 4, 6, atau 8 digit numerik; diterima: \"\"" }
 *
 * @example
 * makeHsCode("8471.30.90")  // ada titik — bukan numerik murni
 * // => { ok: false, error: "HS code harus 2, 4, 6, atau 8 digit numerik; diterima: \"8471.30.90\"" }
 */
function makeHsCode(code: string): Result<HsCode>
```

**Wish List** (tidak perlu helper terpisah — cukup satu regex check):
- `isValidHsCodeString(s)` — cek `/^\d{2}$|^\d{4}$|^\d{6}$|^\d{8}$/`

---

#### `isValidHsCode`

```typescript
/**
 * Memvalidasi apakah string adalah HS code dengan format yang diizinkan (2/4/6/8 digit numerik).
 * Pure function — tidak ada side effects.
 * Dipertahankan untuk kompatibilitas dengan kode yang sudah ada.
 *
 * @param value - string yang akan divalidasi
 * @returns boolean
 *
 * @example
 * isValidHsCode("84713090")  // => true
 * isValidHsCode("8471")      // => true
 * isValidHsCode("847130")    // => true
 * isValidHsCode("84")        // => true
 *
 * @example
 * isValidHsCode("8471309")   // 7 digit
 * // => false
 *
 * @example
 * isValidHsCode("abc12345")  // mengandung huruf
 * // => false
 */
function isValidHsCode(value: string): boolean
```

---

#### `formatHsCode`

```typescript
/**
 * Memformat HS code 8 digit menjadi format tampilan dengan titik: XXXX.XX.XX.
 * Input kurang dari 8 digit dikembalikan apa adanya (tidak diformat).
 * Pure function — tidak ada side effects.
 *
 * @param code - HS code string
 * @returns string
 *
 * @example
 * formatHsCode("84713090")
 * // => "8471.30.90"
 *
 * @example
 * formatHsCode("01019000")
 * // => "0101.90.00"
 *
 * @example
 * formatHsCode("8471")   // bukan 8 digit, dikembalikan apa adanya
 * // => "8471"
 */
function formatHsCode(code: string): string
```

---

#### `hasLartas`

```typescript
/**
 * Memeriksa apakah Lartas memiliki minimal satu regulasi di minimal satu kategori.
 * Diturunkan dari isi Map regulasi — tidak menggunakan boolean flags.
 * Pure function.
 *
 * @param lartas - Lartas yang akan diperiksa
 * @returns boolean — true jika ada minimal satu LartasDetail di minimal satu kategori
 *
 * @example
 * hasLartas({
 *   hsCode: { code: "84713090" },
 *   tarif: { bm: "0%", ppn: "12%", pph: null, pphNonApi: null },
 *   regulasi: new Map([["border", [{ namaIzin: "PI", kodeIzin: null, noSkep: null,
 *                        idDokumen: null, dokumenPabean: null, tanggalMulai: null,
 *                        tanggalAkhir: null, link: null }]]])
 * })
 * // => true
 *
 * @example
 * hasLartas({
 *   hsCode: { code: "84713090" },
 *   tarif: { bm: "0%", ppn: "12%", pph: null, pphNonApi: null },
 *   regulasi: new Map()
 * })
 * // => false
 */
function hasLartas(lartas: Lartas): boolean
```

---

#### `getLartasByKategori`

```typescript
/**
 * Mengembalikan array LartasDetail untuk kategori tertentu dari satu Lartas.
 * Mengembalikan array kosong jika kategori tidak ada di Map regulasi.
 * Pure function.
 *
 * @param lartas - Lartas yang akan di-query
 * @param kategori - KategoriLartas yang dicari
 * @returns LartasDetail[] — kosong jika tidak ada
 *
 * @example
 * const lartas = {
 *   hsCode: { code: "01012100" },
 *   tarif: { bm: "5%", ppn: "12%", pph: null, pphNonApi: null },
 *   regulasi: new Map([
 *     ["border", [{ namaIzin: "Persetujuan Impor", kodeIzin: "PI",
 *                   noSkep: "Permendag 36/2023", idDokumen: "D1",
 *                   dokumenPabean: ["20"], tanggalMulai: "2023-01-01",
 *                   tanggalAkhir: null, link: null }]],
 *     ["post-border", []]
 *   ])
 * }
 * getLartasByKategori(lartas, "border")
 * // => [{ namaIzin: "Persetujuan Impor", kodeIzin: "PI", ... }]
 *
 * @example
 * getLartasByKategori(lartas, "ekspor")
 * // => []  (kategori "ekspor" tidak ada di Map)
 */
function getLartasByKategori(lartas: Lartas, kategori: KategoriLartas): LartasDetail[]
```

---

### File: `core/cek-lartas/boundary.ts`

---

#### `parseInswResponse`

```typescript
/**
 * Mengkonversi data mentah dari gateway INSW ke Lartas yang valid.
 * Satu-satunya titik masuk data INSW ke dalam core — semua validasi dan normalisasi terjadi di sini.
 * Setelah melewati fungsi ini, kode di dalam core dapat mempercayai data tanpa re-checking.
 *
 * Tidak pernah throw — error dikembalikan sebagai { ok: false, error }.
 * Pure function — tidak ada I/O, tidak ada side effects.
 *
 * Normalisasi yang dilakukan:
 * - null / undefined / "" / "N/A" / "tidak ada data" → null untuk semua field Tarif
 * - boolean flags hasLartas* → Map<KategoriLartas, LartasDetail[]>
 * - lartasBorderDetails + lartasPostBorderDetails + lartasExportDetails → Map entries
 *
 * @param raw - data dari gateway (type unknown — tidak dipercaya)
 * @param hsCode - HsCode yang sudah valid (digunakan sebagai identitas di Lartas)
 * @returns Result<Lartas>
 *
 * @example
 * // Input dengan data lengkap, ada LARTAS border
 * parseInswResponse(
 *   {
 *     bm: "0.00%", ppn: "12.00%", pph: "10.00%", pphNonApi: null,
 *     hasLartasBorder: true, hasLartasPostBorder: false, hasLartasExport: false,
 *     lartasBorderDetails: [{ namaIzin: "Persetujuan Impor", kodeIzin: "PI",
 *                              noSkep: "Permendag 36/2023", idDokumen: "D1",
 *                              dokumenPabean: ["20"], tanggalMulai: "2023-01-01",
 *                              tanggalAkhir: null, link: null }],
 *     lartasPostBorderDetails: [],
 *     lartasExportDetails: []
 *   },
 *   { code: "01012100" }
 * )
 * // => {
 * //   ok: true,
 * //   data: {
 * //     hsCode: { code: "01012100" },
 * //     tarif: { bm: "0.00%", ppn: "12.00%", pph: "10.00%", pphNonApi: null },
 * //     regulasi: Map { "border" => [{ namaIzin: "Persetujuan Impor", ... }] }
 * //   }
 * // }
 *
 * @example
 * // Input null
 * parseInswResponse(null, { code: "84713090" })
 * // => { ok: false, error: "Data INSW tidak valid: bukan objek" }
 *
 * @example
 * // "N/A" dinormalisasi ke null
 * parseInswResponse(
 *   { bm: "N/A", ppn: "12%", pph: null, pphNonApi: undefined,
 *     hasLartasBorder: false, hasLartasPostBorder: false, hasLartasExport: false,
 *     lartasBorderDetails: [], lartasPostBorderDetails: [], lartasExportDetails: [] },
 *   { code: "84713090" }
 * )
 * // => {
 * //   ok: true,
 * //   data: {
 * //     hsCode: { code: "84713090" },
 * //     tarif: { bm: null, ppn: "12%", pph: null, pphNonApi: null },
 * //     regulasi: Map {}   ← Map kosong karena tidak ada LARTAS
 * //   }
 * // }
 *
 * @example
 * // Input bukan objek
 * parseInswResponse("string biasa", { code: "84713090" })
 * // => { ok: false, error: "Data INSW tidak valid: bukan objek" }
 */
function parseInswResponse(raw: unknown, hsCode: HsCode): Result<Lartas>
```

**Wish List untuk `parseInswResponse`:**

```typescript
// 1. Normalisasi nilai tarif (null / undefined / "" / "N/A" / "tidak ada data" → null)
function normalizeTarifField(value: unknown): string | null

// 2. Konversi boolean flags + detail arrays → Map entry (atau tidak ditambahkan ke Map)
function buildRegulasiMap(
  borderDetails: unknown[],
  postBorderDetails: unknown[],
  eksporDetails: unknown[]
): Map<KategoriLartas, LartasDetail[]>

// 3. Parse satu entri detail LARTAS dari unknown ke LartasDetail
// Mengembalikan null jika namaIzin tidak ada
function parseLartasDetail(raw: unknown): LartasDetail | null

// 4. Normalisasi array detail (filter null, pastikan array valid)
function parseDetailArray(raw: unknown): LartasDetail[]
```

---

### File: `core/cek-lartas/use-cases/fetch-lartas.ts`

---

#### `fetchSingle`

```typescript
/**
 * Mengambil data LARTAS untuk satu HS code dari gateway, lalu mem-parse hasilnya.
 * Menerima HsCode (sudah valid) — tidak memvalidasi format di dalam use case.
 * Jika gateway mengembalikan null (data tidak ditemukan), mengembalikan Lartas dengan
 * tarif semua null dan regulasi Map kosong.
 *
 * @param hsCode - HsCode yang sudah divalidasi
 * @param gateway - implementasi HsCodeGateway
 * @returns Promise<Lartas>
 *
 * @example
 * // Data ditemukan di gateway
 * await fetchSingle({ code: "84713090" }, inswApiGateway)
 * // => {
 * //   hsCode: { code: "84713090" },
 * //   tarif: { bm: "0.00%", ppn: "12.00%", pph: "10.00%", pphNonApi: null },
 * //   regulasi: Map {}
 * // }
 *
 * @example
 * // Gateway mengembalikan null (HS code tidak ada di INSW)
 * await fetchSingle({ code: "99999999" }, mockGatewayReturnsNull)
 * // => {
 * //   hsCode: { code: "99999999" },
 * //   tarif: { bm: null, ppn: null, pph: null, pphNonApi: null },
 * //   regulasi: Map {}
 * // }
 */
function fetchSingle(hsCode: HsCode, gateway: HsCodeGateway): Promise<Lartas>
```

---

#### `fetchMultiple`

```typescript
/**
 * Mengambil data LARTAS untuk array HsCode, dengan dedup otomatis.
 * Memanggil fetchSingle untuk setiap kode unik, lalu memetakan hasilnya kembali
 * ke urutan input asal.
 * Tidak ada delay, retry, atau concurrency logic — itu tanggung jawab layer di atasnya.
 *
 * @param hsCodes - array HsCode (boleh ada duplikat — akan didedup)
 * @param gateway - implementasi HsCodeGateway
 * @returns Promise<Lartas[]> — urutan sama dengan input, termasuk duplikat
 *
 * @example
 * // Array dengan duplikat — gateway dipanggil sekali per kode unik
 * await fetchMultiple(
 *   [{ code: "84713090" }, { code: "01012100" }, { code: "84713090" }],
 *   inswApiGateway
 * )
 * // => [
 * //   { hsCode: { code: "84713090" }, tarif: {...}, regulasi: Map {...} },
 * //   { hsCode: { code: "01012100" }, tarif: {...}, regulasi: Map {...} },
 * //   { hsCode: { code: "84713090" }, tarif: {...}, regulasi: Map {...} }  ← hasil cache
 * // ]
 *
 * @example
 * // Array kosong
 * await fetchMultiple([], inswApiGateway)
 * // => []
 */
function fetchMultiple(hsCodes: HsCode[], gateway: HsCodeGateway): Promise<Lartas[]>
```

---

### File: `app/cek-lartas/actions.ts`

---

#### `fetchLartas`

```typescript
/**
 * Server Action: mengambil data LARTAS untuk satu HS code.
 * Dipanggil langsung dari useCekLartasSingle hook.
 * Validasi input, panggil use case, kembalikan hasil sebagai plain object (serializable).
 *
 * @param hsCodeStr - string HS code dari input user
 * @returns Promise<Result<LartasViewModel>>
 *
 * @example
 * await fetchLartas("84713090")
 * // => { ok: true, data: { hsCode: "84713090", bm: "0%", ppn: "12%", ... } }
 *
 * @example
 * await fetchLartas("invalid")
 * // => { ok: false, error: "HS code tidak valid: \"invalid\"" }
 */
async function fetchLartas(hsCodeStr: string): Promise<Result<LartasViewModel>>
```

---

#### `fetchLartasBatch`

```typescript
/**
 * Server Action: mengambil data LARTAS untuk array HS code string (dari file Excel).
 * Dipanggil langsung dari useCekLartasFile hook.
 * Filter input invalid, dedup, panggil use case, kembalikan seluruh hasil sekaligus.
 *
 * @param hsCodeStrings - array string HS code
 * @returns Promise<LartasViewModel[]> — satu entry per input yang valid
 *
 * @example
 * await fetchLartasBatch(["84713090", "01012100", "invalid", "84713090"])
 * // => [
 * //   { hsCode: "84713090", bm: "0%", ... },
 * //   { hsCode: "01012100", bm: "5%", ... }
 * // ]  ← "invalid" dibuang, "84713090" duplikat didedup
 *
 * @example
 * await fetchLartasBatch([])
 * // => []
 */
async function fetchLartasBatch(hsCodeStrings: string[]): Promise<LartasViewModel[]>
```

---

### File: `app/adapters/presenters/hs-code.presenter.js`

Presenter dipertahankan dengan fungsi yang sudah ada. Tidak ada perubahan signifikan kecuali
input berubah dari flat object ke `Lartas`.

---

#### `toLartasViewModel` (baru — menggantikan `toResultRow`)

```javascript
/**
 * Mengkonversi Lartas dari core ke LartasViewModel untuk UI / Server Action response.
 * Thin adapter — tidak ada logika bisnis.
 *
 * @param {import('@core/cek-lartas/types').Lartas} lartas
 * @returns {LartasViewModel}
 *
 * @example
 * toLartasViewModel({
 *   hsCode: { code: "84713090" },
 *   tarif: { bm: "0%", ppn: "12%", pph: "10%", pphNonApi: null },
 *   regulasi: new Map([["border", [{ namaIzin: "PI", kodeIzin: null, noSkep: null,
 *                        idDokumen: null, dokumenPabean: ["20"], tanggalMulai: null,
 *                        tanggalAkhir: null, link: null }]]])
 * })
 * // => {
 * //   hsCode: "84713090",
 * //   bm: "0%", ppn: "12%", pph: "10%", pphNonApi: null,
 * //   hasLartasBorder: true, hasLartasPostBorder: false, hasLartasExport: false,
 * //   lartasBorderDetails: [{ namaIzin: "PI", ... }],
 * //   lartasPostBorderDetails: [],
 * //   lartasExportDetails: []
 * // }
 *
 * @example
 * toLartasViewModel({
 *   hsCode: { code: "00000000" },
 *   tarif: { bm: null, ppn: null, pph: null, pphNonApi: null },
 *   regulasi: new Map()
 * })
 * // => {
 * //   hsCode: "00000000",
 * //   bm: null, ppn: null, pph: null, pphNonApi: null,
 * //   hasLartasBorder: false, hasLartasPostBorder: false, hasLartasExport: false,
 * //   lartasBorderDetails: [],
 * //   lartasPostBorderDetails: [],
 * //   lartasExportDetails: []
 * // }
 */
function toLartasViewModel(lartas)
```


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions
of a system — essentially, a formal statement about what the system should do. Properties serve
as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Library yang digunakan: **[fast-check](https://fast-check.dev/)** (sudah ada di `devDependencies`).
Konfigurasi: minimum **100 iterasi** per property test.
Tag format: `Feature: cek-lartas-architecture-refactor, Property N: <teks>`

---

### Property 1: `makeHsCode` menerima tepat format 2/4/6/8 digit

*For any* string, `makeHsCode` mengembalikan `{ ok: true }` jika dan hanya jika string tersebut
terdiri dari tepat 2, 4, 6, atau 8 digit numerik — dan `{ ok: false }` untuk semua input lainnya.

**Validates: Requirements 3.3, 3.4**

---

### Property 2: `parseInswResponse` menerima semua RawInsw yang valid

*For any* object yang memenuhi struktur RawInsw minimal (memiliki field array details dan flag
boolean), `parseInswResponse` mengembalikan `{ ok: true, data: Lartas }`.

**Validates: Requirements 5.3**

---

### Property 3: `parseInswResponse` menolak semua input non-objek

*For any* nilai yang bukan plain object (null, string, number, array, boolean),
`parseInswResponse` mengembalikan `{ ok: false, error: string }`.

**Validates: Requirements 5.4**

---

### Property 4: Normalisasi nilai "kosong" ke null (round-trip safe)

*For any* valid RawInsw di mana field tarif berisi nilai "tidak ada data" (null, undefined, "",
"N/A", "tidak ada data"), `parseInswResponse` menghasilkan Lartas dengan field Tarif berupa `null`
— bukan string tersebut.

**Validates: Requirements 5.5**

---

### Property 5: Round-trip parse (serialisasi-deseralisasi ekivalen)

*For any* valid `Lartas` yang dihasilkan oleh `parseInswResponse`, jika kita serialize ke
format RawInsw flat lalu parse kembali, kita mendapatkan Lartas yang ekivalen
(semua field sama, Map berisi entries yang sama).

Ini adalah property paling penting karena memverifikasi bahwa `parseInswResponse` adalah
fungsi deterministik yang stabil — output-nya tidak "drift" ketika diproses berulang kali.

**Validates: Requirements 5.8, 9.5**

---

### Property 6: `hasLartas` konsisten dengan `regulasi` Map

*For any* `Lartas`, `hasLartas(lartas)` mengembalikan `true` jika dan hanya jika
`lartas.regulasi.size > 0` dan minimal satu entry Map mengandung array non-kosong.
`hasLartas` tidak boleh pernah menghasilkan hasil yang bertentangan dengan isi Map.

**Validates: Requirements 3.5**

---

### Property 7: `getLartasByKategori` tidak pernah throw

*For any* `Lartas` dan *any* `KategoriLartas`, `getLartasByKategori` selalu mengembalikan array
(kosong atau berisi) — tidak pernah throw, tidak pernah mengembalikan undefined.

**Validates: Requirements 3.6**


---

## Error Handling

### Prinsip umum

Semua fungsi di `core/` **tidak throw** — error dikembalikan sebagai `{ ok: false, error: string }`.
Caller memutuskan cara handle: tampilkan ke user, log, atau fallback.

### Per fungsi

| Fungsi | Input tidak valid | Gateway gagal |
|--------|-------------------|---------------|
| `makeHsCode` | `{ ok: false, error }` | — |
| `parseInswResponse` | `{ ok: false, error }` | — |
| `fetchSingle` | — (input sudah HsCode) | return Lartas kosong (tarif null, regulasi Map kosong) |
| `fetchMultiple` | — (input sudah HsCode[]) | per-item fallback ke Lartas kosong |
| `fetchLartas` (Server Action) | `{ ok: false, error }` ke client | `{ ok: false, error }` ke client |
| `fetchLartasBatch` (Server Action) | filter input invalid | item bermasalah di-skip, sisanya tetap dikembalikan |

### Normalisasi nilai "tidak ada data"

`parseInswResponse` menormalisasi semua representasi "tidak ada data" dari INSW ke `null`:

- `null`
- `undefined`
- `""` (string kosong)
- `"N/A"`
- `"tidak ada data"`
- String yang hanya berisi whitespace

Setelah normalisasi, kode di dalam core selalu bekerja dengan `string | null` —
tidak perlu cek `=== "tidak ada data"` atau `=== "N/A"` di mana pun.

---

## Testing Strategy

### Dual Testing Approach

Dua jenis test digunakan secara komplementer:
- **Unit tests**: verifikasi contoh spesifik, edge cases, dan kondisi error
- **Property tests**: verifikasi invariant universal dengan input yang di-generate secara acak

Unit tests cocok untuk mendokumentasikan contoh nyata (misalnya HS code laptop = `84713090`).
Property tests cocok untuk menemukan edge cases yang tidak terpikirkan secara manual.

### Unit Tests (`core/cek-lartas/__tests__/`)

**`hs-code.test.ts`** — `makeHsCode`, `isValidHsCode`, `formatHsCode`, `hasLartas`, `getLartasByKategori`

Kasus yang harus dicakup:
- `makeHsCode` dengan 2, 4, 6, 8 digit: expect `ok: true`
- `makeHsCode` dengan 1, 3, 5, 7, 9 digit: expect `ok: false`
- `makeHsCode` dengan string kosong, huruf, titik: expect `ok: false`
- `formatHsCode("84713090")` → `"8471.30.90"`
- `hasLartas` dengan Map berisi entry: `true`
- `hasLartas` dengan Map kosong: `false`
- `getLartasByKategori` untuk kategori yang ada: array berisi data
- `getLartasByKategori` untuk kategori yang tidak ada: `[]`

**`boundary.test.ts`** — `parseInswResponse`

Kasus yang harus dicakup:
- Input valid lengkap → `{ ok: true, data: Lartas }`
- Input null → `{ ok: false }`
- Input string → `{ ok: false }`
- Input array → `{ ok: false }`
- Field tarif `"N/A"` → `null` di Lartas
- Field tarif `""` → `null` di Lartas
- Field tarif `"tidak ada data"` → `null` di Lartas
- `hasLartasBorder: true` + `lartasBorderDetails: [...]` → Map punya entry `"border"`
- `hasLartasBorder: false` + `lartasBorderDetails: []` → Map tidak punya entry `"border"`

**`fetch-lartas.test.ts`** — `fetchSingle`, `fetchMultiple`

Kasus yang harus dicakup:
- Gateway mengembalikan RawInsw valid → `fetchSingle` return Lartas terisi
- Gateway mengembalikan `null` → `fetchSingle` return Lartas kosong (tarif null, Map kosong)
- `fetchMultiple` dengan duplikat → gateway dipanggil sekali per kode unik (mock spy)
- `fetchMultiple` dengan array kosong → `[]`

### Property Tests (`core/cek-lartas/__tests__/`)

Menggunakan **fast-check** dengan konfigurasi `{ numRuns: 100 }` minimum per property.

**`hs-code.property.test.ts`**

```typescript
// Feature: cek-lartas-architecture-refactor, Property 1:
// makeHsCode menerima tepat format 2/4/6/8 digit
fc.assert(fc.property(
  fc.string(),
  (s) => {
    const result = makeHsCode(s);
    const isValidFormat = /^\d{2}$|^\d{4}$|^\d{6}$|^\d{8}$/.test(s);
    return result.ok === isValidFormat;
  }
));

// Feature: cek-lartas-architecture-refactor, Property 6:
// hasLartas konsisten dengan regulasi Map
fc.assert(fc.property(
  lartasArbitrary,
  (lartas) => {
    const anyNonEmpty = [...lartas.regulasi.values()].some(arr => arr.length > 0);
    return hasLartas(lartas) === anyNonEmpty;
  }
));

// Feature: cek-lartas-architecture-refactor, Property 7:
// getLartasByKategori tidak pernah throw
fc.assert(fc.property(
  lartasArbitrary,
  fc.constantFrom("border", "post-border", "ekspor"),
  (lartas, kategori) => {
    const result = getLartasByKategori(lartas, kategori);
    return Array.isArray(result);
  }
));
```

**`boundary.property.test.ts`**

```typescript
// Feature: cek-lartas-architecture-refactor, Property 2:
// parseInswResponse menerima semua RawInsw yang valid
fc.assert(fc.property(
  rawInswArbitrary,
  (raw) => {
    const result = parseInswResponse(raw, { code: "84713090" });
    return result.ok === true;
  }
));

// Feature: cek-lartas-architecture-refactor, Property 3:
// parseInswResponse menolak semua input non-objek
fc.assert(fc.property(
  fc.oneof(fc.constant(null), fc.string(), fc.integer(), fc.boolean(), fc.array(fc.anything())),
  (nonObject) => {
    const result = parseInswResponse(nonObject, { code: "84713090" });
    return result.ok === false;
  }
));

// Feature: cek-lartas-architecture-refactor, Property 5: Round-trip parse
fc.assert(fc.property(
  rawInswArbitrary,
  (raw) => {
    const first = parseInswResponse(raw, { code: "84713090" });
    if (!first.ok) return true; // skip invalid
    const serialized = lartasToRawInsw(first.data);
    const second = parseInswResponse(serialized, { code: "84713090" });
    return second.ok && lartasEquivalent(first.data, second.data);
  }
));
```

### Menjalankan Tests

```bash
# Semua tests
npx jest

# Hanya core/ (tanpa konfigurasi Next.js)
npx jest core/

# Hanya property tests
npx jest core/ --testPathPattern="property"

# Single run (bukan watch mode)
npx jest --runInBand
```

