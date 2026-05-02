import { Title, CekLartasScanner } from "../presentation/components";

const PAGE_TITLE = "CEK LARTAS";
const PAGE_DESCRIPTION = [
  "Pilih mode Input Tunggal untuk cek satu HS code dengan tampilan card yang mudah dibaca.",
  "Gunakan mode Input File / Banyak HS Code untuk memproses banyak HS code dengan hasil tabel matriks LARTAS.",
];

/**
 * Cek Lartas Page
 * @description Halaman utama untuk fitur Cek Lartas
 */
export default function CekLartasPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8 sm:space-y-8">
      <Title title={PAGE_TITLE} descs={PAGE_DESCRIPTION} variant="modern" eyebrow="Pesisir" />
      <CekLartasScanner />
    </div>
  );
}
