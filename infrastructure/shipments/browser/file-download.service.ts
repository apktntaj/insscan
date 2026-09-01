import type { ShipmentBackupArtifact } from "@core/shipments/use-cases/export-shipment-backup";

export function downloadText(artifact: ShipmentBackupArtifact): void {
  const blob = new Blob([artifact.contents], { type: artifact.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = artifact.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
