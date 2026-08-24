import LegalPage, { Section } from "@/app/shared/components/LegalPage";
import { createPageMetadata } from "@/app/shared/config/site-metadata";

export const metadata = createPageMetadata({
  title: "Kebijakan Donasi",
  description: "Penjelasan donasi sukarela untuk mendukung Pesisir.",
  path: "/refund-policy",
});
export default function RefundPolicyPage() {
  return <LegalPage eyebrow="Pesisir" title="Kebijakan Donasi" intro="Penjelasan donasi sukarela untuk mendukung Pesisir.">
    <Section title="Sifat donasi"><p>Donasi bersifat sukarela dan bukan pembelian produk, paket, atau langganan. Seluruh fitur yang tersedia tetap dapat digunakan tanpa biaya.</p></Section>
    <Section title="Tidak ada kewajiban berulang"><p>Pesisir tidak menjalankan donasi berulang otomatis. Setiap dukungan diberikan atas keputusan pengguna sendiri.</p></Section>
    <Section title="Konfirmasi dan pertanyaan"><p>Untuk mengonfirmasi donasi atau menanyakan dukungan, hubungi kami melalui WhatsApp dengan menyertakan tanggal, nominal, dan referensi transaksi bila tersedia.</p></Section>
    <Section title="Salah transfer atau duplikasi"><p>Jika terjadi salah transfer atau donasi ganda, hubungi kami secepatnya. Permintaan akan ditinjau secara wajar berdasarkan bukti transaksi dan ketentuan penyedia pembayaran.</p></Section>
  </LegalPage>;
}
