# Requirements: HS Finder

## Introduction

HS Finder adalah alat bantu klasifikasi HS code untuk staf PPJK, customs broker, dan siapa saja yang perlu menentukan kode HS suatu barang. Pengguna mendeskripsikan barang dalam teks bebas atau mengunggah foto barang, lalu sistem menghasilkan rekomendasi HS code 6-digit beserta reasoning lengkap yang mengutip sumber aturan konkret dari knowledge base KUM HS.

Fitur ini berbeda dari `hs-code-classifier` yang sudah ada: alih-alih token matching deterministik, HS Finder menggunakan LLM sebagai reasoning engine dengan file `.md` catatan bab sebagai knowledge base yang bisa diaudit. Setiap kesimpulan harus bisa ditelusuri ke teks aturan yang spesifik.

Fitur ini berdiri sendiri di route `/hs-finder`.

## Glossary

- **KnowledgeBase**: Kumpulan file `.md` catatan bab HS yang tersimpan di `harmonized-system/chapters/`, satu file per bab
- **ChapterNote**: Satu file `.md` yang berisi catatan bab lengkap untuk satu nomor bab HS (e.g., `chapter-84.md`)
- **CoverageStatus**: Status ketersediaan `ChapterNote` untuk suatu bab — `"validated"` jika file ada, `"unvalidated"` jika tidak ada
- **ItemDescription**: Deskripsi barang hasil normalisasi dari input teks atau foto, yang akan digunakan sebagai input klasifikasi
- **CandidateChapters**: Daftar maksimum 5 nomor bab HS yang diidentifikasi LLM sebagai kandidat relevan berdasarkan `ItemDescription`
- **ClassificationResult**: Output akhir sistem berisi HS code 6-digit, reasoning path, dan metadata coverage
- **ReasoningStep**: Satu langkah dalam reasoning path, berisi: langkah apa, aturan mana yang dikutip, dan kesimpulan
- **ReasoningPath**: Urutan `ReasoningStep` dari identifikasi barang hingga penentuan subheading
- **FinderSession**: State satu sesi pencarian dari input pertama hingga hasil ditampilkan

## Requirements

### Requirement 1: Input Teks

**User Story:** Sebagai pengguna, saya ingin mengetikkan deskripsi barang dalam bahasa bebas agar sistem dapat membantu saya menemukan HS code yang tepat.

#### Acceptance Criteria

1. THE Finder SHALL menerima input teks bebas dalam Bahasa Indonesia maupun Bahasa Inggris
2. THE Finder SHALL menerima input dengan panjang minimum 3 karakter dan maksimum 2.000 karakter
3. IF input kurang dari 3 karakter THEN THE Finder SHALL menampilkan pesan error "Deskripsi barang terlalu singkat."
4. IF input melebihi 2.000 karakter THEN THE Finder SHALL menampilkan pesan error "Deskripsi terlalu panjang (maksimum 2.000 karakter)."
5. THE Finder SHALL membersihkan whitespace berlebih pada input sebelum memproses

### Requirement 2: Input Foto

**User Story:** Sebagai pengguna, saya ingin mengunggah foto barang agar sistem dapat mengidentifikasi barang dan melanjutkan ke klasifikasi tanpa saya perlu mengetik deskripsi.

#### Acceptance Criteria

1. THE Finder SHALL menerima upload foto dalam format JPEG, PNG, dan WEBP
2. THE Finder SHALL membatasi ukuran file foto maksimum 5MB
3. IF ukuran file melebihi 5MB THEN THE Finder SHALL menampilkan pesan error "Foto terlalu besar (maksimum 5MB)."
4. IF format file tidak didukung THEN THE Finder SHALL menampilkan pesan error "Format foto tidak didukung. Gunakan JPEG, PNG, atau WEBP."
5. WHEN foto diunggah THE Finder SHALL menggunakan Gemini Vision untuk mengidentifikasi barang dan menghasilkan `ItemDescription` dalam Bahasa Indonesia
6. WHEN identifikasi foto berhasil THE Finder SHALL menampilkan `ItemDescription` hasil identifikasi kepada pengguna sebelum melanjutkan ke klasifikasi, agar pengguna dapat memverifikasi atau mengoreksi
7. THE Finder SHALL memungkinkan pengguna mengedit `ItemDescription` hasil identifikasi foto sebelum memulai klasifikasi

### Requirement 3: Identifikasi Kandidat Bab

**User Story:** Sebagai sistem, saya perlu menentukan bab HS mana yang relevan sebelum melakukan klasifikasi penuh, agar context yang dikirim ke LLM tetap terfokus.

#### Acceptance Criteria

1. WHEN `ItemDescription` tersedia THE Finder SHALL mengidentifikasi kandidat bab menggunakan LLM
2. THE Finder SHALL membatasi jumlah `CandidateChapters` maksimum 5 bab
3. THE Finder SHALL menggunakan `CandidateChapters` sebagai daftar bab yang akan di-load dari `KnowledgeBase`
4. IF tidak ada kandidat bab yang dapat diidentifikasi THEN THE Finder SHALL menampilkan pesan "Deskripsi barang tidak cukup jelas untuk mengidentifikasi bab HS yang relevan. Coba tambahkan detail material, fungsi, atau bentuk barang."

### Requirement 4: Load Knowledge Base

**User Story:** Sebagai sistem, saya perlu memuat catatan bab yang relevan agar LLM dapat membuat keputusan klasifikasi berdasarkan aturan konkret, bukan hanya pengetahuan statistik.

#### Acceptance Criteria

1. THE Finder SHALL membaca file `ChapterNote` dari direktori `harmonized-system/chapters/` untuk setiap bab dalam `CandidateChapters`
2. THE Finder SHALL menentukan `CoverageStatus` untuk setiap bab kandidat: `"validated"` jika file `.md` ada, `"unvalidated"` jika tidak ada
3. IF semua bab kandidat berstatus `"unvalidated"` THEN THE Finder SHALL tetap melanjutkan klasifikasi menggunakan pengetahuan umum LLM, dengan disclaimer yang jelas
4. THE Finder SHALL menyertakan semua `ChapterNote` yang berhasil dimuat ke dalam prompt klasifikasi

### Requirement 5: Klasifikasi dan Reasoning

**User Story:** Sebagai pengguna, saya ingin mendapat rekomendasi HS code beserta penjelasan langkah demi langkah yang mengutip aturan konkret, agar saya dapat memverifikasi dan mempertanggungjawabkan pilihan kode tersebut.

#### Acceptance Criteria

1. THE Finder SHALL mengirim satu LLM call yang berisi: `ItemDescription`, semua `ChapterNote` yang tersedia, dan instruksi untuk menghasilkan reasoning step-by-step
2. THE Finder SHALL menghasilkan `ReasoningPath` yang terdiri dari langkah-langkah berikut secara berurutan:
   - Langkah 1: Identifikasi barang (nama, material, fungsi, bentuk)
   - Langkah 2: Eliminasi bab yang tidak cocok beserta alasan mengutip catatan bab
   - Langkah 3: Konfirmasi bab yang dipilih beserta kutipan catatan bab yang mendukung
   - Langkah 4: Penentuan heading (4-digit) beserta alasan
   - Langkah 5: Penentuan subheading (6-digit) beserta alasan
3. SETIAP langkah dalam `ReasoningPath` yang merujuk ke aturan HARUS menyertakan kutipan teks dari `ChapterNote` yang relevan
4. THE Finder SHALL menghasilkan tepat satu `ClassificationResult` sebagai rekomendasi utama
5. THE Finder SHALL menampilkan `CoverageStatus` per bab di dalam `ReasoningPath`: langkah yang mengacu ke bab `"unvalidated"` diberi label "belum tervalidasi"
6. THE prompt klasifikasi SHALL menyertakan instruksi eksplisit: "Setiap kesimpulan harus mengutip teks spesifik dari catatan bab yang disediakan. Jangan membuat klaim tanpa dasar dari catatan bab."

### Requirement 6: Tampilan Hasil

**User Story:** Sebagai pengguna, saya ingin melihat hasil klasifikasi dan reasoning-nya dalam format yang mudah dibaca dan bisa saya telusuri, agar saya dapat menggunakan hasilnya dengan percaya diri.

#### Acceptance Criteria

1. THE Finder SHALL menampilkan `ClassificationResult` berisi: HS code 6-digit, deskripsi resmi subheading, dan `ReasoningPath`
2. THE `ReasoningPath` SHALL ditampilkan sebagai urutan langkah yang bisa di-expand/collapse per langkah
3. THE Finder SHALL menampilkan badge `CoverageStatus` di setiap langkah reasoning yang mengacu ke catatan bab: "Tervalidasi" (hijau) atau "Belum Tervalidasi" (kuning)
4. IF ada bab kandidat yang berstatus `"unvalidated"` THEN THE Finder SHALL menampilkan disclaimer: "Sebagian analisis menggunakan pengetahuan umum AI, bukan catatan bab yang tervalidasi. Verifikasi ulang sebelum digunakan."
5. THE Finder SHALL menampilkan tombol "Cari Ulang" untuk memulai sesi baru

### Requirement 7: Loading State

**User Story:** Sebagai pengguna, saya ingin tahu proses apa yang sedang berjalan, agar saya tidak merasa sistem berhenti atau tidak responsif.

#### Acceptance Criteria

1. THE Finder SHALL menampilkan indikator loading dengan label status yang berubah sesuai tahap yang sedang berjalan:
   - Saat identifikasi foto: "Mengidentifikasi barang dari foto..."
   - Saat identifikasi kandidat bab: "Mengidentifikasi bab HS yang relevan..."
   - Saat load knowledge base: "Memuat catatan bab..."
   - Saat klasifikasi: "Menganalisis dan mengklasifikasikan..."
2. THE Finder SHALL menonaktifkan semua input saat proses berlangsung untuk mencegah duplikasi request

### Requirement 8: Error Handling

**User Story:** Sebagai pengguna, saya ingin mendapat pesan yang jelas ketika terjadi kesalahan, agar saya tahu langkah selanjutnya.

#### Acceptance Criteria

1. IF Gemini API tidak tersedia THEN THE Finder SHALL menampilkan "Ada masalah dengan sistem AI. Hubungi administrator."
2. IF Gemini API timeout (melebihi 30 detik) THEN THE Finder SHALL menampilkan "Koneksi AI terputus. Silakan coba lagi."
3. IF Gemini menghasilkan respons yang tidak dapat di-parse THEN THE Finder SHALL menampilkan "Respons AI tidak valid. Silakan coba lagi."
4. IF foto tidak dapat diidentifikasi oleh Gemini Vision THEN THE Finder SHALL menampilkan "Foto tidak dapat diidentifikasi. Coba foto yang lebih jelas atau ketik deskripsi barang secara manual."
5. THE Finder SHALL menampilkan semua pesan error dalam Bahasa Indonesia
6. THE Finder SHALL mencatat detail teknis error ke log sistem tanpa menampilkannya kepada pengguna

### Requirement 9: Knowledge Base Management

**User Story:** Sebagai developer, saya ingin sistem knowledge base yang mudah di-maintain, agar catatan bab dapat ditambah dan diperbarui tanpa mengubah kode aplikasi.

#### Acceptance Criteria

1. THE KnowledgeBase SHALL menyimpan file `ChapterNote` di direktori `harmonized-system/chapters/` dengan nama file `chapter-{nn}.md` (e.g., `chapter-84.md`)
2. THE Finder SHALL mendeteksi file `ChapterNote` yang tersedia secara otomatis saat startup tanpa konfigurasi tambahan
3. THE format `ChapterNote` SHALL mengikuti struktur yang konsisten: judul bab, lingkup umum, catatan bab, catatan subpos (jika ada), pengecualian penting, contoh klasifikasi
4. THE Finder SHALL dapat berfungsi dengan knowledge base kosong (nol file `.md`) menggunakan pengetahuan umum LLM sepenuhnya, dengan disclaimer

### Requirement 10: Antarmuka Pengguna

**User Story:** Sebagai pengguna, saya ingin antarmuka yang intuitif dan konsisten dengan halaman lain di aplikasi.

#### Acceptance Criteria

1. THE Finder SHALL berjalan pada halaman `/hs-finder`
2. THE Finder SHALL menampilkan dua mode input secara bersamaan: area teks dan tombol upload foto, tanpa perlu memilih mode terlebih dahulu
3. THE Finder SHALL menggunakan Bahasa Indonesia untuk seluruh teks antarmuka, label, dan pesan
4. THE Finder SHALL menggunakan komponen UI yang konsisten dengan sistem yang ada (Tailwind CSS dan DaisyUI)
5. THE Finder SHALL responsif pada mobile dan desktop
