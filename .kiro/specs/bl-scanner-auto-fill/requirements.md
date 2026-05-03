# Requirements Document

## Introduction

BL Scanner Auto-Fill adalah fitur yang mengotomasi pengisian form shipment dengan mengekstrak data dari dokumen Bill of Lading (B/L) berformat PDF. Fitur ini mengurangi waktu entry data dari 15 menit menjadi beberapa detik dengan cara parsing otomatis dan auto-fill form shipment.

Fitur ini merupakan enhancement dari BL Scanner yang sudah ada (`/blscann`) yang saat ini hanya menyediakan fungsi click-to-copy. Target utama adalah menghilangkan manual copy-paste dan mempercepat proses operasional PPJK dan freight forwarder.

## Glossary

- **BL_Scanner**: Komponen React yang menampilkan PDF Bill of Lading dan menangani interaksi user
- **PDF_Parser**: Service yang mengekstrak teks mentah dari PDF menggunakan pdfjs-dist
- **BL_Extractor**: Service yang mengidentifikasi dan mengekstrak field-field shipment dari teks PDF
- **Form_Filler**: Service yang mengisi ShipmentForm dengan data hasil ekstraksi
- **ShipmentForm**: Komponen form untuk create/edit shipment dengan field wajib dan opsional
- **Extraction_Result**: Objek yang berisi field-field shipment yang berhasil diekstrak dari PDF
- **Confidence_Score**: Nilai 0-1 yang menunjukkan tingkat keyakinan ekstraksi untuk setiap field
- **User**: Staff operasional PPJK atau freight forwarder yang menggunakan sistem

## Requirements

### Requirement 1: PDF Upload dan Parsing

**User Story:** Sebagai User, saya ingin upload PDF Bill of Lading, sehingga sistem dapat mengekstrak data shipment secara otomatis.

#### Acceptance Criteria

1. WHEN User memilih file PDF, THE BL_Scanner SHALL validate bahwa file berformat PDF
2. WHEN file PDF valid dipilih, THE PDF_Parser SHALL mengekstrak seluruh teks dari semua halaman PDF
3. IF file bukan PDF atau corrupt, THEN THE BL_Scanner SHALL menampilkan pesan error dalam Bahasa Indonesia
4. WHEN ekstraksi teks selesai, THE BL_Scanner SHALL menyimpan teks hasil ekstraksi untuk proses selanjutnya
5. THE PDF_Parser SHALL memproses PDF dalam waktu maksimal 5 detik untuk file berukuran hingga 5MB

### Requirement 2: Ekstraksi Field Shipment

**User Story:** Sebagai User, saya ingin sistem mengidentifikasi field-field shipment dari PDF, sehingga data dapat diisi ke form secara otomatis.

#### Acceptance Criteria

1. WHEN teks PDF tersedia, THE BL_Extractor SHALL mencari dan mengekstrak B/L Number dari teks
2. WHEN teks PDF tersedia, THE BL_Extractor SHALL mencari dan mengekstrak Shipper Name dari teks
3. WHEN teks PDF tersedia, THE BL_Extractor SHALL mencari dan mengekstrak Consignee Name dari teks
4. WHEN teks PDF tersedia, THE BL_Extractor SHALL mencari dan mengekstrak Vessel Name dari teks
5. WHEN teks PDF tersedia, THE BL_Extractor SHALL mencari dan mengekstrak Voyage number dari teks
6. WHEN teks PDF tersedia, THE BL_Extractor SHALL mencari dan mengekstrak Port of Loading dari teks
7. WHEN teks PDF tersedia, THE BL_Extractor SHALL mencari dan mengekstrak Port of Discharge dari teks
8. WHEN teks PDF tersedia, THE BL_Extractor SHALL mencari dan mengekstrak ETA date dari teks
9. FOR ALL extracted fields, THE BL_Extractor SHALL assign Confidence_Score berdasarkan pattern matching quality
10. WHEN field tidak ditemukan dalam teks, THE BL_Extractor SHALL menandai field tersebut sebagai null dalam Extraction_Result

### Requirement 3: Pattern Recognition untuk Field Identification

**User Story:** Sebagai User, saya ingin sistem mengenali berbagai format B/L dari shipping line berbeda, sehingga ekstraksi data akurat untuk berbagai jenis dokumen.

#### Acceptance Criteria

1. THE BL_Extractor SHALL menggunakan pattern matching dengan keyword "B/L NO", "BILL OF LADING NO", "BL NUMBER" untuk mengidentifikasi B/L Number
2. THE BL_Extractor SHALL menggunakan pattern matching dengan keyword "SHIPPER", "CONSIGNOR" untuk mengidentifikasi Shipper Name
3. THE BL_Extractor SHALL menggunakan pattern matching dengan keyword "CONSIGNEE", "NOTIFY PARTY" untuk mengidentifikasi Consignee Name
4. THE BL_Extractor SHALL menggunakan pattern matching dengan keyword "VESSEL", "VESSEL NAME" untuk mengidentifikasi Vessel Name
5. THE BL_Extractor SHALL menggunakan pattern matching dengan keyword "VOYAGE", "VOY", "VOYAGE NO" untuk mengidentifikasi Voyage number
6. THE BL_Extractor SHALL menggunakan pattern matching dengan keyword "PORT OF LOADING", "POL", "PLACE OF RECEIPT" untuk mengidentifikasi Port of Loading
7. THE BL_Extractor SHALL menggunakan pattern matching dengan keyword "PORT OF DISCHARGE", "POD", "PLACE OF DELIVERY" untuk mengidentifikasi Port of Discharge
8. THE BL_Extractor SHALL menggunakan pattern matching dengan keyword "ETA", "ESTIMATED TIME OF ARRIVAL", "ETD" untuk mengidentifikasi date values
9. WHEN multiple candidate values ditemukan untuk satu field, THE BL_Extractor SHALL memilih candidate dengan Confidence_Score tertinggi
10. THE BL_Extractor SHALL normalize extracted text menjadi uppercase sebelum menyimpan ke Extraction_Result

### Requirement 4: Auto-Fill ShipmentForm

**User Story:** Sebagai User, saya ingin form shipment terisi otomatis dengan data hasil ekstraksi, sehingga saya tidak perlu manual copy-paste dari PDF.

#### Acceptance Criteria

1. WHEN ekstraksi selesai, THE Form_Filler SHALL membuka ShipmentForm dalam mode create
2. WHEN ShipmentForm terbuka, THE Form_Filler SHALL mengisi field blNumber dengan extracted B/L Number
3. WHEN ShipmentForm terbuka, THE Form_Filler SHALL mengisi field shipperName dengan extracted Shipper Name
4. WHEN ShipmentForm terbuka, THE Form_Filler SHALL mengisi field consigneeName dengan extracted Consignee Name
5. WHEN ShipmentForm terbuka, THE Form_Filler SHALL mengisi field vesselName dengan extracted Vessel Name
6. WHEN ShipmentForm terbuka, THE Form_Filler SHALL mengisi field voyage dengan extracted Voyage number
7. WHEN ShipmentForm terbuka, THE Form_Filler SHALL mengisi field portOfLoading dengan extracted Port of Loading
8. WHEN ShipmentForm terbuka, THE Form_Filler SHALL mengisi field portOfDischarge dengan extracted Port of Discharge
9. WHEN ShipmentForm terbuka, THE Form_Filler SHALL mengisi field eta dengan extracted ETA date dalam format YYYY-MM-DD
10. WHEN extracted field bernilai null, THE Form_Filler SHALL membiarkan form field kosong untuk manual input User

### Requirement 5: User Review dan Correction

**User Story:** Sebagai User, saya ingin mereview dan mengoreksi data hasil ekstraksi sebelum save, sehingga data shipment yang tersimpan akurat dan sesuai dokumen asli.

#### Acceptance Criteria

1. WHEN ShipmentForm terisi otomatis, THE BL_Scanner SHALL menampilkan indikator visual bahwa data berasal dari auto-fill
2. WHEN ShipmentForm terisi otomatis, THE User SHALL dapat mengedit semua field yang terisi
3. WHEN User mengedit field yang terisi otomatis, THE ShipmentForm SHALL menerima perubahan tanpa validasi tambahan
4. WHEN User submit form, THE ShipmentForm SHALL melakukan validasi standar untuk required fields
5. IF required field kosong setelah auto-fill, THEN THE ShipmentForm SHALL menampilkan error message dalam Bahasa Indonesia
6. WHEN User cancel form, THE ShipmentForm SHALL menutup tanpa menyimpan data

### Requirement 6: Confidence Score Display

**User Story:** Sebagai User, saya ingin melihat tingkat keyakinan sistem terhadap data yang diekstrak, sehingga saya tahu field mana yang perlu dicek lebih teliti.

#### Acceptance Criteria

1. WHERE Confidence_Score kurang dari 0.7, THE ShipmentForm SHALL menampilkan warning indicator pada field tersebut
2. WHERE Confidence_Score antara 0.7 dan 0.9, THE ShipmentForm SHALL menampilkan neutral indicator pada field tersebut
3. WHERE Confidence_Score lebih dari 0.9, THE ShipmentForm SHALL menampilkan success indicator pada field tersebut
4. WHEN User hover pada indicator, THE ShipmentForm SHALL menampilkan tooltip dengan nilai Confidence_Score
5. THE ShipmentForm SHALL menampilkan summary badge yang menunjukkan jumlah field dengan low confidence

### Requirement 7: Fallback ke Manual Mode

**User Story:** Sebagai User, saya ingin tetap bisa menggunakan mode click-to-copy jika auto-fill gagal, sehingga workflow saya tidak terganggu.

#### Acceptance Criteria

1. THE BL_Scanner SHALL menyediakan toggle button untuk switch antara auto-fill mode dan click-to-copy mode
2. WHEN User memilih click-to-copy mode, THE BL_Scanner SHALL menonaktifkan auto-fill dan mengaktifkan click-to-copy behavior
3. WHEN User memilih auto-fill mode, THE BL_Scanner SHALL menonaktifkan click-to-copy dan mengaktifkan auto-fill behavior
4. WHEN ekstraksi gagal total, THE BL_Scanner SHALL otomatis fallback ke click-to-copy mode dan menampilkan notifikasi
5. THE BL_Scanner SHALL menyimpan preferensi mode User di browser localStorage

### Requirement 8: Error Handling dan User Feedback

**User Story:** Sebagai User, saya ingin mendapat feedback jelas ketika terjadi error, sehingga saya tahu apa yang harus dilakukan selanjutnya.

#### Acceptance Criteria

1. WHEN PDF parsing gagal, THE BL_Scanner SHALL menampilkan error message "Gagal memproses PDF. Pastikan file valid dan berbasis teks."
2. WHEN ekstraksi tidak menemukan required fields, THE BL_Scanner SHALL menampilkan warning message dengan daftar field yang tidak ditemukan
3. WHEN ekstraksi berhasil, THE BL_Scanner SHALL menampilkan success message "Ekstraksi selesai. Form akan dibuka otomatis."
4. WHEN auto-fill selesai, THE ShipmentForm SHALL menampilkan info banner "Data diisi otomatis dari PDF. Silakan review sebelum save."
5. IF network error terjadi, THEN THE BL_Scanner SHALL menampilkan error message "Koneksi bermasalah. Coba lagi."
6. THE BL_Scanner SHALL menampilkan loading indicator selama proses parsing dan ekstraksi berlangsung

### Requirement 9: Performance dan Optimization

**User Story:** Sebagai User, saya ingin proses ekstraksi berjalan cepat, sehingga saya tidak menunggu lama untuk mulai review data.

#### Acceptance Criteria

1. THE PDF_Parser SHALL memproses PDF dengan ukuran 1MB dalam waktu maksimal 2 detik
2. THE BL_Extractor SHALL menyelesaikan ekstraksi dalam waktu maksimal 1 detik untuk teks dengan panjang hingga 10000 karakter
3. THE Form_Filler SHALL mengisi ShipmentForm dalam waktu maksimal 500 milliseconds
4. WHEN PDF berukuran lebih dari 5MB, THE BL_Scanner SHALL menampilkan warning "File besar. Proses mungkin memakan waktu lebih lama."
5. THE BL_Scanner SHALL memproses parsing dan ekstraksi secara asynchronous tanpa blocking UI

### Requirement 10: Data Privacy dan Storage

**User Story:** Sebagai User, saya ingin data PDF saya tidak disimpan di server, sehingga dokumen konfidensial tetap aman.

#### Acceptance Criteria

1. THE PDF_Parser SHALL memproses PDF sepenuhnya di browser client-side
2. THE BL_Extractor SHALL melakukan ekstraksi sepenuhnya di browser client-side
3. THE BL_Scanner SHALL tidak mengirim PDF atau extracted data ke server eksternal
4. WHEN User close browser tab, THE BL_Scanner SHALL menghapus teks PDF dari memory
5. THE BL_Scanner SHALL tidak menyimpan PDF file atau extracted text di IndexedDB atau localStorage

### Requirement 11: Integration dengan Existing Shipment Workflow

**User Story:** Sebagai User, saya ingin auto-fill terintegrasi mulus dengan workflow shipment yang sudah ada, sehingga tidak ada perubahan drastis dalam cara kerja saya.

#### Acceptance Criteria

1. WHEN User mengakses halaman `/blscann`, THE BL_Scanner SHALL menampilkan UI yang konsisten dengan existing design system
2. WHEN auto-fill selesai dan form dibuka, THE ShipmentForm SHALL menggunakan komponen yang sama dengan manual create shipment
3. WHEN User save shipment dari auto-fill, THE ShipmentForm SHALL memanggil use case createShipment yang sama dengan manual flow
4. WHEN shipment berhasil disimpan, THE BL_Scanner SHALL menampilkan success message dan redirect User ke halaman `/shipments`
5. THE BL_Scanner SHALL menggunakan existing ShipmentForm component tanpa modifikasi breaking changes

### Requirement 12: Multi-Page PDF Support

**User Story:** Sebagai User, saya ingin sistem dapat mengekstrak data dari B/L multi-halaman, sehingga semua jenis dokumen B/L dapat diproses.

#### Acceptance Criteria

1. WHEN PDF memiliki lebih dari 1 halaman, THE PDF_Parser SHALL mengekstrak teks dari semua halaman
2. WHEN mengekstrak dari multi-page PDF, THE BL_Extractor SHALL mencari field di semua halaman secara berurutan
3. WHEN field ditemukan di multiple pages, THE BL_Extractor SHALL menggunakan occurrence pertama dengan Confidence_Score tertinggi
4. THE PDF_Parser SHALL menggabungkan teks dari semua halaman dengan page separator untuk mempertahankan context
5. THE BL_Extractor SHALL memproses teks gabungan dalam waktu maksimal 3 detik untuk PDF hingga 10 halaman

