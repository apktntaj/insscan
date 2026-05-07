import ShipmentManager from "../presentation/components/features/ShipmentManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shipments",
  description:
    "Kelola data pengiriman dalam satu dashboard. Catat nomor B/L, shipper, dan ETA. Data tersimpan di browser kamu sendiri — tidak melewati server manapun.",
  keywords: [
    "shipment tracking",
    "bill of lading",
    "BL tracking",
    "freight forwarder",
    "PPJK",
    "manajemen pengiriman",
    "ETA kapal",
  ],
  openGraph: {
    title: "Shipments — Dashboard Pengiriman | Pesisir",
    description:
      "Kelola data pengiriman dalam satu dashboard. Catat nomor B/L, shipper, dan ETA. Data tersimpan di browser kamu sendiri — tidak melewati server manapun.",
    url: "https://pesisir.id/shipments",
  },
  alternates: {
    canonical: "https://pesisir.id/shipments",
  },
};

export default function ShipmentsPage() {
  return <ShipmentManager />;
}
