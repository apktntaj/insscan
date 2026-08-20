import HsFinderPage from "@/app/features/hs-finder/presentation/components/HsFinderPage";
import { createPageMetadata } from "@/app/shared/config/site-metadata";

export const metadata = createPageMetadata({
  title: "HS Finder",
  description:
    "Temukan kandidat HS code berdasarkan deskripsi barang dengan bantuan AI dan catatan bab Harmonized System.",
  path: "/hs-finder",
});

export default function Page() {
  return <HsFinderPage />;
}
