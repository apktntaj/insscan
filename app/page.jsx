"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CekLartasMockup } from "./presentation/components/common/ProductMockup";

const whyReasons = [
  {
    pain: "Cek LARTAS satu per satu di INSW itu lambat — apalagi kalau invoice-nya punya 30+ item.",
    solve:
      "Upload file Excel berisi HS code, semua data tarif dan status LARTAS langsung ditarik sekaligus. Tidak perlu buka INSW manual.",
  },
  {
    pain: "Salah baca status LARTAS bisa berujung denda atau barang tertahan di pelabuhan.",
    solve:
      "Data langsung dari INSW — BM MFN, PPN, PPh, dan detail regulasi impor/ekspor ditampilkan per HS code dengan jelas.",
  },
  {
    pain: "Hasil cek LARTAS tersebar di tab browser, susah didokumentasikan.",
    solve:
      "Export hasil ke Excel dalam satu klik. Siap dilampirkan ke laporan atau dikirim ke tim.",
  },
];

const faqs = [
  {
    q: "Data LARTAS dari mana?",
    a: "Langsung dari API INSW (Indonesia National Single Window) — sumber resmi yang sama yang dipakai portal insw.go.id.",
  },
  {
    q: "Format file Excel-nya seperti apa?",
    a: "Cukup satu kolom berisi HS code 8 digit. Tidak perlu header khusus — Pesisir akan membaca semua angka 8 digit yang ditemukan di file.",
  },
  {
    q: "Berapa banyak HS code yang bisa dicek sekaligus?",
    a: "Paket gratis dibatasi 10 HS code per hari. Upgrade ke Pro (Rp26.000/bulan) untuk query unlimited tanpa batas harian.",
  },
  {
    q: "Apakah data saya dikirim ke server?",
    a: "File Excel yang kamu upload diproses di browser — tidak disimpan di server manapun. Hanya HS code yang dikirim ke INSW untuk dicek.",
  },
  {
    q: "Apakah Pesisir terafiliasi dengan INSW atau instansi pemerintah?",
    a: "Tidak. Pesisir adalah tool independen yang dibuat untuk membantu staf operasional PPJK dan freight forwarder.",
  },
  {
    q: "Bagaimana kalau hasil LARTAS tidak muncul untuk HS code tertentu?",
    a: "Beberapa HS code memang tidak memiliki regulasi LARTAS aktif — artinya barang tersebut bebas tanpa persyaratan izin. Data tetap menampilkan tarif BM, PPN, dan PPh jika tersedia.",
  },
];

/**
 * FAQ item with expand/collapse toggle.
 * @param {{ q: string, a: string, open: boolean, onToggle: () => void }} props
 */
function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-zinc-100 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-zinc-800 sm:text-base">{q}</span>
        <span
          className={`mt-0.5 shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          aria-hidden="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm leading-7 text-zinc-500">{a}</p>
      )}
    </div>
  );
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(null);

  function handleToggle(index) {
    setActiveIndex(activeIndex === index ? null : index);
  }

  return (
    <div className="space-y-12 pb-8 sm:space-y-16">

      {/* Hero */}
      <section className="relative -mx-5 -mt-8 flex min-h-screen items-start justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6 pt-[22vh] sm:-mx-8 sm:px-10 lg:-mx-12">
        <div className="pointer-events-none absolute -top-16 right-8 h-72 w-72 rounded-full bg-sky-300/35" />
        <div className="pointer-events-none absolute -bottom-20 left-6 h-80 w-80 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full border border-cyan-200/80 bg-white/75 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
            Pesisir
          </p>
          <h1 className="mt-6 bg-gradient-to-r from-sky-900 to-cyan-700 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            Cek LARTAS puluhan HS code dalam sekali klik.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-600">
            Upload Excel berisi HS code dari invoice — Pesisir langsung tarik data tarif bea masuk, PPN, PPh, dan status LARTAS dari INSW. Tidak perlu buka portal satu per satu.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/cek-lartas"
              className="rounded-xl bg-gradient-to-r from-sky-900 to-cyan-700 px-6 py-3 text-sm font-medium text-white transition hover:from-sky-800 hover:to-cyan-600"
            >
              Coba Sekarang — Gratis
            </Link>
            <a
              href="#cara-kerja"
              className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Cara Kerja
            </a>
          </div>
          <p className="mt-4 text-xs text-zinc-400">Gratis 10 query/hari · Tidak perlu daftar akun</p>
        </div>
      </section>

      {/* Product Mockup */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-cyan-600">Tampilan</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 sm:text-xl">
            Hasil cek LARTAS langsung di browser
          </h3>
        </div>
        <div className="mx-auto max-w-2xl">
          <CekLartasMockup />
        </div>
      </section>

      {/* Why */}
      <section id="cara-kerja" className="rounded-3xl border border-zinc-200 bg-white px-7 py-8 shadow-sm sm:px-9">
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-600">Kenapa Pesisir?</p>
        <h3 className="mt-2 text-lg font-semibold text-zinc-900 sm:text-xl">
          Dari invoice ke data LARTAS — tanpa buka INSW manual.
        </h3>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {whyReasons.map((item) => (
            <div key={item.pain} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
              <p className="text-sm font-semibold text-zinc-800">{item.pain}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">{item.solve}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-cyan-600">Cara Pakai</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 sm:text-xl">Tiga langkah, selesai.</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { step: "1", title: "Upload Excel", desc: "Siapkan file .xls atau .xlsx berisi HS code 8 digit dari invoice kamu." },
            { step: "2", title: "Tarik Data", desc: "Pesisir query ke INSW untuk setiap HS code — tarif dan status LARTAS langsung muncul." },
            { step: "3", title: "Export Hasil", desc: "Download hasil sebagai Excel. Siap dilampirkan ke laporan atau dikirim ke tim." },
          ].map((item) => (
            <div key={item.step} className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="pointer-events-none absolute -right-4 -top-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-2xl font-bold text-cyan-200">
                {item.step}
              </div>
              <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/cek-lartas"
            className="inline-flex rounded-xl bg-gradient-to-r from-sky-900 to-cyan-700 px-6 py-3 text-sm font-medium text-white transition hover:from-sky-800 hover:to-cyan-600"
          >
            Mulai Cek Sekarang
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="rounded-3xl border border-zinc-200 bg-white px-7 py-8 shadow-sm sm:px-9">
        <h3 className="text-3xl text-center font-bold text-zinc-900">FAQ</h3>
        <div className="mt-4">
          {faqs.map((faq, index) => (
            <FaqItem
              key={faq.q}
              q={faq.q}
              a={faq.a}
              open={activeIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
