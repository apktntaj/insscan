# Arsitektur

Pesisir menggunakan **Vertical Slice Architecture** dengan core yang tidak bergantung pada framework. Tujuannya adalah agar aturan bisnis dapat dipakai kembali jika Next.js diganti dengan stack lain.

## Struktur

```text
core/                             # TypeScript, framework-independent
├── hs-code/
│   ├── domain/
│   ├── ports/
│   └── use-cases/
├── hs-finder/
├── shipments/
└── bl-extraction/

app/                              # Aplikasi Next.js
├── api/                          # HTTP entry points/composition roots
├── features/                     # Slice vertikal sisi aplikasi
│   ├── hs-code/
│   ├── hs-finder/
│   ├── shipments/
│   ├── bl-extraction/
│   ├── feedback/
│   ├── learning/
│   └── marketing/
└── shared/                       # UI/config/infrastructure lintas slice
```

Setiap `app/features/<slice>` dapat memiliki `adapters`, `infrastructure`, dan `presentation` sesuai kebutuhan slice tersebut. Folder tidak perlu dibuat jika slice tidak membutuhkannya.

## Aturan dependensi

```text
Next routes → application feature → core
application infrastructure ───────→ core port
core ──────────────────────────────→ tidak bergantung pada application/framework
```

Aturan wajib:

1. `core/` hanya berisi domain model, use case, dan port.
2. `core/` tidak boleh mengimpor React, Next.js, adapter aplikasi, atau package infrastructure.
3. `core/` tidak boleh memakai global platform seperti `window`, `document`, IndexedDB, atau Web Storage.
4. Environment variable dibaca di composition root/application lalu diberikan ke core melalui parameter.
5. Implementasi port berada di `app/features/*/infrastructure` atau `app/shared/infrastructure`.
6. `app/api` dan halaman Next.js harus tipis: parsing input, wiring dependency, pemanggilan controller/use case, dan serialisasi output.
7. Slice aplikasi boleh menggunakan `app/shared`, tetapi `app/shared` tidak boleh bergantung pada detail internal sebuah slice.

Batas ini diperiksa dengan:

```bash
npm run check:architecture
```

## TypeScript

- `strict: true` berlaku untuk seluruh file TypeScript.
- `core/` dan seluruh entry point Next.js sudah menggunakan TypeScript.
- Kode aplikasi lama di dalam beberapa slice masih diizinkan sementara melalui `allowJs`; file tersebut dimigrasikan per slice tanpa mengubah kontrak bisnis.
- Setelah seluruh slice selesai dimigrasikan, `allowJs` harus diubah menjadi `false`.

Kode produksi baru wajib menggunakan `.ts` atau `.tsx`.
