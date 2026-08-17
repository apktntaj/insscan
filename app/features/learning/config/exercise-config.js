/**
 * Data soal latihan kepabeanan.
 * Bersumber dari diklat kepabeanan.
 *
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} pertanyaan
 * @property {string[]} pilihanJawaban
 * @property {string} jawaban - index jawaban benar (string "0"-"3"), atau "" bila tidak diketahui
 * @property {string} tentang - topik soal
 */

/** @type {Question[]} */
export const questions = [
  {
    id: "1",
    pertanyaan: "Kawasan pabean adalah...",
    pilihanJawaban: [
      "Wilayah RI yang meliputi darat, air, dan ruang udara di atasnya termasuk tempat-tempat tertentu di Zona Ekonomi Ekslusif dan Landasan Kontinen dimana berlaku undang-undang kepabeanan",
      "Wilayah RI dimana berlaku undang-undang kepabeanan",
      "Kawasan dengan batas-batas tertentu di daerah Pabean Indonesia lainnya",
      "Kawasan dengan batas-batas tertentu di pelabuhan laut, bandar udara, atau tempat lain yang ditetapkan untuk lalu lintas barang yang sepenuhnya di bawah pengawasan DJBC",
    ],
    jawaban: "3",
    tentang: "Terminologi",
  },
  {
    id: "2",
    pertanyaan: "Barang yang telah dimuat di sarana pengangkut dengan tujuan untuk diekspor, jika sarana pengangkutnya masih sandar di pelabuhan...",
    pilihanJawaban: [
      "Belum diberlakukan sebagai barang ekspor",
      "Diperlakukan sebagai barang antar pulau",
      "Diperlakukan sebagai barang yang berasal dari daerah bebas",
      "Diperlakukan sebagai barang ekspor",
    ],
    jawaban: "3",
    tentang: "Tata Laksana Ekspor Impor",
  },
  {
    id: "3",
    pertanyaan: "Tempat penimbunan sementara adalah tempat untuk menimbun...",
    pilihanJawaban: [
      "Barang impor, barang ekspor, dan barang antar pulau yang sementara menunggu pemuatan pengeluarannya",
      "Barang impor, barang ekspor, barang yang tidak dikuasai, dan barang dikuasai negara sementara menunggu pemuatan atau pengeluarannya",
      "Barang impor, barang ekspor, dan barang yang dinyatakan dikuasai negara sementara menunggu pemuatan atau pengeluarannya",
      "Barang impor dan barang ekspor yang sementara menunggu pengeluaran dan pemuatannya",
    ],
    jawaban: "3",
    tentang: "Tata Laksana Ekspor Impor",
  },
  {
    id: "4",
    pertanyaan: "Tarif Bea Masuk dapat ditetapkan berbeda dengan pasal 13 ayat 1 (setinggi-tingginya 40%) dengan alasan...",
    pilihanJawaban: [
      "Barang impor yang bersangkutan dikenakan tarif Bea Masuk berdasarkan perjanjian atau kesepakatan internasional",
      "Perlindungan industri dalam negeri",
      "Nilai pabean dicurigai diberitahukan dengan tidak benar",
      "Untuk meningkatkan penerimaan negara dari sektor impor",
    ],
    jawaban: "0",
    tentang: "Pengenaan Tarif",
  },
  {
    id: "5",
    pertanyaan: "Barang diangkut lanjut adalah...",
    pilihanJawaban: [
      "Barang dari luar daerah pabean untuk tujuan luar daerah pabean lainnya yang pengangkutannya singgah di salah satu pelabuhan di Indonesia",
      "Barang yang diangkut dengan sarana pengangkut melalui kantor pabean dengan pembongkaran terlebih dahulu",
      "Barang yang belum dilunasi Bea Masuknya yang dipindahkapalkan atau diangkut terus ke luar daerah pabean",
      "Barang yang diangkut dengan sarana pengangkut melalui kantor pabean tanpa melalui pembongkaran terlebih dahulu",
    ],
    jawaban: "1",
    tentang: "Tata Laksana Ekspor Impor",
  },
  {
    id: "6",
    pertanyaan: "Alasan pengenaan bea masuk anti dumping adalah...",
    pilihanJawaban: [
      "Harga ekspor barang yang lebih rendah dari harga nominalnya",
      "Adanya subsidi terhadap barang ekspor",
      "Pemasukan pajak sebesar-besarnya ke kas negara",
      "Kebijakan pemerintah",
    ],
    jawaban: "0",
    tentang: "Bea Masuk Tambahan",
  },
  {
    id: "7",
    pertanyaan: "Ketentuan tentang penunjukan Tempat Penimbunan Sementara diatur oleh...",
    pilihanJawaban: [
      "Pengusaha tempat penimbunan sementara",
      "Administrator pelabuhan/bandara",
      "Menteri Perhubungan",
      "Menteri Keuangan",
    ],
    jawaban: "3",
    tentang: "Tata Laksana Ekspor Impor",
  },
  {
    id: "8",
    pertanyaan: "Di tempat penimbunan pabean, disimpan...",
    pilihanJawaban: [
      "Barang impor dan barang ekspor sementara menunggu pengeluaran atau pemuatannya",
      "Barang impor untuk tujuan produksi, pameran, penjualan dan penimbunan",
      "Barang impor di bawah pengawasan pabean",
      "Barang yang dinyatakan tidak dikuasai, barang dikuasai negara, dan barang yang menjadi milik negara",
    ],
    jawaban: "3",
    tentang: "Tata Laksana Ekspor Impor",
  },
  {
    id: "9",
    pertanyaan: "Rumus menghitung bea masuk adalah...",
    pilihanJawaban: [
      "Persentase BTBMI x harga FOB",
      "Persentase BTBMI x harga pasar di negara pengekspor",
      "Persentase BTBMI x nilai pabean",
      "Persentase BTBMI x NDPBM",
    ],
    jawaban: "2",
    tentang: "Pengenaan Tarif",
  },
  {
    id: "10",
    pertanyaan: "Dewasa ini jenis tarif bea masuk yang berlaku untuk impor gula dan beras adalah...",
    pilihanJawaban: [
      "Tarif degresif",
      "Tarif advalorum",
      "Tarif spesifik",
      "Tarif progresif",
    ],
    jawaban: "2",
    tentang: "Pengenaan Tarif",
  },
  {
    id: "11",
    pertanyaan: "Cara menghitung PPnBM...",
    pilihanJawaban: [
      "Persentase tarif x CIF",
      "Persentase tarif x FOB",
      "Persentase tarif x (CIF + pungutan pabean)",
      "10% x (CIF + pungutan pabean)",
    ],
    jawaban: "2",
    tentang: "Pengenaan Tarif",
  },
  {
    id: "12",
    pertanyaan: "Pengurusan pemberitahuan pabean...",
    pilihanJawaban: [
      "Wajib dilakukan oleh importir atau eksportir",
      "Wajib dilakukan oleh PPJK",
      "Dapat dilakukan oleh siapa saja",
      "Dilakukan oleh PPJK bilamana importir atau eksportir tidak melakukannya sendiri",
    ],
    jawaban: "3",
    tentang: "Kewajiban Pabean",
  },
  {
    id: "13",
    pertanyaan: "PPJK bertanggung jawab atas bea masuk...",
    pilihanJawaban: [
      "Setiap barang impor yang diurusnya",
      "Jika diperjanjikan di dalam surat kuasa dari importir kepada PPJK",
      "Jika importir tidak ditemukan",
      "Jika diminta oleh pejabat pabean",
    ],
    jawaban: "2",
    tentang: "Kewajiban Pabean",
  },
  {
    id: "14",
    pertanyaan: "Hak menagih atas utang bea masuk akan kadaluwarsa setelah...",
    pilihanJawaban: [
      "30 hari sejak terbitnya kewajiban membayar",
      "60 hari sejak terbitnya kewajiban membayar",
      "10 tahun sejak terbitnya kewajiban membayar",
      "24 bulan sejak terbitnya kewajiban membayar",
    ],
    jawaban: "2",
    tentang: "Kewajiban Pabean",
  },
  {
    id: "15",
    pertanyaan: "Salah satu alasan barang dinyatakan tidak dikuasai adalah...",
    pilihanJawaban: [
      "Barang yang disimpan di tempat penimbunan sementara lebih dari 30 hari",
      "Barang berada di bawah pengawasan pabean",
      "Barang tersangkut tindak pidana yang pelakunya tidak dikenal",
      "Barang kena lartas yang tidak diberitahukan dalam pemberitahuan pabean atau barang diberitahukan secara tidak benar",
    ],
    jawaban: "0",
    tentang: "Pembongkaran dan Penimbunan",
  },
  {
    id: "16",
    pertanyaan: "Yang menjadi alasan sebuah barang menjadi milik negara adalah...",
    pilihanJawaban: [
      "Barang yang disimpan di tempat penimbunan sementara melebihi waktu 30 hari",
      "Barang yang berada di bawah pengawasan pabean",
      "Barang yang tersangkut tindak pidana yang pelakunya tidak diketahui",
      "Barang yang dibatasi yang tidak diselesaikan pemiliknya dalam jangka waktu yang ditetapkan",
    ],
    jawaban: "3",
    tentang: "Tata Laksana Ekspor Impor",
  },
  {
    id: "18",
    pertanyaan: "Di dalam passive action procedure, pejabat pabean dapat menangguhkan sementara pengeluaran barang impor atau ekspor hasil pelanggaran hak kekayaan intelektual berdasarkan...",
    pilihanJawaban: [
      "Perintah tertulis ketua pengadilan niaga",
      "Karena jabatan",
      "Perintah Dirjen bea cukai",
      "Perintah kepala kantor pabean",
    ],
    jawaban: "0",
    tentang: "Kewenangan Pabean",
  },
  {
    id: "19",
    pertanyaan: "Barang kiriman pos yang ditolak si alamat dan tidak dapat dikirim kembali...",
    pilihanJawaban: [
      "Dinyatakan sebagai barang dikuasai negara",
      "Barang milik negara",
      "Barang yang tidak dikuasai",
      "Barang tahanan",
    ],
    jawaban: "2",
    tentang: "Tata Laksana Ekspor Impor",
  },
  {
    id: "20",
    pertanyaan: "Daerah pabean Indonesia adalah wilayah RI yang meliputi...",
    pilihanJawaban: [
      "Wilayah darat, perairan, dan ruang udara di atasnya termasuk zona ekslusif dan landasan kontinen",
      "Wilayah darat, laut, dan ruang udara di atasnya, laut lepas dan laut wilayah",
      "Wilayah darat, laut, dan ruang udara serta tempat tertentu di wilayah RI",
      "Wilayah darat, perairan, dan ruang udara di atasnya, termasuk tempat-tempat tertentu di zona ekonomi eksklusif dan landasan kontinen",
    ],
    jawaban: "3",
    tentang: "Terminologi",
  },
  {
    id: "21",
    pertanyaan: "Pemeriksaan pabean adalah...",
    pilihanJawaban: [
      "Pemeriksaan fisik barang",
      "Meliputi pemeriksaan fisik dan penelitian dokumen",
      "Pemeriksaan dokumen",
      "Pemeriksaan terhadap penumpang atau awak sarana pengangkut",
    ],
    jawaban: "1",
    tentang: "Kewenangan Pabean",
  },
  {
    id: "22",
    pertanyaan: "Berdasarkan pasal 112 UU No.10 tahun 1995, penyidikan tindak pidana di bidang kepabeanan dilakukan oleh...",
    pilihanJawaban: [
      "Penyidik POLRI",
      "Penyidik bea cukai dan penyidik POLRI",
      "Kejaksaan",
      "Penyidik bea cukai",
    ],
    jawaban: "3",
    tentang: "Ketentuan Pidana",
  },
  {
    id: "23",
    pertanyaan: "Dalam hal pelaku tindak pidana adalah suatu badan hukum atau perusahaan, maka sanksi pidana berupa pidana pokok yang dijatuhkan...",
    pilihanJawaban: [
      "Dapat berupa hukuman badan dan denda",
      "Dapat berupa hukuman dan sanksi",
      "Berupa pidana denda",
      "Tergantung keputusan hakim",
    ],
    jawaban: "2",
    tentang: "Ketentuan Pidana",
  },
  {
    id: "24",
    pertanyaan: "Barang impor atau ekspor yang berasal dari tindak pidana penyelundupan yang dirampas untuk negara, pemanfaatannya diatur oleh...",
    pilihanJawaban: [
      "Hakim",
      "Jaksa Penuntut Umum",
      "Dirjen bea dan cukai",
      "Menteri Keuangan",
    ],
    jawaban: "3",
    tentang: "Ketentuan Pidana",
  },
  {
    id: "25",
    pertanyaan: "Pembukuan, catatan, dan surat menyurat yang bertalian dengan impor dan ekspor wajib disimpan oleh importir dan eksportir...",
    pilihanJawaban: ["10 tahun", "2 tahun", "5 tahun", "8 tahun"],
    jawaban: "0",
    tentang: "Kewajiban Pabean",
  },
  {
    id: "26",
    pertanyaan: "PPJK yang melakukan tindak pidana kepabeanan atas kuasa yang diterimanya dari importir...",
    pilihanJawaban: [
      "Tidak dapat dikenakan sanksi pidana karena hanya perpanjangan tangan dari importir",
      "Dapat dikenakan sanksi administrasi",
      "Tidak dapat dikenakan sanksi administrasi atau sanksi pidana karena ia bertindak atas perintah importir",
      "Dikenakan sanksi pidana dengan ancaman pidana yang sama yang juga berlaku terhadap importir",
    ],
    jawaban: "3",
    tentang: "Ketentuan Pidana",
  },
  {
    id: "27",
    pertanyaan: "Tindak pidana di bidang kepabeanan tidak dapat dituntut setelah jangka waktu...",
    pilihanJawaban: [
      "10 tahun sejak diserahkan pemberitahuan pabean atau sejak terjadinya tindak pidana",
      "2 tahun sejak diserahkan pemberitahuan pabean atau sejak terjadinya tindak pidana",
      "5 tahun sejak diserahkan pemberitahuan pabean atau sejak terjadinya tindak pidana",
      "Tidak ada ketentuan yang mengatur di dalam UU pabean",
    ],
    jawaban: "0",
    tentang: "Ketentuan Pidana",
  },
  {
    id: "28",
    pertanyaan: "Tanggung jawab atas keamanan segel yang dipasang pejabat, berada pada...",
    pilihanJawaban: [
      "Pemilik dan/atau yang menguasai sarana pengangkut atau tempat yang disegel",
      "Pegawai DJBC yang memasang segel",
      "Pemilik dan/atau yang menguasai sarana pengangkut atau tempat yang disegel atau pegawai DJBC yang memasang segel",
      "Pemilik barang",
    ],
    jawaban: "0",
    tentang: "Kewenangan Pabean",
  },
  {
    id: "30",
    pertanyaan: "Besarnya sanksi administrasi karena pelanggaran kepabeanan, dalam hal tarif bea masuk adalah 0%, adalah...",
    pilihanJawaban: [
      "Nihil",
      "100% dari bea masuk dan pajak dalam rangka impor",
      "100% - 500% dari kekurangan pembayaran bea masuk",
      "Rp 5.000.000",
    ],
    jawaban: "3",
    tentang: "Kewajiban Pabean",
  },
  {
    id: "31",
    pertanyaan: "Jangka waktu penangguhan barang impor yang diduga melanggar kekayaan intelektual dari kawasan pabean adalah...",
    pilihanJawaban: ["30 hari", "10 hari", "60 hari", "14 hari"],
    jawaban: "1",
    tentang: "Ketentuan Pidana",
  },
  {
    id: "32",
    pertanyaan: "Tempat penimbunan pabean dikelola oleh...",
    pilihanJawaban: [
      "Pengusaha tempat penimbunan pabean",
      "PT Pelindo atau PT Angkasa Pura",
      "Bea cukai",
      "Administrator bandara/pelabuhan",
    ],
    jawaban: "2",
    tentang: "Pembongkaran dan Penimbunan",
  },
  {
    id: "33",
    pertanyaan: "Tanggung jawab bea masuk atas barang impor yang mendapat fasilitas pembebasan atau keringanan, jika barang tersebut telah dikuasai oleh orang lain, berada pada...",
    pilihanJawaban: [
      "Importir yang bersangkutan",
      "Negara",
      "Orang yang menguasai barang bersangkutan",
      "Pemasok barang yang bersangkutan",
    ],
    jawaban: "2",
    tentang: "Kewajiban Pabean",
  },
  {
    id: "35",
    pertanyaan: "Dirjen bea cukai dapat menetapkan kembali tarif dan nilai pabean untuk penghitungan bea masuk dalam jangka waktu...",
    pilihanJawaban: [
      "2 tahun sejak pemberitahuan pabean",
      "10 tahun sejak pemberitahuan pabean",
      "60 hari sejak pemberitahuan pabean",
      "30 hari sejak pemberitahuan pabean",
    ],
    jawaban: "0",
    tentang: "Kewajiban Pabean",
  },
  {
    id: "37",
    pertanyaan: "Alasan pengenaan bea masuk imbalan adalah...",
    pilihanJawaban: [
      "Harga ekspor lebih rendah dari harga nominalnya",
      "Adanya subsidi terhadap barang ekspor",
      "Pemasukan pajak sebesar-besarnya ke kas negara",
      "Kebijakan pemerintah",
    ],
    jawaban: "1",
    tentang: "Bea Masuk Tambahan",
  },
  {
    id: "38",
    pertanyaan: "Tempat penimbunan berikat mendapat fasilitas...",
    pilihanJawaban: [
      "Penangguhan bea masuk",
      "Pembebasan bea masuk",
      "Tidak dipungut bea masuk",
      "Keringanan bea masuk",
    ],
    jawaban: "0",
    tentang: "Fasilitas Kepabeanan",
  },
  {
    id: "39",
    pertanyaan: "Barang impor sementara diberikan fasilitas...",
    pilihanJawaban: [
      "Pembebasan bea masuk",
      "Pembebasan bea masuk atau keringanan bea masuk",
      "Keringanan bea masuk",
      "Tidak dipungut bea masuk",
    ],
    jawaban: "1",
    tentang: "Fasilitas Kepabeanan",
  },
  {
    id: "41",
    pertanyaan: "Pernyataan yang benar adalah...",
    pilihanJawaban: [
      "Terhadap barang ekspor dilakukan penelitian dokumen",
      "Terhadap barang ekspor dilakukan pemeriksaan pabean",
      "Terhadap barang ekspor dilakukan pemeriksaan fisik dan dokumen",
      "Terhadap barang ekspor tidak dilakukan pemeriksaan pabean",
    ],
    jawaban: "2",
    tentang: "Kewenangan Pabean",
  },
  {
    id: "45",
    pertanyaan: "Yang dimaksud pre entry classification adalah...",
    pilihanJawaban: [
      "Penetapan klasifikasi barang oleh Dirjen bea dan cukai sebelum pemberitahuan barang",
      "Penetapan nilai pabean, tarif, dan klasifikasi barang oleh Dirjen bea dan cukai sebelum diajukan pemberitahuan pabean atas permohonan importir",
      "Penetapan klasifikasi barang oleh Dirjen bea dan cukai sebelum dilakukan pembongkaran",
      "Penetapan klasifikasi barang oleh Dirjen bea dan cukai sebelum dikapalkan",
    ],
    jawaban: "0",
    tentang: "Kewajiban Pabean",
  },
  {
    id: "55",
    pertanyaan: "Barang yang dinyatakan tidak dikuasai yang merupakan barang yang dibatasi impornya...",
    pilihanJawaban: [
      "Dinyatakan menjadi milik negara",
      "Dilakukan pelelangan 60 hari terhitung sejak disimpan di tempat penimbunan pabean",
      "Dimusnahkan di bawah pengawasan pejabat bea dan cukai",
      "Disediakan untuk diselesaikan oleh pemiliknya dalam jangka waktu 60 hari sejak disimpan di tempat penimbunan pabean",
    ],
    jawaban: "3",
    tentang: "Tata Laksana Ekspor Impor",
  },
  {
    id: "56",
    pertanyaan: "Pilihlah pernyataan berikut ini yang benar...",
    pilihanJawaban: [
      "Bea keluar dikenakan terhadap barang dengan tujuan untuk kepentingan penerimaan negara",
      "Bea keluar dikenakan terhadap barang dengan tujuan untuk melindungi industri dalam negeri",
      "Bea keluar dikenakan terhadap barang dengan tujuan menjamin kebutuhan dalam negeri",
      "Bea keluar dikenakan terhadap barang dengan tujuan menjaga stabilitas harga komoditi tertentu di luar negeri",
    ],
    jawaban: "2",
    tentang: "Tata Laksana Ekspor Impor",
  },
  {
    id: "57",
    pertanyaan: "Berdasarkan UU No 17 tahun 2006 tentang perubahan UU 10 Tahun 1995 tentang kepabeanan...",
    pilihanJawaban: [
      "Pemeriksaan fisik dilakukan secara selektif",
      "Pemeriksaan dokumen dilakukan secara selektif",
      "Pemeriksaan pabean dilakukan secara selektif",
      "Pemeriksaan pembukuan dilakukan secara selektif",
    ],
    jawaban: "0",
    tentang: "Kewenangan Pabean",
  },
  {
    id: "58",
    pertanyaan: "Kewajiban registrasi diwajibkan bagi...",
    pilihanJawaban: [
      "Importir dan eksportir",
      "Orang yang akan melakukan kewajiban pabean",
      "Orang yang akan meminta fasilitas pabean",
      "Orang yang akan mendirikan tempat-tempat penimbunan di bawah pengawasan pabean",
    ],
    jawaban: "1",
    tentang: "Kewajiban Pabean",
  },
  {
    id: "60",
    pertanyaan: "RKSP wajib diserahkan ke kantor paling lambat...",
    pilihanJawaban: [
      "12 jam sebelum kedatangan",
      "24 jam sebelum kedatangan",
      "Sebelum kedatangan",
      "8 jam sebelum kedatangan",
    ],
    jawaban: "1",
    tentang: "Kedatangan Sarana Pengangkut",
  },
  {
    id: "64",
    pertanyaan: "Barang yang ditegah oleh pejabat bea dan cukai dianggap sebagai barang...",
    pilihanJawaban: [
      "Tidak dikuasai",
      "Dikuasai negara",
      "Milik negara",
      "Tidak bertuan",
    ],
    jawaban: "2",
    tentang: "Kewenangan Pabean",
  },
  {
    id: "65",
    pertanyaan: "Tempat penimbunan berikat adalah...",
    pilihanJawaban: [
      "Bangunan dan/atau lapangan atau kawasan yang memenuhi syarat tertentu yang digunakan untuk menimbun barang dengan tujuan tertentu dengan mendapatkan pembebasan bea masuk",
      "Bangunan dan/atau lapangan atau tempat lain yang disamakan dengan itu di kawasan pabean untuk menimbun barang yang sementara menunggu pemuatan atau pengeluarannya",
      "Bangunan dan/atau lapangan atau tempat lain yang disamakan dengan itu di kawasan pabean untuk menimbun barang yang sementara menunggu pemuatan atau pengeluarannya dengan mendapatkan penangguhan bea masuk",
      "Bangunan dan/atau lapangan atau kawasan yang memenuhi persyaratan tertentu yang digunakan untuk menimbun barang dengan tujuan tertentu dengan mendapatkan penangguhan bea masuk",
    ],
    jawaban: "3",
    tentang: "Terminologi",
  },
  {
    id: "68",
    pertanyaan: "Bea masuk pembalasan dikenakan terhadap barang impor yang...",
    pilihanJawaban: [
      "Berasal dari negara yang memberikan subsidi terhadap barang yang diekspor ke Indonesia",
      "Berasal dari negara yang memperlakukan barang ekspor Indonesia secara diskriminatif",
      "Harga ekspornya lebih rendah",
      "Menyebabkan kerugian serius terhadap industri dalam negeri yang memproduksinya",
    ],
    jawaban: "1",
    tentang: "Bea Masuk Tambahan",
  },
  {
    id: "71",
    pertanyaan: "Penyidikan tindak pidana kepabeanan dilakukan oleh...",
    pilihanJawaban: [
      "Penyidik bea dan cukai",
      "Penyidik POLRI",
      "Pejabat bea dan cukai",
      "Penyidik POLRI dan bea cukai",
    ],
    jawaban: "0",
    tentang: "Ketentuan Pidana",
  },
];

/**
 * Mengambil soal secara acak sebanyak n soal.
 * @param {number} n
 * @returns {Question[]}
 */
export function getRandomQuestions(n = 10) {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}
