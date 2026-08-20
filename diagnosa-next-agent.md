## Hasil audit

Repo sudah memakai App Router dengan benar secara dasar, tetapi ada beberapa penyimpangan penting dari pola idiomatik Next.js 16/React 19.

### Kritis

1. **Hydration mismatch nyata di `/exercise`**
   - `app/features/learning/components/ExercisePage.jsx:47,221`
   - `app/features/learning/config/exercise-config.js:565`
   - `Math.random()` dijalankan saat prerender server dan kembali dijalankan saat hydration browser, menghasilkan soal berbeda.
   - Next MCP mengonfirmasi error: **“Hydration failed because the server rendered text didn't match the client.”**
   - Solusi: hasil acak harus dibuat sekali lalu diserialisasi sebagai props, memakai seed deterministik, atau baru dibuat setelah hydration dengan placeholder deterministik.

2. **Paywall dan rate limit hanya dipercayakan kepada browser**
   - `useQueryLimit.js` menyimpan kuota dan Pro key di `localStorage`.
   - `validateUnlockKey()` hanya memeriksa format dan expiry; token acak apa pun dengan format dan bulan valid akan diterima.
   - Semua Route Handler dapat dipanggil langsung tanpa kuota, autentikasi, atau rate limit.
   - `app/api/bl-extract/route.ts:11-13` bahkan menggunakan tracker server dengan sisa `Infinity`.
   - Jika Pro adalah fitur berbayar, enforcement harus dilakukan di Route Handler/server melalui session atau token bertanda tangan, ditambah rate limit dan batas batch.

### Tinggi

3. **Metadata root bocor ke halaman anak**
   - `app/layout.tsx:35-60` berisi metadata khusus homepage: canonical `/`, OG title, dan OG URL homepage.
   - Metadata nested Next.js digabung secara dangkal. Pengujian browser menunjukkan:
     - `/learn`, `/exercise`, `/privacy` memiliki canonical `https://pesisir.id/`
     - `/hs-finder` memiliki OG URL dan OG title milik homepage
     - `/cek-lartas` kehilangan OG image karena `openGraph` lokal mengganti seluruh objek root
   - Solusi: root layout hanya menyimpan metadata global. Metadata homepage dipindahkan ke Server Component `app/page.tsx`, sementara OG bersama diekspor dari objek shared.
   - Tambahan: OG image diklaim `1200×630`, tetapi file aktual `752×468`.

4. **Konfigurasi CORS keliru dan terlalu terbuka**
   - `next.config.mjs:13-24`
   - Kombinasi berikut tidak valid untuk request bercredential:
     - `Access-Control-Allow-Credentials: true`
     - `Access-Control-Allow-Origin: *`
   - Frontend memakai API same-origin, sehingga CORS global kemungkinan tidak diperlukan. Jika memang publik lintas origin, gunakan allowlist origin eksplisit dan `Vary: Origin`.

### Menengah

5. **Client boundary terlalu tinggi**
   - `app/page.tsx` seluruhnya `"use client"` hanya karena state FAQ.
   - Akibatnya seluruh landing page statis ikut masuk client module graph dan di-hydrate.
   - Pola idiomatik: `app/page.tsx` tetap Server Component dan hanya FAQ/animasi menjadi Client Component.
   - Kasus serupa terdapat pada `CekLartasPage`; judul statis dapat dirender server.
   - `Title.tsx`, `Alert.jsx`, dan `Row.jsx` memiliki `"use client"` tanpa kebutuhan interaktivitas.

6. **`force-dynamic` tidak diperlukan**
   - `app/shipments/page.tsx:3`
   - Halaman hanya menampilkan aplikasi IndexedDB browser dan tidak memakai request-time server API.
   - Build membuktikan `/shipments` menjadi satu-satunya halaman UI yang dirender dinamis.
   - Hapus `dynamic = "force-dynamic"` agar shell dapat diprerender statis.

7. **Validasi Route Handler belum konsisten**
   - `/api/hs-code` mengembalikan:
     - body berbentuk object → `200 []`
     - JSON rusak → `500 Internal Server Error`
   - Keduanya seharusnya `400`.
   - Endpoint juga tidak membatasi jumlah HS code pada batas server.
   - Route Handler sebaiknya memvalidasi content type, shape, ukuran payload, jumlah item, dan membedakan error pengguna dari error internal.

8. **Belum ada error boundary App Router**
   - Tidak ditemukan `error.tsx`, `global-error.tsx`, atau `not-found.tsx`.
   - Tambahkan minimal `app/error.tsx`/`app/global-error.tsx` dan custom 404 untuk fallback produksi.
   - `loading.tsx` tidak wajib saat ini karena halaman tidak melakukan async server rendering yang lambat.

9. **Masalah React 19 yang dibiarkan sebagai warning**
   - Lint menghasilkan **36 warning**, termasuk:
     - dependency `useCallback` hilang di `useCekLartasSingle.js` dan `useCekLartasFile.js`
     - update ref saat render di `useShipments.js`
     - beberapa `setState` sinkron di dalam effect
   - Dependency yang hilang berpotensi menghasilkan closure lama, khususnya setelah status Pro atau kuota berubah.

10. **Modul server belum diberi guard `server-only`**
    - Contoh:
      - `hs-finder-gemini.service.js`
      - `chapter-note-loader.service.js`
      - `bl-extraction/infrastructure/gemini.service.js`
    - Modul tersebut memakai Gemini SDK, filesystem, atau dependency server.
    - Tambahkan `import "server-only"` agar impor tidak sengaja dari Client Component gagal saat build.

### Minor

11. **Nested `<main>`**
    - `app/layout.tsx:71` sudah memiliki `<main>`.
    - `HsFinderPage.jsx:67` membuat `<main>` kedua di dalamnya.
    - Gunakan `<section>` atau `<div>` pada feature component.

12. **Redirect legacy memakai status sementara**
    - `app/blscann/page.tsx:8` memakai `redirect()` sehingga menghasilkan HTTP `307`.
    - Karena route dinyatakan telah dipensiunkan, lebih tepat `permanentRedirect()` atau redirect permanen di `next.config.mjs` (`308`).

13. **Root layout terlalu mengatur layout semua jenis halaman**
    - Homepage memakai negative margin untuk membatalkan padding root.
    - Pola App Router yang lebih alami adalah route groups dan nested layout, misalnya `(marketing)` dan `(workspace)`.

14. **Sitemap belum lengkap**
    - `app/sitemap.ts` tidak memuat `/learn`, `/exercise`, dan halaman legal.
    - Semua `lastModified` memakai waktu build, bukan waktu perubahan konten sebenarnya.

## Yang sudah baik

- Konvensi `page.tsx`, `layout.tsx`, `route.ts`, `robots.ts`, dan `sitemap.ts` digunakan benar.
- Root layout tetap Server Component.
- Route Handler memakai Web `Request`/`Response` dan streaming NDJSON secara tepat.
- Client Component mengakses Route Handler; tidak ada Server Component yang memanggil API internal sendiri.
- `next/link`, `next/image`, metadata page, dan redirect App Router sudah dipakai.
- Batas arsitektur core/infrastructure lolos pemeriksaan.

## Verifikasi

- `npm run check`: **lulus**, 173 tes
- `npm run lint`: **lulus dengan 36 warning**
- `npm run build`: **lulus**
- Next MCP compilation issues: **tidak ada**
- Runtime browser: hydration mismatch `/exercise` berhasil direproduksi
- Tidak ada file yang diubah.
