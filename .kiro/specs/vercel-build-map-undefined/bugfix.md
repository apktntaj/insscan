# Bugfix Requirements Document

## Introduction

The Vercel production build fails during static page generation with a `TypeError: Cannot read properties of undefined (reading 'map')`. This crash occurs when Next.js pre-renders the root page (`/`) during the SSR phase, before the `useShipments` hook has initialized its state. The `ShipmentTable` component receives `shipments` as `undefined` at that moment and calls `.length` and `.map()` on it directly, causing the build to abort. The fix must make `ShipmentTable` safe to render with no shipments data while leaving all runtime behavior unchanged.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `ShipmentTable` is rendered during Next.js static generation (SSR) and the `shipments` prop is `undefined` THEN the system crashes with `TypeError: Cannot read properties of undefined (reading 'map')`

1.2 WHEN `ShipmentTable` is rendered during Next.js static generation (SSR) and the `shipments` prop is `undefined` THEN the system aborts the Vercel production build and the deployment fails

1.3 WHEN `ShipmentTable` is rendered during Next.js static generation (SSR) and the `shipments` prop is `undefined` THEN the system crashes with `TypeError: Cannot read properties of undefined (reading 'length')` when evaluating `shipments.length === 0`

### Expected Behavior (Correct)

2.1 WHEN `ShipmentTable` is rendered during Next.js static generation (SSR) and the `shipments` prop is `undefined` THEN the system SHALL treat `shipments` as an empty array and render without throwing

2.2 WHEN `ShipmentTable` is rendered during Next.js static generation (SSR) and the `shipments` prop is `undefined` THEN the system SHALL complete the Vercel production build successfully

2.3 WHEN `ShipmentTable` is rendered during Next.js static generation (SSR) and the `shipments` prop is `undefined` THEN the system SHALL display the empty-state row ("No shipment records yet. Create one to get started.") rather than crashing

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `shipments` is a non-empty array THEN the system SHALL CONTINUE TO render one table row per shipment with all fields (shipment number, B/L, shipper, consignee, vessel/voyage, ETA, alias, actions)

3.2 WHEN `shipments` is an empty array THEN the system SHALL CONTINUE TO display the empty-state message in the table body

3.3 WHEN `shipments` is a non-empty array and `query` is set THEN the system SHALL CONTINUE TO display the "No shipments match your search." message when no rows are present

3.4 WHEN `shipments` is a non-empty array THEN the system SHALL CONTINUE TO allow editing and terminating individual shipments via the action buttons

3.5 WHEN `loading` is `true` THEN the system SHALL CONTINUE TO render skeleton placeholder rows regardless of the `shipments` value

---

## Bug Condition (Pseudocode)

**Bug Condition Function** — identifies inputs that trigger the bug:

```pascal
FUNCTION isBugCondition(props)
  INPUT: props of type ShipmentTableProps
  OUTPUT: boolean

  RETURN props.shipments = undefined
END FUNCTION
```

**Property: Fix Checking** — correct behavior for buggy inputs:

```pascal
FOR ALL props WHERE isBugCondition(props) DO
  result ← render ShipmentTable'(props)
  ASSERT no_crash(result)
  ASSERT result contains empty-state row
END FOR
```

**Property: Preservation Checking** — non-buggy inputs must be unaffected:

```pascal
FOR ALL props WHERE NOT isBugCondition(props) DO
  ASSERT render ShipmentTable(props) = render ShipmentTable'(props)
END FOR
```
