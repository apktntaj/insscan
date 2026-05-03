# Requirements Document

## Introduction

Fitur ini memperbarui definisi dan penanganan HS code di aplikasi INScann. Ada dua perubahan utama:

1. **Perluasan definisi HS code** — dari hanya 8 digit menjadi 6 digit atau 8 digit. Perubahan ini berdampak pada validasi di domain entity, pesan UI di mode Single Input, dan logika deteksi di mode File/Multiple.

2. **Preview file + deteksi & normalisasi HS code di mode File/Multiple** — setelah user upload file Excel, sistem menampilkan preview isi file, mendeteksi kolom yang kemungkinan berisi HS code (kolom numerik), memeriksa apakah ada nilai yang tidak sesuai definisi (bukan 6 atau 8 digit), dan jika ada, menampilkan dialog normalisasi sebelum proses fetch dimulai.

## Glossary

- **HS Code**: Harmonized System code — kode numerik 6 digit atau 8 digit yang mengidentifikasi komoditas dalam sistem tarif bea cukai internasional.
- **HsCodeValidator**: Modul di `app/core/entities/hs-code.js` yang bertanggung jawab memvalidasi format HS code.
- **HsCodeScanner**: Komponen React di `app/presentation/components/features/HsCodeScanner.jsx` yang menyediakan antarmuka pencarian HS code.
- **FilePreview**: Tampilan tabel yang menampilkan isi file Excel sebelum proses fetch dijalankan.
- **NumericColumn**: Kolom dalam file Excel di mana lebih dari 50% sel non-kosong mengandung setidaknya satu digit angka (setelah whitespace di-trim). Sel yang mengandung karakter non-numerik (selain spasi/tab) tetap dihitung dalam threshold dan dianggap sebagai typo user — sel tersebut ditandai sebagai "dirty" dan karakter non-digitnya akan di-strip saat proses fetch, bukan mendiskualifikasi kolom.
- **NormalizationDialog**: Dialog modal yang meminta user memilih target digit normalisasi (6 atau 8).
- **Normalization**: Proses menyesuaikan panjang digit suatu kode numerik ke target tertentu — memotong dari kanan jika lebih panjang, menambahkan "0" di kanan jika lebih pendek.
- **ExcelService**: Modul di `app/infrastructure/excel/excel.service.js` yang menangani parsing file Excel menjadi array 2D.

---

## Requirements

### Requirement 1: Perluasan Definisi HS Code

**User Story:** Sebagai staf operasional PPJK, saya ingin sistem menerima HS code 6 digit maupun 8 digit sebagai input yang valid, sehingga saya dapat memproses komoditas yang hanya memiliki kode 6 digit tanpa mendapat pesan error yang menyesatkan.

#### Acceptance Criteria

1. THE **HsCodeValidator** SHALL menerima string yang terdiri dari tepat 6 digit angka sebagai HS code yang valid.
2. THE **HsCodeValidator** SHALL menerima string yang terdiri dari tepat 8 digit angka sebagai HS code yang valid.
3. WHEN nilai yang diberikan ke **HsCodeValidator** bukan 6 digit angka dan bukan 8 digit angka, THEN THE **HsCodeValidator** SHALL mengembalikan `false`.
4. WHEN user memasukkan input di mode Single Input yang bukan 6 digit dan bukan 8 digit angka, THEN THE **HsCodeScanner** SHALL menampilkan pesan "Masukkan HS code 6 atau 8 digit yang valid."
5. THE **HsCodeScanner** SHALL menampilkan teks deskripsi di mode Single Input yang menyebutkan "6 atau 8 digit" sebagai format yang diterima.

---

### Requirement 2: Preview Isi File Excel

**User Story:** Sebagai staf operasional PPJK, saya ingin melihat preview isi file Excel setelah upload dan sebelum menekan tombol "Tarik Data", sehingga saya dapat memverifikasi bahwa file yang diupload sudah benar sebelum proses fetch dimulai.

#### Acceptance Criteria

1. WHEN user mengupload file Excel yang valid di mode File/Multiple, THE **HsCodeScanner** SHALL menampilkan preview isi file dalam bentuk tabel sebelum tombol "Tarik Data" ditekan.
2. WHILE preview ditampilkan, THE **HsCodeScanner** SHALL menampilkan maksimal 10 baris pertama dari file untuk menjaga performa rendering.
3. WHILE preview ditampilkan, THE **HsCodeScanner** SHALL menampilkan header kolom dari baris pertama file jika tersedia.
4. WHEN file baru diupload, THE **HsCodeScanner** SHALL mengganti preview sebelumnya dengan preview file baru.
5. WHEN user belum mengupload file, THE **HsCodeScanner** SHALL tidak menampilkan area preview.

---

### Requirement 3: Deteksi Kolom Numerik

**User Story:** Sebagai staf operasional PPJK, saya ingin sistem secara otomatis mendeteksi kolom yang kemungkinan berisi HS code di file Excel saya, sehingga saya tidak perlu menentukan kolom secara manual.

#### Acceptance Criteria

1. WHEN file Excel diparse, THE **HsCodeScanner** SHALL mengidentifikasi kolom sebagai **NumericColumn** jika lebih dari 50% sel non-kosong di kolom tersebut mengandung setidaknya satu digit angka (setelah whitespace di-trim) — sel yang mengandung karakter non-numerik tetap dihitung dalam threshold dan tidak mendiskualifikasi kolom.
2. WHEN **NumericColumn** teridentifikasi, THE **HsCodeScanner** SHALL memeriksa apakah nilai-nilai di kolom tersebut sesuai dengan definisi HS code (6 atau 8 digit).
3. IF tidak ada **NumericColumn** yang teridentifikasi di file, THEN THE **HsCodeScanner** SHALL menampilkan pesan bahwa tidak ada kolom HS code yang terdeteksi dan tetap mengizinkan user menekan tombol "Tarik Data".
4. THE **HsCodeScanner** SHALL memeriksa semua kolom dalam file, bukan hanya kolom pertama.
5. WHEN preview ditampilkan dan **NumericColumn** terdeteksi mengandung sel dengan karakter non-numerik (selain spasi/tab), THE **HsCodeScanner** SHALL menandai sel tersebut secara visual dan menampilkan keterangan bahwa karakter non-numerik akan dihapus otomatis saat proses fetch.

---

### Requirement 4: Dialog Normalisasi HS Code

**User Story:** Sebagai staf operasional PPJK, saya ingin diberi pilihan untuk menormalisasi HS code yang tidak sesuai format sebelum proses fetch, sehingga saya dapat memastikan semua kode diproses dengan benar tanpa harus mengedit file secara manual.

#### Acceptance Criteria

1. WHEN file Excel diupload dan **NumericColumn** terdeteksi mengandung nilai yang panjang digitnya bukan 6 dan bukan 8, THEN THE **HsCodeScanner** SHALL menampilkan **NormalizationDialog** secara otomatis sebelum tombol "Tarik Data" dapat digunakan.
2. WHEN **NormalizationDialog** ditampilkan, THE **HsCodeScanner** SHALL menginformasikan jumlah kode yang perlu dinormalisasi kepada user.
3. WHEN user memilih normalisasi ke 6 digit di **NormalizationDialog**, THE **HsCodeScanner** SHALL memotong setiap kode dari kanan hingga tersisa 6 digit jika kode lebih dari 6 digit, dan menambahkan "0" di kanan hingga mencapai 6 digit jika kode kurang dari 6 digit.
4. WHEN user memilih normalisasi ke 8 digit di **NormalizationDialog**, THE **HsCodeScanner** SHALL memotong setiap kode dari kanan hingga tersisa 8 digit jika kode lebih dari 8 digit, dan menambahkan "0" di kanan hingga mencapai 8 digit jika kode kurang dari 8 digit.
5. WHEN user memilih normalisasi dan mengkonfirmasi, THE **HsCodeScanner** SHALL menggabungkan kode yang sudah valid dengan kode yang sudah dinormalisasi, lalu mengaktifkan tombol "Tarik Data".
6. WHILE normalisasi belum diselesaikan oleh user (NormalizationDialog masih terbuka atau sudah dibatalkan), THE **HsCodeScanner** SHALL menonaktifkan tombol "Tarik Data" sehingga proses fetch tidak dapat dimulai.
7. WHEN user membatalkan **NormalizationDialog**, THE **HsCodeScanner** SHALL menutup dialog dan tombol "Tarik Data" tetap dalam kondisi nonaktif sampai user menyelesaikan normalisasi atau mengupload file baru.
8. IF semua nilai di **NumericColumn** sudah sesuai definisi HS code (6 atau 8 digit), THEN THE **HsCodeScanner** SHALL tidak menampilkan **NormalizationDialog** dan tombol "Tarik Data" langsung diaktifkan.
9. THE **NormalizationDialog** SHALL dapat diakses dengan keyboard (tombol Escape untuk batal, Enter untuk konfirmasi pilihan yang difokus).

---

### Requirement 5: Konsistensi Normalisasi

**User Story:** Sebagai staf operasional PPJK, saya ingin hasil normalisasi konsisten dan dapat diprediksi, sehingga saya tahu persis kode apa yang akan dikirim ke API.

#### Acceptance Criteria

1. WHEN normalisasi memotong kode yang lebih panjang, THE **HsCodeScanner** SHALL selalu memotong dari sisi kanan (mempertahankan digit paling kiri).
2. WHEN normalisasi menambah digit pada kode yang lebih pendek, THE **HsCodeScanner** SHALL selalu menambahkan karakter "0" di sisi kanan.
3. THE **HsCodeScanner** SHALL men-strip semua karakter non-digit dari nilai sel sebelum normalisasi dilakukan — hanya digit angka yang dipertahankan, dan panjang kode ditentukan dari jumlah digit yang tersisa setelah proses strip.
4. WHEN kode hasil normalisasi sudah memiliki panjang yang sesuai target, THE **HsCodeScanner** SHALL tidak mengubah kode tersebut.
