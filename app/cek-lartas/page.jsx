import { Title, CekLartasScanner } from "../presentation/components";

const PAGE_TITLE = "CEK LARTAS";
const PAGE_DESCRIPTION = [];

export const metadata = {
  title: "Cek Lartas",
  description:
    "Cek status LARTAS, tarif bea masuk, PPN, dan PPh impor untuk puluhan HS code sekaligus. Upload file Excel dari invoice, hasil langsung tersedia tanpa buka INSW satu per satu.",
  keywords: [
    "cek lartas",
    "lartas impor",
    "HS code",
    "bea masuk",
    "PPN impor",
    "PPh impor",
    "INSW",
    "batch HS code",
  ],
  openGraph: {
    title: "Cek Lartas — Batch HS Code dari Excel | Pesisir",
    description:
      "Cek status LARTAS, tarif bea masuk, PPN, dan PPh impor untuk puluhan HS code sekaligus. Upload file Excel dari invoice, hasil langsung tersedia.",
    url: "https://pesisir.id/cek-lartas",
  },
  alternates: {
    canonical: "https://pesisir.id/cek-lartas",
  },
};

/**
 * Cek Lartas Page
 * @description Halaman utama untuk fitur Cek Lartas
 */
export default function CekLartasPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <Title title={PAGE_TITLE} descs={PAGE_DESCRIPTION} variant="modern" eyebrow="Pesisir" />
      <CekLartasScanner />
    </div>
  );
}
