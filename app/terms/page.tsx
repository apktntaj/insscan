import LegalPage, { Section } from "@/app/shared/components/LegalPage";
import { createPageMetadata } from "@/app/shared/config/site-metadata";

export const metadata = createPageMetadata({
  title: "Ketentuan Layanan",
  description:
    "Ketentuan dasar penggunaan Pesisir sebagai alat bantu kepabeanan gratis.",
  path: "/terms",
});
export default function TermsPage() {
  return <LegalPage eyebrow="Pesisir" title="Ketentuan Layanan" intro="Ketentuan dasar penggunaan Pesisir sebagai alat bantu kepabeanan gratis.">
    <Section title="Sifat layanan"><p>Pesisir adalah alat bantu independen dan tidak berafiliasi dengan INSW, Direktorat Jenderal Bea dan Cukai, atau instansi pemerintah lainnya.</p></Section>
    <Section title="Bukan keputusan resmi"><p>Hasil bersifat informatif berdasarkan input dan respons yang tersedia saat pemeriksaan. Pengguna bertanggung jawab memverifikasi klasifikasi HS, regulasi, tarif, dan persyaratan resmi sebelum mengambil keputusan kepabeanan.</p></Section>
    <Section title="Penggunaan yang wajar"><p>Pengguna tidak boleh mengganggu layanan, melakukan scraping otomatis, membebani sumber data secara tidak wajar, atau menggunakan layanan untuk tindakan melanggar hukum.</p></Section>
    <Section title="Ketersediaan"><p>Layanan dapat terganggu akibat pemeliharaan, perubahan layanan pihak ketiga, atau kegagalan jaringan. Kami tidak menjamin setiap sumber eksternal selalu tersedia, lengkap, atau mutakhir.</p></Section>
    <Section title="Gratis dan donasi"><p>Fitur yang tersedia di Pesisir dapat digunakan tanpa biaya, langganan, atau paket berbayar. Donasi bersifat sukarela untuk mendukung pengembangan dan pemeliharaan layanan; donasi tidak membeli akses, fitur, maupun jaminan layanan tertentu.</p></Section>
    <Section title="Perubahan"><p>Perubahan material pada ketentuan atau cara layanan digunakan akan diberitahukan melalui aplikasi atau komunikasi yang tersedia.</p></Section>
  </LegalPage>;
}
