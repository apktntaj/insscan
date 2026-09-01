import type { Alert, RiskLevel } from "@core/shipments/use-cases/evaluate-data-quality-alerts";
import { Badge } from "@/components/ui/badge";

const labels: Record<RiskLevel, string> = { high: "Tinggi", medium: "Sedang", low: "Rendah" };

export default function AlertBadge({ alerts, highestRisk }: { alerts: readonly Alert[]; highestRisk: RiskLevel }) {
  return (
    <Badge variant={highestRisk === "high" ? "destructive" : highestRisk === "medium" ? "secondary" : "outline"}>
      Risiko {labels[highestRisk]} · {alerts.length} peringatan aktif
    </Badge>
  );
}
