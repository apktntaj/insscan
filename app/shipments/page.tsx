import ShipmentManager from "@/app/features/shipments/presentation/components/ShipmentManager";
import { createPageMetadata } from "@/app/shared/config/site-metadata";

export const metadata = createPageMetadata({
  title: "Shipments",
  description:
    "Kelola data pengiriman dalam satu dashboard. Catat nomor B/L, shipper, dan ETA. Data tersimpan di browser kamu sendiri — tidak melewati server manapun.",
  path: "/shipments",
  keywords: [
    "shipment tracking",
    "bill of lading",
    "BL tracking",
    "freight forwarder",
    "PPJK",
    "manajemen pengiriman",
    "ETA kapal",
  ],
});

export default function ShipmentsPage() {
  return <ShipmentManager />;
}
