# Arsitektur

Pesisir menggunakan **Vertical Slice Architecture** dengan core yang tidak bergantung pada framework. Slice mengikuti kapabilitas bisnis, bukan layer teknis global. Next.js adalah salah satu delivery mechanism dan composition root, bukan tempat aturan bisnis berada.

## Struktur target

```text
core/                                  # Program framework-independent
├── cek-lartas/                        # Slice kecil tidak dipaksa memakai subfolder
│   ├── domain.ts                      # Invoice, HS code, requirement, dan result
│   ├── check.ts                       # Solusi/use case
│   ├── source.ts                      # Boundary sumber LARTAS
│   └── docs.md                        # Alasan keputusan model
├── hs-finder/
├── shipments/
├── bl-extraction/
└── shared/                            # Shared kernel kecil dan disengaja

infrastructure/                        # Implementasi outbound boundary
└── cek-lartas/
    └── insw/                          # HTTP client dan adapter INSW

app/                                   # Delivery dan composition dengan Next.js
├── api/                               # HTTP entry points tipis
├── features/
│   └── cek-lartas/
│       ├── adapters/                  # Controller dan presenter
│       ├── composition/               # Wiring core dengan infrastructure
│       └── presentation/              # React components dan hooks
└── shared/                            # UI dan browser infrastructure lintas fitur
```

Cek LARTAS adalah slice pertama yang dimigrasikan ke struktur target. Slice lain masih dimigrasikan bertahap.

## Aturan dependensi

```text
Next.js delivery/composition ──┬──> core
                               └──> infrastructure ──> core boundary
core ─────────────────────────────> tidak bergantung pada keduanya
```

Aturan wajib:

1. Setiap kapabilitas bisnis memiliki domain, solusi/use case, dan boundary sendiri sesuai kebutuhan. Folder dibuat hanya ketika ukuran slice membutuhkannya.
2. `core/` tidak boleh mengimpor React, Next.js, infrastructure, atau adapter aplikasi.
3. `core/` tidak boleh memakai global browser seperti `window`, `document`, IndexedDB, atau Web Storage.
4. Boundary di core memakai bahasa domain dan tidak mengekspos payload INSW, model database, HTTP, atau SDK pihak ketiga.
5. Implementasi pihak ketiga berada di `infrastructure/<slice>/` dan menerjemahkan data eksternal sebelum masuk ke core.
6. Infrastructure boleh bergantung pada core boundary, tetapi tidak boleh bergantung pada Next.js, React, atau `app/`.
7. Environment variable dibaca oleh composition/application infrastructure, lalu kebijakan yang diperlukan core diberikan melalui parameter.
8. `app/api` dan halaman Next.js tetap tipis: parsing input, pemanggilan controller/use case, dan serialisasi output.
9. `app/shared` tidak boleh bergantung pada detail internal sebuah feature.
10. Konsep dipertahankan lokal di slice secara default. Konsep hanya masuk `core/shared` jika makna, invariant, dan lifecycle-nya benar-benar sama pada beberapa slice.

Batas ini diperiksa dengan:

```bash
npm run check:architecture
```

## Contoh alur Cek LARTAS

```text
POST /api/hs-code
  → controller
    → check(invoice, source)
      → Source (core boundary)
        → INSW source (infrastructure adapter)
          → INSW
```

Core dapat dijalankan tanpa Next.js dengan memberikan implementasi in-memory atau fake untuk `Source`. Implementasi produksi menggunakan adapter INSW pada composition root Next.js.

## TypeScript dan migrasi

- `strict: true` berlaku untuk seluruh file TypeScript.
- Core, typed infrastructure adapter, composition root, dan entry point Next.js menggunakan TypeScript.
- HTTP client INSW lama masih diisolasi di `infrastructure/cek-lartas/insw/legacy-insw-api.service.js` di belakang adapter bertipe. Migrasi internal client tersebut ke TypeScript dapat dilakukan tanpa mengubah core.
- Kode aplikasi lama masih diizinkan sementara melalui `allowJs` dan dimigrasikan per slice tanpa mengubah kontrak bisnis.
- Setelah seluruh slice selesai dimigrasikan, `allowJs` harus diubah menjadi `false`.

Kode produksi baru wajib menggunakan `.ts` atau `.tsx`.
