import LegalPage, { Section } from "@/app/shared/components/LegalPage";
import { createPageMetadata } from "@/app/shared/config/site-metadata";

export const metadata = createPageMetadata({
  title: "Ketentuan Layanan",
  description:
    "Ketentuan dasar penggunaan Pesisir selama periode gratis dan Early Access berbayar.",
  path: "/terms",
});
export default function TermsPage() {
  return <LegalPage eyebrow="Pesisir" title="Ketentuan Layanan" intro="Ketentuan dasar penggunaan Pesisir selama periode gratis dan Early Access berbayar.">
    <Section title="Sifat layanan"><p>Pesisir adalah alat bantu independen dan tidak berafiliasi dengan INSW, Direktorat Jenderal Bea dan Cukai, atau instansi pemerintah lainnya.</p></Section>
    <Section title="Bukan keputusan resmi"><p>Hasil bersifat informatif berdasarkan input dan respons yang tersedia saat pemeriksaan. Pengguna bertanggung jawab memverifikasi klasifikasi HS, regulasi, tarif, dan persyaratan resmi sebelum mengambil keputusan kepabeanan.</p></Section>
    <Section title="Penggunaan yang wajar"><p>Pengguna tidak boleh mengganggu layanan, melewati pembatasan akses, membagikan akses berbayar tanpa izin, melakukan scraping otomatis, atau menggunakan layanan untuk tindakan melanggar hukum.</p></Section>
    <Section title="Ketersediaan"><p>Layanan dapat terganggu akibat pemeliharaan, perubahan layanan pihak ketiga, atau kegagalan jaringan. Kami tidak menjamin setiap sumber eksternal selalu tersedia, lengkap, atau mutakhir.</p></Section>
    <Section title="Early Access Pro"><p>Harga, masa aktif, metode pembayaran, dan aktivasi ditampilkan sebelum pembayaran. Selama Early Access, aktivasi dan perpanjangan dilakukan manual serta tidak diperpanjang otomatis.</p></Section>
    <Section title="Perubahan"><p>Perubahan material pada ketentuan atau harga akan diberitahukan melalui aplikasi atau komunikasi yang tersedia sebelum berlaku bagi periode berbayar berikutnya.</p></Section>
  </LegalPage>;
}
