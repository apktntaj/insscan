import { Title, CekLartasScanner } from "../presentation/components";

const PAGE_TITLE = "CEK LARTAS";
const PAGE_DESCRIPTION = [];

export const metadata = {
  title: "Cek Lartas | Pesisir Platform",
  description:
    "Cek lartas dalam jumlah besar dalam satu kali klik.",
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
