"use client";

import { cn } from "@/lib/utils";
import type { Recommendation, CoverageMap } from "@/app/features/hs-finder/presentation/types";

interface RecommendationListProps {
  recommendations: Recommendation[];
  coverageMap: CoverageMap | null;
  className?: string;
}

const CONFIDENCE_LABELS: Record<Recommendation["confidence"], string> = {
  high: "Keyakinan tinggi",
  medium: "Keyakinan sedang",
  low: "Keyakinan rendah",
};

const CONFIDENCE_COLORS: Record<Recommendation["confidence"], string> = {
  high: "text-green-600 dark:text-green-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  low: "text-muted-foreground",
};

/** Format HS code 6 digit menjadi XXXX.XX, e.g. "650610" → "6506.10" */
function formatHsCode(raw: string): string {
  const cleaned = raw.replace(/\./g, "");
  return cleaned.length === 6
    ? `${cleaned.slice(0, 4)}.${cleaned.slice(4)}`
    : raw;
}

/**
 * Menampilkan daftar rekomendasi HS code hasil klasifikasi.
 * Digunakan di dalam AssistantBubble saat status "done".
 */
export function RecommendationList({
  recommendations,
  coverageMap,
  className,
}: RecommendationListProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-semibold text-foreground">Rekomendasi HS code</h3>

      <ol className="space-y-4">
        {recommendations.map((rec, index) => (
          <li key={rec.hsCode} className="border-l-2 border-border pl-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {index + 1}.&nbsp;{formatHsCode(rec.hsCode)}
              </span>
              <span className={cn("text-xs", CONFIDENCE_COLORS[rec.confidence])}>
                {CONFIDENCE_LABELS[rec.confidence]}
              </span>
            </div>

            <p className="mt-0.5 text-sm leading-relaxed text-foreground/80">
              {rec.description}
            </p>

            {rec.rationale && (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {rec.rationale}
              </p>
            )}

            {rec.quotedRule && (
              <blockquote className="mt-2 border-l border-muted-foreground/30 pl-3 text-xs leading-relaxed text-muted-foreground italic">
                "{rec.quotedRule}"
              </blockquote>
            )}
          </li>
        ))}
      </ol>

      {coverageMap?.hasUnvalidated && (
        <p className="text-xs text-muted-foreground">
          ⚠ Satu atau lebih bab HS belum tervalidasi sepenuhnya. Verifikasi dengan BTKI dan ketentuan yang berlaku.
        </p>
      )}
    </div>
  );
}
