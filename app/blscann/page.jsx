export const metadata = {
  title: "BL Scanner",
  description:
    "Ekstrak data Bill of Lading dari PDF secara otomatis. Klik untuk salin satu nilai, atau tahan Ctrl untuk menggabungkan beberapa nilai sekaligus.",
  openGraph: {
    title: "BL Scanner — Ekstrak Data Bill of Lading | Pesisir",
    description:
      "Ekstrak data Bill of Lading dari PDF secara otomatis. Klik untuk salin satu nilai, atau tahan Ctrl untuk menggabungkan beberapa nilai sekaligus.",
    url: "https://pesisir.id/blscann",
  },
  alternates: {
    canonical: "https://pesisir.id/blscann",
  },
};


import Title from "../presentation/components/common/Title";
import BlScanner from "../presentation/components/features/BlScanner";

const PAGE_TITLE = "Klik untuk Salin. Tahan Ctrl untuk Chain.";
const PAGE_DESCRIPTION = [
    "Ambil data Bill of Lading lebih cepat, minim salah ketik.",
    "Klik sekali untuk salin satu nilai. Tahan Ctrl sambil klik beberapa teks untuk menggabungkan nilai. Lepas Ctrl untuk mengakhiri chain."
];

export default function BlScannerPage() {
    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 pb-8 sm:space-y-8">
            <Title title={PAGE_TITLE} descs={PAGE_DESCRIPTION} variant="modern" eyebrow="BL Scanner" />
            <BlScanner />
        </div>
    );
}
