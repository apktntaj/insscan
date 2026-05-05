import { Title, CekLartasScanner } from "../presentation/components";

const PAGE_TITLE = "CEK LARTAS";
const PAGE_DESCRIPTION = [];

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
