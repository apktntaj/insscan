"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AssistantBubble } from "./AssistantBubble";
import type { AssistantMessage, Message } from "@/app/features/hs-finder/presentation/types";

interface ConversationThreadProps {
  messages: Message[];
  onRetry?: (message: AssistantMessage) => void;
  className?: string;
}

/**
 * Render seluruh thread percakapan dari atas ke bawah.
 * Scroll otomatis ke bawah setiap kali pesan baru ditambahkan.
 *
 * - UserMessage    → bubble rata kanan, bg-muted
 * - AssistantMessage → AssistantBubble rata kiri
 */
export function ConversationThread({ messages, onRetry, className }: ConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll ke bawah setiap kali daftar pesan berubah
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-6", className)} role="log" aria-live="polite" aria-label="Percakapan">
      {messages.map((message, index) => {
        if (message.role === "user") {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-xl rounded-tr-none bg-muted px-4 py-3">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {message.text}
                </p>
              </div>
            </div>
          );
        }

        return (
          <AssistantBubble
            key={message.id}
            message={message}
            onRetry={index === messages.length - 1 ? onRetry : undefined}
            className="max-w-[92%]"
          />
        );
      })}

      {/* Anchor untuk auto-scroll */}
      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
