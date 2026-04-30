# Requirements Document

## Introduction

Fitur Dashboard & Smart Alert menambahkan dua kapabilitas operasional ke InsScan:

1. **Dashboard Visibility** — section ringkasan yang ditampilkan di atas tabel shipment pada halaman `/shipments` yang sudah ada. Menampilkan informasi yang bisa langsung ditindak: shipment yang berisiko melewati ETA, shipment yang akan tiba dalam waktu dekat, dan ringkasan status keseluruhan. User tidak perlu berpindah halaman — cukup scroll ke atas tabel untuk melihat dashboard summary.

2. **Smart Alert Engine** — dua mesin rule-based terpisah (tanpa machine learning) yang mengevaluasi kondisi setiap shipment aktif dan menghasilkan alert berprioritas:
   - `DataQualityAlertEngine` — mengevaluasi kelengkapan data (vessel name, port of discharge, ETA)
   - `ShipmentStatusAlertEngine` — mengevaluasi status operasional (ETA overdue, arriving soon, stale entry, custom date overdue)

Fitur ini dibangun di atas data shipment yang sudah ada di IndexedDB (dari fitur Shipment Management), tidak memerlukan backend baru, dan mengikuti Clean Architecture yang sudah diterapkan di codebase.

> **Prerequisite:** Fitur ini bergantung pada field ETA yang wajib diisi pada setiap shipment. Requirement ETA sebagai mandatory field didefinisikan di spec `shipment-management` (lihat Requirement 11 di spec tersebut) dan harus diimplementasikan terlebih dahulu atau bersamaan dengan fitur ini.

---

## Glossary

- **Dashboard**: Section ringkasan operasional yang ditampilkan di atas tabel shipment pada halaman `/shipments`, menampilkan metrik dan daftar shipment yang memerlukan perhatian segera
- **Alert**: Notifikasi berbasis rule yang menandai kondisi berisiko pada sebuah shipment
- **Alert_Engine**: Komponen yang mengevaluasi rule terhadap setiap shipment aktif dan menghasilkan daftar alert. Terdapat dua engine terpisah: `DataQualityAlertEngine` dan `ShipmentStatusAlertEngine`
- **DataQualityAlertEngine**: Engine yang mengevaluasi kelengkapan data shipment (vessel name, port of discharge, ETA)
- **ShipmentStatusAlertEngine**: Engine yang mengevaluasi status operasional shipment (ETA overdue, arriving soon, stale entry, custom date overdue)
- **Alert_Rule**: Satu kondisi logis yang dapat dievaluasi terhadap data shipment (contoh: "ETA kurang dari 3 hari dan vessel belum diisi")
- **Risk_Level**: Tingkat risiko sebuah alert — `low`, `medium`, atau `high`
- **Actionable_Item**: Shipment yang memiliki minimal satu alert aktif dengan Risk_Level `medium` atau `high`
- **Arriving_Soon**: Shipment dengan ETA dalam rentang 1–3 hari kalender ke depan dari tanggal hari ini
- **Overdue**: Shipment dengan ETA yang sudah lewat dari tanggal hari ini dan status masih `active`
- **Missing_Critical_Field**: Kondisi di mana field penting untuk operasional (vessel name, port of discharge, ETA) belum diisi pada sebuah shipment aktif
- **Dashboard_Widget**: Komponen UI ringkasan yang menampilkan satu metrik atau daftar terfokus
- **Alert_Badge**: Indikator visual kecil yang menampilkan jumlah alert aktif pada sebuah shipment di tabel
- **Last_Refreshed_Timestamp**: Waktu terakhir data dashboard dan alert di-refresh dari IndexedDB
- **Refresh_Indicator**: Indikator visual yang menampilkan status refresh data (sedang memuat / selesai) dan Last_Refreshed_Timestamp
- **ETA**: Estimated Time of Arrival — tanggal perkiraan kedatangan kapal (wajib diisi pada setiap shipment baru)
- **Working_Day**: Hari kerja (bukan Sabtu, Minggu, atau hari libur nasional Indonesia)
- **PPJK**: Perusahaan Pengurusan Jasa Kepabeanan — customs broker
- **Shipment_Manager**: Komponen sistem yang mengelola data shipment (sudah ada)
- **Storage_Service**: Layanan IndexedDB yang menyimpan data shipment (sudah ada)

---

## Requirements

### Requirement 1: Dashboard Summary Widgets

**User Story:** Sebagai staff operasional, saya ingin melihat ringkasan kondisi semua shipment di atas tabel shipment pada halaman `/shipments`, sehingga saya bisa langsung mengetahui mana yang perlu ditindak tanpa harus membaca tabel satu per satu.

#### Acceptance Criteria

1. THE Dashboard SHALL ditampilkan sebagai section di atas tabel shipment pada halaman `/shipments` yang sudah ada
2. THE Dashboard SHALL menampilkan widget "Total Shipment Aktif" yang menunjukkan jumlah shipment dengan status `active`
3. THE Dashboard SHALL menampilkan widget "Arriving Soon" yang menunjukkan jumlah shipment dengan ETA dalam 1–3 hari kalender ke depan
4. THE Dashboard SHALL menampilkan widget "Overdue" yang menunjukkan jumlah shipment dengan ETA yang sudah lewat dan status masih `active`
5. THE Dashboard SHALL menampilkan widget "Perlu Perhatian" yang menunjukkan jumlah Actionable_Item (shipment dengan minimal satu alert `medium` atau `high`)
6. WHEN jumlah Overdue lebih dari 0, THE Dashboard SHALL menampilkan widget "Overdue" dengan warna merah sebagai indikator kritis
7. WHEN jumlah Arriving_Soon lebih dari 0, THE Dashboard SHALL menampilkan widget "Arriving Soon" dengan warna kuning sebagai indikator perhatian
8. WHEN data shipment diperbarui (create, edit, terminate), THE Dashboard SHALL memperbarui semua widget secara otomatis tanpa reload halaman

### Requirement 2: Daftar Shipment Berisiko (Actionable List)

**User Story:** Sebagai staff operasional, saya ingin melihat daftar shipment yang memerlukan tindakan segera beserta alasannya, sehingga saya bisa langsung mengambil aksi tanpa harus mencari-cari di tabel utama.

#### Acceptance Criteria

1. THE Dashboard SHALL menampilkan daftar Actionable_Item yang diurutkan berdasarkan Risk_Level tertinggi terlebih dahulu (`high` → `medium`)
2. WHEN sebuah shipment memiliki beberapa alert aktif, THE Dashboard SHALL menampilkan semua alert tersebut di bawah shipment yang bersangkutan
3. THE Dashboard SHALL menampilkan untuk setiap Actionable_Item: shipment number, alias (jika ada), ETA, Risk_Level tertinggi, dan daftar alert aktif beserta aksi yang disarankan
4. WHEN tidak ada Actionable_Item, THE Dashboard SHALL menampilkan pesan "Semua shipment dalam kondisi baik" sebagai konfirmasi positif
5. WHEN sebuah Actionable_Item diklik, THE Dashboard SHALL mengarahkan user ke form edit shipment yang bersangkutan

### Requirement 3: Refresh Indicator dan Last Refreshed Timestamp

**User Story:** Sebagai staff operasional, saya ingin mengetahui kapan data dashboard terakhir diperbarui dan melihat indikator saat data sedang dimuat, sehingga saya bisa memastikan informasi yang saya lihat adalah yang terbaru.

#### Acceptance Criteria

1. THE Dashboard SHALL menampilkan Last_Refreshed_Timestamp yang menunjukkan waktu terakhir data dashboard di-refresh dari IndexedDB, dalam format yang mudah dibaca (contoh: "Diperbarui 14:32:05" atau "Diperbarui 2 menit lalu")
2. WHEN data dashboard sedang dimuat atau di-refresh, THE Refresh_Indicator SHALL menampilkan indikator loading visual (contoh: spinner atau animasi pulse) untuk memberi tahu user bahwa data sedang diperbarui
3. WHEN proses refresh selesai, THE Refresh_Indicator SHALL menghentikan animasi loading dan memperbarui Last_Refreshed_Timestamp ke waktu saat ini
4. THE Dashboard SHALL menyediakan tombol refresh manual yang memungkinkan user memicu refresh data secara eksplisit
5. WHEN tombol refresh manual diklik, THE Dashboard SHALL menampilkan Refresh_Indicator dalam status loading hingga data selesai dimuat
6. WHEN data shipment diperbarui melalui operasi create, edit, atau terminate, THE Dashboard SHALL secara otomatis memperbarui Last_Refreshed_Timestamp tanpa perlu refresh manual

### Requirement 4: Alert Rule — ETA Terlewat (Overdue)

**User Story:** Sebagai staff operasional, saya ingin mendapat alert ketika ETA shipment sudah lewat, sehingga saya bisa segera menindaklanjuti keterlambatan atau memperbarui data.

#### Acceptance Criteria

1. WHEN ETA sebuah shipment aktif lebih kecil dari tanggal hari ini, THE ShipmentStatusAlertEngine SHALL menghasilkan alert dengan Risk_Level `high` untuk shipment tersebut
2. THE ShipmentStatusAlertEngine SHALL menyertakan pesan alert: "ETA sudah terlewat — perbarui ETA atau periksa status kedatangan kapal"
3. THE ShipmentStatusAlertEngine SHALL menyertakan aksi yang disarankan: "Edit shipment dan perbarui ETA, atau terminasi jika sudah selesai"
4. WHEN sebuah shipment tidak memiliki ETA, THE ShipmentStatusAlertEngine SHALL NOT menghasilkan alert Overdue untuk shipment tersebut

### Requirement 5: Alert Rule — Arriving Soon (ETA dalam 3 Hari)

**User Story:** Sebagai staff operasional, saya ingin mendapat peringatan dini ketika kapal akan tiba dalam 3 hari ke depan, sehingga saya bisa mempersiapkan dokumen kepabeanan tepat waktu.

#### Acceptance Criteria

1. WHEN ETA sebuah shipment aktif berada dalam rentang 1 hingga 3 hari kalender ke depan dari tanggal hari ini, THE ShipmentStatusAlertEngine SHALL menghasilkan alert dengan Risk_Level `medium` untuk shipment tersebut
2. THE ShipmentStatusAlertEngine SHALL menyertakan pesan alert yang mencantumkan jumlah hari tersisa, contoh: "Kapal tiba dalam 2 hari — siapkan dokumen kepabeanan"
3. THE ShipmentStatusAlertEngine SHALL menyertakan aksi yang disarankan: "Pastikan semua dokumen PIB/BC sudah siap sebelum kedatangan"
4. WHEN ETA sebuah shipment sudah terlewat (Overdue), THE ShipmentStatusAlertEngine SHALL NOT menghasilkan alert Arriving_Soon untuk shipment yang sama

### Requirement 6: Alert Rule — Data Kritis Tidak Lengkap

**User Story:** Sebagai staff operasional, saya ingin mendapat peringatan ketika data penting shipment belum diisi, sehingga saya bisa melengkapi data sebelum kapal tiba.

#### Acceptance Criteria

1. WHEN sebuah shipment aktif tidak memiliki ETA, vessel name, DAN port of discharge sekaligus, THE DataQualityAlertEngine SHALL menghasilkan alert dengan Risk_Level `high`
2. WHEN sebuah shipment aktif tidak memiliki ETA saja (vessel name dan port of discharge sudah diisi), THE DataQualityAlertEngine SHALL menghasilkan alert dengan Risk_Level `medium`
3. WHEN sebuah shipment aktif tidak memiliki vessel name atau port of discharge (tapi ETA sudah diisi), THE DataQualityAlertEngine SHALL menghasilkan alert dengan Risk_Level `low`
4. THE DataQualityAlertEngine SHALL menyertakan pesan alert yang menyebutkan field mana yang belum diisi, contoh: "ETA belum diisi — tracking kedatangan tidak dapat dilakukan"
5. THE DataQualityAlertEngine SHALL menyertakan aksi yang disarankan: "Edit shipment dan lengkapi data yang diperlukan"

### Requirement 7: Alert Rule — Stale Entry (Tidak Ada Aktivitas)

**User Story:** Sebagai staff operasional, saya ingin mendapat peringatan ketika ada shipment yang sudah lama dibuat tapi belum ada aktivitas, sehingga saya bisa memverifikasi apakah data masih relevan.

#### Acceptance Criteria

1. WHEN sebuah shipment aktif dibuat lebih dari 30 hari yang lalu DAN tidak pernah diperbarui sejak dibuat (updatedAt sama dengan createdAt), THE ShipmentStatusAlertEngine SHALL menghasilkan alert dengan Risk_Level `low`
2. THE ShipmentStatusAlertEngine SHALL menyertakan pesan alert: "Shipment belum diperbarui selama lebih dari 30 hari — verifikasi apakah data masih relevan"
3. THE ShipmentStatusAlertEngine SHALL menyertakan aksi yang disarankan: "Perbarui data shipment atau terminasi jika sudah tidak relevan"
4. WHEN sebuah shipment aktif memiliki ETA yang masih lebih dari 30 hari ke depan, THE ShipmentStatusAlertEngine SHALL NOT menghasilkan alert Stale_Entry untuk shipment tersebut (ETA yang jauh ke depan adalah kondisi normal)

### Requirement 8: Alert Rule — Custom Notification Date Terlewat

**User Story:** Sebagai staff operasional, saya ingin mendapat alert ketika tanggal notifikasi kustom yang saya set sudah terlewat, sehingga saya tidak melewatkan deadline internal yang sudah saya tentukan sendiri.

#### Acceptance Criteria

1. WHEN Custom_Date sebuah shipment aktif lebih kecil dari tanggal hari ini, THE ShipmentStatusAlertEngine SHALL menghasilkan alert dengan Risk_Level `medium`
2. THE ShipmentStatusAlertEngine SHALL menyertakan pesan alert: "Tanggal notifikasi kustom sudah terlewat — tindak lanjut diperlukan"
3. THE ShipmentStatusAlertEngine SHALL menyertakan aksi yang disarankan: "Periksa catatan shipment dan ambil tindakan yang diperlukan, atau perbarui tanggal notifikasi"
4. WHEN sebuah shipment tidak memiliki Custom_Date, THE ShipmentStatusAlertEngine SHALL NOT menghasilkan alert Custom_Date_Overdue untuk shipment tersebut

### Requirement 9: Alert Engine — Evaluasi dan Prioritas

**User Story:** Sebagai staff operasional, saya ingin alert yang ditampilkan sudah diurutkan berdasarkan urgensi, sehingga saya selalu tahu mana yang harus ditangani lebih dulu.

#### Acceptance Criteria

1. THE DataQualityAlertEngine SHALL mengevaluasi rule kelengkapan data (Requirement 6) terhadap setiap shipment aktif setiap kali data shipment dimuat atau diperbarui
2. THE ShipmentStatusAlertEngine SHALL mengevaluasi rule status operasional (Requirement 4, 5, 7, 8) terhadap setiap shipment aktif setiap kali data shipment dimuat atau diperbarui
3. THE Dashboard SHALL menggabungkan hasil evaluasi dari DataQualityAlertEngine dan ShipmentStatusAlertEngine untuk ditampilkan bersama di section yang sama
4. THE Dashboard SHALL menampilkan daftar alert gabungan yang diurutkan berdasarkan Risk_Level: `high` terlebih dahulu, kemudian `medium`, kemudian `low`
5. WHEN sebuah shipment memenuhi kondisi lebih dari satu rule (dari engine manapun), THE Dashboard SHALL menampilkan alert terpisah untuk setiap rule yang terpenuhi
6. THE Dashboard SHALL menentukan Risk_Level tertinggi dari semua alert aktif pada sebuah shipment (dari kedua engine) sebagai Risk_Level keseluruhan shipment tersebut
7. THE DataQualityAlertEngine dan THE ShipmentStatusAlertEngine SHALL hanya mengevaluasi shipment dengan status `active`; shipment dengan status `terminated` SHALL NOT dievaluasi

### Requirement 10: Alert Badge pada Tabel Shipment

**User Story:** Sebagai staff operasional, saya ingin melihat indikator alert langsung di tabel shipment yang sudah ada, sehingga saya bisa mengetahui kondisi setiap shipment tanpa harus scroll ke atas untuk melihat dashboard.

#### Acceptance Criteria

1. THE Shipment_Manager SHALL menampilkan Alert_Badge pada setiap baris shipment yang memiliki minimal satu alert aktif (dari DataQualityAlertEngine atau ShipmentStatusAlertEngine)
2. THE Alert_Badge SHALL menampilkan warna sesuai Risk_Level tertinggi: merah untuk `high`, kuning untuk `medium`, abu-abu untuk `low`
3. WHEN Alert_Badge diklik atau di-hover, THE Shipment_Manager SHALL menampilkan tooltip atau popover yang berisi daftar singkat alert aktif pada shipment tersebut
4. WHEN sebuah shipment tidak memiliki alert aktif, THE Shipment_Manager SHALL NOT menampilkan Alert_Badge pada baris shipment tersebut

### Requirement 11: Integrasi UI pada Halaman /shipments

**User Story:** Sebagai staff operasional, saya ingin dashboard langsung terlihat saat membuka halaman shipment tanpa harus berpindah halaman, sehingga saya bisa melihat kondisi operasional dan mengelola shipment dalam satu tampilan.

#### Acceptance Criteria

1. THE Dashboard SHALL ditampilkan sebagai section di atas tabel shipment pada halaman `/shipments`, bukan sebagai rute terpisah
2. THE Shipment_Manager SHALL merender Dashboard section sebelum merender tabel shipment, sehingga user melihat ringkasan terlebih dahulu saat halaman dimuat
3. WHEN Dashboard dimuat pertama kali, THE DataQualityAlertEngine dan THE ShipmentStatusAlertEngine SHALL mengevaluasi semua shipment aktif dan menampilkan hasilnya dalam waktu kurang dari 1 detik (evaluasi dilakukan secara sinkron di sisi klien)
4. THE Dashboard SHALL menggunakan komponen DaisyUI dan Tailwind CSS yang konsisten dengan design system InsScan yang sudah ada
5. THE Dashboard SHALL berfungsi sepenuhnya secara offline (client-side only) tanpa memerlukan koneksi internet atau backend baru
6. THE Navbar SHALL NOT menambahkan item navigasi terpisah untuk Dashboard karena dashboard sudah terintegrasi di halaman `/shipments`

### Requirement 12: Terminate Shipment (Klarifikasi)

**User Story:** Sebagai staff operasional, saya ingin dapat menonaktifkan shipment yang sudah selesai atau tidak relevan, sehingga shipment tersebut tidak lagi muncul di dashboard dan tidak dievaluasi oleh alert engine.

#### Acceptance Criteria

1. WHEN sebuah shipment di-terminate, THE Shipment_Manager SHALL mengubah status shipment dari `active` menjadi `terminated`
2. WHEN status shipment berubah menjadi `terminated`, THE DataQualityAlertEngine dan THE ShipmentStatusAlertEngine SHALL berhenti mengevaluasi shipment tersebut
3. WHEN status shipment berubah menjadi `terminated`, THE Dashboard SHALL menghapus shipment tersebut dari semua widget dan daftar Actionable_Item secara otomatis
4. THE Shipment_Manager SHALL NOT menghapus record shipment yang di-terminate dari IndexedDB; record tetap tersimpan dengan status `terminated`
