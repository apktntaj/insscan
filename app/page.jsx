import Link from "next/link";

const Home = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      {/* Hero Section */}
      <div className='container mx-auto px-4 py-20'>
        <div className='text-center mb-16'>
          <h1 className='bg-gradient-to-r from-purple-400 via-emerald-500 to-sky-400 bg-clip-text text-transparent text-7xl font-extrabold mb-4 tracking-widest'>
            PESISIR
          </h1>
          <p className='text-2xl text-gray-700 mb-6'>
            Cari Kode HS, Tarik Data Tarif Dengan Mudah
          </p>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Dapatkan informasi HS code dan tarif terkini langsung dari Sistem Informasi Satu Pintu (SISP) Indonesia dengan cepat dan akurat.
          </p>
        </div>

        {/* CTA Button */}
        <div className='text-center mb-20'>
          <Link href='/inscann'>
            <button className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200'>
              Mulai Sekarang →
            </button>
          </Link>
        </div>

        {/* Features Section */}
        <div className='grid md:grid-cols-3 gap-8 mb-20'>
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <div className='text-4xl mb-4'>📊</div>
            <h3 className='text-xl font-bold text-gray-900 mb-2'>Upload File Excel</h3>
            <p className='text-gray-600'>
              Cukup upload file Excel (.xls atau .xlsx) berisi kode HS kamu, dan biarkan sistem melakukan pekerjaan.
            </p>
          </div>

          <div className='bg-white rounded-lg shadow-lg p-8'>
            <div className='text-4xl mb-4'>⚡</div>
            <h3 className='text-xl font-bold text-gray-900 mb-2'>Data Real-Time</h3>
            <p className='text-gray-600'>
              Tarik data tarif langsung dari API resmi SISP dengan informasi BM, PPN, dan PPH yang selalu terbaru.
            </p>
          </div>

          <div className='bg-white rounded-lg shadow-lg p-8'>
            <div className='text-4xl mb-4'>📥</div>
            <h3 className='text-xl font-bold text-gray-900 mb-2'>Ekspor Instan</h3>
            <p className='text-gray-600'>
              Hasilnya langsung terformat rapi dalam file Excel yang siap pakai untuk laporan atau analisis lanjutan.
            </p>
          </div>
        </div>

        {/* Information Section */}
        <div className='bg-white rounded-lg shadow-lg p-12 mb-20'>
          <h2 className='text-3xl font-bold text-gray-900 mb-6'>Data Apa Yang Kamu Dapatkan?</h2>
          <div className='grid md:grid-cols-2 gap-8'>
            <div>
              <h3 className='text-xl font-semibold text-indigo-600 mb-4'>Informasi Tarif</h3>
              <ul className='space-y-2 text-gray-700'>
                <li>✓ BM (Bea Masuk)</li>
                <li>✓ PPN (Pajak Pertambahan Nilai)</li>
                <li>✓ PPH (Pajak Penghasilan)</li>
                <li>✓ PPH Non-API</li>
              </ul>
            </div>
            <div>
              <h3 className='text-xl font-semibold text-indigo-600 mb-4'>Peraturan & Persyaratan</h3>
              <ul className='space-y-2 text-gray-700'>
                <li>✓ LARTAS Impor</li>
                <li>✓ LARTAS Perbatasan</li>
                <li>✓ LARTAS Pasca Perbatasan</li>
                <li>✓ LARTAS Ekspor</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className='bg-white rounded-lg shadow-lg p-12 mb-20'>
          <h2 className='text-3xl font-bold text-gray-900 mb-8'>Caranya Gimana?</h2>
          <div className='space-y-6'>
            <div className='flex items-start'>
              <div className='bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mr-4 flex-shrink-0'>1</div>
              <div>
                <h3 className='text-xl font-semibold text-gray-900'>Siapkan Data</h3>
                <p className='text-gray-600'>Buat file Excel dengan kode-kode HS yang ingin kamu cari</p>
              </div>
            </div>
            <div className='flex items-start'>
              <div className='bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mr-4 flex-shrink-0'>2</div>
              <div>
                <h3 className='text-xl font-semibold text-gray-900'>Upload File</h3>
                <p className='text-gray-600'>Gunakan INSScan untuk upload file Excel kamu dengan mudah</p>
              </div>
            </div>
            <div className='flex items-start'>
              <div className='bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mr-4 flex-shrink-0'>3</div>
              <div>
                <h3 className='text-xl font-semibold text-gray-900'>Sistem Bekerja Otomatis</h3>
                <p className='text-gray-600'>Aplikasi akan menarik semua data tarif dari API SISP secara otomatis</p>
              </div>
            </div>
            <div className='flex items-start'>
              <div className='bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mr-4 flex-shrink-0'>4</div>
              <div>
                <h3 className='text-xl font-semibold text-gray-900'>Download Hasilnya</h3>
                <p className='text-gray-600'>Unduh file Excel berisi semua informasi lengkap dan siap pakai</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className='bg-indigo-50 rounded-lg p-12 mb-20'>
          <h2 className='text-3xl font-bold text-gray-900 mb-8'>Kenapa Pakai INSScan?</h2>
          <div className='grid md:grid-cols-2 gap-6'>
            <div className='flex items-start'>
              <span className='text-2xl mr-4'>✨</span>
              <div>
                <h4 className='font-semibold text-gray-900 mb-2'>Hemat Waktu Kerja</h4>
                <p className='text-gray-600'>Proses yang biasanya butuh berjam-jam bisa selesai dalam hitungan menit</p>
              </div>
            </div>
            <div className='flex items-start'>
              <span className='text-2xl mr-4'>🎯</span>
              <div>
                <h4 className='font-semibold text-gray-900 mb-2'>Data Akurat & Terpercaya</h4>
                <p className='text-gray-600'>Informasi langsung dari SISP yang merupakan sumber resmi</p>
              </div>
            </div>
            <div className='flex items-start'>
              <span className='text-2xl mr-4'>🔄</span>
              <div>
                <h4 className='font-semibold text-gray-900 mb-2'>Selalu Update</h4>
                <p className='text-gray-600'>Data tarif selalu terbaru karena diambil real-time dari API</p>
              </div>
            </div>
            <div className='flex items-start'>
              <span className='text-2xl mr-4'>💼</span>
              <div>
                <h4 className='font-semibold text-gray-900 mb-2'>User-Friendly</h4>
                <p className='text-gray-600'>Antarmuka yang sederhana, tidak perlu keahlian teknis khusus</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className='text-center py-12'>
          <h2 className='text-3xl font-bold text-gray-900 mb-4'>Siap Memudahkan Pekerjaan?</h2>
          <p className='text-gray-600 mb-8'>Cari kode HS dan tarik data tarif dalam sekali klik</p>
          <Link href='/inscann'>
            <button className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200'>
              Buka INSScan Sekarang
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
