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
  ScanSearchIcon,
  ShieldCheckIcon,
  UploadIcon,
  ShipIcon,
} from "lucide-react";
import FaqList, { type FaqItemData } from "@/app/features/marketing/components/FaqList";
import { DONATION_LINK } from "@/app/shared/config/donation";
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
  {
    title: "Kelola shipment impor",
    description: "Pantau tahap, ETA, dan pekerjaan shipment impor secara lokal pada browser ini.",
    href: "/shipments",
    action: "Buka workspace shipment",
    icon: ShipIcon,
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
    <div className="flex flex-col gap-24 pb-10 sm:gap-32">
      <section className="relative flex min-h-[calc(100vh-10rem)] items-center justify-center overflow-hidden py-12 text-center sm:py-24">
        <div className="max-w-3xl -translate-y-10 sm:-translate-y-16">
          <h1 className="mt-6 font-heading text-2xl leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Perangkat Kerja <span className="text-primary">Modern</span> Untuk PPJK.<br />
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Pesisir membantu staff PPJK dan freight forwarder dengan berbagai alat kerja untuk meningkatkan produktifitas dan menghindari kesalahan.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/cek-lartas" className={buttonVariants({ size: "lg" })}>
              Cek lartas item di Invoice
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <Link href="#tools-title" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Lihat tool lainnya
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          </div>
        </div>
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

      <section className="mx-auto w-full max-w-4xl" aria-label="Ringkasan pemeriksaan LARTAS">
        <Card className="overflow-hidden border-primary/15 shadow-2xl shadow-primary/10">
          <CardHeader className="border-b bg-muted/45">
            <CardTitle className="flex items-center gap-2"><ScanSearchIcon className="size-5 text-primary" />Pemeriksaan yang tidak menghambat pekerjaan</CardTitle>
            <CardDescription>Mulai dari satu HS code atau data pada invoice Anda.</CardDescription>
            <CardAction><Badge variant="secondary">Siap digunakan</Badge></CardAction>
          </CardHeader>
          <CardContent className="grid gap-5 py-7 sm:grid-cols-3">
            {[
              ["01", "Masukkan HS code", "Satu kode atau banyak kode dari Excel."],
              ["02", "Baca persyaratan", "Lihat status dan catatan yang perlu dicek."],
              ["03", "Simpan hasil", "Ekspor ringkasan untuk diteruskan ke tim."],
            ].map(([step, title, description]) => (
              <div key={step} className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-left">
                <span className="text-xs font-semibold tracking-[0.2em] text-primary">{step}</span>
                <p className="font-medium">{title}</p>
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
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

      <section className="rounded-3xl border bg-card/75 px-5 py-12 sm:px-10" aria-labelledby="support-title">
        <div className="text-center">
          <Badge variant="outline">Gratis untuk digunakan</Badge>
          <h2 id="support-title" className="mt-4 font-heading text-3xl font-semibold tracking-tight">Akses seluruh fitur tanpa biaya.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Pesisir dibuat agar pemeriksaan LARTAS lebih mudah diakses. Tidak ada paket Pro, langganan, atau batas pemeriksaan harian.</p>
        </div>
        <div className="mx-auto mt-8 max-w-xl">
          <Card className="border-primary/20 shadow-lg shadow-primary/5">
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
