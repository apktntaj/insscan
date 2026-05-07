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

/** @type {string} Path foto developer relatif dari folder public/ */
export const DEVELOPER_PHOTO_PATH = "/me-at-33.jpg";

/** @type {FeatureItem[]} Daftar fitur untuk Roadmap Board */
export const roadmapItems = [
  {
    id: "cek-lartas",
    name: "Cek Lartas",
    status: "live",
  },
  {
    id: "shipments",
    name: "Shipments",
    status: "live",
  },
  {
    id: "bl-scanner",
    name: "Automate filling form once B/L uploaded ",
    status: "live"
  },
  {
    id: "quiz",
    name: "Practice quiz pabean",
    status: "in-progress",
  },
  {
    id: "power-bi",
    name: "power-bi like feature on lartas chekcer",
    status: "planned",
  },
  {
    id: "automate-eta",
    name: "Automating ETA from shipping line",
    status: "planned",
  },
  {
    id: "doc-drafter",
    name: "Draft pabean document",
    status: "planned",
  },
{
    id: "learn-pabean",
    name: "Materi pembelajaran pabean",
    status: "planned",
  },
  {
    id: "hs-code-finder",
    name: "HS code finder",
    status: "planned",
  },
];
