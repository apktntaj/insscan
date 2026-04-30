/**
 * Property Tests untuk `getHighestRisk`
 *
 * Property 13: `getHighestRisk` mengembalikan risk level tertinggi
 * Validates: Requirements 9.6, 10.2
 */

import fc from 'fast-check';
import { getHighestRisk } from '../evaluate-data-quality-alerts.js';

const riskLevels = ['high', 'medium', 'low'];

// Arbitrary untuk satu alert dengan risk level valid
const alertArb = fc.record({
  riskLevel: fc.constantFrom(...riskLevels),
  ruleId: fc.constant('MISSING_ALL_CRITICAL'),
  shipmentId: fc.integer({ min: 1 }),
  message: fc.constant('test message'),
  suggestedAction: fc.constant('test action'),
  engine: fc.constant('data-quality'),
});

describe('Property 13: getHighestRisk mengembalikan risk level tertinggi', () => {
  /**
   * Property 13a: Untuk array alerts non-empty, getHighestRisk selalu mengembalikan
   * salah satu dari ['high', 'medium', 'low']
   * Validates: Requirements 9.6, 10.2
   */
  test('13a: selalu mengembalikan valid risk level untuk array non-empty', () => {
    fc.assert(
      fc.property(fc.array(alertArb, { minLength: 1 }), (alerts) => {
        const result = getHighestRisk(alerts);
        return riskLevels.includes(result);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13b: Jika ada minimal satu alert dengan riskLevel 'high',
   * maka getHighestRisk mengembalikan 'high'
   * Validates: Requirements 9.6, 10.2
   */
  test('13b: mengembalikan "high" jika ada minimal satu alert high', () => {
    const highAlertArb = fc.record({
      riskLevel: fc.constant('high'),
      ruleId: fc.constant('MISSING_ALL_CRITICAL'),
      shipmentId: fc.integer({ min: 1 }),
      message: fc.constant('test message'),
      suggestedAction: fc.constant('test action'),
      engine: fc.constant('data-quality'),
    });

    fc.assert(
      fc.property(
        fc.array(alertArb),          // array of any alerts (bisa kosong)
        highAlertArb,                // setidaknya satu alert high
        fc.array(alertArb),          // array of any alerts (bisa kosong)
        (before, highAlert, after) => {
          const alerts = [...before, highAlert, ...after];
          const result = getHighestRisk(alerts);
          return result === 'high';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13c: Jika tidak ada alert 'high' tapi ada 'medium',
   * maka getHighestRisk mengembalikan 'medium'
   * Validates: Requirements 9.6, 10.2
   */
  test('13c: mengembalikan "medium" jika tidak ada high tapi ada medium', () => {
    const mediumAlertArb = fc.record({
      riskLevel: fc.constant('medium'),
      ruleId: fc.constant('MISSING_ETA_ONLY'),
      shipmentId: fc.integer({ min: 1 }),
      message: fc.constant('test message'),
      suggestedAction: fc.constant('test action'),
      engine: fc.constant('data-quality'),
    });

    const lowAlertArb = fc.record({
      riskLevel: fc.constant('low'),
      ruleId: fc.constant('MISSING_VESSEL_OR_POD'),
      shipmentId: fc.integer({ min: 1 }),
      message: fc.constant('test message'),
      suggestedAction: fc.constant('test action'),
      engine: fc.constant('data-quality'),
    });

    fc.assert(
      fc.property(
        fc.array(lowAlertArb),       // hanya alert low (tidak ada high)
        mediumAlertArb,              // setidaknya satu alert medium
        fc.array(lowAlertArb),       // hanya alert low (tidak ada high)
        (before, mediumAlert, after) => {
          const alerts = [...before, mediumAlert, ...after];
          const result = getHighestRisk(alerts);
          return result === 'medium';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13d: Jika semua alert adalah 'low',
   * maka getHighestRisk mengembalikan 'low'
   * Validates: Requirements 9.6, 10.2
   */
  test('13d: mengembalikan "low" jika semua alert adalah low', () => {
    const lowAlertArb = fc.record({
      riskLevel: fc.constant('low'),
      ruleId: fc.constant('MISSING_VESSEL_OR_POD'),
      shipmentId: fc.integer({ min: 1 }),
      message: fc.constant('test message'),
      suggestedAction: fc.constant('test action'),
      engine: fc.constant('data-quality'),
    });

    fc.assert(
      fc.property(fc.array(lowAlertArb, { minLength: 1 }), (alerts) => {
        const result = getHighestRisk(alerts);
        return result === 'low';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13e: Untuk array kosong, getHighestRisk mengembalikan null
   * Validates: Requirements 9.6, 10.2
   */
  test('13e: mengembalikan null untuk array kosong', () => {
    expect(getHighestRisk([])).toBeNull();
    expect(getHighestRisk(null)).toBeNull();
    expect(getHighestRisk(undefined)).toBeNull();
  });
});


/**
 * Property Tests untuk `evaluateDataQualityAlerts`
 *
 * Property 7: DataQualityAlertEngine — risk level sesuai kombinasi field kosong
 * Property 10: Engine tidak mengevaluasi shipment terminated
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 9.7
 */

import { evaluateDataQualityAlerts } from '../evaluate-data-quality-alerts.js';

const nonEmptyString = fc.string({ minLength: 1 });
const emptyOrNull = fc.constantFrom('', null, undefined);

// Shipment aktif dengan semua field kosong
const allEmptyActiveShipment = fc.record({
  id: fc.integer({ min: 1 }),
  status: fc.constant('active'),
  eta: emptyOrNull,
  vesselName: emptyOrNull,
  portOfDischarge: emptyOrNull,
});

// Shipment terminated dengan semua field kosong
const terminatedShipment = fc.record({
  id: fc.integer({ min: 1 }),
  status: fc.constant('terminated'),
  eta: emptyOrNull,
  vesselName: emptyOrNull,
  portOfDischarge: emptyOrNull,
});

describe('Property 7: DataQualityAlertEngine — risk level sesuai kombinasi field kosong', () => {
  /**
   * Property 7a: Shipment aktif dengan ETA, vesselName, dan portOfDischarge semua kosong
   * → menghasilkan alert MISSING_ALL_CRITICAL dengan riskLevel high
   * Validates: Requirements 6.1
   */
  test('7a: semua field kosong → MISSING_ALL_CRITICAL dengan riskLevel high', () => {
    fc.assert(
      fc.property(allEmptyActiveShipment, (shipment) => {
        const results = evaluateDataQualityAlerts([shipment]);
        if (results.length !== 1) return false;
        const result = results[0];
        if (result.shipmentId !== shipment.id) return false;
        if (result.highestRisk !== 'high') return false;
        const alert = result.alerts.find((a) => a.ruleId === 'MISSING_ALL_CRITICAL');
        return alert !== undefined && alert.riskLevel === 'high';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7b: Shipment aktif dengan ETA kosong, vesselName terisi, portOfDischarge terisi
   * → menghasilkan alert MISSING_ETA_ONLY dengan riskLevel medium
   * Validates: Requirements 6.2
   */
  test('7b: hanya ETA kosong → MISSING_ETA_ONLY dengan riskLevel medium', () => {
    const shipmentArb = fc.record({
      id: fc.integer({ min: 1 }),
      status: fc.constant('active'),
      eta: emptyOrNull,
      vesselName: nonEmptyString,
      portOfDischarge: nonEmptyString,
    });

    fc.assert(
      fc.property(shipmentArb, (shipment) => {
        const results = evaluateDataQualityAlerts([shipment]);
        if (results.length !== 1) return false;
        const result = results[0];
        if (result.shipmentId !== shipment.id) return false;
        if (result.highestRisk !== 'medium') return false;
        const alert = result.alerts.find((a) => a.ruleId === 'MISSING_ETA_ONLY');
        return alert !== undefined && alert.riskLevel === 'medium';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7c: Shipment aktif dengan ETA terisi, vesselName kosong (portOfDischarge boleh apa saja)
   * → menghasilkan alert MISSING_VESSEL_OR_POD dengan riskLevel low
   * Validates: Requirements 6.3
   */
  test('7c: ETA terisi, vesselName kosong → MISSING_VESSEL_OR_POD dengan riskLevel low', () => {
    const shipmentArb = fc.record({
      id: fc.integer({ min: 1 }),
      status: fc.constant('active'),
      eta: nonEmptyString,
      vesselName: emptyOrNull,
      portOfDischarge: fc.oneof(nonEmptyString, emptyOrNull),
    });

    fc.assert(
      fc.property(shipmentArb, (shipment) => {
        const results = evaluateDataQualityAlerts([shipment]);
        if (results.length !== 1) return false;
        const result = results[0];
        if (result.shipmentId !== shipment.id) return false;
        if (result.highestRisk !== 'low') return false;
        const alert = result.alerts.find((a) => a.ruleId === 'MISSING_VESSEL_OR_POD');
        return alert !== undefined && alert.riskLevel === 'low';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7d: Shipment aktif dengan ETA terisi, portOfDischarge kosong (vesselName boleh apa saja)
   * → menghasilkan alert MISSING_VESSEL_OR_POD dengan riskLevel low
   * Validates: Requirements 6.3
   */
  test('7d: ETA terisi, portOfDischarge kosong → MISSING_VESSEL_OR_POD dengan riskLevel low', () => {
    const shipmentArb = fc.record({
      id: fc.integer({ min: 1 }),
      status: fc.constant('active'),
      eta: nonEmptyString,
      vesselName: fc.oneof(nonEmptyString, emptyOrNull),
      portOfDischarge: emptyOrNull,
    });

    fc.assert(
      fc.property(shipmentArb, (shipment) => {
        const results = evaluateDataQualityAlerts([shipment]);
        if (results.length !== 1) return false;
        const result = results[0];
        if (result.shipmentId !== shipment.id) return false;
        if (result.highestRisk !== 'low') return false;
        const alert = result.alerts.find((a) => a.ruleId === 'MISSING_VESSEL_OR_POD');
        return alert !== undefined && alert.riskLevel === 'low';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7e: Shipment aktif dengan semua field terisi → tidak menghasilkan alert (result kosong)
   * Validates: Requirements 6.1, 6.2, 6.3
   */
  test('7e: semua field terisi → tidak menghasilkan alert', () => {
    const shipmentArb = fc.record({
      id: fc.integer({ min: 1 }),
      status: fc.constant('active'),
      eta: nonEmptyString,
      vesselName: nonEmptyString,
      portOfDischarge: nonEmptyString,
    });

    fc.assert(
      fc.property(shipmentArb, (shipment) => {
        const results = evaluateDataQualityAlerts([shipment]);
        return results.length === 0;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 10: Engine tidak mengevaluasi shipment terminated', () => {
  /**
   * Property 10a: Shipment dengan status terminated tidak menghasilkan alert,
   * meskipun semua field kosong
   * Validates: Requirements 9.7
   */
  test('10a: shipment terminated tidak menghasilkan alert meskipun semua field kosong', () => {
    fc.assert(
      fc.property(terminatedShipment, (shipment) => {
        const results = evaluateDataQualityAlerts([shipment]);
        return results.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10b: Campuran shipment aktif dan terminated — hanya shipment aktif yang dievaluasi
   * Validates: Requirements 9.7
   */
  test('10b: campuran aktif dan terminated — hanya shipment aktif yang dievaluasi', () => {
    fc.assert(
      fc.property(
        fc.array(allEmptyActiveShipment, { minLength: 1 }),
        fc.array(terminatedShipment, { minLength: 1 }),
        (activeShipments, terminatedShipments) => {
          const allShipments = [...activeShipments, ...terminatedShipments];
          const results = evaluateDataQualityAlerts(allShipments);

          // Jumlah hasil harus sama dengan jumlah shipment aktif
          if (results.length !== activeShipments.length) return false;

          // Semua shipmentId dalam hasil harus berasal dari shipment aktif
          const activeIds = new Set(activeShipments.map((s) => s.id));
          return results.every((r) => activeIds.has(r.shipmentId));
        }
      ),
      { numRuns: 100 }
    );
  });
});
