/**
 * Public Holidays
 * Enterprise Business Rules — Working day calculation
 *
 * @description Indonesian national public holidays (update annually).
 * Used to compute H-1 (one working day before a target date).
 */

/** Indonesian national public holidays for 2025 (ISO date strings) */
export const PUBLIC_HOLIDAYS_2025 = [
  "2025-01-01", // Tahun Baru Masehi
  "2025-01-27", // Isra Mi'raj
  "2025-01-28", // Cuti Bersama Isra Mi'raj
  "2025-01-29", // Tahun Baru Imlek
  "2025-03-28", // Hari Suci Nyepi
  "2025-03-29", // Cuti Bersama Nyepi
  "2025-03-31", // Idul Fitri
  "2025-04-01", // Idul Fitri
  "2025-04-02", // Cuti Bersama Idul Fitri
  "2025-04-03", // Cuti Bersama Idul Fitri
  "2025-04-04", // Cuti Bersama Idul Fitri
  "2025-04-07", // Cuti Bersama Idul Fitri
  "2025-04-18", // Wafat Isa Al Masih
  "2025-05-01", // Hari Buruh Internasional
  "2025-05-12", // Hari Raya Waisak
  "2025-05-13", // Cuti Bersama Waisak
  "2025-05-29", // Kenaikan Isa Al Masih
  "2025-05-30", // Cuti Bersama Kenaikan Isa Al Masih
  "2025-06-01", // Hari Lahir Pancasila
  "2025-06-06", // Idul Adha
  "2025-06-27", // Tahun Baru Islam 1447 H
  "2025-08-17", // Hari Kemerdekaan RI
  "2025-09-05", // Maulid Nabi Muhammad SAW
  "2025-12-25", // Hari Raya Natal
  "2025-12-26", // Cuti Bersama Natal
];

/** All known public holidays (extend with future years as needed) */
export const ALL_PUBLIC_HOLIDAYS = new Set([...PUBLIC_HOLIDAYS_2025]);

/**
 * Returns true if the given date falls on a Saturday or Sunday
 * @param {Date} date
 * @returns {boolean}
 */
export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Returns true if the given date is a known Indonesian public holiday
 * @param {Date} date
 * @returns {boolean}
 */
export function isPublicHoliday(date) {
  const iso = toIsoDateString(date);
  return ALL_PUBLIC_HOLIDAYS.has(iso);
}

/**
 * Returns true if the given date is a working day
 * @param {Date} date
 * @returns {boolean}
 */
export function isWorkingDay(date) {
  return !isWeekend(date) && !isPublicHoliday(date);
}

/**
 * Computes H-1: one working day before the target date.
 * Skips weekends and public holidays going backwards.
 * @param {Date} targetDate
 * @returns {Date}
 */
export function getHMinusOne(targetDate) {
  let candidate = new Date(targetDate);
  candidate.setDate(candidate.getDate() - 1);

  while (!isWorkingDay(candidate)) {
    candidate.setDate(candidate.getDate() - 1);
  }

  return candidate;
}

/**
 * Formats a Date to ISO date string (YYYY-MM-DD) in local time
 * @param {Date} date
 * @returns {string}
 */
export function toIsoDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns true if today is the H-1 notification day for the given target date
 * @param {string|null} targetDateStr - ISO date string
 * @param {Date} [today] - defaults to new Date()
 * @returns {boolean}
 */
export function isNotificationDue(targetDateStr, today = new Date()) {
  if (!targetDateStr) return false;
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return false;
  const hMinus1 = getHMinusOne(target);
  return toIsoDateString(hMinus1) === toIsoDateString(today);
}
