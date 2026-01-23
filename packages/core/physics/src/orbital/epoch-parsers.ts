import { J2000_EPOCH, J2000_JULIAN_DAY } from "@teskooano/data-values";

/**
 * Regex patterns for epoch format validation
 */
const EPOCH_PATTERNS = {
  j2000: /^J2000$/,
  jEpoch: /^J\d{4}(\.\d+)?$/,
  julianDayWithPrefix: /^JD\s*(\d+\.?\d*)$/,
  julianDayRaw: /^\d+\.?\d*$/,
  dateString: /^\d{4}-\d{2}-\d{2}$/,
  preciseDateTimeString: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
} as const;

/**
 * Parses a J-prefixed epoch (like J2000, J2100.5) to Julian Day.
 * Uses the standard astronomical formula for J-epochs.
 *
 * @param jEpoch - The J-epoch string (e.g., "J2000", "J2025", "J2100.5")
 * @returns The Julian Day number corresponding to the J-epoch
 *
 * @example
 * ```typescript
 * parseJEpochToJulianDay("J2000"); // Returns 2451545.0
 * parseJEpochToJulianDay("J2025"); // Returns 2460676.25
 * parseJEpochToJulianDay("J2100.5"); // Returns 2488252.625
 * ```
 */
export function parseJEpochToJulianDay(jEpoch: string): number {
  const year = parseFloat(jEpoch.substring(1));

  // Standard astronomical formula for J-epochs
  // J2000 = 2451545.0, and each Julian year = 365.25 days
  const yearsSinceJ2000 = year - 2000;
  return J2000_JULIAN_DAY + yearsSinceJ2000 * 365.25;
}

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
function dateToJulianDay(date: Date): number {
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
 * Gets the Julian Day number for a given epoch string.
 * Supports multiple epoch formats:
 * - J2000 (standard astronomical epoch)
 * - J-prefixed epochs (J2025, J2100.5, etc.)
 * - Date strings (YYYY-MM-DD format)
 * - Precise date-time strings (YYYY-MM-DDTHH:MM:SS format)
 * - Julian Day numbers (JD 2458900.5, 2458900.5, etc.)
 *
 * @param epoch - The epoch string to parse
 * @returns The Julian Day number
 *
 * @example
 * ```typescript
 * getJulianDayForEpoch("J2000"); // Returns 2451545.0
 * getJulianDayForEpoch("2025-05-05"); // Returns ~2460801.0
 * getJulianDayForEpoch("JD 2458900.5"); // Returns 2458900.5
 * getJulianDayForEpoch("UNKNOWN"); // Returns 2451545.0 (J2000) with warning
 * ```
 */
export function getJulianDayForEpoch(epoch: string): number {
  // Handle J2000 as the standard reference
  if (EPOCH_PATTERNS.j2000.test(epoch)) {
    return J2000_JULIAN_DAY;
  }

  // Handle J-prefixed epochs (J2025, J2100.5, etc.)
  if (EPOCH_PATTERNS.jEpoch.test(epoch)) {
    return parseJEpochToJulianDay(epoch);
  }

  // Handle Julian Day numbers with "JD" prefix (JD 2458900.5)
  const jdPrefixMatch = epoch.match(EPOCH_PATTERNS.julianDayWithPrefix);
  if (jdPrefixMatch) {
    return parseFloat(jdPrefixMatch[1]);
  }

  // Handle Julian Day numbers without prefix (2458900.5)
  if (EPOCH_PATTERNS.julianDayRaw.test(epoch)) {
    const jdValue = parseFloat(epoch);
    // Validate that it's a reasonable Julian Day number (between 0 and 3000000)
    if (jdValue > 0 && jdValue < 3000000) {
      return jdValue;
    }
  }

  // Handle date strings (YYYY-MM-DD format)
  if (EPOCH_PATTERNS.dateString.test(epoch)) {
    const [year, month, day] = epoch.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0); // Noon UTC
    return dateToJulianDay(date);
  }

  // Handle precise date-time strings (YYYY-MM-DDTHH:MM:SS format)
  if (EPOCH_PATTERNS.preciseDateTimeString.test(epoch)) {
    const date = new Date(epoch);
    return dateToJulianDay(date);
  }

  // Default to J2000 if unknown format
  console.warn(`Unknown epoch format: ${epoch}, defaulting to J2000`);
  return J2000_JULIAN_DAY;
}

/**
 * Validates that an epoch string is in a recognized format.
 *
 * @param epoch - The epoch string to validate
 * @returns True if the epoch is valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidEpoch("J2000"); // Returns true
 * isValidEpoch("2025-05-05"); // Returns true
 * isValidEpoch("invalid"); // Returns false
 * ```
 */
export function isValidEpoch(epoch: string): boolean {
  // Check if it's J2000
  if (EPOCH_PATTERNS.j2000.test(epoch)) {
    return true;
  }

  // Check if it's a Julian Day number with "JD" prefix
  if (EPOCH_PATTERNS.julianDayWithPrefix.test(epoch)) {
    const jdMatch = epoch.match(EPOCH_PATTERNS.julianDayWithPrefix);
    if (jdMatch) {
      const jdValue = parseFloat(jdMatch[1]);
      return jdValue > 0 && jdValue < 3000000;
    }
  }

  // Check if it's a Julian Day number without prefix
  if (EPOCH_PATTERNS.julianDayRaw.test(epoch)) {
    const jdValue = parseFloat(epoch);
    return jdValue > 0 && jdValue < 3000000;
  }

  // Check if it's a valid date string (YYYY-MM-DD)
  if (EPOCH_PATTERNS.dateString.test(epoch)) {
    const [year, month, day] = epoch.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  // Check if it's a valid precise date-time string (YYYY-MM-DDTHH:MM:SS)
  if (EPOCH_PATTERNS.preciseDateTimeString.test(epoch)) {
    const date = new Date(epoch);
    return !isNaN(date.getTime());
  }

  // Check if it's a J-prefixed epoch (J2000, J2100, etc.)
  if (EPOCH_PATTERNS.jEpoch.test(epoch)) {
    return true;
  }

  return false;
}

/**
 * Gets a human-readable description of an epoch.
 *
 * @param epoch - The epoch string to describe
 * @returns A human-readable description
 *
 * @example
 * ```typescript
 * getEpochDescription("J2000"); // Returns "J2000 epoch (January 1, 2000 12:00:00 UTC)"
 * getEpochDescription("2025-05-05"); // Returns "Date epoch (2025-05-05)"
 * ```
 */
export function getEpochDescription(epoch: string): string {
  if (epoch === J2000_EPOCH) {
    return "J2000 epoch (January 1, 2000 12:00:00 UTC)";
  }

  if (EPOCH_PATTERNS.jEpoch.test(epoch)) {
    return `${epoch} epoch`;
  }

  const jdPrefixMatch = epoch.match(EPOCH_PATTERNS.julianDayWithPrefix);
  if (jdPrefixMatch) {
    const jdValue = jdPrefixMatch[1];
    return `Julian Day epoch (JD ${jdValue})`;
  }

  if (EPOCH_PATTERNS.julianDayRaw.test(epoch)) {
    const jdValue = parseFloat(epoch);
    if (jdValue > 0 && jdValue < 3000000) {
      return `Julian Day epoch (${epoch})`;
    }
  }

  if (EPOCH_PATTERNS.dateString.test(epoch)) {
    return `Date epoch (${epoch})`;
  }

  if (EPOCH_PATTERNS.preciseDateTimeString.test(epoch)) {
    return `Precise date-time epoch (${epoch})`;
  }

  return `Unknown epoch (${epoch})`;
}
