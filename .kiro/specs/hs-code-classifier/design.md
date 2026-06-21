# Design Document: HS Code Classifier

## Overview

HS Code Classifier adalah alat berbasis browser untuk staf PPJK yang mendukung dua mode penggunaan:

- **Finder Mode**: Pengguna mendeskripsikan produk dalam teks bebas → sistem mengekstrak atribut terstruktur via Gemini → engine deterministik melakukan tree traversal pada data HS → menampilkan kandidat HS code 6-digit beserta reasoning path.
- **Quiz Mode**: Gemini menghasilkan deskripsi produk → engine mengklasifikasikan jawaban yang benar → pengguna menebak kode HS → sistem mengevaluasi dan menampilkan reasoning path.

### Prinsip Arsitektur Kunci

1. **LLM hanya di pintu masuk**: Gemini digunakan *hanya* untuk (a) ekstraksi atribut dari teks bebas, (b) menghasilkan pertanyaan klarifikasi, dan (c) menghasilkan deskripsi soal Quiz. LLM **tidak pernah** menentukan kode HS.
2. **Classification Engine bersifat deterministik**: Setiap `ItemAttributes` yang sama menghasilkan `HsCandidate[]` yang identik — tanpa randomness, tanpa LLM.
3. **Data HS di-load server-side**: CSV dibaca di API route (Node.js), di-cache in-memory, dan tidak pernah dikirim mentah ke browser.
4. **Semua state di component**: Tidak ada server-side session; `ClassifierSession` disimpan di React component state.

### Alur Data

```
[User Input]
     │
     ▼
[attribute-extractor.service.js] ──► Gemini API (atribut saja)
     │
     ▼
[ItemAttributes]
     │
     ▼
[classify-hs-code.js (use case)] ──► [classification-engine.js]
                                           │
                                    [hs-tree (cached)]
                                           │
                                    weighted token match
                                    per level (no LLM)
                                           │
                                           ▼
                                    [HsCandidate[]]
     │
     ▼
[API Route] ──► [React Component]
```

---

## Architecture

### Lapisan dan File Baru

```
harmonized-system/
└── data/
    ├── harmonized-system.csv   # HS node data (level 2/4/6)
    └── sections.csv            # Section metadata (level 1)

app/
├── core/
│   ├── entities/
│   │   └── hs-classifier.js          # HsNode, ItemAttributes, HsCandidate, dll
│   ├── ports/
│   │   └── hs-tree-loader.port.js    # Interface untuk load HS tree
│   └── use-cases/
│       ├── classify-hs-code.js       # Orkestrasi: ekstraksi + traversal
│       └── generate-quiz-item.js     # Orkestrasi: Gemini generate + Engine classify
├── infrastructure/
│   └── services/
│       ├── hs-tree-loader.service.js     # Baca + parse CSV, cache tree
│       ├── attribute-extractor.service.js # Gemini: ekstrak atribut / klarifikasi
│       └── classification-engine.js      # Tree traversal + token matching
├── adapters/
│   ├── controllers/
│   │   └── hs-classifier.controller.js
│   └── presenters/
│       └── hs-classifier.presenter.js
├── api/
│   ├── hs-classifier/
│   │   └── route.js                  # POST /api/hs-classifier
│   └── hs-classifier/quiz/
│       └── route.js                  # POST /api/hs-classifier/quiz
└── presentation/
    └── components/features/
        ├── HsClassifierPage.jsx      # Mode selector + root state
        ├── HsClassifierFinder.jsx    # Finder mode UI
        └── HsClassifierQuiz.jsx      # Quiz mode UI

app/hs-classifier/
└── page.jsx                          # Next.js route
```

### Dependency Flow

```
HsClassifierPage / HsClassifierFinder / HsClassifierQuiz
        │  (fetch)
        ▼
API Routes (route.js)
        │
        ▼
hs-classifier.controller.js
        │
        ├──► classify-hs-code.js (use case)
        │         ├──► attribute-extractor.service.js (via port)
        │         └──► classification-engine.js (pure, no port)
        │
        └──► generate-quiz-item.js (use case)
                  ├──► attribute-extractor.service.js (via port)
                  └──► classification-engine.js
```

---

## Components and Interfaces

### CSV Schema

#### `harmonized-system/data/harmonized-system.csv`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `code` | string | Kode HS numerik: 2 digit (Chapter), 4 digit (Heading), 6 digit (Subheading) |
| `level` | number | `2` = Chapter, `4` = Heading, `6` = Subheading |
| `description` | string | Deskripsi resmi node HS dalam Bahasa Inggris |
| `parent` | string | Kode parent: Chapter → `""`, Heading → Chapter code (2 digit), Subheading → Heading code (4 digit) |
| `section` | string | Kode section romawi (e.g., `"I"`, `"XI"`) — hanya diisi untuk level 2 |

Contoh baris:
```
code,level,description,parent,section
01,2,Live animals,,I
0101,4,Live horses/asses/mules/hinnies,01,
010121,6,Pure-bred breeding horses,0101,
```

#### `harmonized-system/data/sections.csv`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `section` | string | Kode section romawi (e.g., `"I"`) |
| `title` | string | Judul section resmi (e.g., `"Live Animals; Animal Products"`) |
| `chapterRange` | string | Range chapter dalam format `"01-05"` |

---

## Data Models

### 1. Data Shapes (`app/core/entities/hs-classifier.js`)

```js
/**
 * @typedef {"section" | "chapter" | "heading" | "subheading"} HsLevel
 * Level hierarki HS tree. section=L1, chapter=L2, heading=L4, subheading=L6.
 */

/**
 * Satu node dalam HS Tree.
 * @typedef {Object} HsNode
 * @property {string} code          - Kode HS: "" (section), "01" (chapter), "0101" (heading), "010121" (subheading)
 * @property {HsLevel} level        - Level hierarki node ini
 * @property {string} description   - Deskripsi resmi dari CSV
 * @property {string} parentCode    - Kode parent ("" jika section/root)
 * @property {string} sectionCode   - Kode section romawi, e.g. "I", "XI"
 * @property {HsNode[]} children    - Node anak (diisi saat tree di-build)
 */

/**
 * Atribut terstruktur hasil ekstraksi Gemini dari teks bebas.
 * Semua field bisa null jika tidak dapat diekstrak.
 * @typedef {Object} ItemAttributes
 * @property {string|null} itemName       - Nama umum barang, e.g. "sepatu olahraga"
 * @property {string|null} material       - Material utama, e.g. "kulit sapi"
 * @property {string|null} origin         - Asal barang/proses, e.g. "Indonesia"
 * @property {string|null} function       - Fungsi/kegunaan, e.g. "alas kaki olahraga"
 * @property {string|null} intendedUse    - Penggunaan yang dimaksud, e.g. "untuk dewasa"
 * @property {string|null} processingState - Kondisi proses, e.g. "jadi", "setengah jadi"
 * @property {string|null} technicalSpecs - Spesifikasi teknis, e.g. "sol karet"
 * @property {string|null} form           - Bentuk fisik, e.g. "pasang", "lembar"
 */

/**
 * Skor match satu node pada satu level traversal.
 * @typedef {Object} LevelScore
 * @property {string} code        - Kode HS node
 * @property {string} description - Deskripsi node
 * @property {number} score       - Weighted token match score (0.0–1.0)
 */

/**
 * Jejak traversal lengkap dari section hingga subheading.
 * @typedef {Object} ReasoningPath
 * @property {LevelScore} section     - Skor level section
 * @property {LevelScore} chapter     - Skor level chapter
 * @property {LevelScore} heading     - Skor level heading
 * @property {LevelScore} subheading  - Skor level subheading (kode 6-digit)
 */

/**
 * Satu kandidat HS code hasil klasifikasi engine.
 * @typedef {Object} HsCandidate
 * @property {string} code            - Kode HS 6-digit
 * @property {string} description     - Deskripsi resmi subheading
 * @property {number} confidenceScore - Skor agregat (0.0–1.0)
 * @property {ReasoningPath} reasoningPath - Jejak traversal dengan skor per level
 */

/**
 * Satu turn percakapan dalam sesi klarifikasi.
 * @typedef {Object} ConversationTurn
 * @property {"question" | "answer"} role - Siapa yang berbicara
 * @property {string} content            - Isi pesan
 */

/**
 * Status session classifier.
 * @typedef {"idle" | "extracting" | "clarifying" | "classifying" | "done" | "error"} SessionStatus
 */

/**
 * Satu sesi klasifikasi lengkap (disimpan di component state).
 * @typedef {Object} ClassifierSession
 * @property {string} rawInput             - Input teks asli dari pengguna
 * @property {ItemAttributes|null} attributes - Atribut terakhir hasil ekstraksi
 * @property {ConversationTurn[]} turns    - Riwayat percakapan klarifikasi
 * @property {number} turnCount            - Jumlah turn klarifikasi yang sudah terjadi (0–3)
 * @property {HsCandidate[]} candidates    - Hasil klasifikasi (array kosong jika belum selesai)
 * @property {SessionStatus} status        - Status sesi saat ini
 * @property {string|null} errorMessage    - Pesan error user-facing (null jika tidak ada error)
 */

/**
 * Konfigurasi threshold untuk Classification Engine.
 * @typedef {Object} ClassifierConfig
 * @property {number} confidenceThreshold  - Skor minimum kandidat ditampilkan (default: 0.15)
 * @property {number} pruningThreshold     - Skor minimum per level untuk di-traverse (default: 0.05)
 */

/**
 * Satu soal dalam Quiz Mode.
 * @typedef {Object} QuizItem
 * @property {string} description       - Deskripsi barang yang dihasilkan Gemini
 * @property {HsCandidate} answer       - Kandidat dengan confidenceScore tertinggi (jawaban benar)
 * @property {ItemAttributes} attributes - Atribut yang diekstrak dari deskripsi
 */

/**
 * Status evaluasi jawaban pengguna dalam Quiz Mode.
 * @typedef {"correct" | "incorrect" | "skipped"} QuizAnswerStatus
 */

/**
 * Hasil evaluasi satu soal Quiz.
 * @typedef {Object} QuizResult
 * @property {QuizAnswerStatus} status     - Hasil evaluasi
 * @property {string} userAnswer           - Jawaban yang diinput pengguna ("" jika skip)
 * @property {HsCandidate} correctAnswer   - Jawaban benar dari engine
 * @property {ItemAttributes} attributes   - Atribut hasil ekstraksi
 */
```

---

### 2. Function Contracts

#### `app/core/entities/hs-classifier.js`

**`makeItemAttributes(raw)`**
- Input: `Object` — data mentah dari JSON response Gemini
- Output: `{ ok: true, data: ItemAttributes } | { ok: false, error: string }`
- Tujuan: Parse dan validasi JSON respons Gemini menjadi `ItemAttributes` yang terpercaya; field yang tidak ada di-coerce ke `null`.

**`isSufficientForClassification(attrs)`**
- Input: `ItemAttributes`
- Output: `boolean`
- Tujuan: Tentukan apakah atribut cukup untuk lanjut ke klasifikasi (minimal `itemName` atau `function` tidak null).

**`makeHsCandidate(code, description, confidenceScore, reasoningPath)`**
- Input: `string, string, number, ReasoningPath`
- Output: `{ ok: true, data: HsCandidate } | { ok: false, error: string }`
- Tujuan: Bangun `HsCandidate` dengan validasi invariant (code harus 6 digit, score dalam [0,1]).

**`makeClassifierConfig(raw)`**
- Input: `Object` — config mentah (e.g. dari env atau parameter)
- Output: `ClassifierConfig`
- Tujuan: Parse konfigurasi threshold dengan fallback ke default jika nilai di luar rentang [0,1].

---

#### `app/infrastructure/services/hs-tree-loader.service.js`

**`createHsTreeLoaderService()`**
- Input: tidak ada (membaca path file dari konstanta internal)
- Output: `HsTreeLoaderPort` — object dengan method `loadTree()`
- Tujuan: Buat instance service yang bisa load dan cache HS tree dari CSV.

**`loadTree()` (method pada service)**
- Input: tidak ada
- Output: `Promise<{ ok: true, data: HsNode[] } | { ok: false, error: string }>`
- Tujuan: Load + parse kedua CSV dan bangun HS tree; kembalikan root nodes (array section); gunakan in-memory cache agar hanya dibaca sekali.

**`parseHarmonizedSystemCsv(rawText)`** *(helper)*
- Input: `string` — raw content file harmonized-system.csv
- Output: `{ ok: true, data: HsNode[] } | { ok: false, error: string }`
- Tujuan: Parse baris CSV menjadi array `HsNode` flat (tanpa relasi parent-child).

**`parseSectionsCsv(rawText)`** *(helper)*
- Input: `string` — raw content file sections.csv
- Output: `{ ok: true, data: Map<string, string> } | { ok: false, error: string }`
- Tujuan: Parse sections.csv menjadi `Map<sectionCode, title>`.

**`buildTree(nodes, sectionTitles)`** *(helper)*
- Input: `HsNode[]` (flat), `Map<string, string>` (section titles)
- Output: `HsNode[]` — array section nodes dengan `children` terisi recursively
- Tujuan: Susun node flat menjadi tree parent-child berdasarkan field `parent` dan `section`.

---

#### `app/infrastructure/services/attribute-extractor.service.js`

**`createAttributeExtractorService(geminiService)`**
- Input: `GeminiGateway` — instance gemini service
- Output: object dengan method `extractAttributes()` dan `generateClarificationQuestion()`
- Tujuan: Buat service yang menggunakan Gemini untuk ekstraksi atribut dan klarifikasi.

**`extractAttributes(description, conversationHistory)` (method)**
- Input: `string` (deskripsi), `ConversationTurn[]` (riwayat, bisa kosong)
- Output: `Promise<{ ok: true, data: ItemAttributes } | { ok: false, error: string }>`
- Tujuan: Kirim prompt ke Gemini untuk ekstrak `ItemAttributes` dari deskripsi + history; parse respons JSON.

**`generateClarificationQuestion(attributes, conversationHistory)` (method)**
- Input: `ItemAttributes`, `ConversationTurn[]`
- Output: `Promise<{ ok: true, data: string } | { ok: false, error: string }>`
- Tujuan: Minta Gemini hasilkan satu pertanyaan klarifikasi dalam Bahasa Indonesia berdasarkan atribut yang masih null.

**`generateQuizDescription()` (method)**
- Input: tidak ada
- Output: `Promise<{ ok: true, data: string } | { ok: false, error: string }>`
- Tujuan: Minta Gemini hasilkan satu deskripsi barang realistis dalam Bahasa Indonesia tanpa petunjuk kode HS.

**`buildExtractionPrompt(description, history)`** *(helper)*
- Input: `string`, `ConversationTurn[]`
- Output: `string`
- Tujuan: Bangun prompt ekstraksi atribut dengan instruksi eksplisit "Jangan menyarankan kode HS."

**`parseAttributeResponse(responseText)`** *(helper)*
- Input: `string` — raw text dari Gemini
- Output: `{ ok: true, data: ItemAttributes } | { ok: false, error: string }`
- Tujuan: Strip markdown code fences, parse JSON, dan jalankan `makeItemAttributes()`.

---

#### `app/infrastructure/services/classification-engine.js`

**`createClassificationEngine(hsTree, config)`**
- Input: `HsNode[]` (root/section nodes), `ClassifierConfig`
- Output: object dengan method `classify()`
- Tujuan: Buat engine dengan HS tree dan config yang sudah tersedia.

**`classify(attributes)` (method)**
- Input: `ItemAttributes`
- Output: `HsCandidate[]` — diurutkan descending by `confidenceScore`, hanya yang ≥ `confidenceThreshold`
- Tujuan: Jalankan full tree traversal Section→Chapter→Heading→Subheading dan kembalikan kandidat.

**`traverseLevel(nodes, attributeTokens, pruningThreshold)`** *(helper)*
- Input: `HsNode[]`, `WeightedToken[]`, `number`
- Output: `{ node: HsNode, score: number }[]` — hanya node dengan score ≥ threshold
- Tujuan: Score semua node pada satu level dan filter dengan pruning threshold.

**`scoreNode(node, attributeTokens)`** *(helper)*
- Input: `HsNode`, `WeightedToken[]`
- Output: `number` — weighted match score (0.0–1.0)
- Tujuan: Hitung weighted token match score antara deskripsi node dan semua token atribut.

**`tokenizeAttributes(attributes)`** *(helper)*
- Input: `ItemAttributes`
- Output: `WeightedToken[]`
- Tujuan: Ubah semua nilai `ItemAttributes` menjadi token dengan bobot sesuai field-nya.

**`tokenize(text)`** *(helper)*
- Input: `string | null`
- Output: `string[]`
- Tujuan: Lowercase, strip punctuation, split by whitespace, hapus stop words.

---

#### `app/core/use-cases/classify-hs-code.js`

**`createClassifyHsCodeUseCase(deps)`**
- Input: `{ attributeExtractor, hsTreeLoader, config }`
- Output: object dengan method `execute()`
- Tujuan: Buat use case dengan dependencies diinjeksi.

**`execute(input)` (method)**
- Input: `{ description: string, conversationHistory: ConversationTurn[], turnCount: number }`
- Output: `Promise<ClassifyHsCodeResult>`
- Tujuan: Orkestrasi: validasi input → ekstrak atribut → cek kelengkapan → klasifikasi atau hasilkan klarifikasi.

Tipe output:
```js
/**
 * @typedef {Object} ClassifyHsCodeResult
 * @property {"classified" | "needs_clarification"} outcome
 * @property {HsCandidate[]} [candidates]        - Ada jika outcome = "classified"
 * @property {ItemAttributes} [attributes]       - Selalu ada jika ok
 * @property {string} [clarificationQuestion]    - Ada jika outcome = "needs_clarification"
 * @property {string} [errorCode]                - Ada jika ok = false
 * @property {string} [errorMessage]             - Pesan error user-facing
 * @property {boolean} ok
 */
```

---

#### `app/core/use-cases/generate-quiz-item.js`

**`createGenerateQuizItemUseCase(deps)`**
- Input: `{ attributeExtractor, hsTreeLoader, config }`
- Output: object dengan method `execute()`
- Tujuan: Buat use case untuk generate soal quiz.

**`execute()` (method)**
- Input: tidak ada
- Output: `Promise<{ ok: true, data: QuizItem } | { ok: false, error: string }>`
- Tujuan: Minta Gemini hasilkan deskripsi → jalankan engine → simpan jawaban benar → kembalikan `QuizItem`.

---

#### `app/adapters/controllers/hs-classifier.controller.js`

**`createHsClassifierController(deps)`**
- Input: `{ classifyUseCase, generateQuizItemUseCase }`
- Output: object dengan method `handleClassify()` dan `handleGenerateQuiz()`
- Tujuan: Buat controller dengan use cases diinjeksi.

**`handleClassify(requestBody)` (method)**
- Input: `{ description: string, conversationHistory: ConversationTurn[], turnCount: number }`
- Output: `Promise<ApiResponse>`
- Tujuan: Validasi request body, jalankan use case klasifikasi, kembalikan respons terstandarisasi.

**`handleGenerateQuiz()` (method)**
- Input: tidak ada
- Output: `Promise<ApiResponse>`
- Tujuan: Jalankan use case generate quiz item dan kembalikan `QuizItem` (tanpa jawaban).

---

#### `app/adapters/presenters/hs-classifier.presenter.js`

**`presentCandidates(candidates)`**
- Input: `HsCandidate[]`
- Output: `CandidateViewModel[]`
- Tujuan: Transform kandidat menjadi view model dengan skor dalam persen dan path yang diformat.

**`presentQuizItem(quizItem)`**
- Input: `QuizItem`
- Output: `QuizItemViewModel` — **tanpa** field jawaban
- Tujuan: Transform quiz item untuk dikirim ke client tanpa membocorkan jawaban.

---

### 3. Wish List (Helper Stubs untuk Fungsi Kompleks)

#### Untuk `scoreNode(node, attributeTokens)`:
```
scoreNode
├── tokenMatchCount(nodeTokens, queryToken)   → berapa node token yang match
├── normalizeScore(rawScore, maxPossible)     → bagi dengan max untuk normalisasi
└── clampScore(score)                         → pastikan dalam [0, 1]
```

#### Untuk `buildTree(nodes, sectionTitles)`:
```
buildTree
├── indexByCode(nodes)           → Map<code, HsNode>
├── attachChildren(nodeMap)      → isi children[] setiap node
└── extractRoots(nodeMap)        → kembalikan section nodes saja
```

#### Untuk `classify(attributes)`:
```
classify
├── tokenizeAttributes(attrs)         → WeightedToken[]
├── traverseLevel(nodes, tokens, th)  → { node, score }[]
├── buildReasoningPath(...)           → ReasoningPath
└── makeHsCandidate(...)              → HsCandidate
```

#### Untuk `execute()` pada `classify-hs-code.js`:
```
execute
├── validateDescription(text)              → { ok, error? }
├── extractAttributes(desc, history)       → ItemAttributes
├── isSufficientForClassification(attrs)   → boolean
├── generateClarificationQuestion(...)     → string
└── classify(attrs)                        → HsCandidate[]
```

---

### 4. Bobot Token per Atribut

```js
const ATTRIBUTE_WEIGHTS = {
  itemName:       3,
  function:       3,
  material:       2,
  origin:         2,
  intendedUse:    2,
  processingState: 1,
  technicalSpecs:  1,
  form:            1,
};
```

**Typedef tambahan untuk token berbobot:**
```js
/**
 * Token dengan bobot untuk digunakan dalam scoring.
 * @typedef {Object} WeightedToken
 * @property {string} token  - Token lowercase
 * @property {number} weight - Bobot sesuai field asalnya
 */
```

**Stop words Bahasa Indonesia yang di-strip saat tokenisasi:**
`["dan", "atau", "yang", "untuk", "dari", "dengan", "di", "ke", "pada", "adalah", "ini", "itu", "the", "of", "for", "and", "or", "in", "a", "an"]`

---

### 5. Examples

#### `makeItemAttributes(raw)`
```js
// Example 1: semua field terisi
makeItemAttributes({
  itemName: "sepatu olahraga",
  material: "kulit sapi",
  origin: null,
  function: "alas kaki",
  intendedUse: "dewasa",
  processingState: "jadi",
  technicalSpecs: null,
  form: "pasang"
})
// => { ok: true, data: { itemName: "sepatu olahraga", material: "kulit sapi", origin: null, function: "alas kaki", intendedUse: "dewasa", processingState: "jadi", technicalSpecs: null, form: "pasang" } }

// Example 2: field yang tidak ada di-coerce ke null
makeItemAttributes({ itemName: "beras" })
// => { ok: true, data: { itemName: "beras", material: null, origin: null, function: null, intendedUse: null, processingState: null, technicalSpecs: null, form: null } }
```

#### `isSufficientForClassification(attrs)`
```js
// Example 1: cukup karena itemName ada
isSufficientForClassification({ itemName: "beras", function: null, material: null, origin: null, ... })
// => true

// Example 2: tidak cukup karena itemName dan function keduanya null
isSufficientForClassification({ itemName: null, function: null, material: "kayu", ... })
// => false
```

#### `makeClassifierConfig(raw)`
```js
// Example 1: nilai valid
makeClassifierConfig({ confidenceThreshold: 0.2, pruningThreshold: 0.05 })
// => { confidenceThreshold: 0.2, pruningThreshold: 0.05 }

// Example 2: nilai di luar range → fallback ke default
makeClassifierConfig({ confidenceThreshold: 1.5, pruningThreshold: -0.1 })
// => { confidenceThreshold: 0.15, pruningThreshold: 0.05 }
// (warning dicatat ke console)
```

#### `tokenize(text)`
```js
// Example 1: normal text
tokenize("Live horses and asses")
// => ["live", "horses", "asses"]  (stop word "and" dihapus)

// Example 2: null input
tokenize(null)
// => []
```

#### `scoreNode(node, attributeTokens)`
```js
// Example 1: match sempurna
scoreNode(
  { code: "01", description: "live animals", ... },
  [{ token: "live", weight: 3 }, { token: "animals", weight: 3 }]
)
// => 1.0  (kedua token match dengan bobot penuh)

// Example 2: tidak ada match
scoreNode(
  { code: "50", description: "silk", ... },
  [{ token: "sepatu", weight: 3 }, { token: "kulit", weight: 2 }]
)
// => 0.0
```

#### `buildTree(nodes, sectionTitles)` — contoh input/output snippet
```js
// Input nodes (flat):
[
  { code: "01", level: "chapter", parentCode: "", sectionCode: "I", description: "Live animals", children: [] },
  { code: "0101", level: "heading", parentCode: "01", sectionCode: "I", description: "Live horses", children: [] },
]
// Output (tree dengan children):
[
  { code: "I", level: "section", ..., children: [
    { code: "01", level: "chapter", ..., children: [
      { code: "0101", level: "heading", ..., children: [] }
    ]}
  ]}
]
```

#### `presentQuizItem(quizItem)` — memastikan jawaban tidak bocor
```js
// Input:
{ description: "Beras putih giling", answer: { code: "100630", ... }, attributes: { ... } }

// Output (jawaban dihilangkan):
{ description: "Beras putih giling" }
// field answer tidak ada di ViewModel
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Mode switch resets session to idle

*For any* ClassifierSession regardless of its current `status`, switching mode (Finder ↔ Quiz) should produce a new session with `status = "idle"`, empty `candidates`, empty `turns`, and `turnCount = 0`.

**Validates: Requirements 1.4**

---

### Property 2: Description length validation is total

*For any* string `text`, `validateDescription(text.trim())` returns `ok = false` if and only if `text.trim().length < 3` or `text.trim().length > 2000`; otherwise returns `ok = true`.

**Validates: Requirements 2.2, 2.3, 2.4**

---

### Property 3: Whitespace normalization is idempotent

*For any* string `text`, `normalizeWhitespace(normalizeWhitespace(text))` equals `normalizeWhitespace(text)` — applying normalization twice is the same as applying it once. Also, the result has no leading/trailing whitespace and no consecutive internal whitespace characters.

**Validates: Requirements 2.5**

---

### Property 4: Attribute JSON parsing round-trip

*For any* `ItemAttributes` object with all fields either strings or null, serializing it to JSON and calling `parseAttributeResponse(json)` produces an equivalent `ItemAttributes` with all original field values preserved.

**Validates: Requirements 3.4, 3.5**

---

### Property 5: Sufficiency check matches definition

*For any* `ItemAttributes`, `isSufficientForClassification(attrs)` returns `true` if and only if at least one of `attrs.itemName` or `attrs.function` is a non-null, non-empty string.

**Validates: Requirements 3.6**

---

### Property 6: Max 3 clarification turns is enforced

*For any* `ClassifierSession` where `turnCount >= 3`, calling `execute()` on the classify use case must never return `outcome = "needs_clarification"` — it must always attempt classification with the best available attributes.

**Validates: Requirements 4.4, 4.5**

---

### Property 7: Token match score is always in range [0, 1]

*For any* `HsNode` and *for any* array of `WeightedToken[]`, `scoreNode(node, attributeTokens)` always returns a finite number in the closed interval [0.0, 1.0].

**Validates: Requirements 5.4**

---

### Property 8: Classification output satisfies all threshold and completeness invariants

*For any* `ItemAttributes` passed to `classify(attributes)`, every `HsCandidate` in the returned array must satisfy all three conditions simultaneously:
1. `confidenceScore >= config.confidenceThreshold`
2. All four `ReasoningPath` level scores (`section.score`, `chapter.score`, `heading.score`, `subheading.score`) are `>= config.pruningThreshold`
3. The `ReasoningPath` has non-null values for all four levels (section, chapter, heading, subheading)

**Validates: Requirements 5.1, 5.6, 5.7, 5.8**

---

### Property 9: Classification is deterministic

*For any* `ItemAttributes`, calling `classify(attributes)` twice with the same engine instance and the same HS tree must produce two arrays that are element-wise identical — same codes, same scores, same order.

**Validates: Requirements 9.4**

---

### Property 10: Config out-of-range values fall back to defaults

*For any* number `x` outside the closed interval [0.0, 1.0], `makeClassifierConfig({ confidenceThreshold: x })` must return `confidenceThreshold = 0.15`. Likewise for `pruningThreshold` outside [0, 1] → `0.05`.

**Validates: Requirements 11.4**

---

### Property 11: Quiz item answer equals top engine candidate

*For any* generated `QuizItem`, `quizItem.answer.code` must equal the `code` of the `HsCandidate` with the highest `confidenceScore` returned by `classify(quizItem.attributes)` — the answer is always the engine's own top result, not generated by LLM.

**Validates: Requirements 12.4, 12.5**

---

### Property 12: Quiz answer validation matches exactly-6-digits rule

*For any* string `s`, `isValidQuizAnswer(s)` returns `true` if and only if `s` matches the pattern `/^\d{6}$/` — exactly 6 characters, all decimal digits, no spaces, no letters.

**Validates: Requirements 13.2**

---

### Property 13: Quiz answer evaluation is correct and total

*For any* string `userAnswer` and any valid 6-digit `correctCode`, `evaluateQuizAnswer(userAnswer, correctCode).status` equals `"correct"` if and only if `userAnswer === correctCode`; otherwise equals `"incorrect"`.

**Validates: Requirements 14.1, 14.2, 14.3**

---

## Error Handling

### Error Code Registry

| Kode Error | Sumber | Pesan User (Bahasa Indonesia) |
|---|---|---|
| `DESCRIPTION_TOO_SHORT` | Input validation | "Deskripsi barang terlalu singkat. Mohon berikan keterangan lebih detail." |
| `DESCRIPTION_TOO_LONG` | Input validation | "Deskripsi terlalu panjang (maksimum 2.000 karakter)." |
| `GEMINI_UNAVAILABLE` | Gemini Service | "Ada masalah dengan sistem AI. Hubungi administrator." |
| `GEMINI_TIMEOUT` | Gemini Service | "Koneksi AI terputus. Silakan coba lagi." |
| `GEMINI_INVALID_RESPONSE` | Attribute Extractor | "Respons AI tidak valid. Silakan coba lagi." |
| `HS_TREE_UNAVAILABLE` | HS Tree Loader | "Data HS code tidak tersedia. Hubungi administrator." |
| `CLASSIFICATION_FAILED` | Classification Engine | "Proses klasifikasi gagal. Hubungi administrator." |
| `NO_CANDIDATES` | Classification Engine | "Tidak ditemukan kandidat HS code yang cukup relevan. Coba perjelas deskripsi barang." |
| `QUIZ_ANSWER_INVALID` | UI Validation | "Kode HS harus terdiri dari 6 digit angka." |

### Error Propagation Strategy

1. **Input validation errors** (`DESCRIPTION_TOO_SHORT`, `DESCRIPTION_TOO_LONG`, `QUIZ_ANSWER_INVALID`) — ditangkap di component state, ditampilkan inline di bawah field input, tidak pernah dikirim ke server.

2. **Infrastructure errors** (Gemini, HS Tree) — API route mengembalikan `{ ok: false, errorCode, errorMessage }`; component menyimpan `errorMessage` di `ClassifierSession.errorMessage` dan menampilkannya sebagai alert.

3. **Technical details** — setiap error infrastructure mencatat `technicalDetails` ke `console.error()` server-side (Next.js API route). Tidak pernah dikirim ke client.

4. **Partial extraction** — jika Gemini berhasil mengekstrak beberapa atribut tetapi tidak semua, ini bukan error. Engine tetap dijalankan dengan atribut yang tersedia. Hanya jika *tidak ada* atribut sama sekali yang bernilai (`itemName` dan `function` keduanya null) yang memicu klarifikasi atau fallback.

5. **No candidates** — bukan error fatal. `ClassifierSession.status = "done"` dengan `candidates = []`, dan UI menampilkan pesan `NO_CANDIDATES`.

### Error Handling di Setiap Layer

```
API Route (route.js)
├── Catch semua exception yang lolos dari controller
├── Log technical details ke console.error()
└── Return 500 dengan { ok: false, errorCode: "CLASSIFICATION_FAILED", errorMessage: "..." }

Controller (hs-classifier.controller.js)
├── Validasi shape request body
├── Propagate error dari use case tanpa modifikasi
└── Return { ok, data?, errorCode?, errorMessage? }

Use Case (classify-hs-code.js)
├── Validasi description di sini (sebelum LLM dipanggil)
├── Propagate error dari infrastructure dengan errorCode
└── Return ClassifyHsCodeResult dengan ok=false jika ada error

Infrastructure Services
└── Selalu return { ok: false, error: string } — tidak pernah throw
```

---

## Testing Strategy

### Dual Testing Approach

Testing strategy menggunakan dua pendekatan komplementer:
1. **Unit tests / Example tests** — untuk skenario spesifik, edge case, dan error conditions
2. **Property-based tests** — untuk memverifikasi invariant universal di semua input

### Library Property-Based Testing

Gunakan **[fast-check](https://github.com/dubzzz/fast-check)** — library PBT untuk JavaScript/TypeScript.

```bash
npm install --save-dev fast-check
```

Setiap property test dikonfigurasi minimal **100 iterasi** (default fast-check sudah 100).

### Property Tests (dari Correctness Properties)

Tag format: `// Feature: hs-code-classifier, Property N: <deskripsi singkat>`

| Property | File Test | Yang Di-test |
|---|---|---|
| P1: Mode switch resets session | `HsClassifierPage.test.jsx` | Component state reset |
| P2: Description length validation | `hs-classifier.entity.test.js` | `validateDescription()` |
| P3: Whitespace normalization idempotent | `hs-classifier.entity.test.js` | `normalizeWhitespace()` |
| P4: Attribute JSON round-trip | `attribute-extractor.test.js` | `parseAttributeResponse()` |
| P5: Sufficiency check definition | `hs-classifier.entity.test.js` | `isSufficientForClassification()` |
| P6: Max 3 turns enforced | `classify-hs-code.test.js` | Use case `execute()` |
| P7: Score in [0, 1] | `classification-engine.test.js` | `scoreNode()` |
| P8: Classification output invariants | `classification-engine.test.js` | `classify()` |
| P9: Classification determinism | `classification-engine.test.js` | `classify()` |
| P10: Config out-of-range fallback | `hs-classifier.entity.test.js` | `makeClassifierConfig()` |
| P11: Quiz answer = top candidate | `generate-quiz-item.test.js` | `execute()` |
| P12: Quiz answer validation | `hs-classifier.entity.test.js` | `isValidQuizAnswer()` |
| P13: Answer evaluation correctness | `hs-classifier.entity.test.js` | `evaluateQuizAnswer()` |

### Unit Tests (Example-Based)

Fokus pada skenario konkret yang tidak dicakup property tests:

**Entities:**
- `makeClassifierConfig({})` → returns defaults `{ 0.15, 0.05 }`
- `makeHsCandidate()` dengan code non-6-digit → `{ ok: false }`

**HS Tree Loader:**
- Load CSV valid → tree dengan relasi parent-child benar
- CSV tidak ditemukan → `{ ok: false, error: "..." }`
- CSV malformed (header salah) → `{ ok: false, error: "..." }`

**Classification Engine:**
- `classify()` dengan HS tree yang sangat kecil dan atribut yang tepat match → kandidat ditemukan
- `classify()` dengan atribut yang semua null → returns `[]` (tidak crash)
- `tokenize("Live horses and asses")` → `["live", "horses", "asses"]`

**Attribute Extractor:**
- `parseAttributeResponse` dengan markdown code fence → di-strip dengan benar
- `parseAttributeResponse` dengan JSON invalid → `{ ok: false }`

**API Routes:**
- POST `/api/hs-classifier` dengan body kosong → 400
- POST `/api/hs-classifier` dengan description valid → 200 dengan `ClassifyHsCodeResult`

**UI Components:**
- `HsClassifierPage` renders mode selector
- `HsClassifierFinder` menampilkan loading state saat `status = "extracting"`
- `HsClassifierQuiz` tidak menampilkan jawaban sebelum user submit

### Integration Tests

- Full classify flow dengan small mock HS tree (tidak hit Gemini API)
- Quiz generation flow end-to-end dengan mock Gemini + real classification engine

### Test File Locations

```
app/core/entities/__tests__/hs-classifier.entity.test.js
app/core/use-cases/__tests__/classify-hs-code.test.js
app/core/use-cases/__tests__/generate-quiz-item.test.js
app/infrastructure/services/__tests__/classification-engine.test.js
app/infrastructure/services/__tests__/attribute-extractor.test.js
app/infrastructure/services/__tests__/hs-tree-loader.test.js
app/presentation/components/features/__tests__/HsClassifierPage.test.jsx
```

