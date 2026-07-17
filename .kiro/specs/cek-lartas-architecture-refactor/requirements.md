# Dokumen Persyaratan

## Pendahuluan

Spec ini mendokumentasikan refactoring arsitektur modul **Cek Lartas** di project Next.js Pesisir
sebagai studi kasus (pilot) penerapan prinsip **HtDP (How to Design Programs)** di codebase produksi.

Tujuan utama bukan menambah fitur baru, melainkan membentuk **pola arsitektur yang bisa direplikasi**
ke modul lain setelah pola ini terbukti di modul Cek Lartas.

Empat prinsip HtDP yang menjadi landasan refactoring ini:

1. **Framework independence** — logika bisnis (`core/`) tidak boleh tahu tentang Next.js atau React.
   `core/` harus bisa hidup dan diuji di luar folder `app/` yang dikelola Next.js.
2. **Clean world** — di dalam "dunia" `core/` tidak ada side effects, tidak ada HTTP, tidak ada I/O.
   Hanya data dan transformasi data murni (pure functions).
3. **Ubiquitous language** — nama fungsi, tipe, dan variabel mencerminkan bahasa domain bea cukai
   Indonesia (PPJK), sehingga kode bisa dibaca seperti membaca business rules.
4. **Boundary yang jelas** — ada satu titik di mana data dari luar (API INSW, input user) diparse
   dan divalidasi sebelum masuk ke `core/`. Setelah melewati boundary, kode internal dapat
   mempercayai data tanpa re-checking.

**Masalah spesifik di codebase saat ini yang akan diselesaikan:**

- `core/` berada di `app/core/` — di dalam folder yang dikelola Next.js, sehingga secara struktural
  tidak framework-independent.
- Entity `hs-code.js` menggunakan boolean flags (`hasLartasImport`, `hasLartasBorder`, dll.) yang
  memungkinkan impossible states (misalnya `hasLartasImport: true` tapi `lartasImportDetails: []`).
- Use case `fetch-hs-code-data.js` membaca environment variables delay/retry — itu infrastructure
  concern, bukan business rule.
- `parseHsCodeApiResponse` ada di `hs-code.presenter.js` (layer adapters), padahal secara semantik
  fungsi ini adalah boundary parser yang seharusnya berada di layer tersendiri.
- Semua file masih JavaScript; TypeScript belum digunakan meski sudah menjadi pilihan project.

**Scope refactor ini:** modul Cek Lartas saja (pilot). Modul lain mengikuti setelah pola terbentuk.

---

## Glosarium

- **HtDP**: How to Design Programs — metodologi desain program berbasis "define data first, then define
  functions over that data". [htdp.org](https://htdp.org)
- **Core**: Layer logika bisnis murni — tidak bergantung pada framework, tidak ada side effects.
  Setelah refactor, berada di `core/` di root project.
- **Boundary**: Titik masuk data dari luar ke dalam `core/`. Bertanggung jawab parse dan validasi
  sehingga data yang masuk ke `core/` selalu dalam bentuk yang diketahui.
- **Pure Function**: Fungsi yang hanya bergantung pada argumennya, tidak mengubah state di luar
  dirinya, dan selalu menghasilkan output yang sama untuk input yang sama.
- **Impossible State**: Kombinasi nilai dalam sebuah data shape yang seharusnya tidak mungkin terjadi
  secara bisnis, tapi diizinkan oleh struktur tipe yang ada.
- **HS Code**: Harmonized System Code — kode 8 digit numerik untuk klasifikasi barang impor/ekspor
  di sistem kepabeanan internasional.
- **LARTAS**: Larangan dan Pembatasan — regulasi impor/ekspor yang berlaku untuk suatu HS code
  berdasarkan ketentuan otoritas Indonesia (Kemendag, BPOM, dll.).
- **INSW**: Indonesia National Single Window — portal pemerintah yang menjadi sumber data HS code
  dan regulasi LARTAS.
- **Kategori LARTAS**: Klasifikasi regulasi LARTAS berdasarkan jalur pengawasan:
  `"border"` (impor border), `"post-border"` (impor post-border), `"ekspor"` (ekspor border).
- **Tarif**: Data perpajakan impor yang meliputi BM (Bea Masuk), PPN, PPH, dan PPH Non-API.
- **RawInsw**: Tipe data mentah dari API INSW sebelum diparse — belum bisa dipercaya strukturnya.
- **HsCode**: Value object murni yang merepresentasikan identitas kode HS. Hanya memiliki field
  `code: string` (2, 4, 6, atau 8 digit numerik). Tidak membawa tarif atau regulasi.
- **Lartas**: Tipe data hasil query ke INSW. Membawa `hsCode: HsCode`, `tarif: Tarif`, dan
  `regulasi: Map<KategoriLartas, LartasDetail[]>`. Ini adalah tipe inti di `core/`.
- **KategoriLartas**: String union `"border" | "post-border" | "ekspor"` — digunakan sebagai key
  di `Map` regulasi. Satu `Lartas` bisa memiliki entry di semua kategori sekaligus.
- **LartasDetail**: Satu entri regulasi LARTAS untuk kategori tertentu (satu izin/dokumen).
  Berlaku untuk semua kategori termasuk ekspor.
- **Boundary Parser**: Fungsi yang mengubah data mentah dari luar menjadi `Lartas` yang valid,
  atau mengembalikan error eksplisit.
- **HsCodeGateway**: Port (interface) yang mendefinisikan kontrak pengambilan data HS code dari
  sumber eksternal. Diimplementasikan oleh infrastructure layer sebagai plain object.
- **Server Action**: Fungsi server yang dipanggil langsung dari client component tanpa mendefinisikan
  API route eksplisit. Didefinisikan dengan directive `"use server"` di `app/cek-lartas/actions.ts`.
- **PPJK**: Perusahaan Pengurusan Jasa Kepabeanan — perusahaan yang menjadi pengguna utama Pesisir.
- **Pilot Module**: Modul pertama yang menerapkan pola arsitektur baru sebelum direplikasi ke modul lain.

---

## Persyaratan

### Persyaratan 1: Pindahkan `core/` ke Root Project

**User Story:** Sebagai developer, saya ingin folder `core/` berada di root project (bukan di dalam
`app/`), agar secara struktural jelas bahwa logika bisnis tidak bergantung pada Next.js dan bisa
diuji tanpa framework.

#### Kriteria Penerimaan

1. THE `Core` Module SHALL dipindahkan dari `app/core/` ke `core/` di root project.
2. WHEN `Core` Module dipindahkan, THE Project SHALL memiliki path alias `@core/*` yang memetakan
   ke `core/*` sehingga semua import bisa menggunakan alias yang konsisten.
3. THE `core/` directory SHALL tidak mengandung import dari `app/`, `react`, `next`, atau library
   framework apapun.
4. THE `core/` directory SHALL dapat dijalankan dan diuji dengan test runner standar (Jest/Vitest)
   tanpa perlu konfigurasi Next.js.
5. IF ada file di `app/core/` yang mengandung import framework (React, Next.js), THEN THE
   Refactored_Code SHALL memisahkan bagian tersebut ke layer yang sesuai sebelum memindahkannya.
6. THE `app/` directory SHALL mengimpor dari `core/` melalui path alias `@core/*` — bukan path
   relatif yang melintasi batas layer.

---

### Persyaratan 2: Definisikan Data Shapes TypeScript untuk Modul Cek Lartas

**User Story:** Sebagai developer, saya ingin semua data shapes di modul Cek Lartas didefinisikan
sebagai TypeScript types sebelum ada implementasi fungsi, sesuai prinsip HtDP "define data first".

#### Kriteria Penerimaan

1. THE `HsCode` Type SHALL didefinisikan di `core/cek-lartas/types.ts` sebagai pure value object
   yang hanya memiliki field `code: string` — merepresentasikan identitas kode HS 2, 4, 6, atau
   8 digit numerik. THE `HsCode` Type SHALL tidak membawa tarif atau regulasi LARTAS.
2. THE `Lartas` Type SHALL didefinisikan di `core/cek-lartas/types.ts` sebagai tipe hasil query
   ke INSW, dengan field: `hsCode: HsCode`, `tarif: Tarif`, dan
   `regulasi: Map<KategoriLartas, LartasDetail[]>`. Satu `Lartas` dapat memiliki entry di semua
   kategori sekaligus — `Map` digunakan sebagai key sehingga tidak ada boolean flags terpisah.
3. THE `KategoriLartas` Type SHALL didefinisikan sebagai string union
   `"border" | "post-border" | "ekspor"` — berfungsi sebagai key di `Map` regulasi, bukan untuk
   memilih salah satu kategori secara eksklusif.
4. THE `LartasDetail` Type SHALL mendefinisikan field: `namaIzin`, `kodeIzin`, `noSkep`,
   `idDokumen`, `dokumenPabean`, `tanggalMulai`, `tanggalAkhir`, `link` — semua nullable kecuali
   `namaIzin` yang wajib ada. Tipe ini berlaku untuk semua kategori termasuk ekspor.
5. THE `Tarif` Type SHALL didefinisikan sebagai tipe terpisah dengan field `bm`, `ppn`, `pph`,
   `pphNonApi` — semua bertipe `string | null`.
6. WHEN file types didefinisikan, THE TypeScript_Compiler SHALL tidak menghasilkan error pada file
   tersebut (strict mode).

---

### Persyaratan 3: Refactor Entity `HsCode` — Eliminasi Impossible States

**User Story:** Sebagai developer, saya ingin entity `HsCode` di `core/` tidak memungkinkan
impossible states, agar compiler TypeScript — bukan runtime check — yang mencegah data yang tidak
konsisten masuk ke logika bisnis.

#### Kriteria Penerimaan

1. THE `Lartas` Type SHALL menggunakan `Map<KategoriLartas, LartasDetail[]>` untuk menyimpan semua
   data regulasi, sehingga "ada atau tidak adanya LARTAS" ditentukan dari isi Map — bukan dari
   boolean flags terpisah.
2. THE `makeHsCode` Factory Function SHALL menjadi satu-satunya cara membuat `HsCode` yang valid
   di dalam `core/`. Factory ini hanya memvalidasi format kode (2, 4, 6, atau 8 digit numerik).
3. WHEN `makeHsCode` dipanggil dengan kode yang memenuhi format 2/4/6/8 digit numerik, THE Factory
   Function SHALL mengembalikan `{ ok: true, data: HsCode }`.
4. IF `makeHsCode` dipanggil dengan kode yang bukan 2, 4, 6, atau 8 digit numerik, THEN THE Factory
   Function SHALL mengembalikan `{ ok: false, error: string }` — tidak melempar exception.
5. THE `hasLartas` Helper Function SHALL beroperasi pada tipe `Lartas` — diturunkan dari isi Map
   regulasi, mengembalikan `true` jika ada minimal satu kategori dengan minimal satu `LartasDetail`.
6. THE `getLartasByKategori` Helper Function SHALL beroperasi pada tipe `Lartas`, menerima
   `KategoriLartas`, dan mengembalikan array `LartasDetail[]` (kosong jika tidak ada).
7. THE `isValidHsCode` Function SHALL dipertahankan sebagai pure function yang memvalidasi format
   2/4/6/8 digit numerik — tanpa side effects.
8. THE `formatHsCode` Function SHALL dipertahankan sebagai pure function yang memformat HS code
   menjadi tampilan `XXXX.XX.XX`.

---

### Persyaratan 4: Refactor Use Case — Pisahkan Business Rules dari Infrastructure Concerns

**User Story:** Sebagai developer, saya ingin use case `fetch-hs-code-data` hanya berisi business
rules — validasi, transformasi, orchestrasi — tanpa mengetahui tentang delay, retry, atau
environment variables, agar logika bisnis bisa dipahami dan diuji tanpa mock infrastructure.

#### Kriteria Penerimaan

1. THE `fetchHsCodeData` Use Case SHALL menerima `HsCodeGateway` sebagai dependency injection
   — bukan menginstansiasi gateway sendiri.
2. THE `fetchHsCodeData` Use Case SHALL tidak membaca environment variables apapun (delay, retry,
   concurrency limit, dsb.) — konfigurasi tersebut adalah tanggung jawab layer infrastructure.
3. THE `fetchSingle` Function dalam use case SHALL menerima `HsCode` (bukan `string` mentah)
   sebagai parameter, langsung memanggil gateway — tanpa validasi format HS code di dalam use case
   karena validasi terjadi di boundary sebelum use case dipanggil.
4. THE `fetchMultiple` Function dalam use case SHALL: deduplikasi kode yang sama, panggil
   `fetchSingle` untuk masing-masing, kembalikan hasil per kode — tanpa logika delay atau retry.
5. THE `HsCodeGateway` Port SHALL didefinisikan di `core/cek-lartas/ports.ts` dengan signature:
   `fetchByCode(code: HsCode): Promise<RawInsw | null>` — menerima `HsCode`, bukan `string`.
6. THE `RawInsw` Type SHALL didefinisikan sebagai tipe untuk data mentah dari gateway — sebelum
   parsing. Ini adalah tipe "tidak dipercaya" yang hanya ada di boundary.
7. THE `HsCodeGateway` Port SHALL diimplementasikan sebagai plain object (bukan class) yang
   memenuhi interface `HsCodeGateway` di layer infrastructure.
8. THE Use Case SHALL ditulis dalam TypeScript (`.ts`) dan berada di `core/cek-lartas/use-cases/`.

---

### Persyaratan 5: Buat Boundary Parser untuk Data INSW

**User Story:** Sebagai developer, saya ingin ada satu fungsi parser yang menjadi satu-satunya titik
masuk data mentah dari INSW API ke dalam `core/`, agar semua pengecekan dan normalisasi terjadi di
satu tempat dan kode di dalam `core/` bisa mempercayai datanya.

#### Kriteria Penerimaan

1. THE `parseInswResponse` Function SHALL ditempatkan di `core/cek-lartas/boundary.ts` sebagai
   satu-satunya titik konversi data INSW mentah ke `Lartas`.
2. THE `parseInswResponse` Function SHALL menerima `unknown` (bukan tipe spesifik) sebagai input,
   karena data dari luar tidak bisa dipercaya strukturnya.
3. WHEN `parseInswResponse` menerima objek valid dengan semua field yang diperlukan, THE Function
   SHALL mengembalikan `{ ok: true, data: Lartas }`.
4. IF `parseInswResponse` menerima input yang bukan objek, field wajib tidak ada, atau nilai
   tidak sesuai tipe, THEN THE Function SHALL mengembalikan `{ ok: false, error: string }` yang
   menjelaskan field mana yang bermasalah.
5. THE `parseInswResponse` Function SHALL menormalisasi semua representasi "tidak ada data"
   (`null`, `undefined`, `""`, `"N/A"`, `"tidak ada data"`) menjadi `null` secara konsisten.
6. THE `parseInswResponse` Function SHALL mengkonversi boolean flags INSW (`hasLartasImport`,
   `hasLartasBorder`, dll.) menjadi `Map<KategoriLartas, LartasDetail[]>` sesuai struktur `Lartas`.
7. THE `parseInswResponse` Function SHALL bersifat pure — tidak ada side effects, tidak ada I/O.
8. FOR ALL valid `Lartas` objects, THE Round_Trip Property SHALL hold: data yang dihasilkan
   `parseInswResponse` dapat di-serialize kembali ke format yang bisa di-parse ulang menghasilkan
   data yang ekivalen.

---

### Persyaratan 6: Migrate File Core ke TypeScript

**User Story:** Sebagai developer, saya ingin file-file di `core/cek-lartas/` ditulis dalam
TypeScript, agar compiler membantu mencegah error sebelum runtime dan kontrak antar fungsi
terdokumentasi secara eksplisit lewat tipe.

#### Kriteria Penerimaan

1. THE Files di `core/cek-lartas/` SHALL ditulis dalam TypeScript (`.ts`) — bukan JavaScript
   (`.js`) atau JSDoc.
2. THE TypeScript Config SHALL mengaktifkan `strict: true` untuk folder `core/` sehingga semua
   type checking berjalan penuh.
3. THE `HsCodeData`, `KategoriLartas`, `LartasDetail`, `Tarif`, dan `RawInsw` Types SHALL
   diekspor dari `core/cek-lartas/types.ts` sebagai single source of truth.
4. THE Core Functions SHALL tidak menggunakan `any` — semua tipe harus eksplisit atau diinfer
   dari tipe yang sudah didefinisikan.
5. WHEN TypeScript compiler dijalankan pada folder `core/`, THE Compiler SHALL tidak menghasilkan
   error (zero errors).
6. THE `HsCodeGateway` Interface SHALL diekspor dari `core/cek-lartas/ports.ts` sehingga
   infrastructure layer bisa mengimplementasikannya.

---

### Persyaratan 7: Migrasi Layer Adapters ke Server Actions

**User Story:** Sebagai developer, saya ingin layer adapters di modul Cek Lartas menggunakan
Server Actions Next.js (bukan API routes + controller), agar alur data lebih sederhana dan
kompatibel dengan App Router — tanpa kehilangan fungsionalitas yang sudah berjalan.

#### Kriteria Penerimaan

1. THE `hs-code.controller.js` SHALL dihapus karena tidak relevan di arsitektur App Router —
   fungsinya digantikan oleh Server Actions.
2. THE `/api/hs-code/progress` Route SHALL dihapus — digantikan oleh Server Action `fetchLartasBatch`
   yang menangani batch lookup HS code dari file Excel.
3. THE `/api/hs-code` Route SHALL dihapus — digantikan oleh Server Action `fetchLartas` yang
   menangani lookup HS code tunggal.
4. THE Server Actions SHALL didefinisikan di `app/cek-lartas/actions.ts` dengan directive
   `"use server"` di bagian atas file.
5. THE `useCekLartasFile` Hook SHALL diperbarui untuk memanggil Server Action `fetchLartasBatch`
   secara langsung — bukan melakukan `fetch` ke API route.
6. THE `useCekLartasSingle` Hook SHALL diperbarui untuk memanggil Server Action `fetchLartas`
   secara langsung — bukan melakukan `fetch` ke API route.
7. THE Streaming Progress SHALL dihilangkan — `fetchLartasBatch` mengembalikan seluruh hasil
   setelah semua HS code selesai diproses (single async call), bukan stream NDJSON bertahap.
8. THE `hs-code.presenter.js` SHALL tetap dipertahankan sebagai thin adapter yang hanya melakukan
   transformasi dari tipe `Lartas[]` ke view model — tidak ada logika bisnis di dalamnya.
9. WHEN refactoring selesai, THE Existing Tests di use cases dan entities SHALL tetap lulus
   (atau dipindahkan ke lokasi baru dan tetap lulus).

---

### Persyaratan 8: Dokumentasi sebagai "Cerita" Perubahan

**User Story:** Sebagai developer, saya ingin ada dokumen yang menceritakan "mengapa" dan "bagaimana"
refactoring ini dilakukan — bukan hanya "apa" yang berubah — agar bisa dipelajari oleh developer
lain dan dijadikan referensi saat mereplikasi pola ke modul lain.

#### Kriteria Penerimaan

1. THE `docs/architecture/cek-lartas-refactor.md` File SHALL dibuat dan berisi narasi perubahan
   arsitektur dalam Bahasa Indonesia.
2. THE Document SHALL menjelaskan **masalah sebelumnya** dengan contoh kode konkret dari codebase
   lama (misalnya, boolean flags yang memungkinkan impossible states).
3. THE Document SHALL menjelaskan **prinsip HtDP yang diterapkan** dan bagaimana setiap prinsip
   diterjemahkan ke keputusan kode spesifik.
4. THE Document SHALL berisi **diagram sederhana** (bisa ASCII art atau Mermaid) yang menunjukkan
   perubahan struktur folder sebelum dan sesudah refactor.
5. THE Document SHALL berisi **panduan replikasi**: langkah-langkah yang harus diikuti developer
   untuk menerapkan pola yang sama ke modul lain di Pesisir.
6. WHEN modul baru ingin mengikuti pola ini, THE Panduan Replikasi SHALL cukup lengkap sehingga
   developer bisa mengikutinya tanpa harus membaca seluruh codebase Cek Lartas.
7. THE Document SHALL menyertakan **daftar keputusan desain** (design decisions) beserta
   alasannya — termasuk trade-off yang disadari (misalnya, "kenapa Map bukan array of objects").

---

### Persyaratan 9: Test Coverage untuk Core yang Baru

**User Story:** Sebagai developer, saya ingin `core/cek-lartas/` memiliki test yang memverifikasi
business rules dan boundary parsing, agar refactoring tidak memperkenalkan regresi dan pola
testing ini bisa dicontoh untuk modul lain.

#### Kriteria Penerimaan

1. THE `makeHsCode` Factory Function SHALL memiliki tests yang mencakup: kode valid 2/4/6/8 digit,
   kode tidak valid (format salah), dan edge cases seperti string kosong atau angka ganjil digit.
2. THE `parseInswResponse` Boundary Parser SHALL memiliki tests yang mencakup: input valid
   menghasilkan `Lartas`, input bukan objek, field wajib tidak ada, dan normalisasi nilai
   null/undefined/empty ke `null`.
3. THE `hasLartas` Helper Function SHALL memiliki tests yang memverifikasi: kembalikan `true` jika
   ada setidaknya satu kategori dengan detail, `false` jika Map kosong.
4. THE `fetchSingle` Use Case Function SHALL memiliki tests menggunakan mock gateway, mencakup:
   `HsCode` valid dengan data, `HsCode` valid tanpa data (gateway return null).
5. THE Round_Trip Property Test SHALL diimplementasikan: untuk semua input valid, hasil
   `parseInswResponse` harus bisa di-serialize dan di-parse kembali menghasilkan data yang ekivalen.
6. THE Tests SHALL dapat dijalankan dengan perintah `jest` atau `npx jest core/` tanpa konfigurasi
   tambahan selain yang sudah ada di `package.json`.
7. THE Test Files SHALL ditempatkan di `core/cek-lartas/__tests__/` sesuai konvensi `__tests__`
   yang sudah ada di project.

