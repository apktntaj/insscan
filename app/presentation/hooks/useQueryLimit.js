"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY_USAGE = "pesisir_query_limit";
const STORAGE_KEY_PRO = "pesisir_pro_key";
const DAILY_LIMIT = 10;

// Karakter yang dipakai untuk generate dan validasi token segment
const TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// ─── Key Validation ───────────────────────────────────────────────────────────

/**
 * Validasi format dan expiry sebuah unlock key.
 * Format: PSR-YYYYMM-XXXXXXXX
 *
 * @param {string} key
 * @returns {{ valid: boolean, error?: string }}
 *
 * @example
 * validateUnlockKey("PSR-202508-A3F7K2M9") // valid bulan Agustus 2025
 * // => { valid: true }
 *
 * @example
 * validateUnlockKey("PSR-202001-A3F7K2M9") // expired
 * // => { valid: false, error: "Kode akses sudah expired." }
 */
export function validateUnlockKey(key) {
  if (!key || typeof key !== "string") {
    return { valid: false, error: "Kode tidak valid." };
  }

  const normalized = key.trim().toUpperCase();
  const parts = normalized.split("-");

  if (parts.length !== 3 || parts[0] !== "PSR") {
    return { valid: false, error: "Format kode tidak dikenali." };
  }

  const [, yearMonth, token] = parts;

  if (!/^\d{6}$/.test(yearMonth)) {
    return { valid: false, error: "Format kode tidak dikenali." };
  }

  if (!/^[A-Z0-9]{8}$/.test(token)) {
    return { valid: false, error: "Format kode tidak dikenali." };
  }

  // Cek expiry — key berlaku sampai akhir bulan yang tertera
  const year = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10); // 1-12
  if (month < 1 || month > 12) {
    return { valid: false, error: "Format kode tidak dikenali." };
  }

  // Akhir bulan = awal bulan berikutnya
  const expiry = new Date(year, month, 1); // month is 0-indexed, so month = next month
  const now = new Date();
  if (now >= expiry) {
    return { valid: false, error: "Kode akses sudah expired." };
  }

  return { valid: true };
}

/**
 * Generate unlock key untuk bulan tertentu.
 * Dipakai secara manual oleh developer untuk issue key ke user Pro.
 * Format: PSR-YYYYMM-XXXXXXXX
 *
 * @param {number} year  - e.g. 2025
 * @param {number} month - 1-12
 * @returns {string}
 *
 * @example
 * generateUnlockKey(2025, 8) // => "PSR-202508-A3F7K2M9" (random)
 */
export function generateUnlockKey(year, month) {
  const ym = `${year}${String(month).padStart(2, "0")}`;
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)];
  }
  return `PSR-${ym}-${token}`;
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

/**
 * Baca usage state dari localStorage. Return null jika belum ada atau hari baru.
 * @returns {{ date: string, used: number } | null}
 */
function readUsageStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.date !== today) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Tulis usage state ke localStorage.
 * @param {{ date: string, used: number }} state
 */
function writeUsageStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(state));
  } catch {}
}

/**
 * Baca pro key dari localStorage. Return null jika tidak ada atau tidak valid.
 * @returns {string | null}
 */
function readProKey() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRO);
    if (!raw) return null;
    const { key } = JSON.parse(raw);
    const { valid } = validateUnlockKey(key);
    return valid ? key : null;
  } catch {
    return null;
  }
}

/**
 * Simpan pro key ke localStorage.
 * @param {string} key
 */
function writeProKey(key) {
  try {
    localStorage.setItem(STORAGE_KEY_PRO, JSON.stringify({ key }));
  } catch {}
}

/**
 * Hapus pro key dari localStorage.
 */
function clearProKey() {
  try {
    localStorage.removeItem(STORAGE_KEY_PRO);
  } catch {}
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook untuk tracking batas query harian Cek Lartas.
 * User Pro (punya unlock key valid) tidak terkena limit.
 *
 * @returns {{
 *   used: number,
 *   limit: number,
 *   remaining: number,
 *   isLimitReached: boolean,
 *   isPro: boolean,
 *   consume: (count: number) => boolean,
 *   activateKey: (key: string) => { ok: boolean, error?: string },
 *   deactivateKey: () => void,
 * }}
 */
export function useQueryLimit() {
  const [used, setUsed] = useState(0);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const proKey = readProKey();
    if (proKey) {
      setIsPro(true);
      return;
    }
    const stored = readUsageStorage();
    if (stored) setUsed(stored.used);
  }, []);

  /**
   * Coba pakai sejumlah `count` query.
   * User Pro selalu return true. User free dicek terhadap limit harian.
   *
   * @param {number} count
   * @returns {boolean}
   */
  const consume = useCallback((count) => {
    if (readProKey()) return true;

    const stored = readUsageStorage();
    const currentUsed = stored?.used ?? 0;
    const next = currentUsed + count;

    if (next > DAILY_LIMIT) return false;

    const today = new Date().toISOString().slice(0, 10);
    writeUsageStorage({ date: today, used: next });
    setUsed(next);
    return true;
  }, []);

  /**
   * Aktivasi unlock key. Return { ok: true } jika berhasil, { ok: false, error } jika gagal.
   *
   * @param {string} key
   * @returns {{ ok: boolean, error?: string }}
   *
   * @example
   * activateKey("PSR-202508-A3F7K2M9") // => { ok: true }
   * activateKey("INVALID")             // => { ok: false, error: "Format kode tidak dikenali." }
   */
  const activateKey = useCallback((key) => {
    const { valid, error } = validateUnlockKey(key);
    if (!valid) return { ok: false, error };
    writeProKey(key.trim().toUpperCase());
    setIsPro(true);
    return { ok: true };
  }, []);

  /**
   * Nonaktifkan pro key — kembali ke mode free.
   */
  const deactivateKey = useCallback(() => {
    clearProKey();
    setIsPro(false);
  }, []);

  const remaining = isPro ? Infinity : Math.max(DAILY_LIMIT - used, 0);
  const isLimitReached = !isPro && used >= DAILY_LIMIT;

  return {
    used,
    limit: DAILY_LIMIT,
    remaining,
    isLimitReached,
    isPro,
    consume,
    activateKey,
    deactivateKey,
  };
}
