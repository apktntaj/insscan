"use client";

import { useMaintenanceWindow } from "../../hooks/useMaintenanceWindow";
import MaintenanceOverlay from "../common/MaintenanceOverlay";
import { Title, CekLartasScanner } from "../index";
import { WHATSAPP_NUMBER } from "../../config/feedback-config";

const PAGE_TITLE = "CEK LARTAS";
const PAGE_DESCRIPTION = [];

const WA_MESSAGE = encodeURIComponent(
  "Halo, saya ingin mendapatkan akses Cek Lartas di Pesisir."
);
const WA_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WA_MESSAGE}`;

/**
 * Banner pengumuman transisi Cek Lartas ke ekstensi Chrome.
 * Menjelaskan situasi dan menyediakan jalur kontak WhatsApp untuk akses sementara.
 */
function TransitionBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5 sm:px-7">
      <div className="flex gap-3.5">
        {/* Ikon */}
        <div className="mt-0.5 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-base">
            🔧
          </span>
        </div>

        <div className="min-w-0 space-y-3">
          {/* Judul */}
          <p className="font-semibold text-amber-900 sm:text-base">
            Cek Lartas sedang dalam transisi
          </p>

          {/* Penjelasan */}
          <p className="text-sm leading-6 text-amber-800">
            Fitur ini sedang kami pindahkan ke{" "}
            <strong className="font-semibold">ekstensi Google Chrome</strong> agar bisa
            langsung terintegrasi dengan portal INSW tanpa perlu berpindah tab. Selama
            proses transisi berlangsung, halaman ini untuk sementara tidak aktif.
          </p>

          {/* Divider */}
          <div className="border-t border-amber-200" />

          {/* CTA akses sementara */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-sm text-amber-800">
              Butuh akses sekarang? Hubungi developer — kami bisa membukakan aksesnya.
            </p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-800"
            >
              {/* WhatsApp icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Hubungi via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CekLartasPage (Client Component)
 * Presentation Layer - Feature Page Wrapper
 *
 * Menggabungkan maintenance window check dengan konten halaman Cek Lartas.
 * Dipisah dari page.jsx agar metadata tetap bisa diekspor dari Server Component.
 *
 * @returns {JSX.Element}
 */
export default function CekLartasPage() {
  const { isUnderMaintenance, config } = useMaintenanceWindow("cek-lartas");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <Title title={PAGE_TITLE} descs={PAGE_DESCRIPTION} variant="modern" eyebrow="Pesisir" />
      <TransitionBanner />
      <div className="pointer-events-none select-none opacity-40" aria-hidden="true">
        <MaintenanceOverlay
          isActive={isUnderMaintenance}
          title={config?.title ?? "Fitur Sedang Tidak Tersedia"}
          message={config?.message ?? "Fitur ini sedang tidak tersedia. Silakan coba beberapa saat lagi."}
        >
          <CekLartasScanner />
        </MaintenanceOverlay>
      </div>
    </div>
  );
}
