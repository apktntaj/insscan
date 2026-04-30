# Implementation Plan: Dashboard & Smart Alert

## Overview

Implementasi fitur Dashboard & Smart Alert mengikuti urutan dependency: core layer (entities + use cases) → presentation hooks → presentation components → modifikasi existing components. Semua evaluasi alert dilakukan secara sinkron di sisi klien tanpa backend baru.

## Tasks

- [x] 1. Modifikasi `shipment.js` entity — tambah ETA ke required fields
  - Tambahkan `"eta"` ke array `required` di fungsi `validateRequiredFields()`
  - Pastikan return shape tetap `{ valid: boolean, missingFields: string[] }`
  - _Requirements: 6.1 (prerequisite ETA mandatory)_

- [ ] 2. Implementasi `evaluate-data-quality-alerts.js`
  - [x] 2.1 Buat file `app/core/use-cases/evaluate-data-quality-alerts.js` dengan constants dan factory functions
    - Definisikan `ALERT_RULE_IDS`, `RULE_ENGINE_MAP`, dan `RISK_LEVEL_ORDER` sebagai frozen objects
    - Implementasikan `getHighestRisk(alerts)` — helper yang mengembalikan risk level tertinggi dari array alerts, atau `null` jika kosong
    - Implementasikan `makeAlert(ruleId, shipmentId, riskLevel, message, suggestedAction, engine)` — factory function dengan validasi ruleId-engine consistency, return `{ ok, data/error }`
    - Implementasikan `makeAlertResult(shipmentId, alerts)` — factory function yang menghitung `highestRisk` otomatis, return `{ ok, data/error }`
    - Setiap fungsi harus punya JSDoc + 2 examples sesuai konvensi
    - _Requirements: 9.6, 10.2_
  - [x] 2.2 Implementasikan `evaluateDataQualityAlerts(shipments, { now })` di file yang sama
    - Skip shipment dengan `status !== 'active'`
    - Rule `MISSING_ALL_CRITICAL` (high): ETA kosong AND vesselName kosong AND portOfDischarge kosong
    - Rule `MISSING_ETA_ONLY` (medium): ETA kosong AND vesselName terisi AND portOfDischarge terisi
    - Rule `MISSING_VESSEL_OR_POD` (low): ETA terisi AND (vesselName kosong OR portOfDischarge kosong) — pesan menyebutkan field mana yang kosong
    - Gunakan `makeAlert()` dan `makeAlertResult()` untuk konstruksi output
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.7_
  - [x] 2.3 Tulis property test untuk `getHighestRisk` (Property 13)
    - **Property 13: `getHighestRisk` mengembalikan risk level tertinggi**
    - **Validates: Requirements 9.6, 10.2**
  - [ ] 2.4 Tulis property test untuk `evaluateDataQualityAlerts` (Property 7 dan Property 10)
    - **Property 7: DataQualityAlertEngine — risk level sesuai kombinasi field kosong**
    - **Property 10: Engine tidak mengevaluasi shipment terminated**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 9.7**

- [ ] 3. Implementasi `evaluate-shipment-status-alerts.js`
  - [x] 3.1 Buat file `app/core/use-cases/evaluate-shipment-status-alerts.js` dengan wish list helpers
    - Implementasikan `startOfDay(date)` — normalize date ke midnight local timezone
    - Implementasikan `parseISODate(isoString)` — parse ISO string secara aman, return `null` jika invalid
    - Implementasikan `diffCalendarDays(dateA, dateB)` — selisih hari kalender (dateA - dateB)
    - Implementasikan `isOverdue(etaDate, today)` — true jika etaDate strictly before today
    - Implementasikan `isArrivingSoon(etaDate, today)` — true jika ETA dalam rentang [today+1, today+3]
    - Implementasikan `isStaleEntry(shipment, today)` — true jika dibuat >30 hari lalu, tidak pernah diupdate, ETA tidak jauh ke depan
    - Setiap helper harus punya JSDoc + 2 examples
    - _Requirements: 4.1, 5.1, 7.1, 8.1_
  - [x] 3.2 Implementasikan `evaluateShipmentStatusAlerts(shipments, { now })` di file yang sama
    - Skip shipment dengan `status !== 'active'`
    - Rule `ETA_OVERDUE` (high): ETA ada dan sudah lewat — mutually exclusive dengan ARRIVING_SOON
    - Rule `ARRIVING_SOON` (medium): ETA dalam [today+1, today+3] — pesan menyebutkan jumlah hari tersisa
    - Rule `STALE_ENTRY` (low): gunakan `isStaleEntry()` helper
    - Rule `CUSTOM_DATE_OVERDUE` (medium): customNotificationDate ada dan sudah lewat
    - Gunakan `makeAlert()` dan `makeAlertResult()` dari file `evaluate-data-quality-alerts.js`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 9.7_
  - [ ] 3.3 Tulis property test untuk `evaluateShipmentStatusAlerts` (Property 4, 5, 6, 8, 9, 10)
    - **Property 4: Alert overdue lengkap dan benar**
    - **Property 5: Alert arriving soon lengkap dan benar**
    - **Property 6: Overdue dan Arriving Soon saling eksklusif**
    - **Property 8: Alert stale entry hanya untuk shipment yang benar-benar stale**
    - **Property 9: Alert custom date overdue benar**
    - **Property 10: Engine tidak mengevaluasi shipment terminated**
    - **Validates: Requirements 4.1–4.4, 5.1–5.4, 7.1–7.4, 8.1–8.4, 9.7**

- [ ] 4. Checkpoint — core use cases selesai
  - Pastikan semua tests pass. Tanyakan ke user jika ada pertanyaan sebelum lanjut ke presentation layer.

- [x] 5. Modifikasi `useShipments.js` — expose `lastRefreshedAt`
  - Tambahkan state `const [lastRefreshedAt, setLastRefreshedAt] = useState(null)`
  - Di dalam fungsi `refresh()`, panggil `setLastRefreshedAt(new Date())` setelah data berhasil dimuat (di `finally` block setelah `setLoading(false)`)
  - Tambahkan `lastRefreshedAt` ke return value hook
  - _Requirements: 3.1, 3.3, 3.6_

- [ ] 6. Buat `useDashboard.js` hook
  - [x] 6.1 Buat file `app/presentation/hooks/useDashboard.js`
    - Implementasikan `formatRefreshTimestamp(timestamp, now)` sebagai helper — format: null→"Belum dimuat", <1 menit→"Baru saja", <60 menit→"Diperbarui N menit lalu", hari ini→"Diperbarui HH:MM:SS"
    - Implementasikan `diffMinutes(dateA, dateB)` sebagai wish list helper untuk `formatRefreshTimestamp`
    - Implementasikan `aggregateAlerts(dataQualityResults, statusResults)` — merge `AlertResult[]` dari kedua engine ke `Map<number, AlertResult>`, gunakan `mergeAlertResults()` helper
    - Implementasikan `mergeAlertResults(existing, incoming)` sebagai wish list helper untuk `aggregateAlerts`
    - Implementasikan `computeMetrics(shipments, alertsByShipmentId, now)` — hitung `totalActive`, `arrivingSoon`, `overdue`, `needsAttention`
    - Setiap fungsi harus punya JSDoc + 2 examples
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.1, 3.1_
  - [x] 6.2 Implementasikan `useDashboard({ shipments, loading, refresh })` hook
    - Jalankan kedua engine setiap kali `shipments` berubah (gunakan `useMemo` atau `useEffect`)
    - Hitung `metrics` via `computeMetrics()`
    - Bangun `actionableItems` dari `alertsByShipmentId` — filter shipment dengan alert medium/high, sort high→medium→low
    - Track `lastRefreshedAt` dan `isRefreshing` state
    - Expose `manualRefresh()` yang memanggil `refresh()` dari `useShipments`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.1, 3.1, 3.2, 3.4, 3.5, 9.1, 9.2, 9.3, 9.4_
  - [ ] 6.3 Tulis property test untuk `computeMetrics` (Property 1, 2, 3)
    - **Property 1: Widget count hanya menghitung shipment aktif**
    - **Property 2: Widget "Arriving Soon" menghitung dengan benar**
    - **Property 3: Widget "Overdue" menghitung dengan benar**
    - **Validates: Requirements 1.2, 1.3, 1.4, 12.3**
  - [ ] 6.4 Tulis property test untuk `aggregateAlerts` dan sorting (Property 11, 12)
    - **Property 11: Aggregasi alert dari kedua engine lengkap**
    - **Property 12: Sorting alert berdasarkan risk level**
    - **Validates: Requirements 2.1, 9.3, 9.4, 9.5**

- [ ] 7. Checkpoint — hooks selesai
  - Pastikan semua tests pass. Tanyakan ke user jika ada pertanyaan sebelum lanjut ke components.

- [x] 8. Buat `AlertBadge.jsx` component
  - Buat file `app/presentation/components/features/AlertBadge.jsx`
  - Tidak dirender jika `alerts` kosong atau `highestRisk` null
  - Risk level → warna badge: `high`→merah, `medium`→kuning, `low`→abu-abu (sesuai Tailwind classes di design)
  - Tooltip/popover dengan daftar singkat alert aktif menggunakan DaisyUI `tooltip` atau custom `group-hover`
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 9. Buat `DashboardWidget.jsx` component
  - Buat file `app/presentation/components/features/DashboardWidget.jsx`
  - Props: `label`, `value`, `variant` (`default`|`danger`|`warning`|`info`), `icon` (optional)
  - Variant mapping ke Tailwind classes sesuai design: default→zinc, danger→red, warning→amber, info→sky
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 10. Buat `ActionableList.jsx` component
  - Buat file `app/presentation/components/features/ActionableList.jsx`
  - Tampilkan pesan "Semua shipment dalam kondisi baik" jika `items` kosong
  - Untuk setiap item: shipment number, alias (jika ada), ETA, risk level badge, daftar alert beserta `suggestedAction`
  - Klik item memanggil `onEditShipment(shipmentId)`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 11. Buat `DashboardSection.jsx` component
  - Buat file `app/presentation/components/features/DashboardSection.jsx`
  - Gunakan `useDashboard({ shipments, loading, refresh })` hook
  - Render 4 `DashboardWidget`: Total Aktif (default), Arriving Soon (warning jika >0), Overdue (danger jika >0), Perlu Perhatian (info)
  - Render `ActionableList` dengan `actionableItems` dari hook
  - Tampilkan `Refresh_Indicator`: spinner saat `isRefreshing`, timestamp dari `formatRefreshTimestamp`
  - Render tombol refresh manual yang memanggil `manualRefresh()`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 11.1, 11.2, 11.4, 11.5_

- [x] 12. Modifikasi `ShipmentTable.jsx` — render `AlertBadge` per baris
  - Tambahkan prop `alertsByShipmentId: Map<number, AlertResult>` ke komponen
  - Untuk setiap baris shipment, ambil `alertsByShipmentId.get(shipment.id)` dan render `AlertBadge` jika ada alerts
  - Import `AlertBadge` dari file yang sudah dibuat
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 13. Modifikasi `ShipmentForm.jsx` — ETA menjadi required field
  - Di fungsi `validate()`, tambahkan: `if (!form.eta) newErrors.eta = "ETA wajib diisi"`
  - Di `FormField` ETA, tambahkan prop `required` dan `error={errors.eta}`
  - _Requirements: 6.1 (prerequisite ETA mandatory di UI)_

- [x] 14. Modifikasi `ShipmentManager.jsx` — integrasi DashboardSection
  - Import `DashboardSection` dari `./DashboardSection`
  - Destructure `lastRefreshedAt` dari `useShipments()` (sudah ditambahkan di task 5)
  - Render `<DashboardSection>` di atas `<ShipmentTable>` dengan props: `shipments`, `loading`, `refresh`, `lastRefreshedAt`, `onEditShipment={handleOpenEdit}`
  - Pass `alertsByShipmentId` ke `<ShipmentTable>` — ambil dari `useDashboard` yang sudah dijalankan di `DashboardSection`
    - Alternatif: lift `useDashboard` ke `ShipmentManager` dan pass `alertsByShipmentId` ke kedua komponen
  - _Requirements: 1.1, 1.8, 11.1, 11.2, 11.3, 11.6, 12.1, 12.2, 12.3_

- [x] 15. Update `app/presentation/components/index.js` — export komponen baru
  - Tambahkan export untuk `DashboardSection`, `DashboardWidget`, `ActionableList`, `AlertBadge`
  - _Requirements: 11.1_

- [ ] 16. Final checkpoint — Pastikan semua tests pass
  - Pastikan semua tests pass. Tanyakan ke user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan bisa dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Property tests menggunakan **fast-check** dengan minimum 100 iterasi per property
- `makeAlert()` dan `makeAlertResult()` diekspor dari `evaluate-data-quality-alerts.js` dan diimpor oleh `evaluate-shipment-status-alerts.js`
- `useDashboard` menerima data dari `useShipments` sebagai props — tidak ada akses langsung ke IndexedDB dari dashboard
- Semua alert engine adalah pure functions — tidak ada side effects, tidak throw exception
