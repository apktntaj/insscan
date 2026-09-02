"use client";

import { useState, useCallback, useId } from "react";
import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConversationThread } from "./chat/ConversationThread";
import { ChatInput } from "./chat/ChatInput";
import { readChatStream } from "@/app/features/hs-finder/infrastructure/services/chat-stream-reader";
import type {
  Message,
  UserMessage,
  AssistantMessage,
  ThinkingStep,
  Recommendation,
  CoverageMap,
} from "@/app/features/hs-finder/presentation/types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function createUserMessage(id: string, text: string): UserMessage {
  return { id, role: "user", text };
}

function createAssistantMessage(
  id: string,
  retryRequest: Record<string, unknown>,
): AssistantMessage {
  return {
    id,
    role: "assistant",
    thinking: [],
    text: null,
    recommendations: null,
    clarificationReason: null,
    questions: [],
    coverageMap: null,
    retryRequest,
    errorCode: null,
    status: "thinking",
  };
}

type SendMessageOptions = {
  retryRequest?: Record<string, unknown>;
  replaceLastAssistant?: boolean;
};

/**
 * Update AssistantMessage terakhir dalam daftar pesan.
 * Gunakan updater function untuk menghindari stale state.
 */
function updateLastAssistant(
  messages: Message[],
  updater: (msg: AssistantMessage) => AssistantMessage,
): Message[] {
  const lastIndex = messages.length - 1;
  const last = messages[lastIndex];
  if (!last || last.role !== "assistant") return messages;
  return [...messages.slice(0, lastIndex), updater(last)];
}

/**
 * Merge step baru ke daftar thinking steps.
 *
 * Jika label sudah ada dan step sebelumnya belum done → update detail + done=true.
 * Jika label sudah ada dan sudah done → tambah step baru (step berulang dengan detail berbeda).
 * Jika label belum ada → append step baru dengan done=false.
 *
 * Pattern dari server:
 *   1. emit step { label: "X", detail: "" }         → step X mulai (loading)
 *   2. emit step { label: "X", detail: "hasil..." } → step X selesai (detail diisi)
 */
function mergeThinkingStep(steps: ThinkingStep[], label: string, detail: string): ThinkingStep[] {
  // Cari step dengan label yang sama yang belum selesai
  const pendingIndex = [...steps].reverse().findIndex((s) => s.label === label && !s.done);
  if (pendingIndex !== -1) {
    const realIndex = steps.length - 1 - pendingIndex;
    return steps.map((s, i) =>
      i === realIndex ? { ...s, detail, done: true } : s,
    );
  }
  // Tidak ada yang pending — tambah step baru
  return [...steps, { label, detail, done: false }];
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function HsFinderPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const idCounter = useId();
  // Gunakan counter sederhana sebagai suffix ID agar unik per pesan
  const [counter, setCounter] = useState(0);

  function nextId() {
    const id = `${idCounter}-${counter}`;
    setCounter((c) => c + 1);
    return id;
  }

  // Pesan asisten terakhir (untuk deteksi klarifikasi)
  const lastMessage = messages.at(-1);
  const isWaitingClarification =
    !busy &&
    lastMessage?.role === "assistant" &&
    lastMessage.status === "clarifying";

  // ─────────────────────────────────────────────
  // sendMessage — satu-satunya fungsi yang user trigger
  // ─────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string, options: SendMessageOptions = {}) => {
      if (busy) return;

      // Susun context klarifikasi jika ini jawaban dari pertanyaan asisten
      let requestBody = options.retryRequest ?? { message: text };
      if (!options.retryRequest && isWaitingClarification && lastMessage?.role === "assistant") {
        const clarMsg = lastMessage as AssistantMessage;
        // Ambil teks pesan user sebelum pesan asisten yang bertanya
        const prevUserMsg = [...messages]
          .reverse()
          .find((m, i) => i > 0 && m.role === "user") as UserMessage | undefined;

        if (clarMsg.questions.length > 0 && prevUserMsg) {
          // Pasangkan jawaban user ke pertanyaan yang ada
          const answers = clarMsg.questions.slice(0, 2).map((question, i) => ({
            question,
            // Jika ada dua pertanyaan, jawaban pertama untuk pertanyaan pertama
            // Dalam desain ini user mengetik satu blok teks — kita kirim sebagai jawaban pertanyaan pertama
            answer: i === 0 ? text : "",
          })).filter((a) => a.answer);

          requestBody = {
            message: prevUserMsg.text,
            context: {
              previousMessage: prevUserMsg.text,
              clarificationReason: clarMsg.clarificationReason ?? "",
              answers,
            },
          };
        }
      }

      // Tambah pesan user ke thread
      const userMsgId = `u-${Date.now()}`;
      const asstMsgId = `a-${Date.now() + 1}`;

      setMessages((prev) => options.replaceLastAssistant
        ? updateLastAssistant(prev, (message) => createAssistantMessage(message.id, requestBody))
        : [
            ...prev,
            createUserMessage(userMsgId, text),
            createAssistantMessage(asstMsgId, requestBody),
          ]);
      setBusy(true);

      try {
        const response = await fetch("/api/hs-finder/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        await readChatStream(response, {
          onStep(label: string, detail: string) {
            setMessages((prev) =>
              updateLastAssistant(prev, (msg) => ({
                ...msg,
                thinking: mergeThinkingStep(msg.thinking, label, detail),
              })),
            );
          },

          onClarification(reason: string, questions: string[]) {
            setMessages((prev) =>
              updateLastAssistant(prev, (msg) => ({
                ...msg,
                // Tandai semua thinking steps sebagai done
                thinking: msg.thinking.map((s) => ({ ...s, done: true })),
                text: reason,
                clarificationReason: reason,
                questions,
                status: "clarifying",
              })),
            );
          },

          onResult(recommendations: Recommendation[], coverageMap: CoverageMap | null) {
            setMessages((prev) =>
              updateLastAssistant(prev, (msg) => ({
                ...msg,
                thinking: msg.thinking.map((s) => ({ ...s, done: true })),
                recommendations,
                coverageMap,
                status: "done",
              })),
            );
          },

          onError(errorMessage: string, errorCode: string | null) {
            setMessages((prev) =>
              updateLastAssistant(prev, (msg) => ({
                ...msg,
                thinking: msg.thinking.map((s) => ({ ...s, done: true })),
                text: errorMessage,
                errorCode,
                status: "error",
              })),
            );
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
        setMessages((prev) =>
          updateLastAssistant(prev, (m) => ({
            ...m,
            thinking: m.thinking.map((s) => ({ ...s, done: true })),
            text: msg,
            errorCode: null,
            status: "error",
          })),
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, isWaitingClarification, lastMessage, messages],
  );

  function reset() {
    setMessages([]);
    setBusy(false);
  }

  function retry(message: AssistantMessage) {
    const retryRequest = message.retryRequest;
    const text = retryRequest?.message;
    if (!retryRequest || typeof text !== "string") return;

    void sendMessage(text, {
      retryRequest,
      replaceLastAssistant: true,
    });
  }

  const lastDone =
    lastMessage?.role === "assistant" && lastMessage.status === "done";

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      {/* Header — hilang saat ada pesan agar layar lebih bersih */}
      {messages.length === 0 && (
        <header className="pb-2">
          <Badge variant="secondary">Asisten klasifikasi</Badge>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            HS Finder
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Ketik nama atau deskripsi barang. HS Finder akan menganalisis dan
            menampilkan rekomendasi HS code beserta dasar hukumnya.
          </p>
        </header>
      )}

      {/* Thread percakapan */}
      <ConversationThread messages={messages} onRetry={retry} />

      {/* Tombol reset setelah percakapan selesai */}
      {lastDone && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={reset}>
            Mulai percakapan baru
          </Button>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        busy={busy}
        placeholder={
          isWaitingClarification
            ? "Ketik jawaban Anda…"
            : "Ketik nama atau deskripsi barang…"
        }
        className="sticky bottom-4"
      />

      {/* Disclaimer */}
      <Alert className="mt-2">
        <InfoIcon />
        <AlertDescription>
          Hasil merupakan kandidat berbasis AI, bukan penetapan resmi. Verifikasi
          dengan BTKI dan ketentuan yang berlaku.
        </AlertDescription>
      </Alert>
    </section>
  );
}
