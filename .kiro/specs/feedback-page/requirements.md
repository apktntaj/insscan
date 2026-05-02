# Requirements Document

## Introduction

Halaman Feedback adalah halaman baru di Pesisir Platform (InsScan) yang menggantikan link `mailto:` di navigasi. Halaman ini melayani dua kebutuhan utama: (1) menampilkan roadmap/status board fitur yang sedang dan akan dikerjakan agar user tahu arah pengembangan produk, dan (2) menyediakan mekanisme bagi user untuk mengirimkan ide tool baru dan saran perbaikan fitur melalui WhatsApp — dipilih karena target user (staf operasional PPJK dan freight forwarder di Indonesia) adalah pengguna aktif WhatsApp, sehingga friction lebih rendah dibanding platform lain.

## Glossary

- **Feedback_Page**: Halaman `/feedback` di Pesisir Platform yang menampilkan roadmap dan form pengiriman saran.
- **Roadmap_Board**: Komponen di Feedback_Page yang menampilkan daftar fitur beserta status pengerjaannya.
- **Feature_Item**: Satu entri fitur dalam Roadmap_Board, terdiri dari nama, deskripsi singkat, dan status.
- **Feature_Status**: Kategori status pengerjaan sebuah Feature_Item. Nilai yang valid: `"live"` | `"in-progress"` | `"planned"`.
- **Suggestion_Form**: Komponen di Feedback_Page yang menampilkan tombol/link WhatsApp untuk menghubungi pemilik platform.
- **WhatsApp_Contact**: Kontak WhatsApp pemilik platform yang menjadi tujuan pengiriman saran dari user, diakses melalui URL scheme `https://wa.me/`.
- **Navbar**: Komponen navigasi global di `app/presentation/components/common/Navbar.jsx`.
- **Nav_Links**: Konfigurasi link navigasi di `app/presentation/config/nav-links.js`.
- **Support_Section**: Section di Feedback_Page yang menampilkan QRIS_Image donasi dan ajakan kolaborasi dari developer.
- **QRIS_Image**: Gambar QR code QRIS untuk donasi sukarela yang ditampilkan di Support_Section, disimpan di folder `public/`.

---

## Requirements

### Requirement 1: Navigasi ke Halaman Feedback

**User Story:** Sebagai staf operasional PPJK, saya ingin mengakses halaman Feedback dari navigasi utama, sehingga saya dapat menemukan cara memberikan saran tanpa harus mencari-cari.

#### Acceptance Criteria

1. THE Nav_Links SHALL menyertakan entri dengan `href: "/feedback"` sebagai pengganti `href: "mailto:alamasyarie@outlook.com"`.
2. WHEN user mengklik link "Feedback" di Navbar, THE Navbar SHALL menavigasi user ke halaman `/feedback` tanpa membuka aplikasi email eksternal.
3. WHEN user berada di halaman `/feedback`, THE Navbar SHALL menampilkan link "Feedback" dalam state aktif (highlighted) sesuai pola visual yang sudah ada.

---

### Requirement 2: Halaman Feedback Dapat Diakses

**User Story:** Sebagai staf operasional PPJK, saya ingin membuka halaman `/feedback`, sehingga saya dapat melihat isi roadmap dan form saran.

#### Acceptance Criteria

1. THE Feedback_Page SHALL dapat diakses melalui route `/feedback` di Next.js App Router.
2. THE Feedback_Page SHALL menggunakan layout global yang sama (Navbar, footer) seperti halaman lain di aplikasi.
3. WHEN user mengakses `/feedback`, THE Feedback_Page SHALL merender konten tanpa error dalam kondisi normal.
4. THE Feedback_Page SHALL memiliki `<title>` halaman yang deskriptif, minimal mengandung kata "Feedback" dan nama platform.

---

### Requirement 3: Roadmap Board — Tampilan Status Fitur

**User Story:** Sebagai staf operasional PPJK, saya ingin melihat daftar fitur yang sedang dan akan dikerjakan, sehingga saya tahu arah pengembangan platform dan tidak mengirimkan saran yang sudah ada di roadmap.

#### Acceptance Criteria

1. THE Roadmap_Board SHALL menampilkan daftar Feature_Item yang masing-masing memiliki nama fitur, deskripsi singkat, dan Feature_Status.
2. THE Roadmap_Board SHALL membedakan Feature_Item secara visual berdasarkan Feature_Status-nya: `"live"` (sudah tersedia), `"in-progress"` (sedang dikerjakan), dan `"planned"` (direncanakan).
3. THE Roadmap_Board SHALL menampilkan label status yang dapat dibaca manusia dalam Bahasa Indonesia: `"live"` → "Tersedia", `"in-progress"` → "Sedang Dikerjakan", `"planned"` → "Direncanakan".
4. WHEN Roadmap_Board dirender, THE Roadmap_Board SHALL menampilkan minimal satu Feature_Item untuk setiap nilai Feature_Status yang valid.
5. THE Roadmap_Board SHALL menampilkan Feature_Item dalam urutan: `"live"` terlebih dahulu, diikuti `"in-progress"`, kemudian `"planned"`.

---

### Requirement 4: Roadmap Board — Konten Awal

**User Story:** Sebagai staf operasional PPJK, saya ingin melihat fitur-fitur yang relevan dengan pekerjaan saya di roadmap, sehingga saya memahami nilai platform ini.

#### Acceptance Criteria

1. THE Roadmap_Board SHALL menampilkan fitur-fitur berikut dengan status `"live"`: Cek Lartas (verifikasi HS code, tarif, dan LARTAS dari INSW), dan Shipments (manajemen data pengiriman dan ekspor ke Excel).
2. THE Roadmap_Board SHALL menampilkan minimal satu Feature_Item dengan status `"in-progress"` yang relevan dengan kebutuhan operasional PPJK.
3. THE Roadmap_Board SHALL menampilkan minimal satu Feature_Item dengan status `"planned"` yang relevan dengan kebutuhan operasional PPJK.
4. THE Roadmap_Board SHALL menyertakan deskripsi singkat (maksimal 2 kalimat) untuk setiap Feature_Item agar user memahami manfaatnya.

---

### Requirement 5: Suggestion Form — Tampilan dan Struktur

**User Story:** Sebagai staf operasional PPJK, saya ingin melihat cara yang jelas dan mudah untuk mengirimkan saran, sehingga saya dapat berkontribusi pada pengembangan platform tanpa harus mengisi form yang panjang.

#### Acceptance Criteria

1. THE Suggestion_Form SHALL menampilkan tombol atau link yang mengarahkan user ke WhatsApp_Contact pemilik platform.
2. THE Suggestion_Form SHALL menampilkan teks penjelasan singkat bahwa saran dapat disampaikan langsung melalui WhatsApp, sehingga user memahami mekanismenya sebelum mengklik.
3. WHEN user mengklik tombol WhatsApp di Suggestion_Form, THE Suggestion_Form SHALL membuka WhatsApp langsung ke chat WhatsApp_Contact menggunakan URL scheme `https://wa.me/`.
4. THE Suggestion_Form SHALL menampilkan tombol dengan label yang jelas dan deskriptif (misalnya "Kirim Saran via WhatsApp") agar user memahami aksi yang akan terjadi.

---

### Requirement 6: Suggestion Form — Mekanisme Pengiriman via WhatsApp

**User Story:** Sebagai staf operasional PPJK, saya ingin mengirimkan saran dengan mudah melalui WhatsApp, sehingga saya dapat langsung berkomunikasi dengan pemilik platform tanpa friction tambahan.

#### Acceptance Criteria

1. WHEN user mengklik tombol WhatsApp, THE Suggestion_Form SHALL membuka WhatsApp menggunakan URL scheme `https://wa.me/{nomor}` yang mengarah ke WhatsApp_Contact.
2. THE Suggestion_Form SHALL menggunakan nomor WhatsApp yang dapat dikonfigurasi (tidak di-hardcode langsung di komponen UI) sehingga WhatsApp_Contact dapat diubah tanpa mengubah kode komponen.
3. WHEN URL WhatsApp dibuka, THE Suggestion_Form SHALL membuka link di tab baru (`target="_blank"`) agar user tidak meninggalkan halaman platform.
4. THE Suggestion_Form SHALL menggunakan atribut `rel="noopener noreferrer"` pada link eksternal WhatsApp untuk keamanan.

---

### Requirement 7: Aksesibilitas dan Responsivitas

**User Story:** Sebagai staf operasional PPJK yang mengakses platform dari berbagai perangkat, saya ingin halaman Feedback dapat digunakan dengan nyaman di layar mobile maupun desktop, sehingga saya dapat memberikan saran kapan saja.

#### Acceptance Criteria

1. THE Feedback_Page SHALL merender dengan benar pada lebar layar minimal 320px (mobile) hingga 1280px (desktop) menggunakan Tailwind CSS responsive utilities.
2. THE Roadmap_Board SHALL menampilkan Feature_Item dalam layout yang dapat dibaca tanpa horizontal scrolling pada lebar layar 320px.
3. THE Suggestion_Form SHALL menampilkan tombol WhatsApp tanpa terpotong pada lebar layar 320px.
4. THE Feedback_Page SHALL menggunakan elemen HTML semantik yang sesuai (`<main>`, `<section>`, `<h1>`, `<h2>`, `<a>`, `<button>`) untuk mendukung aksesibilitas dasar.
5. WHEN Suggestion_Form dirender, THE Suggestion_Form SHALL menggunakan atribut `aria-label` yang deskriptif pada tombol/link WhatsApp agar dapat dibaca oleh screen reader.

---

### Requirement 8: Support Developer — Donasi QRIS dan Ajakan Kolaborasi

**User Story:** Sebagai user yang ingin mendukung pengembangan platform, saya ingin melihat cara untuk berdonasi atau berkolaborasi dengan developer, sehingga saya dapat memberikan dukungan nyata kepada indie hacker yang mengerjakan platform ini.

#### Acceptance Criteria

1. THE Support_Section SHALL menampilkan QRIS_Image yang dapat di-scan untuk melakukan donasi sukarela kepada developer.
2. THE Support_Section SHALL menampilkan teks penjelasan singkat yang menggambarkan konteks developer: bahwa platform ini dikerjakan oleh seorang indie hacker di sela-sela kesibukannya, dengan tone yang personal dan jujur — bukan korporat.
3. THE Support_Section SHALL menampilkan pernyataan kesiapan developer untuk diajak bekerja sama dalam bentuk apapun, termasuk kolaborasi dan freelance.
4. WHEN Support_Section dirender, THE QRIS_Image SHALL memiliki atribut `alt` yang deskriptif (minimal menjelaskan bahwa gambar adalah QR code QRIS untuk donasi) agar dapat diakses oleh screen reader.
5. THE QRIS_Image SHALL disimpan di folder `public/` dan path-nya dapat dikonfigurasi tanpa mengubah kode komponen UI.
