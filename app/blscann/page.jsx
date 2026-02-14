import Title from "../presentation/components/common/Title";
import BlScanner from "../presentation/components/features/BlScanner";

const PAGE_TITLE = "Klik lalu salin.";
const PAGE_DESCRIPTION = [
    "Kurangi salah ketik saat input data Bill of Lading.",
    "Cukup hover dan salin langsung ke clipboard."
];

export default function BlScannerPage() {
    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 pb-8 sm:space-y-8">
            <Title title={PAGE_TITLE} descs={PAGE_DESCRIPTION} />
            <BlScanner />
        </div>
    );
}
