# 📚 Belajar Clean Architecture

## Daftar Isi

1. [Apa itu Clean Architecture?](#apa-itu-clean-architecture)
2. [Mengapa Perlu Clean Architecture?](#mengapa-perlu-clean-architecture)
3. [The Dependency Rule](#the-dependency-rule)
4. [Layer-layer dalam Clean Architecture](#layer-layer-dalam-clean-architecture)
5. [Implementasi di Proyek INSScan](#implementasi-di-proyek-insscan)
6. [Contoh Alur Data](#contoh-alur-data)
7. [Keuntungan & Trade-offs](#keuntungan--trade-offs)

---

## Apa itu Clean Architecture?

Clean Architecture adalah pola arsitektur software yang diperkenalkan oleh **Robert C. Martin (Uncle Bob)**. Tujuan utamanya adalah membuat sistem yang:

- **Independent of Frameworks** - Tidak terikat pada framework tertentu
- **Testable** - Business rules bisa di-test tanpa UI, database, atau external service
- **Independent of UI** - UI bisa berubah tanpa mengubah business logic
- **Independent of Database** - Bisa ganti MySQL ke MongoDB tanpa mengubah business rules
- **Independent of External Agency** - Business rules tidak tahu apa-apa tentang dunia luar

```
┌─────────────────────────────────────────────────────────────┐
│                    FRAMEWORKS & DRIVERS                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 INTERFACE ADAPTERS                   │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │           APPLICATION BUSINESS RULES         │    │    │
│  │  │  ┌─────────────────────────────────────┐    │    │    │
│  │  │  │    ENTERPRISE BUSINESS RULES        │    │    │    │
│  │  │  │         (ENTITIES)                  │    │    │    │
│  │  │  └─────────────────────────────────────┘    │    │    │
│  │  │              (USE CASES)                     │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │        (CONTROLLERS, PRESENTERS, GATEWAYS)          │    │
│  └─────────────────────────────────────────────────────┘    │
│              (WEB, UI, DB, EXTERNAL SERVICES)               │
└─────────────────────────────────────────────────────────────┘
```

---

## Mengapa Perlu Clean Architecture?

### Masalah dengan Kode yang Tidak Terstruktur

Sebelum refactoring, kode kita terlihat seperti ini:

```
app/
├── ui/                    # Semua komponen dicampur
│   ├── FileReaderWrapper.jsx  # Mixing: UI + Business Logic + API call
│   ├── Table.jsx
│   └── ...
├── utils/
│   └── utility.js         # Fungsi campur aduk
└── api/
    └── route.js           # Langsung akses external API
```

**Masalah:**

1. **Sulit di-test** - `FileReaderWrapper.jsx` memanggil API langsung, tidak bisa di-unit test
2. **Coupling tinggi** - Jika API INSW berubah, harus ubah di banyak tempat
3. **Sulit di-maintain** - Business logic tersebar di mana-mana
4. **Tidak reusable** - Logic validasi HS Code duplikat di beberapa file

---

## The Dependency Rule

> **"Source code dependencies must only point INWARD."**

Ini adalah aturan paling penting dalam Clean Architecture:

```
UI → Controllers → Use Cases → Entities
     (outer)                    (inner)
```

**Artinya:**

- Layer dalam (Entities) **TIDAK BOLEH** tahu tentang layer luar
- Layer luar **BOLEH** tahu tentang layer dalam
- Entities tidak import apa-apa dari Use Cases
- Use Cases tidak import apa-apa dari Controllers
- Controllers tidak import apa-apa dari UI components

### Contoh Pelanggaran

```javascript
// ❌ SALAH - Entity import dari infrastructure
// file: core/entities/hs-code.js
import axios from "axios"; // Entity tidak boleh tahu soal HTTP!

// ❌ SALAH - Use Case langsung akses database
// file: core/use-cases/fetch-hs-code.js
import { supabase } from "@supabase/supabase-js"; // Use Case tidak boleh tahu DB!
```

### Contoh yang Benar

```javascript
// ✅ BENAR - Entity murni, tidak ada dependencies
// file: core/entities/hs-code.js
export function createHsCode({ code, bm, ppn }) {
  return Object.freeze({ code, bm, ppn });
}

// ✅ BENAR - Use Case terima Gateway via parameter (Dependency Injection)
// file: core/use-cases/fetch-hs-code.js
export function createFetchHsCodeUseCase(hsCodeGateway) {
  // hsCodeGateway adalah INTERFACE, bukan implementasi konkret
  return {
    async fetch(code) {
      return await hsCodeGateway.fetchByCode(code);
    },
  };
}
```

---

## Layer-layer dalam Clean Architecture

### 1. 🔵 Entities (Enterprise Business Rules)

**Lokasi:** `app/core/entities/`

**Apa isinya?**

- Object/class yang merepresentasikan konsep bisnis
- Aturan bisnis yang paling umum dan stabil
- Tidak ada dependencies sama sekali

**Contoh di proyek kita:**

```javascript
// app/core/entities/hs-code.js

// Entity adalah PLAIN OBJECT - tidak ada framework, tidak ada library
export function createHsCode({
  code,
  bm = null,
  ppn = null,
  pph = null,
  // ...
}) {
  return Object.freeze({
    code,
    bm,
    ppn,
    pph,
    // ...
  });
}

// Validasi adalah bagian dari Entity karena ini business rule
export function isValidHsCode(value) {
  const str = String(value);
  return /^\d{8}$/.test(str); // HS Code harus 8 digit
}
```

**Kenapa `Object.freeze()`?**

- Membuat object immutable (tidak bisa diubah)
- Mencegah bug karena perubahan tidak sengaja
- Sesuai prinsip functional programming

---

### 2. 🟢 Use Cases (Application Business Rules)

**Lokasi:** `app/core/use-cases/`

**Apa isinya?**

- Orchestration logic spesifik aplikasi
- Memanggil Entities untuk business rules
- Mendefinisikan "apa yang aplikasi bisa lakukan"

**Contoh di proyek kita:**

```javascript
// app/core/use-cases/fetch-hs-code-data.js

import {
  createHsCode,
  createEmptyHsCode,
  isValidHsCode,
} from "../entities/hs-code";

// Use Case menerima GATEWAY sebagai parameter (Dependency Injection)
export function createFetchHsCodeDataUseCase(hsCodeGateway) {
  async function fetchSingle(code) {
    // 1. Validasi menggunakan Entity
    if (!isValidHsCode(code)) {
      return createEmptyHsCode(code);
    }

    // 2. Ambil data via Gateway (abstraksi)
    const rawData = await hsCodeGateway.fetchByCode(code);

    // 3. Transform ke Entity
    if (!rawData) {
      return createEmptyHsCode(code);
    }

    return createHsCode({
      code,
      bm: rawData.bm,
      // ...
    });
  }

  return { fetchSingle, fetchMultiple };
}
```

**Perhatikan:**

- Use Case **TIDAK TAHU** data datang dari mana (API? Database? File?)
- Use Case hanya tahu ada `hsCodeGateway` yang punya method `fetchByCode`
- Ini namanya **Dependency Inversion Principle (DIP)**

---

### 3. 🟡 Interface Adapters (Controllers, Presenters, Gateways)

**Lokasi:** `app/adapters/`

**Apa isinya?**

- **Controllers**: Menerima input, memanggil Use Case
- **Presenters**: Transform data untuk UI
- **Gateways**: Interface untuk external services

#### Controller

```javascript
// app/adapters/controllers/hs-code.controller.js

import { createFetchHsCodeDataUseCase } from "../../core/use-cases/fetch-hs-code-data";
import { inswApiGateway } from "../../infrastructure/services/insw-api.service";
import { toExcelData } from "../presenters/hs-code.presenter";

export function createHsCodeController() {
  // Inject gateway ke use case
  const fetchHsCodeUseCase = createFetchHsCodeDataUseCase(inswApiGateway);

  async function handleFetchRequest(hsCodes) {
    // 1. Panggil Use Case
    const results = await fetchHsCodeUseCase.fetchMultiple(hsCodes);

    // 2. Transform via Presenter
    const excelData = toExcelData(results);

    return { success: true, data: excelData };
  }

  return { handleFetchRequest };
}
```

#### Presenter

```javascript
// app/adapters/presenters/hs-code.presenter.js

// Transform Entity ke format yang dibutuhkan UI/Export
export function toExcelRow(hsCode) {
  return {
    "HS Code": hsCode.code,
    BM: hsCode.bm ?? "tidak ada data",
    PPN: hsCode.ppn ?? "tidak ada data",
    // Format untuk Excel, bukan format internal
  };
}
```

---

### 4. 🔴 Frameworks & Drivers (Infrastructure)

**Lokasi:** `app/infrastructure/`

**Apa isinya?**

- Implementasi konkret dari external services
- Database connections
- HTTP clients
- File system operations

**Contoh di proyek kita:**

```javascript
// app/infrastructure/services/insw-api.service.js

// Implementasi KONKRET dari HsCodeGateway interface
export const inswApiGateway = {
  async fetchByCode(hsCode) {
    // Detail implementasi: HTTP, headers, URL, dll
    const response = await fetch(`${INSW_API_URL}?hs_code=${hsCode}`, {
      method: "GET",
      headers: INSW_HEADERS,
    });

    // Transform response ke format yang diharapkan Use Case
    return mapInswResponseToRawData(data);
  },
};
```

**Kenapa ini di Infrastructure?**

- Jika API INSW berubah URL/format, hanya file ini yang perlu diubah
- Use Case tidak perlu tahu detail HTTP
- Bisa dibuat mock untuk testing

---

## Implementasi di Proyek INSScan

### Struktur Folder Baru

```
app/
├── core/                              # Domain Layer (INNERMOST)
│   ├── entities/
│   │   └── hs-code.js                # HS Code entity + validasi
│   ├── ports/
│   │   └── hs-code-gateway.port.js   # Interface definition
│   └── use-cases/
│       └── fetch-hs-code-data.js     # Application logic
│
├── adapters/                          # Interface Adapters
│   ├── controllers/
│   │   └── hs-code.controller.js     # Orchestrate request/response
│   └── presenters/
│       └── hs-code.presenter.js      # Transform untuk UI/Export
│
├── infrastructure/                    # Frameworks & Drivers (OUTERMOST)
│   ├── services/
│   │   └── insw-api.service.js       # INSW API implementation
│   └── excel/
│       └── excel.service.js          # Excel read/write
│
└── presentation/                      # UI Layer
    └── components/
        ├── common/                   # Reusable UI components
        └── features/                 # Feature-specific components
```

### Mapping dari Kode Lama ke Baru

| File Lama                  | File Baru                                        | Layer              |
| -------------------------- | ------------------------------------------------ | ------------------ |
| `utils/utility.js`         | `core/entities/hs-code.js`                       | Entity             |
|                            | `infrastructure/excel/excel.service.js`          | Infrastructure     |
| `api/route.js`             | `adapters/controllers/hs-code.controller.js`     | Adapter/Controller |
|                            | `infrastructure/services/insw-api.service.js`    | Infrastructure     |
| `ui/FileReaderWrapper.jsx` | `presentation/components/features/HsCodeScanner` | Presentation       |
| `ui/Table.jsx`             | `presentation/components/features/HsCodeTable`   | Presentation       |
| `ui/Button.jsx`, dll       | `presentation/components/common/*`               | Presentation       |

---

## Contoh Alur Data

Mari kita trace alur ketika user klik "Tarik Data":

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. USER CLICK "Tarik Data"                                           │
│    └─> HsCodeScanner.jsx (Presentation)                              │
│        └─> fetch("/api/hs-code", { body: hsCodes })                  │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. API ROUTE                                                         │
│    └─> app/api/hs-code/route.js                                      │
│        └─> hsCodeController.handleFetchRequest(hsCodes)              │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. CONTROLLER (Adapter)                                              │
│    └─> adapters/controllers/hs-code.controller.js                    │
│        └─> fetchHsCodeUseCase.fetchMultiple(hsCodes)                 │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. USE CASE (Core)                                                   │
│    └─> core/use-cases/fetch-hs-code-data.js                          │
│        ├─> isValidHsCode(code)          // dari Entity               │
│        └─> hsCodeGateway.fetchByCode()  // via interface             │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 5. GATEWAY IMPLEMENTATION (Infrastructure)                           │
│    └─> infrastructure/services/insw-api.service.js                   │
│        └─> fetch("https://api.insw.go.id/...")                       │
│        └─> return mapped data                                        │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 6. BACK TO USE CASE                                                  │
│    └─> createHsCode({ code, bm, ppn, ... })  // create Entity        │
│    └─> return array of HsCode entities                               │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 7. PRESENTER (Adapter)                                               │
│    └─> adapters/presenters/hs-code.presenter.js                      │
│        └─> toExcelData(entities)  // transform untuk export          │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 8. RESPONSE TO CLIENT                                                │
│    └─> JSON response                                                 │
│    └─> HsCodeScanner.jsx                                             │
│        └─> downloadAsExcel(data)                                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Keuntungan & Trade-offs

### ✅ Keuntungan

1. **Testability**

   ```javascript
   // Bisa test Use Case dengan mock gateway
   const mockGateway = {
     fetchByCode: jest.fn().mockResolvedValue({ bm: "5%", ppn: "11%" }),
   };
   const useCase = createFetchHsCodeDataUseCase(mockGateway);
   const result = await useCase.fetchSingle("12345678");
   expect(result.bm).toBe("5%");
   ```

2. **Flexibility**

   ```javascript
   // Ganti dari INSW API ke database? Cukup buat gateway baru
   const dbGateway = {
     fetchByCode: (code) =>
       db.query("SELECT * FROM hs_codes WHERE code = ?", code),
   };
   const useCase = createFetchHsCodeDataUseCase(dbGateway); // Use Case sama!
   ```

3. **Maintainability**

   - Bug di API? Perbaiki di `insw-api.service.js`
   - Bug di validasi? Perbaiki di `hs-code.js` entity
   - Bug di tampilan? Perbaiki di `presenter` atau `component`

4. **Scalability**
   - Tim bisa kerja paralel di layer berbeda
   - Satu orang kerjakan UI, satu orang kerjakan API integration

### ⚠️ Trade-offs

1. **Lebih banyak file** - Proyek kecil mungkin terasa over-engineered
2. **Learning curve** - Butuh waktu untuk paham konsep
3. **Boilerplate** - Harus buat interface, DTO, mapper

### Kapan Pakai Clean Architecture?

| Gunakan                             | Tidak perlu               |
| ----------------------------------- | ------------------------- |
| Proyek jangka panjang               | Script sekali pakai       |
| Tim > 2 orang                       | Proyek solo kecil         |
| Business logic kompleks             | CRUD sederhana            |
| Butuh testing yang baik             | Prototype cepat           |
| Kemungkinan ganti framework/service | Stack sudah fix selamanya |

---

## Referensi untuk Belajar Lebih Lanjut

1. **Buku**: "Clean Architecture" by Robert C. Martin
2. **Video**: [Clean Architecture - Uncle Bob](https://www.youtube.com/watch?v=o_TH-Y78tt4)
3. **Artikel**: [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

_Dokumentasi ini dibuat untuk membantu memahami perubahan arsitektur pada proyek INSScan._
