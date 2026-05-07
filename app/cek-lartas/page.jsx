import CekLartasPageClient from "../presentation/components/features/CekLartasPage";

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
 * Cek Lartas Page (Server Component)
 * Metadata diekspor dari sini, konten didelegasikan ke Client Component
 * agar maintenance window check bisa menggunakan hooks.
 */
export default function CekLartasPage() {
  return <CekLartasPageClient />;
}
