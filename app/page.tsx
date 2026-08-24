import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileSearchIcon,
  FileSpreadsheetIcon,
  HeartHandshakeIcon,
  ShieldCheckIcon,
  UploadIcon,
} from "lucide-react";
import FaqList, { type FaqItemData } from "@/app/features/marketing/components/FaqList";
import { DONATION_LINK } from "@/app/features/feedback/config/feedback-config";
import { homeSocialMetadata } from "@/app/shared/config/site-metadata";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export const metadata: Metadata = homeSocialMetadata;

interface WorkspaceFeature {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: LucideIcon;
}

const workspaceFeatures: WorkspaceFeature[] = [
  {
    title: "Cek LARTAS dari Excel",
    description: "Periksa puluhan HS code dari invoice Excel dan ekspor hasilnya untuk dokumentasi kerja.",
    href: "/cek-lartas",
    action: "Mulai pemeriksaan",
    icon: FileSpreadsheetIcon,
  },
  {
    title: "Cek satu HS code",
    description: "Masukkan satu HS code untuk melihat status dan persyaratan LARTAS dengan cepat.",
    href: "/cek-lartas",
    action: "Masukkan HS code",
    icon: FileSearchIcon,
  },
];

const faqs: FaqItemData[] = [
  {
    q: "Data LARTAS berasal dari mana?",
    a: "Pesisir mengambil informasi LARTAS dari layanan INSW saat pemeriksaan dilakukan. Hasil bergantung pada ketersediaan dan respons sumber tersebut.",
  },
  {
    q: "Apakah file Excel saya disimpan?",
    a: "Tidak. File Excel dibaca di browser dan tidak disimpan di server Pesisir. Hanya HS code yang terdeteksi yang digunakan untuk mengambil hasil pemeriksaan.",
  },
  {
    q: "Format file Excel seperti apa yang didukung?",
    a: "Gunakan file .xls atau .xlsx yang memuat HS code 8 digit. Pesisir dapat membaca beberapa sheet dan akan memproses kode duplikat satu kali.",
  },
  {
    q: "Apakah hasil Pesisir dapat dijadikan keputusan resmi?",
    a: "Tidak. Pesisir adalah alat bantu operasional. Klasifikasi dan persyaratan penting tetap perlu diverifikasi melalui portal, regulasi, dan pihak berwenang yang relevan.",
  },
  {
    q: "Apakah Pesisir benar-benar gratis?",
    a: "Ya. Semua fitur yang tersedia dapat digunakan tanpa paket berbayar atau batas pemeriksaan harian. Bila Pesisir membantu pekerjaan Anda, Anda dapat mendukung pengembangannya melalui donasi sukarela.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-20 pb-8 sm:gap-24">
      <section className="grid min-h-[calc(100vh-8rem)] items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div className="max-w-2xl">
          <Badge variant="secondary">Workspace operasional PPJK</Badge>
          <h1 className="mt-6 font-heading text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Pemeriksaan LARTAS yang lebih ringkas dan jelas.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Periksa satu HS code atau seluruh invoice dari satu tempat, lalu lanjutkan pekerjaan dengan hasil yang mudah dibaca.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/cek-lartas" className={buttonVariants({ size: "lg" })}>
              Cek LARTAS sekarang
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <Link href="#tools-title" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Pilih cara pemeriksaan
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><ShieldCheckIcon className="size-4" />File diproses di browser</span>
            <span className="flex items-center gap-2"><CheckCircle2Icon className="size-4" />Gratis tanpa kuota harian</span>
          </div>
        </div>

        <Card className="shadow-xl shadow-primary/5">
          <CardHeader>
            <CardTitle>Mulai pemeriksaan pertama Anda</CardTitle>
            <CardDescription>Hasil pemeriksaan LARTAS akan tersedia setelah Anda memasukkan HS code atau mengunggah invoice.</CardDescription>
            <CardAction><Badge variant="secondary">LARTAS</Badge></CardAction>
          </CardHeader>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><FileSearchIcon /></EmptyMedia>
                <EmptyTitle>Belum ada pemeriksaan</EmptyTitle>
                <EmptyDescription>Mulai dengan satu HS code atau file Excel. File Anda diproses di browser.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link href="/cek-lartas" className={buttonVariants({ size: "sm" })}>
                  Cek LARTAS sekarang
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </EmptyContent>
            </Empty>
          </CardContent>
          <CardFooter className="justify-between gap-3">
            <span className="text-xs text-muted-foreground">Tidak perlu akun untuk mulai memeriksa.</span>
          </CardFooter>
        </Card>
      </section>

      <section aria-labelledby="tools-title">
        <div className="max-w-2xl">
          <Badge variant="outline">Alat kerja utama</Badge>
          <h2 id="tools-title" className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Mulai dari pekerjaan yang perlu diselesaikan.
          </h2>
          <p className="mt-3 text-muted-foreground">Pilih pemeriksaan sesuai data yang Anda miliki, lalu lanjutkan dari hasil yang tersedia.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {workspaceFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href={feature.href} className={buttonVariants({ variant: "ghost" })}>
                    {feature.action}
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start" aria-labelledby="steps-title">
        <div className="max-w-md">
          <Badge variant="outline">Alur sederhana</Badge>
          <h2 id="steps-title" className="mt-4 font-heading text-3xl font-semibold tracking-tight">Dari data kerja ke hasil yang siap ditindaklanjuti.</h2>
          <p className="mt-3 text-muted-foreground">Mulai dari data yang Anda miliki, periksa persyaratan, lalu simpan hasilnya untuk pekerjaan berikutnya.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: "01", title: "Masukkan data", description: "Upload Excel atau isi satu HS code.", icon: UploadIcon },
            { step: "02", title: "Periksa hasil", description: "Lihat status, catatan, dan data yang masih perlu perhatian.", icon: FileSearchIcon },
            { step: "03", title: "Lanjutkan kerja", description: "Ekspor hasil untuk dokumentasi dan tindak lanjut.", icon: DownloadIcon },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.step} size="sm">
                <CardHeader>
                  <CardAction><Badge variant="secondary">{item.step}</Badge></CardAction>
                  <Icon className="mb-3 size-5 text-primary" />
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="support-title">
        <div className="text-center">
          <Badge variant="outline">Gratis untuk digunakan</Badge>
          <h2 id="support-title" className="mt-4 font-heading text-3xl font-semibold tracking-tight">Akses seluruh fitur tanpa biaya.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Pesisir dibuat agar pemeriksaan LARTAS lebih mudah diakses. Tidak ada paket Pro, langganan, atau batas pemeriksaan harian.</p>
        </div>
        <div className="mx-auto mt-8 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Didukung oleh komunitas</CardTitle>
              <CardDescription>Gunakan Pesisir gratis; donasi hanya jika Anda ingin membantu keberlanjutan pengembangannya.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">Rp0</p>
              <ul className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />Pemeriksaan HS code tanpa kuota harian</li>
                <li className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />Input tunggal dan Excel</li>
                <li className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />Ekspor hasil pemeriksaan</li>
              </ul>
            </CardContent>
            <CardFooter>
              <a href={DONATION_LINK} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                <HeartHandshakeIcon data-icon="inline-start" />Dukung dengan donasi
              </a>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.65fr_1.35fr]" aria-labelledby="faq-title">
        <div>
          <Badge variant="outline">FAQ</Badge>
          <h2 id="faq-title" className="mt-4 font-heading text-3xl font-semibold tracking-tight">Pertanyaan sebelum mulai.</h2>
        </div>
        <Card>
          <CardContent><FaqList items={faqs} /></CardContent>
        </Card>
      </section>

      <section className="rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-10">
        <h2 className="font-heading text-3xl font-semibold tracking-tight">Mulai dari satu pekerjaan hari ini.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/75 sm:text-base">Coba cek LARTAS tanpa biaya. Tidak perlu menyiapkan akun untuk mulai memeriksa.</p>
        <div className="mt-7 flex justify-center">
          <Link href="/cek-lartas" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Mulai cek LARTAS
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </div>
      </section>
    </div>
  );
}
