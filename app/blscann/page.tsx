import { redirect } from "next/navigation";

/**
 * The legacy PDF viewer has been retired. Keep old bookmarks working by
 * forwarding users to the shipment workflow, which still provides Smart Fill.
 */
export default function LegacyBlScannerPage(): never {
  redirect("/shipments");
}
