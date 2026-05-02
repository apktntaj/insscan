/**
 * SupportSection Component
 * Presentation Layer — Feature component
 *
 * Menampilkan QRIS image dan teks personal developer (indie hacker context + ajakan kolaborasi).
 */

import Image from "next/image";

/**
 * Merender QRIS image dan teks personal developer (indie hacker context + ajakan kolaborasi).
 *
 * @param {{ qrisImagePath: string }} props
 * @returns {JSX.Element}
 *
 * @example
 * // Render menghasilkan img dengan src dan alt yang benar
 * <SupportSection qrisImagePath="/qris-pesisir.png" />
 * // => <img src="/qris-pesisir.png" alt="QR code QRIS untuk donasi ke developer Pesisir Platform" />
 *
 * @example
 * // Render dengan path berbeda menghasilkan src yang berbeda
 * <SupportSection qrisImagePath="/qris-v2.png" />
 * // => <img src="/qris-v2.png" alt="..." />
 */
export default function SupportSection({ qrisImagePath }) {
  return (
    <section aria-labelledby="support-heading">
      <h2
        id="support-heading"
        className="text-lg font-semibold text-zinc-900"
      >
        Dukung Pengembangan
      </h2>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* QRIS Image */}
        <div className="shrink-0">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <Image
              src={qrisImagePath}
              alt="QR code QRIS untuk donasi ke developer Pesisir Platform"
              width={180}
              height={180}
              className="h-44 w-44 object-contain"
            />
          </div>
          <p className="mt-2 text-center text-xs text-zinc-400">Scan untuk donasi</p>
        </div>

        {/* Personal text */}
        <div className="space-y-3 text-sm leading-7 text-zinc-600">
          <p>
            Platform ini dikerjakan sendiri di sela-sela kerjaan utama — bukan produk korporat, bukan tim besar. Cuma satu orang yang coba bikin sesuatu yang berguna buat teman-teman di industri logistik dan kepabeanan.
          </p>
          <p>
            Kalau platform ini pernah menghemat waktu kamu, donasi kecil via QRIS di samping sangat berarti dan membantu supaya pengembangan bisa terus jalan.
          </p>
          <p className="text-zinc-500">
            Terbuka juga untuk kolaborasi dan pekerjaan freelance — kalau kamu atau perusahaan kamu butuh tool operasional custom, sistem internal, atau sekadar konsultasi teknis, jangan ragu untuk reach out via WhatsApp di atas.
          </p>
        </div>
      </div>
    </section>
  );
}
