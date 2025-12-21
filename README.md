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
