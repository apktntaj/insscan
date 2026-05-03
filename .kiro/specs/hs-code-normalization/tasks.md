# Implementation Plan: HS Code Normalization

## Overview

Implementasi dilakukan dalam urutan dari perubahan terkecil dan paling fundamental ke perubahan terbesar. Dimulai dari entity layer (`isValidHsCode`), lalu pure functions baru, lalu komponen UI baru (`FilePreviewTable`), lalu refactor state dan handlers di `HsCodeScanner`, dan terakhir update UI text dan keyboard support.

`fast-check` sudah tersedia di `devDependencies` — tidak perlu install ulang.

## Tasks

- [x] 1. Update `isValidHsCode` di entity layer
  - Modifikasi regex di `app/core/entities/hs-code.js` dari `/^\d{8}$/` menjadi `/^\d{6}$|^\d{8}$/`
  - Update JSDoc: ubah deskripsi dari "8-digit HS code" menjadi "6 atau 8 digit HS code"
  - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 1.1 Tulis unit tests untuk `isValidHsCode` yang diperbarui
    - Test: 6 digit valid → `true`
    - Test: 8 digit valid → `true`
    - Test: 7 digit → `false`
    - Test: 10 digit → `false`
    - Test: string dengan titik (e.g. `"1234.56"`) → `false`
    - Test: `null`, `undefined`, string kosong → `false`
    - Test: number `12345678` → `true`
    - File: `app/core/entities/__tests__/hs-code.test.js`
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 1.2 Tulis property test untuk `isValidHsCode` (Property 1)
    - `// Feature: hs-code-normalization, Property 1: isValidHsCode hanya menerima 6 atau 8 digit`
    - Generator: `fc.string()` untuk input arbitrary, `fc.stringOf(fc.digit(), {minLength: 6, maxLength: 6})` untuk 6-digit valid, `fc.stringOf(fc.digit(), {minLength: 8, maxLength: 8})` untuk 8-digit valid
    - Verifikasi: `isValidHsCode(s)` mengembalikan `true` jika dan hanya jika `s` terdiri dari tepat 6 atau tepat 8 digit
    - Minimum 100 iterasi
    - File: `app/core/entities/__tests__/hs-code.test.js`
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implementasi pure functions: `stripNonDigits` dan `normalizeCode`
  - Tambahkan kedua fungsi sebagai pure functions di luar komponen React di `app/presentation/components/features/HsCodeScanner.jsx`
  - `stripNonDigits(value)`: konversi input ke string, hapus semua karakter non-digit dengan `.replace(/\D/g, "")`, handle `null`/`undefined` dengan fallback ke string kosong
  - `normalizeCode(digits, targetLength)`: jika `digits.length > targetLength` potong dengan `.substring(0, targetLength)`, jika lebih pendek pad dengan `"0".repeat(targetLength - digits.length)`, jika sama kembalikan tanpa perubahan
  - Tambahkan JSDoc dengan `@param`, `@returns`, dan minimal 2 contoh input-output
  - _Requirements: 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.1 Tulis unit tests untuk `stripNonDigits`
    - Test: string campuran `"HS-123456"` → `"123456"`
    - Test: string dengan titik `"1234.56.78"` → `"12345678"`
    - Test: string murni digit → tidak berubah
    - Test: string kosong → `""`
    - Test: `null` → `""`
    - Test: number `12345678` → `"12345678"`
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 5.3_

  - [ ]* 2.2 Tulis property test untuk `stripNonDigits` (Property 5)
    - `// Feature: hs-code-normalization, Property 5: stripNonDigits hanya menghasilkan digit`
    - Generator: `fc.string()` (arbitrary string)
    - Verifikasi: hasil hanya mengandung karakter `[0-9]`, dan semua digit dari input ada di output dalam urutan yang sama
    - Minimum 100 iterasi
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 5.3_

  - [ ]* 2.3 Tulis unit tests untuk `normalizeCode`
    - Test: potong dari kanan — `normalizeCode("1234567890", 8)` → `"12345678"`
    - Test: potong ke 6 — `normalizeCode("12345678", 6)` → `"123456"`
    - Test: pad ke 6 — `normalizeCode("1234", 6)` → `"123400"`
    - Test: pad ke 8 — `normalizeCode("12345", 8)` → `"12345000"`
    - Test: sudah sesuai target 6 → tidak berubah
    - Test: sudah sesuai target 8 → tidak berubah
    - Test: string kosong dengan target 6 → `"000000"`
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 4.3, 4.4, 5.1, 5.2, 5.4_

  - [ ]* 2.4 Tulis property tests untuk `normalizeCode` (Properties 2, 3, 4, 10)
    - `// Feature: hs-code-normalization, Property 2: normalizeCode menghasilkan panjang yang tepat`
      - Generator: `fc.stringOf(fc.digit())`, target `fc.constantFrom(6, 8)`
      - Verifikasi: `normalizeCode(s, t).length === t` selalu berlaku
    - `// Feature: hs-code-normalization, Property 3: normalizeCode mempertahankan prefix untuk kode yang dipotong`
      - Generator: digit string dengan panjang > target
      - Verifikasi: hasil adalah prefix dari input
    - `// Feature: hs-code-normalization, Property 4: normalizeCode menggunakan "0" padding untuk kode yang diperpanjang`
      - Generator: digit string dengan panjang < target
      - Verifikasi: hasil dimulai dengan input asli, diikuti karakter `"0"`
    - `// Feature: hs-code-normalization, Property 10: Normalisasi tidak mengubah kode yang sudah valid`
      - Generator: digit string dengan panjang tepat = target (6 atau 8)
      - Verifikasi: `normalizeCode(s, s.length) === s`
    - Minimum 100 iterasi per property
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 4.3, 4.4, 5.1, 5.2, 5.4_

- [x] 3. Implementasi pure functions: `isNumericColumn`, `parseFileData`, `analyzeFileColumns`
  - Tambahkan semua fungsi sebagai pure functions di `app/presentation/components/features/HsCodeScanner.jsx`
  - `isNumericColumn(cells)`: hitung sel non-kosong, hitung yang mengandung digit, kembalikan `true` jika rasio > 0.5; kembalikan `false` jika tidak ada sel non-kosong
  - `parseFileData(rawRows)`: iterasi setiap baris dan sel, konversi ke `ParsedCell` (`raw`, `digits`, `isEmpty`, `isDirty`), ambil `headers` dari baris pertama, hitung `columnCount` dari baris terpanjang
  - `analyzeFileColumns(parsedData)`: gunakan helper `getColumnCells(rows, colIndex)` dan `classifyColumnCodes(cells)` untuk analisis per kolom; kumpulkan `allValidCodes` dan `allInvalidCodes` dari semua NumericColumn; set `needsNormalization` dan `hasNumericColumns`
  - Tambahkan JSDoc lengkap untuk setiap fungsi
  - _Requirements: 3.1, 3.2, 3.4_

  - [ ]* 3.1 Tulis unit tests untuk `isNumericColumn`
    - Test: >50% numerik → `true`
    - Test: tepat 50% numerik → `false` (threshold adalah >50%, bukan ≥50%)
    - Test: sel kosong diabaikan dari threshold
    - Test: sel dirty (e.g. `"HS-123456"`) dihitung sebagai numerik karena mengandung digit
    - Test: semua sel kosong → `false`
    - Test: 0% numerik → `false`
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 3.1_

  - [ ]* 3.2 Tulis property test untuk `isNumericColumn` (Property 6)
    - `// Feature: hs-code-normalization, Property 6: isNumericColumn konsisten dengan threshold 50%`
    - Generator: `fc.array(fc.string())` dengan kontrol komposisi numerik/non-numerik
    - Verifikasi: hasil konsisten dengan kalkulasi manual `numericCount / nonEmptyCount > 0.5`
    - Minimum 100 iterasi
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 3.1_

  - [ ]* 3.3 Tulis unit tests untuk `parseFileData`
    - Test: baris dengan header dan data biasa → `ParsedCell` yang benar
    - Test: sel dirty `"HS-123456"` → `{ raw: "HS-123456", digits: "123456", isEmpty: false, isDirty: true }`
    - Test: sel kosong (`""`, `null`, `undefined`) → `{ raw: "", digits: "", isEmpty: true, isDirty: false }`
    - Test: `columnCount` adalah lebar baris terpanjang
    - Test: `headers` diambil dari baris pertama
    - Test: array kosong `[]` → `{ rows: [], headers: [], columnCount: 0 }`
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 3.1, 3.4_

  - [ ]* 3.4 Tulis unit tests untuk `analyzeFileColumns`
    - Test: file dengan satu NumericColumn, semua valid → `needsNormalization: false`
    - Test: file dengan kode invalid → `needsNormalization: true`, `allInvalidCodes` terisi
    - Test: NumericColumn di kolom non-pertama (kolom ke-2 atau ke-3) terdeteksi
    - Test: file tanpa NumericColumn → `hasNumericColumns: false`
    - Test: sel dirty di NumericColumn → `hasDirtyCells: true` di `ColumnAnalysis`
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ]* 3.5 Tulis property test untuk `analyzeFileColumns` (Property 7)
    - `// Feature: hs-code-normalization, Property 7: analyzeFileColumns memeriksa semua kolom`
    - Generator: `ParsedFileData` dengan NumericColumn di posisi kolom acak (N bisa berapa saja)
    - Verifikasi: kolom tersebut selalu teridentifikasi sebagai NumericColumn terlepas dari posisinya
    - Minimum 100 iterasi
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 3.4_

- [x] 4. Checkpoint — Pastikan semua tests pure functions lulus
  - Jalankan `npx jest --testPathPattern="hs-code|HsCodeScanner.normalization" --run` dan pastikan semua test hijau sebelum lanjut ke implementasi UI
  - Tanyakan ke user jika ada pertanyaan atau ambiguitas sebelum lanjut.

- [x] 5. Implementasi komponen `FilePreviewTable`
  - Tambahkan sebagai function component di `app/presentation/components/features/HsCodeScanner.jsx`, di luar komponen `HsCodeScanner`
  - Props: `rows` (array `ParsedRow`, maks 10 baris), `headers` (array string), `dirtyColumnIndices` (Set of number)
  - Render tabel HTML dengan `<thead>` dari `headers` dan `<tbody>` dari `rows`
  - Batasi render ke `rows.slice(0, 10)` — tidak lebih dari 10 baris data
  - Highlight sel di kolom yang ada di `dirtyColumnIndices` dengan class visual berbeda (e.g. `bg-amber-50 text-amber-800`)
  - Tampilkan keterangan di bawah tabel: "Sel yang disorot mengandung karakter non-numerik yang akan dihapus otomatis saat proses fetch." (hanya jika ada dirty column)
  - _Requirements: 2.1, 2.2, 2.3, 3.5_

  - [ ]* 5.1 Tulis unit tests untuk `FilePreviewTable`
    - Test: render header dari `headers`
    - Test: render maksimal 10 baris meskipun `rows` lebih dari 10
    - Test: sel di `dirtyColumnIndices` mendapat class highlight
    - Test: keterangan dirty hanya muncul jika ada dirty column
    - Test: tidak render jika `rows` kosong (atau render tabel kosong)
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 2.2, 2.3, 3.5_

  - [ ]* 5.2 Tulis property test untuk `FilePreviewTable` (Property 8)
    - `// Feature: hs-code-normalization, Property 8: Preview menampilkan maksimal 10 baris`
    - Generator: `ParsedFileData` dengan N baris acak (N ≥ 0), render dengan `@testing-library/react`
    - Verifikasi: jumlah `<tr>` di `<tbody>` selalu `Math.min(N, 10)`
    - Minimum 100 iterasi
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 2.2_

- [x] 6. Refactor state dan handlers di `HsCodeScanner`
  - Ganti state `normalizationDialog` (boolean) dan `pendingNormalization` (object) dengan:
    - `fileAnalysis` (`FileAnalysisResult | null`) — hasil `analyzeFileColumns`
    - `normalizationStatus` (`"idle" | "needed" | "done" | "skipped"`) — state machine normalisasi
    - `readyToFetchCodes` (`string[]`) — kode yang siap dikirim ke `proceedWithFetch`
  - Update `handleFileChange`: setelah `setFileData(jsonData)`, langsung jalankan `parseFileData` → `analyzeFileColumns`, set `fileAnalysis`, set `normalizationStatus` ke `"needed"` jika `needsNormalization`, atau `"skipped"` jika semua valid atau tidak ada NumericColumn
  - Update `handleFetchData`: gunakan `readyToFetchCodes` langsung (tidak lagi jalankan `extractAndValidateHsCodes`), guard dengan `normalizationStatus === "done" || normalizationStatus === "skipped"`
  - Tambahkan handler `handleNormalizationConfirm(targetDigits)`: normalisasi `fileAnalysis.allInvalidCodes` dengan `normalizeCode`, gabungkan dengan `fileAnalysis.allValidCodes`, set `readyToFetchCodes`, set `normalizationStatus` ke `"done"`
  - Tambahkan handler `handleNormalizationCancel`: set `normalizationStatus` ke `"needed"` (dialog tutup, tombol tetap disabled)
  - Reset semua state normalisasi ke `"idle"` saat file baru diupload
  - Update disabled condition tombol "Tarik Data": `isLoading || !fileData || (normalizationStatus !== "done" && normalizationStatus !== "skipped")`
  - Pindahkan render `NormalizationDialog` dari dalam `ProgressPanel` ke level root komponen `HsCodeScanner` (sejajar dengan `ProgressPanel` dan `HsCodeTable`)
  - Hapus fungsi `extractHsCodes` dan `extractAndValidateHsCodes` yang sudah tidak dipakai
  - _Requirements: 2.1, 3.2, 3.3, 4.1, 4.5, 4.6, 4.7, 4.8_

- [x] 7. Update `NormalizationDialog` — pesan dan keyboard support
  - Update teks pesan dari "lebih dari 8 digit" menjadi "panjang digitnya bukan 6 dan bukan 8"
  - Tambahkan `useEffect` atau `onKeyDown` handler di level dialog: `Escape` → panggil `onCancel`, `Enter` → konfirmasi tombol yang sedang difokus
  - Tambahkan `autoFocus` pada tombol "Normalisasi ke 6 Digit" (tombol pertama) saat dialog muncul
  - _Requirements: 4.2, 4.9_

  - [ ]* 7.1 Tulis unit tests untuk `NormalizationDialog`
    - Test: render dengan `codeCount` yang benar
    - Test: tekan `Escape` → `onCancel` dipanggil
    - Test: tekan `Enter` saat tombol 6-digit difokus → `onConfirm6Digits` dipanggil
    - Test: klik tombol "Batal" → `onCancel` dipanggil
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 4.2, 4.9_

  - [ ]* 7.2 Tulis property test untuk `NormalizationDialog` (Property 9)
    - `// Feature: hs-code-normalization, Property 9: Jumlah kode invalid yang dilaporkan akurat`
    - Generator: `fc.integer({ min: 0, max: 1000 })` sebagai `codeCount`
    - Verifikasi: angka yang dirender di dialog sama persis dengan `codeCount` yang diterima sebagai prop
    - Minimum 100 iterasi
    - File: `app/presentation/components/features/__tests__/HsCodeScanner.normalization.test.jsx`
    - _Requirements: 4.2_

- [x] 8. Tambahkan `FilePreviewTable` ke render tree `HsCodeScanner` dan update UI text
  - Render `FilePreviewTable` di mode file setelah input file dan sebelum `ProgressPanel`, hanya jika `fileData` tidak null
  - Kirim props: `rows={parsedData.rows.slice(0, 10)}`, `headers={parsedData.headers}`, `dirtyColumnIndices` (set index kolom yang `hasDirtyCells === true` dari `fileAnalysis`)
  - Tampilkan pesan "Tidak ada kolom HS code yang terdeteksi" jika `fileAnalysis?.hasNumericColumns === false`
  - Update teks deskripsi di mode Single Input: ubah "HS code 8 digit" menjadi "HS code 6 atau 8 digit"
  - Update alert message di `handleSingleFetch`: ubah `"Masukkan HS code 8 digit yang valid."` menjadi `"Masukkan HS code 6 atau 8 digit yang valid."`
  - Update teks deskripsi di mode File: ubah "HS code 8 digit" menjadi "HS code 6 atau 8 digit"
  - _Requirements: 1.4, 1.5, 2.1, 2.4, 2.5, 3.3, 3.5_

- [ ] 9. Checkpoint final — Pastikan semua tests lulus
  - Jalankan `npx jest --run` dan pastikan semua test suite hijau
  - Verifikasi tidak ada TypeScript/ESLint error dengan `npm run lint`
  - Tanyakan ke user jika ada pertanyaan atau ambiguitas sebelum dianggap selesai.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- `fast-check` sudah tersedia di `devDependencies` — tidak perlu install
- Setiap property test harus diberi tag komentar `// Feature: hs-code-normalization, Property N: <property_text>`
- Minimum 100 iterasi per property test (default fast-check sudah 100, tidak perlu konfigurasi tambahan)
- `NormalizationDialog` dipindahkan dari dalam `ProgressPanel` ke root `HsCodeScanner` — ini penting agar dialog tidak bergantung pada state `progress.total > 0`
- `normalizationStatus` adalah state machine: `idle` → `needed`/`skipped` (saat file diupload) → `done` (saat user konfirmasi) atau kembali ke `needed` (saat user batal)
- Tombol "Tarik Data" aktif hanya jika `normalizationStatus === "done" || normalizationStatus === "skipped"`
