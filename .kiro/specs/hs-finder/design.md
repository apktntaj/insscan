# Design Document: HS Finder

## Overview

HS Finder adalah alat klasifikasi HS code berbasis LLM dengan knowledge base KUM HS yang tersimpan sebagai file `.md` per bab. LLM berperan sebagai reasoning engine — setiap kesimpulan harus mengutip teks spesifik dari catatan bab yang dimuat, bukan mengandalkan pengetahuan statistik semata.

### Prinsip Arsitektur Kunci

1. **Knowledge base sebagai sumber kebenaran**: File `.md` catatan bab adalah dasar yang bisa diaudit. Kalau LLM salah, kita bisa tunjuk ke file-nya dan perbaiki.
2. **Single LLM call**: Semua catatan bab kandidat di-feed sekaligus dalam satu prompt, LLM menghasilkan reasoning lengkap dalam satu respons.
3. **Coverage transparency**: Sistem selalu memberitahu user bab mana yang sudah ada catatan tervalidasinya dan mana yang belum — tidak ada penyembunyian ketidakpastian.
4. **Graceful degradation**: Kalau file `.md` tidak ada untuk suatu bab, sistem tetap berjalan dengan disclaimer, bukan error.

### Alur Data

```
[Input: teks atau foto]
        │
        ├─── Teks ──────────────────────────────────────────────────┐
        │                                                            │
        └─── Foto ──► [Gemini Vision] ──► ItemDescription ──► edit ─┘
                                                                     │
                                                                     ▼
                                                [identify-chapters] ← LLM call #1
                                                        │
                                                        ▼
                                               CandidateChapters (max 5)
                                                        │
                                                        ▼
                                              [chapter-note-loader] ← baca filesystem
                                                        │
                                                        ▼
                                         { chapterNotes, coverageStatus }
                                                        │
                                                        ▼
                                    [classify-with-notes] ← LLM call #2 (single call)
                                    prompt: ItemDescription + semua ChapterNote
                                                        │
                                                        ▼
                                               ClassificationResult
                                               { hsCode, description,
                                                 reasoningPath, coverageMap }
                                                        │
                                                        ▼
                                              [hs-finder.presenter]
                                                        │
                                                        ▼
                                              [React UI / HsFinderPage]
```

---

## Architecture

### Direktori dan File Baru

```
harmonized-system/
└── chapters/
    ├── chapter-01.md     # (akan diisi bertahap — boleh kosong saat launch)
    ├── chapter-84.md
    └── ...

app/
├── core/
│   ├── entities/
│   │   └── hs-finder.js               # Semua @typedef dan factory functions
│   ├── ports/
│   │   └── chapter-note-loader.port.js  # Interface untuk load .md files
│   └── use-cases/
│       └── find-hs-code.js            # Orkestrasi end-to-end
├── infrastructure/
│   └── services/
│       ├── chapter-note-loader.service.js  # Baca filesystem, cache, coverage check
│       └── hs-finder-gemini.service.js     # Prompt builder + Gemini calls khusus HS Finder
├── adapters/
│   ├── controllers/
│   │   └── hs-finder.controller.js
│   └── presenters/
│       └── hs-finder.presenter.js
├── api/
│   └── hs-finder/
│       └── route.js                   # POST /api/hs-finder
└── presentation/
    └── components/features/
        ├── HsFinderPage.jsx           # Root: input form + state management
        ├── hs-finder/
        │   ├── TextInputPanel.jsx     # Textarea untuk input teks
        │   ├── PhotoInputPanel.jsx    # Upload foto + preview + edit deskripsi
        │   ├── LoadingPanel.jsx       # Loading state dengan label per tahap
        │   └── ResultPanel.jsx        # Tampilan ClassificationResult + ReasoningPath

app/hs-finder/
└── page.jsx                           # Next.js route
```

---

## Data Models

### 1. Data Shapes (`app/core/entities/hs-finder.js`)

```js
/**
 * Status ketersediaan ChapterNote untuk suatu bab.
 * @typedef {"validated" | "unvalidated"} CoverageStatus
 */

/**
 * Satu file catatan bab yang berhasil dimuat dari knowledge base.
 * @typedef {Object} ChapterNote
 * @property {string} chapterNumber  - Nomor bab dua digit, e.g. "84"
 * @property {string} title          - Judul bab, e.g. "Mesin dan Peralatan Mekanik"
 * @property {string} content        - Isi lengkap file .md
 * @property {CoverageStatus} status - "validated" karena file ini ada
 */

/**
 * Deskripsi barang yang sudah dinormalisasi, siap digunakan untuk klasifikasi.
 * @typedef {Object} ItemDescription
 * @property {string} text           - Teks deskripsi (sudah di-trim dan normalized)
 * @property {"text" | "photo"} source - Asal input
 */

/**
 * Satu langkah dalam reasoning path.
 * @typedef {Object} ReasoningStep
 * @property {number} stepNumber     - Urutan langkah (1–5)
 * @property {string} title          - Label langkah, e.g. "Identifikasi Barang"
 * @property {string} content        - Penjelasan langkah
 * @property {string|null} quotedRule  - Teks aturan yang dikutip dari ChapterNote (null jika langkah ini tidak mengutip aturan)
 * @property {string|null} chapterRef  - Nomor bab yang dikutip, e.g. "84" (null jika tidak ada)
 * @property {CoverageStatus|null} coverage - Status coverage bab yang dikutip (null jika tidak ada kutipan)
 */

/**
 * Peta coverage per bab kandidat.
 * @typedef {Object} CoverageMap
 * @property {Record<string, CoverageStatus>} chapters - Map dari nomor bab ke CoverageStatus
 * @property {boolean} hasUnvalidated - true jika ada setidaknya satu bab "unvalidated"
 */

/**
 * Hasil klasifikasi final.
 * @typedef {Object} ClassificationResult
 * @property {string} hsCode          - HS code 6-digit, e.g. "847130"
 * @property {string} description     - Deskripsi resmi subheading dalam Bahasa Indonesia/Inggris
 * @property {ReasoningStep[]} reasoningPath - Array 5 langkah reasoning
 * @property {CoverageMap} coverageMap - Status coverage semua bab kandidat
 */

/**
 * Status session finder.
 * @typedef {"idle" | "identifying_photo" | "identifying_chapters" | "loading_notes" | "classifying" | "done" | "error"} FinderStatus
 */

/**
 * State lengkap satu sesi pencarian HS code.
 * @typedef {Object} FinderSession
 * @property {FinderStatus} status
 * @property {string} rawInput                    - Input mentah dari user
 * @property {ItemDescription|null} itemDescription - Deskripsi yang sudah dinormalisasi
 * @property {string[]|null} candidateChapters    - Array nomor bab kandidat, e.g. ["84", "85"]
 * @property {ClassificationResult|null} result   - Null sampai klasifikasi selesai
 * @property {string|null} errorMessage           - Pesan error user-facing
 */
```

---

### 2. Format ChapterNote (`.md`)

Setiap file di `harmonized-system/chapters/` mengikuti struktur ini:

```markdown
# Bab {nn} — {Judul Bab}

## Lingkup Umum
{Deskripsi singkat apa yang dicakup bab ini}

## Catatan Bab
1. {Catatan bab pertama}
2. {Catatan bab kedua}
   - (a) ...
   - (b) ...

## Catatan Subpos
1. {Catatan subpos jika ada}

## Pengecualian Penting
| Barang | Bab yang Benar |
|--------|----------------|
| {contoh barang yang sering salah diklasifikasikan} | Bab {nn} |

## Contoh Klasifikasi
- **{nama barang}** → {kode HS 6-digit}
- **{nama barang}** → {kode HS 6-digit}
```

---

### 3. Function Contracts

#### `app/core/entities/hs-finder.js`

**`makeItemDescription(text, source)`**
- Input: `string`, `"text" | "photo"`
- Output: `{ ok: true, data: ItemDescription } | { ok: false, error: string }`
- Tujuan: Validasi dan normalisasi input — trim whitespace, cek panjang min 3 / maks 2000 karakter.

**`makeClassificationResult(raw)`**
- Input: `Object` — parsed JSON dari respons Gemini
- Output: `{ ok: true, data: ClassificationResult } | { ok: false, error: string }`
- Tujuan: Parse dan validasi respons LLM menjadi `ClassificationResult` yang terpercaya; validasi hsCode harus 6 digit angka.

**`makeCoverageMap(candidateChapters, loadedChapterNumbers)`**
- Input: `string[]` (semua kandidat), `string[]` (yang berhasil dimuat)
- Output: `CoverageMap`
- Tujuan: Bangun peta coverage dari daftar kandidat vs yang berhasil di-load.

---

#### `app/infrastructure/services/chapter-note-loader.service.js`

**`createChapterNoteLoaderService()`**
- Input: tidak ada (path direktori dari konstanta internal)
- Output: `ChapterNoteLoaderPort` — object dengan method `loadChapters()` dan `listAvailableChapters()`
- Tujuan: Buat service untuk baca, cache, dan list file `.md` dari knowledge base.

**`loadChapters(chapterNumbers)` (method)**
- Input: `string[]` — array nomor bab, e.g. `["84", "85", "90"]`
- Output: `Promise<{ notes: ChapterNote[], coverageMap: CoverageMap }>`
- Tujuan: Load file `.md` untuk setiap nomor bab yang diminta; bab yang tidak ada file-nya masuk `coverageMap` sebagai `"unvalidated"`.

**`listAvailableChapters()` (method)**
- Input: tidak ada
- Output: `Promise<string[]>` — array nomor bab yang ada file-nya, e.g. `["01", "84", "85"]`
- Tujuan: Scan direktori chapters dan kembalikan daftar bab yang tersedia.

**`readChapterFile(chapterNumber)`** *(helper)*
- Input: `string` — nomor bab
- Output: `Promise<{ ok: true, data: ChapterNote } | { ok: false, error: string }>`
- Tujuan: Baca satu file `.md`, parse judul dari heading pertama, return `ChapterNote`.

---

#### `app/infrastructure/services/hs-finder-gemini.service.js`

**`createHsFinderGeminiService(geminiApiKey)`**
- Input: `string` — API key
- Output: object dengan method `identifyFromPhoto()`, `identifyCandidateChapters()`, `classifyWithNotes()`
- Tujuan: Buat service Gemini khusus untuk HS Finder dengan prompt-prompt yang berbeda dari BL extractor.

**`identifyFromPhoto(imageBase64, mimeType)` (method)**
- Input: `string` (base64), `string` (MIME type)
- Output: `Promise<{ ok: true, data: string } | { ok: false, error: string }>`
- Tujuan: Kirim gambar ke Gemini Vision, minta identifikasi nama dan deskripsi barang dalam Bahasa Indonesia.

**`identifyCandidateChapters(itemDescription)` (method)**
- Input: `string`
- Output: `Promise<{ ok: true, data: string[] } | { ok: false, error: string }>`
- Tujuan: Kirim deskripsi barang ke Gemini, minta identifikasi maksimum 5 nomor bab HS yang paling mungkin relevan. Respons harus berupa JSON array nomor bab.

**`classifyWithNotes(itemDescription, chapterNotes, coverageMap)` (method)**
- Input: `string`, `ChapterNote[]`, `CoverageMap`
- Output: `Promise<{ ok: true, data: ClassificationResult } | { ok: false, error: string }>`
- Tujuan: Kirim deskripsi + semua catatan bab dalam satu prompt, minta reasoning step-by-step dan HS code final. Parse respons JSON menjadi `ClassificationResult`.

**`buildClassificationPrompt(itemDescription, chapterNotes, coverageMap)`** *(helper)*
- Input: `string`, `ChapterNote[]`, `CoverageMap`
- Output: `string`
- Tujuan: Bangun prompt lengkap yang menyertakan: instruksi format output JSON, deskripsi barang, semua isi catatan bab, dan instruksi eksplisit untuk mengutip aturan per langkah reasoning.

**`buildPhotoIdentificationPrompt()`** *(helper)*
- Input: tidak ada
- Output: `string`
- Tujuan: Bangun prompt identifikasi foto yang meminta nama barang, material, fungsi, dan bentuk dalam Bahasa Indonesia.

**`parseClassificationResponse(responseText)`** *(helper)*
- Input: `string`
- Output: `{ ok: true, data: ClassificationResult } | { ok: false, error: string }`
- Tujuan: Strip markdown code fences, parse JSON, jalankan `makeClassificationResult()`.

**`parseChapterListResponse(responseText)`** *(helper)*
- Input: `string`
- Output: `{ ok: true, data: string[] } | { ok: false, error: string }>`
- Tujuan: Parse respons JSON array nomor bab, validasi setiap item adalah string numerik 2 digit, potong ke maksimum 5.

---

#### `app/core/use-cases/find-hs-code.js`

**`createFindHsCodeUseCase(deps)`**
- Input: `{ hsFinderGeminiService, chapterNoteLoader }`
- Output: object dengan method `execute()`
- Tujuan: Buat use case dengan dependencies diinjeksi.

**`execute(input)` (method)**
- Input: `{ itemDescription: ItemDescription }`
- Output: `Promise<FindHsCodeResult>`
- Tujuan: Orkestrasi end-to-end — identifikasi kandidat bab → load catatan bab → klasifikasi dengan reasoning.

```js
/**
 * @typedef {Object} FindHsCodeResult
 * @property {boolean} ok
 * @property {ClassificationResult} [data]    - Ada jika ok = true
 * @property {string} [errorCode]             - Ada jika ok = false
 * @property {string} [errorMessage]          - Pesan error user-facing
 */
```

---

#### `app/adapters/controllers/hs-finder.controller.js`

**`createHsFinderController(deps)`**
- Input: `{ findHsCodeUseCase }`
- Output: object dengan method `handleFindHsCode()` dan `handleIdentifyPhoto()`
- Tujuan: Buat controller yang mengekspos dua endpoint API.

**`handleFindHsCode(requestBody)` (method)**
- Input: `{ text: string, source: "text" | "photo" }`
- Output: `Promise<ApiResponse>`
- Tujuan: Validasi body, bangun `ItemDescription`, jalankan use case, kembalikan respons.

**`handleIdentifyPhoto(requestBody)` (method)**
- Input: `{ imageBase64: string, mimeType: string }`
- Output: `Promise<ApiResponse>`
- Tujuan: Kirim gambar ke Gemini Vision, kembalikan deskripsi teks untuk ditampilkan ke user sebelum klasifikasi.

---

#### `app/adapters/presenters/hs-finder.presenter.js`

**`presentClassificationResult(result)`**
- Input: `ClassificationResult`
- Output: `ClassificationResultViewModel`
- Tujuan: Transform result menjadi view model siap render — format hsCode dengan titik (e.g., `84.71.30`), tambahkan label human-readable untuk coverage status.

---

### 4. Prompt Desain — Klasifikasi

Ini adalah inti dari sistem. Struktur prompt `buildClassificationPrompt`:

```
Kamu adalah ahli klasifikasi HS code. Tugasmu mengklasifikasikan barang berikut
berdasarkan HANYA catatan bab yang disediakan di bawah ini.

PENTING:
- Setiap kesimpulan HARUS mengutip teks spesifik dari catatan bab yang disediakan.
- Jangan membuat klaim berdasarkan pengetahuan umum jika tidak ada kutipan yang mendukung.
- Untuk bab yang ditandai [BELUM TERVALIDASI], gunakan pengetahuan umummu tapi tandai
  setiap langkah dengan "⚠️ tidak ada catatan tervalidasi untuk bab ini".

BARANG YANG DIKLASIFIKASIKAN:
{itemDescription}

CATATAN BAB YANG TERSEDIA:
{untuk setiap ChapterNote: --- BAB {nn} [{status}] ---\n{content}\n}

FORMAT OUTPUT (JSON):
{
  "hsCode": "6 digit",
  "description": "deskripsi subheading",
  "reasoningPath": [
    {
      "stepNumber": 1,
      "title": "Identifikasi Barang",
      "content": "...",
      "quotedRule": null,
      "chapterRef": null,
      "coverage": null
    },
    {
      "stepNumber": 2,
      "title": "Eliminasi Bab",
      "content": "...",
      "quotedRule": "teks kutipan dari catatan bab",
      "chapterRef": "84",
      "coverage": "validated"
    },
    ...
  ]
}
```

---

### 5. Wish List (Helper Stubs)

#### Untuk `classifyWithNotes()`:
```
classifyWithNotes
├── buildClassificationPrompt(desc, notes, coverage)
├── parseClassificationResponse(text)
│   ├── stripCodeFences(text)
│   └── makeClassificationResult(raw)
└── timeout wrapper (30 detik)
```

#### Untuk `loadChapters()`:
```
loadChapters
├── readChapterFile(chapterNumber)     → ChapterNote
└── makeCoverageMap(candidates, loaded)
```

#### Untuk `execute()` pada use case:
```
execute
├── identifyCandidateChapters(itemDescription)
├── loadChapters(candidateChapters)
└── classifyWithNotes(itemDescription, notes, coverageMap)
```

---

### 6. Examples

#### `makeItemDescription(text, source)`
```js
// Example 1: input valid
makeItemDescription("  laptop 14 inci prosesor Intel  ", "text")
// => { ok: true, data: { text: "laptop 14 inci prosesor Intel", source: "text" } }

// Example 2: terlalu pendek
makeItemDescription("ok", "text")
// => { ok: false, error: "Deskripsi barang terlalu singkat." }
```

#### `makeCoverageMap(candidateChapters, loadedChapterNumbers)`
```js
// Example 1: sebagian tervalidasi
makeCoverageMap(["84", "85", "90"], ["84", "85"])
// => {
//   chapters: { "84": "validated", "85": "validated", "90": "unvalidated" },
//   hasUnvalidated: true
// }

// Example 2: semua tervalidasi
makeCoverageMap(["84", "85"], ["84", "85"])
// => {
//   chapters: { "84": "validated", "85": "validated" },
//   hasUnvalidated: false
// }
```

#### `parseChapterListResponse(responseText)`
```js
// Example 1: respons valid
parseChapterListResponse('```json\n["84", "85", "90"]\n```')
// => { ok: true, data: ["84", "85", "90"] }

// Example 2: lebih dari 5 bab → dipotong
parseChapterListResponse('["01","02","03","04","05","06","07"]')
// => { ok: true, data: ["01","02","03","04","05"] }
```

#### `presentClassificationResult(result)`
```js
// Example 1: format hsCode dengan titik
presentClassificationResult({ hsCode: "847130", description: "...", ... })
// => { hsCodeFormatted: "8471.30", ... }
```

---

## Error Registry

| Kode Error | Sumber | Pesan User (Bahasa Indonesia) |
|---|---|---|
| `INPUT_TOO_SHORT` | Input validation | "Deskripsi barang terlalu singkat." |
| `INPUT_TOO_LONG` | Input validation | "Deskripsi terlalu panjang (maksimum 2.000 karakter)." |
| `PHOTO_TOO_LARGE` | Input validation | "Foto terlalu besar (maksimum 5MB)." |
| `PHOTO_UNSUPPORTED_FORMAT` | Input validation | "Format foto tidak didukung. Gunakan JPEG, PNG, atau WEBP." |
| `PHOTO_UNIDENTIFIABLE` | Gemini Vision | "Foto tidak dapat diidentifikasi. Coba foto yang lebih jelas atau ketik deskripsi barang secara manual." |
| `NO_CANDIDATE_CHAPTERS` | Chapter identification | "Deskripsi barang tidak cukup jelas untuk mengidentifikasi bab HS yang relevan. Coba tambahkan detail material, fungsi, atau bentuk barang." |
| `GEMINI_UNAVAILABLE` | Gemini Service | "Ada masalah dengan sistem AI. Hubungi administrator." |
| `GEMINI_TIMEOUT` | Gemini Service | "Koneksi AI terputus. Silakan coba lagi." |
| `GEMINI_INVALID_RESPONSE` | Gemini Service | "Respons AI tidak valid. Silakan coba lagi." |

---

## Correctness Properties

### Property 1: ItemDescription selalu di-trim dan dalam rentang valid

*Untuk setiap* string `text`, `makeItemDescription(text, source)` menghasilkan `ok = true` jika dan hanya jika `text.trim().length >= 3` dan `text.trim().length <= 2000`. Nilai `data.text` selalu merupakan hasil `text.trim()`.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

---

### Property 2: CandidateChapters tidak pernah melebihi 5

*Untuk setiap* respons dari `identifyCandidateChapters()`, array yang dihasilkan selalu memiliki panjang `>= 0` dan `<= 5`. Batas atas ini berlaku bahkan jika LLM menghasilkan lebih dari 5 kandidat.

**Validates: Requirement 3.2**

---

### Property 3: CoverageMap konsisten dengan input

*Untuk setiap* pemanggilan `makeCoverageMap(candidates, loaded)`:
- Setiap elemen di `candidates` pasti muncul sebagai key di `coverageMap.chapters`
- Setiap bab di `loaded` yang ada di `candidates` bernilai `"validated"`
- Setiap bab di `candidates` yang tidak ada di `loaded` bernilai `"unvalidated"`
- `hasUnvalidated` adalah `true` jika dan hanya jika ada setidaknya satu bab `"unvalidated"`

**Validates: Requirement 4.2**

---

### Property 4: ClassificationResult selalu memiliki hsCode 6 digit angka

*Untuk setiap* `ClassificationResult` yang berhasil dibuat via `makeClassificationResult()`, field `hsCode` selalu match pattern `/^\d{6}$/`.

**Validates: Requirement 5.4**

---

### Property 5: ReasoningPath selalu memiliki tepat 5 langkah berurutan

*Untuk setiap* `ClassificationResult` yang valid, `reasoningPath.length === 5` dan `reasoningPath[i].stepNumber === i + 1` untuk setiap `i` dari 0 sampai 4.

**Validates: Requirement 5.2**

---

### Property 6: Coverage badge konsisten dengan CoverageMap

*Untuk setiap* `ReasoningStep` yang memiliki `chapterRef !== null`, nilai `coverage` pada langkah tersebut harus sama dengan `coverageMap.chapters[chapterRef]`.

**Validates: Requirement 6.3**
