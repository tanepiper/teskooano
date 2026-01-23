import { J2000_JULIAN_DAY } from "@teskooano/data-values";
import { getJulianDayForEpoch } from "./epoch-parsers";

/**
 * Converts a date to Julian Day number.
 * Uses the standard astronomical formula for Julian Day calculation.
 *
 * @param date - The date to convert
 * @returns The Julian Day number
 *
 * @example
 * ```typescript
 * const j2000Date = new Date(2000, 0, 1, 12, 0, 0, 0);
 * dateToJulianDay(j2000Date); // Returns 2451545.0
 * ```
 */
export function dateToJulianDay(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  // Astronomical Julian Day calculation
  const jd =
    367 * year -
    Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4) +
    Math.floor((275 * month) / 9) +
    day +
    1721013.5 +
    hour / 24 +
    minute / 1440 +
    second / 86400;

  return jd;
}

/**
 * Converts Julian Day to years since J2000 epoch.
 *
 * @param julianDay - The Julian Day number
 * @returns Years since J2000 epoch
 *
 * @example
 * ```typescript
 * julianDayToYearsSinceJ2000(2451545.0); // Returns 0 (J2000 itself)
 * julianDayToYearsSinceJ2000(2460676.25); // Returns ~25 (J2025)
 * ```
 */
export function julianDayToYearsSinceJ2000(julianDay: number): number {
  return (julianDay - J2000_JULIAN_DAY) / 365.25;
}

/**
 * Converts years since J2000 to Julian Day.
 *
 * @param years - Years since J2000 epoch
 * @returns The Julian Day number
 *
 * @example
 * ```typescript
 * yearsSinceJ2000ToJulianDay(0); // Returns 2451545.0 (J2000)
 * yearsSinceJ2000ToJulianDay(25); // Returns ~2460676.25 (J2025)
 * ```
 */
export function yearsSinceJ2000ToJulianDay(years: number): number {
  return J2000_JULIAN_DAY + years * 365.25;
}

/**
 * Gets the current date as an epoch string (YYYY-MM-DD format).
 * This represents today's actual date for dynamic position calculations.
 *
 * @returns Current date in YYYY-MM-DD format
 *
 * @example
 * ```typescript
 * getCurrentEpoch(); // Returns "2026-01-23"
 * ```
 */
export function getCurrentEpoch(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets the current date and time as a precise epoch string (YYYY-MM-DDTHH:MM:SS format).
 * This provides more accurate positioning for objects that move quickly (like satellites).
 *
 * @returns Current date and time in YYYY-MM-DDTHH:MM:SS format
 *
 * @example
 * ```typescript
 * getCurrentPreciseEpoch(); // Returns "2026-01-23T08:33:45"
 * ```
 */
export function getCurrentPreciseEpoch(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * Gets the current Julian Day number with time precision.
 * This is the most accurate way to represent the current moment.
 *
 * @returns The current Julian Day number
 *
 * @example
 * ```typescript
 * getCurrentJulianDay(); // Returns current JD, e.g., 2460801.5
 * ```
 */
export function getCurrentJulianDay(): number {
  const now = new Date();
  return dateToJulianDay(now);
}

/**
 * Calculates the time difference between two epochs in years.
 *
 * @param fromEpoch - The starting epoch
 * @param toEpoch - The ending epoch
 * @returns Time difference in years
 *
 * @example
 * ```typescript
 * getEpochDifferenceYears("J2000", "J2025"); // Returns ~25
 * getEpochDifferenceYears("2020-01-01", "2025-01-01"); // Returns ~5
 * ```
 */
export function getEpochDifferenceYears(
  fromEpoch: string,
  toEpoch: string,
): number {
  const fromJD = getJulianDayForEpoch(fromEpoch);
  const toJD = getJulianDayForEpoch(toEpoch);
  return (toJD - fromJD) / 365.25;
}
