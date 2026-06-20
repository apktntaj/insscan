"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CekLartasMockup, ShipmentMockup, BlScannerMockup } from "./presentation/components/common/ProductMockup";

const productCards = [
  {
    title: "Shipments",
    description:
      "Tidak perlu ketik ulang data dari BL. Upload dokumen, data langsung terisi — tinggal periksa dan simpan.",
    points: [
      "Scan BL PDF, nomor BL dan shipper terisi otomatis tanpa copy-paste.",
      "Dashboard status membantu kamu prioritas shipment yang perlu ditangani duluan.",
      "Data tersimpan di browser kamu sendiri, tidak melewati server manapun.",
    ],
    href: "/shipments",
    cta: "Lihat Shipments",
    accent: "from-sky-500/20 to-cyan-500/20",
    dot: "bg-sky-500",
    badge: null,
  },
  {
    title: "Materi Kepabeanan",
    description:
      "Pelajari materi kepabeanan Indonesia langsung di Pesisir — dari terminologi, tata laksana ekspor impor, hingga ketentuan pidana.",
    points: [
      "Ringkasan materi diklat kepabeanan dalam format yang mudah dibaca.",
      "Navigasi per topik — cari materi yang kamu butuhkan tanpa scroll panjang.",
      "Terus diperbarui seiring pengembangan konten.",
    ],
    href: "/learn",
    cta: "Buka Materi",
    accent: "from-violet-500/20 to-purple-500/20",
    dot: "bg-violet-500",
    badge: "Baru",
  },
  {
    title: "Latihan Soal",
    description:
      "Uji pemahaman materi kepabeanan dengan soal pilihan ganda yang diambil secara acak dari bank soal diklat.",
    points: [
      "10 soal acak per sesi — urutan pilihan jawaban juga diacak.",
      "Feedback langsung setiap soal: tahu mana yang benar dan penjelasannya.",
      "Skor akhir dengan grade untuk ukur tingkat pemahaman.",
    ],
    href: "/exercise",
    cta: "Mulai Latihan",
    accent: "from-emerald-500/20 to-teal-500/20",
    dot: "bg-emerald-500",
    badge: "Baru",
  },
  {
    title: "Cek Lartas",
    description:
      "Fitur ini sedang kami pindahkan ke ekstensi Chrome agar bisa terintegrasi langsung dengan portal INSW. Untuk sementara, hubungi developer untuk mendapatkan akses.",
    points: [
      "Akan hadir sebagai ekstensi Chrome — langsung terintegrasi dengan INSW.",
      "Butuh akses sekarang? Hubungi developer via WhatsApp.",
      "Proses puluhan HS code dari invoice dalam sekali klik.",
    ],
    href: "/cek-lartas",
    cta: "Lihat Info",
    accent: "from-amber-500/20 to-orange-500/20",
    dot: "bg-amber-500",
    badge: "Transisi",
  },
];

const whyReasons = [
  {
    pain: "Ketik ulang data BL itu buang waktu — dan satu angka salah bisa berujung masalah.",
    solve:
      "Upload BL PDF, data langsung terbaca dan terisi otomatis. Tidak ada lagi copy-paste nomor kontainer satu per satu.",
  },
  {
    pain: "Materi kepabeanan tersebar di banyak dokumen dan sulit dicari saat dibutuhkan.",
    solve:
      "Semua ringkasan materi diklat kepabeanan tersedia di satu tempat, ternavigasi per topik — buka kapan pun kamu butuh referensi cepat.",
  },
  {
    pain: "Susah tahu sejauh mana pemahaman materi kalau tidak ada cara mengukurnya.",
    solve:
      "Latihan soal dari bank soal diklat dengan soal acak setiap sesi. Jawab, lihat feedback langsung, dan ukur skor kamu.",
  },
  {
    pain: "Data shipper itu sensitif — tidak semua orang boleh tahu.",
    solve: "Semua data shipment disimpan di browser kamu sendiri, tidak melewati server manapun. Kamu yang pegang kendali penuh.",
  },
];

const faqs = [
  {
    q: "Kenapa data shipment disimpan di browser, bukan di server?",
    a: "Privasi. Data shipment (terutama shipper) bersifat sensitif secara bisnis. Dengan menyimpannya di browser, kamu punya kendali penuh. Tidak ada yang bisa mengakses data kamu selain kamu sendiri.",
  },
  {
    q: "Apakah data saya aman kalau browser-nya ditutup atau komputer di-restart?",
    a: "Ya, aman. Data shipment persisten selama tidak berpindah perangkat atau berganti browser.",
  },
  {
    q: "Kenapa fitur Cek Lartas sedang tidak aktif?",
    a: "Cek Lartas sedang kami pindahkan ke ekstensi Google Chrome agar bisa terintegrasi langsung dengan portal INSW tanpa perlu berpindah tab. Kalau kamu butuh akses sekarang, hubungi developer via WhatsApp — kami bisa membukakan aksesnya.",
  },
  {
    q: "Materi kepabeanan yang tersedia di Pesisir dari mana sumbernya?",
    a: "Konten materi disusun berdasarkan materi diklat kepabeanan. Ini bukan pengganti sumber resmi — selalu verifikasi ke regulasi terbaru dari DJBC untuk keperluan profesional.",
  },
  {
    q: "Soal latihan di Pesisir dari mana?",
    a: "Soal-soal diambil dari bank soal diklat kepabeanan. Setiap sesi menampilkan 10 soal yang dipilih secara acak, dengan urutan pilihan jawaban yang juga diacak agar kamu tidak menghafal posisi jawaban.",
  },
  {
    q: "Apakah Pesisir gratis?",
    a: "Ya, saat ini semua fitur Pesisir gratis digunakan tanpa perlu membuat akun.",
  },
  {
    q: "Apakah Pesisir terafiliasi dengan INSW atau instansi pemerintah?",
    a: "Tidak. Pesisir adalah tool independen yang dibuat untuk membantu staf operasional PPJK dan freight forwarder.",
  },
  {
    q: "Bagaimana kalau saya menemukan bug atau ingin mengusulkan fitur?",
    a: "Kamu bisa menyampaikannya langsung di halaman Feedback. Ada form saran dan kontak WhatsApp yang bisa kamu gunakan.",
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

/**
 * Carousel pagination untuk why section di mobile.
 * @param {{ items: typeof whyReasons }} props
 */
function WhyCarousel({ items }) {
  const [current, setCurrent] = useState(0);
  const startX = React.useRef(null);

  function handleTouchStart(e) {
    startX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 40 && current < items.length - 1) setCurrent((c) => c + 1);
    if (diff < -40 && current > 0) setCurrent((c) => c - 1);
    startX.current = null;
  }

  return (
    <div className="mt-7 sm:hidden">
      {/* Card */}
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {items.map((item) => (
            <div
              key={item.pain}
              className="w-full shrink-0 rounded-2xl border border-zinc-100 bg-zinc-50 p-5"
            >
              <p className="text-sm font-semibold text-zinc-800">{item.pain}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">{item.solve}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="mt-4 flex justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-200 ${
              i === current ? "w-5 bg-cyan-500" : "w-2 bg-zinc-300"
            }`}
          />
        ))}
      </div>
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
            Kerja lebih cepat dan tepat.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-600">
            Pesisir adalah platform untuk staf PPJK dan freight forwarder — kelola shipment, pelajari materi kepabeanan, dan uji pemahaman, semua dalam satu tempat.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              href="#why"
              className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800"
            >
              Kenapa Pesisir?
            </a>
            <a
              href="#fitur"
              className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Lihat Menu
            </a>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="space-y-8">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-cyan-600">Lihat Langsung</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 sm:text-xl">
            Begini tampilan Pesisir saat dipakai
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Geser untuk lihat semua fitur
          </p>
        </div>

        {/* Desktop: grid */}
        <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Cek Lartas</p>
            <CekLartasMockup />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Shipments Dashboard</p>
            <ShipmentMockup />
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">BL Scanner</p>
            <BlScannerMockup />
          </div>
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 md:hidden snap-x snap-mandatory scrollbar-none">
          <div className="min-w-[85vw] snap-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Cek Lartas</p>
            <CekLartasMockup />
          </div>
          <div className="min-w-[85vw] snap-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Shipments Dashboard</p>
            <ShipmentMockup />
          </div>
          <div className="min-w-[85vw] snap-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">BL Scanner</p>
            <BlScannerMockup />
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="rounded-3xl border border-zinc-200 bg-white px-7 py-8 shadow-sm sm:px-9">
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-600">Kenapa Pesisir?</p>
        <h3 className="mt-2 text-lg font-semibold text-zinc-900 sm:text-xl">
          Dari dokumen ke keputusan — tanpa input manual.
        </h3>

        {/* Mobile: carousel */}
        <WhyCarousel items={whyReasons} />

        {/* Desktop: grid */}
        <div className="mt-7 hidden grid-cols-2 gap-4 sm:grid lg:grid-cols-4">
          {whyReasons.map((item) => (
            <div key={item.pain} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
              <p className="text-sm font-semibold text-zinc-800">{item.pain}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">{item.solve}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fitur */}
      <section id="fitur" className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {productCards.map((card) => (
          <article
            key={card.title}
            className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-cyan-300"
          >
            <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${card.accent} blur-2xl`} />
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">{card.title}</h2>
              {card.badge && (
                <span className="shrink-0 rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-700">
                  {card.badge}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{card.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              {card.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${card.dot}`} />
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
