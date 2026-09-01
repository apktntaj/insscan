import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardWidget({ title, value, active, icon, onClick }: { title: string; value: number; active: boolean; icon: ReactNode; onClick: () => void }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-sm">{title}</CardTitle>{icon}</CardHeader>
      <CardContent><Button type="button" variant={active ? "default" : "ghost"} className="w-full justify-start" onClick={onClick} aria-pressed={active}>{value}</Button></CardContent>
    </Card>
  );
}
