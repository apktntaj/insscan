// Feature: shipment-management, Property 15: H-1 is always a working day before the target date

import * as fc from "fast-check";
import {
  getHMinusOne,
  isWeekend,
  isPublicHoliday,
  isWorkingDay,
  toIsoDateString,
} from "../public-holidays.js";

/**
 * Returns an array of all dates strictly between `start` (exclusive) and `end` (exclusive).
 * Both dates are compared at day granularity (time is ignored).
 * @param {Date} start
 * @param {Date} end
 * @returns {Date[]}
 */
function daysBetween(start, end) {
  const days = [];
  // Normalise to midnight to avoid time-of-day drift
  const cursor = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 1
  );
  const endNorm = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );
  while (cursor < endNorm) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/**
 * Normalise a Date to midnight local time so comparisons are day-level only.
 * @param {Date} date
 * @returns {Date}
 */
function toMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

describe("Property 15: H-1 is always a working day before the target date", () => {
  // Validates: Requirements 7.1, 7.2

  test(
    "getHMinusOne returns a date strictly before targetDate",
    () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
          (targetDate) => {
            const hMinus1 = getHMinusOne(targetDate);
            const hMinus1Norm = toMidnight(hMinus1);
            const targetNorm = toMidnight(targetDate);
            // Condition 1: H-1 must be strictly before targetDate
            expect(hMinus1Norm < targetNorm).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "getHMinusOne does not return a Saturday or Sunday",
    () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
          (targetDate) => {
            const hMinus1 = getHMinusOne(targetDate);
            // Condition 2: H-1 must not be a weekend
            expect(isWeekend(hMinus1)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "getHMinusOne does not return a public holiday",
    () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
          (targetDate) => {
            const hMinus1 = getHMinusOne(targetDate);
            // Condition 3: H-1 must not be a public holiday
            expect(isPublicHoliday(hMinus1)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "getHMinusOne returns a working day (not weekend and not public holiday)",
    () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
          (targetDate) => {
            const hMinus1 = getHMinusOne(targetDate);
            // Combined check for conditions 2 & 3
            expect(isWorkingDay(hMinus1)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "no working day exists strictly between getHMinusOne(targetDate) and targetDate",
    () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
          (targetDate) => {
            const hMinus1 = getHMinusOne(targetDate);
            // Condition 4: every day strictly between H-1 and targetDate must be
            // a weekend or a public holiday (i.e., NOT a working day)
            const between = daysBetween(hMinus1, targetDate);
            for (const day of between) {
              expect(isWorkingDay(day)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    "all four Property 15 conditions hold simultaneously for any target date",
    () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
          (targetDate) => {
            const hMinus1 = getHMinusOne(targetDate);
            const hMinus1Norm = toMidnight(hMinus1);
            const targetNorm = toMidnight(targetDate);

            // Condition 1: strictly before targetDate
            expect(hMinus1Norm < targetNorm).toBe(true);

            // Condition 2: not a weekend
            expect(isWeekend(hMinus1)).toBe(false);

            // Condition 3: not a public holiday
            expect(isPublicHoliday(hMinus1)).toBe(false);

            // Condition 4: no working day between H-1 and targetDate
            const between = daysBetween(hMinus1, targetDate);
            for (const day of between) {
              expect(isWorkingDay(day)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
