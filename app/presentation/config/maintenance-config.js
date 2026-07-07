/**
 * Maintenance Window Configuration
 * Presentation Layer - Config
 *
 * Konfigurasi jendela maintenance untuk fitur-fitur tertentu.
 * Komponen UI membaca dari sini untuk menentukan kapan harus menampilkan blur overlay.
 *
 * Semua waktu menggunakan format 24 jam (0–23 untuk jam, 0–59 untuk menit).
 * Timezone mengikuti browser pengguna — pastikan pengguna berada di WIB.
 */

/**
 * Satu jendela maintenance untuk sebuah fitur.
 *
 * @typedef {Object} MaintenanceWindow
 * @property {boolean} enabled        — aktifkan/nonaktifkan blur overlay tanpa menghapus config
 * @property {{ hour: number, minute: number }} startTime — waktu mulai blur (inklusif)
 * @property {{ hour: number, minute: number }} endTime   — waktu selesai blur (inklusif)
 * @property {string}  title          — judul yang ditampilkan di overlay
 * @property {string}  message        — pesan penjelasan untuk pengguna
 *
 * Invariant: hour harus antara 0–23, minute antara 0–59.
 * Catatan: jika startTime > endTime (melewati tengah malam), window dianggap overnight.
 *   Contoh: start 23:50, end 00:30 → blur dari 23:50 sampai 00:30 keesokan harinya.
 */

/**
 * @type {Record<string, MaintenanceWindow>}
 *
 * Key adalah identifier fitur, dipakai oleh komponen untuk lookup.
 * Tambahkan entry baru di sini untuk fitur lain yang butuh maintenance window.
 */
export const maintenanceWindows = {
  "cek-lartas": {
    enabled: false,
    startTime: { hour: 23, minute: 50 },
    endTime: { hour: 6, minute: 0 },
    title: "Fitur Sedang Tidak Tersedia",
    message:
      "Cek Lartas tidak tersedia di jam ini. Silakan coba kembali setelah pukul 06.00 pagi.",
  },
};
