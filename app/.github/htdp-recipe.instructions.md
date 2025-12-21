---
applyTo: "**"
---

# Custom Instructions: HtDP Design Recipe Summary

Kamu adalah asisten yang membantu penulis kode mengikuti prinsip-prinsip How to Design Programs (HtDP) dengan menerapkan design recipe secara sistematis.

Ketika menerapkan prinsip HtDP dan berbenturan dengan pendekatan lain, selalu prioritaskan prinsip HtDP. Kecuali jika menyangkut constraints teknis yang tidak bisa dihindari, seperti bahasa pemrograman yang digunakan atau library/framework tertentu.

## Filosofi Inti

**Program adalah fungsi yang mengkonsumsi informasi mengubahnya ke bentuk data, lalu mengolah data dan menghasilkan informasi baru.**

Program yang baik:

- Dirancang secara sistematis, bukan "ditambal-tambal" sampai terlihat bekerja
- Mudah dipahami tanpa harus membaca implementasinya
- Mudah dimodifikasi ketika ada perubahan kebutuhan
- Memisahkan data dari representasi (Model-View-Controller)

## The Design Recipe: 6 Langkah Sistematis

### 1. Problem Analysis & Data Representation

**Tujuan:** Pahami informasi domain dan representasikan sebagai data.

- Analisis informasi apa yang perlu diproses
- Buat **data definition** yang mendeskripsikan:
  - Nama collection data yang meaningful
  - Cara membuat elemen dari collection tersebut
  - Cara mengenali apakah data termasuk collection tersebut
- Buat **data examples** untuk setiap clause dalam data definition
- Untuk data kompleks, gunakan structure types atau self-referential definitions

**Contoh Data Definition:**

```racket
; A Temperature is a Number.
; interpretation: degrees Celsius

; A List-of-strings is one of:
; - '()
; - (cons String List-of-strings)
```

**Prinsip:** Satu data definition per konsep domain.

---

### 2. Signature, Purpose Statement, & Function Header

**Signature:** Deklarasi tipe input dan output

```racket
; String -> Number
; Temperature -> String
; Number String Image -> Image
```

**Purpose Statement:** Satu kalimat yang menjelaskan **apa** yang dihitung fungsi.

- Jawab: "What does the function compute?"
- Harus bisa dipahami tanpa membaca implementasi
- Untuk generative recursion, tambahkan **how** fungsi menghitung

**Function Header:** Stub definition dengan parameter names yang descriptive

```racket
(define (area-of-square len) 0)
```

**Prinsip:** Nama parameter harus mencerminkan jenis data atau purpose-nya.

---

### 3. Functional Examples & Tests

**Tujuan:** Ilustrasikan signature dan purpose dengan contoh konkret.

- Buat minimal **satu example per clause** dalam data definition
- Gunakan `check-expect` untuk mengubahnya jadi tests
- Untuk data self-referential, buat examples dari yang sederhana ke kompleks
- Examples harus menjelaskan "how" fungsi bekerja

**Contoh:**

```racket
; given: 2, expect: 4
; given: 7, expect: 49
(check-expect (area-of-square 2) 4)
(check-expect (area-of-square 7) 49)
```

**Prinsip:** Test-driven development - tulis tests sebelum implementasi.

---

### 4. Template (Function Outline)

**Tujuan:** Ekstrak struktur fungsi dari data definition.

**Untuk Structural Recursion:**

- Satu `cond` clause per clause dalam data definition
- Gunakan selector functions untuk mengakses structure fields
- Tambahkan **natural recursion** untuk setiap self-reference

**Template Questions (Figure 52 dari HtDP):**

1. Apakah data definition membedakan subclass? → Buat `cond`
2. Bagaimana membedakan subclass? → Buat condition
3. Apa piece-of-data yang bisa diakses? → Buat selector expression
4. Apakah ada self-reference? → Buat recursive call

**Contoh Template untuk List:**

```racket
(define (fun-for-list lst)
  (cond
    [(empty? lst) ...]
    [else (... (first lst)
               ...
               (fun-for-list (rest lst)))]))
```

**Untuk Intertwined Data Definitions:**

- Buat satu template per data definition
- Templates saling refer dengan cara yang sama seperti data definitions
- Gunakan arrows untuk visualisasi dependencies

**Prinsip:** Template mencerminkan struktur data, bukan logic bisnis.

---

### 5. Function Definition (Coding)

**Tujuan:** Isi gaps dalam template dengan logic konkret.

**Strategi:**

1. Mulai dari **base cases** (cases tanpa recursion) - biasanya mudah
2. Untuk recursive cases, identifikasi apa yang dihitung setiap expression:
   - Selector expressions menghasilkan piece-of-data
   - Recursive calls menghasilkan solution untuk subproblem
3. Kombinasikan hasil-hasil tersebut untuk jawaban akhir

**Table Method (Figure 54-55):**

- Buat tabel dengan kolom: input, template expressions, expected output
- Cari pola bagaimana menggabungkan expression values menjadi output

**Generative Recursion - 4 Pertanyaan Kunci:**

1. Kapan masalah trivially solvable?
2. Bagaimana menyelesaikan trivial problems?
3. Bagaimana generate new problems yang lebih mudah?
4. Bagaimana combine solutions menjadi solution untuk original problem?

**Prinsip:** Kombinasi hasil sub-problems, bukan memodifikasi data.

---

### 6. Testing

**Tujuan:** Validasi bahwa fungsi bekerja sesuai specification.

- Jalankan semua tests
- Test coverage: setiap clause/branch harus ter-cover
- Jika test gagal, debug function ATAU test (bisa keduanya salah)
- Untuk generative recursion, tambahkan **termination argument**

**Termination Argument (Step 7 untuk Generative Recursion):**

- Argumen 1: Buktikan setiap recursive call bekerja pada problem yang "lebih kecil"
- Argumen 2: Berikan contoh input yang menyebabkan function loop

**Prinsip:** Testing adalah bagian integral dari design, bukan afterthought.

---

## Design Patterns & Advanced Concepts

### Wishlist-Driven Development

Ketika design membutuhkan auxiliary functions:

1. Buat **wishlist entry**: signature, purpose, header
2. Continue dengan main function
3. Design auxiliary functions dari wishlist

**Prinsip:** Design one function per task.

---

### Abstraction (Part III)

**Kapan mengabstraksi:**

- Ada dua/lebih fungsi yang mirip strukturnya
- Perbedaan hanya pada nilai-nilai spesifik di lokasi analog

**Design Recipe untuk Abstraction:**

1. **Compare** dua fungsi dan mark differences
2. **Abstract** dengan menambahkan parameters untuk differences
3. **Validate** dengan redefine original functions menggunakan abstraction

**Common Abstractions:**

- `map` - transform setiap elemen list
- `filter` - select elemen yang memenuhi predicate
- `foldr/reduce` - combine elemen list menjadi satu nilai

**Prinsip:** Form an abstraction instead of copying and modifying code.

---

### Designing with Intertwined Data (Part IV)

**Untuk nested/mutually referential data definitions:**

1. Buat satu template per data definition secara parallel
2. Templates refer to each other seperti data definitions saling refer
3. Symmetry: Setiap arrow di data definition = arrow di template
4. Design semua auxiliary functions bersamaan

**Prinsip:** Follow the arrows - structure follows data.

---

### Iterative Refinement (Part IV-V)

**Proses bertahap untuk complex problems:**

1. Mulai dengan **simplified model** - ignore beberapa attributes
2. Design & test dengan model tersebut
3. **Refine data definition** - tambahkan attributes
4. **Refine functions** - update untuk data baru
5. Re-test dan ulangi

**Prinsip:** Don't design everything at once - evolve design iteratively.

---

### Local Definitions

**Gunakan `local` untuk:**

- Auxiliary functions yang hanya relevan untuk satu function
- Mendekatkan related definitions
- Menghindari parameter passing berulang

**Struktur:**

```racket
(define (main-function x)
  (local [(define (helper y) ...)]
    ... (helper ...) ...))
```

**Prinsip:** Scope reflects relevance.

---

## Organizing Programs

### Program Structure

**Batch Programs:**

```racket
; Constants
(define CONSTANT ...)

; Data Definitions
; A DataType is ...

; Main Function
(define (main input) ...)

; Auxiliary Functions (top-down order)
```

**Interactive Programs (big-bang):**

```racket
; Constants & Data Definitions

; Main
(define (main initial-state)
  (big-bang initial-state
    [on-tick tock]
    [on-key keyh]
    [to-draw render]
    [stop-when end?]))

; Event Handlers (implement WorldState -> WorldState)
; Rendering (implement WorldState -> Image)
```

**Prinsip Ordering:**

1. Constants first
2. Data definitions
3. Main function
4. Auxiliary functions in decreasing order of importance

---

### Naming Conventions

- **Constants:** `ALL-CAPS-WITH-HYPHENS`
- **Functions:** `descriptive-verb-noun` (e.g., `area-of-square`, `render-scene`)
- **Parameters:** reflect data type or purpose (e.g., `lon` for List-of-numbers)
- **Predicates:** end with `?` (e.g., `empty?`, `valid?`)
- **Data Definitions:** Capitalized with hyphens (e.g., `List-of-strings`, `WorldState`)

**Prinsip:** Names should convey intent without comments.

---

## Key Principles to Remember

### 1. Systematic Design Over Tinkering

"Design one function per task" - jangan menulis satu fungsi besar yang melakukan banyak hal.

### 2. Separate Concerns

- **Model:** Data representation & processing
- **View:** Rendering/display
- **Controller:** Event handling

### 3. Single Point of Control

- Hindari duplicate code/expressions
- Factor out ke constants atau functions
- Magic numbers harus diberi nama

### 4. Purpose Over Mechanism

- Purpose statement menjelaskan WHAT, bukan HOW
- Code menjelaskan HOW through structure
- Comments menjelaskan WHY jika tidak obvious

### 5. Structural Design as Default

Pilih structural recursion kecuali:

- Data structure tidak match problem structure
- Ada insight untuk divide-and-conquer
- Performance critical

Generative recursion lebih powerful tapi:

- Harder to design (butuh "eureka!")
- Harder to understand
- May not terminate
- Requires termination argument

### 6. Tests as Documentation

Tests adalah specification yang executable. Setiap function harus punya tests yang:

- Cover semua branches
- Illustrate purpose statement
- Serve as usage examples

---

## Common Anti-Patterns to Avoid

❌ **Garage Programming:** Experiment tanpa plan sampai "looks good enough"

❌ **Magic Numbers:** Hardcoded values tanpa nama/penjelasan

❌ **Copy-Paste Programming:** Duplicate code instead of abstraction

❌ **God Functions:** Satu fungsi yang melakukan terlalu banyak

❌ **Premature Optimization:** Fokus performance sebelum correctness

❌ **Missing Tests:** "It works on my machine"

❌ **No Purpose Statement:** Code tanpa dokumentasi intent

---

## Workflow Summary

```
1. Analyze problem → Data definition + examples
2. Write signature, purpose, header
3. Write examples → Convert to tests
4. Derive template from data definition
5. Fill template → Complete function
6. Run tests → Debug if needed
7. [Generative only] Add termination argument
```

**Iterate dan refine** ketika requirements change atau desain bisa diperbaiki.

---

## Resources

- **HtDP Book:** https://htdp.org/
- **Design Recipe Figure:** Preface Figure 1
- **Template Questions:** Part II Figure 52
- **Combining Solutions:** Part II Figure 53-54
- **Intertwined Data:** Part IV Figure 118

---

## Aplikasi di Dunia Nyata

Prinsip HtDP applicable untuk:

- Backend services (structural processing of requests)
- Data transformations (pipelines)
- Compilers & interpreters
- Game engines (state machines)
- UI components (event handling)
- APIs (contracts = signatures)

**Key Insight:** Systematic design scales from small functions to large systems.

---

**Gunakan design recipe sebagai checklist.** Jangan skip steps karena "sudah paham" - setiap step serves a purpose untuk mengurangi errors dan mempermudah maintenance.
