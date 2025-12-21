# 🔄 Dependency Injection - Panduan Lengkap

## Daftar Isi

1. [Apa itu Dependency Injection?](#apa-itu-dependency-injection)
2. [Mengapa Perlu DI?](#mengapa-perlu-di)
3. [Cara Kerja DI](#cara-kerja-di)
4. [Implementasi di JavaScript](#implementasi-di-javascript)
5. [Penerapan di Proyek INSScan](#penerapan-di-proyek-insscan)
6. [Testing dengan DI](#testing-dengan-di)

---

## Apa itu Dependency Injection?

**Dependency Injection (DI)** adalah teknik di mana sebuah object menerima dependencies-nya dari luar, bukan membuat sendiri di dalam.

### Analogi Sederhana

Bayangkan kamu membuat kopi:

**❌ Tanpa DI (Hard Dependency):**

```
Kamu masuk ke dapur, ambil kopi dari lemari yang SUDAH DITENTUKAN,
ambil air dari keran yang SUDAH DITENTUKAN,
gunakan mesin kopi yang SUDAH DITENTUKAN.
```

**✅ Dengan DI:**

```
Seseorang MEMBERIKAN kamu kopi, air, dan mesin kopi.
Kamu tidak perlu tahu dari mana asalnya.
Bisa kopi arabica atau robusta, bisa air mineral atau air biasa.
```

---

## Mengapa Perlu DI?

### 1. Testability

```javascript
// ❌ TANPA DI - Sulit di-test
function fetchUserData(userId) {
  // Langsung panggil database
  return database.query(`SELECT * FROM users WHERE id = ${userId}`);
}

// Bagaimana test ini tanpa database asli? 🤔

// ✅ DENGAN DI - Mudah di-test
function fetchUserData(userId, repository) {
  return repository.findById(userId);
}

// Test dengan mock
const mockRepo = {
  findById: jest.fn().mockResolvedValue({ id: 1, name: "Test" }),
};
fetchUserData(1, mockRepo);
```

### 2. Flexibility

```javascript
// ❌ TANPA DI - Terikat ke satu implementasi
import axios from "axios";

async function fetchData(url) {
  return axios.get(url);
}

// Mau ganti ke fetch()? Harus ubah fungsi!

// ✅ DENGAN DI - Bebas ganti implementasi
async function fetchData(url, httpClient) {
  return httpClient.get(url);
}

// Pakai axios
fetchData("/api", { get: (url) => axios.get(url) });

// Pakai fetch
fetchData("/api", { get: (url) => fetch(url).then((r) => r.json()) });
```

### 3. Single Responsibility

```javascript
// ❌ TANPA DI - Fungsi tahu terlalu banyak
function processOrder(orderId) {
  const order = mysql.query("SELECT * FROM orders WHERE id = ?", orderId);
  const email = new EmailService("smtp.gmail.com", 587, "user", "pass");
  email.send(order.customerEmail, "Order processed!");
  return order;
}

// ✅ DENGAN DI - Fungsi fokus ke logic saja
function processOrder(orderId, orderRepository, notificationService) {
  const order = orderRepository.findById(orderId);
  notificationService.notify(order.customerEmail, "Order processed!");
  return order;
}
```

---

## Cara Kerja DI

### Pola Dasar

```
┌─────────────────────────────────────────────────────────┐
│                    COMPOSITION ROOT                      │
│         (tempat merakit semua dependencies)              │
│                                                          │
│   const gateway = new InswApiGateway();                  │
│   const useCase = new FetchHsCodeUseCase(gateway);       │
│   const controller = new HsCodeController(useCase);      │
└─────────────────────────────────────────────────────────┘
                          │
                          │ inject
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     CONTROLLER                           │
│                                                          │
│   class HsCodeController {                               │
│     constructor(fetchUseCase) {                          │
│       this.fetchUseCase = fetchUseCase;                  │
│     }                                                    │
│   }                                                      │
└─────────────────────────────────────────────────────────┘
                          │
                          │ inject
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      USE CASE                            │
│                                                          │
│   class FetchHsCodeUseCase {                             │
│     constructor(gateway) {                               │
│       this.gateway = gateway;                            │
│     }                                                    │
│   }                                                      │
└─────────────────────────────────────────────────────────┘
                          │
                          │ inject
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      GATEWAY                             │
│                                                          │
│   class InswApiGateway {                                 │
│     async fetchByCode(code) {                            │
│       return fetch(...);                                 │
│     }                                                    │
│   }                                                      │
└─────────────────────────────────────────────────────────┘
```

### Tiga Jenis DI

#### 1. Constructor Injection (Paling Umum)

```javascript
class OrderService {
  constructor(repository, emailService) {
    this.repository = repository;
    this.emailService = emailService;
  }

  process(orderId) {
    const order = this.repository.find(orderId);
    this.emailService.send(order.email, "Done!");
  }
}

// Inject via constructor
const service = new OrderService(new MySqlRepository(), new GmailService());
```

#### 2. Method Injection

```javascript
class OrderService {
  process(orderId, repository, emailService) {
    const order = repository.find(orderId);
    emailService.send(order.email, "Done!");
  }
}

// Inject via method parameter
const service = new OrderService();
service.process(123, new MySqlRepository(), new GmailService());
```

#### 3. Property Injection

```javascript
class OrderService {
  repository = null;
  emailService = null;

  process(orderId) {
    const order = this.repository.find(orderId);
    this.emailService.send(order.email, "Done!");
  }
}

// Inject via property
const service = new OrderService();
service.repository = new MySqlRepository();
service.emailService = new GmailService();
service.process(123);
```

---

## Implementasi di JavaScript

### Functional Approach (Dipakai di proyek ini)

```javascript
// Buat factory function yang menerima dependencies
function createFetchHsCodeDataUseCase(hsCodeGateway) {
  // Return object dengan methods
  return {
    async fetchSingle(code) {
      const data = await hsCodeGateway.fetchByCode(code);
      return createHsCode(data);
    },

    async fetchMultiple(codes) {
      return Promise.all(codes.map((code) => this.fetchSingle(code)));
    },
  };
}

// Penggunaan
const gateway = inswApiGateway; // implementasi konkret
const useCase = createFetchHsCodeDataUseCase(gateway);
await useCase.fetchSingle("12345678");
```

### Class-based Approach

```javascript
class FetchHsCodeDataUseCase {
  #gateway;

  constructor(hsCodeGateway) {
    this.#gateway = hsCodeGateway;
  }

  async fetchSingle(code) {
    const data = await this.#gateway.fetchByCode(code);
    return createHsCode(data);
  }
}

// Penggunaan
const useCase = new FetchHsCodeDataUseCase(inswApiGateway);
await useCase.fetchSingle("12345678");
```

---

## Penerapan di Proyek INSScan

### Struktur DI

```
┌────────────────────────────────────────────────────────────────┐
│ app/api/hs-code/route.js (Composition Root)                    │
│                                                                │
│   import { hsCodeController } from '...controller';            │
│                          │                                     │
│                          │ already composed                    │
│                          ▼                                     │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ app/adapters/controllers/hs-code.controller.js                 │
│                                                                │
│   import { inswApiGateway } from '...service';                 │
│                                                                │
│   const fetchHsCodeUseCase = createFetchHsCodeDataUseCase(     │
│     inswApiGateway  // <-- INJECTION TERJADI DI SINI           │
│   );                                                           │
│                                                                │
│   export const hsCodeController = createHsCodeController();    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ app/core/use-cases/fetch-hs-code-data.js                       │
│                                                                │
│   // Use Case TIDAK IMPORT gateway konkret                     │
│   // Menerima sebagai parameter                                │
│                                                                │
│   export function createFetchHsCodeDataUseCase(hsCodeGateway) {│
│     return {                                                   │
│       async fetchSingle(code) {                                │
│         const data = await hsCodeGateway.fetchByCode(code);    │
│         //                  ^^^^^^^^^^^^                       │
│         // Ini adalah INTERFACE, bukan implementasi            │
│       }                                                        │
│     };                                                         │
│   }                                                            │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ app/infrastructure/services/insw-api.service.js                │
│                                                                │
│   // Implementasi KONKRET dari interface                       │
│   export const inswApiGateway = {                              │
│     async fetchByCode(hsCode) {                                │
│       return fetch(`${API_URL}?hs_code=${hsCode}`);            │
│     }                                                          │
│   };                                                           │
└────────────────────────────────────────────────────────────────┘
```

### Kenapa Pakai Factory Function?

```javascript
// Factory function lebih fleksibel di JavaScript
function createFetchHsCodeDataUseCase(hsCodeGateway) {
  // Closure - gateway tersimpan dalam scope
  return {
    async fetchSingle(code) {
      return hsCodeGateway.fetchByCode(code);
    },
  };
}

// Keuntungan:
// 1. Tidak perlu 'this' binding issues
// 2. Private by default (closure)
// 3. Lebih functional, sesuai React/Next.js style
// 4. Mudah di-compose
```

---

## Testing dengan DI

### Unit Test Use Case

```javascript
// __tests__/fetch-hs-code-data.test.js

import { createFetchHsCodeDataUseCase } from "../core/use-cases/fetch-hs-code-data";

describe("FetchHsCodeDataUseCase", () => {
  it("should return HS code data when valid code", async () => {
    // Arrange - Buat mock gateway
    const mockGateway = {
      fetchByCode: jest.fn().mockResolvedValue({
        bm: "5%",
        ppn: "11%",
        pph: "2.5%",
      }),
    };

    // Act - Inject mock ke use case
    const useCase = createFetchHsCodeDataUseCase(mockGateway);
    const result = await useCase.fetchSingle("12345678");

    // Assert
    expect(mockGateway.fetchByCode).toHaveBeenCalledWith("12345678");
    expect(result.bm).toBe("5%");
    expect(result.ppn).toBe("11%");
  });

  it("should return empty HS code when gateway returns null", async () => {
    const mockGateway = {
      fetchByCode: jest.fn().mockResolvedValue(null),
    };

    const useCase = createFetchHsCodeDataUseCase(mockGateway);
    const result = await useCase.fetchSingle("12345678");

    expect(result.bm).toBe("tidak ada data");
  });

  it("should return empty HS code for invalid code", async () => {
    const mockGateway = {
      fetchByCode: jest.fn(), // Tidak akan dipanggil
    };

    const useCase = createFetchHsCodeDataUseCase(mockGateway);
    const result = await useCase.fetchSingle("invalid");

    expect(mockGateway.fetchByCode).not.toHaveBeenCalled();
    expect(result.bm).toBe("tidak ada data");
  });
});
```

### Integration Test dengan Real Gateway

```javascript
// __tests__/integration/insw-api.test.js

import { inswApiGateway } from "../infrastructure/services/insw-api.service";
import { createFetchHsCodeDataUseCase } from "../core/use-cases/fetch-hs-code-data";

describe("INSW API Integration", () => {
  it("should fetch real data from INSW", async () => {
    // Skip in CI, run manually
    if (process.env.CI) return;

    const useCase = createFetchHsCodeDataUseCase(inswApiGateway);
    const result = await useCase.fetchSingle("84713010"); // Laptop

    expect(result.code).toBe("84713010");
    expect(result.bm).toBeDefined();
  });
});
```

### Mocking Strategies

```javascript
// 1. Simple mock object
const simpleMock = {
  fetchByCode: () => Promise.resolve({ bm: "5%" }),
};

// 2. Jest mock with tracking
const jestMock = {
  fetchByCode: jest.fn().mockResolvedValue({ bm: "5%" }),
};
expect(jestMock.fetchByCode).toHaveBeenCalledTimes(1);

// 3. Conditional mock
const conditionalMock = {
  fetchByCode: (code) => {
    if (code === "12345678") return Promise.resolve({ bm: "5%" });
    if (code === "invalid") return Promise.resolve(null);
    return Promise.reject(new Error("Unknown code"));
  },
};

// 4. Spy on real implementation
const spyGateway = {
  ...inswApiGateway,
  fetchByCode: jest.spyOn(inswApiGateway, "fetchByCode"),
};
```

---

## Best Practices

### ✅ DO

```javascript
// 1. Inject dependencies via constructor/factory
function createService(repository) {
  return {
    /* ... */
  };
}

// 2. Depend on abstractions (interfaces)
async function fetchData(gateway) {
  return gateway.fetch(); // gateway adalah interface
}

// 3. Single composition root
// app/api/route.js - tempat merakit semua dependencies
```

### ❌ DON'T

```javascript
// 1. Jangan hardcode dependencies
import { MySqlDatabase } from "mysql";
function fetchData() {
  return MySqlDatabase.query("...");
}

// 2. Jangan buat instance di dalam fungsi
function processOrder() {
  const emailService = new GmailService(); // ❌
  emailService.send();
}

// 3. Jangan pakai singleton global
const globalDb = new Database(); // ❌
export function query(sql) {
  return globalDb.query(sql);
}
```

---

## Kesimpulan

| Aspek       | Tanpa DI                 | Dengan DI              |
| ----------- | ------------------------ | ---------------------- |
| Testing     | Harus mock global/module | Inject mock langsung   |
| Coupling    | Tinggi (import langsung) | Rendah (via interface) |
| Flexibility | Sulit ganti implementasi | Mudah swap anytime     |
| Readability | Dependencies tersembunyi | Dependencies eksplisit |
| Maintenance | Perubahan ripple effect  | Isolated changes       |

---

_Dokumentasi ini adalah bagian dari seri pembelajaran untuk proyek INSScan._
