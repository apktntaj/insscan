import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import { Alert as ShadcnAlert, AlertDescription } from "@/components/ui/alert";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  message: string;
  variant?: AlertVariant;
}

const icons = {
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  error: CircleAlertIcon,
};

export default function Alert({ message, variant = "info" }: AlertProps) {
  const Icon = icons[variant];
  return (
    <ShadcnAlert variant={variant === "error" ? "destructive" : "default"} aria-live="polite">
      <Icon />
      <AlertDescription>{message}</AlertDescription>
    </ShadcnAlert>
  );
}
