# vercel-build-map-undefined Bugfix Design

## Overview

During Next.js static generation (SSR), the root page (`/`) pre-renders `ShipmentTable`
before the `useShipments` hook has initialized its state. At that moment the `shipments`
prop is `undefined`. The component calls `shipments.length` and `shipments.map()` without
a guard, which throws a `TypeError` and aborts the Vercel production build.

The fix is a single-character change: add a default value `shipments = []` in the
destructured props of `ShipmentTable`. This makes the component safe to render with no
data while leaving every runtime code path completely unchanged.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — `props.shipments` is
  `undefined` when `ShipmentTable` is rendered.
- **Property (P)**: The desired behavior when the bug condition holds — the component
  renders without throwing and shows the empty-state row.
- **Preservation**: All existing render paths (non-empty list, empty array, loading
  skeleton, search empty state, edit/terminate actions) that must remain byte-for-byte
  identical after the fix.
- **ShipmentTable**: The React component in
  `app/presentation/components/features/ShipmentTable.jsx` that renders the shipment
  list table.
- **SSR / Static Generation**: Next.js pre-renders pages to HTML at build time. During
  this phase React renders components synchronously; async data-fetching hooks have not
  yet resolved, so props that depend on them may be `undefined`.
- **isBugCondition(props)**: Pseudocode predicate — returns `true` when
  `props.shipments === undefined`.

---

## Bug Details

### Bug Condition

The bug manifests when `ShipmentTable` is rendered during Next.js static generation and
the `shipments` prop has not been supplied (i.e. it is `undefined`). The component
immediately evaluates `shipments.length` in the conditional branch and `shipments.map()`
in the JSX, both of which throw a `TypeError` on `undefined`.

**Formal Specification:**

```
FUNCTION isBugCondition(props)
  INPUT:  props of type ShipmentTableProps
  OUTPUT: boolean

  RETURN props.shipments = undefined
END FUNCTION
```

### Examples

| # | Input (`shipments`) | Current behavior | Expected behavior |
|---|---------------------|-----------------|-------------------|
| 1 | `undefined` (SSR, hook not yet resolved) | `TypeError: Cannot read properties of undefined (reading 'length')` — build aborts | Renders empty-state row; build succeeds |
| 2 | `undefined` (unit test, prop omitted) | Same `TypeError` | Renders empty-state row |
| 3 | `[]` (empty array, runtime) | Renders "No shipment records yet." row | Unchanged — still renders "No shipment records yet." row |
| 4 | `[{ id: 1, … }]` (non-empty, runtime) | Renders one `<tr>` per shipment | Unchanged |

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- When `shipments` is a non-empty array, the component SHALL continue to render one
  `<tr>` per shipment with all eight columns (shipment number, B/L, shipper, consignee,
  vessel/voyage, ETA, alias, actions).
- When `shipments` is an empty array (`[]`), the component SHALL continue to display
  the "No shipment records yet. Create one to get started." empty-state row.
- When `query` is set and no rows match, the component SHALL continue to display "No
  shipments match your search." (this path is controlled by the parent; the component
  itself renders whatever filtered array it receives).
- When `loading` is `true`, the component SHALL continue to render four skeleton
  placeholder rows regardless of the `shipments` value.
- Edit and Terminate action buttons SHALL continue to work exactly as before for
  non-`undefined` `shipments`.
- The terminate confirmation dialog flow SHALL remain unchanged.

**Scope:**

All render paths where `shipments` is NOT `undefined` are completely unaffected by this
fix. The only behavioral change is: `undefined` is now treated identically to `[]`.

---

## Hypothesized Root Cause

The component was written assuming callers always pass a valid array. This is safe at
runtime because `useShipments` initialises its state to `[]`. However, Next.js static
generation renders the component tree synchronously before any hook state is available,
so the prop arrives as `undefined`.

There is exactly one root cause:

1. **Missing default value in prop destructuring**: The function signature
   `function ShipmentTable({ shipments, … })` does not provide a fallback for
   `shipments`. JavaScript destructuring without a default leaves the binding as
   `undefined` when the key is absent or explicitly `undefined`. Adding `shipments = []`
   makes the component self-defensive without changing any downstream logic.

No other causes are plausible: the component does not fetch data itself, does not use
`useEffect`, and does not depend on any external service — the only entry point for
`undefined` is the prop.

---

## Correctness Properties

Property 1: Bug Condition — Undefined Shipments Renders Safely

_For any_ render where `isBugCondition(props)` is true (i.e. `props.shipments` is
`undefined`), the fixed `ShipmentTable` SHALL complete rendering without throwing a
`TypeError` and SHALL display the empty-state row ("No shipment records yet. Create one
to get started.").

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation — Non-Undefined Shipments Behavior Unchanged

_For any_ render where `isBugCondition(props)` is false (i.e. `props.shipments` is a
defined value — empty array, non-empty array, or any other non-`undefined` value), the
fixed `ShipmentTable` SHALL produce exactly the same rendered output as the original
`ShipmentTable`, preserving all existing table rows, loading skeletons, empty-state
messages, and action button behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

---

## Fix Implementation

### Data Shapes

```js
/**
 * @typedef {Object} ShipmentTableProps
 * @property {Object[]}            [shipments]          - List of shipment view-models; defaults to []
 * @property {boolean}             loading              - When true, render skeleton rows
 * @property {string}              query                - Current search string
 * @property {(q: string) => void} onQueryChange        - Search input change handler
 * @property {(s: Object) => void} onEdit               - Edit action handler
 * @property {(id: number) => Promise<void>} onTerminate - Terminate action handler
 * @property {Map<number, Object>} [alertsByShipmentId] - Optional alert map keyed by shipment id
 */
```

### Function Contract

```
ShipmentTable(props: ShipmentTableProps) → JSX.Element

Purpose : Render the shipment list table with search, edit, and terminate actions.
Input   : ShipmentTableProps (shipments defaults to [] when undefined)
Output  : A React element — skeleton rows when loading, empty-state row when shipments
          is empty, one data row per shipment otherwise.

@example
ShipmentTable({ shipments: undefined, loading: false, query: "", … })
// → renders empty-state row; no crash

@example
ShipmentTable({ shipments: [{ id: 1, blNumber: "ABCD", … }], loading: false, query: "", … })
// → renders one <tr> for shipment id 1; identical to pre-fix behavior
```

### Changes Required

**File**: `app/presentation/components/features/ShipmentTable.jsx`

**Function**: `ShipmentTable` (default export)

**Specific Change** — add default value in destructured props:

```js
// Before
export default function ShipmentTable({ shipments, loading, query, onQueryChange, onEdit, onTerminate, alertsByShipmentId }) {

// After
export default function ShipmentTable({ shipments = [], loading, query, onQueryChange, onEdit, onTerminate, alertsByShipmentId }) {
```

No other files need modification. The change is purely defensive: when `shipments` is
`undefined` the binding resolves to `[]`, which makes `shipments.length === 0` evaluate
to `true` and `shipments.map(…)` return `[]` — both safe operations that produce the
correct empty-state render.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that
demonstrate the bug on the unfixed code, then verify the fix works correctly and
preserves all existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix.
Confirm the root cause (missing default value) by observing the exact `TypeError` thrown
when `shipments` is `undefined`.

**Test Plan**: Render `ShipmentTable` with `shipments` omitted (or explicitly set to
`undefined`) using a React testing library and assert that no error is thrown. Run these
tests on the UNFIXED code to observe the `TypeError` and confirm the root cause.

**Test Cases**:

1. **Undefined prop — no crash** (will fail on unfixed code): Render
   `<ShipmentTable loading={false} query="" … />` without passing `shipments`. Assert
   the component renders without throwing.
2. **Undefined prop — empty-state row** (will fail on unfixed code): Same render as
   above. Assert the empty-state text "No shipment records yet." is present in the
   output.
3. **Explicit undefined — no crash** (will fail on unfixed code): Render with
   `shipments={undefined}` explicitly. Assert no `TypeError`.

**Expected Counterexamples**:

- `TypeError: Cannot read properties of undefined (reading 'length')` thrown during
  render when `shipments` is `undefined`.
- Possible causes: missing default value in destructuring (confirmed root cause).

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed component
renders correctly.

**Pseudocode:**

```
FOR ALL props WHERE isBugCondition(props) DO
  result ← render ShipmentTable'(props)
  ASSERT no_crash(result)
  ASSERT result contains "No shipment records yet."
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed
component produces the same rendered output as the original.

**Pseudocode:**

```
FOR ALL props WHERE NOT isBugCondition(props) DO
  ASSERT render ShipmentTable(props) = render ShipmentTable'(props)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking
because:

- It generates many shipment array configurations automatically.
- It catches edge cases (single item, many items, items with missing optional fields)
  that manual unit tests might miss.
- It provides strong guarantees that the default-value change does not alter any
  existing render path.

**Test Plan**: Observe behavior on UNFIXED code for non-`undefined` inputs (empty array,
non-empty array, loading state), then write property-based tests capturing that behavior.

**Test Cases**:

1. **Empty array preservation**: Verify `shipments=[]` renders the empty-state row on
   unfixed code, then assert the same after fix.
2. **Non-empty array preservation**: Verify `shipments=[…]` renders one row per item on
   unfixed code, then assert the same after fix.
3. **Loading skeleton preservation**: Verify `loading=true` renders skeleton rows
   regardless of `shipments` value, then assert the same after fix.
4. **Search empty-state preservation**: Verify that when the parent passes a filtered
   empty array with a non-empty `query`, the "No shipments match your search." message
   appears, then assert the same after fix.

### Unit Tests

- Render with `shipments` omitted — assert no crash and empty-state row is shown.
- Render with `shipments={undefined}` explicitly — assert no crash.
- Render with `shipments={[]}` — assert empty-state row (unchanged behavior).
- Render with `shipments={[mockShipment]}` — assert one data row rendered (unchanged).
- Render with `loading={true}` and `shipments={undefined}` — assert skeleton rows shown,
  no crash.

### Property-Based Tests

- Generate arrays of 0–50 random shipment objects; assert the fixed component renders
  exactly `shipments.length` data rows (or the empty-state row when length is 0).
- Generate random `loading` booleans paired with random `shipments` arrays; assert
  skeleton rows appear when `loading` is `true` regardless of `shipments`.
- Generate random `shipments` arrays and assert that the fixed component output matches
  the original component output for every non-`undefined` input (preservation property).

### Integration Tests

- Run `next build` in CI against the fixed code and assert the build exits with code 0.
- Render the root page (`/`) in a test environment and assert no `TypeError` is thrown
  during the SSR pass.
- Verify the shipments page loads correctly in a browser after the fix is deployed.
