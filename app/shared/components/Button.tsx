"use client";

import type { ComponentProps } from "react";
import { Button as ShadcnButton } from "@/components/ui/button";

type LegacyVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends Omit<ComponentProps<typeof ShadcnButton>, "variant"> {
  variant?: LegacyVariant;
}

const variantMap: Record<LegacyVariant, ComponentProps<typeof ShadcnButton>["variant"]> = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
};

export default function Button({
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return <ShadcnButton type={type} variant={variantMap[variant]} size="lg" {...props} />;
}
