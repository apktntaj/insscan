"use client";

import { cn } from "@/lib/utils";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThinkingSteps } from "./ThinkingSteps";
import { RecommendationList } from "./RecommendationList";
import type { AssistantMessage } from "@/app/features/hs-finder/presentation/types";

interface AssistantBubbleProps {
  message: AssistantMessage;
  onRetry?: (message: AssistantMessage) => void;
  className?: string;
}

/**
 * Render satu pesan dari asisten.
 *
 * Urutan render:
 * 1. ThinkingSteps  — selalu tampil jika ada, collapse saat done
 * 2. Teks narasi    — saat status clarifying atau error
 * 3. Pertanyaan     — saat status clarifying
 * 4. Rekomendasi    — saat status done
 */
export function AssistantBubble({ message, onRetry, className }: AssistantBubbleProps) {
  const { thinking, text, status, recommendations, questions, coverageMap } = message;
  const allThinkingDone = thinking.length > 0 && thinking.every((s) => s.done);
  const canRetry =
    status === "error" &&
    (message.errorCode === null ||
      message.errorCode === "GEMINI_TIMEOUT" ||
      message.errorCode === "GEMINI_UNAVAILABLE");

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Label asisten */}
      <span className="text-xs font-medium text-muted-foreground">HS Finder</span>

      <div className="flex flex-col gap-4 rounded-xl rounded-tl-none border border-border bg-card p-4 shadow-sm">
        {/* Thinking steps */}
        {thinking.length > 0 && (
          <ThinkingSteps
            steps={thinking}
            collapsed={allThinkingDone && status !== "error"}
          />
        )}

        {/* Teks narasi: klarifikasi atau error */}
        {text && (
          <p
            className={cn(
              "text-sm leading-relaxed",
              status === "error" ? "text-destructive" : "text-foreground",
            )}
          >
            {text}
          </p>
        )}

        {canRetry && onRetry && (
          <div>
            <Button variant="outline" size="sm" onClick={() => onRetry(message)}>
              <RefreshCwIcon data-icon="inline-start" />
              Coba lagi
            </Button>
          </div>
        )}

        {/* Pertanyaan klarifikasi */}
        {status === "clarifying" && questions.length > 0 && (
          <ul className="space-y-1.5 text-sm text-foreground">
            {questions.map((q, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 font-medium text-muted-foreground">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Rekomendasi */}
        {status === "done" && recommendations && recommendations.length > 0 && (
          <RecommendationList
            recommendations={recommendations}
            coverageMap={coverageMap}
          />
        )}

        {/* Sedang menunggu — tampilkan indikator minimal jika thinking kosong */}
        {status === "thinking" && thinking.length === 0 && (
          <p className="text-sm text-muted-foreground animate-pulse">Menganalisis…</p>
        )}
      </div>
    </div>
  );
}
