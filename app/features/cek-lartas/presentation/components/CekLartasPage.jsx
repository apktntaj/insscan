"use client";

import { useMaintenanceWindow } from "@/app/shared/hooks/useMaintenanceWindow";
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
      <CekLartasScanner />
  );
}
