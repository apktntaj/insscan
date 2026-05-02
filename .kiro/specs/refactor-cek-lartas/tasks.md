# Rencana Implementasi: Refactor Cek Lartas

## Ikhtisar

Refactor komponen monolitik `HsCodeScanner.jsx` (~797 baris) menjadi unit-unit kecil dengan tanggung jawab tunggal. Urutan implementasi mengikuti dependency order: parser terpusat → hooks → sub-komponen → komponen utama → wiring halaman.

## Tasks

- [x] 1. Tambah `parseHsCodeApiResponse` ke presenter yang sudah ada
  - [x] 1.1 Implementasi helper `isPlainObject` dan `parseDetailArray` di `app/adapters/presenters/hs-code.presenter.js`
    - `isPlainObject(value)` — kembalikan `true` hanya jika value adalah plain object (bukan null, array, atau primitif)
    - `parseDetailArray(value)` — normalisasi array detail LARTAS, kembalikan `[]` jika bukan array valid
    - _Persyaratan: 11.5_

  - [x] 1.2 Implementasi fungsi `parseHsCodeApiResponse` di `app/adapters/presenters/hs-code.presenter.js`
    - Validasi bahwa `raw` adalah plain object; kembalikan `{ ok: false, error }` jika bukan
    - Validasi field wajib `hsCode`; kembalikan `{ ok: false, error }` jika tidak ada
    - Normalisasi semua field sesuai tabel di design: `bm/ppn/pph/pphNonApi` → string atau null, `hasLartas*` → Boolean eksplisit, `lartas*Details` → array via `parseDetailArray`
    - Kembalikan `{ ok: true, data: LartasResult }` jika valid
    - Tidak boleh throw — semua error dikembalikan sebagai nilai
    - _Persyaratan: 11.3, 11.5_

  - [ ]* 1.3 Tulis property test untuk `parseHsCodeApiResponse`
    - **Properti 1 (parsial): Input null/non-object selalu menghasilkan `{ ok: false }`**
    - **Memvalidasi: Persyaratan 11.3**

- [x] 2. Implementasi `useCekLartasSingle` hook
  - [x] 2.1 Buat file `app/presentation/hooks/useCekLartasSingle.js` dengan helper internal
    - Implementasi `fetchSingleHsCode(normalized)` — fetch POST ke `/api/hs-code`, parse respons[0] via `parseHsCodeApiResponse`, kembalikan `ParseResult`
    - Implementasi `buildSingleExcelRows(result)` — transform `LartasResult` ke array `ExcelSingleRow`; jika tidak ada detail LARTAS kembalikan satu baris dengan Kategori "Tidak Ada"
    - Implementasi `formatSingleExcelFilename(hsCode)` — buat nama file `lartas-{hsCode}-{YYYYMMDD}.xlsx`
    - _Persyaratan: 2.1, 2.2, 8.2, 8.3, 8.5_

  - [x] 2.2 Implementasi `handleFetch` dalam `useCekLartasSingle`
    - Normalisasi input: strip non-digit, validasi 8 digit via `isValidHsCode`
    - Jika tidak valid: set `singleStatus = "HS code harus 8 digit angka."`, tidak fetch
    - Jika valid: set `isSingleLoading = true`, `singleStatus = "Mengambil data HS code..."`, `singleResult = null`
    - Panggil `fetchSingleHsCode`, parse via `parseHsCodeApiResponse`
    - Sukses: `setSingleResult(data)`, `setSingleStatus("Data berhasil ditampilkan.")`
    - HTTP error: `setSingleStatus("Gagal: HTTP {status}.")`
    - Network error: `setSingleStatus("Gagal terhubung ke server. Periksa koneksi internet Anda.")`
    - _Persyaratan: 2.2, 2.3, 2.4, 2.5, 2.6, 11.1_

  - [ ]* 2.3 Tulis property test untuk `handleFetch` — validasi input
    - **Properti 1: Input tidak valid tidak memicu fetch**
    - Untuk semua string yang bukan tepat 8 digit angka, tidak ada request HTTP dan `singleStatus` berisi pesan error
    - **Memvalidasi: Persyaratan 2.3**

  - [ ]* 2.4 Tulis property test untuk `handleFetch` — hasil fetch
    - **Properti 2: Hasil fetch selalu mengambil elemen pertama array**
    - Untuk semua respons array valid, `singleResult` sama dengan elemen pertama setelah diparse
    - **Memvalidasi: Persyaratan 2.4**

  - [ ]* 2.5 Tulis property test untuk `handleFetch` — HTTP error
    - **Properti 3: HTTP error selalu menyertakan kode status di pesan**
    - Untuk semua kode status 400–599, `singleStatus` mengandung kode status tersebut
    - **Memvalidasi: Persyaratan 2.5**

  - [x] 2.6 Implementasi `handleCopy` dalam `useCekLartasSingle`
    - Jika `navigator.clipboard` tidak tersedia: `setSingleStatus("Salin tidak didukung di browser ini.")`
    - Jika tersedia: panggil `navigator.clipboard.writeText(singleResult.hsCode)` (8 digit tanpa titik)
    - Sukses: `setSingleStatus("HS code disalin ke clipboard.")`, setelah 2 detik reset ke `""`
    - _Persyaratan: 2.7, 2.8, 7.2_

  - [ ]* 2.7 Tulis property test untuk `handleCopy`
    - **Properti 4: Copy ke clipboard selalu menggunakan kode tanpa titik**
    - Untuk semua `LartasResult` valid, `clipboard.writeText` dipanggil dengan `hsCode` 8 digit murni
    - **Memvalidasi: Persyaratan 2.7, 7.2**

  - [x] 2.8 Implementasi `handleExportSingle` dalam `useCekLartasSingle`
    - Jika `singleResult` null: tidak melakukan aksi
    - Panggil `buildSingleExcelRows(singleResult)` lalu `downloadAsExcel(rows, formatSingleExcelFilename(hsCode))`
    - _Persyaratan: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 2.9 Export `useCekLartasSingle` dari file hook
    - Pastikan fungsi diekspor dengan named export `export function useCekLartasSingle()`
    - _Persyaratan: 2.1, 10.2_

- [x] 3. Implementasi `useCekLartasFile` hook
  - [x] 3.1 Buat file `app/presentation/hooks/useCekLartasFile.js` dengan helper internal
    - Implementasi `createInitialProgressState()` — kembalikan `ProgressState` dengan semua nilai default
    - Implementasi `resolveChunkSize(rawValue)` — parse env var, fallback ke 3
    - Implementasi `sleep(ms)` — Promise delay
    - Implementasi `extractHsCodes(fileData)` — ekstrak HS code valid dari 2D array Excel via `isValidHsCode`
    - _Persyaratan: 3.1, 3.5_

  - [x] 3.2 Implementasi `consumeProgressStream` dalam `useCekLartasFile`
    - Baca `ReadableStream` line-by-line, parse setiap baris sebagai JSON event
    - Handle event: `start`, `progress` (kumpulkan `partialRows`), `complete` (simpan `finalData`), `error`
    - Kembalikan `{ data, isPartial, processedCount }` — jika ada `finalData` gunakan itu, jika tidak gunakan `partialRows`
    - Jika tidak ada data sama sekali: throw error
    - _Persyaratan: 3.5, 3.8_

  - [x] 3.3 Implementasi `finalizeProgress` dalam `useCekLartasFile`
    - Hitung `actualDurationMs` dari `startedAt` hingga sekarang
    - Hitung `etaDeltaMs` = `actualDurationMs - etaTotalMsBeforeComplete`
    - Kembalikan `ProgressState` final dengan semua field terisi
    - _Persyaratan: 9.5_

  - [x] 3.4 Implementasi `handleFileChange` dalam `useCekLartasFile`
    - Jika bukan `.xls`/`.xlsx`: `setStatus("File harus berformat .xls atau .xlsx.")`, tidak update `fileData`
    - Baca file via `fileToArrayBuffer` + `bufferToJson`
    - Ekstrak HS code via `extractHsCodes`; jika kosong: `setStatus("Tidak ada HS code valid ditemukan di file.")`
    - Jika berhasil: `setFileData(jsonData)`, `setResultData(null)`, `setStatus("")`, `setProgress(createInitialProgressState())`
    - _Persyaratan: 3.2, 3.3, 3.4_

  - [ ]* 3.5 Tulis property test untuk `handleFileChange` — validasi ekstensi
    - **Properti 5: Semua ekstensi non-Excel ditolak saat upload file**
    - Untuk semua nama file dengan ekstensi selain `.xls`/`.xlsx`, `fileData` tidak berubah dan `status` berisi pesan error
    - **Memvalidasi: Persyaratan 3.3**

  - [ ]* 3.6 Tulis property test untuk `handleFileChange` — validasi isi file
    - **Properti 6: File tanpa HS code valid selalu menghasilkan status error**
    - Untuk semua 2D array tanpa string 8 digit angka, `status` berisi pesan error dan `fileData` tidak diperbarui
    - **Memvalidasi: Persyaratan 3.4**

  - [x] 3.7 Implementasi `handleFetch` (streaming) dalam `useCekLartasFile`
    - Ekstrak HS code dari `fileData`, set `progress.total`, `isLoading = true`
    - Loop adaptive chunking: fetch chunk ke `/api/hs-code/progress`, panggil `consumeProgressStream`
    - Update `progress.current` dan `progress.logs` setiap HS code selesai via `onProgress` callback
    - Parse setiap baris hasil via `parseHsCodeApiResponse`; jika `ok: false` catat ke console, gunakan nilai default aman
    - Jika chunk gagal ≥ `MAX_CHUNK_ATTEMPTS`: turunkan `chunkSize`, lanjut dari posisi terakhir
    - Selesai penuh: `setResultData(aggregatedRows)`, `setStatus("Berhasil! N data HS Code ditampilkan.")`
    - Selesai parsial: `setResultData(partialRows)`, `setStatus("Proses berhenti. N data parsial berhasil ditampilkan.")`
    - Gagal total: `setStatus("Gagal mengambil data. Silakan coba lagi.")`
    - `finally`: panggil `finalizeProgress`, `setIsLoading(false)`
    - _Persyaratan: 3.5, 3.6, 3.7, 3.8, 3.9, 11.2_

  - [ ]* 3.8 Tulis property test untuk `handleFetch` — progress monoton
    - **Properti 7: Progress selalu meningkat monoton selama streaming**
    - Untuk semua daftar HS code N > 0, `progress.current` tidak pernah berkurang selama streaming
    - **Memvalidasi: Persyaratan 3.6**

  - [ ]* 3.9 Tulis property test untuk `handleFetch` — adaptive chunking
    - **Properti 8: Adaptive chunking selalu menurunkan ukuran setelah kegagalan berulang**
    - Untuk semua chunk awal C > 1, setelah `MAX_CHUNK_ATTEMPTS` kegagalan, `chunkSize` berkurang
    - **Memvalidasi: Persyaratan 3.7**

  - [ ]* 3.10 Tulis property test untuk `handleFetch` — data parsial
    - **Properti 9: Data parsial selalu disimpan saat streaming berhenti di tengah**
    - Untuk semua skenario K dari N (0 < K < N), `resultData` berisi tepat K baris dan `status` menyebut K
    - **Memvalidasi: Persyaratan 3.8**

  - [x] 3.11 Implementasi `handleExportResult` dalam `useCekLartasFile`
    - Jika `resultData` null atau kosong: tidak melakukan aksi
    - Panggil `downloadAsExcel(resultData, "lartas-hasil-{YYYYMMDD}.xlsx")`
    - _Persyaratan: 3.10, 3.11_

  - [ ]* 3.12 Tulis property test untuk `handleExportResult`
    - **Properti 10: Export file selalu memanggil `downloadAsExcel` dengan data yang benar**
    - Untuk semua `resultData` dengan minimal satu item, `downloadAsExcel` dipanggil dengan data tersebut dan nama file mengandung tanggal hari ini
    - **Memvalidasi: Persyaratan 3.10**

- [x] 4. Checkpoint — Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [x] 5. Buat sub-komponen UI di subfolder `cek-lartas/`
  - [x] 5.1 Buat `app/presentation/components/features/cek-lartas/LartasDocModal.jsx`
    - Pindahkan logika `LartasDocModal` dari `HsCodeTable.jsx` ke file terpisah
    - Props: `{ cell: { referenceNo, hsCode, docCode, details }, onClose }`
    - Pertahankan semua logika: `groupByCategory`, `resolveRegulationLinks`, `formatDate`
    - Klik backdrop atau tombol "Tutup" memanggil `onClose()`
    - _Persyaratan: 4.6, 10.1_

  - [x] 5.2 Buat `app/presentation/components/features/cek-lartas/ProgressPanel.jsx`
    - Komponen murni — tidak ada state internal, hanya props `{ progress, isLoading }`
    - Implementasi helper pure functions: `calcPercent`, `formatDuration`, `formatEtaClock`, `formatDelta`
    - Tampilkan: progress bar + persentase angka, "X dari Y HS code", ETA jam lokal "HH:MM:SS", durasi berjalan
    - Tampilkan ringkasan setelah selesai: durasi aktual, selisih vs ETA
    - Tampilkan log aktivitas scrollable (maks 10 entri terakhir)
    - _Persyaratan: 4.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 5.3 Buat `app/presentation/components/features/cek-lartas/SingleResultCard.jsx`
    - Props: `{ row: LartasResult, onCopy: () => Promise<void>, onExport: () => void }`
    - Tampilkan: HS code (format `XXXX.XX.XX`), badge LARTAS Ada/Tidak Ada, `InfoBadge` per kategori, `LartasSectionCard` per detail
    - Tombol "Salin HS Code": panggil `onCopy`, tampilkan konfirmasi visual "Tersalin!" selama 2 detik
    - Tombol "Ekspor ke Excel": panggil `onExport`, selalu tampil meski tidak ada LARTAS
    - Jika tidak ada detail LARTAS: tampilkan pesan "Tidak ada detail LARTAS untuk HS code ini."
    - _Persyaratan: 4.5, 7.1, 7.2, 7.3, 7.4, 8.1_

  - [x] 5.4 Buat `app/presentation/components/features/cek-lartas/SingleInputPanel.jsx`
    - Gunakan `useCekLartasSingle()` untuk semua state dan aksi
    - Tampilkan: input field, tombol "Cari HS Code" (disabled saat loading), `Alert` status, `SingleResultCard`
    - `Alert` dengan `variant="success"` untuk sukses, `variant="error"` untuk error, `variant="warning"` untuk peringatan
    - Pesan validasi input ditampilkan inline (bukan `alert()` browser)
    - Pass `handleCopy` dan `handleExportSingle` ke `SingleResultCard`
    - _Persyaratan: 4.2, 6.1, 6.4, 6.5_

  - [x] 5.5 Buat `app/presentation/components/features/cek-lartas/FileInputPanel.jsx`
    - Gunakan `useCekLartasFile()` untuk semua state dan aksi
    - Tampilkan: input file, tombol "Tarik Data" (disabled saat loading atau `fileData` null), tombol "Ekspor Hasil"
    - Tampilkan `Alert` dengan variant sesuai status: `"error"` untuk gagal total, `"warning"` untuk parsial, `"success"` untuk berhasil
    - Tampilkan `ProgressPanel` jika `progress.total > 0`
    - Tampilkan `LartasResultTable` dengan `fileData` dan `resultData`
    - Pesan validasi file ditampilkan inline (bukan `alert()` browser)
    - _Persyaratan: 4.3, 6.2, 6.3, 6.6_

- [x] 6. Buat `LartasResultTable.jsx` (rename dari `HsCodeTable`)
  - [x] 6.1 Buat file `app/presentation/components/features/LartasResultTable.jsx`
    - Salin logika dari `HsCodeTable.jsx`: `LartasResultTable`, `buildMatrixRows`, `collectDocumentCodes`, `extractSectionDetails`
    - Ganti import `LartasDocModal` dari file terpisah `./cek-lartas/LartasDocModal`
    - Hapus fungsi `LartasDocModal` inline (sudah dipindah ke file terpisah di task 5.1)
    - Pertahankan semua fungsionalitas: view mode toggle (LARTAS Only / All), matriks dokumen pabean, klik sel untuk buka modal
    - _Persyaratan: 1.2, 1.4, 10.4_

- [x] 7. Buat `CekLartasScanner.jsx` (entry point utama)
  - [x] 7.1 Buat file `app/presentation/components/features/CekLartasScanner.jsx`
    - State `mode` ("single" | "file") disimpan di sini
    - Render mode toggle dengan dua pilihan: "Input Tunggal" dan "Input File / Banyak HS Code"
    - Setiap pilihan menampilkan deskripsi singkat di bawahnya
    - Indikator visual aktif: border dan background berbeda untuk mode aktif
    - Render `SingleInputPanel` jika mode "single", `FileInputPanel` jika mode "file"
    - State `singleInput` dan `fileData` dipertahankan saat toggle (karena masing-masing hook menyimpan state-nya sendiri)
    - _Persyaratan: 1.1, 1.3, 4.1, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.2 Tulis property test untuk mode toggle — state preservation
    - **Properti 11: State dipertahankan saat toggle mode**
    - Untuk semua nilai `singleInput` yang sudah diisi, toggle ke File dan kembali ke Single mempertahankan nilai
    - Untuk semua `fileData` yang sudah diunggah, toggle ke Single dan kembali ke File mempertahankan data
    - **Memvalidasi: Persyaratan 5.3, 5.4**

- [x] 8. Update wiring: `index.js` dan `page.jsx`
  - [x] 8.1 Update `app/presentation/components/index.js`
    - Tambah export: `export { default as CekLartasScanner } from "./features/CekLartasScanner"`
    - Tambah export: `export { default as LartasResultTable } from "./features/LartasResultTable"`
    - Pertahankan export lama `HsCodeScanner` dan `HsCodeTable` untuk backward compatibility (atau hapus jika tidak ada penggunaan lain)
    - _Persyaratan: 1.3, 1.4, 10.5_

  - [x] 8.2 Update `app/cek-lartas/page.jsx`
    - Ganti import `HsCodeScanner` dengan `CekLartasScanner`
    - Update nama komponen di JSX dari `<HsCodeScanner />` ke `<CekLartasScanner />`
    - _Persyaratan: 1.5, 10.6_

- [x] 9. Checkpoint akhir — Pastikan semua tests pass
  - Jalankan semua tests, pastikan tidak ada regresi.
  - Verifikasi halaman `/cek-lartas` berfungsi dengan kedua mode (Single dan File).
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

## Catatan

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan persyaratan spesifik untuk keterlacakan
- Urutan implementasi mengikuti dependency order: parser → hooks → sub-komponen → komponen utama → wiring
- Property tests memvalidasi properti kebenaran universal yang didefinisikan di design document
- `HsCodeScanner.jsx` dan `HsCodeTable.jsx` lama dapat dihapus setelah semua komponen baru berfungsi dan tidak ada referensi lain
