# Modul cek lartas

Modul ini memeriksa status **lartas** **hs code** atau **list of hs codes**. Pemeriksaan di lakukan dengan melakukan **lookup** ke **Provider** (saat ini baru INSW). Sayangnya INSW tidak melayani proses bulk of hs codes. Jadi modul ini mencoba memecahkan masalah ini. Memeriksa lartas dalam jumlah banyak di satu waktu akan menghemat banyak waktu pekerja PPJK. kalau satu item barang butuh 15 detik dalam melakukan proses lookup. 

Secara manual, pengecekan LarTas membutuhkan sekitar 15 detik untuk setiap HS Code. Artinya, semakin banyak item, semakin lama waktu yang dibutuhkan: 100 HS Code memerlukan sekitar 25 menit, sedangkan 1.000 HS Code lebih dari 4 jam.

Dengan otomatisasi, pengecekan dapat dilakukan secara bersamaan. Waktu tunggu lebih banyak ditentukan oleh kecepatan respons jaringan, bukan lagi 15 detik dikalikan jumlah item.

## Domain

HS code is a 8 digits string.

```typescript
declare const hsCodeBrand: unique symbol;

type HsCode = string & {
  readonly [hsCodeBrand]: true;
};

function createHSCode(value: string): HsCode {
  if (!/^\d{8}$/.test(value)) {
    throw new Error("HS Code must contain exactly 8 digits");
  }

  return value as HsCode;
}
```

HsCodes is list of Hscode
```typescript
type HsCodes = HsCode[]
```

Privider adalah portal terpercaya yang menyediakan data lartas. Saat ini yang diketahui baru INSW 
```typescript
type LartasProvider = {
    name: string,
    url: string?
    tokenBearer: string?
}
```


## Signature
Cek lartas input berupa `HsCode | HsCodes` dengan output `Reject | Success` 


## Mengapa strukturnya diringkas

Cek LARTAS masih merupakan konteks kecil. Memisahkan setiap definisi ke dalam folder `domain/`, `use-cases/`, dan `boundaries/` membuat struktur lebih besar daripada masalah yang diselesaikan. Karena konteks sudah diberikan oleh folder `cek-lartas`, nama di dalamnya tidak perlu terus mengulang kata `LartasCheck`.

Struktur core-nya sengaja datar:

```text
core/cek-lartas/
├── domain.ts   # Data dan aturan paling dasar
├── source.ts   # Boundary sumber LARTAS
├── check.ts    # Solusi/use case
└── docs.md     # Alasan desain
```

Folder baru hanya perlu dibuat jika ukuran dan variasi konsep benar-benar membutuhkannya.

## Bahasa domain

### `Invoice`

Dalam pekerjaan pengguna, kumpulan HS code yang diperiksa berasal dari invoice. Karena itu input disebut `Invoice`, bukan `Batch`, `CheckInput`, atau nama teknis lain.

Untuk konteks ini, bagian invoice yang relevan hanya:

```text
Invoice
└── hsCodes
```

Ini bukan klaim bahwa invoice secara umum hanya berisi HS code. Ini adalah bentuk invoice yang dibutuhkan oleh konteks Cek LARTAS. Input satu HS code diperlakukan sebagai invoice dengan satu HS code.

### `Result`

Karena sudah berada di konteks Cek LARTAS, nama `Result` cukup. Satu `Result` mewakili hasil untuk satu HS code dalam invoice dan memiliki dua kemungkinan:

- `gagal`, dengan alasan kegagalan;
- `berhasil`, dengan daftar `requirements`.

Tidak ada objek HS code kosong dan tidak ada boolean default yang menyamarkan kegagalan.

## Invariant penting

`berhasil` berarti sumber telah memverifikasi data LARTAS.

- `berhasil` dengan `requirements` kosong: terverifikasi tidak terkena LARTAS;
- `berhasil` dengan `requirements` terisi: terkena LARTAS dan daftar tersebut menjelaskan persyaratannya;
- sumber hanya menyediakan tarif atau tidak dapat memverifikasi LARTAS: `gagal` dengan alasan `belum-terverifikasi`;
- kegagalan teknis sumber: `gagal` dengan alasan `sumber-gagal`.

Dengan invariant ini, daftar kosong tidak pernah digunakan untuk menyatakan kegagalan atau data yang belum terverifikasi.

## Tarif

Tarif tidak termasuk dalam model core ini. Cek LARTAS saat ini hanya memodelkan apakah pemeriksaan berhasil dan persyaratan LARTAS apa yang berlaku. Data tarif dari provider tidak boleh masuk ke `Result` hanya karena tersedia pada respons yang sama.
