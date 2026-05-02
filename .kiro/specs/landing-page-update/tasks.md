# Rencana Implementasi: Landing Page Update

## Overview

Memperbarui satu file `app/page.jsx` untuk mencerminkan dua modul aktif platform: **Cek Lartas** dan **Shipments**. Semua referensi ke BL Scanner, INScann, dan `/blscann`/`/inscann` dihapus. Perubahan bersifat konten murni — tidak ada komponen baru, API call, atau state management.

## Tasks

- [x] 1. Perbarui Hero Section di `app/page.jsx`
  - Ganti teks `<h1>` menjadi: `"Workspace operasional untuk Cek Lartas dan manajemen Shipments."`
  - Ganti teks `<p>` deskripsi menjadi: `"Gunakan Cek Lartas untuk verifikasi HS code, tarif, dan status LARTAS dari INSW. Kelola data pengiriman di modul Shipments untuk tracking dan dokumentasi bea cukai."`
  - Ganti CTA pertama: `href="/cek-lartas"`, label `"Buka Cek Lartas"`
  - Ganti CTA kedua: `href="/shipments"`, label `"Lihat Shipments"`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Perbarui array `productCards` di `app/page.jsx`
  - [x] 2.1 Hapus seluruh blok komentar kartu BL Scanner (`// { title: "B/L Scanner", ... }`)
  - [x] 2.2 Ganti objek kartu INScann yang ada dengan kartu Cek Lartas:
    - `title: "Cek Lartas"`
    - `description: "Verifikasi HS code, tarif bea masuk, pajak, dan status LARTAS langsung dari sumber INSW."`
    - `points: ["Cek HS code single maupun batch dari file Excel.", "Lihat tarif BM, PPN, PPH, dan PPH Non-API.", "Periksa status LARTAS dan detail regulasi impor."]`
    - `href: "/cek-lartas"`, `cta: "Buka Cek Lartas"`
    - `accent: "from-cyan-500/20 to-sky-500/20"`, `dot: "bg-cyan-500"`
  - [x] 2.3 Tambahkan objek kartu Shipments sebagai elemen kedua array:
    - `title: "Shipments"`
    - `description: "Kelola data pengiriman dan pantau status shipment dalam satu tampilan terpusat."`
    - `points: ["Input dan edit data pengiriman secara manual.", "Pantau status dan estimasi kedatangan.", "Ekspor data ke Excel untuk dokumentasi bea cukai."]`
    - `href: "/shipments"`, `cta: "Lihat Shipments"`
    - `accent: "from-sky-500/20 to-cyan-500/20"`, `dot: "bg-sky-500"`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 3. Perbarui array `quickFlow` di `app/page.jsx`
  - Ganti seluruh isi array dengan tiga langkah baru:
    1. `"Input data pengiriman di modul Shipments — catat nomor BL, shipper, dan estimasi kedatangan."`
    2. `"Verifikasi HS code dan status LARTAS di modul Cek Lartas sebelum proses kepabeanan."`
    3. `"Ekspor atau catat hasil untuk keperluan dokumentasi dan pelaporan bea cukai."`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Bersihkan semua referensi lama di `app/page.jsx`
  - Pastikan tidak ada string `"/blscann"` atau `"/inscann"` tersisa di file
  - Pastikan tidak ada teks `"BL Scanner"`, `"INScann"`, atau `"BL copy-chain"` tersisa (baik di konten maupun komentar)
  - Pastikan tidak ada kode yang dikomentari (`// { ... }`) untuk kartu produk lama
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Checkpoint — Verifikasi hasil akhir
  - Jalankan `npm run build` untuk memastikan tidak ada error kompilasi
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.
