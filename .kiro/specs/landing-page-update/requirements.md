# Requirements Document

## Introduction

Pembaruan konten landing page aplikasi Pesisir Platform (`app/page.jsx`) untuk mencerminkan dua modul aktif saat ini: **Cek Lartas** dan **Shipments**. BL Scanner telah dinonaktifkan sepenuhnya dan tidak boleh lagi disebutkan di halaman mana pun. Perubahan mencakup Hero Section, Product Cards Section, dan Alur Cepat Section.

## Glossary

- **Landing_Page**: Halaman utama aplikasi Pesisir Platform di route `/` (`app/page.jsx`)
- **Hero_Section**: Bagian paling atas landing page yang berisi headline, deskripsi, dan CTA buttons
- **Product_Cards_Section**: Bagian yang menampilkan kartu-kartu produk/modul yang tersedia
- **Alur_Cepat_Section**: Bagian yang menjelaskan langkah-langkah penggunaan platform secara ringkas
- **Cek_Lartas**: Modul aktif untuk pengecekan HS code, tarif bea masuk, pajak, dan status LARTAS, tersedia di route `/cek-lartas`
- **Shipments**: Modul aktif untuk manajemen data pengiriman dan tracking status, tersedia di route `/shipments`
- **BL_Scanner**: Modul yang telah dinonaktifkan sepenuhnya — tidak boleh muncul di landing page
- **CTA**: Call-to-Action button yang mengarahkan pengguna ke modul tertentu
- **LARTAS**: Larangan dan Pembatasan — regulasi impor/ekspor dari INSW
- **PPJK**: Pengusaha Pengurusan Jasa Kepabeanan (customs broker)

---

## Requirements

### Requirement 1: Pembaruan Hero Section

**User Story:** Sebagai pengguna PPJK atau freight forwarder, saya ingin melihat headline dan deskripsi yang akurat di halaman utama, sehingga saya langsung memahami dua modul yang tersedia tanpa kebingungan dengan modul lama.

#### Acceptance Criteria

1. THE Landing_Page SHALL menampilkan headline yang menyebutkan dua modul aktif: Cek Lartas dan Shipments, tanpa menyebut BL Scanner.
2. THE Landing_Page SHALL menampilkan deskripsi singkat yang menjelaskan fungsi Cek_Lartas (verifikasi HS code, tarif, dan LARTAS) dan Shipments (manajemen data pengiriman).
3. WHEN pengguna mengklik CTA pertama di Hero_Section, THE Landing_Page SHALL mengarahkan pengguna ke route `/cek-lartas`.
4. WHEN pengguna mengklik CTA kedua di Hero_Section, THE Landing_Page SHALL mengarahkan pengguna ke route `/shipments`.
5. THE Hero_Section SHALL menampilkan label CTA pertama sebagai "Buka Cek Lartas".
6. THE Hero_Section SHALL menampilkan label CTA kedua sebagai "Lihat Shipments".
7. THE Landing_Page SHALL tidak menampilkan teks, link, atau referensi apa pun ke BL Scanner di Hero_Section.

---

### Requirement 2: Pembaruan Product Cards Section

**User Story:** Sebagai pengguna, saya ingin melihat kartu produk yang mencerminkan modul-modul aktif, sehingga saya dapat memilih modul yang sesuai dengan kebutuhan saya.

#### Acceptance Criteria

1. THE Product_Cards_Section SHALL menampilkan tepat dua kartu produk: satu untuk Cek_Lartas dan satu untuk Shipments.
2. THE Product_Cards_Section SHALL tidak menampilkan kartu untuk BL Scanner, termasuk kode yang dikomentari.
3. THE Product_Cards_Section SHALL menampilkan kartu Cek_Lartas dengan judul "Cek Lartas", deskripsi fitur pengecekan HS code, tarif, pajak, dan LARTAS, serta CTA yang mengarah ke `/cek-lartas`.
4. THE Product_Cards_Section SHALL menampilkan kartu Shipments dengan judul "Shipments", deskripsi fitur manajemen data pengiriman dan tracking status, serta CTA yang mengarah ke `/shipments`.
5. WHEN pengguna mengklik CTA pada kartu Cek_Lartas, THE Landing_Page SHALL mengarahkan pengguna ke route `/cek-lartas`.
6. WHEN pengguna mengklik CTA pada kartu Shipments, THE Landing_Page SHALL mengarahkan pengguna ke route `/shipments`.
7. THE Product_Cards_Section SHALL tidak menampilkan pesan "coming soon" untuk modul mana pun.

---

### Requirement 3: Pembaruan Alur Cepat Section

**User Story:** Sebagai pengguna baru, saya ingin memahami alur kerja yang direkomendasikan, sehingga saya dapat menggunakan platform secara efektif untuk keperluan kepabeanan.

#### Acceptance Criteria

1. THE Alur_Cepat_Section SHALL menampilkan tepat tiga langkah alur kerja yang mencerminkan penggunaan modul Shipments dan Cek_Lartas.
2. THE Alur_Cepat_Section SHALL menampilkan Langkah 1 sebagai instruksi untuk menginput data pengiriman di modul Shipments.
3. THE Alur_Cepat_Section SHALL menampilkan Langkah 2 sebagai instruksi untuk memverifikasi HS code dan status LARTAS di modul Cek_Lartas.
4. THE Alur_Cepat_Section SHALL menampilkan Langkah 3 sebagai instruksi untuk mengekspor atau mencatat hasil untuk keperluan dokumentasi bea cukai.
5. THE Alur_Cepat_Section SHALL tidak menyebut BL Scanner dalam langkah mana pun.

---

### Requirement 4: Kebersihan Kode

**User Story:** Sebagai developer, saya ingin kode landing page bersih dari referensi modul yang sudah tidak aktif, sehingga codebase mudah dipahami dan dirawat.

#### Acceptance Criteria

1. THE Landing_Page SHALL tidak mengandung kode yang dikomentari (`// { ... }`) untuk kartu BL Scanner di array `productCards`.
2. THE Landing_Page SHALL tidak mengandung referensi ke route `/blscann` atau `/inscann` dalam bentuk apa pun (link, string, komentar).
3. THE Landing_Page SHALL tidak mengandung referensi ke teks "BL Scanner", "INScann", atau "BL copy-chain" dalam konten yang ditampilkan maupun dalam komentar kode.
