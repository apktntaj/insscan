# Implementation Plan

- [-] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Undefined Shipments Crashes on `.length` and `.map()`
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: The bug condition is deterministic (`props.shipments === undefined`), so scope the property to the concrete failing cases: render `ShipmentTable` with `shipments` omitted or explicitly `undefined`
  - Test cases to write (using React Testing Library + Jest):
    - Render `<ShipmentTable loading={false} query="" onQueryChange={() => {}} onEdit={() => {}} onTerminate={() => {}} />` (shipments omitted) — assert no `TypeError` is thrown
    - Render with `shipments={undefined}` explicitly — assert no `TypeError` is thrown
    - Render with `shipments={undefined}` — assert the empty-state text "No shipment records yet." is present in the output
  - Run tests on UNFIXED code (`function ShipmentTable({ shipments, loading, … })`)
  - **EXPECTED OUTCOME**: Tests FAIL with `TypeError: Cannot read properties of undefined (reading 'length')` — this is correct and confirms the bug exists
  - Document counterexamples found (e.g., `ShipmentTable({ shipments: undefined, loading: false, … })` throws `TypeError` instead of rendering empty-state row)
  - Mark task complete when tests are written, run, and the failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Undefined Shipments Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology — run UNFIXED code first, observe outputs, then encode as tests
  - Observe on UNFIXED code (all these inputs satisfy `NOT isBugCondition(props)`, i.e. `props.shipments !== undefined`):
    - `shipments=[]` → renders "No shipment records yet. Create one to get started." row
    - `shipments=[mockShipment]` → renders one `<tr>` with all 8 columns populated
    - `loading=true, shipments=[]` → renders 4 skeleton rows (no data rows)
    - `loading=true, shipments=[mockShipment]` → renders 4 skeleton rows (loading takes precedence)
    - `shipments=[], query="abc"` → renders "No shipments match your search." row
  - Write property-based tests capturing these observed behaviors:
    - For all arrays of 0 shipments: assert empty-state row is shown (not a crash)
    - For all arrays of N ≥ 1 shipments: assert exactly N data rows are rendered
    - For all inputs where `loading=true`: assert 4 skeleton rows appear regardless of `shipments` value
    - For all non-empty `query` strings with an empty filtered array: assert "No shipments match your search." is shown
  - Verify all tests PASS on UNFIXED code before proceeding
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for undefined `shipments` prop crashing ShipmentTable during SSR

  - [ ] 3.1 Implement the fix
    - In `app/presentation/components/features/ShipmentTable.jsx`, change the function signature from:
      `export default function ShipmentTable({ shipments, loading, query, onQueryChange, onEdit, onTerminate, alertsByShipmentId })`
      to:
      `export default function ShipmentTable({ shipments = [], loading, query, onQueryChange, onEdit, onTerminate, alertsByShipmentId })`
    - This is the only line that needs to change — no other logic is modified
    - The default value `= []` makes `shipments.length === 0` evaluate to `true` and `shipments.map(…)` return `[]` when the prop is `undefined`, both safe operations that produce the correct empty-state render
    - _Bug_Condition: isBugCondition(props) where props.shipments === undefined_
    - _Expected_Behavior: render completes without throwing; empty-state row "No shipment records yet. Create one to get started." is displayed_
    - _Preservation: all render paths where props.shipments !== undefined must produce identical output before and after the fix_
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Undefined Shipments Renders Safely
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior (no crash + empty-state row shown)
    - Run bug condition exploration tests from step 1 against the FIXED code
    - **EXPECTED OUTCOME**: Tests PASS — confirms the bug is fixed
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Undefined Shipments Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2 against the FIXED code
    - **EXPECTED OUTCOME**: Tests PASS — confirms no regressions in any existing render path
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite (`npm test`) and confirm all tests pass
  - Verify the production build succeeds (`npm run build`) with no `TypeError` during static generation
  - Ensure all tests pass; ask the user if questions arise
