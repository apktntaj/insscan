/**
 * Evaluate Shipment Status Alerts — Use Case
 * Core Layer — Application Business Rules
 *
 * @description ShipmentStatusAlertEngine: evaluates operational status of each active shipment.
 * Pure functions — no side effects, no throws.
 *
 * Rules:
 * - ETA_OVERDUE (high):          ETA < today
 * - ARRIVING_SOON (medium):      ETA in [today+1, today+3] — mutually exclusive with ETA_OVERDUE
 * - STALE_ENTRY (low):           created >30 days ago, never updated, ETA not far in future
 * - CUSTOM_DATE_OVERDUE (medium): customNotificationDate < today
 */

import { makeAlert, makeAlertResult } from './evaluate-data-quality-alerts';

// ---------------------------------------------------------------------------
// Wish List Helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes a Date to midnight (00:00:00.000) in local timezone.
 * @param {Date} date
 * @returns {Date}
 *
 * @example
 * startOfDay(new Date('2025-04-30T14:32:00'))
 * // => Date representing 2025-04-30T00:00:00.000 (local)
 *
 * @example
 * startOfDay(new Date('2025-01-01T23:59:59'))
 * // => Date representing 2025-01-01T00:00:00.000 (local)
 */
export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Safely parses an ISO date string. Returns null if invalid or falsy.
 * @param {string | null | undefined} isoString
 * @returns {Date | null}
 *
 * @example
 * parseISODate('2025-04-30')
 * // => Date('2025-04-30')
 *
 * @example
 * parseISODate(null)
 * // => null
 *
 * @example
 * parseISODate('bukan-tanggal')
 * // => null
 */
export function parseISODate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns the difference in calendar days between two dates (dateA - dateB).
 * Both dates are normalized to midnight before comparison.
 * @param {Date} dateA
 * @param {Date} dateB
 * @returns {number}
 *
 * @example
 * diffCalendarDays(new Date('2025-05-02'), new Date('2025-04-30'))
 * // => 2
 *
 * @example
 * diffCalendarDays(new Date('2025-04-28'), new Date('2025-04-30'))
 * // => -2
 */
export function diffCalendarDays(dateA, dateB) {
  const a = startOfDay(dateA).getTime();
  const b = startOfDay(dateB).getTime();
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

/**
 * Returns true if etaDate is strictly before today (ETA has passed).
 * Both dates normalized to midnight.
 * @param {Date} etaDate
 * @param {Date} today
 * @returns {boolean}
 *
 * @example
 * isOverdue(new Date('2025-04-29'), new Date('2025-04-30'))
 * // => true
 *
 * @example
 * isOverdue(new Date('2025-04-30'), new Date('2025-04-30'))
 * // => false
 */
export function isOverdue(etaDate, today) {
  return diffCalendarDays(etaDate, today) < 0;
}

/**
 * Returns true if ETA is in the range [today+1, today+3] (arriving soon).
 * @param {Date} etaDate
 * @param {Date} today
 * @returns {boolean}
 *
 * @example
 * isArrivingSoon(new Date('2025-05-02'), new Date('2025-04-30'))
 * // => true  (2 days away)
 *
 * @example
 * isArrivingSoon(new Date('2025-05-04'), new Date('2025-04-30'))
 * // => false  (4 days away)
 */
export function isArrivingSoon(etaDate, today) {
  const diff = diffCalendarDays(etaDate, today);
  return diff >= 1 && diff <= 3;
}

/**
 * Returns true if a shipment is considered stale:
 * - Created more than 30 days ago
 * - Never updated (updatedAt === createdAt)
 * - ETA is not more than 30 days in the future (or has no ETA)
 * @param {Object} shipment
 * @param {Date} today
 * @returns {boolean}
 *
 * @example
 * isStaleEntry(
 *   { createdAt: '2025-03-01T00:00:00Z', updatedAt: '2025-03-01T00:00:00Z', eta: null },
 *   new Date('2025-04-30')
 * )
 * // => true
 *
 * @example
 * isStaleEntry(
 *   { createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z', eta: null },
 *   new Date('2025-04-30')
 * )
 * // => false  (only 29 days ago)
 */
export function isStaleEntry(shipment, today) {
  const createdDate = parseISODate(shipment.createdAt);
  if (!createdDate) return false;

  const daysSinceCreated = diffCalendarDays(today, createdDate);
  if (daysSinceCreated <= 30) return false;

  // Must never have been updated
  const isNeverUpdated = shipment.updatedAt === shipment.createdAt;
  if (!isNeverUpdated) return false;

  // ETA more than 30 days in the future is a normal "future shipment" — not stale
  const etaDate = parseISODate(shipment.eta);
  if (etaDate) {
    const daysUntilEta = diffCalendarDays(etaDate, today);
    if (daysUntilEta > 30) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// ShipmentStatusAlertEngine
// ---------------------------------------------------------------------------

/**
 * Evaluates operational status for each active shipment and returns alerts.
 * Pure function — no side effects.
 *
 * Rules evaluated per shipment:
 * - ETA_OVERDUE (high):          ETA present and < today
 * - ARRIVING_SOON (medium):      ETA in [today+1, today+3] — only if NOT overdue
 * - STALE_ENTRY (low):           created >30 days ago, never updated, ETA not far ahead
 * - CUSTOM_DATE_OVERDUE (medium): customNotificationDate present and < today
 *
 * Shipment dengan status !== 'active' dilewati.
 *
 * @param {Object[]} shipments
 * @param {{ now?: Date }} [options]
 * @returns {Object[]} AlertResult[]
 *
 * @example
 * evaluateShipmentStatusAlerts([
 *   { id: 1, status: 'active', eta: '2025-04-29', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z', customNotificationDate: null }
 * ], { now: new Date('2025-04-30') })
 * // => [{ shipmentId: 1, alerts: [{ ruleId: 'ETA_OVERDUE', riskLevel: 'high', ... }], highestRisk: 'high' }]
 *
 * @example
 * evaluateShipmentStatusAlerts([
 *   { id: 2, status: 'active', eta: '2025-05-02', createdAt: '2025-04-30T00:00:00Z', updatedAt: '2025-04-30T00:00:00Z', customNotificationDate: null }
 * ], { now: new Date('2025-04-30') })
 * // => [{ shipmentId: 2, alerts: [{ ruleId: 'ARRIVING_SOON', riskLevel: 'medium', message: 'Kapal tiba dalam 2 hari...', ... }], highestRisk: 'medium' }]
 */
export function evaluateShipmentStatusAlerts(shipments, { now = new Date() } = {}) {
  const results = [];
  const today = startOfDay(now);

  for (const shipment of shipments) {
    // Skip non-active shipments (Requirement 9.7)
    if (shipment.status !== 'active') continue;

    const alertDefs = [];

    // --- Rule 1 & 2: ETA-based rules (mutually exclusive) ---
    const etaDate = parseISODate(shipment.eta);
    if (etaDate !== null) {
      const etaNorm = startOfDay(etaDate);

      if (isOverdue(etaNorm, today)) {
        // Rule 1: ETA_OVERDUE
        alertDefs.push({
          ruleId: 'ETA_OVERDUE',
          riskLevel: 'high',
          message: 'ETA sudah terlewat — perbarui ETA atau periksa status kedatangan kapal',
          suggestedAction: 'Edit shipment dan perbarui ETA, atau terminasi jika sudah selesai',
          engine: 'shipment-status',
        });
      } else if (isArrivingSoon(etaNorm, today)) {
        // Rule 2: ARRIVING_SOON (only if not overdue)
        const daysLeft = diffCalendarDays(etaNorm, today);
        alertDefs.push({
          ruleId: 'ARRIVING_SOON',
          riskLevel: 'medium',
          message: `Kapal tiba dalam ${daysLeft} hari — siapkan dokumen kepabeanan`,
          suggestedAction: 'Pastikan semua dokumen PIB/BC sudah siap sebelum kedatangan',
          engine: 'shipment-status',
        });
      }
    }

    // --- Rule 3: STALE_ENTRY ---
    if (isStaleEntry(shipment, today)) {
      alertDefs.push({
        ruleId: 'STALE_ENTRY',
        riskLevel: 'low',
        message: 'Shipment belum diperbarui selama lebih dari 30 hari — verifikasi apakah data masih relevan',
        suggestedAction: 'Perbarui data shipment atau terminasi jika sudah tidak relevan',
        engine: 'shipment-status',
      });
    }

    // --- Rule 4: CUSTOM_DATE_OVERDUE ---
    const customDate = parseISODate(shipment.customNotificationDate);
    if (customDate !== null) {
      const customNorm = startOfDay(customDate);
      if (isOverdue(customNorm, today)) {
        alertDefs.push({
          ruleId: 'CUSTOM_DATE_OVERDUE',
          riskLevel: 'medium',
          message: 'Tanggal notifikasi kustom sudah terlewat — tindak lanjut diperlukan',
          suggestedAction: 'Periksa catatan shipment dan ambil tindakan yang diperlukan, atau perbarui tanggal notifikasi',
          engine: 'shipment-status',
        });
      }
    }

    if (alertDefs.length === 0) continue;

    // Build Alert objects via makeAlert()
    const alerts = [];
    for (const def of alertDefs) {
      const result = makeAlert(
        def.ruleId,
        shipment.id,
        def.riskLevel,
        def.message,
        def.suggestedAction,
        def.engine,
      );
      if (result.ok) {
        alerts.push(result.data);
      }
    }

    if (alerts.length === 0) continue;

    // Build AlertResult via makeAlertResult()
    const alertResultResult = makeAlertResult(shipment.id, alerts);
    if (alertResultResult.ok) {
      results.push(alertResultResult.data);
    }
  }

  return results;
}
