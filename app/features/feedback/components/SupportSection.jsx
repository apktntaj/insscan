/**
 * SupportSection Component
 * Presentation Layer — Feature component
 *
 * Menampilkan foto developer dan perkenalan diri dengan background di bidang kepabeanan.
 */

import Image from "next/image";

/**
 * Merender foto developer dan perkenalan diri dengan background di bidang kepabeanan.
 *
 * @param {{ developerPhotoPath: string }} props - Path ke foto developer
 * @returns {JSX.Element}
 *
 * @example
 * <SupportSection developerPhotoPath="/photo-developer.jpg" />
 * // => Menampilkan foto developer dengan perkenalan diri
 */
export default function SupportSection({ developerPhotoPath }) {
  return (
    <section aria-labelledby="about-heading">
      <h2
        id="about-heading"
        className="text-lg font-semibold text-zinc-900"
      >
        Tentang Developer
      </h2>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Developer Photo */}
        <div className="shrink-0">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <Image
              src={developerPhotoPath}
              alt="Foto developer Pesisir Platform"
              width={180}
              height={180}
              className="h-44 w-44 object-cover"
            />
          </div>
        </div>

        {/* Personal introduction */}
        <div className="space-y-2 text-sm leading-6 text-zinc-600">
          <p>
            Kedekatan saya dengan industri kepabeanan tumbuh dari lingkungan keluarga dan pengalaman langsung terlibat di dalamnya — cukup untuk memahami bagaimana operasional PPJK berjalan di lapangan.
          </p>
          <p>
            Pesisir bermula dari kebutuhan nyata: mencari data lartas dan bea masuk untuk sejumlah besar HS Code dengan tenggat waktu singkat (waktu itu). Proses yang sebelumnya memakan waktu berjam-jam jika dilakukan secara manual. Dari situ, pengembangan berlanjut berdasarkan observasi terhadap tantangan operasional yang umum dihadapi oleh tim kepabeanan.

          </p>
          <p>
            Saya terbuka untuk kolaborasi maupun pengembangan solusi serupa sesuai kebutuhan internal tim atau perusahaan. Jika relevan, silakan hubungi saya melalui WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
}
