# Pesisir

Platform operasional berbasis browser untuk staf PPJK dan freight forwarder di Indonesia. Dibuat untuk mengurangi kerja manual dalam pengecekan regulasi impor dan pengelolaan data shipment.

## Fitur

| Fitur | Status |
|---|---|
| Cek LARTAS — lookup HS code, tarif, dan status restriksi impor via INSW | ✅ Live |
| Shipments — CRUD data shipment, tersimpan di browser (IndexedDB) | ✅ Live |
| Export shipment ke Excel | ✅ Live |
| Feedback & roadmap board | ✅ Live |
| BL Scanner — parse PDF Bill of Lading untuk auto-fill form | 🔄 In Progress |
| ETA Notifications | ⏳ Planned |

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** + DaisyUI
- **Clean Architecture** — core, adapters, infrastructure, presentation
- **IndexedDB** — penyimpanan data shipment di sisi browser
- **INSW API** — sumber data HS code, tarif, dan LARTAS

## Menjalankan Project

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Environment Variables

Salin `.env.example` ke `.env` dan sesuaikan nilainya.

```bash
cp .env.example .env
```

| Variable | Keterangan |
|---|---|
| `INSW_CMS_TOKEN` | Token autentikasi INSW CMS (opsional) |
| `INSW_PUBLIC_ONLY_MODE` | `true` untuk skip endpoint CMS, pakai endpoint publik saja |
| `INSW_USE_LOCAL_MOCK` | `true` untuk pakai data mock lokal |
| `INSW_MOCK_ONLY_MODE` | `true` untuk hanya pakai mock, tanpa fetch live |

## Struktur Project

```
app/
├── core/           # Business logic (entities, use cases, ports)
├── adapters/       # Controllers & presenters
├── infrastructure/ # External services (INSW API, Excel, IndexedDB)
├── presentation/   # React components & hooks
└── api/            # Next.js API routes
```

## Devlog

Catatan perjalanan keputusan arah project ada di [`docs/devlog.md`](docs/devlog.md).
