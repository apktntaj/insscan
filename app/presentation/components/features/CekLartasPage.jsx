"use client";

import { useMaintenanceWindow } from "../../hooks/useMaintenanceWindow";
import MaintenanceOverlay from "../common/MaintenanceOverlay";
import { Title, CekLartasScanner } from "../index";

const PAGE_TITLE = "CEK LARTAS";
const PAGE_DESCRIPTION = [];

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
