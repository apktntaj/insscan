/**
 * Feedback Page Configuration
 * Presentation Layer - Config
 *
 * Semua data statis untuk halaman /feedback dikonfigurasi di sini.
 * Komponen UI tidak boleh hardcode data ini — selalu ambil dari file ini.
 */

/**
 * Status pengerjaan sebuah fitur di roadmap.
 *
 * @typedef {"live" | "in-progress" | "planned"} FeatureStatus
 *
 * Invariant: hanya tiga nilai yang valid — tidak ada nilai lain yang diizinkan.
 */

/**
 * Satu entri fitur dalam Roadmap Board.
 *
 * @typedef {Object} FeatureItem
 * @property {string}        id          — identifier unik, kebab-case (e.g. "cek-lartas")
 * @property {string}        name        — nama fitur yang ditampilkan ke user
 * @property {string}        description — deskripsi singkat manfaat fitur, maksimal 2 kalimat
 * @property {FeatureStatus} status      — status pengerjaan fitur
 *
 * Invariant: description tidak boleh kosong atau hanya whitespace.
 * Invariant: id harus unik di dalam array roadmapItems.
 */

/**
 * Konfigurasi halaman Feedback.
 *
 * @typedef {Object} FeedbackConfig
 * @property {string}        WHATSAPP_NUMBER — nomor WA tanpa "+" atau spasi (e.g. "6281234567890")
 * @property {string}        QRIS_IMAGE_PATH — path relatif dari public/ (e.g. "/qris-pesisir.png")
 * @property {FeatureItem[]} roadmapItems    — daftar fitur untuk Roadmap Board
 *
 * Invariant: WHATSAPP_NUMBER harus diawali "62" (kode negara Indonesia).
 * Invariant: roadmapItems harus mengandung minimal satu item per FeatureStatus.
 */

/** @type {string} Nomor WhatsApp tanpa "+" atau spasi */
export const WHATSAPP_NUMBER = "6281510093866";

/** @type {string} Path QRIS image relatif dari folder public/ */
export const QRIS_IMAGE_PATH = "/qris-pesisir.png";

/** @type {FeatureItem[]} Daftar fitur untuk Roadmap Board */
export const roadmapItems = [
  {
    id: "cek-lartas",
    name: "Cek Lartas",
    description:
      "Verifikasi HS code, tarif bea masuk, pajak, dan status LARTAS langsung dari INSW. Mendukung pengecekan single maupun batch dari file Excel.",
    status: "live",
  },
  {
    id: "shipments",
    name: "Shipments",
    description:
      "Kelola data pengiriman dan pantau status shipment dalam satu tampilan terpusat. Ekspor data ke Excel untuk dokumentasi bea cukai.",
    status: "live",
  },
  {
    id: "bl-scanner",
    name: "BL Scanner",
    description:
      "Parsing otomatis dokumen Bill of Lading untuk mengisi data pengiriman tanpa input manual. Mengurangi waktu entry dari 15 menit menjadi hitungan detik.",
    status: "in-progress",
  },
  {
    id: "notifikasi-eta",
    name: "Notifikasi ETA",
    description:
      "Notifikasi otomatis saat estimasi kedatangan kapal berubah atau mendekati tanggal tiba. Tidak perlu cek manual setiap hari.",
    status: "planned",
  },
];
