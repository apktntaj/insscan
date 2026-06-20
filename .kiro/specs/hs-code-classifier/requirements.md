# Requirements Document

## Introduction

Fitur HS Code Classifier membantu pengguna (staf PPJK) dalam dua mode yang berbeda:

**Mode Finder**: Pengguna mendeskripsikan barang dalam teks bebas, sistem menemukan kandidat HS code 6-digit yang paling relevan beserta reasoning path yang transparan.

**Mode Quiz**: LLM memberikan deskripsi barang kepada pengguna, pengguna menebak kode HS-nya, lalu sistem menampilkan jawaban benar/salah beserta reasoning path. Mode ini dirancang untuk membantu staf PPJK belajar dan melatih kemampuan klasifikasi HS code.

Pada kedua mode, proses pencarian HS code menggunakan engine deterministik yang sama: tree traversal berbasis weighted token matching pada data `harmonized-system.csv`. LLM (Gemini) hanya terlibat untuk memahami teks bebas dan mengekstrak atribut terstruktur — tidak pernah untuk menentukan HS code secara langsung.

Referensi yang digunakan adalah HS code internasional 6-digit (bukan kode Indonesia 8/10 digit).

## Glossary

- **Classifier**: Sistem keseluruhan yang menerima deskripsi barang dan menghasilkan kandidat HS code
- **Finder_Mode**: Mode di mana pengguna mendeskripsikan barang dan sistem mencari HS code yang sesuai
- **Quiz_Mode**: Mode di mana LLM memberikan deskripsi barang, pengguna menebak HS code, dan sistem mengevaluasi jawaban
- **Quiz_Item**: Satu soal dalam Quiz_Mode, berisi deskripsi barang yang dihasilkan LLM beserta jawaban HS code yang benar hasil Classification_Engine
- **Quiz_Answer**: Jawaban HS code 6-digit yang diinput pengguna dalam Quiz_Mode
- **Quiz_Result**: Hasil evaluasi Quiz_Answer: benar atau salah, beserta Reasoning_Path dari jawaban yang benar
- **Attribute_Extractor**: Komponen berbasis LLM (Gemini) yang mengekstrak atribut terstruktur dari deskripsi teks bebas
- **Item_Attributes**: Kumpulan atribut terstruktur hasil ekstraksi, berisi: itemName, material, origin, function, intendedUse, processingState, technicalSpecs, form
- **HS_Tree**: Struktur hierarki HS code yang di-load dari `harmonized-system.csv`, terdiri dari 4 level: Section → Chapter → Heading → Subheading
- **Classification_Engine**: Engine deterministik yang melakukan tree traversal pada HS_Tree menggunakan Item_Attributes, tanpa keterlibatan LLM
- **Token_Matcher**: Komponen dalam Classification_Engine yang menghitung weighted token match score antara Item_Attributes dan deskripsi node HS code
- **HS_Candidate**: Hasil klasifikasi berupa HS code 6-digit beserta confidence score dan reasoning path
- **Reasoning_Path**: Jejak traversal Section → Chapter → Heading → Subheading beserta skor di tiap level
- **Confidence_Score**: Nilai numerik (0.0–1.0) yang merepresentasikan tingkat keyakinan match antara Item_Attributes dan node HS code
- **Confidence_Threshold**: Nilai minimum Confidence_Score agar suatu HS_Candidate ditampilkan kepada pengguna
- **Conversation_Turn**: Satu siklus tanya-jawab antara Attribute_Extractor dan pengguna dalam proses klarifikasi
- **Clarification_Question**: Pertanyaan yang dihasilkan Attribute_Extractor ketika deskripsi barang ambigu atau atribut tidak cukup lengkap
- **Session**: Satu sesi klasifikasi dari input pertama hingga hasil ditampilkan, dapat mencakup beberapa Conversation_Turn
- **Gemini_Service**: Layanan infrastruktur yang berkomunikasi dengan Google Gemini API, sudah ada di `app/infrastructure/services/gemini.service.js`

## Requirements

### Requirement 1: Pemilihan Mode

**User Story:** Sebagai staf PPJK, saya ingin memilih antara mode pencarian HS code dan mode latihan, agar saya bisa menggunakan fitur sesuai kebutuhan saya saat itu.

#### Acceptance Criteria

1. THE Classifier SHALL menampilkan pilihan dua mode di halaman utama: "Finder" (cari HS code) dan "Quiz" (latihan tebak HS code)
2. WHEN pengguna memilih Finder_Mode, THE Classifier SHALL menampilkan antarmuka input deskripsi barang
3. WHEN pengguna memilih Quiz_Mode, THE Classifier SHALL memulai sesi Quiz dengan Quiz_Item pertama
4. THE Classifier SHALL memungkinkan pengguna berpindah mode kapan saja dengan memulai ulang sesi

### Requirement 2: Input Deskripsi Barang (Finder Mode)

**User Story:** Sebagai staf PPJK, saya ingin mengetikkan deskripsi barang dalam bahasa bebas, agar saya tidak perlu tahu struktur kode HS terlebih dahulu.

#### Acceptance Criteria

1. THE Classifier SHALL menerima input deskripsi barang berupa teks bebas dalam Bahasa Indonesia maupun Bahasa Inggris
2. THE Classifier SHALL menerima deskripsi dengan panjang minimum 3 karakter dan maksimum 2.000 karakter
3. IF deskripsi kurang dari 3 karakter, THEN THE Classifier SHALL menampilkan pesan kesalahan "Deskripsi barang terlalu singkat. Mohon berikan keterangan lebih detail."
4. IF deskripsi melebihi 2.000 karakter, THEN THE Classifier SHALL menampilkan pesan kesalahan "Deskripsi terlalu panjang (maksimum 2.000 karakter)."
5. THE Classifier SHALL membersihkan whitespace berlebih pada input sebelum memproses deskripsi

### Requirement 3: Ekstraksi Atribut Terstruktur via LLM

**User Story:** Sebagai staf PPJK, saya ingin sistem memahami deskripsi barang saya secara otomatis, agar atribut-atribut penting untuk klasifikasi HS code dapat diidentifikasi tanpa perlu mengisi form terstruktur secara manual.

#### Acceptance Criteria

1. WHEN pengguna mengirimkan deskripsi barang, THE Attribute_Extractor SHALL mengekstrak atribut-atribut berikut dari deskripsi: `itemName`, `material`, `origin`, `function`, `intendedUse`, `processingState`, `technicalSpecs`, dan `form`
2. THE Attribute_Extractor SHALL menggunakan Gemini_Service untuk melakukan ekstraksi atribut
3. THE Attribute_Extractor SHALL mengirimkan prompt yang secara eksplisit melarang LLM menyarankan HS code secara langsung
4. WHEN Gemini_Service mengembalikan respons, THE Attribute_Extractor SHALL mem-parsing respons JSON menjadi Item_Attributes
5. THE Attribute_Extractor SHALL menerima nilai `null` untuk atribut yang tidak dapat diekstrak dari deskripsi
6. THE Attribute_Extractor SHALL menentukan apakah Item_Attributes sudah cukup lengkap untuk dilanjutkan ke fase klasifikasi
7. IF Item_Attributes tidak mencukupi untuk klasifikasi (terlalu banyak atribut null pada field kritis: `itemName`, `material`, `origin`, `function`), THEN THE Attribute_Extractor SHALL menghasilkan Clarification_Question untuk pengguna

### Requirement 4: Multi-Turn Clarification

**User Story:** Sebagai staf PPJK, saya ingin sistem bertanya ketika deskripsi saya kurang jelas, agar hasil klasifikasi menjadi lebih akurat tanpa saya perlu tahu atribut mana yang kurang.

#### Acceptance Criteria

1. WHEN Attribute_Extractor menentukan deskripsi ambigu, THE Classifier SHALL memasuki mode klarifikasi dan menampilkan Clarification_Question kepada pengguna
2. THE Clarification_Question SHALL ditulis dalam Bahasa Indonesia yang natural dan mudah dipahami pengguna non-teknis
3. WHEN pengguna memberikan jawaban klarifikasi, THE Attribute_Extractor SHALL menggabungkan jawaban dengan atribut sebelumnya dan memperbarui Item_Attributes
4. THE Classifier SHALL membatasi jumlah Conversation_Turn klarifikasi maksimum 3 kali per Session
5. WHEN jumlah Conversation_Turn mencapai batas maksimum, THE Classifier SHALL melanjutkan ke fase klasifikasi menggunakan Item_Attributes terbaik yang tersedia meskipun belum lengkap
6. THE Attribute_Extractor SHALL menyertakan konteks conversation history (seluruh Conversation_Turn sebelumnya) saat melakukan panggilan ke Gemini_Service

### Requirement 5: Klasifikasi Deterministik via Tree Traversal

**User Story:** Sebagai staf PPJK, saya ingin proses pencarian HS code dapat diaudit dan tidak bergantung pada "tebakan" AI, agar saya dapat mempertanggungjawabkan HS code yang dipilih kepada otoritas bea cukai.

#### Acceptance Criteria

1. THE Classification_Engine SHALL melakukan tree traversal pada HS_Tree secara berurutan: Section → Chapter → Heading → Subheading
2. THE Classification_Engine SHALL TIDAK menggunakan LLM dalam proses tree traversal maupun scoring
3. THE Classification_Engine SHALL menggunakan Item_Attributes sebagai input eksklusif untuk menghitung skor match di setiap node HS_Tree
4. THE Token_Matcher SHALL menghitung token match score antara gabungan nilai Item_Attributes dan deskripsi node HS code
5. THE Token_Matcher SHALL memberikan bobot (weight) berbeda untuk setiap atribut: `itemName` dan `function` mendapatkan bobot lebih tinggi dibandingkan `technicalSpecs` dan `form`
6. THE Classification_Engine SHALL melakukan pruning pada setiap level: hanya node dengan skor di atas threshold minimum yang akan di-traverse ke level berikutnya
7. WHEN traversal mencapai level Subheading (6-digit), THE Classification_Engine SHALL menghasilkan HS_Candidate untuk setiap node dengan Confidence_Score di atas Confidence_Threshold
8. THE Classification_Engine SHALL menghasilkan Reasoning_Path untuk setiap HS_Candidate yang mencakup skor di setiap level hierarki

### Requirement 6: Loading Data HS Code

**User Story:** Sebagai developer, saya ingin data HS code di-load dari file CSV yang tersedia, agar tidak perlu koneksi ke API eksternal saat proses klasifikasi.

#### Acceptance Criteria

1. THE HS_Tree SHALL di-load dari file `harmonized-system/data/harmonized-system.csv` dan `harmonized-system/data/sections.csv`
2. THE HS_Tree SHALL mendukung 4 level hierarki: Section (kolom `section`), Chapter (kolom `level = 2`), Heading (kolom `level = 4`), Subheading (kolom `level = 6`)
3. THE HS_Tree SHALL di-build sekali saat aplikasi pertama kali dijalankan dan di-cache untuk penggunaan berikutnya
4. IF file CSV tidak ditemukan atau gagal dibaca, THEN THE Classifier SHALL mengembalikan error "Data HS code tidak tersedia. Hubungi administrator."
5. THE HS_Tree SHALL menyimpan relasi parent-child antar node berdasarkan kolom `parent` pada CSV

### Requirement 7: Tampilan Kandidat HS Code dan Reasoning (Finder Mode)

**User Story:** Sebagai staf PPJK, saya ingin melihat kandidat HS code beserta alasan pemilihannya, agar saya dapat memverifikasi dan memilih kode yang paling tepat.

#### Acceptance Criteria

1. THE Classifier SHALL menampilkan semua HS_Candidate yang memenuhi Confidence_Threshold, tanpa batasan jumlah kandidat (tidak fixed top-N)
2. WHEN tidak ada HS_Candidate yang memenuhi Confidence_Threshold, THE Classifier SHALL menampilkan pesan "Tidak ditemukan kandidat HS code yang cukup relevan. Coba perjelas deskripsi barang."
3. WHEN HS_Candidate tersedia, THE Classifier SHALL menampilkan setiap kandidat beserta: kode HS 6-digit, deskripsi resmi, Confidence_Score dalam persen, dan Reasoning_Path
4. THE Reasoning_Path SHALL menampilkan jalur lengkap Section → Chapter → Heading → Subheading beserta skor di setiap level
5. THE Classifier SHALL mengurutkan HS_Candidate dari Confidence_Score tertinggi ke terendah
6. THE Classifier SHALL menampilkan Item_Attributes hasil ekstraksi di samping deskripsi barang asli, agar pengguna dapat memverifikasi pemahaman sistem

### Requirement 8: Penanganan Error dan Fallback

**User Story:** Sebagai staf PPJK, saya ingin mendapat pesan yang jelas ketika terjadi error, agar saya tahu langkah selanjutnya.

#### Acceptance Criteria

1. IF Gemini_Service tidak tersedia atau API key tidak dikonfigurasi, THEN THE Classifier SHALL menampilkan pesan "Ada masalah dengan sistem AI. Hubungi administrator."
2. IF Gemini_Service timeout (melebihi 15 detik), THEN THE Classifier SHALL menampilkan pesan "Koneksi AI terputus. Silakan coba lagi."
3. IF Gemini_Service mengembalikan respons yang tidak dapat di-parsing, THEN THE Classifier SHALL menampilkan pesan "Respons AI tidak valid. Silakan coba lagi."
4. IF Classification_Engine gagal karena data HS_Tree rusak atau tidak lengkap, THEN THE Classifier SHALL menampilkan pesan "Proses klasifikasi gagal. Hubungi administrator."
5. THE Classifier SHALL menampilkan semua pesan error kepada pengguna dalam Bahasa Indonesia
6. THE Classifier SHALL mencatat detail teknis error (kode error, stack trace) ke log sistem tanpa menampilkannya kepada pengguna

### Requirement 9: Batasan Penggunaan LLM

**User Story:** Sebagai developer, saya ingin memastikan LLM tidak terlibat dalam proses matching dan scoring HS code, agar hasil klasifikasi bersifat deterministik dan dapat direproduksi.

#### Acceptance Criteria

1. THE Attribute_Extractor SHALL menggunakan Gemini HANYA untuk tiga tugas: (a) ekstraksi Item_Attributes dari teks bebas, (b) menghasilkan Clarification_Question, dan (c) menghasilkan deskripsi barang untuk Quiz_Item
2. THE Classification_Engine SHALL TIDAK melakukan panggilan ke Gemini_Service atau layanan LLM lainnya dalam proses apapun
3. THE Token_Matcher SHALL menggunakan algoritma deterministik (tidak probabilistik) untuk menghitung skor match
4. WHEN input Item_Attributes yang sama diberikan ke Classification_Engine, THE Classification_Engine SHALL selalu menghasilkan output HS_Candidate yang identik
5. THE Attribute_Extractor prompt SHALL secara eksplisit menyertakan instruksi: "Jangan menyarankan kode HS. Tugas Anda hanya mengekstrak atribut."

### Requirement 10: Antarmuka Pengguna

**User Story:** Sebagai staf PPJK, saya ingin antarmuka yang intuitif dan responsif, agar proses klasifikasi terasa lancar tanpa gangguan teknis.

#### Acceptance Criteria

1. THE Classifier SHALL menampilkan area input teks untuk deskripsi barang dengan placeholder "Contoh: sepatu olahraga berbahan kulit sapi untuk dewasa"
2. THE Classifier SHALL menampilkan indikator loading selama proses ekstraksi atribut dan klasifikasi berlangsung
3. WHEN proses klarifikasi aktif, THE Classifier SHALL menampilkan area percakapan (chat-like) untuk Clarification_Question dan jawaban pengguna
4. THE Classifier SHALL menampilkan tombol "Klasifikasikan" untuk memulai proses dan tombol "Mulai Ulang" untuk memulai Session baru
5. THE Classifier SHALL menggunakan Bahasa Indonesia untuk seluruh teks antarmuka, label, dan pesan
6. THE Classifier SHALL berjalan pada halaman `/hs-classifier` dalam aplikasi Next.js
7. THE Classifier SHALL menggunakan komponen UI yang konsisten dengan desain sistem yang ada (Tailwind CSS dan DaisyUI)

### Requirement 11: Konfigurasi Threshold

**User Story:** Sebagai developer, saya ingin Confidence_Threshold dapat dikonfigurasi, agar dapat menyesuaikan sensitivitas hasil klasifikasi tanpa mengubah kode.

#### Acceptance Criteria

1. THE Classification_Engine SHALL membaca nilai Confidence_Threshold dari konfigurasi, bukan hardcoded dalam logika bisnis
2. THE Classification_Engine SHALL menggunakan Confidence_Threshold default 0.15 jika tidak ada konfigurasi eksplisit
3. THE Classification_Engine SHALL menggunakan pruning threshold per-level: minimum 0.05 untuk melanjutkan traversal ke level berikutnya
4. WHERE nilai Confidence_Threshold dikonfigurasi di luar rentang valid (0.0–1.0), THE Classification_Engine SHALL menggunakan nilai default 0.15 dan mencatat peringatan ke log

### Requirement 12: Quiz Mode — Pembuatan Soal

**User Story:** Sebagai staf PPJK, saya ingin sistem memberikan soal deskripsi barang yang harus saya tebak kode HS-nya, agar saya bisa berlatih klasifikasi secara aktif.

#### Acceptance Criteria

1. WHEN pengguna memilih Quiz_Mode, THE Classifier SHALL menggunakan Gemini_Service untuk menghasilkan deskripsi barang yang natural dan realistis sebagai Quiz_Item
2. THE Quiz_Item description SHALL ditulis dalam Bahasa Indonesia
3. THE Gemini_Service prompt untuk Quiz_Item SHALL secara eksplisit melarang LLM menyertakan petunjuk atau jawaban HS code dalam deskripsi
4. AFTER menghasilkan Quiz_Item description, THE Classifier SHALL menjalankan Classification_Engine pada deskripsi tersebut untuk menentukan jawaban HS code yang benar
5. THE Classifier SHALL menyimpan jawaban benar (HS_Candidate dengan Confidence_Score tertinggi) beserta Reasoning_Path-nya sebelum menampilkan soal kepada pengguna
6. THE Classifier SHALL menampilkan deskripsi barang Quiz_Item kepada pengguna tanpa menampilkan jawaban

### Requirement 13: Quiz Mode — Input Jawaban Pengguna

**User Story:** Sebagai staf PPJK, saya ingin menginput tebakan kode HS saya, agar sistem dapat mengevaluasi apakah jawaban saya benar.

#### Acceptance Criteria

1. THE Classifier SHALL menampilkan field input untuk Quiz_Answer berupa teks 6 digit angka
2. THE Classifier SHALL memvalidasi bahwa Quiz_Answer terdiri dari tepat 6 digit angka
3. IF Quiz_Answer bukan 6 digit angka, THEN THE Classifier SHALL menampilkan pesan "Kode HS harus terdiri dari 6 digit angka."
4. THE Classifier SHALL menampilkan tombol "Cek Jawaban" untuk mengirimkan Quiz_Answer
5. THE Classifier SHALL memungkinkan pengguna menyerah dan melihat jawaban dengan tombol "Lihat Jawaban" tanpa menginput Quiz_Answer

### Requirement 14: Quiz Mode — Evaluasi dan Tampilan Hasil

**User Story:** Sebagai staf PPJK, saya ingin tahu apakah tebakan saya benar atau salah beserta penjelasannya, agar saya bisa belajar dari kesalahan.

#### Acceptance Criteria

1. WHEN pengguna mengirimkan Quiz_Answer, THE Classifier SHALL membandingkan Quiz_Answer dengan jawaban benar dari Classification_Engine
2. IF Quiz_Answer cocok dengan kode HS jawaban benar, THE Classifier SHALL menampilkan Quiz_Result dengan status "Benar" beserta Reasoning_Path
3. IF Quiz_Answer tidak cocok dengan kode HS jawaban benar, THE Classifier SHALL menampilkan Quiz_Result dengan status "Salah", menampilkan jawaban yang benar, dan Reasoning_Path dari jawaban yang benar
4. THE Quiz_Result SHALL menampilkan Reasoning_Path lengkap: Section → Chapter → Heading → Subheading beserta skor di setiap level
5. THE Quiz_Result SHALL menampilkan Item_Attributes yang diekstrak dari deskripsi Quiz_Item agar pengguna memahami cara sistem menganalisis barang
6. WHEN Quiz_Result ditampilkan, THE Classifier SHALL menampilkan tombol "Soal Berikutnya" untuk melanjutkan ke Quiz_Item baru
