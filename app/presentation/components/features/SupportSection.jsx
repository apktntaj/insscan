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
            Saya memiliki pengalaman di bidang kepabeanan dan mengikuti ujian pabean beberapa waktu lalu. Dari pengalaman tersebut, saya melihat langsung bagaimana proses operasional berjalan—termasuk tantangan dalam pengelolaan data, proses yang repetitif, dan kebutuhan akan visibilitas yang lebih baik.
          </p>
          <p>
            Selain itu, saya juga banyak belajar dari lingkungan sekitar, di mana praktik kerja sehari-hari memberikan gambaran nyata tentang kebutuhan di lapangan.

            Pesisir saya bangun sebagai upaya untuk menjawab sebagian dari kebutuhan tersebut.
          </p>
          <p>
            Saya terbuka untuk kolaborasi maupun pengembangan solusi serupa sesuai kebutuhan internal tim atau perusahaan. Jika relevan, silakan hubungi saya melalui WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
}
