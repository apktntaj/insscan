# Implementation Plan: Cek Lartas Architecture Refactor

## Overview

Refactoring arsitektur modul Cek Lartas mengikuti prinsip HtDP — data shapes didefinisikan
dulu, lalu fungsi dibangun di atasnya, satu lapisan per satu. Urutan task mengikuti dependency
secara ketat: tidak ada implementasi use case sebelum types tersedia, tidak ada Server Action
sebelum use case siap, tidak ada update hooks sebelum Server Action bisa dipanggil.

Bahasa implementasi: **TypeScript** untuk semua file baru di `core/cek-lartas/` dan
`app/cek-lartas/actions.ts`. File yang sudah ada di `app/` dipertahankan dalam JavaScript
kecuali disebutkan sebaliknya.

## Tasks

- [ ] 1. Setup TypeScript config dan path alias `@core/*`
  - Buat `tsconfig.json` di root project dengan `strict: true`, `baseUrl: "."`, dan
    `paths: { "@core/*": ["core/*"] }` — sesuai Persyaratan 1.2 dan 6.2
  - Pastikan compiler mencakup folder `core/` dan tidak mencakup `node_modules/`
  - Update `jest.config.js`: tambahkan `moduleNameMapper` untuk `@core/(.*)` → `<rootDir>/core/$1`
    dan tambahkan transformer untuk `.ts` menggunakan `babel-jest` dengan `@babel/preset-typescript`
    (atau `ts-jest` jika tersedia) — sesuai Persyaratan 9.6
  - Verifikasi `npx tsc --noEmit` dan `npx jest core/` berjalan tanpa error setelah setup
  - _Requirements: 1.2, 1.4, 6.2, 9.6_

- [ ] 2. Buat `core/cek-lartas/types.ts` — semua data shapes
  - Buat direktori `core/cek-lartas/` di root project
  - Definisikan dan ekspor type `HsCode` sebagai pure value object dengan field
    `readonly code: string` — _Requirements: 2.1_
  - Definisikan dan ekspor type `KategoriLartas` sebagai string union
    `"border" | "post-border" | "ekspor"` — _Requirements: 2.3_
  - Definisikan dan ekspor type `LartasDetail` dengan field: `namaIzin: string` (wajib),
    dan `kodeIzin`, `noSkep`, `idDokumen`, `dokumenPabean`, `tanggalMulai`, `tanggalAkhir`,
    `link` semua bertipe `string | null` atau `string[] | null` — _Requirements: 2.4_
  - Definisikan dan ekspor type `Tarif` dengan field `bm`, `ppn`, `pph`, `pphNonApi`
    semua bertipe `string | null` — _Requirements: 2.5_
  - Definisikan dan ekspor type `Lartas` dengan field `hsCode: HsCode`, `tarif: Tarif`,
    dan `regulasi: Map<KategoriLartas, LartasDetail[]>` — _Requirements: 2.2_
  - Definisikan dan ekspor type `RawInsw` dengan semua field optional (`?`) dan
    index signature `[key: string]: unknown` — _Requirements: 4.6_
  - Definisikan dan ekspor generic type `Result<T>` sebagai discriminated union
    `{ ok: true; data: T } | { ok: false; error: string }` — _Requirements: 3.4_
  - Jalankan `npx tsc --noEmit` — pastikan zero errors dalam strict mode
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.6, 6.1, 6.3, 6.5_

- [ ] 3. Buat `core/cek-lartas/ports.ts` — HsCodeGateway interface
  - Buat file `core/cek-lartas/ports.ts`
  - Definisikan dan ekspor interface `HsCodeGateway` dengan satu method:
    `fetchByCode(code: HsCode): Promise<RawInsw | null>` — menerima `HsCode`, bukan `string`
  - Import `HsCode` dan `RawInsw` dari `./types`
  - Pastikan tidak ada implementasi di file ini — hanya interface
  - _Requirements: 4.5, 6.6_

- [ ] 4. Buat `core/cek-lartas/hs-code.ts` — factory dan pure helpers
  - Buat file `core/cek-lartas/hs-code.ts`
  - Implementasikan dan ekspor `isValidHsCode(value: string): boolean` — validasi format
    2/4/6/8 digit numerik menggunakan regex `/^\d{2}$|^\d{4}$|^\d{6}$|^\d{8}$/` — _Requirements: 3.7_
  - Implementasikan dan ekspor `makeHsCode(code: string): Result<HsCode>` — factory yang
    mengembalikan `{ ok: true, data: { code } }` jika format valid, atau
    `{ ok: false, error: "HS code harus 2, 4, 6, atau 8 digit numerik; diterima: \"...\""}`
    jika tidak valid — tidak pernah throw — _Requirements: 3.2, 3.3, 3.4_
  - Implementasikan dan ekspor `formatHsCode(code: string): string` — format 8 digit menjadi
    `XXXX.XX.XX`, input bukan 8 digit dikembalikan apa adanya — _Requirements: 3.8_
  - Implementasikan dan ekspor `hasLartas(lartas: Lartas): boolean` — cek apakah ada minimal
    satu entry di `regulasi` Map dengan array non-kosong — _Requirements: 3.5_
  - Implementasikan dan ekspor `getLartasByKategori(lartas: Lartas, kategori: KategoriLartas): LartasDetail[]`
    — kembalikan `lartas.regulasi.get(kategori) ?? []`, tidak pernah throw — _Requirements: 3.6_
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.4_

- [ ] 5. Buat `core/cek-lartas/boundary.ts` — parseInswResponse dan helpers
  - Buat file `core/cek-lartas/boundary.ts`
  - Implementasikan helper `normalizeTarifField(value: unknown): string | null` — konversi
    `null`, `undefined`, `""`, `"N/A"`, `"tidak ada data"`, dan whitespace-only string ke `null`
  - Implementasikan helper `parseLartasDetail(raw: unknown): LartasDetail | null` — parse satu
    entri detail dari `unknown`, kembalikan `null` jika `namaIzin` tidak ada
  - Implementasikan helper `parseDetailArray(raw: unknown): LartasDetail[]` — pastikan input
    adalah array, filter null, kembalikan `[]` jika bukan array
  - Implementasikan helper `buildRegulasiMap(borderDetails, postBorderDetails, eksporDetails): Map<KategoriLartas, LartasDetail[]>` — masukkan ke Map hanya kategori yang punya detail non-kosong
  - Implementasikan dan ekspor `parseInswResponse(raw: unknown, hsCode: HsCode): Result<Lartas>` —
    satu-satunya titik masuk data INSW ke core; tolak non-objek dengan `{ ok: false }`;
    normalisasi tarif; bangun regulasi Map; tidak pernah throw — _Requirements: 5.1–5.7_
  - File ini adalah pure module — tidak ada import dari `app/`, tidak ada side effects
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 6. Buat `core/cek-lartas/use-cases/fetch-lartas.ts` — fetchSingle dan fetchMultiple
  - Buat direktori `core/cek-lartas/use-cases/`
  - Buat file `core/cek-lartas/use-cases/fetch-lartas.ts`
  - Implementasikan dan ekspor `fetchSingle(hsCode: HsCode, gateway: HsCodeGateway): Promise<Lartas>` —
    panggil `gateway.fetchByCode(hsCode)`, jika null kembalikan Lartas kosong (tarif semua null,
    Map kosong); jika ada data panggil `parseInswResponse`; tidak ada delay atau retry — _Requirements: 4.3_
  - Implementasikan dan ekspor `fetchMultiple(hsCodes: HsCode[], gateway: HsCodeGateway): Promise<Lartas[]>` —
    dedup kode unik menggunakan Map/cache, panggil `fetchSingle` per kode unik, petakan kembali
    ke urutan input asal termasuk duplikat; tidak ada delay, retry, atau concurrency logic — _Requirements: 4.4_
  - Use case tidak membaca environment variables apapun — _Requirements: 4.2_
  - Use case tidak menginstansiasi gateway sendiri — menerima via parameter — _Requirements: 4.1_
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.1, 6.8_

- [ ] 7. Update `app/infrastructure/services/insw-api.service.js` — implementasi HsCodeGateway
  - Update `inswApiGateway` plain object agar `fetchByCode` menerima `HsCode` (bukan `string`),
    lakukan ekstraksi `code.code` sebelum memanggil fungsi internal `fetchByCode(hsCode)` yang ada
  - Pastikan `inswApiGateway` memenuhi interface `HsCodeGateway` dari `@core/cek-lartas/ports`
  - Hapus export yang tidak digunakan setelah refactor (`fetchCmsSearchByKeyword`,
    `fetchCmsDetailWithSearch`) dari public API — biarkan sebagai internal functions
  - Tidak ada perubahan pada logika fetching, auth, atau fallback endpoint
  - _Requirements: 4.7_

- [ ] 8. Buat `app/cek-lartas/actions.ts` — Server Actions
  - Buat file `app/cek-lartas/actions.ts` dengan directive `"use server"` di baris pertama
  - Import `makeHsCode`, `isValidHsCode` dari `@core/cek-lartas/hs-code`
  - Import `fetchSingle`, `fetchMultiple` dari `@core/cek-lartas/use-cases/fetch-lartas`
  - Import `inswApiGateway` dari `../infrastructure/services/insw-api.service`
  - Import `toLartasViewModel` dari `../adapters/presenters/hs-code.presenter`
  - Implementasikan dan ekspor `fetchLartas(hsCodeStr: string): Promise<Result<LartasViewModel>>` —
    validasi input dengan `makeHsCode`, panggil `fetchSingle`, konversi hasil dengan
    `toLartasViewModel`, kembalikan plain object serializable — _Requirements: 7.4, 7.6_
  - Implementasikan dan ekspor `fetchLartasBatch(hsCodeStrings: string[]): Promise<LartasViewModel[]>` —
    filter input invalid dengan `isValidHsCode`, buat `HsCode[]` via `makeHsCode`, panggil
    `fetchMultiple`, map hasil dengan `toLartasViewModel`, kembalikan sebagai array —
    tidak menggunakan streaming — _Requirements: 7.4, 7.5, 7.7_
  - Streaming dihilangkan sepenuhnya — single async call — _Requirements: 7.7_
  - _Requirements: 7.4, 7.5, 7.6, 7.7_

- [ ] 9. Update `app/adapters/presenters/hs-code.presenter.js` — tambah toLartasViewModel
  - Tambahkan fungsi `toLartasViewModel(lartas)` yang mengkonversi tipe `Lartas` dari core ke
    `LartasViewModel` untuk UI: extract `lartas.hsCode.code`, flatten `lartas.tarif.*`,
    derive boolean flags `hasLartasBorder/PostBorder/Export` dari `regulasi.has(kategori)`,
    extract array details dari `regulasi.get(kategori) ?? []` — _Requirements: 7.8_
  - Pertahankan semua fungsi yang sudah ada (`toResultRow`, `toExcelRow`, `toResultData`,
    `parseHsCodeApiResponse`, dll.) agar tidak ada regresi di modul lain
  - `toLartasViewModel` adalah thin adapter — tidak ada logika bisnis di dalamnya
  - _Requirements: 7.8_

- [ ] 10. Update `useCekLartasSingle.js` dan `useCekLartasFile.js` — panggil Server Actions
  - [ ] 10.1 Update `app/presentation/hooks/useCekLartasSingle.js`
    - Hapus fungsi `fetchSingleHsCode` yang melakukan `fetch("/api/hs-code", ...)`
    - Import `fetchLartas` dari `../../cek-lartas/actions`
    - Ganti pemanggilan `fetchSingleHsCode` dengan `fetchLartas(normalized)` langsung
    - Result shape dari Server Action sama (`{ ok: true, data: LartasViewModel }` atau
      `{ ok: false, error: string }`) sehingga logika state update tidak perlu berubah
    - Pertahankan semua state, handler, dan Excel export yang sudah ada
    - _Requirements: 7.6_
  - [ ] 10.2 Update `app/presentation/hooks/useCekLartasFile.js`
    - Hapus semua kode terkait streaming: `consumeProgressStream`, adaptive chunking,
      loop `while (processedGlobal < total)`, dan `fetch("/api/hs-code/progress", ...)`
    - Import `fetchLartasBatch` dari `../../cek-lartas/actions`
    - Sederhanakan `handleFetch` menjadi single call:
      extract HS codes, filter valid, panggil `fetchLartasBatch(hsCodes)`, set `resultData`
    - Pertahankan logika `handleFileChange`, `handleExportResult`, `useQueryLimit`, dan
      state management yang tidak terkait streaming
    - Progress state bisa disederhanakan (tidak ada lagi `etaRemainingMs`, `chunkSize`, dll.)
    - _Requirements: 7.5, 7.7_
  - _Requirements: 7.5, 7.6_

- [ ] 11. Hapus route files dan controller yang sudah tidak dipakai
  - Hapus `app/api/hs-code/route.js` — digantikan oleh Server Action `fetchLartas`
  - Hapus `app/api/hs-code/progress/route.js` — digantikan oleh Server Action `fetchLartasBatch`
  - Hapus `app/adapters/controllers/hs-code.controller.js` — tidak relevan di App Router
  - Verifikasi tidak ada import yang masih merujuk ke file-file tersebut di seluruh codebase
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 12. Checkpoint — verifikasi integrasi end-to-end
  - Pastikan semua tests yang sudah ada di `app/core/use-cases/__tests__/` dan
    `app/core/entities/__tests__/` tetap lulus tanpa modifikasi
  - Jalankan `npx jest` untuk memastikan tidak ada regresi — _Requirements: 7.9_
  - Pastikan tidak ada TypeScript errors: `npx tsc --noEmit`
  - Pastikan semua import menggunakan alias `@core/*` bukan path relatif yang melintasi batas layer
  - Tanyakan ke user jika ada yang tidak jelas sebelum lanjut ke tests.

- [ ] 13. Pindahkan test files yang ada ke lokasi yang sesuai
  - Pindahkan `app/core/use-cases/__tests__/fetch-hs-code-data.test.js` ke
    `core/cek-lartas/__tests__/fetch-hs-code-data.legacy.test.js` (rename agar tidak konflik
    dengan test baru)
  - Update import di file test tersebut agar menunjuk ke lokasi baru setelah entitas dipindah
  - Pastikan test yang dipindah masih lulus
  - _Requirements: 7.9_

- [ ] 14. Buat unit tests untuk `core/cek-lartas/`
  - [ ] 14.1 Buat `core/cek-lartas/__tests__/hs-code.test.ts`
    - Test `makeHsCode` dengan input valid: 2, 4, 6, 8 digit numerik — expect `ok: true`
    - Test `makeHsCode` dengan input tidak valid: 1, 3, 5, 7, 9 digit — expect `ok: false`
    - Test `makeHsCode` dengan string kosong, huruf, titik, mixed — expect `ok: false`
    - Test `isValidHsCode("84713090")` → `true`; `isValidHsCode("8471309")` → `false`
    - Test `formatHsCode("84713090")` → `"8471.30.90"`;
      `formatHsCode("8471")` → `"8471"` (passthrough)
    - Test `hasLartas` dengan Map berisi entry non-kosong → `true`
    - Test `hasLartas` dengan Map kosong → `false`
    - Test `getLartasByKategori` untuk kategori yang ada → array data
    - Test `getLartasByKategori` untuk kategori yang tidak ada di Map → `[]`
    - _Requirements: 9.1, 9.3_
  - [ ] 14.2 Buat `core/cek-lartas/__tests__/boundary.test.ts`
    - Test input valid lengkap → `{ ok: true, data: Lartas }` dengan struktur yang benar
    - Test input `null` → `{ ok: false }`
    - Test input `string` → `{ ok: false }`
    - Test input `array` → `{ ok: false }`
    - Test normalisasi: field `"N/A"`, `""`, `"tidak ada data"`, `undefined` → `null` di Tarif
    - Test konversi: `lartasBorderDetails` non-kosong → Map punya entry `"border"` dengan data
    - Test konversi: semua details kosong → Map kosong
    - Test bahwa `namaIzin` wajib ada di LartasDetail — entry tanpa namaIzin di-skip
    - _Requirements: 9.2_
  - [ ] 14.3 Buat `core/cek-lartas/__tests__/fetch-lartas.test.ts`
    - Mock gateway yang mengembalikan RawInsw valid → `fetchSingle` return Lartas terisi
    - Mock gateway yang mengembalikan `null` → `fetchSingle` return Lartas kosong
      (tarif semua null, Map kosong) — _Requirements: 9.4_
    - Test `fetchMultiple` dengan duplikat: mock gateway dipanggil sekali per kode unik
      (gunakan jest spy untuk verifikasi jumlah panggilan)
    - Test `fetchMultiple` dengan array kosong → `[]`
    - _Requirements: 9.4_
  - _Requirements: 9.1, 9.2, 9.4, 9.6, 9.7_

- [ ] 15. Buat property tests untuk `core/cek-lartas/`
  - [ ]* 15.1 Buat `core/cek-lartas/__tests__/hs-code.property.test.ts`
    - **Property 1: `makeHsCode` menerima tepat format 2/4/6/8 digit**
    - Gunakan `fc.string()` — untuk setiap string, `result.ok === isValidFormat` harus selalu sama
    - Konfigurasi: `{ numRuns: 100 }`
    - **Validates: Requirements 3.3, 3.4**
  - [ ]* 15.2 Buat sub-test di file yang sama untuk Property 6
    - **Property 6: `hasLartas` konsisten dengan `regulasi` Map**
    - Buat arbitrary `lartasArbitrary` menggunakan `fc.record` dengan `fc.map` untuk regulasi
    - Untuk setiap Lartas, `hasLartas(lartas) === [...lartas.regulasi.values()].some(arr => arr.length > 0)`
    - **Validates: Requirements 3.5**
  - [ ]* 15.3 Buat sub-test di file yang sama untuk Property 7
    - **Property 7: `getLartasByKategori` tidak pernah throw**
    - Untuk setiap Lartas dan setiap KategoriLartas, `Array.isArray(getLartasByKategori(lartas, k))` selalu `true`
    - **Validates: Requirements 3.6**
  - [ ]* 15.4 Buat `core/cek-lartas/__tests__/boundary.property.test.ts`
    - **Property 2: `parseInswResponse` menerima semua RawInsw yang valid**
    - Buat arbitrary `rawInswArbitrary` — plain object dengan field yang minimal valid
    - Untuk setiap rawInsw, `parseInswResponse(raw, { code: "84713090" }).ok === true`
    - **Validates: Requirements 5.3**
  - [ ]* 15.5 Buat sub-test di file yang sama untuk Property 3
    - **Property 3: `parseInswResponse` menolak semua input non-objek**
    - Gunakan `fc.oneof(fc.constant(null), fc.string(), fc.integer(), fc.boolean(), fc.array(fc.anything()))`
    - Untuk setiap non-objek, `parseInswResponse(nonObject, ...).ok === false`
    - **Validates: Requirements 5.4**
  - [ ]* 15.6 Buat sub-test di file yang sama untuk Property 4
    - **Property 4: Normalisasi nilai "kosong" ke null**
    - Untuk setiap RawInsw di mana field tarif berisi salah satu dari `[null, "", "N/A", "tidak ada data"]`,
      semua field Tarif di hasil `parseInswResponse` harus `null`
    - **Validates: Requirements 5.5**
  - [ ]* 15.7 Buat sub-test di file yang sama untuk Property 5 (round-trip)
    - **Property 5: Round-trip parse — serialisasi-deserialisasi ekivalen**
    - Untuk setiap valid RawInsw: parse → serialize kembali ke RawInsw flat → parse lagi →
      hasil kedua harus ekivalen dengan hasil pertama
    - Ini adalah property paling penting — memverifikasi `parseInswResponse` deterministik
    - **Validates: Requirements 5.8, 9.5**
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 5.3, 5.4, 5.5, 5.8, 9.5_

- [ ] 16. Checkpoint — pastikan semua tests lulus
  - Jalankan `npx jest core/ --runInBand` — semua unit tests dan property tests harus hijau
  - Jalankan `npx jest` — tidak ada regresi di tests yang sudah ada
  - Jalankan `npx tsc --noEmit` — zero TypeScript errors
  - Tanyakan ke user jika ada yang tidak jelas sebelum lanjut ke dokumentasi.

- [ ] 17. Buat `docs/architecture/cek-lartas-refactor.md` — narasi perubahan
  - Buat direktori `docs/architecture/` jika belum ada
  - Buat file `docs/architecture/cek-lartas-refactor.md` dalam Bahasa Indonesia
  - Tulis bagian **Masalah Sebelumnya** dengan contoh kode konkret dari codebase lama:
    tunjukkan boolean flags impossible state (`hasLartasImport: true` tapi `lartasImportDetails: []`),
    use case yang membaca env vars, dan `parseHsCodeApiResponse` yang salah tempat — _Requirements: 8.2_
  - Tulis bagian **Prinsip HtDP yang Diterapkan** dan terjemahannya ke keputusan kode:
    "define data first" → `types.ts` duluan; "pure functions" → boundary parser; dll. — _Requirements: 8.3_
  - Sertakan **diagram ASCII/Mermaid** yang menunjukkan struktur folder sebelum dan sesudah refactor — _Requirements: 8.4_
  - Tulis **Daftar Keputusan Desain** beserta alasan dan trade-off: Map vs boolean flags,
    plain object gateway, Server Action vs API route, streaming dihilangkan — _Requirements: 8.7_
  - Tulis **Panduan Replikasi** — langkah-langkah konkret untuk developer yang ingin menerapkan
    pola yang sama ke modul lain di Pesisir, cukup lengkap tanpa harus membaca seluruh codebase — _Requirements: 8.5, 8.6_
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

## Notes

- Task yang diberi tanda `*` adalah opsional dan bisa di-skip untuk MVP lebih cepat
- Setiap task merujuk ke requirements spesifik untuk traceability
- Checkpoint (Task 12 dan 16) memastikan validasi inkremental sebelum lanjut
- Property tests memvalidasi invariant universal; unit tests memvalidasi contoh dan edge cases
- Urutan tasks mengikuti dependency: types → ports → functions → boundary → use-cases →
  infrastructure → server actions → presenter → hooks → cleanup → tests → docs
