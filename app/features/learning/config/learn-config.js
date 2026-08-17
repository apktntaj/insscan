/**
 * Konfigurasi konten modul belajar kepabeanan.
 * Setiap topik memiliki id, judul, dan isi berupa array section (judul + paragraf).
 */

export const learnTopics = [
  {
    id: "definisi-ruang-lingkup",
    title: "Definisi & Ruang Lingkup",
    group: "Pengantar",
    sections: [
      {
        heading: "Kepabeanan",
        content: `Kepabeanan adalah segala sesuatu yang berhubungan dengan pengawasan atas lalu lintas (keluar masuknya) barang, serta pemungutan atas bea masuk atau bea keluar terhadap sebuah barang.\n\nObjek kepabeanan ada dua: lalu lintas barang dan pungutan pajak atas barang. Di Indonesia, kedua tanggung jawab tersebut digabung dalam satu otoritas.`,
      },
      {
        heading: "Daerah Pabean",
        content: `Daerah pabean adalah wilayah Republik Indonesia yang meliputi wilayah darat, perairan dan ruang udara di atasnya serta tempat-tempat tertentu di Zona Ekonomi Eksklusif dan landas kontinen.\n\nSetiap barang yang memasuki daerah pabean sudah langsung terutang bea masuk.`,
      },
      {
        heading: "Kawasan Pabean",
        content: `Kawasan pabean adalah daerah dengan batas-batas tertentu di pelabuhan, bandara atau tempat lain yang telah ditetapkan untuk diadakannya pengawasan oleh Dirjen Bea Cukai.\n\nBarang yang telah memasuki daerah pabean hanya boleh dibongkar di kawasan pabean. Pembongkaran di tempat lain selain kawasan pabean harus atas izin Kepala Kantor. Di kawasan pabean barang hanya boleh ditimbun sementara, dan akan dikeluarkan bila persyaratan telah terpenuhi.`,
      },
      {
        heading: "Kantor Pabean",
        content: `Kantor pabean adalah tempat dimana diselesaikannya semua proses kewajiban pabean. Tidak semua kantor yang berisi petugas Bea Cukai masuk dalam definisi kantor pabean — hanya kantor yang menjadi tempat proses penyelesaian kewajiban pabean.`,
      },
      {
        heading: "Pos Pengawasan Pabean",
        content: `Pos Pengawasan Pabean adalah tempat dimana petugas pabean melakukan pemeriksaan lalu-lintas barang. Pos pengawasan bukan tempat dilakukan penyelesaian kewajiban pabean.`,
      },
      {
        heading: "Tempat Penimbunan Sementara (TPS)",
        content: `Tempat penimbunan sementara (TPS) adalah sebuah bangunan atau lapangan yang diperuntukkan untuk menyimpan sementara barang impor sampai proses administrasi pengeluaran barang selesai.\n\nLokasi TPS berada di dalam kawasan pabean. Barang yang belum dikeluarkan sampai batas waktu yang ditetapkan akan dipindah ke Tempat Penimbunan Pabean (TPP).\n\nTPP adalah tempat yang diawasi oleh DJBC untuk menyimpan barang yang tidak dikuasai, barang yang dikuasai, dan barang yang dimiliki oleh negara.`,
      },
      {
        heading: "Tempat Penimbunan Berikat (TPB)",
        content: `Tempat penimbunan berikat adalah kawasan yang digunakan untuk menyimpan barang impor yang ditujukan untuk diolah menjadi barang siap ekspor.\n\nBarang yang ditimbun di TPB akan mendapatkan penangguhan bea masuk sampai barang yang telah diolah berhasil diekspor.\n\nJenis-jenis TPB antara lain: Kawasan Berikat, Gudang Berikat, Pusat Logistik Berikat, Toko Bebas Bea, Kawasan Daur Ulang Berikat, Tempat Lelang Berikat, dan Tempat Penyelenggaraan Pameran Berikat (TPPB).`,
      },
      {
        heading: "Kawasan Bebas (FTZ)",
        content: `Kawasan bebas (Free Trade Zone) adalah fasilitas yang diberikan negara pada daerah tertentu dimana setiap barang impor yang masuk ke daerah tersebut akan mendapatkan pembebasan bea masuk.`,
      },
    ],
  },
  {
    id: "bea-masuk-tambahan",
    title: "Bea Masuk Tambahan",
    group: "Pengantar",
    sections: [
      {
        heading: "Pengertian",
        content: `Bea masuk tambahan adalah penambahan bea masuk terhadap importasi barang yang terbukti menyebabkan kerugian industri dalam negeri. Kerugian harus berdasarkan fakta, bukan tuduhan yang tak berdasar.`,
      },
      {
        heading: "Bea Masuk Anti Dumping",
        content: `Bea masuk tambahan kategori anti dumping dikenakan pada importasi barang yang harganya di bawah harga normal. Yang dimaksud harga normal adalah harga yang berlaku secara umum dalam praktik perdagangan untuk barang yang sejenis.`,
      },
      {
        heading: "Bea Masuk Imbalan",
        content: `Bea masuk tambahan kategori imbalan dikenakan pada importasi barang yang harganya berada di bawah harga normal karena adanya bantuan (subsidi) dari negara asal.\n\nSubsidi adalah bantuan yang diberikan negara baik langsung atau tidak langsung terhadap satu pengusaha, industri, maupun kelompok industri.`,
      },
      {
        heading: "Bea Masuk Tindakan Pengamanan (Safe Guard)",
        content: `Bea masuk tambahan kategori tindakan pengamanan dikenakan pada barang yang jumlah impornya melebihi produksi dalam negeri, demi melindungi keberlangsungan produksi dalam negeri.\n\nBila sudah ada kebijakan kuota impor, maka penambahan ini tidak berlaku.`,
      },
      {
        heading: "Bea Masuk Pembalasan",
        content: `Bea masuk tambahan kategori pembalasan dikenakan pada importasi barang akibat perlakuan diskriminatif dari negara pengekspor untuk barang sejenis.\n\nContoh: ekspor kain tekstil Indonesia ke India dikenai tarif 40% sedangkan negara lain hanya 10%, maka untuk tekstil asal India juga mendapatkan penambahan bea masuk (pembalasan).`,
      },
    ],
  },
  {
    id: "kewajiban-pabean",
    title: "Kewajiban & Tanggung Jawab",
    group: "Kewajiban Pabean",
    sections: [
      {
        heading: "Pemenuhan Kewajiban Pabean",
        content: `Pemenuhan kewajiban pabean adalah proses yang harus dilakukan oleh pengguna jasa untuk memenuhi peraturan dan ketentuan yang berlaku dalam kegiatan impor dan ekspor barang.\n\nLangkah-langkahnya meliputi: registrasi, pemberitahuan pabean, pembayaran bea masuk dan pajak, dan pemenuhan ketentuan lartas.\n\nPenyelesaian kewajiban pabean bisa dilakukan di tempat lain selain kantor pabean apabila memberikan kemudahan dan kelancaran proses, dan bersifat sementara.`,
      },
      {
        heading: "Registrasi",
        content: `Pengguna jasa yang akan melakukan pemenuhan kewajiban pabean harus melakukan registrasi kepabeanan ke Dirjen Bea Cukai untuk mendapatkan akses kepabeanan.\n\nJenis pengguna jasa yang bisa mendapat akses: Importir, Eksportir, PPJK, Pengangkut, Pengusaha Kawasan Bebas, Pengusaha Jasa Titipan, Pengusaha TPS, Pengusaha TPB, dan Perusahaan KITE.\n\nRegistrasi dilakukan di Online Single Submission (OSS) yang terintegrasi dengan INSW dan portal bea cukai. Respon persetujuan/penolakan paling lama 3 jam kerja.`,
      },
      {
        heading: "Tanggung Jawab Bea Masuk",
        content: `Ketika barang memasuki daerah pabean, barang tersebut sudah terutang bea masuk. Dalam aktivitas ekspor, barang yang telah dimuat ke sarana pengangkut untuk tujuan keluar daerah pabean sudah terutang bea keluar.\n\nBila pemberitahuan impor belum masuk ke sistem, tanggung jawab ada pada siapa yang menguasai barang. Setelah pemberitahuan disubmit, tanggung jawab berpindah ke importir.\n\nBea masuk dihitung berdasarkan tarif yang berlaku pada tanggal pemberitahuan pabean.\n\nBila importir tidak dapat ditemukan dan ada bea masuk yang harus dibayarkan, maka tanggung jawab ada pada PPJK.`,
      },
      {
        heading: "Tarif dan Nilai Pabean",
        content: `Nilai pabean untuk penghitungan bea masuk adalah nilai transaksi dari barang yang bersangkutan — yaitu nilai barang yang sebenarnya atau seharusnya dibayar.\n\nDirjen Bea Cukai bisa menetapkan klasifikasi suatu barang sebelum diajukannya pemberitahuan pabean (Pre-Entry Classification), atas permohonan importir.\n\nBila nilai pabean tidak dapat ditentukan dengan nilai transaksi, maka metode yang digunakan secara berurutan: identik, serupa, deduksi, dan komputasi.\n\nDirjen Bea Cukai bisa melakukan penetapan kembali tarif dan nilai pabean paling lama 2 tahun sejak tanggal pemberitahuan pabean.`,
      },
    ],
  },
  {
    id: "kewenangan-pabean",
    title: "Kewenangan Pabean",
    group: "Kewajiban Pabean",
    sections: [
      {
        heading: "Pemeriksaan Bangunan",
        content: `Pejabat bea cukai berwenang memeriksa bangunan yang mendapatkan fasilitas, menyimpan barang yang terkena lartas, atau menyimpan barang yang berada dalam pengawasan berdasarkan pemberitahuan pabean.\n\nPejabat bea cukai juga berwenang memeriksa bangunan yang terkait (dengan surat perintah dari Dirjen) secara langsung maupun tidak langsung.\n\nPejabat bea cukai tidak boleh memeriksa bangunan berupa tempat tinggal. Menghalangi proses pemeriksaan dikenai sanksi Rp. 5.000.000.`,
      },
      {
        heading: "Pemeriksaan Sarana Pengangkut",
        content: `Pejabat bea cukai berwenang memeriksa sarana pengangkut untuk memastikan aturan tidak dilanggar dan hak negara terjamin.\n\nTidak setiap sarana pengangkut diperiksa, hanya diprioritaskan yang mencurigakan. Penghentian dan pemeriksaan bisa dilakukan baik di pelabuhan maupun di tengah laut lepas.\n\nOrang yang menghalangi pemeriksaan sarana pengangkut dikenai denda Rp. 25.000.000.`,
      },
      {
        heading: "Pemeriksaan Badan",
        content: `Mengingat barang dengan ukuran kecil bisa disembunyikan di anggota badan, pejabat bea cukai berwenang melakukan pemeriksaan badan terhadap orang yang disangka membawa barang tersembunyi.\n\nKriteria: orang yang berada atau baru saja turun/naik dari sarana pengangkut, atau berada/baru saja meninggalkan TPS, TPB, atau kawasan pabean.\n\nPemeriksaan harus dilakukan sesama jenis dan di tempat tertutup, serta dibuatkan berita acara yang ditandatangani kedua belah pihak.`,
      },
      {
        heading: "Pemeriksaan Barang",
        content: `Pejabat bea cukai berwenang memeriksa barang yang pemberitahuan pabeannya telah diserahkan untuk memperoleh data dan penilaian yang tepat.\n\nPejabat bea cukai berwenang memerintahkan pengguna jasa untuk menyerahkan barang agar diperiksa, membuka sarana pengangkut atau bagiannya, dan membuka setiap kemasan barang.\n\nSalah memberitahukan jenis atau jumlah barang sehingga kurang pembayaran bea masuk/bea keluar dikenai denda 100% - 1000% dari jumlah yang kurang dibayar.`,
      },
      {
        heading: "Pemeriksaan Pembukuan (Audit)",
        content: `Pejabat bea cukai berwenang memeriksa pembukuan pengguna jasa pabean untuk memeriksa tingkat kepatuhan terhadap aturan yang berlaku.\n\nAudit Kepabeanan adalah kegiatan pemeriksaan laporan keuangan, buku, catatan, dokumen, data elektronik, dan surat yang berkaitan dengan kegiatan di bidang kepabeanan, termasuk sediaan barang.\n\nPelaksanaan audit dapat dilakukan secara rutin atau insidental, tergantung hasil analisis risiko. Post clearance audit ini dilakukan sebagai konsekuensi pemberian fasilitas kepabeanan.`,
      },
    ],
  },
  {
    id: "ketentuan-pidana",
    title: "Ketentuan Pidana",
    group: "Kewajiban Pabean",
    sections: [
      {
        heading: "Pendahuluan",
        content: `Tindakan pidana kepabeanan adalah pelanggaran hukum yang berkaitan dengan kegiatan kepabeanan, misalnya pemalsuan dokumen pabean atau akses ilegal ke sistem elektronik.\n\nTindakan pidana kepabeanan habis masa berlakunya setelah 10 tahun sejak penyerahan pemberitahuan pabean.\n\nBila pelanggaran menyebabkan perekonomian negara terganggu, ancaman hukuman lebih berat: penjara 5-20 tahun dan denda Rp. 5.000.000.000 - Rp. 100.000.000.000.\n\nApabila tindak pidana dilakukan oleh oknum pejabat bea cukai, hukuman ditambah 1/3 dari ancaman yang berlaku umum.`,
      },
      {
        heading: "Penyelundupan Impor",
        content: `Tindak pidana penyelundupan impor meliputi: mengangkut barang impor yang tak tercantum dalam manifes, membongkar barang di luar kawasan pabean tanpa izin, membongkar barang yang tak tercantum di pemberitahuan pabean, menyembunyikan barang impor, mengeluarkan barang tanpa izin, dan salah memberitahukan jenis/jumlah barang.\n\nAncaman hukuman: penjara 1-10 tahun dan denda Rp. 50.000.000 - Rp. 5.000.000.000.`,
      },
      {
        heading: "Penyelundupan Ekspor",
        content: `Tindak pidana penyelundupan ekspor meliputi: mengangkut barang ekspor yang tak tercantum dalam manifes, memuat barang ekspor di luar kawasan pabean tanpa izin, membongkar kembali barang ekspor di dalam daerah pabean tanpa izin, dan salah memberitahukan jenis/jumlah barang.\n\nAncaman hukuman: penjara 1-10 tahun dan denda Rp. 50.000.000 - Rp. 5.000.000.000.`,
      },
      {
        heading: "Tindak Pidana Lainnya",
        content: `Ancaman penjara 2-8 tahun dan/atau denda Rp. 100.000.000 - Rp. 5.000.000.000: menyerahkan dokumen palsu atau dipalsukan, turut serta memalsukan data dalam buku/catatan, memberikan keterangan tidak benar, menimbun/menyimpan/menjual barang impor selundupan.\n\nAncaman penjara 1-3 tahun dan/atau denda Rp. 500.000.000 - Rp. 3.000.000.000: mengakses sistem elektronik pabean secara ilegal, mengangkut barang selundupan, memusnahkan/menyembunyikan buku atau catatan.\n\nAncaman penjara 1-3 tahun dan/atau denda Rp. 500.000.000 - Rp. 1.000.000.000: dengan sengaja merusak segel petugas bea cukai.`,
      },
    ],
  },
  {
    id: "kedatangan-sarana-pengangkut",
    title: "Kedatangan Sarana Pengangkut",
    group: "Tata Laksana Ekspor Impor",
    sections: [
      {
        heading: "Jenis Sarana Pengangkut",
        content: `Sarana pengangkut adalah setiap kendaraan, pesawat udara, kapal laut, atau sarana lain yang digunakan untuk mengangkut barang dan/atau orang.\n\nSarana pengangkut terdiri atas: Shipping Company, Pengangkut Kontraktual / NVOCC (Non Vessel Operator Carrier Company), dan Penyelenggara POS.\n\nPengangkut kontraktual adalah badan usaha yang mengurusi negosiasi kontrak dan kegiatan lain untuk terlaksananya pengiriman barang. Penyelenggara POS adalah badan usaha yang menyelenggarakan pos (POS Indonesia, DHL, FedEx, JNE, dsb).`,
      },
      {
        heading: "Rencana Kedatangan Sarana Pengangkut (RKSP)",
        content: `RKSP adalah pemberitahuan tentang rencana kedatangan sarana pengangkut yang disampaikan ke kantor pabean sebelum kedatangan.\n\nSarana pengangkut wajib memberitahukan RKSP ke setiap kantor pabean apabila: datang dari luar daerah pabean, datang dalam daerah pabean tapi masih mengangkut barang impor, memuat barang ekspor menuju luar daerah pabean, atau dari dalam daerah pabean menuju tempat lain tapi singgah di luar daerah pabean.\n\nBatas waktu penyerahan RKSP: Laut — paling lambat 24 jam sebelum kedatangan (bila perjalanan di bawah 24 jam, paling lambat sebelum kedatangan). Udara — sebelum kedatangan. Darat — tidak perlu menyerahkan.`,
      },
      {
        heading: "Inward Manifest",
        content: `Inward manifest adalah daftar barang yang diangkut oleh sarana pengangkut yang disampaikan kepada pihak bea cukai saat atau setelah kedatangan sarana pengangkut.\n\nPerbedaan utama RKSP dan inward manifest terletak pada tujuan dan waktu pemberitahuannya. Penyerahan inward manifest dikecualikan untuk sarana pengangkut yang tidak melakukan pembongkaran/pemuatan.\n\nBila sarana pengangkut mengalami kerusakan, pembongkaran boleh dilakukan tanpa izin terlebih dahulu asalkan langsung membuat laporan dan memenuhi ketentuan RKSP dan inward manifest paling lambat 72 jam setelah pembongkaran.`,
      },
      {
        heading: "Sanksi",
        content: `Operator sarana pengangkut (tidak termasuk NVOCC dan Penyelenggara POS) yang tidak memberitahukan RKSP dikenai sanksi antara Rp. 5.000.000 - Rp. 50.000.000.\n\nOperator NVOCC dan Penyelenggara POS yang tidak memberitahukan RKSP dikenai sanksi tidak dilayani pemberitahuan inward manifest.\n\nOperator yang tidak memberitahukan inward manifest dikenai sanksi antara Rp. 10.000.000 - Rp. 100.000.000.\n\nOperator atau NVOCC yang tidak menyampaikan outward manifest dikenai denda antara Rp. 10.000.000 - Rp. 100.000.000.`,
      },
      {
        heading: "Angkut Terus atau Angkut Lanjut",
        content: `Angkut lanjut adalah barang yang diangkut melalui kantor pabean setelah melakukan pembongkaran, sedangkan angkut terus dilakukan tanpa pembongkaran (hanya singgah/sandar).\n\nSarana pengangkut yang keluar dari kawasan pabean dengan tujuan angkut lanjut maupun angkut terus wajib menyampaikan outward manifest ke kantor pabean keberangkatan dan inward manifest ke kantor pabean tujuan.\n\nBatas waktu penyampaian outward manifest adalah sebelum keberangkatan sarana pengangkut.`,
      },
    ],
  },
  {
    id: "pembongkaran-penimbunan",
    title: "Pembongkaran & Penimbunan",
    group: "Tata Laksana Ekspor Impor",
    sections: [
      {
        heading: "Pembongkaran",
        content: `Setelah sarana pengangkut menyampaikan inward manifest dan mendapatkan nomor pendaftaran (BC 1.1), barang yang datang dari luar daerah pabean bisa dibongkar.\n\nBarang hanya boleh dibongkar di dalam kawasan pabean, kecuali atas izin Kepala Kantor.\n\nPembongkaran di tempat lain diizinkan dalam hal: barang bersifat khusus, barang impor diangkut lanjut, ada kendala teknis di kawasan pabean, terdapat kongesti yang dinyatakan penyelenggara pelabuhan, atau tidak tersedianya kawasan pabean.\n\nKongesti adalah kondisi penumpukan atau kemacetan yang menyebabkan keterlambatan proses bongkar muat di pelabuhan.`,
      },
      {
        heading: "Truck Loosing",
        content: `Barang bisa dibongkar dan langsung dimuat ke sarana pengangkut darat tanpa ditimbun dulu di TPS (truck loosing).\n\nTruck loosing bisa diberikan dalam hal: importir merupakan importir jalur prioritas atau mendapatkan fasilitas sejenis, kondisi barang tidak memungkinkan untuk ditimbun di TPS, atau barang impor mendapat fasilitas pemberitahuan pendahuluan dan telah mendapatkan persetujuan pengeluaran barang.`,
      },
      {
        heading: "Penimbunan di TPS",
        content: `Barang yang telah dibongkar disimpan di TPS atau tempat lain yang disamakan dengan TPS atas izin Kepala Kantor.\n\nPengusaha TPS wajib menyampaikan daftar timbun paling lambat 24 jam setelah barang selesai ditimbun.\n\nJangka waktu penimbunan di TPS adalah 30 hari sejak penimbunan. Barang yang melewati 30 hari dinyatakan sebagai Barang Tidak Dikuasai (BTD).\n\nBTD yang dipindah ke Tempat Penimbunan Pabean (TPP) memiliki jangka waktu 60 hari untuk segera dikeluarkan. Bila belum keluar, status beralih menjadi Barang Milik Negara (BMN).`,
      },
      {
        heading: "Barang Tidak Dikuasai (BTD)",
        content: `BTD juga termasuk barang yang dikirim melalui penyelenggara POS tapi ditolak atau alamat tidak diketahui.\n\nPenimbunan di tempat lain yang disamakan dengan TPS bisa diberikan dalam hal: importir merupakan importir AEO atau MITA Kepabeanan, kondisi barang tidak memungkinkan, ada kendala teknis, terdapat kongesti, atau tidak terdapat TPS dalam kawasan pabean.`,
      },
    ],
  },
];

/**
 * Mengelompokkan topik berdasarkan group.
 * @returns {{ [group: string]: typeof learnTopics }}
 */
export function getTopicsByGroup() {
  return learnTopics.reduce((acc, topic) => {
    if (!acc[topic.group]) acc[topic.group] = [];
    acc[topic.group].push(topic);
    return acc;
  }, {});
}
