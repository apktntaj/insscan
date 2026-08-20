# Pesisir

Platform operasional berbasis browser untuk staf PPJK dan freight forwarder di Indonesia. Dibuat untuk mengurangi kerja manual dalam pengecekan regulasi impor dan pengelolaan data shipment.

## Fitur

| Fitur | Status |
|---|---|
| Cek LARTAS — periksa status dan persyaratan LARTAS via INSW | ✅ Live |
| Shipments — CRUD data shipment, tersimpan di browser (IndexedDB) | ✅ Live |
| Export shipment ke Excel | ✅ Live |
| Feedback & roadmap board | ✅ Live |
| Smart Fill — parse PDF Bill of Lading untuk auto-fill form shipment | 🔄 In Progress |
| ETA Notifications | ⏳ Planned |

## Tech Stack

- **TypeScript** (`strict: true`)
- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS** + DaisyUI
- **Vertical Slice Architecture** — core framework-independent, aplikasi Next.js per fitur
- **IndexedDB** — penyimpanan data shipment di sisi browser
- **INSW API** — sumber data status dan persyaratan LARTAS

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
| `GEMINI_API_KEY` | API key server-side untuk HS Finder dan ekstraksi BL otomatis |

### Mendapatkan Gemini API Key

1. Kunjungi [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Login dengan akun Google
3. Klik "Create API Key"
4. Salin API key dan tambahkan ke file `.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

**Catatan**: 
- Gemini API memiliki free tier dengan limit harian
- Jika API key tidak dikonfigurasi, sistem akan fallback ke ekstraksi berbasis pattern matching
- Daily limit: 5 ekstraksi BL per hari per browser (untuk mengelola biaya API)

## Struktur Project

```text
core/                 # Domain, use case, service, dan boundary; framework-independent
├── cek-lartas/
├── hs-finder/
├── shipments/
└── bl-extraction/

infrastructure/       # Implementasi boundary pihak ketiga per slice
└── cek-lartas/       # Adapter INSW

app/                  # Delivery dan composition menggunakan Next.js
├── api/              # HTTP entry points
├── features/         # Adapter, composition, dan UI per fitur
└── shared/           # UI dan browser infrastructure lintas fitur
```

Detail aturan dependensi dan status migrasi tersedia di [`docs/architecture.md`](docs/architecture.md).

## Devlog

Catatan perjalanan keputusan arah project ada di [`docs/devlog.md`](docs/devlog.md).
