import { roadmapItems, WHATSAPP_NUMBER, DEVELOPER_PHOTO_PATH } from "@/app/features/feedback/config/feedback-config";
import RoadmapBoard from "@/app/features/feedback/components/RoadmapBoard";
import SupportSection from "@/app/features/feedback/components/SupportSection";
import { createPageMetadata } from "@/app/shared/config/site-metadata";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Feedback & Roadmap",
  description:
    "Lihat roadmap pengembangan fitur Pesisir dan kirim saran langsung via WhatsApp. Pesisir dikembangkan secara independen dan terus ditingkatkan berdasarkan masukan pengguna.",
  path: "/feedback",
});

/**
 * Halaman /feedback — Next.js Server Component
 *
 * Menampilkan tiga section independen:
 * 1. Roadmap Board — status fitur yang sedang dan akan dikerjakan
 * 2. Suggestion Form — link WhatsApp untuk mengirim saran
 * 3. Support Section — ajakan donasi sukarela dan kolaborasi
 */
export default function FeedbackPage() {
  return (
    <div className="space-y-12 pb-8 sm:space-y-16">
      <div className="max-w-3xl">
        <Badge variant="secondary">Feedback & roadmap</Badge>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Bantu Pesisir menjadi lebih berguna untuk pekerjaan Anda.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Sampaikan kebutuhan operasional, saran, atau ide fitur. Anda juga dapat melihat apa yang sudah tersedia dan arah pengembangan berikutnya.
        </p>
        <div className="mt-5">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Kirim saran via WhatsApp ke developer Pesisir Platform"
            className={buttonVariants({ size: "lg" })}
          >
            <MessageCircle data-icon="inline-start" />
            Kirim saran via WhatsApp
          </a>
        </div>
      </div>

      {/* Section 1: Roadmap Board */}
      <section>
        <RoadmapBoard items={roadmapItems} />
      </section>

      <Card>
        <CardContent>
          <SupportSection developerPhotoPath={DEVELOPER_PHOTO_PATH} />
        </CardContent>
      </Card>
    </div>
  );
}
