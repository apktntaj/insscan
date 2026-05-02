import { Title, HsCodeScanner } from "../presentation/components";

const PAGE_TITLE = "INScann";
const PAGE_DESCRIPTION = [
  "Pilih mode Single Input untuk cek satu HS code dengan tampilan card yang mudah dibaca.",
  "Gunakan mode File / Multiple untuk memproses banyak HS code dengan hasil tabel LARTAS.",
];

/**
 * INScann Page
 * @description Main page for INScann feature
 */
export default function InscannPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8 sm:space-y-8">
      <Title title={PAGE_TITLE} descs={PAGE_DESCRIPTION} variant="modern" eyebrow="INScann" />
      <HsCodeScanner />
    </div>
  );
}
