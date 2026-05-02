"use client";

import Link from "next/link";

const productCards = [
  {
    title: "Cek Lartas",
    description:
      "Cek LARTAS dari daftar HS code dari invoice langsung.",
    points: [
      "Tidak perlu cek satu persatu HS code",
      "Unggah file excel yang berisi daftar HS code.",
      "Periksa status LARTAS dan detail regulasi impor.",
    ],
    href: "/cek-lartas",
    cta: "Buka Cek Lartas",
    accent: "from-cyan-500/20 to-sky-500/20",
    dot: "bg-cyan-500",
  },
  {
    title: "Shipments",
    description:
      "Kelola data pengiriman dan pantau status shipment dalam satu tempat.",
    points: [
      "Pantau status dan estimasi kedatangan shipment.",
      "Ekspor data ke Excel untuk keperluan arsip dan pelaporan.",
      "Data aman karena tersimpan di browser (bukan di server pihak ketiga)."
    ],
    href: "/shipments",
    cta: "Lihat Shipments",
    accent: "from-sky-500/20 to-cyan-500/20",
    dot: "bg-sky-500",
  },
];

const quickFlow = [
  "Input data pengiriman di modul Shipments — catat nomor BL, shipper, dan estimasi kedatangan.",
  "Verifikasi HS code dan status LARTAS di modul Cek Lartas sebelum proses kepabeanan.",
  "Ekspor atau catat hasil untuk keperluan dokumentasi dan pelaporan bea cukai.",
];

export default function Home() {
  return (
    <div className="space-y-12 pb-8 sm:space-y-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-sky-100/90 bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6 py-10 shadow-sm sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -top-16 right-8 h-44 w-44 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-6 h-52 w-52 rounded-full bg-cyan-300/35 blur-3xl" />

        <div className="relative max-w-4xl">
          <p className="inline-flex rounded-full border border-cyan-200/80 bg-white/75 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
            Pesisir
          </p>
          <h1 className="mt-6 bg-gradient-to-r from-sky-900 to-cyan-700 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            Platform operasional untuk tim ekspor impor.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-700">
            Hemat waktumu dari input satu persatu HS code untuk mencari informasi LARTAS dan pantau status shipment melalui dashboard bukan tabel.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/cek-lartas"
              className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800"
            >
              Buka Cek Lartas
            </Link>
            <Link
              href="/shipments"
              className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Lihat Shipments
            </Link>
          </div>
        </div>
      </section>

      <section id="fitur" className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {productCards.map((card) => (
          <article
            key={card.title}
            className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-cyan-300"
          >
            <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${card.accent} blur-2xl`} />
            <h2 className="text-lg font-semibold text-zinc-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{card.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              {card.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full ${card.dot}`} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Link
              href={card.href}
              className="mt-6 inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              {card.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-9">
        <h3 className="text-lg font-semibold text-zinc-900">Alur Cepat</h3>
        <ol className="mt-5 space-y-4 text-sm text-zinc-600 sm:text-base">
          {quickFlow.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs font-medium text-zinc-700">
                {index + 1}
              </span>
              <span className="leading-7">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
