# Implementation Plan: HS Finder

## Overview

Implementasi HS Finder mengikuti dependency flow dari dalam ke luar: entities → infrastructure → use case → adapter → API → UI. Knowledge base (file `.md` catatan bab) disiapkan secara paralel — sistem harus bisa berjalan bahkan dengan knowledge base kosong.

## Tasks

- [-] 1. Buat struktur direktori knowledge base
  - Buat direktori `harmonized-system/chapters/`
  - Buat file `harmonized-system/chapters/README.md` berisi panduan format ChapterNote
  - _Requirements: 9.1, 9.3_

- [x] 2. Generate draft ChapterNote via Gemini
  - Generate draft file `.md` untuk minimal 10 bab prioritas menggunakan Gemini
  - Bab prioritas awal: 01, 02, 03, 04, 05, 39, 72, 84, 85, 87
  - Format setiap file mengikuti struktur yang ditetapkan di design doc: judul, lingkup umum, catatan bab, catatan subpos, pengecualian penting, contoh klasifikasi
  - Tandai setiap file dengan komentar `<!-- DRAFT: belum divalidasi terhadap BTKI -->` di bagian atas
  - _Requirements: 9.1, 9.3, 9.4_

- [x] 3. Implementasi Core Entities
  - Buat `app/core/entities/hs-finder.js` dengan semua `@typedef`
  - Implementasi `makeItemDescription(text, source)` — validasi panjang min 3 / maks 2000, trim whitespace
  - Implementasi `makeClassificationResult(raw)` — validasi hsCode 6 digit, reasoningPath 5 langkah
  - Implementasi `makeCoverageMap(candidateChapters, loadedChapterNumbers)`
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 4.2, 5.2, 5.4_

- [x] 4. Implementasi Port Interface
  - Buat `app/core/ports/chapter-note-loader.port.js` — definisikan interface dengan JSDoc
  - Method contracts: `loadChapters(chapterNumbers)` dan `listAvailableChapters()`
  - _Requirements: 9.2_

- [x] 5. Implementasi Chapter Note Loader Service
  - Buat `app/infrastructure/services/chapter-note-loader.service.js`
  - Implementasi helper `readChapterFile(chapterNumber)` — baca satu `.md`, parse judul dari heading `# Bab {nn}`
  - Implementasi `loadChapters(chapterNumbers)` — load semua file yang diminta, skip yang tidak ada dengan graceful
  - Implementasi `listAvailableChapters()` — scan direktori, kembalikan daftar nomor bab yang tersedia
  - Tambahkan in-memory cache: file yang sudah dibaca tidak perlu dibaca ulang
  - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.4_

- [x] 6. Implementasi HS Finder Gemini Service
  - Buat `app/infrastructure/services/hs-finder-gemini.service.js`
  - Implementasi helper `buildPhotoIdentificationPrompt()` — prompt Bahasa Indonesia untuk identifikasi barang dari foto
  - Implementasi `identifyFromPhoto(imageBase64, mimeType)` — Gemini Vision call, timeout 30 detik
  - Implementasi helper `parseChapterListResponse(responseText)` — strip code fences, parse JSON array, potong ke maks 5
  - Implementasi `identifyCandidateChapters(itemDescription)` — Gemini call, kembalikan array nomor bab
  - Implementasi helper `buildClassificationPrompt(itemDescription, chapterNotes, coverageMap)` — prompt lengkap dengan semua catatan bab dan instruksi kutip aturan
  - Implementasi helper `parseClassificationResponse(responseText)` — strip code fences, parse JSON, jalankan `makeClassificationResult()`
  - Implementasi `classifyWithNotes(itemDescription, chapterNotes, coverageMap)` — single LLM call, timeout 30 detik
  - Implementasi `createHsFinderGeminiService(geminiApiKey)` — factory function
  - _Requirements: 2.5, 3.1, 4.4, 5.1, 5.6, 8.1, 8.2, 8.3, 8.4_

- [x] 7. Implementasi Use Case
  - Buat `app/core/use-cases/find-hs-code.js`
  - Implementasi `createFindHsCodeUseCase({ hsFinderGeminiService, chapterNoteLoader })`
  - Implementasi `execute({ itemDescription })`:
    1. Identifikasi kandidat bab via `identifyCandidateChapters`
    2. Load chapter notes via `loadChapters`
    3. Klasifikasi via `classifyWithNotes`
  - Handle semua error dari setiap langkah dengan errorCode dan errorMessage yang sesuai Error Registry
  - _Requirements: 3.1, 3.2, 3.4, 4.1, 4.3, 4.4, 5.1_

- [x] 8. Implementasi Adapters Layer
  - Buat `app/adapters/presenters/hs-finder.presenter.js`
    - Implementasi `presentClassificationResult(result)` — format hsCode dengan titik, label coverage status dalam Bahasa Indonesia
  - Buat `app/adapters/controllers/hs-finder.controller.js`
    - Implementasi `handleFindHsCode(requestBody)` — validasi body, bangun `ItemDescription`, jalankan use case
    - Implementasi `handleIdentifyPhoto(requestBody)` — validasi foto (format + ukuran), kirim ke Gemini Vision
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.3_

- [x] 9. Implementasi API Route
  - Buat `app/api/hs-finder/route.js` — POST `/api/hs-finder`
    - Wire semua dependencies: `createChapterNoteLoaderService()` → `createHsFinderGeminiService()` → `createFindHsCodeUseCase()` → `createHsFinderController()`
    - Handle dua aksi: `action: "find"` (klasifikasi teks) dan `action: "identify_photo"` (identifikasi foto)
    - Log error teknis server-side dengan `console.error()`, jangan kirim ke client
  - _Requirements: 8.5, 8.6_

- [ ] 10. Implementasi UI Components
  - Buat `app/hs-finder/page.jsx` — Next.js route, set metadata halaman
  - Buat `app/presentation/components/features/HsFinderPage.jsx` — root component
    - State: `FinderSession`
    - Render `TextInputPanel` dan `PhotoInputPanel` secara bersamaan (bukan pilih mode)
    - Render `LoadingPanel` saat status bukan `idle` atau `done` atau `error`
    - Render `ResultPanel` saat `status === "done"`
  - Buat `app/presentation/components/features/hs-finder/TextInputPanel.jsx`
    - Textarea dengan placeholder, counter karakter, validasi inline
    - Tombol "Cari HS Code"
  - Buat `app/presentation/components/features/hs-finder/PhotoInputPanel.jsx`
    - Drag-and-drop + click to upload
    - Preview foto setelah upload
    - Tampilkan `ItemDescription` hasil identifikasi dengan field yang bisa diedit
    - Tombol "Gunakan Deskripsi Ini" untuk lanjut ke klasifikasi
  - Buat `app/presentation/components/features/hs-finder/LoadingPanel.jsx`
    - Label status yang berubah sesuai `FinderStatus`: "Mengidentifikasi barang...", "Mengidentifikasi bab HS...", dll
    - Spinner/loading indicator
  - Buat `app/presentation/components/features/hs-finder/ResultPanel.jsx`
    - Tampilkan HS code besar + deskripsi
    - Disclaimer jika ada bab `unvalidated`
    - Tampilkan `ReasoningPath` sebagai accordion (expand/collapse per langkah)
    - Badge "Tervalidasi" (hijau) / "Belum Tervalidasi" (kuning) per langkah yang mengutip aturan
    - Tombol "Cari Ulang"
  - _Requirements: 2.6, 2.7, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 11. Tambahkan link ke navigasi
  - Update `app/presentation/config/nav-links.js` untuk menambahkan `/hs-finder`
  - _Requirements: 10.1_

- [ ] 12. Verifikasi end-to-end
  - Pastikan halaman `/hs-finder` dapat diakses
  - Test alur input teks: deskripsi sederhana → kandidat bab → load notes → klasifikasi → tampilkan reasoning
  - Test alur input foto: upload foto → tampilkan deskripsi → edit → klasifikasi
  - Test dengan knowledge base kosong: sistem berjalan dengan disclaimer
  - Pastikan tidak ada console errors di browser

## Notes

- Task 2 (generate draft ChapterNote) bisa dikerjakan secara bertahap — sistem harus bisa berjalan dengan 0 file `.md`
- Gemini service baru (`hs-finder-gemini.service.js`) terpisah dari `gemini.service.js` yang sudah ada — jangan modifikasi service yang lama
- Timeout untuk HS Finder adalah 30 detik (lebih lama dari BL extractor yang 10 detik) karena prompt klasifikasi lebih panjang
- Format hsCode di UI menggunakan titik sebagai pemisah: `8471.30`, bukan `847130`
- Semua pesan error user-facing dalam Bahasa Indonesia sesuai Error Registry di design doc
