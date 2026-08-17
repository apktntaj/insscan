"use client";

import { useMaintenanceWindow } from "@/app/shared/hooks/useMaintenanceWindow";
import MaintenanceOverlay from "@/app/shared/components/MaintenanceOverlay";
import Title from "@/app/shared/components/Title";
import CekLartasScanner from "@/app/features/hs-code/presentation/components/CekLartasScanner";

const PAGE_TITLE = "CEK LARTAS";
const PAGE_DESCRIPTION = [
  "Periksa tarif dan status LARTAS dari satu HS code atau file Excel. Hanya HS code yang dikirim untuk mengambil data; file tetap diproses di browser.",
];

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
      <MaintenanceOverlay
        isActive={isUnderMaintenance}
        title={config?.title ?? "Fitur Sedang Tidak Tersedia"}
        message={config?.message ?? "Fitur ini sedang tidak tersedia. Silakan coba beberapa saat lagi."}
      >
        <CekLartasScanner />
      </MaintenanceOverlay>
    </div>
  );
}
