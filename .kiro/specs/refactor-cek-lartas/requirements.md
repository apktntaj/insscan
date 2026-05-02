# Dokumen Persyaratan

## Pendahuluan

Halaman **Cek Lartas** (`/cek-lartas`) adalah salah satu menu Pesisir yang memungkinkan staf operasional PPJK dan freight forwarder memeriksa status LARTAS (Larangan dan Pembatasan) untuk satu atau banyak HS code sekaligus melalui INSW API.

Saat ini komponen utama `CekLartasScanner.jsx` (sebelumnya `HsCodeScanner.jsx`) memiliki ~797 baris yang mencampur logika fetch/streaming, state management, dan UI dalam satu file. Refactor ini bertujuan memisahkan concerns tersebut, meningkatkan UX, dan menambahkan fitur kecil yang berguna — tanpa mengubah fungsionalitas inti yang sudah berjalan.

Ruang lingkup refactor mencakup:
1. **Rename komponen** — nama komponen disesuaikan dengan konteks fitur Cek Lartas, menggantikan penamaan lama dari era INScann
2. **Pemisahan concerns** — logika fetch/streaming dipindahkan ke custom hooks, komponen UI dipecah menjadi unit yang lebih kecil
3. **UX improvements** — feedback error yang lebih jelas, mode toggle yang lebih intuitif, progress panel yang lebih informatif
4. **Fitur tambahan kecil** — copy HS code, export hasil Single ke Excel
5. **Maintainability** — struktur file yang mengikuti Clean Architecture yang sudah ada di proyek

---

## Glosarium

- **Cek Lartas**: Nama fitur dan halaman (`/cek-lartas`) di Pesisir untuk memeriksa status LARTAS suatu HS code
- **HS Code**: Harmonized System Code — kode 8 digit untuk klasifikasi barang impor/ekspor
- **LARTAS**: Larangan dan Pembatasan — regulasi impor/ekspor yang berlaku untuk suatu HS code
- **Dokumen Pabean**: Dokumen resmi kepabeanan (PIB, PEB, dll.) yang terkait dengan LARTAS
- **Mode Single**: Mode input satu HS code, hasil ditampilkan sebagai card
- **Mode File**: Mode upload Excel berisi banyak HS code, hasil ditampilkan sebagai tabel matriks LARTAS
- **Streaming Progress**: Mekanisme fetch serial dengan adaptive chunking yang mengirim update progres secara real-time
- **Chunk**: Kelompok HS code yang diproses dalam satu request ke API
- **CekLartasScanner**: Komponen React utama yang mengelola kedua mode input (rename dari `HsCodeScanner`)
- **LartasResultTable**: Komponen React yang menampilkan tabel matriks LARTAS hasil mode File (rename dari `HsCodeTable`)
- **SingleResultCard**: Komponen yang menampilkan hasil mode Single dalam bentuk card
- **ProgressPanel**: Komponen yang menampilkan progres streaming mode File
- **useCekLartasSingle**: Custom hook untuk logika fetch mode Single (rename dari `useHsCodeSingle`)
- **useCekLartasFile**: Custom hook untuk logika fetch/streaming mode File (rename dari `useHsCodeFile`)
- **LartasDocModal**: Modal detail regulasi LARTAS per dokumen pabean

---

## Persyaratan

### Persyaratan 1: Rename Komponen ke Konteks Cek Lartas

**User Story:** Sebagai developer, saya ingin nama komponen dan hook mencerminkan konteks fitur Cek Lartas — bukan penamaan lama dari era INScann — agar codebase lebih mudah dipahami oleh developer baru.

#### Kriteria Penerimaan

1. THE `HsCodeScanner` Component SHALL direname menjadi `CekLartasScanner` di semua file yang relevan.
2. THE `HsCodeTable` Component SHALL direname menjadi `LartasResultTable` di semua file yang relevan.
3. THE `CekLartasScanner` Component SHALL tetap diekspor dari `app/presentation/components/index.js` dengan nama baru `CekLartasScanner`.
4. THE `LartasResultTable` Component SHALL tetap diekspor dari `app/presentation/components/index.js` dengan nama baru `LartasResultTable`.
5. THE `app/cek-lartas/page.jsx` SHALL diperbarui untuk mengimpor `CekLartasScanner` menggantikan `HsCodeScanner`.
6. WHEN rename dilakukan, THE Refactored_Code SHALL tidak mengubah fungsionalitas apapun — hanya perubahan nama.

---

### Persyaratan 2: Pemisahan Logika Fetch Mode Single ke Custom Hook

**User Story:** Sebagai developer, saya ingin logika fetch mode Single dipisahkan ke custom hook `useCekLartasSingle`, agar komponen UI tidak mengandung logika bisnis dan lebih mudah diuji secara terpisah.

#### Kriteria Penerimaan

1. THE `useCekLartasSingle` Hook SHALL mengelola state `singleInput`, `singleResult`, `singleStatus`, dan `isSingleLoading` secara terpusat.
2. THE `useCekLartasSingle` Hook SHALL mengekspos fungsi `handleFetch` yang memanggil endpoint `/api/hs-code` dengan HS code yang diinput.
3. WHEN `handleFetch` dipanggil dengan input yang bukan 8 digit angka, THE `useCekLartasSingle` Hook SHALL mengembalikan status error `"HS code harus 8 digit angka."` tanpa melakukan request ke API.
4. WHEN request ke `/api/hs-code` berhasil, THE `useCekLartasSingle` Hook SHALL memperbarui `singleResult` dengan data pertama dari respons array.
5. IF request ke `/api/hs-code` gagal dengan status HTTP non-2xx, THEN THE `useCekLartasSingle` Hook SHALL memperbarui `singleStatus` dengan pesan error yang menyertakan kode status HTTP.
6. IF request ke `/api/hs-code` gagal karena network error, THEN THE `useCekLartasSingle` Hook SHALL memperbarui `singleStatus` dengan pesan `"Gagal terhubung ke server. Periksa koneksi internet Anda."`.
7. THE `useCekLartasSingle` Hook SHALL mengekspos fungsi `handleCopy` yang menyalin HS code hasil ke clipboard dan memperbarui `singleStatus` dengan konfirmasi `"HS code disalin ke clipboard."`.
8. WHEN `handleCopy` dipanggil dan Clipboard API tidak tersedia di browser, THE `useCekLartasSingle` Hook SHALL memperbarui `singleStatus` dengan pesan `"Salin tidak didukung di browser ini."`.

---

### Persyaratan 3: Pemisahan Logika Streaming Mode File ke Custom Hook

**User Story:** Sebagai developer, saya ingin logika fetch/streaming mode File dipisahkan ke custom hook `useCekLartasFile`, agar komponen UI tidak mengandung logika adaptive chunking dan lebih mudah diuji secara terpisah.

#### Kriteria Penerimaan

1. THE `useCekLartasFile` Hook SHALL mengelola state `fileData`, `resultData`, `status`, `isLoading`, dan `progress` secara terpusat.
2. THE `useCekLartasFile` Hook SHALL mengekspos fungsi `handleFileChange` yang membaca file Excel dan memperbarui `fileData`.
3. IF file yang diunggah bukan berekstensi `.xls` atau `.xlsx`, THEN THE `useCekLartasFile` Hook SHALL memperbarui `status` dengan pesan error `"File harus berformat .xls atau .xlsx."` tanpa memperbarui `fileData`.
4. IF file Excel tidak mengandung HS code 8 digit yang valid, THEN THE `useCekLartasFile` Hook SHALL memperbarui `status` dengan pesan `"Tidak ada HS code valid ditemukan di file."`.
5. THE `useCekLartasFile` Hook SHALL mengekspos fungsi `handleFetch` yang menjalankan proses streaming serial dengan adaptive chunking ke endpoint `/api/hs-code/progress`.
6. WHILE proses streaming berjalan, THE `useCekLartasFile` Hook SHALL memperbarui state `progress` setiap kali satu HS code selesai diproses.
7. IF chunk request gagal melebihi `MAX_CHUNK_ATTEMPTS`, THEN THE `useCekLartasFile` Hook SHALL menurunkan ukuran chunk dan melanjutkan proses dari posisi terakhir yang berhasil.
8. IF proses streaming berhenti sebelum selesai namun sebagian data sudah diterima, THEN THE `useCekLartasFile` Hook SHALL memperbarui `resultData` dengan data parsial dan memperbarui `status` dengan pesan yang menyebutkan jumlah data parsial yang berhasil ditampilkan.
9. IF proses streaming gagal total tanpa data parsial, THEN THE `useCekLartasFile` Hook SHALL memperbarui `status` dengan pesan error yang jelas dan mengatur `isLoading` ke `false`.
10. THE `useCekLartasFile` Hook SHALL mengekspos fungsi `handleExportResult` yang mengunduh `resultData` sebagai file Excel menggunakan `downloadAsExcel` dari `excel.service.js`.
11. WHEN `handleExportResult` dipanggil saat `resultData` kosong atau null, THE `useCekLartasFile` Hook SHALL tidak melakukan aksi apapun.

---

### Persyaratan 4: Pemecahan Komponen CekLartasScanner

**User Story:** Sebagai developer, saya ingin `CekLartasScanner.jsx` dipecah menjadi komponen-komponen yang lebih kecil dan terfokus, agar setiap file memiliki tanggung jawab tunggal dan lebih mudah dipahami.

#### Kriteria Penerimaan

1. THE `CekLartasScanner` Component SHALL hanya bertanggung jawab merender mode toggle dan mendelegasikan rendering ke `SingleInputPanel` atau `FileInputPanel` sesuai mode aktif.
2. THE `SingleInputPanel` Component SHALL merender form input tunggal, tombol aksi, status text, dan `SingleResultCard` — menggunakan state dari `useCekLartasSingle`.
3. THE `FileInputPanel` Component SHALL merender form upload file, tombol aksi, status text, `ProgressPanel`, dan `LartasResultTable` — menggunakan state dari `useCekLartasFile`.
4. THE `ProgressPanel` Component SHALL menerima props `progress` dan `isLoading` dan hanya bertanggung jawab merender tampilan progres.
5. THE `SingleResultCard` Component SHALL menerima props `row` dan `onCopy` dan hanya bertanggung jawab merender card hasil mode Single.
6. THE `LartasDocModal` Component SHALL dipindahkan ke file terpisah dan menerima props `cell` dan `onClose`.
7. THE `CekLartasScanner` Component SHALL diekspor sebagai default export dari `CekLartasScanner.jsx`.

---

### Persyaratan 5: Mode Toggle yang Lebih Intuitif

**User Story:** Sebagai pengguna, saya ingin mode toggle antara Single Input dan File/Multiple lebih mudah dipahami, agar saya tidak bingung memilih mode yang tepat untuk kebutuhan saya.

#### Kriteria Penerimaan

1. THE Mode_Toggle Component SHALL menampilkan dua pilihan: "Input Tunggal" dan "Input File / Banyak HS Code".
2. THE Mode_Toggle Component SHALL menampilkan deskripsi singkat di bawah setiap pilihan yang menjelaskan kapan mode tersebut digunakan.
3. WHEN pengguna beralih dari mode File ke mode Single, THE Mode_Toggle Component SHALL mempertahankan nilai `singleInput` yang sudah diisi sebelumnya.
4. WHEN pengguna beralih dari mode Single ke mode File, THE Mode_Toggle Component SHALL mempertahankan `fileData` yang sudah diunggah sebelumnya.
5. THE Mode_Toggle Component SHALL menampilkan indikator visual yang jelas (border aktif, background berbeda) pada mode yang sedang aktif.

---

### Persyaratan 6: Feedback Error yang Lebih Jelas

**User Story:** Sebagai pengguna, saya ingin mendapatkan pesan error yang jelas dan spesifik ketika terjadi masalah, agar saya tahu apa yang salah dan langkah apa yang harus diambil.

#### Kriteria Penerimaan

1. THE `SingleInputPanel` Component SHALL menampilkan pesan error dalam komponen `Alert` dengan `variant="error"` — bukan hanya teks biasa — ketika fetch gagal.
2. THE `FileInputPanel` Component SHALL menampilkan pesan error dalam komponen `Alert` dengan `variant="error"` ketika proses streaming gagal total.
3. WHEN proses streaming berhenti parsial, THE `FileInputPanel` Component SHALL menampilkan pesan peringatan dalam komponen `Alert` dengan `variant="warning"` yang menyebutkan jumlah data yang berhasil dan jumlah yang gagal.
4. THE `SingleInputPanel` Component SHALL menampilkan pesan sukses dalam komponen `Alert` dengan `variant="success"` ketika data berhasil ditampilkan.
5. IF input HS code di mode Single tidak valid, THEN THE `SingleInputPanel` Component SHALL menampilkan pesan validasi inline di bawah field input — bukan menggunakan `alert()` browser.
6. IF file yang diunggah bukan format Excel, THEN THE `FileInputPanel` Component SHALL menampilkan pesan validasi inline di bawah input file — bukan menggunakan `alert()` browser.

---

### Persyaratan 7: Fitur Salin HS Code di Mode Single

**User Story:** Sebagai pengguna, saya ingin bisa menyalin HS code hasil pencarian dengan satu klik, agar saya bisa langsung menggunakannya di sistem lain tanpa mengetik ulang.

#### Kriteria Penerimaan

1. THE `SingleResultCard` Component SHALL menampilkan tombol "Salin HS Code" di sebelah tampilan HS code hasil.
2. WHEN tombol "Salin HS Code" diklik, THE `SingleResultCard` Component SHALL menyalin nilai HS code (8 digit tanpa titik) ke clipboard.
3. WHEN penyalinan berhasil, THE `SingleResultCard` Component SHALL menampilkan konfirmasi visual sementara (misalnya teks tombol berubah menjadi "Tersalin!") selama 2 detik sebelum kembali ke teks semula.
4. IF Clipboard API tidak tersedia, THEN THE `SingleResultCard` Component SHALL menampilkan pesan error inline bahwa fitur salin tidak didukung.

---

### Persyaratan 8: Fitur Export Hasil Mode Single ke Excel

**User Story:** Sebagai pengguna, saya ingin bisa mengekspor hasil pencarian mode Single ke file Excel, agar saya bisa menyimpan dan berbagi data LARTAS dengan rekan kerja.

#### Kriteria Penerimaan

1. THE `SingleResultCard` Component SHALL menampilkan tombol "Ekspor ke Excel" ketika data hasil tersedia.
2. WHEN tombol "Ekspor ke Excel" diklik, THE `SingleResultCard` Component SHALL mengunduh file Excel dengan nama `lartas-{hsCode}-{tanggal}.xlsx`.
3. THE Excel_Export Function SHALL menyertakan kolom: HS Code, Kategori LARTAS (Impor Border / Impor Post Border / Ekspor Border), Nama Izin, No SKEP, ID Dokumen, Dokumen Pabean, Tanggal Mulai, Tanggal Akhir.
4. IF hasil tidak memiliki data LARTAS, THEN THE Excel_Export Function SHALL tetap mengekspor file dengan satu baris yang menyatakan "Tidak ada LARTAS" untuk HS code tersebut.
5. THE Excel_Export Function SHALL menggunakan fungsi `downloadAsExcel` yang sudah ada di `app/infrastructure/excel/excel.service.js`.

---

### Persyaratan 9: Progress Panel yang Lebih Informatif

**User Story:** Sebagai pengguna, saya ingin progress panel menampilkan informasi yang lebih mudah dipahami selama proses fetch berlangsung, agar saya tahu persis apa yang sedang terjadi dan berapa lama lagi prosesnya.

#### Kriteria Penerimaan

1. THE `ProgressPanel` Component SHALL menampilkan persentase progres dalam format angka (misalnya "45%") di samping progress bar.
2. THE `ProgressPanel` Component SHALL menampilkan jumlah HS code yang sudah diproses dan total dalam format "X dari Y HS code".
3. THE `ProgressPanel` Component SHALL menampilkan estimasi waktu selesai (ETA) dalam format jam lokal Indonesia (WIB/WITA/WIT tidak perlu ditampilkan, cukup HH:MM:SS).
4. THE `ProgressPanel` Component SHALL menampilkan durasi berjalan yang diperbarui setiap detik selama proses aktif.
5. WHEN proses selesai, THE `ProgressPanel` Component SHALL menampilkan ringkasan: durasi aktual, selisih vs ETA, dan jumlah total HS code yang berhasil diproses.
6. THE `ProgressPanel` Component SHALL menampilkan log aktivitas terbaru (maksimal 10 entri terakhir) dalam area scrollable.
7. WHEN ukuran chunk berubah (naik atau turun) akibat adaptive chunking, THE `ProgressPanel` Component SHALL menampilkan notifikasi perubahan chunk di area log.

---

### Persyaratan 10: Maintainability — Struktur File

**User Story:** Sebagai developer, saya ingin komponen-komponen hasil refactor diorganisir dalam struktur folder yang konsisten dengan arsitektur proyek, agar mudah ditemukan dan dipelihara.

#### Kriteria Penerimaan

1. THE Refactored_Components SHALL ditempatkan dalam subfolder `app/presentation/components/features/cek-lartas/` untuk mengelompokkan semua komponen terkait fitur ini.
2. THE `useCekLartasSingle` Hook dan `useCekLartasFile` Hook SHALL ditempatkan di `app/presentation/hooks/` sesuai konvensi hooks yang sudah ada.
3. THE `CekLartasScanner.jsx` SHALL berada di `app/presentation/components/features/` sebagai entry point komponen dan mengimpor sub-komponen dari subfolder `cek-lartas/`.
4. THE `LartasResultTable.jsx` SHALL berada di `app/presentation/components/features/` karena sudah memiliki ukuran yang wajar dan tidak perlu dipindahkan ke subfolder.
5. THE `app/presentation/components/index.js` SHALL diperbarui dengan nama ekspor baru (`CekLartasScanner`, `LartasResultTable`).
6. THE `app/cek-lartas/page.jsx` SHALL diperbarui untuk mengimpor `CekLartasScanner` dari index.

---

### Persyaratan 11: Parsing Data API yang Terpusat

**User Story:** Sebagai developer, saya ingin semua data yang masuk dari API INSW diparse di satu tempat yang terdefinisi, agar tidak ada pengecekan field yang tersebar di seluruh komponen UI.

#### Kriteria Penerimaan

1. THE `useCekLartasSingle` Hook SHALL memanggil fungsi parser terpusat `parseHsCodeApiResponse` sebelum menyimpan data ke state `singleResult`.
2. THE `useCekLartasFile` Hook SHALL memanggil fungsi parser terpusat `parseHsCodeApiResponse` untuk setiap baris data yang diterima dari stream sebelum disimpan ke `resultData`.
3. THE `parseHsCodeApiResponse` Function SHALL mengembalikan shape `{ ok: true, data: LartasResult }` jika data valid, atau `{ ok: false, error: string }` jika data tidak valid atau field wajib tidak ada.
4. IF `parseHsCodeApiResponse` mengembalikan `{ ok: false }`, THEN THE Hook SHALL mencatat error ke console dan menggunakan nilai default yang aman (field kosong/null) — tidak melempar exception.
5. THE `parseHsCodeApiResponse` Function SHALL ditempatkan di `app/adapters/presenters/hs-code.presenter.js` yang sudah ada, mengikuti pola adapter yang sudah digunakan di proyek.
