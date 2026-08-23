# Knowledge Base: Catatan Bab HS (Harmonized System)

Direktori ini menyimpan file catatan bab HS (*ChapterNote*) yang menjadi sumber kebenaran bagi sistem **HS Finder**. LLM menggunakan isi file-file ini — bukan pengetahuan statistiknya semata — sebagai dasar setiap kesimpulan klasifikasi.

---

## Konvensi Penamaan File

Setiap file menggunakan format:

```
chapter-{nn}.md
```

di mana `{nn}` adalah nomor bab dua digit (dengan leading zero jika perlu).

**Contoh:**
- `chapter-01.md` → Bab 1 (Binatang Hidup)
- `chapter-84.md` → Bab 84 (Mesin dan Peralatan Mekanik)
- `chapter-90.md` → Bab 90 (Instrumen dan Peralatan Optik)

File yang tidak mengikuti konvensi ini **tidak akan dideteksi** oleh sistem.

---

## Cara Kerja Sistem

1. **Auto-deteksi saat runtime** — sistem memindai direktori ini secara otomatis. Tidak ada konfigurasi tambahan yang diperlukan untuk menambah atau menghapus file.
2. **Coverage transparency** — setiap bab kandidat dilabeli `"validated"` (file ada) atau `"unvalidated"` (file tidak ada). Label ini ditampilkan ke pengguna di setiap langkah reasoning.
3. **Graceful degradation** — jika file untuk suatu bab tidak ada, sistem tetap berjalan menggunakan pengetahuan umum LLM, dengan disclaimer yang jelas kepada pengguna.
4. **Knowledge base kosong** — sistem dapat berfungsi penuh meskipun direktori ini tidak berisi satu pun file `.md`, dengan catatan bahwa semua bab akan berstatus `"unvalidated"`.

---

## Format ChapterNote

Setiap file harus mengikuti struktur berikut secara konsisten. Heading dan urutan seksi **tidak boleh diubah** karena sistem mem-parse judul bab dari heading pertama (`# Bab {nn} — ...`).

```markdown
# Bab {nn} — {Judul Bab}

## Lingkup Umum
{Deskripsi singkat apa yang dicakup bab ini}

## Catatan Bab
1. {Catatan bab pertama}
2. {Catatan bab kedua}
   - (a) ...
   - (b) ...

## Catatan Subpos
1. {Catatan subpos jika ada}

## Pengecualian Penting
| Barang | Bab yang Benar |
|--------|----------------|
| {contoh barang yang sering salah diklasifikasikan} | Bab {nn} |

## Contoh Klasifikasi
- **{nama barang}** → {kode HS 6-digit}
- **{nama barang}** → {kode HS 6-digit}
```

### Keterangan Seksi

| Seksi | Wajib | Keterangan |
|-------|-------|------------|
| `# Bab {nn} — {Judul Bab}` | ✅ | Heading H1. Nomor dan judul bab diambil dari sini. |
| `## Lingkup Umum` | ✅ | Gambaran singkat cakupan bab. Satu paragraf sudah cukup. |
| `## Catatan Bab` | ✅ | Catatan bab resmi dari KUM HS. Gunakan penomoran bertingkat jika ada sub-poin. |
| `## Catatan Subpos` | ⬜ | Opsional. Hanya isi jika bab memiliki catatan subpos resmi. |
| `## Pengecualian Penting` | ✅ | Tabel barang yang sering salah masuk ke bab ini. Sangat membantu LLM menghindari kesalahan klasifikasi umum. |
| `## Contoh Klasifikasi` | ✅ | Minimal 2 contoh nyata. Format: `**nama barang** → kode 6-digit`. |

---

## Cara Menambah ChapterNote Baru

1. Buat file baru dengan nama `chapter-{nn}.md` di direktori ini.
2. Salin template di atas dan isi setiap seksi.
3. Pastikan heading H1 menggunakan format `# Bab {nn} — {Judul Bab}` yang tepat.
4. Simpan file. Sistem akan mendeteksinya secara otomatis pada request berikutnya — tidak perlu restart server atau mengubah konfigurasi apapun.

---

## Contoh File Lengkap

Berikut contoh `chapter-84.md` untuk referensi:

```markdown
# Bab 84 — Reaktor Nuklir, Ketel Uap, Mesin dan Peralatan Mekanik; Bagian-bagiannya

## Lingkup Umum
Bab ini mencakup mesin dan peralatan mekanik yang menghasilkan, mengubah, atau menggunakan
energi mekanik; termasuk mesin-mesin untuk industri dan peralatan pemrosesan data otomatis.

## Catatan Bab
1. Bab ini tidak mencakup:
   - (a) Batu penggilingan dan bahan abrasif lainnya dari Pos 68.04
   - (b) Pompa untuk cairan dari Pos 84.13 jika dikombinasi dengan alat ukur
2. Mesin yang memenuhi deskripsi dua pos atau lebih diklasifikasikan pada pos yang
   memberikan deskripsi paling spesifik.

## Catatan Subpos
1. Untuk subpos 8471.41 dan 8471.49, "mesin pengolah data otomatis" berarti mesin yang
   mampu menyimpan program pengolahan dan data yang diperlukan untuk pelaksanaan program.

## Pengecualian Penting
| Barang | Bab yang Benar |
|--------|----------------|
| Trafo dan konverter listrik | Bab 85 |
| Pompa udara dan vakum | Bab 84 (Pos 84.14) |
| Kendaraan bermotor dengan mesin internal | Bab 87 |

## Contoh Klasifikasi
- **Laptop dengan prosesor Intel** → 847130
- **Printer laser** → 844321
- **Mesin cuci industri** → 845011
```

---

## Prioritas Pengisian

Disarankan mengisi chapter note untuk bab-bab yang paling sering muncul dalam klasifikasi komoditas impor Indonesia terlebih dahulu:

- Bab 84 — Mesin dan Peralatan Mekanik
- Bab 85 — Mesin dan Peralatan Listrik
- Bab 39 — Plastik dan Barang dari Plastik
- Bab 87 — Kendaraan dan Bagian-bagiannya
- Bab 90 — Instrumen Optik dan Presisi
- Bab 73 — Barang dari Besi atau Baja
- Bab 61 / 62 — Pakaian Jadi
- Bab 94 — Furnitur

Bab-bab lain dapat ditambahkan secara bertahap sesuai kebutuhan.
