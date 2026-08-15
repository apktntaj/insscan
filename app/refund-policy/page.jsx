import LegalPage, { Section } from "../presentation/components/legal/LegalPage";
export const metadata = { title: "Kebijakan Pembatalan dan Refund" };
export default function RefundPolicyPage() {
  return <LegalPage eyebrow="Pesisir Pro" title="Pembatalan dan Refund" intro="Kebijakan pembelian Pesisir Pro selama Early Access.">
    <Section title="Tidak ada perpanjangan otomatis"><p>Paket berlaku untuk masa aktif yang dikonfirmasi saat pembelian. Pengguna harus menyetujui dan melakukan pembayaran baru untuk memperpanjangnya.</p></Section>
    <Section title="Pembatalan"><p>Pengguna dapat berhenti kapan saja tanpa biaya pembatalan. Akses tetap aktif hingga akhir periode yang dibayar, kecuali refund penuh disetujui.</p></Section>
    <Section title="Permintaan refund"><p>Refund dapat diminta melalui Dukungan WhatsApp paling lambat 7 hari kalender setelah pembayaran apabila akses belum diaktifkan, terjadi pembayaran ganda, atau gangguan dari Pesisir membuat fitur utama tidak dapat digunakan secara material.</p></Section>
    <Section title="Pengecualian"><p>Refund dapat ditolak apabila layanan telah digunakan secara substansial, masalah berasal dari input atau perangkat pengguna, atau akses dihentikan karena penyalahgunaan. Permintaan tetap ditinjau secara wajar berdasarkan bukti transaksi dan riwayat penggunaan yang tersedia.</p></Section>
    <Section title="Proses"><p>Sertakan nama, tanggal, nominal, dan referensi pembayaran. Jika disetujui, refund dikirim ke sumber atau rekening yang disepakati; waktu penerimaan bergantung pada penyedia pembayaran.</p></Section>
  </LegalPage>;
}
