import { roadmapItems, WHATSAPP_NUMBER, QRIS_IMAGE_PATH } from "../presentation/config/feedback-config";
import RoadmapBoard from "../presentation/components/features/RoadmapBoard";
import SuggestionForm from "../presentation/components/features/SuggestionForm";
import SupportSection from "../presentation/components/features/SupportSection";

export const metadata = {
  title: "Feedback & Roadmap | Pesisir Platform",
  description:
    "Lihat roadmap fitur Pesisir Platform dan kirim saran pengembangan langsung via WhatsApp.",
};

/**
 * Halaman /feedback — Next.js Server Component
 *
 * Menampilkan tiga section independen:
 * 1. Roadmap Board — status fitur yang sedang dan akan dikerjakan
 * 2. Suggestion Form — link WhatsApp untuk mengirim saran
 * 3. Support Section — QRIS donasi dan ajakan kolaborasi
 */
export default function FeedbackPage() {
  return (
    <div className="space-y-12 pb-8 sm:space-y-16">
      {/* Page header */}
      <div>
        <p className="inline-flex rounded-full border border-cyan-200/80 bg-white/75 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
          Feedback
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Roadmap & Saran
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
          Lihat fitur apa yang sedang dikerjakan, apa yang sudah tersedia, dan apa yang direncanakan. Punya ide atau masukan? Langsung kirim via WhatsApp.
        </p>
      </div>

      {/* Section 1: Roadmap Board */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <RoadmapBoard items={roadmapItems} />
      </section>

      {/* Section 2: Suggestion Form */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <SuggestionForm waNumber={WHATSAPP_NUMBER} />
      </section>

      {/* Section 3: Support Section */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <SupportSection qrisImagePath={QRIS_IMAGE_PATH} />
      </section>
    </div>
  );
}
