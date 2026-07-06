# ShipmentManager Component

**Lokasi:** `app/presentation/components/features/ShipmentManager.jsx`
**Arsitektur:** Next.js App Router — Client Component

## Ringkasan

Komponen akar (root) untuk fitur Manajemen Shipment dalam arsitektur Next.js App Router. Ditandai dengan `"use client"` karena menggunakan state, efek, dan hooks interaktif — tidak bisa di-render di server.

Komponen ini bersifat **orchestrator**: tidak menghasilkan data sendiri, melainkan mengonsumsi dari custom hooks dan meneruskannya ke child components presentasional.

## State & Perilaku Khas Next.js

| Aspek | Penjelasan Next.js |
|---|---|
| `"use client"` | Menandakan batas client-server. Semua child components (`ShipmentTable`, `ShipmentForm`, dll.) juga client component secara implisit. |
| State lokal | Semua state (`formOpen`, `editTarget`, dll.) hidup di client — tidak ada server state yang di-streaming. |
| `useEffect` untuk notifikasi | Polling `shipmentController.startNotifications()` berjalan eksklusif di browser. Cleanup `stopNotifications` mencegah kebocoran memori saat komponen unmount. |
| Tidak ada RSC / Server Action | Data di-fetch dan dimutasi murni via hooks di sisi client, bukan lewat Server Actions atau RSC data fetching. |

## Dependency Graph (imports)

- **Custom hooks:** `useShipments`, `useDashboard`
- **Child components:** `ShipmentTable`, `ShipmentForm`, `ShipmentExportButton`, `DashboardSection`
- **Controller:** `shipmentController` dari adapters layer
- **Konstanta:** `MAX_RECORD_LIMIT` dari core use case

## Alur CRUD (Client-side)

1. **Create** → klik "New Shipment" → `formOpen = true` → modal create → `createShipment(data)` via hook
2. **Edit** → klik edit di tabel/dashboard → `editTarget = shipment` → modal pre-filled → `editShipment(id, data)` via hook
3. **Terminate** → klik terminate di tabel → `terminateShipment(id)` via hook
4. **Export** → klik export → `exportShipments()` → setelah sukses, seluruh record dibersihkan

Semua mutasi data terjadi di sisi client. Tidak ada Server Action atau API route yang dipanggil secara langsung dari komponen ini — semuanya diabstraksi oleh custom hooks dan controller.

## Threshold & Limitasi

- `MAX_RECORD_LIMIT` dari `core/use-cases/create-shipment`
- `atLimit` → tombol "New Shipment" disabled + banner merah
- `nearLimit` (≥90%) → banner amber
- Tombol export disabled saat `count === 0`

## Struktur Render

```
Header (judul + counter badge + tombol export + "New Shipment")
  ↓
Banner limit warning (merah/amber sesuai threshold)
  ↓
Success message banner (hijau, hilang 3,5 detik)
  ↓
Fallback in-app notification (biru, bisa ditutup)
  ↓
Error state banner (merah)
  ↓
DashboardSection
  ↓
ShipmentTable (pencarian + edit/terminate + alert indicator)
  ↓
ShipmentForm (modal create/edit, dipilih via editTarget)
```

## Catatan

- `setTimeout` di `showSuccess` tidak di-cleanup — jika komponen unmount sebelum 3,5 detik, `setState` akan berjalan pada unmounted component. Di Next.js ini hanya menghasilkan warning development, tidak mempengaruhi production.
- Beberapa state (`modeSelectorOpen`, `inAppNotification`) dideklarasikan tetapi belum digunakan di JSX — kemungkinan sisa pengembangan atau antisipasi fitur mendatang.
