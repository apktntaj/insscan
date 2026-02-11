"use client";

import Link from "next/link";

const features = [
  {
    title: "Tarif & Pajak",
    description: "Lihat BM, PPN, PPH, dan PPH Non-API per HS code dalam satu alur yang bersih.",
  },
  {
    title: "Detail LARTAS",
    description: "Dapatkan status LARTAS dan redaksi izin lengkap jika data tersedia dari INSW.",
  },
  {
    title: "Batch Lookup",
    description: "Upload file Excel untuk memproses banyak HS code sekaligus tanpa tampilan yang padat.",
  },
];

const steps = [
  "Upload file Excel berisi HS code 8 digit.",
  "Klik Tarik Data untuk memulai pengecekan.",
  "Baca hasil per kode dalam card dan buka detail LARTAS di modal.",
];

export default function Home() {
  return (
    <div className="space-y-12 pb-8 sm:space-y-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-14">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-zinc-100" />
        <div className="absolute -bottom-24 left-16 h-56 w-56 rounded-full border border-zinc-100" />

        <div className="relative max-w-3xl">
          <p className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
            Pesisir Platform
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
            Minimal workspace for HS code, tax, and LARTAS validation.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600">
            Pesisir membantu tim operasional mengecek data regulasi lebih cepat dengan tampilan monokrom,
            modern, dan fokus pada informasi inti.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/inscann"
              className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800"
            >
              Buka Scanner
            </Link>
            <a
              href="#fitur"
              className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Lihat Fitur
            </a>
          </div>
        </div>
      </section>

      <section id="fitur" className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300"
          >
            <h2 className="text-lg font-semibold text-zinc-900">{feature.title}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-9">
        <h3 className="text-lg font-semibold text-zinc-900">Alur Penggunaan</h3>
        <ol className="mt-5 space-y-4 text-sm text-zinc-600 sm:text-base">
          {steps.map((step, index) => (
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
