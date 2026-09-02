"use client";

import { CheckIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { ThinkingStep } from "@/app/features/hs-finder/presentation/types";

interface ThinkingStepsProps {
  steps: ThinkingStep[];
  /** Jika true dan semua step done, tampilkan ringkasan satu baris */
  collapsed?: boolean;
  className?: string;
}

/**
 * Menampilkan daftar langkah berpikir asisten secara bertahap.
 *
 * Step yang belum done → spinner + label (detail kosong atau sedang diisi)
 * Step yang sudah done → centang + label + detail
 * Saat semua done dan collapsed=true → satu baris ringkas
 */
export function ThinkingSteps({ steps, collapsed = false, className }: ThinkingStepsProps) {
  if (steps.length === 0) return null;

  const allDone = steps.every((s) => s.done);

  // Mode ringkas: semua selesai dan parent minta collapse
  if (allDone && collapsed) {
    const chapterDetail = steps.find((s) => s.label.includes("bab") && s.detail)?.detail;
    const summary = chapterDetail
      ? `Dianalisis dari ${chapterDetail.replace("→ ", "")}`
      : "Analisis selesai";

    return (
      <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <CheckIcon className="size-3 shrink-0 text-green-500" aria-hidden />
        {summary}
      </p>
    );
  }

  return (
    <ol className={cn("flex flex-col gap-1.5", className)} aria-label="Langkah analisis">
      {steps.map((step, index) => (
        <li
          key={index}
          className="flex items-start gap-2 text-sm"
        >
          {/* Ikon status */}
          <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
            {step.done ? (
              <CheckIcon className="size-3.5 text-green-500" />
            ) : (
              <Spinner className="size-3.5 text-muted-foreground" />
            )}
          </span>

          {/* Label + detail */}
          <span className="leading-snug">
            <span
              className={cn(
                "text-foreground",
                step.done ? "opacity-70" : "font-medium",
              )}
            >
              {step.label}
            </span>
            {step.detail && (
              <span className="ml-1.5 text-xs text-muted-foreground">{step.detail}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
