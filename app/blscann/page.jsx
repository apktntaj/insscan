import Title from "../presentation/components/common/Title";
import BlScanner from "../presentation/components/features/BlScanner";

const PAGE_TITLE = "BL Scanner";
const PAGE_DESCRIPTION = [
    "Upload PDF Bill of Lading, lalu hover teks untuk menyalin nilai ke clipboard.",
    "Mode saat ini fokus ke viewer + hover-copy. Parsing field akan ditambahkan di fase berikutnya.",
];

export default function BlScannerPage() {
    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 pb-8 sm:space-y-8">
            <Title title={PAGE_TITLE} descs={PAGE_DESCRIPTION} />
            <BlScanner />
        </div>
    );
}
