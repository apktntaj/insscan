# Requirements Document

## Introduction

Fitur ini menambahkan sistem autentikasi dan model akses dua tier ke platform Pesisir. Tujuan utamanya adalah **monetisasi fitur platform** — sebagian fitur dapat digunakan tanpa akun (Guest), fitur lain memerlukan akun terdaftar (Registered_User), dan fitur berbayar memerlukan credit aktif.

Autentikasi diimplementasikan menggunakan **Supabase Auth** dengan metode login **OAuth saja** (Google). Tidak ada form registrasi manual atau login username/password.

Platform menggunakan **2 tier akses**:
- **Guest**: belum login, dapat mengakses layanan dasar dengan batasan
- **Registered**: sudah login via Google OAuth, mendapat akses penuh fitur dasar dan dapat menggunakan fitur berbayar dengan credit

"Premium" **bukan tier permanen** — melainkan state sementara ketika Registered_User memiliki Credit_Balance aktif. Saat credit habis, pengguna tetap Registered namun tidak dapat mengakses fitur berbayar sampai membeli credit lagi.

Monetisasi menggunakan **sistem credit universal** dengan bobot berbeda per fitur. Credit dapat diperoleh gratis saat mendaftar (Welcome_Credit), melalui referral, atau dibeli via Midtrans.

Data shipment disimpan berdasarkan status pengguna: Guest menyimpan di IndexedDB dengan batas 26 shipment (reset tiap tanggal 1), Registered_User menyimpan di IndexedDB secara default, dan dapat mengaktifkan Server_Storage (Supabase) satu kali dengan membayar credit untuk persistensi lintas perangkat.

## Glossary

- **Auth_System**: Sistem autentikasi Pesisir yang dibangun di atas Supabase Auth
- **Supabase_Client**: Instance Supabase yang dikonfigurasi untuk SSR di Next.js App Router
- **Session**: Sesi login aktif yang dikelola Supabase Auth, disimpan di cookie browser
- **OAuth_Provider**: Penyedia identitas pihak ketiga — Google
- **Guest**: Pengguna yang belum login. Dapat mengakses `/`, `/cek-lartas`, `/shipments`, `/feedback` dengan batasan. Data shipment tersimpan di IndexedDB browser, maksimal 26 shipment, direset tiap tanggal 1 setiap bulan.
- **Registered_User**: Pengguna yang sudah login via Google OAuth. Akses penuh fitur dasar. Dapat menggunakan fitur berbayar dengan credit. Data shipment tersimpan di IndexedDB (default) atau Supabase server (setelah aktivasi Server_Storage).
- **Credit**: Satuan universal untuk mengakses fitur berbayar. Setiap fitur berbayar memiliki bobot credit yang berbeda, dikonfigurasi via konstanta.
- **Credit_Weight**: Jumlah credit yang dibutuhkan untuk satu unit transaksi pada fitur tertentu. Berbeda per fitur — dikonfigurasi via konstanta, bukan hardcoded.
- **Welcome_Credit**: Credit gratis yang diberikan otomatis saat Registered_User pertama kali mendaftar.
- **Credit_Balance**: Total credit aktif milik Registered_User (belum expired, belum digunakan).
- **Server_Storage**: Fitur penyimpanan data shipment di Supabase server-side untuk Registered_User. Diaktifkan satu kali dengan membayar sejumlah credit (`SERVER_STORAGE_ACTIVATION_COST`). Setelah aktif, permanen.
- **Referral_Code**: Kode unik 8 karakter alphanumeric uppercase milik setiap Registered_User.
- **Referral_Reward**: Credit yang diberikan ke referrer ketika pengguna baru berhasil mendaftar menggunakan Referral_Code mereka.
- **Payment_Gateway**: Midtrans — digunakan untuk memproses pembelian credit.
- **Auth_Page**: Halaman `/login`.
- **Middleware**: Next.js middleware untuk validasi Session dan kontrol akses route.
- **Callback_URL**: URL tujuan setelah proses OAuth selesai, yaitu `/auth/callback`.
- **Upgrade_Page**: Halaman `/upgrade` yang menjelaskan fitur berbayar, Credit_Balance, dan cara membeli credit.

---

## Requirements

### Requirement 1: Login via OAuth (Google)

**User Story:** Sebagai pengunjung platform Pesisir, saya ingin bisa login menggunakan akun Google saya, agar saya tidak perlu membuat dan mengingat password baru.

#### Acceptance Criteria

1. THE Auth_Page SHALL menampilkan satu tombol login: "Login dengan Google"
2. WHEN pengguna mengklik tombol login OAuth, THE Auth_System SHALL mengarahkan pengguna ke halaman otorisasi Google
3. WHEN OAuth_Provider mengembalikan otorisasi yang berhasil ke `/auth/callback`, THE Auth_System SHALL membuat Session aktif untuk pengguna tersebut
4. WHEN pengguna login untuk pertama kali, THE Auth_System SHALL membuat profil Registered_User baru dengan `created_at` diset ke waktu saat ini
5. WHEN pengguna login yang sudah memiliki akun, THE Auth_System SHALL memuat profil yang sudah ada tanpa mengubah data profil
6. IF OAuth_Provider mengembalikan error atau pengguna membatalkan otorisasi, THEN THE Auth_System SHALL mengarahkan pengguna kembali ke Auth_Page dengan pesan error "Login gagal. Silakan coba lagi."
7. WHEN Session berhasil dibuat, THE Auth_System SHALL mengarahkan pengguna ke halaman utama (`/`) atau ke halaman asal yang tersimpan sebelum proses login dimulai

---

### Requirement 2: Registrasi Akun via OAuth

**User Story:** Sebagai pengunjung baru, saya ingin mendaftar akun Pesisir menggunakan akun Google saya, agar saya bisa mengakses fitur yang memerlukan akun.

#### Acceptance Criteria

1. THE Auth_System SHALL menggunakan alur OAuth yang sama untuk registrasi dan login — tidak ada form registrasi terpisah
2. WHEN pengguna baru berhasil melewati alur OAuth untuk pertama kali, THE Auth_System SHALL secara otomatis membuat akun baru tanpa langkah tambahan dari pengguna
3. THE Auth_Page SHALL menampilkan teks "Belum punya akun? Daftar gratis dengan Google" untuk menjelaskan bahwa tombol yang sama digunakan untuk mendaftar
4. THE Auth_System SHALL menyimpan profil Registered_User dengan field: `id` (UUID dari Supabase Auth), `email` (dari OAuth_Provider), `referral_code` (kode unik 8 karakter alphanumeric uppercase), `server_storage_activated` (boolean, default false), dan `created_at` (timestamp)
5. THE Auth_System SHALL tidak menyimpan password pengguna dalam bentuk apapun — autentikasi sepenuhnya didelegasikan ke OAuth_Provider

---

### Requirement 3: Manajemen Session dengan Supabase SSR

**User Story:** Sebagai Registered_User yang sudah login, saya ingin session saya tetap aktif saat berpindah halaman, agar saya tidak perlu login ulang setiap kali membuka halaman baru.

#### Acceptance Criteria

1. THE Supabase_Client SHALL dikonfigurasi menggunakan paket `@supabase/ssr` untuk mendukung cookie-based session di Next.js App Router
2. THE Auth_System SHALL menyimpan Session di cookie browser dengan atribut `httpOnly`, `secure` (di production), dan `sameSite: lax`
3. WHILE Registered_User aktif menggunakan platform, THE Auth_System SHALL memperbarui Session secara otomatis sebelum token kedaluwarsa
4. WHEN Session pengguna kedaluwarsa dan tidak dapat diperbarui, THE Auth_System SHALL menghapus cookie Session yang tidak valid dan memperlakukan pengguna sebagai Guest
5. THE Middleware SHALL membaca Session dari cookie pada setiap request untuk menentukan status autentikasi pengguna tanpa memanggil Supabase API secara berlebihan
6. THE Auth_System SHALL menyediakan helper `getUser()` di server components untuk mengambil data Registered_User yang sedang login dari Session yang aktif

---

### Requirement 4: Proteksi Route Berdasarkan Status Login

**User Story:** Sebagai pengelola platform, saya ingin mengontrol akses ke setiap halaman berdasarkan status login pengguna, agar fitur berbayar hanya bisa diakses oleh Registered_User yang berhak — tanpa menghalangi Guest dari layanan dasar.

#### Acceptance Criteria

1. THE Middleware SHALL menegakkan aturan akses berikut untuk setiap route:
   - `/` (halaman utama): dapat diakses oleh Guest dan Registered_User
   - `/cek-lartas`: dapat diakses oleh Guest (rate limited + artificial delay) dan Registered_User
   - `/shipments`: dapat diakses oleh Guest (CRUD, maks 26 shipment, reset awal bulan) dan Registered_User
   - `/feedback`: dapat diakses oleh Guest dan Registered_User
   - `/blscann`: hanya dapat diakses oleh Registered_User (memerlukan credit); Guest diarahkan ke `/login?next=/blscann`
   - `/upgrade`: dapat diakses oleh Guest dan Registered_User
   - `/login`: dapat diakses oleh Guest; WHEN Registered_User mengakses `/login`, THE Middleware SHALL mengarahkan ke `/`

2. WHEN Guest mengakses route yang memerlukan login (`/blscann`), THE Middleware SHALL mengarahkan ke `/login` dengan parameter `?next=/blscann`
3. WHEN pengguna berhasil login setelah diarahkan dari halaman lain, THE Auth_System SHALL mengarahkan pengguna ke URL yang tersimpan di parameter `next`
4. THE Middleware SHALL memproteksi semua API route di bawah `/api/*` yang memerlukan autentikasi dengan memvalidasi Session dari cookie; IF Session tidak valid, THEN THE Middleware SHALL mengembalikan response HTTP 401

---

### Requirement 5: Akses Guest dengan Rate Limiting dan Batasan Shipment

**User Story:** Sebagai pengunjung yang belum punya akun, saya ingin bisa mencoba fitur Cek Lartas dan mengelola shipment tanpa harus mendaftar dulu, agar saya bisa menilai manfaat platform sebelum membuat akun.

#### Acceptance Criteria

1. THE Auth_System SHALL mengizinkan Guest mengakses fitur Cek Lartas dengan batasan harian — nilai batas dikonfigurasi via konstanta `GUEST_DAILY_LIMIT`
2. WHEN Guest melakukan lookup Cek Lartas, THE Auth_System SHALL menambahkan artificial delay (throttling response) sebelum mengembalikan hasil — durasi delay dikonfigurasi via konstanta `GUEST_RESPONSE_DELAY_MS`
3. THE Auth_System SHALL melacak jumlah lookup Guest menggunakan kombinasi IP address dan browser fingerprint yang disimpan di sisi server
4. WHEN Guest masih memiliki sisa kuota, THE Auth_System SHALL memproses request dan mengurangi kuota sebesar 1
5. WHEN Guest telah mencapai batas `GUEST_DAILY_LIMIT` lookup per hari, THE Auth_System SHALL menolak request dan mengembalikan pesan "Batas pencarian harian tercapai. Daftar akun gratis untuk akses tanpa batas."
6. THE Auth_System SHALL mereset kuota Guest setiap 24 jam sejak lookup pertama pada hari tersebut
7. WHEN Guest melihat sisa kuota mendekati batas, THE Auth_System SHALL menampilkan banner "Sisa X pencarian hari ini. Daftar gratis untuk akses tanpa batas." di halaman Cek Lartas; threshold tampilan banner dikonfigurasi via konstanta
8. THE Auth_System SHALL mengizinkan Guest melakukan CRUD shipment di halaman `/shipments` dengan batas maksimal 26 shipment yang tersimpan di IndexedDB browser
9. WHEN jumlah shipment Guest mencapai 26, THE Auth_System SHALL menolak penambahan shipment baru dan menampilkan prompt untuk login atau mendaftar
10. THE Auth_System SHALL mereset data shipment Guest di IndexedDB pada tanggal 1 setiap bulan
11. IF sistem rate limiting tidak dapat menentukan identitas Guest (misalnya karena header yang hilang), THEN THE Auth_System SHALL menolak request dengan pesan error yang sama seperti kuota habis

---

### Requirement 6: Logout

**User Story:** Sebagai Registered_User yang sudah login, saya ingin bisa logout dari platform, agar session saya tidak aktif di perangkat bersama.

#### Acceptance Criteria

1. THE Navbar SHALL menampilkan tombol "Logout" yang terlihat hanya saat pengguna sudah login sebagai Registered_User
2. WHEN pengguna mengklik tombol "Logout", THE Auth_System SHALL menghapus Session aktif di Supabase dan menghapus cookie Session dari browser
3. WHEN proses logout selesai, THE Auth_System SHALL mengarahkan pengguna ke halaman utama (`/`) sebagai Guest
4. IF proses logout gagal karena error jaringan, THEN THE Auth_System SHALL tetap menghapus cookie Session lokal dan mengarahkan pengguna ke `/` sehingga pengguna tidak terjebak dalam state login yang rusak

---

### Requirement 7: Halaman Auth (Login/Daftar)

**User Story:** Sebagai pengunjung platform Pesisir, saya ingin halaman login yang jelas dan sesuai branding, agar saya merasa percaya untuk memberikan akses OAuth ke platform ini.

#### Acceptance Criteria

1. THE Auth_Page SHALL dapat diakses di path `/login`
2. THE Auth_Page SHALL menampilkan logo dan nama "Pesisir" sesuai branding yang ada di platform
3. THE Auth_Page SHALL menggunakan Bahasa Indonesia untuk semua teks naratif, dengan istilah teknis dalam bahasa Inggris yang sudah umum (login, logout, dashboard, dll) dipertahankan
4. THE Auth_Page SHALL menampilkan penjelasan singkat tentang manfaat membuat akun (akses Shipments, Cek Lartas tanpa batas, fitur berbayar dengan credit)
5. THE Auth_Page SHALL menampilkan satu tombol OAuth yang jelas dengan ikon Google: "Login dengan Google"
6. WHEN proses OAuth sedang berlangsung (setelah tombol diklik), THE Auth_Page SHALL menonaktifkan tombol dan menampilkan indikator loading
7. THE Auth_Page SHALL menampilkan pesan error secara inline di bawah tombol OAuth, bukan sebagai alert browser
8. THE Auth_Page SHALL menampilkan tautan "Lanjutkan tanpa akun" yang mengarahkan pengguna kembali ke halaman utama (`/`) untuk pengguna yang tidak ingin mendaftar

---

### Requirement 8: Struktur User Profile di Supabase

**User Story:** Sebagai pengelola platform, saya ingin data profil pengguna tersimpan dengan struktur yang jelas di Supabase, agar status akses dapat divalidasi dengan andal di setiap request.

#### Acceptance Criteria

1. THE Auth_System SHALL menyimpan profil Registered_User di tabel `profiles` di Supabase dengan kolom: `id` (UUID, primary key, referensi ke `auth.users`), `email` (text, not null), `referral_code` (text, unique, not null), `server_storage_activated` (boolean, not null, default false), dan `created_at` (timestamptz, not null, default `now()`)
2. THE Auth_System SHALL membuat baris `profiles` baru secara otomatis menggunakan Supabase database trigger `on auth.users insert` sehingga setiap Registered_User selalu memiliki profil
3. THE Auth_System SHALL menggunakan Row Level Security (RLS) di Supabase sehingga Registered_User hanya dapat membaca dan mengupdate profil miliknya sendiri
4. WHEN Auth_System perlu memvalidasi status pengguna di server, THE Auth_System SHALL mengambil data dari tabel `profiles` menggunakan Supabase service role client — bukan dari JWT claim yang dapat dimanipulasi client
5. THE Auth_System SHALL tidak menyimpan data sensitif seperti token OAuth atau refresh token OAuth_Provider di tabel `profiles`

---

### Requirement 9: Indikator Status Login di Navbar

**User Story:** Sebagai pengguna platform, saya ingin melihat status login saya di navbar, agar saya tahu apakah saya sedang menggunakan platform sebagai Guest atau sebagai Registered_User.

#### Acceptance Criteria

1. WHEN pengguna adalah Guest, THE Navbar SHALL menampilkan tombol "Login" yang mengarahkan ke `/login`
2. WHEN pengguna adalah Registered_User, THE Navbar SHALL menampilkan avatar atau inisial nama pengguna beserta Credit_Balance saat ini
3. WHEN pengguna adalah Registered_User, THE Navbar SHALL menampilkan tombol "Logout" di samping informasi pengguna
4. THE Navbar SHALL menampilkan status login yang akurat berdasarkan Session yang aktif — tidak menampilkan status login jika Session tidak valid atau sudah kedaluwarsa

---

### Requirement 10: Penyimpanan Data Shipment Berbasis Status Pengguna

**User Story:** Sebagai pengelola platform, saya ingin data shipment disimpan sesuai status pengguna, agar Guest mendapat pengalaman dasar sementara Registered_User mendapat fleksibilitas penyimpanan.

#### Acceptance Criteria

1. WHILE pengguna adalah Guest, THE Auth_System SHALL menyimpan dan membaca semua data shipment dari IndexedDB browser dengan batas maksimal 26 shipment — tidak ada data shipment yang dikirim ke server
2. WHILE pengguna adalah Guest, THE Auth_System SHALL mereset data shipment di IndexedDB pada tanggal 1 setiap bulan
3. WHILE pengguna adalah Registered_User dan `server_storage_activated` bernilai false, THE Auth_System SHALL menyimpan dan membaca semua data shipment dari IndexedDB browser tanpa batas jumlah dan tanpa reset bulanan
4. WHILE pengguna adalah Registered_User dan `server_storage_activated` bernilai true, THE Auth_System SHALL menyimpan dan membaca semua data shipment dari tabel `shipments` di Supabase
5. THE Auth_System SHALL membuat tabel `shipments` di Supabase dengan kolom: `id` (UUID, primary key), `user_id` (UUID, referensi ke `auth.users`, not null), `shipment_number` (text, not null), `bl_number` (text, not null), `shipper_name` (text, not null), `consignee_name` (text, not null), `vessel_name` (text, nullable), `voyage` (text, nullable), `port_of_loading` (text, nullable), `port_of_discharge` (text, nullable), `eta` (date, nullable), `custom_notification_date` (date, nullable), `alias` (text, nullable), `notes` (text, nullable), `status` (text, not null, default `"active"`), `created_at` (timestamptz, not null, default `now()`), dan `updated_at` (timestamptz, not null)
6. THE Auth_System SHALL menegakkan Row Level Security (RLS) di tabel `shipments` sehingga setiap Registered_User hanya dapat membaca, membuat, mengupdate, dan menghapus data shipment miliknya sendiri berdasarkan `user_id`

---

### Requirement 11: Aktivasi Server Storage

**User Story:** Sebagai Registered_User, saya ingin bisa mengaktifkan penyimpanan server untuk data shipment saya, agar data saya bisa diakses dari perangkat manapun.

#### Acceptance Criteria

1. WHEN Registered_User memilih untuk mengaktifkan Server_Storage, THE Auth_System SHALL memotong credit sebesar `SERVER_STORAGE_ACTIVATION_COST` dari Credit_Balance pengguna
2. WHEN credit berhasil dipotong, THE Auth_System SHALL mengupdate kolom `server_storage_activated` di tabel `profiles` menjadi true — perubahan ini permanen dan tidak dapat dibatalkan
3. WHEN `server_storage_activated` diset true, THE Auth_System SHALL secara otomatis membaca semua data shipment dari IndexedDB browser pengguna dan menyinkronkannya ke tabel `shipments` di Supabase
4. WHEN sinkronisasi ke Supabase berhasil, THE Auth_System SHALL mempertahankan data di IndexedDB lokal sebagai cache — tidak menghapus data lokal
5. THE Auth_System SHALL menghindari duplikasi data saat sinkronisasi dengan memeriksa keunikan `bl_number` per `user_id` sebelum menyimpan ke Supabase; IF data dengan `bl_number` yang sama sudah ada, THEN THE Auth_System SHALL melewati data tersebut tanpa error
6. IF sinkronisasi ke Supabase gagal karena error jaringan, THEN THE Auth_System SHALL menampilkan pesan "Sync data gagal. Data lokal Anda tetap aman. Coba lagi nanti." dan tidak mengubah status `server_storage_activated`
7. IF Credit_Balance Registered_User tidak mencukupi untuk membayar `SERVER_STORAGE_ACTIVATION_COST`, THEN THE Auth_System SHALL menampilkan prompt untuk membeli credit terlebih dahulu
8. WHEN Registered_User dengan `server_storage_activated` true membuka platform di perangkat baru, THE Auth_System SHALL memuat data shipment dari Supabase — bukan dari IndexedDB lokal yang kosong di perangkat tersebut

---

### Requirement 12: Sistem Credit

**User Story:** Sebagai pengelola platform, saya ingin sistem credit universal yang mengatur akses ke fitur berbayar, agar monetisasi bisa dilakukan secara fleksibel dengan bobot berbeda per fitur.

#### Acceptance Criteria

1. THE Auth_System SHALL membuat tabel `credits` di Supabase dengan kolom: `id` (UUID, primary key), `user_id` (UUID, referensi ke `auth.users`, not null), `amount` (integer, not null), `type` (text, not null — salah satu dari `"welcome"`, `"purchased"`, `"referral"`), `expires_at` (timestamptz, nullable — null berarti tidak hangus), dan `created_at` (timestamptz, not null, default `now()`)
2. THE Auth_System SHALL menegakkan Row Level Security (RLS) di tabel `credits` sehingga Registered_User hanya dapat membaca credit miliknya sendiri — insert dan update hanya boleh dilakukan via server-side functions, tidak langsung dari client
3. WHEN baris baru dibuat di tabel `profiles`, THE Auth_System SHALL secara otomatis memberikan Welcome_Credit sebesar `WELCOME_CREDIT_AMOUNT` ke pengguna baru via database trigger, dengan `type` diset ke `"welcome"` dan `expires_at` diset ke 30 hari dari `created_at`
4. THE Auth_System SHALL menetapkan `expires_at` sebesar 30 hari dari `created_at` untuk credit dengan `type` `"welcome"` dan `"referral"`
5. THE Auth_System SHALL menetapkan `expires_at` null (tidak hangus) untuk credit dengan `type` `"purchased"`
6. WHEN sistem menggunakan credit untuk fitur berbayar, THE Auth_System SHALL menggunakan credit yang akan expire lebih dulu terlebih dahulu (FIFO by expiry) — credit tanpa expiry digunakan paling terakhir
7. WHEN Credit_Balance Registered_User habis (nol), THE Auth_System SHALL menampilkan prompt untuk membeli credit sebelum melanjutkan akses ke fitur berbayar
8. THE Auth_System SHALL menghitung Credit_Balance sebagai total `amount` dari semua baris credit milik Registered_User yang belum expired dan belum digunakan
9. THE Auth_System SHALL menggunakan Credit_Weight yang dikonfigurasi via konstanta untuk setiap fitur berbayar:
   - `CREDIT_WEIGHT_BL_SCAN`: credit per 1 scan B/L
   - `CREDIT_WEIGHT_LARTAS_BATCH`: credit per grup item LARTAS (jumlah item per grup dikonfigurasi via `LARTAS_BATCH_SIZE`)
   - `SERVER_STORAGE_ACTIVATION_COST`: credit untuk aktivasi Server_Storage (satu kali, permanen)

---

### Requirement 13: Pembelian Credit via Midtrans

**User Story:** Sebagai Registered_User yang kehabisan credit, saya ingin bisa membeli credit melalui platform, agar saya bisa terus menggunakan fitur berbayar tanpa harus menghubungi admin.

#### Acceptance Criteria

1. THE Upgrade_Page SHALL menyediakan opsi pembelian credit yang dapat diakses di path `/upgrade`
2. WHEN Registered_User memilih paket credit dan mengklik tombol beli, THE Auth_System SHALL menginisiasi sesi pembayaran menggunakan Midtrans Snap dan menampilkan popup pembayaran
3. WHEN Midtrans mengirimkan webhook konfirmasi pembayaran berhasil, THE Auth_System SHALL menambahkan credit ke tabel `credits` dengan `type` diset ke `"purchased"` dan `expires_at` diset ke null
4. WHEN pembayaran gagal atau dibatalkan oleh pengguna, THE Auth_System SHALL tidak menambahkan credit apapun dan menampilkan pesan status yang sesuai
5. THE Navbar SHALL menampilkan Credit_Balance saat ini untuk Registered_User yang sudah login

---

### Requirement 14: Sistem Referral

**User Story:** Sebagai Registered_User platform Pesisir, saya ingin punya kode referral yang bisa saya bagikan ke teman, agar saya dan teman saya sama-sama mendapatkan credit bonus.

#### Acceptance Criteria

1. THE Auth_System SHALL menyimpan Referral_Code unik di kolom `referral_code` (text, unique, not null) di tabel `profiles` untuk setiap Registered_User
2. WHEN pengguna baru pertama kali mendaftar, THE Auth_System SHALL secara otomatis membuat Referral_Code dengan format 8 karakter alphanumeric uppercase (contoh: `PESISIR1`, `ABCD1234`) via database trigger atau server-side function
3. THE Auth_System SHALL membuat tabel `referrals` di Supabase dengan kolom: `id` (UUID, primary key), `referrer_id` (UUID, referensi ke `auth.users` — user yang punya kode), `referred_id` (UUID, referensi ke `auth.users` — user baru yang pakai kode), `created_at` (timestamptz, not null, default `now()`), dan `rewarded_at` (timestamptz, nullable — kapan reward diberikan)
4. THE Auth_Page SHALL menyediakan field opsional untuk memasukkan Referral_Code di halaman `/login` atau setelah login pertama
5. WHEN pengguna baru berhasil mendaftar menggunakan Referral_Code yang valid, THE Auth_System SHALL:
   a. Membuat baris baru di tabel `referrals` dengan `referrer_id` dan `referred_id` yang sesuai
   b. Memberikan credit referral ke referrer sebesar `REFERRAL_CREDIT_AMOUNT` dengan `type` `"referral"` dan `expires_at` 30 hari dari saat ini
   c. Memberikan credit bonus ke pengguna baru sebesar `REFERRAL_BONUS_CREDIT_AMOUNT` dengan `type` `"referral"` dan `expires_at` 30 hari dari saat ini
   d. Mengupdate kolom `rewarded_at` di tabel `referrals` dengan timestamp saat reward diberikan
6. THE Auth_System SHALL membatasi satu akun hanya bisa menggunakan satu Referral_Code seumur hidup akun — penggunaan kode referral kedua harus ditolak
7. IF Referral_Code yang dimasukkan tidak valid atau tidak ditemukan, THEN THE Auth_System SHALL menampilkan pesan error inline tanpa menggagalkan proses registrasi
8. THE Auth_System SHALL menampilkan Referral_Code milik Registered_User dan jumlah referral berhasil di halaman profil

---

### Requirement 15: Halaman Upgrade (`/upgrade`)

**User Story:** Sebagai Guest atau Registered_User yang ingin mengetahui fitur berbayar platform, saya ingin ada halaman yang menjelaskan apa yang bisa dilakukan dengan credit, agar saya bisa membuat keputusan untuk membeli credit.

#### Acceptance Criteria

1. THE Upgrade_Page SHALL dapat diakses di path `/upgrade` oleh Guest dan Registered_User
2. THE Upgrade_Page SHALL menampilkan daftar fitur berbayar beserta Credit_Weight masing-masing fitur
3. THE Upgrade_Page SHALL menampilkan Credit_Balance Registered_User saat ini — "Anda saat ini memiliki X credit" atau "Anda belum login"
4. THE Upgrade_Page SHALL menampilkan status Server_Storage pengguna (aktif atau belum aktif) beserta opsi aktivasi jika belum aktif
5. WHEN pengguna adalah Guest atau Registered_User dengan Credit_Balance nol, THE Upgrade_Page SHALL menampilkan opsi pembelian credit via Midtrans
6. WHEN pengguna adalah Registered_User dengan Credit_Balance aktif, THE Upgrade_Page SHALL menampilkan sisa credit dan opsi untuk menambah credit
7. THE Upgrade_Page SHALL menggunakan Bahasa Indonesia untuk semua teks naratif, dengan istilah teknis (credit, upgrade, payment) dipertahankan dalam bahasa Inggris
8. THE Upgrade_Page SHALL menampilkan informasi cara membeli credit secara jelas, termasuk langkah-langkah proses pembayaran via Midtrans

---

### Requirement 16: Fitur Berbayar — Batch Cek LARTAS

**User Story:** Sebagai Registered_User, saya ingin bisa mengupload file berisi banyak HS code sekaligus untuk dicek status LARTAS-nya, agar saya tidak perlu memasukkan kode satu per satu.

#### Acceptance Criteria

1. THE Auth_System SHALL mengizinkan Registered_User mengupload file untuk batch lookup LARTAS dalam format: Excel (.xlsx, .xls), CSV, JSON, dan PDF
2. WHEN Registered_User mengupload file, THE Auth_System SHALL menampilkan preview data yang akan diproses beserta estimasi credit yang akan digunakan sebelum memproses
3. THE Auth_System SHALL menghitung estimasi credit berdasarkan jumlah item dalam file, dibulatkan ke atas per grup: `ceil(jumlah_item / LARTAS_BATCH_SIZE) × CREDIT_WEIGHT_LARTAS_BATCH`
4. THE Auth_System SHALL menampilkan data yang akan diproses dan memberi kesempatan kepada Registered_User untuk mengedit atau menghapus item sebelum konfirmasi
5. WHEN Registered_User mengkonfirmasi pemrosesan, THE Auth_System SHALL memotong credit sesuai estimasi dan memproses batch lookup
6. IF Credit_Balance Registered_User tidak mencukupi untuk memproses batch, THEN THE Auth_System SHALL menampilkan prompt untuk membeli credit dan tidak memproses file
7. WHEN batch lookup selesai diproses, THE Auth_System SHALL menampilkan hasil untuk setiap item dalam file

---

### Requirement 17: Fitur Berbayar dan Gratis — Shipments

**User Story:** Sebagai Registered_User, saya ingin menggunakan fitur tambahan pada halaman Shipments seperti scan B/L otomatis dan export data, agar pekerjaan operasional saya lebih efisien.

#### Acceptance Criteria

1. WHEN Registered_User memilih untuk scan B/L PDF, THE Auth_System SHALL memotong credit sebesar `CREDIT_WEIGHT_BL_SCAN` per satu dokumen B/L yang di-scan
2. IF Credit_Balance Registered_User tidak mencukupi untuk scan B/L, THEN THE Auth_System SHALL menampilkan prompt untuk membeli credit dan tidak memproses scan
3. THE Auth_System SHALL mengizinkan Registered_User mengekspor data shipment ke format Excel tanpa memotong credit — fitur export gratis untuk semua Registered_User
4. THE Auth_System SHALL mengizinkan Registered_User menerima ETA notifications tanpa memotong credit — fitur notifikasi gratis untuk semua Registered_User
5. THE Auth_System SHALL mengizinkan Guest dan Registered_User melakukan pencarian dan filter data shipment tanpa memotong credit — fitur pencarian dan filter gratis untuk semua pengguna
