import LegalPage, { Section } from "@/app/shared/components/LegalPage";
import { createPageMetadata } from "@/app/shared/config/site-metadata";

export const metadata = createPageMetadata({
  title: "Kebijakan Privasi",
  description:
    "Ringkasan data yang diproses saat menggunakan Pesisir dan pilihan yang tersedia bagi pengguna.",
  path: "/privacy",
});
export default function PrivacyPage() {
  return <LegalPage eyebrow="Pesisir" title="Kebijakan Privasi" intro="Ringkasan data yang diproses saat menggunakan Pesisir dan pilihan yang tersedia bagi pengguna.">
    <Section title="Data yang diproses"><p>File Excel dibaca di browser. Pesisir mengekstrak HS code dan mengirim HS code tersebut ke server untuk mengambil data. File asli tidak dimaksudkan untuk disimpan oleh server Pesisir.</p><p>Kami dapat menerima data kontak dan bukti transaksi yang dikirim secara sukarela melalui WhatsApp untuk dukungan atau konfirmasi donasi.</p></Section>
    <Section title="Data teknis"><p>Layanan hosting dan analitik dapat memproses data teknis seperti alamat IP, jenis perangkat, halaman yang dibuka, waktu akses, dan kejadian penggunaan untuk keamanan, diagnosis gangguan, dan perbaikan produk.</p></Section>
    <Section title="Penyimpanan di perangkat"><p>Kuota penggunaan dan status akses sementara dapat disimpan pada localStorage browser. Menghapus penyimpanan browser dapat menghapus pengaturan tersebut.</p></Section>
    <Section title="Pihak ketiga"><p>Permintaan HS code diteruskan ke layanan INSW. WhatsApp, penyedia hosting, dan analitik memproses data sesuai kebijakan layanan masing-masing.</p></Section>
    <Section title="Hak dan kontak"><p>Pengguna dapat meminta informasi, koreksi, atau penghapusan data kontak yang dikelola langsung oleh Pesisir melalui kanal kontak yang tersedia. Permintaan ditangani setelah identitas pemohon dapat diverifikasi.</p></Section>
  </LegalPage>;
}
