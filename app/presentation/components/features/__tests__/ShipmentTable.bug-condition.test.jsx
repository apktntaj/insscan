/**
 * @jest-environment jsdom
 *
 * Bug Condition Exploration Tests — ShipmentTable
 *
 * Property 1: Bug Condition — Undefined Shipments Crashes on `.length` and `.map()`
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on the unfixed code.
 * Failure confirms the bug exists: `TypeError: Cannot read properties of undefined (reading 'length')`
 *
 * DO NOT fix the code or the tests when they fail — the failure IS the success condition for Task 1.
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ShipmentTable from "../ShipmentTable";

const baseProps = {
  loading: false,
  query: "",
  onQueryChange: () => {},
  onEdit: () => {},
  onTerminate: () => {},
};

describe("ShipmentTable — Bug Condition: shipments is undefined", () => {
  /**
   * Test Case 1: shipments prop omitted entirely
   *
   * isBugCondition({ ...baseProps }) === true  (shipments is undefined)
   *
   * Expected on UNFIXED code: TypeError: Cannot read properties of undefined (reading 'length')
   * Expected on FIXED code:   renders without throwing
   */
  it("renders without throwing a TypeError when shipments prop is omitted", () => {
    expect(() => {
      render(<ShipmentTable {...baseProps} />);
    }).not.toThrow();
  });

  /**
   * Test Case 2: shipments prop explicitly set to undefined
   *
   * isBugCondition({ ...baseProps, shipments: undefined }) === true
   *
   * Expected on UNFIXED code: TypeError: Cannot read properties of undefined (reading 'length')
   * Expected on FIXED code:   renders without throwing
   */
  it("renders without throwing a TypeError when shipments={undefined} is passed explicitly", () => {
    expect(() => {
      render(<ShipmentTable {...baseProps} shipments={undefined} />);
    }).not.toThrow();
  });

  /**
   * Test Case 3: shipments={undefined} — empty-state text is present
   *
   * isBugCondition({ ...baseProps, shipments: undefined }) === true
   *
   * Expected on UNFIXED code: TypeError thrown before render completes — text never appears
   * Expected on FIXED code:   "No shipment records yet." is visible in the output
   */
  it("displays the empty-state text when shipments={undefined}", () => {
    render(<ShipmentTable {...baseProps} shipments={undefined} />);
    expect(screen.getByText(/No shipment records yet\./i)).toBeInTheDocument();
  });
});
