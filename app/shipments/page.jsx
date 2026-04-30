import ShipmentManager from "../presentation/components/features/ShipmentManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shipment Management | Pesisir",
  description: "Track and manage shipment records locally in the browser.",
};

export default function ShipmentsPage() {
  return <ShipmentManager />;
}
