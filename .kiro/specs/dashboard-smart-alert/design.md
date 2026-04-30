# Design Document: Dashboard & Smart Alert

## Overview

Fitur Dashboard & Smart Alert menambahkan lapisan visibilitas operasional ke halaman `/shipments` yang sudah ada. Tidak ada route baru — dashboard adalah section yang dirender di atas tabel shipment oleh `ShipmentManager.jsx`.

Dua alert engine terpisah mengevaluasi setiap shipment aktif secara sinkron di sisi klien:

- **`DataQualityAlertEngine`** — pure function yang mengevaluasi kelengkapan data (ETA, vessel name, port of discharge) dan menghasilkan alert dengan risk level berdasarkan kombinasi field yang kosong.
- **`ShipmentStatusAlertEngine`** — pure function yang mengevaluasi kondisi operasional (ETA overdue, arriving soon, stale entry, custom date overdue) dan menghasilkan alert berprioritas.

Kedua engine tidak memiliki dependency ke infrastructure layer — mereka hanya menerima array `Shipment[]` dan mengembalikan `AlertResult[]`. Evaluasi dilakukan setiap kali data shipment di-refresh (create, edit, terminate, atau refresh manual).

Perubahan utama pada codebase yang sudah ada:
1. `shipment.js` entity — ETA masuk ke `validateRequiredFields()`
2. `ShipmentForm.jsx` — ETA menjadi required field dengan validasi UI
3. `useShipments.js` — expose `lastRefreshedAt` timestamp
4. `ShipmentManager.jsx` — render `DashboardSection` di atas tabel

---

## Architecture

Fitur ini mengikuti Clean Architecture yang sudah ada. Tidak ada layer baru yang ditambahkan — hanya file baru di layer yang sudah ada.

```
Presentation Layer
├── DashboardSection.jsx      ← section utama dashboard (baru)
├── DashboardWidget.jsx       ← single metric widget (baru)
├── ActionableList.jsx        ← daftar shipment berisiko (baru)
├── AlertBadge.jsx            ← badge di tabel (baru)
├── ShipmentManager.jsx       ← dimodifikasi: render DashboardSection
├── ShipmentForm.jsx          ← dimodifikasi: ETA required
└── useDashboard.js           ← hook baru untuk dashboard state

Core Layer (Use Cases)
├── evaluate-data-quality-alerts.js    ← DataQualityAlertEngine (baru)
└── evaluate-shipment-status-alerts.js ← ShipmentStatusAlertEngine (baru)

Core Layer (Entities)
└── shipment.js               ← dimodifikasi: ETA di validateRequiredFields

(Tidak ada perubahan di Adapters atau Infrastructure layer)
```

### Dependency Flow untuk Fitur Ini

```
ShipmentManager
    └── DashboardSection
            └── useDashboard (hook)
                    ├── useShipments (existing, untuk data shipment)
                    ├── evaluateDataQualityAlerts (use case baru)
                    └── evaluateShipmentStatusAlerts (use case baru)
```

`useDashboard` mengonsumsi data dari `useShipments` yang sudah ada — tidak ada akses langsung ke IndexedDB dari dashboard. Ini memastikan single source of truth untuk data shipment.

---

## Components and Interfaces

### 1. Data Shapes

Semua data structures didefinisikan di sini sebelum function contracts.

#### `RiskLevel`

```js
/**
 * @typedef {'high' | 'medium' | 'low'} RiskLevel
 *
 * Urutan prioritas: high > medium > low
 * Digunakan untuk menentukan warna badge dan urutan tampilan di dashboard.
 */
```

#### `AlertEngine`

```js
/**
 * @typedef {'data-quality' | 'shipment-status'} AlertEngine
 *
 * Menandai engine mana yang menghasilkan alert.
 * - 'data-quality'    → DataQualityAlertEngine (kelengkapan field)
 * - 'shipment-status' → ShipmentStatusAlertEngine (kondisi operasional)
 */
```

#### `AlertRuleId`

```js
/**
 * @typedef {'ETA_OVERDUE' | 'ARRIVING_SOON' | 'STALE_ENTRY' | 'CUSTOM_DATE_OVERDUE' | 'MISSING_ALL_CRITICAL' | 'MISSING_ETA_ONLY' | 'MISSING_VESSEL_OR_POD'} AlertRuleId
 *
 * Mapping engine yang valid:
 * - engine 'shipment-status': ETA_OVERDUE, ARRIVING_SOON, STALE_ENTRY, CUSTOM_DATE_OVERDUE
 * - engine 'data-quality':    MISSING_ALL_CRITICAL, MISSING_ETA_ONLY, MISSING_VESSEL_OR_POD
 *
 * Invalid combinations (tidak boleh terjadi):
 * - ruleId 'ETA_OVERDUE' dengan engine 'data-quality'
 * - ruleId 'MISSING_ALL_CRITICAL' dengan engine 'shipment-status'
 * - ruleId 'ETA_OVERDUE' dan 'ARRIVING_SOON' pada shipment yang sama (mutually exclusive)
 */
```

#### `Alert`

```js
/**
 * @typedef {Object} Alert
 * @property {AlertRuleId}  ruleId          - Identifier unik rule
 * @property {number}       shipmentId      - ID shipment yang di-alert
 * @property {RiskLevel}    riskLevel       - Tingkat risiko
 * @property {string}       message         - Pesan alert yang ditampilkan ke user (non-empty)
 * @property {string}       suggestedAction - Aksi yang disarankan (non-empty)
 * @property {AlertEngine}  engine          - Engine yang menghasilkan alert ini
 *
 * Invariants:
 * - message dan suggestedAction tidak boleh kosong
 * - ruleId harus konsisten dengan engine (lihat AlertRuleId)
 * - ETA_OVERDUE dan ARRIVING_SOON tidak boleh ada bersamaan untuk shipment yang sama
 */
```

#### `AlertResult`

```js
/**
 * @typedef {Object} AlertResult
 * @property {number}    shipmentId   - ID shipment
 * @property {Alert[]}   alerts       - Semua alert untuk shipment ini (minimal 1)
 * @property {RiskLevel} highestRisk  - Risk level tertinggi, dihitung otomatis dari alerts
 *
 * Invariant: highestRisk selalu sama dengan getHighestRisk(alerts).
 * Jangan set highestRisk secara manual — gunakan makeAlertResult().
 */
```

#### `DashboardMetrics`

```js
/**
 * @typedef {Object} DashboardMetrics
 * @property {number} totalActive    - Jumlah shipment dengan status 'active'
 * @property {number} arrivingSoon   - Jumlah shipment aktif dengan ETA dalam [today+1, today+3]
 * @property {number} overdue        - Jumlah shipment aktif dengan ETA < today
 * @property {number} needsAttention - Jumlah shipment aktif dengan minimal satu alert medium/high
 *
 * Invariants:
 * - arrivingSoon + overdue <= totalActive (shipment tidak bisa overdue sekaligus arriving soon)
 * - needsAttention <= totalActive
 * - Semua nilai >= 0
 */
```

#### `ActionableItem`

```js
/**
 * @typedef {Object} ActionableItem
 * @property {number}    shipmentId
 * @property {string}    shipmentNumber
 * @property {string}    alias           - String kosong jika tidak ada alias
 * @property {string}    eta             - ISO date string, selalu ada (ETA mandatory)
 * @property {string}    etaDisplay      - Formatted locale date untuk tampilan
 * @property {RiskLevel} highestRisk     - Risk level tertinggi dari semua alerts
 * @property {Alert[]}   alerts          - Semua alert aktif, diurutkan high → medium → low
 *
 * Invariant: alerts.length >= 1 (ActionableItem hanya dibuat jika ada alert)
 */
```

---

### 2. Factory Functions

#### `makeAlert`

```js
/**
 * Creates a valid Alert, enforcing ruleId-engine consistency.
 * @param {AlertRuleId}  ruleId
 * @param {number}       shipmentId
 * @param {RiskLevel}    riskLevel
 * @param {string}       message
 * @param {string}       suggestedAction
 * @param {AlertEngine}  engine
 * @returns {{ ok: true, data: Alert } | { ok: false, error: string }}
 *
 * @example
 * makeAlert('ETA_OVERDUE', 42, 'high', 'ETA sudah terlewat', 'Perbarui ETA', 'shipment-status')
 * // => { ok: true, data: { ruleId: 'ETA_OVERDUE', shipmentId: 42, riskLevel: 'high', ... } }
 *
 * @example
 * makeAlert('ETA_OVERDUE', 42, 'high', 'ETA sudah terlewat', 'Perbarui ETA', 'data-quality')
 * // => { ok: false, error: "ruleId 'ETA_OVERDUE' tidak valid untuk engine 'data-quality'" }
 */
export function makeAlert(ruleId, shipmentId, riskLevel, message, suggestedAction, engine) { ... }
```

#### `makeAlertResult`

```js
/**
 * Creates an AlertResult, computing highestRisk automatically from alerts.
 * @param {number}  shipmentId
 * @param {Alert[]} alerts - Minimal 1 alert
 * @returns {{ ok: true, data: AlertResult } | { ok: false, error: string }}
 *
 * @example
 * makeAlertResult(1, [{ riskLevel: 'low', ... }, { riskLevel: 'high', ... }])
 * // => { ok: true, data: { shipmentId: 1, alerts: [...], highestRisk: 'high' } }
 *
 * @example
 * makeAlertResult(1, [])
 * // => { ok: false, error: "alerts tidak boleh kosong" }
 */
export function makeAlertResult(shipmentId, alerts) { ... }
```

---

### 3. Function Contracts

#### `getHighestRisk`

```js
/**
 * Returns the highest RiskLevel from an array of alerts.
 * @param {Alert[]} alerts
 * @returns {RiskLevel | null} - null jika array kosong
 *
 * @example
 * getHighestRisk([{ riskLevel: 'low' }, { riskLevel: 'high' }, { riskLevel: 'medium' }])
 * // => 'high'
 *
 * @example
 * getHighestRisk([])
 * // => null
 */
export function getHighestRisk(alerts) { ... }
```

#### `computeMetrics`

```js
/**
 * Computes DashboardMetrics from a list of shipments and their alert results.
 * @param {Shipment[]}              shipments
 * @param {Map<number,AlertResult>} alertsByShipmentId
 * @param {Date}                    now
 * @returns {DashboardMetrics}
 *
 * @example
 * computeMetrics(
 *   [
 *     { id: 1, status: 'active', eta: '2025-04-29' },  // overdue (today = 2025-04-30)
 *     { id: 2, status: 'active', eta: '2025-05-02' },  // arriving soon
 *     { id: 3, status: 'terminated', eta: '2025-04-28' }
 *   ],
 *   new Map(),
 *   new Date('2025-04-30')
 * )
 * // => { totalActive: 2, arrivingSoon: 1, overdue: 1, needsAttention: 0 }
 *
 * @example
 * computeMetrics([], new Map(), new Date())
 * // => { totalActive: 0, arrivingSoon: 0, overdue: 0, needsAttention: 0 }
 */
export function computeMetrics(shipments, alertsByShipmentId, now) { ... }
```

#### `evaluateDataQualityAlerts`

```js
/**
 * Evaluates data completeness for each active shipment and returns alerts.
 * Pure function — no side effects.
 * @param {Shipment[]} shipments
 * @param {{ now?: Date }} [options]
 * @returns {AlertResult[]}
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
export function evaluateDataQualityAlerts(shipments, { now = new Date() } = {}) { ... }
```

#### `evaluateShipmentStatusAlerts`

```js
/**
 * Evaluates operational status for each active shipment and returns alerts.
 * Pure function — no side effects.
 * @param {Shipment[]} shipments
 * @param {{ now?: Date }} [options]
 * @returns {AlertResult[]}
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
export function evaluateShipmentStatusAlerts(shipments, { now = new Date() } = {}) { ... }
```

#### `aggregateAlerts`

```js
/**
 * Merges AlertResult arrays from both engines into a single Map keyed by shipmentId.
 * @param {AlertResult[]} dataQualityResults
 * @param {AlertResult[]} statusResults
 * @returns {Map<number, AlertResult>}
 *
 * @example
 * aggregateAlerts(
 *   [{ shipmentId: 1, alerts: [{ ruleId: 'MISSING_ETA_ONLY', ... }], highestRisk: 'medium' }],
 *   [{ shipmentId: 1, alerts: [{ ruleId: 'STALE_ENTRY', ... }], highestRisk: 'low' }]
 * )
 * // => Map { 1 => { shipmentId: 1, alerts: [MISSING_ETA_ONLY, STALE_ENTRY], highestRisk: 'medium' } }
 *
 * @example
 * aggregateAlerts([], [])
 * // => Map {}
 */
export function aggregateAlerts(dataQualityResults, statusResults) { ... }
```

#### `formatRefreshTimestamp`

```js
/**
 * Formats a Date into a human-readable "last refreshed" string.
 * @param {Date | null} timestamp
 * @param {Date}        now
 * @returns {string}
 *
 * @example
 * formatRefreshTimestamp(null, new Date())
 * // => "Belum dimuat"
 *
 * @example
 * formatRefreshTimestamp(new Date('2025-04-30T14:30:00'), new Date('2025-04-30T14:31:30'))
 * // => "Baru saja"
 *
 * @example
 * formatRefreshTimestamp(new Date('2025-04-30T14:00:00'), new Date('2025-04-30T14:45:00'))
 * // => "Diperbarui 45 menit lalu"
 *
 * @example
 * formatRefreshTimestamp(new Date('2025-04-30T09:15:30'), new Date('2025-04-30T14:00:00'))
 * // => "Diperbarui 09:15:30"
 */
export function formatRefreshTimestamp(timestamp, now) { ... }
```

---

### 4. Wish Lists

#### Wish list untuk `evaluateShipmentStatusAlerts`

Fungsi ini kompleks — butuh helpers berikut sebelum implementasi:

```js
// startOfDay(date: Date): Date
//   Normalize date ke midnight (00:00:00.000) di local timezone.
//   startOfDay(new Date('2025-04-30T14:32:00')) => Date('2025-04-30T00:00:00')

// parseISODate(isoString: string | null): Date | null
//   Parse ISO date string secara aman. Return null jika invalid.
//   parseISODate('2025-04-30') => Date('2025-04-30')
//   parseISODate(null) => null
//   parseISODate('bukan-tanggal') => null

// diffCalendarDays(dateA: Date, dateB: Date): number
//   Selisih hari kalender antara dua tanggal (dateA - dateB).
//   diffCalendarDays(new Date('2025-05-02'), new Date('2025-04-30')) => 2
//   diffCalendarDays(new Date('2025-04-28'), new Date('2025-04-30')) => -2

// isOverdue(etaDate: Date, today: Date): boolean
//   Apakah ETA sudah lewat (strictly before today).
//   isOverdue(new Date('2025-04-29'), new Date('2025-04-30')) => true
//   isOverdue(new Date('2025-04-30'), new Date('2025-04-30')) => false

// isArrivingSoon(etaDate: Date, today: Date): boolean
//   Apakah ETA dalam rentang [today+1, today+3].
//   isArrivingSoon(new Date('2025-05-02'), new Date('2025-04-30')) => true
//   isArrivingSoon(new Date('2025-05-04'), new Date('2025-04-30')) => false

// isStaleEntry(shipment: Shipment, today: Date): boolean
//   Apakah shipment stale: dibuat >30 hari lalu, tidak pernah diupdate, ETA tidak jauh ke depan.
//   isStaleEntry({ createdAt: '2025-03-01', updatedAt: '2025-03-01', eta: null }, new Date('2025-04-30')) => true
//   isStaleEntry({ createdAt: '2025-04-01', updatedAt: '2025-04-01', eta: null }, new Date('2025-04-30')) => false
```

#### Wish list untuk `aggregateAlerts`

```js
// mergeAlertResults(existing: AlertResult, incoming: AlertResult): AlertResult
//   Merge dua AlertResult untuk shipment yang sama.
//   Gabungkan alerts, hitung ulang highestRisk.
//   mergeAlertResults(
//     { shipmentId: 1, alerts: [alertA], highestRisk: 'low' },
//     { shipmentId: 1, alerts: [alertB], highestRisk: 'high' }
//   ) => { shipmentId: 1, alerts: [alertA, alertB], highestRisk: 'high' }
```

#### Wish list untuk `formatRefreshTimestamp`

```js
// diffMinutes(dateA: Date, dateB: Date): number
//   Selisih menit antara dua Date (dateA - dateB, dibulatkan ke bawah).
//   diffMinutes(new Date('2025-04-30T14:45:00'), new Date('2025-04-30T14:30:00')) => 15
```

---

### 5. Presentation Hooks

#### `useDashboard.js` (baru)

```js
/**
 * useDashboard Hook
 * Presentation Layer — Orchestrates dashboard state
 *
 * @param {Object[]} shipments       - Array shipment dari useShipments
 * @param {boolean}  loading         - Loading state dari useShipments
 * @param {Function} refresh         - Refresh function dari useShipments
 * @returns {{
 *   metrics: DashboardMetrics,
 *   actionableItems: ActionableItem[],
 *   alertsByShipmentId: Map<number, AlertResult>,
 *   lastRefreshedAt: Date|null,
 *   isRefreshing: boolean,
 *   manualRefresh: () => Promise<void>,
 * }}
 */
export function useDashboard({ shipments, loading, refresh }) { ... }
```

Hook ini menerima data dari `useShipments` sebagai props (bukan memanggil controller langsung), sehingga tidak ada duplikasi fetch. Setiap kali `shipments` berubah, hook ini menjalankan kedua engine dan menghitung ulang semua metrics.

#### Perubahan pada `useShipments.js`

Tambahkan `lastRefreshedAt` ke return value:

```js
// Tambahan di useShipments:
const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

// Di dalam refresh():
setLastRefreshedAt(new Date());

// Return value tambahan:
return {
  // ... existing fields ...
  lastRefreshedAt,  // Date|null
};
```

### 6. Presentation Components

#### `DashboardSection.jsx` (baru)

```jsx
/**
 * DashboardSection Component
 * Presentation Layer — Feature component
 *
 * Section utama dashboard yang dirender di atas tabel shipment.
 * Menampilkan 4 widget metrik dan ActionableList.
 *
 * @param {{
 *   shipments: Object[],
 *   loading: boolean,
 *   refresh: () => Promise<void>,
 *   lastRefreshedAt: Date|null,
 *   onEditShipment: (shipment: Object) => void,
 * }} props
 */
export default function DashboardSection({ shipments, loading, refresh, lastRefreshedAt, onEditShipment }) { ... }
```

#### `DashboardWidget.jsx` (baru)

```jsx
/**
 * DashboardWidget Component
 * Presentation Layer — Reusable metric widget
 *
 * @param {{
 *   label: string,
 *   value: number,
 *   variant: 'default' | 'danger' | 'warning' | 'info',
 *   icon?: React.ReactNode,
 * }} props
 */
export default function DashboardWidget({ label, value, variant = 'default', icon }) { ... }
```

Variant mapping ke Tailwind classes:
- `default` → `bg-zinc-50 border-zinc-200 text-zinc-900`
- `danger` → `bg-red-50 border-red-200 text-red-700` (Overdue > 0)
- `warning` → `bg-amber-50 border-amber-200 text-amber-700` (Arriving Soon > 0)
- `info` → `bg-sky-50 border-sky-200 text-sky-700`

#### `ActionableList.jsx` (baru)

```jsx
/**
 * ActionableList Component
 * Presentation Layer — Daftar shipment berisiko
 *
 * @param {{
 *   items: ActionableItem[],
 *   onEditShipment: (shipmentId: number) => void,
 * }} props
 */
export default function ActionableList({ items, onEditShipment }) { ... }
```

#### `AlertBadge.jsx` (baru)

```jsx
/**
 * AlertBadge Component
 * Presentation Layer — Badge indikator alert di tabel shipment
 *
 * @param {{
 *   alerts: Alert[],
 *   highestRisk: RiskLevel | null,
 * }} props
 *
 * Tidak dirender jika alerts kosong atau highestRisk null.
 * Risk level → warna badge:
 * - 'high'   → bg-red-100 text-red-700 border-red-200
 * - 'medium' → bg-amber-100 text-amber-700 border-amber-200
 * - 'low'    → bg-zinc-100 text-zinc-600 border-zinc-200
 */
export default function AlertBadge({ alerts, highestRisk }) { ... }
```

Tooltip/popover menggunakan DaisyUI `tooltip` atau custom popover dengan `group-hover`.

#### Perubahan pada `ShipmentManager.jsx`

```jsx
// Tambahkan import
import DashboardSection from "./DashboardSection";

// Di dalam return, sebelum ShipmentTable:
<DashboardSection
  shipments={shipments}
  loading={loading}
  refresh={refresh}
  lastRefreshedAt={lastRefreshedAt}
  onEditShipment={handleOpenEdit}
/>

// ShipmentTable mendapat prop alertsByShipmentId untuk render AlertBadge:
<ShipmentTable
  // ... existing props ...
  alertsByShipmentId={alertsByShipmentId}
/>
```

#### Perubahan pada `ShipmentForm.jsx`

ETA menjadi required field:

```jsx
// Di validate():
if (!form.eta) newErrors.eta = "ETA wajib diisi";

// Di FormField ETA:
<FormField
  label="ETA"
  name="eta"
  type="date"
  value={form.eta}
  onChange={handleChange}
  required  // ← tambahkan
  error={errors.eta}
/>
```

#### Perubahan pada `shipment.js` entity

```js
// Di validateRequiredFields():
export function validateRequiredFields(input) {
  const required = ["blNumber", "shipperName", "consigneeName", "eta"]; // ← tambah "eta"
  const missingFields = required.filter((f) => !isRequiredFieldPresent(input?.[f]));
  return { valid: missingFields.length === 0, missingFields };
}
```

#### `useDashboard.js` (baru)

```js
/**
 * useDashboard Hook
 * Presentation Layer — Orchestrates dashboard state
 *
 * @param {Object[]} shipments       - Array shipment dari useShipments
 * @param {boolean}  loading         - Loading state dari useShipments
 * @param {Function} refresh         - Refresh function dari useShipments
 * @returns {{
 *   metrics: DashboardMetrics,
 *   actionableItems: ActionableItem[],
 *   alertsByShipmentId: Map<number, AlertResult>,
 *   lastRefreshedAt: Date|null,
 *   isRefreshing: boolean,
 *   manualRefresh: () => Promise<void>,
 * }}
 */
export function useDashboard({ shipments, loading, refresh }) { ... }
```

Hook ini menerima data dari `useShipments` sebagai props (bukan memanggil controller langsung), sehingga tidak ada duplikasi fetch. Setiap kali `shipments` berubah, hook ini menjalankan kedua engine dan menghitung ulang semua metrics.

#### Perubahan pada `useShipments.js`

Tambahkan `lastRefreshedAt` ke return value:

```js
// Tambahan di useShipments:
const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

// Di dalam refresh():
setLastRefreshedAt(new Date());

// Return value tambahan:
return {
  // ... existing fields ...
  lastRefreshedAt,  // Date|null
};
```

### Presentation Components

#### `DashboardSection.jsx` (baru)

```jsx
/**
 * DashboardSection Component
 * Presentation Layer — Feature component
 *
 * Section utama dashboard yang dirender di atas tabel shipment.
 * Menampilkan 4 widget metrik dan ActionableList.
 *
 * @param {{
 *   shipments: Object[],
 *   loading: boolean,
 *   refresh: () => Promise<void>,
 *   lastRefreshedAt: Date|null,
 *   onEditShipment: (shipment: Object) => void,
 * }} props
 */
export default function DashboardSection({ shipments, loading, refresh, lastRefreshedAt, onEditShipment }) { ... }
```

#### `DashboardWidget.jsx` (baru)

```jsx
/**
 * DashboardWidget Component
 * Presentation Layer — Reusable metric widget
 *
 * @param {{
 *   label: string,
 *   value: number,
 *   variant: 'default' | 'danger' | 'warning' | 'info',
 *   icon?: React.ReactNode,
 * }} props
 */
export default function DashboardWidget({ label, value, variant = 'default', icon }) { ... }
```

Variant mapping ke Tailwind classes:
- `default` → `bg-zinc-50 border-zinc-200 text-zinc-900`
- `danger` → `bg-red-50 border-red-200 text-red-700` (Overdue > 0)
- `warning` → `bg-amber-50 border-amber-200 text-amber-700` (Arriving Soon > 0)
- `info` → `bg-sky-50 border-sky-200 text-sky-700`

#### `ActionableList.jsx` (baru)

```jsx
/**
 * ActionableList Component
 * Presentation Layer — Daftar shipment berisiko
 *
 * @param {{
 *   items: ActionableItem[],
 *   onEditShipment: (shipmentId: number) => void,
 * }} props
 */
export default function ActionableList({ items, onEditShipment }) { ... }
```

#### `AlertBadge.jsx` (baru)

```jsx
/**
 * AlertBadge Component
 * Presentation Layer — Badge indikator alert di tabel shipment
 *
 * @param {{
 *   alerts: Alert[],
 *   highestRisk: 'high' | 'medium' | 'low' | null,
 * }} props
 */
export default function AlertBadge({ alerts, highestRisk }) { ... }
```

Badge tidak ditampilkan jika `alerts` kosong atau `highestRisk` null.

Risk level → warna badge:
- `high` → merah (`bg-red-100 text-red-700 border-red-200`)
- `medium` → kuning (`bg-amber-100 text-amber-700 border-amber-200`)
- `low` → abu-abu (`bg-zinc-100 text-zinc-600 border-zinc-200`)

Tooltip/popover menggunakan DaisyUI `tooltip` atau custom popover dengan `group-hover`.

#### Perubahan pada `ShipmentManager.jsx`

```jsx
// Tambahkan import
import DashboardSection from "./DashboardSection";

// Di dalam return, sebelum ShipmentTable:
<DashboardSection
  shipments={shipments}
  loading={loading}
  refresh={refresh}
  lastRefreshedAt={lastRefreshedAt}
  onEditShipment={handleOpenEdit}
/>

// ShipmentTable mendapat prop alertsByShipmentId untuk render AlertBadge:
<ShipmentTable
  // ... existing props ...
  alertsByShipmentId={alertsByShipmentId}
/>
```

#### Perubahan pada `ShipmentForm.jsx`

ETA menjadi required field:

```jsx
// Di validate():
if (!form.eta) newErrors.eta = "ETA wajib diisi";

// Di FormField ETA:
<FormField
  label="ETA"
  name="eta"
  type="date"
  value={form.eta}
  onChange={handleChange}
  required  // ← tambahkan
  error={errors.eta}
/>
```

#### Perubahan pada `shipment.js` entity

```js
// Di validateRequiredFields():
export function validateRequiredFields(input) {
  const required = ["blNumber", "shipperName", "consigneeName", "eta"]; // ← tambah "eta"
  const missingFields = required.filter((f) => !isRequiredFieldPresent(input?.[f]));
  return { valid: missingFields.length === 0, missingFields };
}
```

---

## Data Models

### Alert Rule IDs dan Risk Level Constants

```js
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

// Mapping ruleId → engine yang valid (untuk validasi di makeAlert)
export const RULE_ENGINE_MAP = Object.freeze({
  ETA_OVERDUE:           'shipment-status',
  ARRIVING_SOON:         'shipment-status',
  STALE_ENTRY:           'shipment-status',
  CUSTOM_DATE_OVERDUE:   'shipment-status',
  MISSING_ALL_CRITICAL:  'data-quality',
  MISSING_ETA_ONLY:      'data-quality',
  MISSING_VESSEL_OR_POD: 'data-quality',
});

export const RISK_LEVEL_ORDER = Object.freeze({
  high:   3,
  medium: 2,
  low:    1,
});
```

---

## Alert Engine Logic

### DataQualityAlertEngine — Pseudocode

```
function evaluateDataQualityAlerts(activeShipments, { now }):
  results = []

  for each shipment in activeShipments:
    if shipment.status !== 'active': continue

    hasEta = shipment.eta is not null and not empty
    hasVessel = shipment.vesselName is not null and not empty
    hasPod = shipment.portOfDischarge is not null and not empty

    alerts = []

    if NOT hasEta AND NOT hasVessel AND NOT hasPod:
      alerts.push({
        ruleId: 'MISSING_ALL_CRITICAL',
        riskLevel: 'high',
        message: 'ETA, nama kapal, dan port of discharge belum diisi — tracking tidak dapat dilakukan',
        suggestedAction: 'Edit shipment dan lengkapi semua data yang diperlukan',
        engine: 'data-quality',
      })

    else if NOT hasEta AND hasVessel AND hasPod:
      alerts.push({
        ruleId: 'MISSING_ETA_ONLY',
        riskLevel: 'medium',
        message: 'ETA belum diisi — tracking kedatangan tidak dapat dilakukan',
        suggestedAction: 'Edit shipment dan isi tanggal ETA',
        engine: 'data-quality',
      })

    else if hasEta AND (NOT hasVessel OR NOT hasPod):
      missingFields = []
      if NOT hasVessel: missingFields.push('nama kapal')
      if NOT hasPod: missingFields.push('port of discharge')
      alerts.push({
        ruleId: 'MISSING_VESSEL_OR_POD',
        riskLevel: 'low',
        message: `Data belum lengkap: ${missingFields.join(' dan ')} belum diisi`,
        suggestedAction: 'Edit shipment dan lengkapi data yang diperlukan',
        engine: 'data-quality',
      })

    if alerts.length > 0:
      results.push({
        shipmentId: shipment.id,
        alerts,
        highestRisk: getHighestRisk(alerts),
      })

  return results
```

### ShipmentStatusAlertEngine — Pseudocode

```
function evaluateShipmentStatusAlerts(activeShipments, { now }):
  results = []
  today = startOfDay(now)  // normalize ke midnight

  for each shipment in activeShipments:
    if shipment.status !== 'active': continue

    alerts = []

    // Rule 1: ETA Overdue
    if shipment.eta is not null:
      etaDate = startOfDay(parseDate(shipment.eta))
      if etaDate < today:
        alerts.push({
          ruleId: 'ETA_OVERDUE',
          riskLevel: 'high',
          message: 'ETA sudah terlewat — perbarui ETA atau periksa status kedatangan kapal',
          suggestedAction: 'Edit shipment dan perbarui ETA, atau terminasi jika sudah selesai',
          engine: 'shipment-status',
        })

      // Rule 2: Arriving Soon (hanya jika TIDAK overdue)
      else:
        daysUntilEta = diffInCalendarDays(etaDate, today)  // etaDate - today
        if daysUntilEta >= 1 AND daysUntilEta <= 3:
          alerts.push({
            ruleId: 'ARRIVING_SOON',
            riskLevel: 'medium',
            message: `Kapal tiba dalam ${daysUntilEta} hari — siapkan dokumen kepabeanan`,
            suggestedAction: 'Pastikan semua dokumen PIB/BC sudah siap sebelum kedatangan',
            engine: 'shipment-status',
          })

    // Rule 3: Stale Entry
    createdDate = startOfDay(parseDate(shipment.createdAt))
    daysSinceCreated = diffInCalendarDays(today, createdDate)  // today - createdDate
    isNeverUpdated = shipment.updatedAt === shipment.createdAt
    hasFutureEta = shipment.eta is not null AND startOfDay(parseDate(shipment.eta)) > addDays(today, 30)

    if daysSinceCreated > 30 AND isNeverUpdated AND NOT hasFutureEta:
      alerts.push({
        ruleId: 'STALE_ENTRY',
        riskLevel: 'low',
        message: 'Shipment belum diperbarui selama lebih dari 30 hari — verifikasi apakah data masih relevan',
        suggestedAction: 'Perbarui data shipment atau terminasi jika sudah tidak relevan',
        engine: 'shipment-status',
      })

    // Rule 4: Custom Date Overdue
    if shipment.customNotificationDate is not null:
      customDate = startOfDay(parseDate(shipment.customNotificationDate))
      if customDate < today:
        alerts.push({
          ruleId: 'CUSTOM_DATE_OVERDUE',
          riskLevel: 'medium',
          message: 'Tanggal notifikasi kustom sudah terlewat — tindak lanjut diperlukan',
          suggestedAction: 'Periksa catatan shipment dan ambil tindakan yang diperlukan, atau perbarui tanggal notifikasi',
          engine: 'shipment-status',
        })

    if alerts.length > 0:
      results.push({
        shipmentId: shipment.id,
        alerts,
        highestRisk: getHighestRisk(alerts),
      })

  return results
```

### Alert Aggregation (di `useDashboard`)

```
function aggregateAlerts(dataQualityResults, statusResults):
  // Merge by shipmentId
  mergedMap = new Map()

  for each result in [...dataQualityResults, ...statusResults]:
    if mergedMap.has(result.shipmentId):
      existing = mergedMap.get(result.shipmentId)
      existing.alerts = [...existing.alerts, ...result.alerts]
      existing.highestRisk = getHighestRisk(existing.alerts)
    else:
      mergedMap.set(result.shipmentId, { ...result })

  return mergedMap  // Map<shipmentId, AlertResult>
```

---

## Refresh Logic

`lastRefreshedAt` di-track di `useShipments` hook sebagai state `Date|null`. Timestamp diperbarui setiap kali `refresh()` selesai berhasil (di dalam `finally` block setelah `setLoading(false)`).

```
Lifecycle lastRefreshedAt:
  1. Initial mount → null (belum pernah refresh)
  2. refresh() dipanggil → loading = true
  3. Data berhasil dimuat → setLastRefreshedAt(new Date())
  4. loading = false
  5. Setiap mutasi (create/edit/terminate) memanggil refresh() → timestamp diperbarui otomatis
  6. Tombol refresh manual di DashboardSection memanggil refresh() dari useShipments
```

Format display timestamp di `DashboardSection`:
- Jika `lastRefreshedAt` null → "Belum dimuat"
- Jika < 1 menit lalu → "Baru saja"
- Jika < 60 menit lalu → "Diperbarui N menit lalu"
- Jika hari ini → "Diperbarui HH:MM:SS"
- Jika kemarin atau lebih → "Diperbarui DD MMM HH:MM"

Spinner ditampilkan saat `loading === true` dari `useShipments`.

---

## Mermaid Diagram — Data Flow

```mermaid
flowchart TD
    IDB[(IndexedDB)]
    Repo[indexeddb.service]
    Controller[shipment.controller]
    UseShipments[useShipments hook]
    UseDashboard[useDashboard hook]
    DQEngine[evaluateDataQualityAlerts]
    SSEngine[evaluateShipmentStatusAlerts]
    Aggregate[aggregateAlerts]
    DashboardSection[DashboardSection]
    Widgets[DashboardWidget x4]
    ActionableList[ActionableList]
    ShipmentTable[ShipmentTable]
    AlertBadge[AlertBadge]

    IDB --> Repo
    Repo --> Controller
    Controller --> UseShipments
    UseShipments -->|shipments, loading, lastRefreshedAt| UseDashboard
    UseShipments -->|shipments, loading| ShipmentTable
    UseDashboard -->|activeShipments| DQEngine
    UseDashboard -->|activeShipments| SSEngine
    DQEngine -->|AlertResult[]| Aggregate
    SSEngine -->|AlertResult[]| Aggregate
    Aggregate -->|Map shipmentId→AlertResult| UseDashboard
    UseDashboard -->|metrics| Widgets
    UseDashboard -->|actionableItems| ActionableList
    UseDashboard -->|alertsByShipmentId| DashboardSection
    DashboardSection --> Widgets
    DashboardSection --> ActionableList
    ShipmentTable -->|alertsByShipmentId| AlertBadge
```

---


## Correctness Properties

*A property adalah karakteristik atau perilaku yang harus berlaku di semua eksekusi valid sebuah sistem — secara formal, pernyataan tentang apa yang seharusnya dilakukan sistem. Properties menjembatani spesifikasi yang bisa dibaca manusia dengan jaminan kebenaran yang bisa diverifikasi mesin.*

**Property Reflection sebelum penulisan:**

- 1.2 (total active count) dan 12.3 (terminated tidak muncul di widget) dapat digabung menjadi satu property tentang widget count yang hanya menghitung shipment aktif.
- 4.1 (overdue alert high) dan 4.2+4.3 (pesan overdue) dapat digabung — satu property yang memverifikasi alert overdue lengkap (risk level + pesan).
- 5.1 (arriving soon alert medium) dan 5.2 (pesan hari tersisa) dapat digabung — satu property yang memverifikasi alert arriving soon lengkap.
- 6.1, 6.2, 6.3 (data quality risk levels) dapat digabung menjadi satu property tentang risk level mapping berdasarkan kombinasi field kosong.
- 6.4+6.5 (pesan dan aksi data quality) dapat digabung dengan property di atas.
- 9.4 (sort by risk) dan 2.1 (actionable list sorted) adalah property yang sama — digabung.
- 9.6 (highest risk aggregation) dan 10.2 (badge color) keduanya bergantung pada `getHighestRisk()` — digabung menjadi satu property tentang fungsi tersebut.
- 12.2 (terminated tidak dievaluasi) adalah duplikat dari 9.7 — dihapus.
- 12.4 (record tetap di IndexedDB setelah terminate) sudah dicakup oleh spec shipment-management — tidak diulang di sini.

---

### Property 1: Widget count hanya menghitung shipment aktif

*For any* array shipment dengan campuran status `active` dan `terminated`, nilai yang dikembalikan oleh `computeMetrics()` untuk `totalActive` harus sama persis dengan jumlah shipment yang memiliki `status === 'active'`. Shipment dengan status `terminated` tidak boleh dihitung.

**Validates: Requirements 1.2, 12.3**

---

### Property 2: Widget "Arriving Soon" menghitung dengan benar

*For any* array shipment aktif dengan ETA yang bervariasi, nilai `arrivingSoon` dari `computeMetrics()` harus sama persis dengan jumlah shipment yang memiliki ETA dalam rentang [today+1, today+3] (inklusif, dalam hari kalender). Shipment dengan ETA hari ini, kemarin, atau lebih dari 3 hari ke depan tidak boleh dihitung.

**Validates: Requirements 1.3**

---

### Property 3: Widget "Overdue" menghitung dengan benar

*For any* array shipment aktif dengan ETA yang bervariasi, nilai `overdue` dari `computeMetrics()` harus sama persis dengan jumlah shipment aktif yang memiliki ETA sebelum hari ini (strictly less than today, normalized ke midnight). Shipment tanpa ETA tidak boleh dihitung sebagai overdue.

**Validates: Requirements 1.4, 4.4**

---

### Property 4: Alert overdue lengkap dan benar

*For any* shipment aktif dengan ETA yang sudah lewat (ETA < today), `evaluateShipmentStatusAlerts()` harus menghasilkan tepat satu alert dengan `ruleId === 'ETA_OVERDUE'`, `riskLevel === 'high'`, dan `message` yang tidak kosong. Untuk shipment aktif yang sama, tidak boleh ada alert dengan `ruleId === 'ARRIVING_SOON'`.

**Validates: Requirements 4.1, 4.2, 4.3, 5.4**

---

### Property 5: Alert arriving soon lengkap dan benar

*For any* shipment aktif dengan ETA dalam rentang [today+1, today+3], `evaluateShipmentStatusAlerts()` harus menghasilkan tepat satu alert dengan `ruleId === 'ARRIVING_SOON'`, `riskLevel === 'medium'`, dan `message` yang mengandung jumlah hari tersisa yang benar (angka antara 1 dan 3). Untuk shipment aktif yang sama, tidak boleh ada alert dengan `ruleId === 'ETA_OVERDUE'`.

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 6: Overdue dan Arriving Soon saling eksklusif

*For any* shipment aktif dengan ETA yang valid, `evaluateShipmentStatusAlerts()` tidak boleh menghasilkan alert `ETA_OVERDUE` dan `ARRIVING_SOON` sekaligus untuk shipment yang sama. Keduanya adalah kondisi yang mutually exclusive.

**Validates: Requirements 5.4**

---

### Property 7: DataQualityAlertEngine — risk level sesuai kombinasi field kosong

*For any* shipment aktif, `evaluateDataQualityAlerts()` harus memetakan kombinasi field kosong ke risk level yang benar:
- ETA kosong AND vesselName kosong AND portOfDischarge kosong → `high`
- ETA kosong AND vesselName terisi AND portOfDischarge terisi → `medium`
- ETA terisi AND (vesselName kosong OR portOfDischarge kosong) → `low`
- Semua field terisi → tidak ada alert data quality

Pesan alert harus menyebutkan nama field yang kosong.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

---

### Property 8: Alert stale entry hanya untuk shipment yang benar-benar stale

*For any* shipment aktif, `evaluateShipmentStatusAlerts()` harus menghasilkan alert `STALE_ENTRY` dengan `riskLevel === 'low'` jika dan hanya jika:
1. `createdAt` lebih dari 30 hari yang lalu, DAN
2. `updatedAt === createdAt` (tidak pernah diperbarui), DAN
3. ETA tidak ada atau ETA tidak lebih dari 30 hari ke depan.

Jika salah satu kondisi tidak terpenuhi, tidak boleh ada alert `STALE_ENTRY`.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

---

### Property 9: Alert custom date overdue benar

*For any* shipment aktif dengan `customNotificationDate` yang sudah lewat (< today), `evaluateShipmentStatusAlerts()` harus menghasilkan tepat satu alert dengan `ruleId === 'CUSTOM_DATE_OVERDUE'` dan `riskLevel === 'medium'`. Untuk shipment aktif tanpa `customNotificationDate` (null), tidak boleh ada alert `CUSTOM_DATE_OVERDUE`.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

---

### Property 10: Engine tidak mengevaluasi shipment terminated

*For any* array yang mengandung campuran shipment aktif dan terminated, kedua engine (`evaluateDataQualityAlerts` dan `evaluateShipmentStatusAlerts`) tidak boleh menghasilkan `AlertResult` untuk shipment dengan `status === 'terminated'`. Output hanya boleh berisi entries untuk shipment aktif.

**Validates: Requirements 9.7, 12.2**

---

### Property 11: Aggregasi alert dari kedua engine lengkap

*For any* set shipment yang memicu alert di kedua engine sekaligus, hasil `aggregateAlerts(dataQualityResults, statusResults)` harus mengandung semua alert dari kedua engine untuk setiap shipment. Tidak ada alert yang boleh hilang dalam proses merge.

**Validates: Requirements 9.3, 9.5**

---

### Property 12: Sorting alert berdasarkan risk level

*For any* array `ActionableItem[]` dengan risk level yang bervariasi, daftar yang dihasilkan harus diurutkan sehingga semua item dengan `highestRisk === 'high'` muncul sebelum `'medium'`, dan `'medium'` sebelum `'low'`. Urutan relatif antar item dengan risk level yang sama boleh bebas.

**Validates: Requirements 2.1, 9.4**

---

### Property 13: `getHighestRisk` mengembalikan risk level tertinggi

*For any* array `Alert[]` dengan risk level yang bervariasi, `getHighestRisk(alerts)` harus mengembalikan risk level dengan nilai tertinggi dalam urutan `high > medium > low`. Untuk array kosong, harus mengembalikan `null`.

**Validates: Requirements 9.6, 10.2**

---

### Property 14: Alert badge hadir jika dan hanya jika ada alert

*For any* shipment, `AlertBadge` harus ditampilkan (rendered, bukan hidden) jika dan hanya jika shipment tersebut memiliki setidaknya satu alert aktif. Warna badge harus sesuai dengan `highestRisk` dari semua alert aktif shipment tersebut.

**Validates: Requirements 10.1, 10.2, 10.4**

---

### Property 15: lastRefreshedAt selalu diperbarui setelah refresh

*For any* urutan operasi (create, edit, terminate, atau manual refresh), nilai `lastRefreshedAt` setelah operasi harus lebih besar atau sama dengan nilai `lastRefreshedAt` sebelum operasi. Timestamp tidak boleh mundur.

**Validates: Requirements 3.3, 3.6**

---

## Error Handling

| Skenario | Penanganan |
|---|---|
| ETA tidak diisi saat create/edit | Validasi di `validateRequiredFields()` entity + UI error di `ShipmentForm` |
| Engine menerima array kosong | Kedua engine mengembalikan `[]` tanpa error |
| Shipment dengan `id === null` | Engine skip shipment tersebut (defensive check) |
| `eta` bukan ISO date yang valid | Engine skip rule yang bergantung pada ETA untuk shipment tersebut |
| `createdAt`/`updatedAt` tidak valid | Stale entry rule di-skip untuk shipment tersebut |
| `useDashboard` menerima `shipments` null/undefined | Diperlakukan sebagai array kosong, metrics semua 0 |
| Refresh gagal (IndexedDB error) | Error ditangani di `useShipments`, `lastRefreshedAt` tidak diperbarui |

Kedua engine adalah pure functions — mereka tidak throw exception. Semua error handling dilakukan secara defensif di dalam engine dengan early return/skip.

---

## Testing Strategy

### Unit Tests (example-based)

Fokus pada skenario spesifik dan edge cases:

**DataQualityAlertEngine:**
- Shipment dengan semua field terisi → tidak ada alert
- Shipment dengan ETA, vessel, POD semua kosong → alert `high`
- Shipment dengan hanya ETA kosong → alert `medium`
- Shipment dengan ETA terisi tapi vessel kosong → alert `low`
- Shipment dengan status `terminated` → tidak ada alert

**ShipmentStatusAlertEngine:**
- Shipment dengan ETA kemarin → alert `ETA_OVERDUE` high
- Shipment dengan ETA besok → alert `ARRIVING_SOON` medium, pesan "1 hari"
- Shipment dengan ETA 3 hari lagi → alert `ARRIVING_SOON` medium, pesan "3 hari"
- Shipment dengan ETA 4 hari lagi → tidak ada arriving soon alert
- Shipment dengan ETA hari ini → tidak ada overdue, tidak ada arriving soon
- Shipment dibuat 31 hari lalu, tidak pernah diupdate, ETA null → alert `STALE_ENTRY`
- Shipment dibuat 31 hari lalu, tapi ETA 60 hari ke depan → tidak ada stale alert
- Shipment dengan customNotificationDate kemarin → alert `CUSTOM_DATE_OVERDUE`
- Shipment tanpa customNotificationDate → tidak ada custom date alert

**Aggregation & Sorting:**
- Shipment yang trigger dua engine sekaligus → semua alert muncul
- `getHighestRisk(['low', 'medium', 'high'])` → `'high'`
- `getHighestRisk([])` → `null`
- Sort `[medium, high, low, high]` → `[high, high, medium, low]`

**computeMetrics:**
- Array kosong → semua 0
- 3 active + 2 terminated → totalActive = 3
- 2 overdue + 1 arriving soon + 1 future → overdue=2, arrivingSoon=1

### Property-Based Tests

Gunakan **fast-check** dengan minimum **100 iterasi per property**.

Setiap test diberi tag:
```js
// Feature: dashboard-smart-alert, Property N: <property text>
```

| Property | fast-check Arbitraries |
|---|---|
| P1: Widget count hanya aktif | `fc.array(fc.record({ status: fc.constantFrom('active','terminated'), ... }))` |
| P2: Arriving Soon count benar | `fc.array(fc.record({ status: fc.constant('active'), eta: fc.option(fc.date()) }))` + `fc.date()` untuk `now` |
| P3: Overdue count benar | Same as P2 |
| P4: Alert overdue lengkap | `fc.record({ status: fc.constant('active'), eta: fc.date({ max: yesterday }) })` |
| P5: Alert arriving soon lengkap | `fc.record({ status: fc.constant('active'), eta: fc.date({ min: tomorrow, max: in3days }) })` |
| P6: Overdue dan Arriving Soon eksklusif | `fc.record({ status: fc.constant('active'), eta: fc.option(fc.date()) })` |
| P7: DataQuality risk level mapping | `fc.record({ status: fc.constant('active'), eta: fc.option(fc.string()), vesselName: fc.option(fc.string()), portOfDischarge: fc.option(fc.string()) })` |
| P8: Stale entry kondisi benar | `fc.record({ status: fc.constant('active'), createdAt: fc.date(), updatedAt: fc.date(), eta: fc.option(fc.date()) })` |
| P9: Custom date overdue benar | `fc.record({ status: fc.constant('active'), customNotificationDate: fc.option(fc.date()) })` |
| P10: Engine skip terminated | `fc.array(fc.record({ status: fc.constantFrom('active','terminated'), ... }))` |
| P11: Aggregasi lengkap | `fc.array(fc.record(...))` yang trigger kedua engine |
| P12: Sorting risk level | `fc.array(fc.record({ highestRisk: fc.constantFrom('high','medium','low') }))` |
| P13: getHighestRisk benar | `fc.array(fc.constantFrom('high','medium','low'))` |
| P14: AlertBadge hadir iff ada alert | `fc.array(fc.record({ ruleId: fc.string(), riskLevel: fc.constantFrom('high','medium','low') }))` |
| P15: lastRefreshedAt tidak mundur | `fc.array(fc.constantFrom('create','edit','terminate','refresh'))` sebagai urutan operasi |

**Konfigurasi fast-check:**
```js
import fc from 'fast-check';

// Minimum 100 iterasi
fc.assert(fc.property(...), { numRuns: 100 });

// Untuk property yang melibatkan tanggal, gunakan seed yang konsisten di CI:
fc.assert(fc.property(...), { numRuns: 200, seed: 42 });
```

### Integration Tests

- `useDashboard` hook: render dengan `shipments` yang berubah, verifikasi metrics diperbarui
- `DashboardSection` + `useShipments`: full integration dengan `fake-indexeddb`, verifikasi dashboard update setelah create/terminate
- `ShipmentTable` + `AlertBadge`: verifikasi badge muncul di baris yang benar setelah engine evaluation

### Component Tests

- `DashboardWidget` renders dengan variant `danger` → class merah diterapkan
- `DashboardWidget` renders dengan variant `warning` → class kuning diterapkan
- `ActionableList` dengan items kosong → pesan "Semua shipment dalam kondisi baik"
- `ActionableList` dengan items → semua fields (shipment number, ETA, risk, alerts) ditampilkan
- `AlertBadge` dengan alerts kosong → tidak dirender
- `AlertBadge` dengan alert `high` → badge merah
- `DashboardSection` menampilkan spinner saat `loading === true`
- `DashboardSection` menampilkan timestamp saat `lastRefreshedAt` tidak null
- `ShipmentForm` dengan ETA kosong → error validasi ditampilkan
