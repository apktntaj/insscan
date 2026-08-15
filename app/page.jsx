"use client";

import React, { useState } from "react";
import Link from "next/link";
import AnimatedCekLartasDemo from "./presentation/components/features/AnimatedCekLartasDemo";
import { WHATSAPP_NUMBER } from "./presentation/config/feedback-config";

const EARLY_ACCESS_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Halo, saya ingin bertanya tentang Pesisir Pro Early Access."
)}`;

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
    a: "Pesisir mengambil informasi tarif dan LARTAS dari layanan INSW saat pemeriksaan dilakukan. Hasil bergantung pada ketersediaan dan respons sumber tersebut.",
  },
  {
    q: "Seberapa mutakhir hasil pemeriksaan?",
    a: "Data diambil saat pemeriksaan dilakukan. Karena regulasi dan layanan sumber dapat berubah, verifikasi kembali keputusan penting melalui portal dan regulasi resmi.",
  },
  {
    q: "Format file Excel-nya seperti apa?",
    a: "Cukup satu kolom berisi HS code 8 digit. Tidak perlu header khusus — Pesisir akan membaca semua angka 8 digit yang ditemukan di file.",
  },
  {
    q: "Apa yang dihitung sebagai satu pemeriksaan?",
    a: "Satu HS code unik dihitung sebagai satu pemeriksaan. Jika HS code yang sama muncul beberapa kali dalam satu file, kode tersebut diproses satu kali. Paket Gratis mencakup 10 pemeriksaan per hari.",
  },
  {
    q: "Apakah data saya dikirim ke server?",
    a: "File Excel yang kamu upload diproses di browser — tidak disimpan di server manapun. Hanya HS code yang dikirim ke INSW untuk dicek.",
  },
  {
    q: "Bagaimana kalau hasil LARTAS tidak muncul untuk HS code tertentu?",
    a: "Artinya Pesisir tidak menemukan detail LARTAS pada respons saat pengecekan. Periksa kembali klasifikasi HS dan verifikasi keputusan penting pada portal atau regulasi resmi.",
  },
  {
    q: "Apa perbedaan paket Gratis dan Pro?",
    a: "Paket Gratis mencakup 10 pemeriksaan HS code per hari. Paket Pro Rp26.000 per bulan menyediakan pemeriksaan tanpa batas harian selama masa aktif.",
  },
  {
    q: "Bagaimana aktivasi Pesisir Pro dilakukan?",
    a: "Selama Early Access, pembayaran dan aktivasi dikonfirmasi secara manual melalui WhatsApp. Paket tidak diperpanjang otomatis.",
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
          <p className="mt-4 text-xs text-zinc-500">10 pemeriksaan HS code gratis per hari · File diproses di browser</p>
        </div>
      </section>

      {/* Trust */}
      <section aria-labelledby="trust-title" className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">Sumber data</p>
          <h2 id="trust-title" className="mt-2 font-semibold text-zinc-900">Respons data dari INSW</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">Pesisir mengambil tarif dan informasi LARTAS dari layanan INSW saat pemeriksaan dilakukan.</p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">Privasi file</p>
          <h2 className="mt-2 font-semibold text-zinc-900">Excel dibaca di perangkatmu</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">Isi file tidak diunggah. Hanya HS code yang terdeteksi dikirim untuk mengambil hasil pemeriksaan.</p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">Transparansi</p>
          <h2 className="mt-2 font-semibold text-zinc-900">Alat bantu independen</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">Pesisir tidak berafiliasi dengan INSW atau instansi pemerintah dan bukan pengganti keputusan kepabeanan profesional.</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="rounded-3xl border border-zinc-200 bg-white px-7 py-9 shadow-sm sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">Harga transparan</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Mulai gratis, naikkan saat pekerjaan bertambah.</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600">Satu HS code unik dihitung sebagai satu pemeriksaan. Kode duplikat dalam satu file diproses satu kali.</p>
        </div>
        <div className="mx-auto mt-7 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 p-6">
            <p className="font-semibold text-zinc-900">Gratis</p><p className="mt-2 text-3xl font-semibold text-zinc-900">Rp0</p>
            <p className="mt-4 text-sm leading-7 text-zinc-600">10 pemeriksaan HS code per hari, input tunggal atau Excel, dan ekspor hasil.</p>
          </div>
          <div className="rounded-2xl border border-cyan-300 bg-cyan-50/60 p-6">
            <p className="font-semibold text-cyan-900">Pro</p><p className="mt-2 text-3xl font-semibold text-cyan-950">Rp26.000<span className="text-sm font-normal">/bulan</span></p>
            <p className="mt-4 text-sm leading-7 text-cyan-900">Pemeriksaan tanpa batas harian. Aktivasi awal dilayani melalui WhatsApp.</p>
            <p className="mt-3 rounded-xl border border-cyan-200 bg-white/70 px-3 py-2 text-xs leading-5 text-cyan-900">Early Access: pembayaran dan aktivasi masih dikonfirmasi manual. Tidak ada perpanjangan otomatis.</p>
            <a href={EARLY_ACCESS_LINK} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-xl bg-cyan-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-800">Tanya Pro via WhatsApp</a>
          </div>
        </div>
      </section>

      {/* Product Mockup */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-cyan-600">Contoh hasil demonstrasi</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 sm:text-xl">
            Hasil cek LARTAS langsung di browser
          </h3>
        </div>
        <div className="mx-auto max-w-5xl">
          <AnimatedCekLartasDemo />
        </div>
        <p className="mx-auto max-w-2xl text-center text-xs leading-6 text-zinc-500">Data pada contoh disederhanakan untuk demonstrasi dan bukan data pelanggan. Tampilan aktual mengikuti respons yang tersedia saat pemeriksaan.</p>
        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2" aria-label="Data yang tersedia pada hasil">
          {["BM MFN", "PPN", "PPh", "Status LARTAS", "Dokumen pabean", "Detail regulasi", "Ekspor Excel"].map((item) => (
            <span key={item} className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600">{item}</span>
          ))}
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

      <p className="mx-auto max-w-4xl text-center text-xs leading-6 text-zinc-500">
        Hasil Pesisir bersifat informatif berdasarkan respons yang tersedia saat pemeriksaan. Selalu verifikasi klasifikasi HS dan persyaratan regulasi untuk keputusan yang berdampak pada proses kepabeanan.
      </p>

    </div>
  );
}
