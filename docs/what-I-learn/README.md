# 📚 Dokumentasi Pembelajaran - INSScan

Selamat datang di dokumentasi pembelajaran! Folder ini berisi materi-materi untuk memahami arsitektur dan praktik coding yang digunakan di proyek INSScan.

## 📖 Daftar Materi

### 1. [Clean Architecture](./clean-architecture.md)

Pelajari tentang:

- Apa itu Clean Architecture dan filosofinya
- Layer-layer: Entities, Use Cases, Adapters, Infrastructure
- The Dependency Rule
- Implementasi konkret di proyek ini
- Alur data dari UI hingga external service

### 2. [Clean Code](./clean-code.md)

Pelajari tentang:

- Prinsip menulis kode yang bersih dan mudah dibaca
- Meaningful names
- Function design (small, do one thing)
- Comments yang baik vs buruk
- SOLID Principles dengan contoh

### 3. [Dependency Injection](./dependency-injection.md)

Pelajari tentang:

- Apa itu Dependency Injection dan mengapa penting
- Cara kerja DI di JavaScript
- Factory functions vs Classes
- Testing dengan mock dependencies

---

## 🗺️ Peta Perubahan Struktur

### Sebelum (Struktur Lama)

```
app/
├── ui/                    # Semua komponen UI
│   ├── FileReaderWrapper.jsx
│   ├── Table.jsx
│   └── ...
├── utils/
│   └── utility.js         # Fungsi campur aduk
└── api/
    └── route.js           # API + Business Logic
```

### Sesudah (Clean Architecture)

```
app/
├── core/                  # 🔵 Domain (innermost)
│   ├── entities/          # Business objects
│   ├── ports/             # Interfaces
│   └── use-cases/         # Application logic
│
├── adapters/              # 🟢 Interface Adapters
│   ├── controllers/       # Handle requests
│   └── presenters/        # Format data for UI
│
├── infrastructure/        # 🟠 Frameworks (outermost)
│   ├── services/          # External APIs
│   └── excel/             # File handling
│
└── presentation/          # 🔴 UI Layer
    └── components/
        ├── common/        # Reusable UI
        └── features/      # Feature-specific
```

---

## 🎯 Tujuan Pembelajaran

Setelah membaca dokumentasi ini, kamu diharapkan bisa:

1. **Memahami** mengapa kode di-refactor dengan cara tertentu
2. **Menerapkan** prinsip Clean Architecture di proyek lain
3. **Menulis** kode yang testable dan maintainable
4. **Menggunakan** Dependency Injection dengan benar
5. **Menjelaskan** keputusan arsitektur kepada tim

---

## 💡 Tips Belajar

1. **Baca berurutan** - Mulai dari Clean Architecture → Clean Code → DI
2. **Lihat kode** - Bandingkan penjelasan dengan kode aktual di proyek
3. **Praktek** - Coba buat fitur baru mengikuti arsitektur yang ada
4. **Tanya** - Jika ada yang tidak jelas, diskusikan!

---

## 📚 Referensi Tambahan

### Buku

- "Clean Architecture" by Robert C. Martin
- "Clean Code" by Robert C. Martin
- "Dependency Injection in .NET" by Mark Seemann (konsep berlaku universal)

### Video

- [Clean Architecture - Uncle Bob](https://www.youtube.com/watch?v=o_TH-Y78tt4)
- [Clean Code - Lesson 1](https://www.youtube.com/watch?v=7EmboKQH8lM)

### Artikel

- [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)

---

_Happy Learning! 🚀_
