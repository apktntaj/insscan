# HS Finder — Redesign v2

_Ditulis: 2026-09-01_

## Visi

HS Finder adalah asisten klasifikasi berbasis percakapan. User mengetik nama atau
deskripsi barang — HS Finder membalas. Jika deskripsi belum cukup, HS Finder
bertanya balik. Jika sudah cukup, HS Finder menampilkan rekomendasi HS code
beserta alur berpikirnya secara transparan.

Tidak ada form. Tidak ada tombol "Konfirmasi fakta". Tidak ada panel yang
muncul-dan-hilang. Yang ada hanya satu thread percakapan yang tumbuh ke bawah.

---

## Tampilan target

```
┌─────────────────────────────────────────────────────────┐
│  HS Finder                                              │
│  Asisten klasifikasi HS code                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ╭──────────────────────────────╮                       │
│  │ Helm sepeda motor full face  │  ← pesan user         │
│  ╰──────────────────────────────╯                       │
│                                                         │
│  ▼ Sedang menganalisis bab HS yang relevan…             │
│                                                         │
│  ▼ Memuat catatan bab 65 dan 87…                        │
│                                                         │
│  HS Finder                                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Helm tersebut kemungkinan masuk Bab 65 atau 87.  │   │
│  │ Apakah helm ini digunakan khusus untuk kendaraan  │   │
│  │ bermotor, atau juga untuk olahraga lain?          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ╭────────────────────────────────────────────────╮     │
│  │ Khusus motor, bukan sepeda atau olahraga lain  │     │
│  ╰────────────────────────────────────────────────╯     │
│                                                         │
│  HS Finder                                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 🔍 Mengidentifikasi bab kandidat                 │   │
│  │    → Bab 65 (Tutup kepala), Bab 87 (Kendaraan)  │   │
│  │                                                  │   │
│  │ 📖 Memuat catatan bab                            │   │
│  │    → Bab 65 ✓  Bab 87 ✓                         │   │
│  │                                                  │   │
│  │ ⚖️  Menerapkan aturan klasifikasi                │   │
│  │    Catatan Bab 65: "...mencakup helm pengaman     │   │
│  │    untuk semua jenis..."                          │   │
│  │    Catatan Bab 87: "tidak termasuk tutup kepala  │   │
│  │    pos 65.06..."                                  │   │
│  │                                                  │   │
│  │ Rekomendasi                                      │   │
│  │ ━━━━━━━━━━━                                      │   │
│  │ 1.  6506.10  Keyakinan tinggi                    │   │
│  │     Helm pengaman                                │   │
│  │     Helm motor full face masuk pos ini berdasar  │   │
│  │     Catatan Bab 65 yang mencakup semua helm...   │   │
│  │                                                  │   │
│  │ 2.  8714.99  Keyakinan rendah                    │   │
│  │     Bagian dan aksesori kendaraan bermotor       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Ketik nama atau deskripsi barang…          [Kirim] │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Model data percakapan

Thread percakapan adalah array pesan yang tumbuh ke bawah.
Setiap pesan punya `role` dan `content`.

```ts
type MessageRole = "user" | "assistant";

type UserMessage = {
  id: string;
  role: "user";
  text: string;
};

type ThinkingStep = {
  label: string;        // "Mengidentifikasi bab kandidat"
  detail: string;       // "→ Bab 65, Bab 87"
  done: boolean;
};

type AssistantMessage = {
  id: string;
  role: "assistant";
  // Pesan biasa (pertanyaan klarifikasi atau pesan error)
  text?: string;
  // Proses berpikir — muncul bertahap saat streaming
  thinking?: ThinkingStep[];
  // Hasil akhir
  recommendations?: Recommendation[];
  // Status render
  status: "thinking" | "clarifying" | "done" | "error";
};

type Message = UserMessage | AssistantMessage;
```

---

## State utama (minimal)

`HsFinderPage` hanya perlu memegang dua hal:

```ts
interface HsFinderState {
  messages: Message[];
  busy: boolean;
}
```

Tidak ada `factsAnalysis`, tidak ada `session.status` yang kompleks.
Status percakapan bisa dibaca dari pesan terakhir saja:
- Pesan terakhir `assistant` dengan `status: "clarifying"` → user harus menjawab
- Pesan terakhir `assistant` dengan `status: "done"` → percakapan selesai
- `busy: true` → sedang menunggu respons

Setiap kali user kirim pesan, satu `AssistantMessage` baru ditambahkan dengan
`status: "thinking"` dan `thinking: []`. Steps diisi bertahap via streaming.

---

## Alur satu putaran

```
User kirim teks
  │
  ├─ Tambah UserMessage ke thread
  ├─ Tambah AssistantMessage { status: "thinking", thinking: [] }
  │
  ├─ POST /api/hs-finder/chat  (route baru, streaming)
  │     │
  │     ├─ stream event: "step" { label, detail }
  │     │     → update thinking steps di pesan terakhir
  │     │
  │     ├─ stream event: "clarification" { reason, questions }
  │     │     → update pesan: status = "clarifying", text = pertanyaan
  │     │
  │     └─ stream event: "result" { recommendations, coverageMap }
  │           → update pesan: status = "done", recommendations = [...]
  │
  └─ busy = false
```

Saat user menjawab pertanyaan klarifikasi, pesan jawaban dikirim sebagai
`UserMessage` biasa dan putaran baru dimulai. Context percakapan dikirim
kembali ke server dalam bentuk ringkas (bukan seluruh thread).

---

## API baru: `POST /api/hs-finder/chat`

Route ini menggantikan alur `find` di route lama untuk UI chat. Route lama
(`/api/hs-finder`) tetap ada — tidak dihapus.

### Request body

```ts
{
  // Pesan user saat ini
  message: string;

  // Context putaran sebelumnya (opsional, untuk klarifikasi)
  // Hanya dikirim jika ada jawaban klarifikasi
  context?: {
    previousMessage: string;    // Pesan user sebelumnya
    clarificationReason: string;
    answers: ClarificationAnswer[];
  };
}
```

### Response: NDJSON streaming

Setiap baris adalah satu event JSON:

```jsonc
// Proses berpikir — dikirim satu per satu saat pipeline berjalan
{ "event": "step", "label": "Mengidentifikasi bab kandidat", "detail": "Bab 65, Bab 87" }
{ "event": "step", "label": "Memuat catatan bab", "detail": "Bab 65 ✓  Bab 87 ✓" }
{ "event": "step", "label": "Menerapkan aturan klasifikasi", "detail": "" }

// Perlu klarifikasi
{ "event": "clarification", "reason": "...", "questions": ["pertanyaan 1", "pertanyaan 2"] }

// Hasil akhir
{ "event": "result", "recommendations": [...], "coverageMap": {...} }

// Error
{ "event": "error", "errorMessage": "..." }
```

Tidak ada batch — setiap event dikirim segera saat tersedia.
Client membaca stream line-by-line dan update UI langsung.

### Implementasi server (pipeline)

```
1. Identifikasi bab kandidat (identifyCandidateChapters)
   → emit step "Mengidentifikasi bab HS yang relevan"
   → emit step dengan detail bab yang ditemukan

2. Muat catatan bab (loadHs6Context)
   → emit step "Memuat catatan bab"
   → emit step dengan status tiap bab (✓ atau ✗)

3. Klasifikasi (classifyWithNotes)
   → emit step "Menerapkan aturan klasifikasi"
   → emit step dengan kutipan aturan yang dipakai (dari reasoningPath)

4a. Jika needs_clarification:
    → emit "clarification"

4b. Jika recommendations:
    → emit step "Selesai"
    → emit "result"
```

Server **tidak** memanggil `analyze-product-facts` secara terpisah. Fase
pengumpulan fakta digantikan oleh loop percakapan itu sendiri — jika informasi
kurang, Gemini akan meminta klarifikasi melalui mekanisme yang sudah ada di
`classifyWithNotes`.

---

## Komponen UI baru

### `ConversationThread.tsx`

Render array `Message[]` dari atas ke bawah. Tidak ada state sendiri.

```tsx
// Tata letak bubble:
// User:     rata kanan, background muted
// Assistant: rata kiri, tanpa background khusus

// Untuk AssistantMessage dengan thinking steps:
// Render ThinkingSteps terlebih dulu (bisa collapse saat done)
// Lalu render text (jika clarifying) atau RecommendationList (jika done)
```

### `ThinkingSteps.tsx`

Render daftar `ThinkingStep[]`. Steps yang belum `done` tampil dengan animasi
spinner kecil. Steps yang `done` tampil dengan ikon centang.

Saat `status === "done"`, seluruh blok thinking bisa di-collapse menjadi satu
baris ringkas: *"Dianalisis dari Bab 65 dan 87"*.

### `RecommendationList.tsx`

Render `recommendations[]` dari `AssistantMessage`. Tidak berubah banyak dari
`ResultPanel` yang ada sekarang.

### `ChatInput.tsx`

Input satu baris di bagian bawah halaman, selalu tampil. Disabled saat `busy`.
Saat `status === "clarifying"`, placeholder berubah menjadi *"Ketik jawaban
Anda…"* tapi tidak ada perubahan struktur.

---

## Komponen yang dihapus

Komponen-komponen berikut tidak lagi digunakan setelah redesign ini selesai:

- `TextInputPanel.tsx` → digantikan `ChatInput.tsx`
- `ProductFactsPanel.tsx` → tidak ada lagi fase review fakta terpisah
- `ClarificationPanel.tsx` → klarifikasi kini terjadi di thread percakapan
- `LoadingPanel.tsx` → digantikan `ThinkingSteps.tsx`
- `PhotoInputPanel.tsx` → bisa diintegrasikan langsung ke `ChatInput.tsx`
  sebagai tombol lampiran, atau ditunda ke iterasi berikutnya

---

## Yang tidak berubah

- Semua file di `core/hs-finder/` — tidak disentuh
- `app/api/hs-finder/route.ts` — tetap ada, tidak dihapus
- `app/api/hs-finder/analyze/route.ts` — tetap ada, tidak dihapus
- Semua test yang ada — harus tetap hijau
- Infrastruktur services (gemini, chapter-note-loader, classification-knowledge)

---

## Iterasi: apa yang dikerjakan dulu, apa yang ditunda

### Iterasi 1 (sekarang)

- Route baru `/api/hs-finder/chat` dengan streaming NDJSON
- `ConversationThread.tsx`, `ThinkingSteps.tsx`, `RecommendationList.tsx`, `ChatInput.tsx`
- `HsFinderPage.tsx` ditulis ulang pakai model state yang baru
- Input foto ditunda

### Iterasi 2 (setelah iterasi 1 stabil)

- Integrasi foto ke `ChatInput` sebagai tombol lampiran
- Collapse/expand thinking steps
- Persisten thread ke `sessionStorage` agar tidak hilang saat refresh

### Tidak dikerjakan sekarang

- Riwayat antar-sesi (bukan prioritas)
- Export thread ke PDF/teks

---

## Definisi selesai iterasi 1

1. User bisa ketik nama barang → mendapat respons berupa rekomendasi HS code
   dengan thinking steps yang terlihat saat streaming berlangsung
2. Jika Gemini meminta klarifikasi, user bisa menjawab di input yang sama
   dan putaran kedua berjalan dengan context putaran pertama
3. `npm run build` bersih
4. Semua test yang ada tetap hijau
