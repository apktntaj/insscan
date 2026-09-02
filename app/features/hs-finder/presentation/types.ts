/**
 * HS Finder Conversation — UI Types
 *
 * Model data untuk thread percakapan di HsFinderPage.
 * Hanya type definitions — tidak ada logika.
 *
 * @module features/hs-finder/presentation/types
 */

export type ThinkingStep = {
  /** Label ringkas, e.g. "Memuat catatan bab" */
  label: string;
  /** Detail hasil langkah, e.g. "→ Bab 65, Bab 87" atau "Bab 65 ✓  Bab 87 ✓" */
  detail: string;
  /** true setelah server mengirim step berikutnya dengan label yang sama */
  done: boolean;
};

export type Recommendation = {
  /** HS code 6 digit, e.g. "650610" */
  hsCode: string;
  /** Deskripsi subheading dalam Bahasa Indonesia */
  description: string;
  /** Tingkat keyakinan rekomendasi */
  confidence: "high" | "medium" | "low";
  /** Alasan pemilihan kode ini */
  rationale: string | null;
  /** Kutipan catatan bab yang mendukung */
  quotedRule: string | null;
};

export type CoverageMap = {
  chapters: Record<string, "validated" | "draft" | "unvalidated">;
  hasUnvalidated: boolean;
};

export type UserMessage = {
  id: string;
  role: "user";
  text: string;
};

export type AssistantMessage = {
  id: string;
  role: "assistant";
  /** Langkah-langkah berpikir — diisi bertahap saat streaming */
  thinking: ThinkingStep[];
  /** Teks narasi — diisi saat clarifying atau error */
  text: string | null;
  /** Daftar rekomendasi HS code — diisi saat done */
  recommendations: Recommendation[] | null;
  /** Alasan mengapa klarifikasi diperlukan */
  clarificationReason: string | null;
  /** Pertanyaan klarifikasi dari asisten */
  questions: string[];
  /** Status coverage bab yang dianalisis */
  coverageMap: CoverageMap | null;
  /** Status render saat ini */
  status: "thinking" | "clarifying" | "done" | "error";
};

export type Message = UserMessage | AssistantMessage;
