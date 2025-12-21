import { Title, HsCodeScanner } from "../presentation/components";

const PAGE_TITLE = "INSScan";
const PAGE_DESCRIPTION = [
  "AI-powered invoice scanner for instant HS code lookup and",
  "retrieve realtime tax & restriction goods regulation from Indonesia National Single Window (INSW) site.",
];

/**
 * INSScan Page
 * @description Main page for HS Code scanning feature
 */
export default function InscannPage() {
  return (
    <div className="container mx-auto px-4">
      <Title title={PAGE_TITLE} descs={PAGE_DESCRIPTION} />
      <HsCodeScanner />
    </div>
  );
}
