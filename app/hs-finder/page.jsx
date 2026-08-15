import HsFinderPage from "../presentation/components/features/HsFinderPage";

export const metadata = {
  title: "HS Finder",
  description:
    "Temukan kandidat HS code berdasarkan deskripsi atau foto barang dengan bantuan AI dan catatan bab Harmonized System.",
  alternates: { canonical: "https://pesisir.id/hs-finder" },
};

export default function Page() {
  return <HsFinderPage />;
}
