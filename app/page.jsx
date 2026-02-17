"use client";

import Link from "next/link";

const productCards = [
  {
    title: "BL Scanner",
    description:
      "Upload Bill of Lading PDF, lalu klik teks untuk copy cepat. Tahan Ctrl sambil klik untuk chain value menjadi satu hasil copy.",
    points: [
      "Copy tunggal dengan satu klik.",
      "Chain multi klik selama Ctrl ditekan.",
      "Lepas Ctrl untuk mengakhiri chain otomatis.",
    ],
    href: "/blscann",
    cta: "Buka BL Scanner",
  },
  {
    title: "INScann",
    description:
      "Cek HS code secara batch dari file Excel untuk melihat tarif, pajak, dan detail LARTAS dalam alur yang rapi.",
    points: [
      "Upload file Excel berisi HS code 8 digit.",
      "Tarik data BM, PPN, PPH, dan PPH Non-API.",
      "Lihat detail LARTAS dari sumber INSW.",
    ],
    href: "/inscann",
    cta: "Buka INScann",
  },
];

const quickFlow = [
  "Pilih modul sesuai kebutuhan: BL Scanner atau INScann.",
  "Proses data langsung di halaman modul terkait.",
  "Copy hasil dengan cepat untuk mengurangi salah input manual.",
];

export default function Home() {
  return (
    <div className="space-y-12 pb-8 sm:space-y-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-14">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-zinc-100" />
        <div className="absolute -bottom-24 left-16 h-56 w-56 rounded-full border border-zinc-100" />

        <div className="relative max-w-4xl">
          <p className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
            Pesisir Platform
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
            Workspace operasional untuk BL copy-chain dan validasi HS code.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-600">
            Gunakan BL Scanner untuk copy data Bill of Lading lebih cepat, lalu lanjutkan ke INScann untuk verifikasi tarif, pajak, dan LARTAS.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/blscann"
              className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800"
            >
              Buka BL Scanner
            </Link>
            <Link
              href="/inscann"
              className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Buka INScann
            </Link>
          </div>
        </div>
      </section>

      <section id="fitur" className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {productCards.map((card) => (
          <article
            key={card.title}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300"
          >
            <h2 className="text-lg font-semibold text-zinc-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{card.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              {card.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-400" />
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
