"use client";

import { useState, useRef, type KeyboardEvent, type FormEvent } from "react";
import { SendHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string) => void;
  busy?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Input percakapan di bagian bawah halaman.
 *
 * - Submit via tombol kirim atau Shift+Enter (Enter biasa mengirim)
 * - Disabled seluruhnya saat busy
 * - Clear setelah submit
 * - Auto-resize textarea (min 1 baris, max 5 baris)
 */
export function ChatInput({
  onSend,
  busy = false,
  placeholder = "Ketik nama atau deskripsi barang…",
  className,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = text.trim();
  const canSubmit = trimmed.length >= 3 && !busy;

  function submit() {
    if (!canSubmit) return;
    onSend(trimmed);
    setText("");
    // Kembalikan fokus ke textarea setelah submit
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter tanpa Shift → submit
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-end gap-2 rounded-xl border border-border bg-background p-2 shadow-sm",
        busy && "opacity-70",
        className,
      )}
    >
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={busy}
        rows={1}
        className={cn(
          "max-h-32 min-h-0 flex-1 resize-none border-0 bg-transparent p-1.5 text-sm shadow-none",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
        )}
        aria-label="Pesan ke HS Finder"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!canSubmit}
        aria-label="Kirim pesan"
        className="shrink-0"
      >
        <SendHorizontalIcon className="size-4" />
      </Button>
    </form>
  );
}
