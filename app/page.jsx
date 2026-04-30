"use client";

import Link from "next/link";

const productCards = [
  {
    title: "B/L Scanner",
    description:
      "Upload Bill of Lading PDF, lalu klik teks untuk copy cepat. Tahan Ctrl sambil klik untuk chain value menjadi satu hasil copy.",
    points: [
      "Copy tunggal dengan satu klik.",
      "Chain multi klik selama Ctrl ditekan.",
      "Lepas Ctrl untuk mengakhiri chain otomatis.",
    ],
    href: "/blscann",
    cta: "Buka BL Scanner",
    accent: "from-sky-500/20 to-cyan-500/20",
    dot: "bg-sky-500",
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
    accent: "from-cyan-500/20 to-sky-500/20",
    dot: "bg-cyan-500",
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
      <section className="relative overflow-hidden rounded-[2rem] border border-sky-100/90 bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6 py-10 shadow-sm sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -top-16 right-8 h-44 w-44 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-6 h-52 w-52 rounded-full bg-cyan-300/35 blur-3xl" />

        <div className="relative max-w-4xl">
          <p className="inline-flex rounded-full border border-cyan-200/80 bg-white/75 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
            Pesisir Platform
          </p>
          <h1 className="mt-6 bg-gradient-to-r from-sky-900 to-cyan-700 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            Workspace operasional untuk BL copy-chain dan validasi HS code.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-700">
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
