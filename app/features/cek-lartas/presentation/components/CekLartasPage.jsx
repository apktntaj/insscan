"use client";

import { useMaintenanceWindow } from "@/app/shared/hooks/useMaintenanceWindow";
import MaintenanceOverlay from "@/app/shared/components/MaintenanceOverlay";
import CekLartasScanner from "@/app/features/cek-lartas/presentation/components/CekLartasScanner";

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
    <MaintenanceOverlay
      isActive={isUnderMaintenance}
      title={config?.title ?? "Fitur Sedang Tidak Tersedia"}
      message={config?.message ?? "Fitur ini sedang tidak tersedia. Silakan coba beberapa saat lagi."}
    >
      <CekLartasScanner />
    </MaintenanceOverlay>
  );
}
