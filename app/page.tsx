import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  Clock3Icon,
  DownloadIcon,
  FileSearchIcon,
  FileSpreadsheetIcon,
  MessageCircleIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShipIcon,
  UploadIcon,
} from "lucide-react";
import FaqList, { type FaqItemData } from "@/app/features/marketing/components/FaqList";
import { WHATSAPP_NUMBER } from "@/app/features/feedback/config/feedback-config";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const metadata: Metadata = homeSocialMetadata;

const EARLY_ACCESS_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Halo, saya ingin bertanya tentang Pesisir Pro Early Access.",
)}`;

interface WorkspaceFeature {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: LucideIcon;
}

const workspaceFeatures: WorkspaceFeature[] = [
  {
    title: "Cek LARTAS batch",
    description: "Periksa puluhan HS code dari invoice Excel dan ekspor hasilnya untuk dokumentasi kerja.",
    href: "/cek-lartas",
    action: "Mulai pemeriksaan",
    icon: FileSpreadsheetIcon,
  },
  {
    title: "Cari kandidat HS code",
    description: "Susun fakta produk dan dapatkan kandidat klasifikasi untuk membantu riset awal.",
    href: "/hs-finder",
    action: "Buka HS Finder",
    icon: SearchIcon,
  },
  {
    title: "Kelola shipment",
    description: "Pantau B/L, ETA, kelengkapan data, dan pekerjaan yang perlu ditindaklanjuti.",
    href: "/shipments",
    action: "Lihat shipment",
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
    q: "Apa perbedaan paket Gratis dan Pro?",
    a: "Paket Gratis mencakup 10 pemeriksaan HS code per hari. Pro menghapus batas harian selama masa aktif. Aktivasi Early Access masih dikonfirmasi manual melalui WhatsApp.",
  },
];

const workflowItems = [
  { label: "Invoice IMP-0823", detail: "24 HS code siap diperiksa", status: "Siap", variant: "secondary" as const },
  { label: "Shipment MJS-0826", detail: "ETA dalam 3 hari", status: "Pantau", variant: "outline" as const },
  { label: "Dokumen B/L", detail: "1 data perlu dilengkapi", status: "Tindak lanjut", variant: "secondary" as const },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-20 pb-8 sm:gap-24">
      <section className="grid min-h-[calc(100vh-8rem)] items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div className="max-w-2xl">
          <Badge variant="secondary">Workspace operasional PPJK</Badge>
          <h1 className="mt-6 font-heading text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Pekerjaan kepabeanan harian, lebih ringkas dan jelas.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Cek LARTAS, riset HS code, dan pantau shipment dalam satu workspace sederhana yang dibuat untuk ritme kerja PPJK.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/cek-lartas" className={buttonVariants({ size: "lg" })}>
              Cek LARTAS sekarang
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <Link href="/shipments" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Buka workspace
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><ShieldCheckIcon className="size-4" />File diproses di browser</span>
            <span className="flex items-center gap-2"><CheckCircle2Icon className="size-4" />10 cek gratis per hari</span>
          </div>
        </div>

        <Card className="shadow-xl shadow-primary/5">
          <CardHeader>
            <CardTitle>Ringkasan pekerjaan</CardTitle>
            <CardDescription>Prioritas yang perlu Anda lihat hari ini.</CardDescription>
            <CardAction><Badge variant="outline">Hari ini</Badge></CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">HS code</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">24</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Shipment</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">8</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Perlu aksi</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">2</p>
              </div>
            </div>
            <div className="flex flex-col">
              {workflowItems.map((item, index) => (
                <div key={item.label}>
                  {index > 0 ? <Separator /> : null}
                  <div className="flex items-center gap-3 py-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      {index === 0 ? <FileSearchIcon className="size-4" /> : index === 1 ? <Clock3Icon className="size-4" /> : <FileSpreadsheetIcon className="size-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <Badge variant={item.variant}>{item.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-between gap-3">
            <span className="text-xs text-muted-foreground">Contoh tampilan workspace</span>
            <Link href="/shipments" className={buttonVariants({ size: "sm", variant: "ghost" })}>Lihat detail</Link>
          </CardFooter>
        </Card>
      </section>

      <section aria-labelledby="tools-title">
        <div className="max-w-2xl">
          <Badge variant="outline">Alat kerja utama</Badge>
          <h2 id="tools-title" className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Mulai dari pekerjaan yang perlu diselesaikan.
          </h2>
          <p className="mt-3 text-muted-foreground">Setiap alat berdiri sendiri, dengan alur yang pendek dan hasil yang mudah dibaca.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {workspaceFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.href}>
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
          <p className="mt-3 text-muted-foreground">Tidak ada dashboard yang ramai. Hanya input penting, proses yang terlihat, dan hasil yang bisa dibawa ke pekerjaan berikutnya.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: "01", title: "Masukkan data", description: "Upload Excel atau isi detail barang dan shipment.", icon: UploadIcon },
            { step: "02", title: "Periksa hasil", description: "Lihat status, catatan, dan data yang masih perlu perhatian.", icon: FileSearchIcon },
            { step: "03", title: "Lanjutkan kerja", description: "Ekspor hasil atau tindak lanjuti shipment dari satu tempat.", icon: DownloadIcon },
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

      <section aria-labelledby="pricing-title">
        <div className="text-center">
          <Badge variant="outline">Harga sederhana</Badge>
          <h2 id="pricing-title" className="mt-4 font-heading text-3xl font-semibold tracking-tight">Mulai gratis, tingkatkan saat volume kerja bertambah.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Satu HS code unik dihitung sebagai satu pemeriksaan. Kode duplikat diproses satu kali.</p>
        </div>
        <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gratis</CardTitle>
              <CardDescription>Untuk mencoba alur kerja Pesisir.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">Rp0</p>
              <ul className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />10 pemeriksaan HS code per hari</li>
                <li className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />Input tunggal dan Excel</li>
                <li className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />Ekspor hasil pemeriksaan</li>
              </ul>
            </CardContent>
            <CardFooter><Link href="/cek-lartas" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>Mulai gratis</Link></CardFooter>
          </Card>
          <Card className="ring-primary/30">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Untuk volume pemeriksaan rutin.</CardDescription>
              <CardAction><Badge>Early Access</Badge></CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">Rp26.000<span className="text-sm font-normal text-muted-foreground"> / bulan</span></p>
              <ul className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />Tanpa batas pemeriksaan harian</li>
                <li className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />Tidak diperpanjang otomatis</li>
                <li className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />Aktivasi manual via WhatsApp</li>
              </ul>
            </CardContent>
            <CardFooter>
              <a href={EARLY_ACCESS_LINK} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants(), "w-full")}>
                <MessageCircleIcon data-icon="inline-start" />Tanya paket Pro
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
