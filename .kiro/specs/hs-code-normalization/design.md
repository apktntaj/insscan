# Design Document — HS Code Normalization

## Overview

Fitur ini memperbarui dua area utama di aplikasi INScann:

1. **Perluasan definisi HS code** — `isValidHsCode` diperluas dari hanya 8 digit menjadi 6 atau 8 digit. Perubahan ini berdampak pada entity `hs-code.js`, pesan validasi di mode Single Input, dan logika deteksi di mode File/Multiple.

2. **Preview file + deteksi & normalisasi HS code** — setelah user upload file Excel, sistem menampilkan `FilePreviewTable` (maks 10 baris, highlight sel dirty), mendeteksi `NumericColumn` (threshold >50%), memeriksa validitas kode, dan jika ada kode tidak valid menampilkan `NormalizationDialog` secara otomatis sebelum tombol "Tarik Data" dapat digunakan.

Semua perubahan mengikuti Clean Architecture yang sudah ada: logika domain di `core/entities`, logika deteksi/normalisasi sebagai pure functions di luar komponen React, dan UI di `presentation/components/features`.

---

## Architecture

```
Upload File
    │
    ▼
fileToArrayBuffer + bufferToJson          ← infrastructure/excel
    │
    ▼
parseFileData(rawRows)                    ← boundary parser (pure)
    │  returns ParsedFileData
    ▼
detectNumericColumns(parsedData)          ← pure function
    │  returns ColumnAnalysis[]
    ▼
classifyColumns(columnAnalyses)           ← pure function
    │  returns FileAnalysisResult
    ▼
┌─────────────────────────────────────────┐
│  HsCodeScanner (React state machine)    │
│                                         │
│  fileData ──► FilePreviewTable          │
│  analysisResult                         │
│    ├─ allValid? ──► normalizationReady  │
│    └─ hasInvalid? ──► NormalizationDialog│
│                           │             │
│                    user pilih target    │
│                           │             │
│                    normalizeCode(...)   │
│                           │             │
│                    normalizationReady   │
│                           │             │
│                    "Tarik Data" aktif   │
└─────────────────────────────────────────┘
    │
    ▼
proceedWithFetch(hsCodes)                 ← existing fetch logic
```

Perubahan tidak menyentuh layer `core/use-cases`, `adapters`, atau `api`. Semua logika baru berada di:
- `app/core/entities/hs-code.js` — update `isValidHsCode`
- `app/presentation/components/features/HsCodeScanner.jsx` — pure functions + React state

---

## Components and Interfaces

### Komponen yang Dimodifikasi

**`HsCodeScanner`** (existing, dimodifikasi)
- Tambah state: `normalizationReady`, `fileAnalysis`
- Ubah `handleFileChange`: setelah set `fileData`, langsung jalankan analisis kolom
- Ubah `handleFetchData`: gunakan `normalizationReady` sebagai guard, bukan jalankan analisis saat tombol ditekan
- Ubah disabled condition tombol "Tarik Data": `isLoading || !fileData || !normalizationReady`
- Pindahkan `NormalizationDialog` dari dalam `ProgressPanel` ke level root komponen

**`NormalizationDialog`** (existing, dimodifikasi)
- Update pesan: dari "lebih dari 8 digit" menjadi "panjang digitnya bukan 6 dan bukan 8"
- Tambah keyboard handler: `Escape` → `onCancel`, `Enter` → konfirmasi pilihan yang difokus
- Tambah `autoFocus` pada tombol pertama saat dialog muncul

### Komponen Baru

**`FilePreviewTable`** (baru, di dalam `HsCodeScanner.jsx`)
- Menerima `rows` (maks 10 baris), `headers`, `dirtyColumns` (set index kolom yang dirty)
- Render tabel dengan header dari baris pertama
- Highlight sel di `dirtyColumns` dengan class visual berbeda
- Tampilkan keterangan "karakter non-numerik akan dihapus otomatis"

### Pure Functions Baru (di luar komponen)

Semua fungsi ini adalah pure functions tanpa side effects, mudah ditest secara terisolasi.

- `isNumericColumn(cells)` — cek apakah kolom memenuhi threshold >50%
- `stripNonDigits(value)` — hapus semua karakter non-digit dari string
- `normalizeCode(digits, targetLength)` — potong atau pad kode ke panjang target
- `analyzeFileColumns(rows)` — analisis semua kolom, kembalikan `FileAnalysisResult`
- `parseFileData(rawRows)` — boundary parser, kembalikan `ParsedFileData`

---

## Data Models

### `CellValue`

```js
/**
 * @typedef {string | number | null | undefined} RawCellValue
 * Nilai mentah dari satu sel Excel sebelum diparse.
 */
```

### `ParsedCell`

```js
/**
 * @typedef {Object} ParsedCell
 * @property {string} raw        — nilai asli setelah dikonversi ke string (trim)
 * @property {string} digits     — hanya karakter digit dari raw (hasil stripNonDigits)
 * @property {boolean} isEmpty   — true jika raw === "" setelah trim
 * @property {boolean} isDirty   — true jika raw !== digits && !isEmpty
 *                                 (mengandung karakter non-digit selain whitespace)
 */
```

### `ParsedRow`

```js
/**
 * @typedef {ParsedCell[]} ParsedRow
 */
```

### `ParsedFileData`

```js
/**
 * @typedef {Object} ParsedFileData
 * @property {ParsedRow[]} rows     — semua baris yang sudah diparse
 * @property {string[]} headers     — baris pertama sebagai header (raw value)
 * @property {number} columnCount   — jumlah kolom (lebar baris terpanjang)
 */
```

### `ColumnAnalysis`

```js
/**
 * @typedef {Object} ColumnAnalysis
 * @property {number} columnIndex         — index kolom (0-based)
 * @property {boolean} isNumeric          — true jika >50% sel non-kosong mengandung digit
 * @property {boolean} hasDirtyCells      — true jika ada sel isDirty di kolom ini
 * @property {string[]} validCodes        — kode yang sudah valid (6 atau 8 digit)
 * @property {string[]} invalidCodes      — kode yang perlu normalisasi (digit count bukan 6/8)
 *                                          (hanya diisi jika isNumeric === true)
 */
```

### `FileAnalysisResult`

```js
/**
 * @typedef {Object} FileAnalysisResult
 * @property {ColumnAnalysis[]} columns   — analisis per kolom
 * @property {boolean} hasNumericColumns  — true jika ada minimal 1 NumericColumn
 * @property {string[]} allValidCodes     — gabungan semua validCodes dari semua NumericColumn
 * @property {string[]} allInvalidCodes   — gabungan semua invalidCodes dari semua NumericColumn
 * @property {boolean} needsNormalization — true jika allInvalidCodes.length > 0
 */
```

### `NormalizationState`

```js
/**
 * @typedef {"idle" | "needed" | "done" | "skipped"} NormalizationStatus
 *
 * - "idle"    : belum ada file yang diupload
 * - "needed"  : ada kode invalid, dialog harus ditampilkan
 * - "done"    : user sudah memilih target dan normalisasi selesai
 * - "skipped" : semua kode sudah valid, tidak perlu normalisasi
 *
 * Tombol "Tarik Data" aktif hanya jika status === "done" || status === "skipped"
 */
```

---

## Function Contracts

### `isValidHsCode(value)` — dimodifikasi

**Purpose:** Validasi apakah value adalah HS code yang valid (6 atau 8 digit angka).

**Input:** `string | number` — nilai yang akan divalidasi

**Output:** `boolean`

**Invariant:** Hanya menerima string yang terdiri dari tepat 6 atau tepat 8 karakter digit (0-9). Tidak ada karakter lain, tidak ada spasi.

```js
// @example
isValidHsCode("123456")    // => true   (6 digit)
isValidHsCode("12345678")  // => true   (8 digit)
isValidHsCode("1234567")   // => false  (7 digit)
isValidHsCode("1234567890")// => false  (10 digit)
isValidHsCode("1234.56")   // => false  (ada titik)
isValidHsCode(12345678)    // => true   (number, dikonversi ke string)
isValidHsCode("")           // => false
isValidHsCode(null)         // => false
```

---

### `stripNonDigits(value)` — baru

**Purpose:** Hapus semua karakter non-digit dari string, kembalikan hanya digit.

**Input:** `string | number | null | undefined`

**Output:** `string` — hanya karakter digit, bisa string kosong

```js
// @example
stripNonDigits("1234.56.78")  // => "12345678"
stripNonDigits("HS-123456")   // => "123456"
stripNonDigits("84713090")    // => "84713090"
stripNonDigits("")             // => ""
stripNonDigits(null)           // => ""
stripNonDigits(12345678)       // => "12345678"
```

---

### `normalizeCode(digits, targetLength)` — baru

**Purpose:** Sesuaikan panjang string digit ke `targetLength` — potong dari kanan jika lebih panjang, pad "0" di kanan jika lebih pendek.

**Input:**
- `digits: string` — string yang hanya berisi digit (hasil `stripNonDigits`)
- `targetLength: 6 | 8` — panjang target

**Output:** `string` — string digit dengan panjang tepat `targetLength`

**Precondition:** `digits` hanya berisi karakter digit (0-9). Caller bertanggung jawab memanggil `stripNonDigits` terlebih dahulu.

```js
// @example — potong dari kanan
normalizeCode("1234567890", 8)  // => "12345678"
normalizeCode("12345678", 6)    // => "123456"

// @example — pad "0" di kanan
normalizeCode("1234", 6)        // => "123400"
normalizeCode("12345", 8)       // => "12345000"

// @example — sudah sesuai, tidak berubah
normalizeCode("123456", 6)      // => "123456"
normalizeCode("12345678", 8)    // => "12345678"
```

---

### `isNumericColumn(cells)` — baru

**Purpose:** Tentukan apakah kolom memenuhi threshold NumericColumn (>50% sel non-kosong mengandung digit).

**Input:** `string[]` — array nilai sel dalam satu kolom (sudah di-trim, sudah dikonversi ke string)

**Output:** `boolean`

**Aturan:**
- Sel kosong (string kosong setelah trim) tidak dihitung dalam threshold
- Sel yang mengandung setidaknya satu digit dihitung sebagai "numerik"
- Sel yang tidak mengandung digit sama sekali dihitung sebagai "non-numerik" (tetap masuk denominator)
- Jika tidak ada sel non-kosong, kembalikan `false`

```js
// @example — >50% numerik
isNumericColumn(["84713090", "12345678", "hello"])  // => true  (2/3 = 67%)
isNumericColumn(["84713090", "12345678", "", ""])   // => true  (2/2 = 100%, kosong diabaikan)

// @example — ≤50% numerik
isNumericColumn(["hello", "world", "12345678"])     // => false (1/3 = 33%)
isNumericColumn(["", "", ""])                        // => false (tidak ada sel non-kosong)

// @example — sel dirty tetap dihitung sebagai numerik
isNumericColumn(["HS-123456", "84713090", "text"])  // => true  (2/3 = 67%, "HS-123456" mengandung digit)
```

---

### `parseFileData(rawRows)` — baru

**Purpose:** Parse array 2D mentah dari Excel menjadi `ParsedFileData` yang siap digunakan. Ini adalah boundary parser — satu-satunya tempat di mana raw Excel data dikonversi ke bentuk yang diketahui valid.

**Input:** `Array<Array<RawCellValue>>` — output dari `bufferToJson`

**Output:** `ParsedFileData`

**Aturan:**
- Baris kosong (semua sel kosong) tetap dipertahankan di `rows` untuk menjaga index
- `headers` diambil dari baris pertama (index 0), raw value
- `columnCount` adalah lebar baris terpanjang

```js
// @example
parseFileData([
  ["HS Code", "Deskripsi"],
  ["84713090", "Laptop"],
  ["HS-123456", "Monitor"],
])
// => {
//   rows: [
//     [{ raw: "HS Code", digits: "", isEmpty: false, isDirty: false }, ...],
//     [{ raw: "84713090", digits: "84713090", isEmpty: false, isDirty: false }, ...],
//     [{ raw: "HS-123456", digits: "123456", isEmpty: false, isDirty: true }, ...],
//   ],
//   headers: ["HS Code", "Deskripsi"],
//   columnCount: 2
// }

// @example — sel kosong
parseFileData([["", null, undefined]])
// => {
//   rows: [[
//     { raw: "", digits: "", isEmpty: true, isDirty: false },
//     { raw: "", digits: "", isEmpty: true, isDirty: false },
//     { raw: "", digits: "", isEmpty: true, isDirty: false },
//   ]],
//   headers: ["", "", ""],
//   columnCount: 3
// }
```

---

### `analyzeFileColumns(parsedData)` — baru

**Purpose:** Analisis semua kolom dalam `ParsedFileData`, identifikasi NumericColumn, dan klasifikasikan kode sebagai valid atau invalid.

**Input:** `ParsedFileData`

**Output:** `FileAnalysisResult`

**Wish list (helper yang dibutuhkan):**
- `getColumnCells(rows, colIndex)` — ekstrak semua sel dari kolom tertentu
- `isNumericColumn(cells)` — sudah didefinisikan di atas
- `classifyColumnCodes(cells)` — pisahkan valid codes dari invalid codes

```js
// @example — file dengan satu NumericColumn, semua valid
analyzeFileColumns({
  rows: [
    [{ raw: "HS Code", digits: "", isEmpty: false, isDirty: false }],
    [{ raw: "84713090", digits: "84713090", isEmpty: false, isDirty: false }],
    [{ raw: "123456", digits: "123456", isEmpty: false, isDirty: false }],
  ],
  headers: ["HS Code"],
  columnCount: 1
})
// => {
//   columns: [{ columnIndex: 0, isNumeric: true, hasDirtyCells: false,
//               validCodes: ["84713090", "123456"], invalidCodes: [] }],
//   hasNumericColumns: true,
//   allValidCodes: ["84713090", "123456"],
//   allInvalidCodes: [],
//   needsNormalization: false
// }

// @example — file dengan kode invalid
analyzeFileColumns({
  rows: [
    [{ raw: "1234567890", digits: "1234567890", isEmpty: false, isDirty: false }],
    [{ raw: "1234", digits: "1234", isEmpty: false, isDirty: false }],
  ],
  headers: ["HS Code"],
  columnCount: 1
})
// => {
//   columns: [{ columnIndex: 0, isNumeric: true, hasDirtyCells: false,
//               validCodes: [], invalidCodes: ["1234567890", "1234"] }],
//   hasNumericColumns: true,
//   allValidCodes: [],
//   allInvalidCodes: ["1234567890", "1234"],
//   needsNormalization: true
// }
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: isValidHsCode hanya menerima 6 atau 8 digit

*For any* string numerik, `isValidHsCode` mengembalikan `true` jika dan hanya jika panjang string tersebut adalah tepat 6 atau tepat 8 karakter, dan semua karakter adalah digit (0-9).

**Validates: Requirements 1.1, 1.2, 1.3**

---

### Property 2: normalizeCode menghasilkan panjang yang tepat

*For any* string digit dan target length (6 atau 8), `normalizeCode` selalu menghasilkan string dengan panjang tepat sama dengan target length.

**Validates: Requirements 4.3, 4.4, 5.1, 5.2, 5.4**

---

### Property 3: normalizeCode mempertahankan prefix untuk kode yang dipotong

*For any* string digit dengan panjang lebih besar dari target, hasil `normalizeCode` adalah prefix dari input (karakter dari index 0 hingga targetLength - 1).

**Validates: Requirements 5.1**

---

### Property 4: normalizeCode menggunakan "0" padding untuk kode yang diperpanjang

*For any* string digit dengan panjang lebih kecil dari target, hasil `normalizeCode` dimulai dengan input asli dan diikuti oleh karakter "0" sebanyak yang diperlukan.

**Validates: Requirements 5.2**

---

### Property 5: stripNonDigits hanya menghasilkan digit

*For any* string input, hasil `stripNonDigits` hanya mengandung karakter digit (0-9), dan semua digit yang ada di input dipertahankan dalam urutan yang sama.

**Validates: Requirements 5.3**

---

### Property 6: isNumericColumn konsisten dengan threshold 50%

*For any* array sel, `isNumericColumn` mengembalikan `true` jika dan hanya jika jumlah sel non-kosong yang mengandung digit dibagi total sel non-kosong lebih dari 0.5.

**Validates: Requirements 3.1**

---

### Property 7: analyzeFileColumns memeriksa semua kolom

*For any* `ParsedFileData` dengan NumericColumn di posisi kolom ke-N (N bisa berapa saja), `analyzeFileColumns` mengidentifikasi kolom tersebut sebagai NumericColumn terlepas dari posisinya.

**Validates: Requirements 3.4**

---

### Property 8: Preview menampilkan maksimal 10 baris

*For any* `ParsedFileData` dengan N baris (N ≥ 0), `FilePreviewTable` merender tepat `min(N, 10)` baris data (tidak termasuk header).

**Validates: Requirements 2.2**

---

### Property 9: Jumlah kode invalid yang dilaporkan akurat

*For any* `FileAnalysisResult`, jumlah kode yang ditampilkan di `NormalizationDialog` sama persis dengan `allInvalidCodes.length` dari hasil analisis.

**Validates: Requirements 4.2**

---

### Property 10: Normalisasi tidak mengubah kode yang sudah valid

*For any* string digit dengan panjang tepat sama dengan target (6 atau 8), `normalizeCode` mengembalikan string yang identik dengan input.

**Validates: Requirements 5.4**

> **Property Reflection:** Properties 2 dan 10 saling melengkapi — Property 2 menjamin panjang output selalu tepat, Property 10 menjamin idempotence untuk input yang sudah sesuai. Properties 3 dan 4 adalah spesialisasi dari Property 2 yang menjelaskan mekanisme (prefix vs padding). Tidak ada redundansi yang perlu dieliminasi karena masing-masing memvalidasi aspek berbeda dari fungsi normalisasi.

---

## Error Handling

### File Upload Errors

| Kondisi | Penanganan |
|---|---|
| File bukan `.xls`/`.xlsx` | Alert "File yang kamu masukkan bukan file excel", input di-reset (existing behavior) |
| `bufferToJson` melempar error | Alert "Gagal membaca file", `fileData` tidak di-set |
| File kosong (0 baris) | `fileAnalysis.hasNumericColumns = false`, tampilkan pesan "tidak ada kolom HS code terdeteksi" |

### Analisis Kolom

| Kondisi | Penanganan |
|---|---|
| Tidak ada NumericColumn | Tampilkan pesan informatif, `normalizationReady = true` (izinkan fetch, biarkan API yang handle) |
| Semua kode valid | `normalizationReady = true` langsung, tidak tampilkan dialog |
| Ada kode invalid | `normalizationReady = false`, tampilkan `NormalizationDialog` otomatis |

### Normalisasi

| Kondisi | Penanganan |
|---|---|
| User batal dialog | Dialog tutup, `normalizationReady` tetap `false`, tombol tetap disabled |
| `normalizeCode` menerima string kosong | Kembalikan string "0" sebanyak `targetLength` (pad dari kosong) |
| `normalizeCode` menerima input yang sudah sesuai target | Kembalikan input tanpa perubahan |

### State Consistency

Tombol "Tarik Data" disabled jika salah satu kondisi berikut terpenuhi:
- `isLoading === true`
- `fileData === null`
- `normalizationReady === false`

`normalizationReady` di-reset ke `false` setiap kali file baru diupload.

---

## Testing Strategy

### Unit Tests (example-based)

Fokus pada behavior spesifik dan edge cases:

- `isValidHsCode`: test dengan 6 digit, 8 digit, 7 digit, 10 digit, string dengan titik, null, undefined
- `stripNonDigits`: test dengan string campuran, string kosong, null, number
- `normalizeCode`: test potong dari kanan, pad dari kanan, input sudah sesuai target
- `isNumericColumn`: test threshold tepat 50% (harus false), >50% (harus true), semua kosong
- `parseFileData`: test dengan baris header, sel dirty, sel kosong, array kosong
- `analyzeFileColumns`: test file tanpa NumericColumn, file dengan NumericColumn di kolom non-pertama
- `NormalizationDialog`: test keyboard Escape → onCancel, Enter → onConfirm
- `FilePreviewTable`: test render header, render maks 10 baris, highlight sel dirty

### Property-Based Tests

Library: **fast-check** (sudah tersedia di ekosistem JS/Node, cocok dengan Jest yang sudah dipakai proyek)

Konfigurasi: minimum **100 iterasi** per property test.

Setiap property test diberi tag komentar:
`// Feature: hs-code-normalization, Property N: <property_text>`

| Property | Fungsi yang ditest | Generator |
|---|---|---|
| Property 1 | `isValidHsCode` | `fc.string()`, `fc.stringOf(fc.digit(), {minLength: 6, maxLength: 6})`, dll |
| Property 2 | `normalizeCode` | `fc.string({minLength: 0}).filter(s => /^\d*$/.test(s))`, target `fc.constantFrom(6, 8)` |
| Property 3 | `normalizeCode` | digit string dengan panjang > target |
| Property 4 | `normalizeCode` | digit string dengan panjang < target |
| Property 5 | `stripNonDigits` | `fc.string()` (arbitrary string) |
| Property 6 | `isNumericColumn` | `fc.array(fc.string())` dengan kontrol komposisi numerik/non-numerik |
| Property 7 | `analyzeFileColumns` | `ParsedFileData` dengan NumericColumn di posisi acak |
| Property 8 | `FilePreviewTable` | `ParsedFileData` dengan N baris acak (N ≥ 0) |
| Property 9 | `NormalizationDialog` + `analyzeFileColumns` | `FileAnalysisResult` dengan N invalid codes |
| Property 10 | `normalizeCode` | digit string dengan panjang tepat = target |

### Integration Tests

Tidak diperlukan untuk fitur ini — semua logika adalah pure functions atau React state management yang dapat ditest secara terisolasi. Fetch ke API INSW sudah dicover oleh test yang ada.
