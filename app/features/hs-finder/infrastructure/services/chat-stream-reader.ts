/**
 * Chat Stream Reader
 *
 * Membaca NDJSON stream dari POST /api/hs-finder/chat dan
 * mendispatch setiap event ke callback yang sesuai.
 *
 * @module features/hs-finder/infrastructure/services/chat-stream-reader
 */

import type { Recommendation, CoverageMap } from "@/app/features/hs-finder/presentation/types";

export type ChatStreamCallbacks = {
  onStep: (label: string, detail: string) => void;
  onClarification: (reason: string, questions: string[]) => void;
  onResult: (recommendations: Recommendation[], coverageMap: CoverageMap | null) => void;
  onError: (message: string, errorCode: string | null) => void;
};

function dispatchEvent(
  parsed: Record<string, unknown>,
  callbacks: ChatStreamCallbacks,
): void {
  const event = parsed.event;
  if (typeof event !== "string") return;

  switch (event) {
    case "step": {
      const label = typeof parsed.label === "string" ? parsed.label : "";
      const detail = typeof parsed.detail === "string" ? parsed.detail : "";
      callbacks.onStep(label, detail);
      break;
    }
    case "clarification": {
      const reason = typeof parsed.reason === "string" ? parsed.reason : "";
      const questions = Array.isArray(parsed.questions)
        ? parsed.questions.filter((q): q is string => typeof q === "string")
        : [];
      callbacks.onClarification(reason, questions);
      break;
    }
    case "result": {
      const rawRecs = Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [];
      const recommendations: Recommendation[] = rawRecs
        .filter(
          (r): r is Record<string, unknown> =>
            typeof r === "object" && r !== null && !Array.isArray(r),
        )
        .map((r) => ({
          hsCode: typeof r.hsCode === "string" ? r.hsCode : "",
          description: typeof r.description === "string" ? r.description : "",
          confidence:
            r.confidence === "high" || r.confidence === "medium" || r.confidence === "low"
              ? r.confidence
              : "low",
          rationale: typeof r.rationale === "string" ? r.rationale : null,
          quotedRule: typeof r.quotedRule === "string" ? r.quotedRule : null,
        }));
      const rawMap = parsed.coverageMap;
      const coverageMap: CoverageMap | null =
        rawMap &&
        typeof rawMap === "object" &&
        !Array.isArray(rawMap) &&
        typeof (rawMap as Record<string, unknown>).hasUnvalidated === "boolean"
          ? (rawMap as CoverageMap)
          : null;

      callbacks.onResult(recommendations, coverageMap);
      break;
    }
    case "error": {
      const msg =
        typeof parsed.errorMessage === "string"
          ? parsed.errorMessage
          : "Ada masalah dengan sistem AI.";
      const errorCode = typeof parsed.errorCode === "string" ? parsed.errorCode : null;
      callbacks.onError(msg, errorCode);
      break;
    }
  }
}

/**
 * Membaca response body sebagai NDJSON stream dan memanggil callbacks
 * untuk setiap event yang diterima.
 *
 * @param response - Response dari fetch ke /api/hs-finder/chat
 * @param callbacks - Handlers untuk setiap jenis event
 *
 * @example
 * const res = await fetch("/api/hs-finder/chat", { method: "POST", body: ... });
 * await readChatStream(res, {
 *   onStep: (label, detail) => console.log(label, detail),
 *   onResult: (recs, _map) => setRecommendations(recs),
 *   onClarification: (reason, questions) => showClarification(reason, questions),
 *   onError: (msg, _errorCode) => setError(msg),
 * });
 */
export async function readChatStream(
  response: Response,
  callbacks: ChatStreamCallbacks,
): Promise<void> {
  if (!response.body) {
    callbacks.onError("Respons server tidak memiliki stream.", null);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: !done });
      }

      // Proses semua baris lengkap dalam buffer
      const lines = buffer.split("\n");
      // Baris terakhir mungkin belum lengkap — simpan kembali ke buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(trimmed) as Record<string, unknown>;
        } catch {
          // Baris tidak valid — skip, jangan crash
          continue;
        }

        dispatchEvent(parsed, callbacks);
      }

      if (done) break;
    }

    // Proses sisa buffer jika ada baris terakhir tanpa newline
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim()) as Record<string, unknown>;
        dispatchEvent(parsed, callbacks);
      } catch {
        // abaikan baris tidak valid
      }
    }
  } finally {
    reader.releaseLock();
  }
}
