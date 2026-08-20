import CekLartasPageClient from "@/app/features/cek-lartas/presentation/components/CekLartasPage";

export const metadata = {
  title: "Cek Lartas",
  description:
    "Cek status dan persyaratan LARTAS untuk puluhan HS code sekaligus. Upload file Excel dari invoice, hasil langsung tersedia tanpa buka INSW satu per satu.",
  keywords: [
    "cek lartas",
    "lartas impor",
    "HS code",
    "INSW",
    "batch HS code",
  ],
  openGraph: {
    title: "Cek Lartas — Batch HS Code dari Excel | Pesisir",
    description:
      "Cek status dan persyaratan LARTAS untuk puluhan HS code sekaligus. Upload file Excel dari invoice, hasil langsung tersedia.",
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
