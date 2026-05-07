"use client";

import { useState, useEffect } from "react";
import { maintenanceWindows } from "../config/maintenance-config";

/**
 * Cek apakah waktu `now` berada dalam rentang [start, end].
 * Mendukung overnight window (start > end, melewati tengah malam).
 *
 * @param {{ hour: number, minute: number }} start
 * @param {{ hour: number, minute: number }} end
 * @param {Date} now
 * @returns {boolean}
 *
 * @example
 * isInWindow({ hour: 23, minute: 50 }, { hour: 6, minute: 0 }, new Date("2024-01-01T00:30:00"))
 * // => true  (00:30 ada di antara 23:50 – 06:00 overnight)
 *
 * @example
 * isInWindow({ hour: 23, minute: 50 }, { hour: 6, minute: 0 }, new Date("2024-01-01T12:00:00"))
 * // => false (12:00 di luar window)
 */
function isInWindow(start, end, now) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;

  if (startMinutes <= endMinutes) {
    // Window normal: misal 08:00 – 22:00
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Overnight window: misal 23:50 – 06:00
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

/**
 * Hook untuk mengecek apakah sebuah fitur sedang dalam maintenance window.
 * Re-evaluasi setiap menit agar UI otomatis update saat window mulai/selesai.
 *
 * @param {string} featureKey — key dari maintenanceWindows config (e.g. "cek-lartas")
 * @returns {{ isUnderMaintenance: boolean, config: import("../config/maintenance-config").MaintenanceWindow | null }}
 *
 * @example
 * const { isUnderMaintenance, config } = useMaintenanceWindow("cek-lartas");
 * // isUnderMaintenance: true jika sekarang pukul 23:50–06:00
 *
 * @example
 * const { isUnderMaintenance } = useMaintenanceWindow("fitur-tidak-ada");
 * // isUnderMaintenance: false (key tidak ditemukan di config)
 */
export function useMaintenanceWindow(featureKey) {
  const config = maintenanceWindows[featureKey] ?? null;

  const [isUnderMaintenance, setIsUnderMaintenance] = useState(() => {
    if (!config || !config.enabled) return false;
    return isInWindow(config.startTime, config.endTime, new Date());
  });

  useEffect(() => {
    if (!config || !config.enabled) {
      setIsUnderMaintenance(false);
      return;
    }

    function check() {
      setIsUnderMaintenance(isInWindow(config.startTime, config.endTime, new Date()));
    }

    // Cek setiap menit
    const interval = setInterval(check, 60 * 1000);
    check(); // cek langsung saat mount

    return () => clearInterval(interval);
  }, [config]);

  return { isUnderMaintenance, config };
}
