# 📖 Clean Code - Prinsip Menulis Kode yang Bersih

## Daftar Isi

1. [Apa itu Clean Code?](#apa-itu-clean-code)
2. [Meaningful Names](#meaningful-names)
3. [Functions](#functions)
4. [Comments](#comments)
5. [SOLID Principles](#solid-principles)
6. [Contoh Refactoring di Proyek Ini](#contoh-refactoring-di-proyek-ini)

---

## Apa itu Clean Code?

> "Clean code is code that has been taken care of. Someone has taken the time to keep it simple and orderly."
> — Robert C. Martin

Clean Code adalah kode yang:

- **Mudah dibaca** - Seperti membaca prosa yang baik
- **Mudah dipahami** - Tidak perlu baca implementasi untuk tahu apa yang dilakukan
- **Mudah dimodifikasi** - Perubahan tidak menyebabkan efek domino
- **Tidak ada duplikasi** - DRY (Don't Repeat Yourself)

---

## Meaningful Names

### ❌ Nama yang Buruk

```javascript
// Apa itu d? x? arr?
const d = 86400;
function calc(x) { ... }
function process(arr) { ... }
```

### ✅ Nama yang Baik

```javascript
// Jelas dan intent-revealing
const SECONDS_IN_A_DAY = 86400;
function calculateTax(price) { ... }
function filterValidHsCodes(codes) { ... }
```

### Penerapan di Proyek Ini

**Sebelum:**

```javascript
// app/utils/utility.js (lama)
export function isValidFormat(x) {
  const str = String(x);
  const pattern = /^\d+$/;
  return pattern.test(str) && str.length === 8;
}
```

**Sesudah:**

```javascript
// app/core/entities/hs-code.js (baru)
export function isValidHsCode(value) {
  const str = String(value);
  const pattern = /^\d{8}$/;
  return pattern.test(str);
}
```

**Perubahan:**

- `isValidFormat` → `isValidHsCode` (lebih spesifik, domain-driven)
- `x` → `value` (lebih deskriptif)
- Pattern disederhanakan dari `^\d+$` + length check menjadi `^\d{8}$`

---

## Functions

### Prinsip Utama

1. **Do One Thing** - Satu fungsi melakukan satu hal
2. **Small** - Fungsi harus kecil (idealnya < 20 baris)
3. **One Level of Abstraction** - Jangan campur detail teknis dengan logic bisnis

### Jumlah Argumen

| Jumlah | Nama      | Rekomendasi                  |
| ------ | --------- | ---------------------------- |
| 0      | Niladic   | ✅ Ideal                     |
| 1      | Monadic   | ✅ Bagus                     |
| 2      | Dyadic    | ⚠️ Acceptable                |
| 3+     | Triadic++ | ❌ Hindari, wrap jadi object |

### ❌ Contoh Buruk

```javascript
// Fungsi ini melakukan TERLALU BANYAK hal
async function handleFileAndFetchData(file, setStatus, setFileData) {
  // 1. Validasi file
  const ext = file.name.split(".").pop();
  if (ext !== "xls" && ext !== "xlsx") {
    alert("File yang kamu masukkan bukan file excel");
    return;
  }

  // 2. Baca file
  const reader = new FileReader();
  reader.onload = async (e) => {
    const buffer = e.target.result;
    const workbook = XLSX.read(buffer, { type: "buffer" });
    // ... lebih banyak logic

    // 3. Validasi HS Code
    const validCodes = data.filter((code) => /^\d{8}$/.test(code));

    // 4. Fetch dari API
    const response = await fetch("/api", {
      method: "POST",
      body: JSON.stringify(validCodes),
    });

    // 5. Download Excel
    const result = await response.json();
    // ... logic download
  };
  reader.readAsArrayBuffer(file);
}
```

### ✅ Contoh Baik (Setelah Refactoring)

```javascript
// Setiap fungsi punya SATU tanggung jawab

// 1. Validasi file (infrastructure/excel/excel.service.js)
export function isExcelFile(filename) {
  const extension = filename?.split(".").pop()?.toLowerCase();
  return extension === "xls" || extension === "xlsx";
}

// 2. Baca file (infrastructure/excel/excel.service.js)
export function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

// 3. Validasi HS Code (core/entities/hs-code.js)
export function isValidHsCode(value) {
  return /^\d{8}$/.test(String(value));
}

// 4. Fetch data (core/use-cases/fetch-hs-code-data.js)
export function createFetchHsCodeDataUseCase(gateway) {
  return {
    async fetchMultiple(codes) {
      // Hanya orchestration, tidak ada detail implementasi
    },
  };
}

// 5. Download (infrastructure/excel/excel.service.js)
export function downloadAsExcel(data, filename) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
  XLSX.writeFile(workbook, filename);
}
```

---

## Comments

### Prinsip Utama

> "Don't comment bad code—rewrite it."

Comments sering kali adalah **tanda kegagalan** mengekspresikan kode dengan jelas.

### ❌ Comments yang Buruk

```javascript
// Fungsi untuk mengecek
function check(x) {
  // Cek apakah x valid
  return x > 0; // Return true jika valid
}

// TODO: fix this later
// HACK: ini workaround
// =====================================
// AUTHOR: John Doe
// DATE: 2024-01-01
// =====================================
```

### ✅ Comments yang Berguna

```javascript
/**
 * Validates if a value is a valid HS Code.
 *
 * HS Code (Harmonized System) is an 8-digit international
 * classification code used for customs purposes.
 *
 * @param {string|number} value - Value to validate
 * @returns {boolean} True if valid 8-digit HS code
 *
 * @example
 * isValidHsCode("12345678") // true
 * isValidHsCode("1234567")  // false (7 digits)
 * isValidHsCode("1234567a") // false (contains letter)
 */
export function isValidHsCode(value) {
  const str = String(value);
  return /^\d{8}$/.test(str);
}
```

**Comments yang berguna:**

- JSDoc untuk API publik
- Menjelaskan **WHY**, bukan **WHAT**
- Warning tentang konsekuensi
- Penjelasan business rule yang tidak obvious

---

## SOLID Principles

### S - Single Responsibility Principle (SRP)

> "A class should have one, and only one, reason to change."

**Contoh di proyek:**

```javascript
// ❌ SALAH - FileReaderWrapper.jsx (lama) punya banyak responsibility:
// - Baca file Excel
// - Validasi HS Code
// - Panggil API
// - Download hasil

// ✅ BENAR - Dipisah:
// - excel.service.js       → Baca/tulis Excel
// - hs-code.js (entity)    → Validasi HS Code
// - fetch-hs-code-data.js  → Orchestrate fetch
// - HsCodeScanner.jsx      → UI only
```

### O - Open/Closed Principle (OCP)

> "Software entities should be open for extension, but closed for modification."

**Contoh:**

```javascript
// Use Case tidak perlu diubah jika kita ganti data source
const useCase = createFetchHsCodeDataUseCase(inswApiGateway);

// Besok mau ganti ke database? Buat gateway baru, use case TIDAK BERUBAH
const useCase = createFetchHsCodeDataUseCase(databaseGateway);
```

### L - Liskov Substitution Principle (LSP)

> "Subtypes must be substitutable for their base types."

**Contoh:**

```javascript
// Semua gateway harus bisa di-substitute tanpa break aplikasi
const inswGateway = { fetchByCode: async (code) => {...} };
const mockGateway = { fetchByCode: async (code) => {...} };
const dbGateway   = { fetchByCode: async (code) => {...} };

// Semua bisa dipakai di use case yang sama
createFetchHsCodeDataUseCase(inswGateway);  // ✅
createFetchHsCodeDataUseCase(mockGateway);  // ✅
createFetchHsCodeDataUseCase(dbGateway);    // ✅
```

### I - Interface Segregation Principle (ISP)

> "Clients should not be forced to depend on methods they do not use."

**Contoh:**

```javascript
// ❌ SALAH - Interface terlalu besar
const bigGateway = {
  fetchByCode: () => {},
  fetchAll: () => {},
  save: () => {},
  delete: () => {},
  update: () => {},
};

// ✅ BENAR - Interface kecil dan fokus
const readOnlyGateway = {
  fetchByCode: () => {},
};

const writeGateway = {
  save: () => {},
  delete: () => {},
};
```

### D - Dependency Inversion Principle (DIP)

> "High-level modules should not depend on low-level modules. Both should depend on abstractions."

**Ini adalah prinsip PALING PENTING dalam Clean Architecture!**

```javascript
// ❌ SALAH - Use Case langsung depend ke implementasi
import axios from "axios";

async function fetchHsCode(code) {
  return axios.get(`https://api.insw.go.id?hs_code=${code}`);
}

// ✅ BENAR - Use Case depend ke abstraksi (interface/port)
function createFetchHsCodeUseCase(gateway) {
  // gateway adalah ABSTRAKSI
  return {
    fetch: (code) => gateway.fetchByCode(code),
  };
}

// Implementasi konkret di-inject dari luar
const useCase = createFetchHsCodeUseCase(inswApiGateway);
```

---

## Contoh Refactoring di Proyek Ini

### Sebelum: `api/route.js` (Lama)

```javascript
// ❌ Masalah:
// 1. Langsung akses axios (coupling ke library)
// 2. Business logic campur dengan HTTP handling
// 3. Sulit di-test (harus mock axios global)

const axios = require("axios");

export async function POST(req) {
  const body = await req.json();
  const hsCodes = body.map((item) => item["hs_code"]);

  const items = await fetchAll([...new Set(hsCodes)]);
  // ... 50+ lines of mixed logic
}

async function dataINTR(hsCode) {
  const response = await axios.get(
    `https://api.insw.go.id/api-prod-ba/ref/hscode/komoditas?hs_code=${hsCode}`,
    {
      headers: {
        /* ... banyak headers ... */
      },
    }
  );
  // ... parsing logic
}
```

### Sesudah: Dipisah ke Layer yang Tepat

**1. API Route (hanya HTTP handling)**

```javascript
// app/api/hs-code/route.js
import { hsCodeController } from "../../adapters/controllers/hs-code.controller";

export async function POST(req) {
  const body = await req.json();
  const hsCodes = body.map((item) => item.hs_code);
  const result = await hsCodeController.handleFetchRequest(hsCodes);
  return Response.json(result.data);
}
```

**2. Controller (orchestration)**

```javascript
// app/adapters/controllers/hs-code.controller.js
export function createHsCodeController() {
  const fetchHsCodeUseCase = createFetchHsCodeDataUseCase(inswApiGateway);

  async function handleFetchRequest(hsCodes) {
    const results = await fetchHsCodeUseCase.fetchMultiple(hsCodes);
    return { success: true, data: toExcelData(results) };
  }

  return { handleFetchRequest };
}
```

**3. Use Case (business logic)**

```javascript
// app/core/use-cases/fetch-hs-code-data.js
export function createFetchHsCodeDataUseCase(hsCodeGateway) {
  async function fetchSingle(code) {
    if (!isValidHsCode(code)) return createEmptyHsCode(code);
    const rawData = await hsCodeGateway.fetchByCode(code);
    return createHsCode({ code, ...rawData });
  }
  return { fetchSingle, fetchMultiple };
}
```

**4. Infrastructure (external service)**

```javascript
// app/infrastructure/services/insw-api.service.js
export const inswApiGateway = {
  async fetchByCode(hsCode) {
    const response = await fetch(`${INSW_API_URL}?hs_code=${hsCode}`, {
      headers: INSW_HEADERS,
    });
    return mapInswResponseToRawData(await response.json());
  },
};
```

### Keuntungan Setelah Refactoring

| Aspek       | Sebelum                 | Sesudah                         |
| ----------- | ----------------------- | ------------------------------- |
| Testing     | Harus mock axios global | Inject mock gateway             |
| Flexibility | Terikat ke axios        | Bisa ganti fetch/axios/dll      |
| Readability | 100+ baris dalam 1 file | < 30 baris per file             |
| Maintenance | Ubah 1 hal = cek semua  | Ubah di 1 tempat saja           |
| Reusability | Tidak bisa reuse logic  | Entity & Use Case bisa di-reuse |

---

## Checklist Clean Code

Gunakan checklist ini saat menulis/review kode:

- [ ] Nama variabel/fungsi menjelaskan intent
- [ ] Fungsi melakukan satu hal saja
- [ ] Fungsi memiliki < 3 parameter
- [ ] Tidak ada komentar yang menjelaskan "what" (harusnya self-explanatory)
- [ ] Tidak ada duplikasi kode
- [ ] Error handling yang jelas
- [ ] Tidak ada magic numbers/strings
- [ ] Dependencies di-inject, bukan hardcoded

---

## Referensi

1. **Buku**: "Clean Code" by Robert C. Martin
2. **Video**: [Clean Code - Uncle Bob / Lesson 1](https://www.youtube.com/watch?v=7EmboKQH8lM)
3. **Artikel**: [Summary of Clean Code](https://gist.github.com/wojteklu/73c6914cc446146b8b533c0988cf8d29)

---

_Dokumentasi ini adalah bagian dari seri pembelajaran untuk proyek INSScan._
