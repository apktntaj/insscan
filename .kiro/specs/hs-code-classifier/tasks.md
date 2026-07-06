# Implementation Plan: HS Code Classifier

## Overview

Implementasi HS Code Classifier menggunakan Clean Architecture dengan dua mode: Finder (cari HS code dari deskripsi bebas) dan Quiz (tebak HS code dari soal yang dihasilkan LLM). Classification Engine bersifat deterministik — LLM hanya digunakan di pintu masuk untuk ekstraksi atribut. Urutan implementasi mengikuti dependency flow dari dalam ke luar: data → core entities → infrastructure → use cases → adapters → API → UI.

## Tasks

- [x] 1. Siapkan data layer dan install dependencies
  - Jalankan `npm install --save-dev fast-check` untuk property-based testing
  - Buat file `harmonized-system/data/chapter-notes.json` berisi notes untuk chapter umum (39, 72, 73, 84, 85, 87) — struktur `{ "chapter": "39", "notes": "..." }`
  - Verifikasi file `harmonized-system/data/harmonized-system.csv` dan `harmonized-system/data/sections.csv` sudah ada dengan schema yang benar (kolom: code, level, description, parent, section)
  - _Requirements: 6.1, 6.2_

- [ ] 2. Implementasi Core Entities
  - [ ] 2.1 Buat `app/core/entities/hs-classifier.js` dengan semua @typedef
    - Definisikan `HsLevel`, `HsNode`, `ItemAttributes`, `LevelScore`, `ReasoningPath`, `HsCandidate`, `ConversationTurn`, `SessionStatus`, `ClassifierSession`, `ClassifierConfig`, `QuizItem`, `QuizAnswerStatus`, `QuizResult`, `WeightedToken`
    - _Requirements: 3.1, 5.1, 12.4_

  - [ ] 2.2 Implementasi `makeItemAttributes(raw)` dan `isSufficientForClassification(attrs)`
    - `makeItemAttributes`: parse object mentah → `ItemAttributes`, coerce field tidak ada ke `null`, return `{ ok, data | error }`
    - `isSufficientForClassification`: return `true` jika `itemName` atau `function` adalah string non-null non-empty
    - _Requirements: 3.4, 3.5, 3.6_

  - [ ]* 2.3 Tulis property test untuk `isSufficientForClassification` dan `makeItemAttributes`
    - **Property 5: Sufficiency check matches definition**
    - **Validates: Requirements 3.6**
    - File: `app/core/entities/__tests__/hs-classifier.entity.test.js`

  - [ ] 2.4 Implementasi `validateDescription(text)` dan `normalizeWhitespace(text)`
    - `validateDescription`: return `{ ok: false, error }` jika `text.trim().length < 3` atau `> 2000`; otherwise `{ ok: true }`
    - `normalizeWhitespace`: trim leading/trailing, replace consecutive whitespace dengan single space
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.5 Tulis property test untuk `validateDescription` dan `normalizeWhitespace`
    - **Property 2: Description length validation is total**
    - **Validates: Requirements 2.2, 2.3, 2.4**
    - **Property 3: Whitespace normalization is idempotent**
    - **Validates: Requirements 2.5**
    - File: `app/core/entities/__tests__/hs-classifier.entity.test.js`

  - [ ] 2.6 Implementasi `makeHsCandidate(code, description, confidenceScore, reasoningPath)`
    - Validasi: code harus tepat 6 digit angka, confidenceScore dalam [0, 1]
    - Return `{ ok: true, data: HsCandidate } | { ok: false, error: string }`
    - _Requirements: 7.1, 7.3_

  - [ ] 2.7 Implementasi `makeClassifierConfig(raw)`
    - Parse threshold dari raw object; fallback `confidenceThreshold = 0.15` dan `pruningThreshold = 0.05` jika nilai di luar [0, 1]
    - Catat warning ke `console.warn()` jika fallback terjadi
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 2.8 Tulis property test untuk `makeClassifierConfig`
    - **Property 10: Config out-of-range values fall back to defaults**
    - **Validates: Requirements 11.4**
    - File: `app/core/entities/__tests__/hs-classifier.entity.test.js`

  - [ ] 2.9 Implementasi `isValidQuizAnswer(s)` dan `evaluateQuizAnswer(userAnswer, correctCode)`
    - `isValidQuizAnswer`: return `true` jika dan hanya jika `s` match `/^\d{6}$/`
    - `evaluateQuizAnswer`: return `{ status: "correct" | "incorrect", userAnswer, correctCode }`
    - _Requirements: 13.2, 14.1, 14.2, 14.3_

  - [ ]* 2.10 Tulis property test untuk `isValidQuizAnswer` dan `evaluateQuizAnswer`
    - **Property 12: Quiz answer validation matches exactly-6-digits rule**
    - **Validates: Requirements 13.2**
    - **Property 13: Quiz answer evaluation is correct and total**
    - **Validates: Requirements 14.1, 14.2, 14.3**
    - File: `app/core/entities/__tests__/hs-classifier.entity.test.js`

- [ ] 3. Implementasi Port Interface
  - Buat `app/core/ports/hs-tree-loader.port.js` — definisikan interface `HsTreeLoaderPort` dengan JSDoc `@typedef` dan method contract `loadTree(): Promise<{ ok: true, data: HsNode[] } | { ok: false, error: string }>`
  - _Requirements: 6.1_

- [ ] 4. Implementasi HS Tree Loader Service
  - [ ] 4.1 Buat `app/infrastructure/services/hs-tree-loader.service.js` dengan helper stubs
    - Stub: `parseHarmonizedSystemCsv(rawText)`, `parseSectionsCsv(rawText)`, `buildTree(nodes, sectionTitles)` — termasuk helpers `indexByCode`, `attachChildren`, `extractRoots`
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [ ] 4.2 Implementasi `parseHarmonizedSystemCsv(rawText)` dan `parseSectionsCsv(rawText)`
    - `parseHarmonizedSystemCsv`: parse baris CSV → `HsNode[]` flat; handle header mismatch → `{ ok: false }`
    - `parseSectionsCsv`: parse → `Map<sectionCode, title>`
    - _Requirements: 6.1, 6.2_

  - [ ] 4.3 Implementasi `buildTree(nodes, sectionTitles)` — susun flat nodes menjadi tree
    - Gunakan helpers: `indexByCode(nodes)` → Map, `attachChildren(nodeMap)`, `extractRoots(nodeMap)`
    - Section nodes di-generate dari data chapter + sectionTitles map
    - _Requirements: 6.2, 6.5_

  - [ ] 4.4 Implementasi `createHsTreeLoaderService()` dan `loadTree()` dengan in-memory cache
    - Baca dua CSV dari path file konstanta internal menggunakan `fs.readFile`
    - Cache result setelah load pertama; subsequent calls return cached tree
    - Jika file tidak ada → return `{ ok: false, error: "Data HS code tidak tersedia. Hubungi administrator." }`
    - _Requirements: 6.3, 6.4_

  - [ ]* 4.5 Tulis unit tests untuk `hs-tree-loader.service.js`
    - Test: CSV valid → tree dengan relasi parent-child benar
    - Test: CSV tidak ditemukan → `{ ok: false, error: "..." }`
    - Test: CSV malformed (header salah) → `{ ok: false, error: "..." }`
    - Test: cache dipanggil dua kali → `fs.readFile` hanya dipanggil sekali
    - File: `app/infrastructure/services/__tests__/hs-tree-loader.test.js`

- [ ] 5. Checkpoint — Verifikasi data layer
  - Pastikan semua tests di `hs-classifier.entity.test.js` dan `hs-tree-loader.test.js` pass. Tanya user jika ada pertanyaan.

- [ ] 6. Implementasi Classification Engine
  - [ ] 6.1 Buat `app/infrastructure/services/classification-engine.js` dengan helper stubs
    - Stub: `tokenize(text)`, `tokenizeAttributes(attributes)`, `scoreNode(node, attributeTokens)`, `traverseLevel(nodes, attributeTokens, pruningThreshold)`, `classify(attributes)`
    - Definisikan `ATTRIBUTE_WEIGHTS` dan `STOP_WORDS` sebagai konstanta modul
    - _Requirements: 5.2, 5.3, 9.2, 9.3_

  - [ ] 6.2 Implementasi `tokenize(text)` dan `tokenizeAttributes(attributes)`
    - `tokenize`: lowercase, strip punctuation, split whitespace, hapus stop words Bahasa Indonesia+English; return `[]` untuk input null
    - `tokenizeAttributes`: map setiap field `ItemAttributes` ke `WeightedToken[]` menggunakan `ATTRIBUTE_WEIGHTS`
    - _Requirements: 5.4, 5.5_

  - [ ] 6.3 Implementasi `scoreNode(node, attributeTokens)` — weighted token match score
    - Tokenize `node.description`, hitung weighted match antara node tokens dan `attributeTokens`
    - Gunakan helpers: `tokenMatchCount`, `normalizeScore`, `clampScore`
    - Return nilai dalam [0.0, 1.0]
    - _Requirements: 5.4, 5.5_

  - [ ]* 6.4 Tulis property test untuk `scoreNode`
    - **Property 7: Token match score is always in range [0, 1]**
    - **Validates: Requirements 5.4**
    - File: `app/infrastructure/services/__tests__/classification-engine.test.js`

  - [ ] 6.5 Implementasi `traverseLevel(nodes, attributeTokens, pruningThreshold)` dan `classify(attributes)`
    - `traverseLevel`: score semua nodes di satu level, filter dengan `>= pruningThreshold`
    - `classify`: orkestrasi traversal Section→Chapter→Heading→Subheading, build `ReasoningPath`, filter `>= confidenceThreshold`, sort descending
    - _Requirements: 5.1, 5.6, 5.7, 5.8_

  - [ ]* 6.6 Tulis property test untuk `classify`
    - **Property 8: Classification output satisfies all threshold and completeness invariants**
    - **Validates: Requirements 5.1, 5.6, 5.7, 5.8**
    - **Property 9: Classification is deterministic**
    - **Validates: Requirements 9.4**
    - File: `app/infrastructure/services/__tests__/classification-engine.test.js`

  - [ ] 6.7 Implementasi `createClassificationEngine(hsTree, config)` — factory function
    - Return object `{ classify }` dengan engine state (hsTree, config) di-capture via closure
    - _Requirements: 5.1, 11.1_

  - [ ]* 6.8 Tulis unit tests untuk classification engine
    - Test: `classify()` dengan HS tree kecil dan atribut exact match → kandidat ditemukan
    - Test: `classify()` dengan semua atribut null → return `[]` tanpa crash
    - Test: `tokenize("Live horses and asses")` → `["live", "horses", "asses"]`
    - File: `app/infrastructure/services/__tests__/classification-engine.test.js`

- [ ] 7. Implementasi Attribute Extractor Service
  - [ ] 7.1 Buat `app/infrastructure/services/attribute-extractor.service.js` dengan helper stubs
    - Stub: `buildExtractionPrompt(description, history)`, `parseAttributeResponse(responseText)`, `extractAttributes()`, `generateClarificationQuestion()`, `generateQuizDescription()`
    - _Requirements: 3.2, 3.3, 4.6_

  - [ ] 7.2 Implementasi `buildExtractionPrompt(description, history)` dan `parseAttributeResponse(responseText)`
    - `buildExtractionPrompt`: sertakan instruksi eksplisit "Jangan menyarankan kode HS. Tugas Anda hanya mengekstrak atribut." dan conversation history
    - `parseAttributeResponse`: strip markdown code fences (` ```json ... ``` `), parse JSON, jalankan `makeItemAttributes()`
    - _Requirements: 3.3, 3.4, 9.5_

  - [ ]* 7.3 Tulis property test untuk `parseAttributeResponse`
    - **Property 4: Attribute JSON parsing round-trip**
    - **Validates: Requirements 3.4, 3.5**
    - File: `app/infrastructure/services/__tests__/attribute-extractor.test.js`

  - [ ] 7.4 Implementasi `extractAttributes(description, conversationHistory)` dan `generateClarificationQuestion(attributes, conversationHistory)`
    - `extractAttributes`: kirim prompt ke `geminiService.generateContent()`, parse response, return `{ ok, data: ItemAttributes | error }`
    - `generateClarificationQuestion`: kirim prompt klarifikasi ke Gemini, return satu pertanyaan dalam Bahasa Indonesia
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.6_

  - [ ] 7.5 Implementasi `generateQuizDescription()` dan `createAttributeExtractorService(geminiService)`
    - `generateQuizDescription`: prompt Gemini hasilkan deskripsi barang realistis Bahasa Indonesia tanpa petunjuk HS code
    - `createAttributeExtractorService`: factory function, return `{ extractAttributes, generateClarificationQuestion, generateQuizDescription }`
    - _Requirements: 9.1, 12.1, 12.2, 12.3_

  - [ ]* 7.6 Tulis unit tests untuk attribute extractor
    - Test: `parseAttributeResponse` dengan markdown code fence → di-strip dengan benar
    - Test: `parseAttributeResponse` dengan JSON invalid → `{ ok: false }`
    - File: `app/infrastructure/services/__tests__/attribute-extractor.test.js`

- [ ] 8. Implementasi Use Cases
  - [ ] 8.1 Buat `app/core/use-cases/classify-hs-code.js`
    - `createClassifyHsCodeUseCase(deps)`: inject `{ attributeExtractor, hsTreeLoader, config }`
    - `execute({ description, conversationHistory, turnCount })`: validasi description → load tree → ekstrak atribut → cek sufficiency → klarifikasi jika perlu (max 3 turns) → classify → return `ClassifyHsCodeResult`
    - Enforce max 3 turns: jika `turnCount >= 3` selalu classify meskipun atribut tidak cukup
    - _Requirements: 2.2, 3.1, 3.6, 4.3, 4.4, 4.5, 5.1_

  - [ ]* 8.2 Tulis property test untuk `classify-hs-code.js`
    - **Property 6: Max 3 clarification turns is enforced**
    - **Validates: Requirements 4.4, 4.5**
    - File: `app/core/use-cases/__tests__/classify-hs-code.test.js`

  - [ ] 8.3 Buat `app/core/use-cases/generate-quiz-item.js`
    - `createGenerateQuizItemUseCase(deps)`: inject `{ attributeExtractor, hsTreeLoader, config }`
    - `execute()`: generate deskripsi via Gemini → load tree → ekstrak atribut → classify → ambil kandidat teratas sebagai jawaban → return `QuizItem`
    - _Requirements: 12.1, 12.4, 12.5_

  - [ ]* 8.4 Tulis property test untuk `generate-quiz-item.js`
    - **Property 11: Quiz item answer equals top engine candidate**
    - **Validates: Requirements 12.4, 12.5**
    - File: `app/core/use-cases/__tests__/generate-quiz-item.test.js`

- [ ] 9. Checkpoint — Verifikasi core dan infrastructure
  - Pastikan semua tests di entity, use-cases, dan infrastructure pass. Tanya user jika ada pertanyaan.

- [ ] 10. Implementasi Adapters Layer
  - [ ] 10.1 Buat `app/adapters/presenters/hs-classifier.presenter.js`
    - `presentCandidates(candidates)`: transform `HsCandidate[]` → `CandidateViewModel[]` dengan skor dalam persen dan path yang diformat
    - `presentQuizItem(quizItem)`: transform `QuizItem` → `QuizItemViewModel` **tanpa** field `answer` (tidak bocorkan jawaban ke client)
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 12.6_

  - [ ] 10.2 Buat `app/adapters/controllers/hs-classifier.controller.js`
    - `createHsClassifierController(deps)`: inject `{ classifyUseCase, generateQuizItemUseCase }`
    - `handleClassify(requestBody)`: validasi shape body, jalankan use case, return `{ ok, data | errorCode, errorMessage }`
    - `handleGenerateQuiz()`: jalankan use case, gunakan `presentQuizItem()` sebelum return
    - _Requirements: 2.2, 2.3, 8.1, 8.5, 8.6_

- [ ] 11. Implementasi API Routes
  - [ ] 11.1 Buat `app/api/hs-classifier/route.js` — POST `/api/hs-classifier`
    - Wire: `createHsTreeLoaderService()` → `createAttributeExtractorService()` → `createClassifyHsCodeUseCase()` → `createHsClassifierController()`
    - Handle request body parsing, error catching, logging `console.error()` server-side
    - Return `{ ok: false, errorCode: "CLASSIFICATION_FAILED" }` untuk exception yang tidak tertangkap
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

  - [ ] 11.2 Buat `app/api/hs-classifier/quiz/route.js` — POST `/api/hs-classifier/quiz`
    - Wire dependencies yang sama, panggil `handleGenerateQuiz()`
    - Pastikan response tidak mengandung field jawaban (presenter sudah handle ini)
    - _Requirements: 12.1, 12.6_

- [ ] 12. Implementasi UI Components
  - [ ] 12.1 Buat `app/hs-classifier/page.jsx` — Next.js route
    - Import dan render `HsClassifierPage` component
    - Set metadata (title, description) untuk halaman
    - _Requirements: 10.6_

  - [ ] 12.2 Buat `app/presentation/components/features/HsClassifierPage.jsx` — mode selector + root state
    - State: `{ mode: "finder" | "quiz", session: ClassifierSession }`
    - Render mode selector (dua tombol: "Finder" dan "Quiz")
    - Render `HsClassifierFinder` atau `HsClassifierQuiz` berdasarkan mode
    - WHEN mode berganti, reset session ke state idle (candidates=[], turns=[], turnCount=0)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.5, 10.7_

  - [ ]* 12.3 Tulis property test untuk mode switch
    - **Property 1: Mode switch resets session to idle**
    - **Validates: Requirements 1.4**
    - File: `app/presentation/components/features/__tests__/HsClassifierPage.test.jsx`

  - [ ] 12.4 Buat `app/presentation/components/features/HsClassifierFinder.jsx` — finder mode UI
    - Text area input deskripsi dengan placeholder "Contoh: sepatu olahraga berbahan kulit sapi untuk dewasa"
    - Tombol "Klasifikasikan" dan "Mulai Ulang"
    - Loading indicator saat `status = "extracting"` atau `"classifying"`
    - Conversation panel untuk klarifikasi (chat-like) saat `status = "clarifying"`
    - Tampilkan `ItemAttributes` hasil ekstraksi di samping input asli
    - Tampilkan `CandidateViewModel[]` dengan reasoning path per kandidat
    - Validasi description di client-side sebelum fetch (gunakan `validateDescription`)
    - _Requirements: 2.1, 2.3, 2.4, 3.7, 4.1, 4.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.5, 10.1, 10.2, 10.3, 10.4_

  - [ ] 12.5 Buat `app/presentation/components/features/HsClassifierQuiz.jsx` — quiz mode UI
    - Loading state saat generate soal
    - Tampilkan deskripsi Quiz_Item (tanpa jawaban)
    - Input field 6 digit untuk Quiz_Answer + tombol "Cek Jawaban"
    - Tombol "Lihat Jawaban" untuk skip
    - Validasi `isValidQuizAnswer` di client sebelum submit, tampilkan error inline
    - Setelah submit: tampilkan Quiz_Result (correct/incorrect), reasoning path, `ItemAttributes`
    - Tombol "Soal Berikutnya" setelah hasil ditampilkan
    - **JANGAN tampilkan jawaban sebelum user submit atau klik "Lihat Jawaban"**
    - _Requirements: 12.1, 12.6, 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 13. Final Checkpoint — Verifikasi end-to-end
  - Pastikan semua property tests dan unit tests pass
  - Pastikan halaman `/hs-classifier` dapat diakses
  - Pastikan tidak ada console errors di browser
  - Tanya user jika ada pertanyaan sebelum dianggap selesai

## Notes

- Tasks bertanda `*` bersifat opsional dan bisa di-skip untuk MVP lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- **fast-check** wajib diinstall sebelum menulis property tests (Task 1)
- Classification Engine **tidak boleh** memanggil Gemini API — seluruh scoring bersifat deterministik
- `presentQuizItem()` wajib menghapus field `answer` sebelum dikirim ke client (Property 11 bisa bocor jika presenter salah implementasi)
- Gunakan `gemini.service.js` yang sudah ada (`app/infrastructure/services/gemini.service.js`) — jangan buat service Gemini baru
- Semua pesan error user-facing dalam **Bahasa Indonesia** sesuai Error Code Registry di design doc
