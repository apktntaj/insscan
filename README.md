# 📦 InsScan - Shipment ETA Tracking Platform

Platform pelacakan shipment yang membantu staff operasional PPJK / Freight Forwarder untuk:

- **Upload Bill of Lading** → Sistem otomatis mengisi form shipment
- **Menyimpan data shipment** → Dengan kemampuan edit sebelum disimpan
- **Auto-fetch & update ETA** → Sistem otomatis mencari dan memperbaharui jadwal ETA
- **Generate Excel** → Untuk keperluan submit dokumen ke Bea Cukai

## 🚀 Status Proyek

🟡 **Dalam Pengembangan** — MVP Phase 1

## ✨ Fitur

| Fitur                                  | Status         |
| -------------------------------------- | -------------- |
| Upload Bill of Lading & Auto-Fill Form | 🔄 In Progress |
| Auto-Fetch ETA                         | 🔄 In Progress |
| Periodic ETA Update                    | ⏳ Planned     |
| Shipment Dashboard                     | ⏳ Planned     |
| Generate Excel untuk Bea Cukai         | ⏳ Planned     |

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Architecture:** Clean Architecture

## 📁 Struktur Proyek

```
app/
├── adapters/          # Controllers & Presenters
├── api/               # API Routes
├── core/              # Entities, Ports, Use Cases
├── infrastructure/    # External Services (API, Excel)
└── presentation/      # UI Components
```

## 🏃 Cara Menjalankan

### Prasyarat

- Node.js 18+
- npm / yarn / pnpm

### Instalasi

```bash
# Clone repository
git clone <repository-url>
cd insscan

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Production Build

```bash
npm run build
npm start
```

## 📖 Dokumentasi

- [PRD (Product Requirements Document)](docs/PRD.md)
- [Technical Requirements](docs/TECHNICAL_REQUIREMENTS.md)

## 📝 Lisensi

Private - All rights reserved

## Environment (HS Code Source)

Untuk menghindari token INSW yang berubah setiap hari, jalankan mode publik:

```bash
INSW_PUBLIC_ONLY_MODE=true
```

Catatan:
- Jika `INSW_PUBLIC_ONLY_MODE=true`, aplikasi tidak akan memakai endpoint CMS ber-token.
- Aplikasi akan mencoba endpoint publik detail HS code terlebih dulu, lalu fallback ke endpoint publik list.
- Field tarif/LARTAS yang tersedia bergantung pada respons endpoint publik INSW saat itu.

## Mock Data (Detail Komoditas)

Untuk belajar struktur data dan mengurangi fetch berulang ke INSW:

- File mock: `app/infrastructure/mocks/insw-detail-komoditas.mock.json`
- Aktifkan mode mock lokal:

```bash
INSW_USE_LOCAL_MOCK=true
```

Opsional:
- `INSW_MOCK_ONLY_MODE=true` → hanya baca file mock, tanpa fallback fetch live.
- `INSW_MOCK_FILE_PATH=...` → ganti path file mock.
