import ShipmentManager from "@/app/features/shipments/presentation/components/ShipmentManager";
import { createPageMetadata } from "@/app/shared/config/site-metadata";

export const metadata = createPageMetadata({
  title: "Shipment impor laut",
  description:
    "Workspace pribadi untuk alur shipment impor laut PPJK, tahap operasional, backup lokal, dan pengingat ETA. Data hanya tersimpan pada browser/perangkat ini dan tidak tersinkron antarperangkat.",
  path: "/shipments",
  keywords: [
    "shipment impor laut",
    "PPJK",
    "bill of lading",
    "backup shipment lokal",
    "ETA kapal",
    "manajemen pengiriman",
  ],
});

export default function ShipmentsPage() {
  return <ShipmentManager />;
}
