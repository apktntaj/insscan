"use client";

import Link from "next/link";
import { useState } from "react";

const productCards = [
  {
    title: "Cek Lartas",
    description:
      "Tidak perlu buka INSW satu per satu. Upload Excel, semua HS code langsung dicek sekaligus.",
    points: [
      "Proses puluhan HS code dari invoice dalam sekali klik.",
      "Lihat status LARTAS, tarif BM, PPN, dan PPh impor sekaligus.",
      "Hasil bisa diekspor kembali ke Excel untuk dokumentasi.",
    ],
    href: "/cek-lartas",
    cta: "Buka Cek Lartas",
    accent: "from-cyan-500/20 to-sky-500/20",
    dot: "bg-cyan-500",
  },
  {
    title: "Shipments",
    description:
      "Semua data pengiriman dalam satu dashboard — tidak ada lagi BL yang tercecer di email atau WhatsApp.",
    points: [
      "Catat nomor BL, shipper, dan ETA dalam satu tempat.",
      "Dashboard status membantu kamu prioritas shipment yang perlu ditangani duluan.",
      "Data tersimpan di browser kamu sendiri, tidak melewati server manapun.",
    ],
    href: "/shipments",
    cta: "Lihat Shipments",
    accent: "from-sky-500/20 to-cyan-500/20",
    dot: "bg-sky-500",
  },
];

const whyReasons = [
  {
    pain: "Ambil data dari dokumen secara manual itu melelahkan dan rawan salah.",
    solve:
      "Invoive, B/L dan dokumen lain langsung diproses. Tidak perlu copy-paste manual yang rawan salah dan memakan waktu.",
  },
  {
    pain: "Workflow jelas dan UI yang mendukung.",
    solve:
      "Tidak perlu input satu-persatu untuk mendapat informasi LARTAS. Cukup upload file Excel, semua HS code langsung dicek sekaligus. Hasilnya bisa diekspor kembali ke Excel untuk dokumentasi.",
  },
  {
    pain: "Data shipment bersifat sensitif dari sisi bisnis.",
    solve: "Pesisir dirancang untuk workflow yang membutuhkan kontrol penuh atas data tanpa sistem eksternal. Semua data shipment disimpan secara lokal di browser, export kapan saja untuk backup.",
  },
  {
    pain: "Salah ketik data shipment bisa berujung denda dan keterlambatan proses",
    solve: "Pesisir mengekstrak data langsung dari dokumen dan mengisi form secara otomatis, mengurangi ketergantungan pada input manual yang rawan error."
  },
];

const faqs = [
  {
    q: "Kenapa data shipment disimpan di browser, bukan di server?",
    a: "Privasi. Supaya data operasional kamu tidak melewati server pihak ketiga. Data shipment (terutama shipper) bersifat sensitif secara bisnis. Dengan menyimpannya di browser, kamu punya kendali penuh. Tidak ada yang bisa mengakses data kamu selain kamu sendiri.",
  },
  {
    q: "Apakah data saya aman kalau browser-nya ditutup atau komputer di-restart?",
    a: "Ya, aman. IndexedDB bersifat persisten — data tetap ada selama kamu tidak menghapus data browser secara manual atau berpindah perangkat atau berganti browser.",
  },
  {
    q: "Kenapa fitur Cek Lartas hanya bisa digunakan dari jam 06.00 sampai 22.00?",
    a: "Pesisir mengambil data langsung dari situs INSW (Indonesia National Single Window). Di luar jam tersebut, INSW cenderung tidak responsif. Daripada kamu menunggu tanpa kepastian, kami batasi jam operasional agar pengalaman penggunaannya tetap konsisten.",
  },
  {
    q: "Apakah hasil Cek Lartas selalu akurat dan up-to-date?",
    a: "Data yang ditampilkan berasal langsung dari INSW saat kamu melakukan pencarian — bukan dari cache atau database kami. Pesisir adalah platform yang berfokus pada efisiensi alur kerja. Bukan penyedia data. Akurasi bergantung pada data yang tersedia di INSW pada saat itu. Untuk keputusan kepabeanan penting, selalu verifikasi ulang ke sumber resmi.",
  },
  {
    q: "Berapa banyak HS code yang bisa dicek sekaligus?",
    a: "Tidak ada batas jumlah baris di file Excel yang kamu unggah. Namun proses berjalan secara berurutan dengan jeda antar request untuk menghindari pemblokiran dari server INSW. Semakin banyak HS code, semakin lama prosesnya.",
  },
  {
    q: "Format file apa yang didukung untuk Cek Lartas?",
    a: "Saat ini hanya mendukung file Excel (.xlsx dan .xls). Kolom HS code harus ada di file tersebut — kamu bisa lihat contoh format yang diterima di halaman Cek Lartas.",
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

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(null);

  function handleToggle(index) {
    setActiveIndex(activeIndex === index ? null : index);
  }

  return (
    <div className="space-y-12 pb-8 sm:space-y-16">

      {/* Hero */}
      <section className="relative -mx-5 -mt-8 flex min-h-screen items-start justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6 pt-[22vh] sm:-mx-8 sm:px-10 lg:-mx-12">
        <div className="pointer-events-none absolute -top-16 right-8 h-72 w-72 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-6 h-80 w-80 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full border border-cyan-200/80 bg-white/75 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
            Pesisir
          </p>
          <h1 className="mt-6 bg-gradient-to-r from-sky-900 to-cyan-700 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            Kerja lebih cepat dan tepat.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-600">
            Pesisir adalah platform operasional untuk staf PPJK dan freight forwarder.
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
              Lihat Fitur
            </a>
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="rounded-3xl border border-zinc-200 bg-white px-7 py-8 shadow-sm sm:px-9">
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-600">Kenapa Pesisir?</p>
        <h3 className="mt-2 text-lg font-semibold text-zinc-900 sm:text-xl">
          Dari dokumen ke keputusan — tanpa input manual.
        </h3>
        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      {/* FAQ */}
      <section className="rounded-3xl border border-zinc-200 bg-white px-7 py-8 shadow-sm sm:px-9">
        <h3 className="text-lg font-semibold text-zinc-900">Pertanyaan Umum</h3>
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
