---
title: Spec & Code Conventions
inclusion: always
---

## Spec Design Convention

Every spec's Design section must follow this order:

1. **Data Shapes** — define all data structures using JSDoc @typedef before anything else
2. **Function Contracts** — for each non-trivial function: name, inputs, output, one-line purpose
3. **Wish List** — if a function is complex, list the helper functions it needs as stubs first
4. **Examples** — at least 2 concrete input-output pairs per function contract

Do not proceed to Tasks until all four subsections are complete.

## Data Shape Rules

- Use string unions for categorical data, not boolean flags
  - Good: `@typedef {"pending" | "approved" | "rejected"} Status`
  - Avoid: `isPending: boolean, isApproved: boolean`
- Document which fields are conditional and under what state they exist
- Invalid combinations must be noted explicitly in @typedef comments
- Make impossible states unrepresentable by design — if a state should never exist, the data shape should not allow it

## Data Invariants

- If a data shape has invariants, enforce them at construction via a factory function — not at the call site
- Factory functions are named `make<DataName>`
- If the invariant is violated, return an explicit error shape — do not throw

```js
/**
 * @typedef {Object} HSCode
 * @property {string} code — exactly 6-10 numeric digits
 * @property {string} description
 */

/**
 * Creates a valid HSCode.
 * Invariant: code must be 6-10 numeric digits.
 * @param {string} code
 * @param {string} description
 * @returns {{ ok: true, data: HSCode } | { ok: false, error: string }}
 */
function makeHSCode(code, description) {
  if (!/^\d{6,10}$/.test(code)) {
    return { ok: false, error: `Invalid HS code: ${code}` }
  }
  return { ok: true, data: { code, description } }
}
```

## Parse, Don't Validate

- All data arriving from outside the system (API responses, form inputs, file uploads, URL params) must be parsed at the boundary into a known valid shape before being used anywhere else
- Parsing happens in one dedicated place per data source — not scattered across functions
- After parsing, the rest of the codebase can trust the data shape without re-checking
- If parsing fails, return an explicit error shape — do not throw or silently ignore

```js
// Good — parse at boundary
function parseBLResponse(raw) {
  if (!raw.blNumber || !raw.shipper) {
    return { ok: false, error: "Missing required fields" }
  }
  return {
    ok: true,
    data: {
      blNumber: raw.blNumber,
      shipper: raw.shipper,
      containers: raw.containers ?? []
    }
  }
}

// Bad — validate inside business logic
function processShipment(raw) {
  if (!raw.blNumber) throw new Error("Missing BL")
  // ...
}
```

## Function Rules

- **One task per function** — if the purpose statement contains "and", split the function
- **Wish list before implementation** — if a function needs helpers, write all helpers as stubs first, then implement one by one
- Every exported function must have JSDoc with @param, @returns, and one-line purpose
- Write at least 2 concrete input-output examples as comments before implementing

```js
/**
 * Formats a parsed BL into a human-readable summary.
 * @param {BLData} bl
 * @returns {string}
 *
 * @example
 * formatBL({ blNumber: "ABCD123", shipper: "PT X", containers: ["CX01"] })
 * // => "BL ABCD123 | PT X | 1 container"
 *
 * @example
 * formatBL({ blNumber: "ZZ999", shipper: "CV Y", containers: [] })
 * // => "BL ZZ999 | CV Y | 0 containers"
 */
function formatBL(bl) { ... }
```

---