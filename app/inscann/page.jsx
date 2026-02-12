import { Title, HsCodeScanner } from "../presentation/components";

const PAGE_TITLE = "Pesisir";
const PAGE_DESCRIPTION = [
  "Upload file HS code lalu tarik data tarif, pajak, dan regulasi LARTAS secara langsung.",
  "Tampilan hasil dibuat ringkas per card agar nyaman dipindai saat volume data besar.",
];

/**
 * Pesisir Page
 * @description Main page for HS Code scanning feature
 */
export default function InscannPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8 sm:space-y-8">
      <Title title={PAGE_TITLE} descs={PAGE_DESCRIPTION} />
      <HsCodeScanner />
    </div>
  );
}
