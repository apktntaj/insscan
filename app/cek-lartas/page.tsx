import CekLartasPageClient from "@/app/features/cek-lartas/presentation/components/CekLartasPage";
import Title from "@/app/shared/components/Title";
import { createPageMetadata } from "@/app/shared/config/site-metadata";

const PAGE_DESCRIPTION = [
  "Periksa status dan persyaratan LARTAS dari satu HS code atau invoice Excel. Hanya HS code yang dikirim; file tetap diproses di browser.",
];

export const metadata = createPageMetadata({
  title: "Cek Lartas",
  description:
    "Cek status dan persyaratan LARTAS untuk puluhan HS code sekaligus. Upload file Excel dari invoice, hasil langsung tersedia tanpa buka INSW satu per satu.",
  path: "/cek-lartas",
  keywords: ["cek lartas", "lartas impor", "HS code", "INSW", "batch HS code"],
});

/**
 * Cek Lartas Page (Server Component)
 * Metadata diekspor dari sini, konten didelegasikan ke Client Component
 * agar maintenance window check bisa menggunakan hooks.
 */
export default function CekLartasPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Title
        title="Cek LARTAS"
        descs={PAGE_DESCRIPTION}
        variant="modern"
        eyebrow="Alat kerja PPJK"
      />
      <CekLartasPageClient />
    </div>
  );
}
