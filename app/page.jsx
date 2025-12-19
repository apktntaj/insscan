"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import React from "react";

const features = [
  {
    icon: "📊",
    title: "Periksa LARTAS",
    desc: "Cek secara otomatis persyaratan LARTAS impor dan ekspor berdasarkan kode HS yang diunggah.",
    benefits: ["Verifikasi instan", "Update real-time", "Akurat & resmi"]
  },
  {
    icon: "⚡",
    title: "Data Real-Time",
    desc: "Tarik data tarif langsung dari API resmi SISP dengan informasi BM, PPN, dan PPH yang selalu terbaru.",
    benefits: ["Data dari SISP", "Tarif terkini", "Reliable source"]
  },
  {
    icon: "📥",
    title: "Ekspor Instan",
    desc: "Hasil lengkap terformat rapi dalam file Excel yang siap pakai untuk laporan atau analisis lanjutan.",
    benefits: ["Format siap pakai", "Download cepat", "Professional report"]
  },
];

const stats = [
  { number: "500+", label: "User Aktif" },
  { number: "50,000+", label: "Cek HS Code" },
  { number: "99.8%", label: "Uptime" },
];

const faqItems = [
  {
    question: "Apa itu kode HS dan mengapa penting?",
    answer: "Kode HS (Harmonized System) adalah sistem klasifikasi barang internasional yang digunakan untuk menentukan tarif kepabeanan. Kode ini penting untuk menghitung bea masuk, pajak, dan persyaratan impor/ekspor barang."
  },
  {
    question: "Berapa lama proses pengecekan LARTAS?",
    answer: "Dengan INSScan, proses yang biasanya butuh berjam-jam bisa selesai dalam hitungan menit. Sistem kami memproses ribuan kode HS secara paralel untuk efisiensi maksimal."
  },
  {
    question: "Apakah data tarif selalu terbaru?",
    answer: "Ya, data kami diambil langsung dari API SISP (Sistem Informasi Simpul Perbatasan) milik Bea dan Cukai, sehingga selalu mencerminkan tarif terkini dan resmi."
  },
  {
    question: "Bagaimana cara menggunakan INSScan?",
    answer: "Siapkan file Excel dengan daftar kode HS, upload melalui aplikasi, tunggu sistem memproses otomatis, dan download hasilnya. Tidak perlu langkah kompleks."
  },
  {
    question: "File apa saja yang bisa di-upload?",
    answer: "Kami mendukung file Excel (.xlsx, .xls) dengan format kolom yang jelas. Download template dari aplikasi untuk memastikan format yang tepat."
  },
];

const Home = () => {
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const [showContent, setShowContent] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const scrollToSection = (ref) => {
    setTimeout(() => {
      ref?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div data-theme="light" className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'>
      {/* Hero Section */}
      <Hero
        onCtaClick={() => scrollToSection(featuresRef)}
        onStatsClick={() => scrollToSection(statsRef)}
      />

      <div className='max-w-7xl mx-auto px-4 lg:px-8 py-16'>

        {/* Stats Section - Social Proof */}
        <div
          ref={statsRef}
          className={`mb-32 transition-all duration-700 ${showContent ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {stats.map((stat, i) => (
              <div key={i} className='card bg-white shadow-md hover:shadow-lg transition-shadow'>
                <div className='card-body text-center'>
                  <p className='text-5xl font-bold text-blue-600'>{stat.number}</p>
                  <p className='text-gray-600 font-medium mt-2'>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div
          ref={featuresRef}
          className={`mb-32 transition-all duration-700 ${showContent ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <div className='mb-16'>
            <h2 className='text-4xl lg:text-5xl font-bold text-gray-950 mb-4'>Fitur Utama</h2>
            <p className='text-xl text-gray-600'>Solusi lengkap untuk kebutuhan pengelolaan kode HS dan tarif kepabeanan</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {features.map((feature, i) => (
              <div key={i} className='card bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2'>
                <div className='card-body'>
                  <div className='text-5xl mb-4'>{feature.icon}</div>
                  <h3 className='card-title text-2xl text-gray-950'>{feature.title}</h3>
                  <p className='text-gray-600 mb-4'>{feature.desc}</p>
                  <div className='flex flex-wrap gap-2'>
                    {feature.benefits.map((benefit, j) => (
                      <span key={j} className='badge badge-primary badge-outline'>
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data & Regulations Section */}
        <div
          className={`mb-32 transition-all duration-700 ${showContent ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <h2 className='text-4xl font-bold text-gray-950 mb-12'>Data yang Kamu Dapatkan</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Tariff Information */}
            <div className='card bg-white shadow-md'>
              <div className='card-body'>
                <h3 className='card-title text-2xl mb-6 flex items-center gap-2'>
                  <span className='text-2xl'>💰</span>
                  Informasi Tarif
                </h3>
                <ul className='space-y-3'>
                  {[
                    { name: "BM (Bea Masuk)", desc: "Bea masuk untuk barang impor" },
                    { name: "PPN (Pajak Pertambahan Nilai)", desc: "Pajak produksi barang" },
                    { name: "PPH (Pajak Penghasilan)", desc: "Pajak atas komisi perantara" },
                    { name: "PPH Non-API", desc: "Pajak untuk sumber lain" },
                  ].map((item, i) => (
                    <li key={i} className='flex items-start gap-3'>
                      <input type="checkbox" checked readOnly className='checkbox checkbox-primary checkbox-sm mt-1' />
                      <div>
                        <p className='font-medium text-gray-950'>{item.name}</p>
                        <p className='text-sm text-gray-600'>{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Regulations */}
            <div className='card bg-white shadow-md'>
              <div className='card-body'>
                <h3 className='card-title text-2xl mb-6 flex items-center gap-2'>
                  <span className='text-2xl'>📋</span>
                  Persyaratan & Regulasi
                </h3>
                <ul className='space-y-3'>
                  {[
                    { name: "LARTAS Impor", desc: "Persyaratan barang impor" },
                    { name: "LARTAS Perbatasan", desc: "Aturan di lokasi perbatasan" },
                    { name: "LARTAS Pasca Perbatasan", desc: "Regulasi setelah perbatasan" },
                    { name: "LARTAS Ekspor", desc: "Persyaratan barang ekspor" },
                  ].map((item, i) => (
                    <li key={i} className='flex items-start gap-3'>
                      <input type="checkbox" checked readOnly className='checkbox checkbox-primary checkbox-sm mt-1' />
                      <div>
                        <p className='font-medium text-gray-950'>{item.name}</p>
                        <p className='text-sm text-gray-600'>{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div
          className={`mb-32 transition-all duration-700 ${showContent ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <h2 className='text-4xl font-bold text-gray-950 mb-12'>Cara Penggunaan</h2>
          <div className='space-y-4'>
            {[
              {
                step: 1,
                title: "Siapkan Data",
                desc: "Buat file Excel dengan daftar kode HS yang ingin kamu cek. Download template dari aplikasi untuk format yang tepat."
              },
              {
                step: 2,
                title: "Upload File",
                desc: "Buka INSScan dan upload file Excel kamu dengan mudah. Proses validasi otomatis untuk memastikan format benar."
              },
              {
                step: 3,
                title: "Sistem Bekerja Otomatis",
                desc: "Aplikasi akan memproses semua kode HS dan menarik data tarif dari API SISP secara real-time tanpa intervensi manual."
              },
              {
                step: 4,
                title: "Download Hasilnya",
                desc: "Unduh file Excel lengkap berisi semua data tarif, LARTAS requirements, dan informasi yang siap untuk laporan."
              }
            ].map((item) => (
              <div key={item.step} className='flex gap-6 items-start p-6 bg-white rounded-lg hover:shadow-md transition-shadow'>
                <div className='badge badge-lg badge-primary font-bold text-white min-w-16 h-16 flex items-center justify-center text-xl'>
                  {item.step}
                </div>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold text-gray-950 mb-2'>{item.title}</h3>
                  <p className='text-gray-600'>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div
          className={`mb-32 transition-all duration-700 ${showContent ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <h2 className='text-4xl font-bold text-gray-950 mb-12'>Mengapa Pilih INSScan?</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {[
              {
                icon: "⏱️",
                title: "Hemat Waktu Kerja",
                desc: "Proses yang biasanya memakan waktu berjam-jam dapat diselesaikan dalam hitungan menit dengan automasi penuh."
              },
              {
                icon: "🎯",
                title: "Data Akurat & Terpercaya",
                desc: "Informasi langsung bersumber dari SISP (Bea dan Cukai), lembaga resmi pengelola tarif kepabeanan Indonesia."
              },
              {
                icon: "🔄",
                title: "Selalu Update",
                desc: "Data tarif diperbarui secara real-time dari API SISP, memastikan informasi terkini untuk setiap pengecekan."
              },
              {
                icon: "💼",
                title: "User-Friendly",
                desc: "Antarmuka intuitif yang mudah digunakan tanpa memerlukan keahlian teknis atau pelatihan khusus."
              }
            ].map((benefit, i) => (
              <div key={i} className='card bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md hover:shadow-lg transition-shadow'>
                <div className='card-body'>
                  <div className='text-5xl mb-4'>{benefit.icon}</div>
                  <h4 className='card-title text-xl text-gray-950'>{benefit.title}</h4>
                  <p className='text-gray-700 mt-2'>{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div
          className={`mb-32 transition-all duration-700 ${showContent ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <h2 className='text-4xl font-bold text-gray-950 mb-12'>Pertanyaan Umum</h2>
          <div className='space-y-3'>
            {faqItems.map((item, i) => (
              <div key={i} className='collapse collapse-plus bg-white shadow-sm hover:shadow-md transition-shadow'>
                <input
                  type="radio"
                  name="faq-accordion"
                  checked={expandedFaq === i}
                  onChange={() => setExpandedFaq(expandedFaq === i ? null : i)}
                />
                <div className='collapse-title text-lg font-semibold text-gray-950'>
                  {item.question}
                </div>
                <div className='collapse-content'>
                  <p className='text-gray-700 pt-4'>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA Section */}
        <div
          className={`mb-16 transition-all duration-700 ${showContent ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <div className='bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white shadow-xl'>
            <h2 className='text-4xl font-bold mb-4'>Siap Mulai Sekarang?</h2>
            <p className='text-xl mb-8 opacity-90'>
              Tingkatkan efisiensi pengecekan kode HS dan tarif kepabeanan dengan INSScan
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/inscann'>
                <button className='btn btn-lg btn-primary bg-white text-blue-600 hover:bg-gray-100 font-bold'>
                  Buka INSScan Sekarang
                </button>
              </Link>
              <button className='btn btn-lg btn-outline btn-primary text-white border-white hover:bg-white/20'>
                Pelajari Lebih Lanjut
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

function Hero({ onCtaClick, onStatsClick }) {
  return (
    <div className='min-h-screen flex items-center justify-center px-6 pt-20 pb-10'>
      <div className='text-center max-w-4xl'>
        {/* Tagline */}
        <p className='text-blue-600 font-semibold text-lg mb-4 tracking-wide uppercase'>
          🚀 Solusi Terpercaya untuk PPJK
        </p>

        {/* Main Heading */}
        <h1 className='text-5xl lg:text-7xl font-bold text-gray-950 mb-6 tracking-tight leading-tight'>
          Kelola Kode HS &<br />
          <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
            Tarif Kepabeanan
          </span>
          <br />dengan Mudah
        </h1>

        {/* Subheading - Value Proposition */}
        <p className='text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto'>
          Otomatisasi pengecekan LARTAS dan tarik data tarif real-time dari SISP dalam hitungan menit. Hemat waktu hingga 80%, tingkatkan akurasi, dan kelola compliance dengan percaya diri.
        </p>

        {/* CTA Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center mb-12'>
          <Link href='/inscann'>
            <button className='btn btn-lg btn-primary bg-blue-600 hover:bg-blue-700 text-white border-none font-bold'>
              Coba Sekarang - Gratis
            </button>
          </Link>
          <button
            className='btn btn-lg btn-outline border-gray-300 text-gray-950 hover:bg-gray-100'
            onClick={onStatsClick}
          >
            Lihat Fitur & Keuntungan
          </button>
        </div>

        {/* Trust Indicators */}
        <div className='flex flex-col sm:flex-row gap-6 justify-center text-sm text-gray-600'>
          <div className='flex items-center gap-2'>
            <span className='text-xl'>✅</span>
            <span>Terpercaya oleh 500+ PPJK</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-xl'>⚡</span>
            <span>Data dari SISP Resmi</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-xl'>🔒</span>
            <span>Uptime 99.8%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
