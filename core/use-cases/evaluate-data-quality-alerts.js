/**
 * Evaluate Data Quality Alerts — Use Case
 * Core Layer — Application Business Rules
 *
 * @description Constants, factory functions, and helpers for the DataQualityAlertEngine.
 * Pure functions — no side effects, no throws.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * All valid alert rule IDs used across both alert engines.
 * @type {Readonly<Record<string, string>>}
 */
export const ALERT_RULE_IDS = Object.freeze({
  // ShipmentStatusAlertEngine
  ETA_OVERDUE:           'ETA_OVERDUE',
  ARRIVING_SOON:         'ARRIVING_SOON',
  STALE_ENTRY:           'STALE_ENTRY',
  CUSTOM_DATE_OVERDUE:   'CUSTOM_DATE_OVERDUE',
  // DataQualityAlertEngine
  MISSING_ALL_CRITICAL:  'MISSING_ALL_CRITICAL',
  MISSING_ETA_ONLY:      'MISSING_ETA_ONLY',
  MISSING_VESSEL_OR_POD: 'MISSING_VESSEL_OR_POD',
});

/**
 * Maps each ruleId to the engine that owns it.
 * Used by makeAlert() to enforce ruleId-engine consistency.
 * @type {Readonly<Record<string, string>>}
 */
export const RULE_ENGINE_MAP = Object.freeze({
  ETA_OVERDUE:           'shipment-status',
  ARRIVING_SOON:         'shipment-status',
  STALE_ENTRY:           'shipment-status',
  CUSTOM_DATE_OVERDUE:   'shipment-status',
  MISSING_ALL_CRITICAL:  'data-quality',
  MISSING_ETA_ONLY:      'data-quality',
  MISSING_VESSEL_OR_POD: 'data-quality',
});

/**
 * Numeric ordering for risk levels — higher number means higher priority.
 * Used by getHighestRisk() to compare risk levels.
 * @type {Readonly<Record<string, number>>}
 */
export const RISK_LEVEL_ORDER = Object.freeze({
  high:   3,
  medium: 2,
  low:    1,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the highest RiskLevel from an array of alerts.
 * @param {import('./types').Alert[]} alerts
 * @returns {'high' | 'medium' | 'low' | null} - null jika array kosong
 *
 * @example
 * getHighestRisk([{ riskLevel: 'low' }, { riskLevel: 'high' }, { riskLevel: 'medium' }])
 * // => 'high'
 *
 * @example
 * getHighestRisk([])
 * // => null
 */
export function getHighestRisk(alerts) {
  if (!alerts || alerts.length === 0) return null;

  return alerts.reduce((highest, alert) => {
    const currentOrder = RISK_LEVEL_ORDER[alert.riskLevel] ?? 0;
    const highestOrder = RISK_LEVEL_ORDER[highest] ?? 0;
    return currentOrder > highestOrder ? alert.riskLevel : highest;
  }, alerts[0].riskLevel);
}

// ---------------------------------------------------------------------------
// Factory Functions
// ---------------------------------------------------------------------------

/**
 * Creates a valid Alert, enforcing ruleId-engine consistency.
 * @param {string} ruleId          - Must be a key in ALERT_RULE_IDS
 * @param {number} shipmentId      - ID of the shipment being alerted
 * @param {'high' | 'medium' | 'low'} riskLevel
 * @param {string} message         - Non-empty alert message shown to user
 * @param {string} suggestedAction - Non-empty suggested action for user
 * @param {'data-quality' | 'shipment-status'} engine - Engine producing this alert
 * @returns {{ ok: true, data: Object } | { ok: false, error: string }}
 *
 * @example
 * makeAlert('ETA_OVERDUE', 42, 'high', 'ETA sudah terlewat', 'Perbarui ETA', 'shipment-status')
 * // => { ok: true, data: { ruleId: 'ETA_OVERDUE', shipmentId: 42, riskLevel: 'high', ... } }
 *
 * @example
 * makeAlert('ETA_OVERDUE', 42, 'high', 'ETA sudah terlewat', 'Perbarui ETA', 'data-quality')
 * // => { ok: false, error: "ruleId 'ETA_OVERDUE' tidak valid untuk engine 'data-quality'" }
 */
export function makeAlert(ruleId, shipmentId, riskLevel, message, suggestedAction, engine) {
  // Validate ruleId exists
  if (!ALERT_RULE_IDS[ruleId]) {
    return { ok: false, error: `ruleId '${ruleId}' tidak dikenal` };
  }

  // Validate ruleId-engine consistency
  const expectedEngine = RULE_ENGINE_MAP[ruleId];
  if (expectedEngine !== engine) {
    return { ok: false, error: `ruleId '${ruleId}' tidak valid untuk engine '${engine}'` };
  }

  // Validate message and suggestedAction are non-empty
  if (!message || message.trim() === '') {
    return { ok: false, error: 'message tidak boleh kosong' };
  }
  if (!suggestedAction || suggestedAction.trim() === '') {
    return { ok: false, error: 'suggestedAction tidak boleh kosong' };
  }

  return {
    ok: true,
    data: {
      ruleId,
      shipmentId,
      riskLevel,
      message,
      suggestedAction,
      engine,
    },
  };
}

/**
 * Creates an AlertResult, computing highestRisk automatically from alerts.
 * @param {number} shipmentId  - ID of the shipment
 * @param {Object[]} alerts    - Array of Alert objects — minimal 1
 * @returns {{ ok: true, data: Object } | { ok: false, error: string }}
 *
 * @example
 * makeAlertResult(1, [{ riskLevel: 'low', ... }, { riskLevel: 'high', ... }])
 * // => { ok: true, data: { shipmentId: 1, alerts: [...], highestRisk: 'high' } }
 *
 * @example
 * makeAlertResult(1, [])
 * // => { ok: false, error: "alerts tidak boleh kosong" }
 */
export function makeAlertResult(shipmentId, alerts) {
  if (!alerts || alerts.length === 0) {
    return { ok: false, error: 'alerts tidak boleh kosong' };
  }

  const highestRisk = getHighestRisk(alerts);

  return {
    ok: true,
    data: {
      shipmentId,
      alerts,
      highestRisk,
    },
  };
}

// ---------------------------------------------------------------------------
// DataQualityAlertEngine
// ---------------------------------------------------------------------------

/**
 * Evaluates data completeness for each active shipment and returns alerts.
 * Pure function — no side effects.
 *
 * Rules evaluated (in order, mutually exclusive for the first two):
 * - MISSING_ALL_CRITICAL (high):   ETA kosong AND vesselName kosong AND portOfDischarge kosong
 * - MISSING_ETA_ONLY (medium):     ETA kosong AND vesselName terisi AND portOfDischarge terisi
 * - MISSING_VESSEL_OR_POD (low):   ETA terisi AND (vesselName kosong OR portOfDischarge kosong)
 *
 * Shipment dengan status !== 'active' dilewati.
 *
 * @param {Object[]} shipments
 * @param {{ now?: Date }} [options]
 * @returns {Object[]} AlertResult[]
 *
 * @example
 * evaluateDataQualityAlerts([
 *   { id: 1, status: 'active', eta: null, vesselName: null, portOfDischarge: null }
 * ])
 * // => [{ shipmentId: 1, alerts: [{ ruleId: 'MISSING_ALL_CRITICAL', riskLevel: 'high', ... }], highestRisk: 'high' }]
 *
 * @example
 * evaluateDataQualityAlerts([
 *   { id: 2, status: 'active', eta: '2025-06-01', vesselName: 'MV Express', portOfDischarge: 'IDJKT' }
 * ])
 * // => []
 */
export function evaluateDataQualityAlerts(shipments, { now = new Date() } = {}) {
  const results = [];

  for (const shipment of shipments) {
    // Skip non-active shipments (Requirement 9.7)
    if (shipment.status !== 'active') continue;

    const hasEta = shipment.eta != null && shipment.eta !== '';
    const hasVessel = shipment.vesselName != null && shipment.vesselName !== '';
    const hasPod = shipment.portOfDischarge != null && shipment.portOfDischarge !== '';

    const alertDefs = [];

    if (!hasEta && !hasVessel && !hasPod) {
      // Rule: MISSING_ALL_CRITICAL — all three critical fields are empty
      alertDefs.push({
        ruleId: 'MISSING_ALL_CRITICAL',
        riskLevel: 'high',
        message: 'ETA, nama kapal, dan port of discharge belum diisi — tracking tidak dapat dilakukan',
        suggestedAction: 'Edit shipment dan lengkapi semua data yang diperlukan',
        engine: 'data-quality',
      });
    } else if (!hasEta && hasVessel && hasPod) {
      // Rule: MISSING_ETA_ONLY — only ETA is missing
      alertDefs.push({
        ruleId: 'MISSING_ETA_ONLY',
        riskLevel: 'medium',
        message: 'ETA belum diisi — tracking kedatangan tidak dapat dilakukan',
        suggestedAction: 'Edit shipment dan isi tanggal ETA',
        engine: 'data-quality',
      });
    } else if (hasEta && (!hasVessel || !hasPod)) {
      // Rule: MISSING_VESSEL_OR_POD — ETA is present but vessel or POD is missing
      const missingFields = [];
      if (!hasVessel) missingFields.push('nama kapal');
      if (!hasPod) missingFields.push('port of discharge');

      alertDefs.push({
        ruleId: 'MISSING_VESSEL_OR_POD',
        riskLevel: 'low',
        message: `Data belum lengkap: ${missingFields.join(' dan ')} belum diisi`,
        suggestedAction: 'Edit shipment dan lengkapi data yang diperlukan',
        engine: 'data-quality',
      });
    }

    if (alertDefs.length === 0) continue;

    // Build Alert objects via makeAlert(), skipping any that fail validation
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
      // Defensive: if ok is false, skip this alert (should not happen with correct usage)
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
