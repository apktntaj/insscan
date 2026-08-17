---
name: problem-solving-first
description: Memastikan program dirancang dari pemahaman masalah, spesifikasi, kasus uji, dan verifikasi—bukan sekadar menulis sintaks. Gunakan saat mengimplementasikan fitur, memperbaiki bug, mengubah logika, melakukan refactor, atau meninjau kebenaran program.
---

# Problem Solving First

## Tujuan

Hasilkan program yang **benar terhadap kebutuhan**, bukan hanya kode yang dapat dijalankan atau lulus beberapa tes.

Urutan prioritas:

1. Masalah dipahami.
2. Definisi benar dinyatakan.
3. Solusi dimodelkan.
4. Kasus penting ditentukan.
5. Implementasi dibuat.
6. Hasil diverifikasi.

Sintaks dan framework adalah alat, bukan titik awal pemecahan masalah.

## Alur Kerja Wajib

### 1. Pahami masalah sebelum mengubah kode

Cari dan nyatakan, secara proporsional terhadap ukuran tugas:

- tujuan pengguna atau bisnis;
- input dan asalnya;
- output dan bentuk yang diharapkan;
- aturan domain;
- batasan dan kondisi gagal;
- perilaku yang harus dipertahankan;
- hal yang tidak termasuk dalam ruang lingkup.

Untuk codebase yang sudah ada, baca dahulu kode, tes, kontrak, dan dokumentasi yang relevan. Jangan menebak perilaku hanya dari nama fungsi.

Jika informasi belum lengkap:

- simpulkan hanya asumsi yang aman dan sebutkan asumsi tersebut;
- ajukan pertanyaan jika pilihan jawabannya dapat mengubah kontrak, data, keamanan, arsitektur, atau hasil utama;
- jangan menyamarkan ketidakpastian sebagai fakta.

### 2. Definisikan kebenaran

Ubah permintaan menjadi kriteria penerimaan yang dapat diperiksa. Tentukan bila relevan:

- precondition dan postcondition;
- invariant yang harus selalu terjaga;
- format dan validitas data;
- semantik error dan fallback;
- kebutuhan performa, keamanan, konsistensi, atau kompatibilitas.

Program belum dianggap benar hanya karena dapat dikompilasi, dijalankan, atau menghasilkan output yang benar untuk satu contoh.

### 3. Pecah dan modelkan solusi

Sebelum implementasi:

- pecah masalah menjadi bagian kecil dengan tanggung jawab jelas;
- identifikasi entitas, state, transisi, dan dependensi;
- tulis pseudocode atau uraian algoritma jika logikanya tidak trivial;
- pilih solusi paling sederhana yang memenuhi seluruh kriteria;
- tempatkan perubahan pada layer yang tepat dan hormati arsitektur proyek.

Jangan menambahkan abstraksi, konfigurasi, atau fitur spekulatif yang tidak dibutuhkan oleh masalah.

### 4. Tentukan kasus sebelum atau bersama kode

Pertimbangkan sekurang-kurangnya:

- kasus normal;
- nilai batas;
- input kosong, hilang, atau tidak valid;
- duplikasi dan urutan data;
- kegagalan dependensi;
- state lama dan kompatibilitas;
- konkurensi, idempotensi, waktu, atau presisi jika relevan.

Terjemahkan kasus penting menjadi tes otomatis bila memungkinkan. Untuk bug, buat reproduksi atau tes yang gagal terlebih dahulu, lalu perbaiki akar masalah—bukan hanya gejalanya.

Tes adalah bukti parsial, bukan pengganti penalaran. Hindari implementasi yang sekadar disesuaikan agar cocok dengan contoh tes.

### 5. Implementasikan secara terkendali

- Buat perubahan sekecil mungkin yang menyelesaikan masalah secara utuh.
- Jaga kontrak antarmodul dan perilaku yang tidak diminta untuk berubah.
- Gunakan nama yang menyatakan konsep domain dan maksud logika.
- Validasi input pada batas sistem yang tepat.
- Tangani error secara eksplisit; jangan menelan kegagalan tanpa alasan.
- Jangan mencampur refactor luas dengan perbaikan perilaku kecuali memang diperlukan.

### 6. Verifikasi, jangan berasumsi

Setelah implementasi:

1. telusuri setiap kriteria penerimaan ke kode dan/atau tes;
2. jalankan tes yang relevan;
3. jalankan lint, type-check, atau build bila sesuai;
4. periksa regresi dan perubahan tak disengaja;
5. tinjau diff untuk memastikan ruang lingkup tetap terkendali.

Jangan mengklaim sesuatu berhasil jika belum diverifikasi. Jika alat tidak dapat dijalankan, nyatakan apa yang belum diperiksa dan risikonya.

### 7. Laporkan hasil dengan jujur

Ringkasan akhir harus menyebutkan secara singkat:

- masalah atau kontrak yang diselesaikan;
- perubahan utama;
- cara verifikasi dan hasilnya;
- asumsi, keterbatasan, atau risiko yang tersisa.

## Mode Berdasarkan Ukuran Tugas

Terapkan proses secara proporsional, bukan birokratis:

- **Perubahan kecil:** lakukan analisis ringkas; tidak perlu menuliskan dokumen panjang.
- **Logika menengah:** nyatakan kontrak, edge case, dan tes secara eksplisit.
- **Perubahan besar atau berisiko tinggi:** berhenti sebelum implementasi untuk menyusun spesifikasi, model, rencana migrasi/rollback, serta strategi pengujian.

## Larangan

Jangan:

- langsung menulis kode sebelum memahami efek yang diminta;
- menganggap permintaan pengguna selalu merupakan spesifikasi lengkap;
- mengubah tes agar implementasi yang salah terlihat benar;
- menyelesaikan gejala sambil membiarkan invariant rusak;
- memilih solusi rumit ketika solusi sederhana sudah memenuhi kontrak;
- menyebut “selesai” hanya karena tidak ada syntax error.

## Pertanyaan Penutup Internal

Sebelum menyatakan tugas selesai, jawab:

1. Masalah apa yang sebenarnya diselesaikan?
2. Apa definisi hasil yang benar?
3. Kasus apa yang dapat menggagalkan solusi ini?
4. Bukti apa yang menunjukkan implementasi memenuhi definisi tersebut?
5. Apa yang masih belum diketahui atau belum diverifikasi?
