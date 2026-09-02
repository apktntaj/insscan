# HS Finder — Task List v2

Urutan dikerjakan dari server ke client. Setiap task bisa diverifikasi sendiri.

---

## Fase 1 — Route streaming baru

- [x] **T-01** Buat `app/api/hs-finder/chat/route.ts`

  Route `POST /api/hs-finder/chat` yang menjalankan pipeline klasifikasi dan
  mengemit events via NDJSON streaming.

  Pipeline dan events yang harus dikirim:

  ```
  identifyCandidateChapters()
    → emit step "Mengidentifikasi bab HS yang relevan"
    → emit step detail: "→ Bab XX, Bab YY"

  loadHs6Context()
    → emit step "Memuat catatan bab"
    → emit step detail: "Bab XX ✓  Bab YY ✓"

  classifyWithNotes()
    → emit step "Menerapkan aturan klasifikasi"
    → emit step detail: kutipan aturan dari bab yang dipilih (ambil dari
      recommendations[0].quotedRule jika ada)

  jika needs_clarification:
    → emit "clarification" { reason, questions }

  jika recommendations:
    → emit step "Selesai"
    → emit "result" { recommendations, coverageMap }

  jika error di mana pun:
    → emit "error" { errorMessage }
  ```

  Request body:
  ```ts
  {
    message: string;
    context?: {
      previousMessage: string;
      clarificationReason: string;
      answers: { question: string; answer: string }[];
    };
  }
  ```

  Gunakan dependency yang sama dengan `/api/hs-finder/route.ts`:
  `createClassificationKnowledgeService`, `createHsFinderGeminiService`,
  `createFindHsCodeUseCase`. Wire di module level (bukan per-request).

  Tidak perlu memanggil `analyze-product-facts`. Pipeline langsung ke
  `identifyCandidateChapters` + `classifyWithNotes`.

  Untuk klarifikasi putaran kedua: gabungkan `context.previousMessage` dan
  `context.answers` ke dalam teks deskripsi sebelum dikirim ke use case
  (pola yang sama dengan `clarificationAnswers` di `find-hs-code.ts`).

  _Verifikasi: `curl -X POST /api/hs-finder/chat -d '{"message":"helm motor"}'`
  menghasilkan stream NDJSON dengan events step dan result._

---

## Fase 2 — Model data dan helper client

- [x] **T-02** Buat `app/features/hs-finder/presentation/types.ts`

  Definisi type untuk model percakapan UI. Tidak ada logika, hanya type:

  ```ts
  export type ThinkingStep = {
    label: string;
    detail: string;
    done: boolean;
  };

  export type Recommendation = {
    hsCode: string;
    description: string;
    confidence: "high" | "medium" | "low";
    rationale: string | null;
    quotedRule: string | null;
  };

  export type UserMessage = {
    id: string;
    role: "user";
    text: string;
  };

  export type AssistantMessage = {
    id: string;
    role: "assistant";
    thinking: ThinkingStep[];
    text: string | null;
    recommendations: Recommendation[] | null;
    clarificationReason: string | null;
    questions: string[];
    coverageMap: { hasUnvalidated: boolean } | null;
    status: "thinking" | "clarifying" | "done" | "error";
  };

  export type Message = UserMessage | AssistantMessage;
  ```

- [x] **T-03** Buat `app/features/hs-finder/infrastructure/services/chat-stream-reader.ts`

  Fungsi yang membaca NDJSON stream dari `/api/hs-finder/chat` dan memanggil
  callbacks untuk setiap event.

  ```ts
  type ChatStreamCallbacks = {
    onStep: (label: string, detail: string) => void;
    onClarification: (reason: string, questions: string[]) => void;
    onResult: (recommendations: Recommendation[], coverageMap: unknown) => void;
    onError: (message: string) => void;
  };

  export async function readChatStream(
    response: Response,
    callbacks: ChatStreamCallbacks,
  ): Promise<void>
  ```

  Baca `response.body` sebagai `ReadableStream<Uint8Array>`, decode baris per
  baris, parse JSON, dispatch ke callback yang sesuai.

  _Verifikasi: unit test dengan mock ReadableStream yang emit beberapa events,
  pastikan callbacks dipanggil dalam urutan yang benar._

---

## Fase 3 — Komponen UI

- [x] **T-04** Buat `app/features/hs-finder/presentation/components/chat/ThinkingSteps.tsx`

  Props: `steps: ThinkingStep[]`, `collapsed?: boolean`

  - Render setiap step sebagai satu baris: ikon + label + detail
  - Step belum `done`: spinner kecil
  - Step `done`: ikon centang kecil
  - Saat semua step `done` dan `collapsed === true`: satu baris ringkas

- [x] **T-05** Buat `app/features/hs-finder/presentation/components/chat/RecommendationList.tsx`

  Props: `recommendations: Recommendation[]`, `coverageMap: { hasUnvalidated: boolean } | null`

  Ambil logika render dari `ResultPanel.tsx` yang sudah ada. Tanpa tombol
  "Cari ulang". Jika `coverageMap.hasUnvalidated === true`, tampilkan catatan
  kecil di bawah.

- [x] **T-06** Buat `app/features/hs-finder/presentation/components/chat/AssistantBubble.tsx`

  Props: `message: AssistantMessage`

  Urutan render:
  1. `ThinkingSteps` (jika `thinking.length > 0`)
  2. `message.text` sebagai paragraf (untuk clarifying dan error)
  3. Pertanyaan klarifikasi sebagai daftar (jika `status === "clarifying"`)
  4. `RecommendationList` (jika `status === "done"`)

- [x] **T-07** Buat `app/features/hs-finder/presentation/components/chat/ConversationThread.tsx`

  Props: `messages: Message[]`

  - `UserMessage` → bubble rata kanan, `bg-muted`
  - `AssistantMessage` → `<AssistantBubble>` rata kiri
  - Pure render, tidak ada state

- [x] **T-08** Buat `app/features/hs-finder/presentation/components/chat/ChatInput.tsx`

  Props: `onSend: (text: string) => void`, `busy: boolean`, `placeholder?: string`

  - Input satu baris + tombol kirim
  - Disabled seluruhnya saat `busy === true`
  - Submit via Enter atau klik tombol
  - Clear setelah submit
  - Placeholder default: "Ketik nama atau deskripsi barang…"

---

## Fase 4 — Tulis ulang HsFinderPage

- [x] **T-09** Tulis ulang `app/features/hs-finder/presentation/components/HsFinderPage.tsx`

  State yang disimpan:
  ```ts
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  ```

  Fungsi utama `sendMessage(text: string)`:
  1. Tambah `UserMessage` ke `messages`
  2. Tambah `AssistantMessage` awal `{ status: "thinking", thinking: [] }`
  3. Deteksi klarifikasi: jika pesan terakhir sebelumnya `status === "clarifying"`,
     susun `context` dari data klarifikasi tersebut
  4. `POST /api/hs-finder/chat`
  5. Panggil `readChatStream` — setiap callback update `AssistantMessage` terakhir
     via `setMessages` (gunakan `id` untuk menemukan pesan yang tepat)

  `isWaitingClarification` = pesan terakhir adalah `AssistantMessage` dengan
  `status === "clarifying"` dan `busy === false`.

  Render:
  ```tsx
  <section>
    <header>...</header>
    <ConversationThread messages={messages} />
    {lastMessageDone && (
      <button onClick={reset}>Mulai percakapan baru</button>
    )}
    <ChatInput
      onSend={sendMessage}
      busy={busy}
      placeholder={isWaitingClarification ? "Ketik jawaban Anda…" : undefined}
    />
  </section>
  ```

  _Verifikasi manual: ketik "helm motor" → lihat thinking steps muncul satu
  per satu → lihat rekomendasi muncul saat selesai._

---

## Fase 5 — Bersih-bersih

- [x] **T-10** Hapus komponen yang tidak dipakai (setelah T-09 selesai):
  - `details/LoadingPanel.tsx`
  - `details/ClarificationPanel.tsx`
  - `details/ProductFactsPanel.tsx`
  - `details/TextInputPanel.tsx`
  - `details/ResultPanel.tsx`

  `details/PhotoInputPanel.tsx` ditahan — akan diintegrasikan ke `ChatInput`
  di iterasi berikutnya.

- [ ] **T-11** Verifikasi akhir:
  - `npm test` — semua test hijau
  - `npm run build` — tidak ada error TypeScript baru
  - Smoke test manual: alur normal + alur klarifikasi

---

## Urutan dikerjakan

```
T-01                    route baru — bisa diuji dengan curl lebih dulu
T-02                    types — prereq untuk semua komponen
T-03                    stream reader — prereq untuk T-09
T-04 → T-05             komponen daun — tidak bergantung satu sama lain
T-06                    depends: T-04, T-05
T-07                    depends: T-06
T-08                    bisa paralel dengan T-04..T-07
T-09                    depends: T-02, T-03, T-07, T-08
T-10 → T-11             cleanup dan verifikasi terakhir
```
