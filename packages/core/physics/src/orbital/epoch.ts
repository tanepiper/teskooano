import { OSVector3 } from "@teskooano/core-math";
import type { OrbitalParameters } from "@teskooano/data-types";
import { calculateKeplerianStateAtTime } from "./ideal";

/**
 * Common astronomical epochs as Julian Day numbers.
 * These represent specific reference dates for orbital elements.
 */
export const ASTRONOMICAL_EPOCHS = {
  J2000: "J2000", // January 1, 2000 12:00:00 UTC
  J2025: "J2025", // January 1, 2025 12:00:00 UTC
  CURRENT_2025: "2025-05-05", // May 5, 2025 (example current date)
  EPOCH_2023: "2023-02-25", // February 25, 2023
} as const;

export type AstronomicalEpoch =
  (typeof ASTRONOMICAL_EPOCHS)[keyof typeof ASTRONOMICAL_EPOCHS];

/**
 * Julian Day numbers for common epochs.
 * Julian Day is a continuous count of days since January 1, 4713 BC.
 */
export const JULIAN_DAYS = {
  J2000: 2451545.0, // January 1, 2000 12:00:00 UTC
  J2025: 2460673.5, // January 1, 2025 12:00:00 UTC
  CURRENT_2025: 2460673.5, // May 5, 2025
  EPOCH_2023: 2460000.5, // February 25, 2023
} as const;

/**
 * Gets the current date as an epoch string (YYYY-MM-DD format).
 * This represents today's actual date for dynamic position calculations.
 */
export function getCurrentEpoch(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Recommended current epoch for new orbital data.
 * This dynamically uses today's date for maximum accuracy.
 */
export const CURRENT_EPOCH = getCurrentEpoch();

/**
 * Converts Julian Day to years since J2000 epoch.
 */
export function julianDayToYearsSinceJ2000(julianDay: number): number {
  return (julianDay - JULIAN_DAYS.J2000) / 365.25;
}

/**
 * Converts years since J2000 to Julian Day.
 */
export function yearsSinceJ2000ToJulianDay(years: number): number {
  return JULIAN_DAYS.J2000 + years * 365.25;
}

/**
 * Gets the Julian Day number for a given epoch string.
 * Supports both date strings (YYYY-MM-DD) and epoch constants (J2000, etc.).
 */
export function getJulianDayForEpoch(epoch: string): number {
  // Handle known epoch constants
  if (epoch === ASTRONOMICAL_EPOCHS.J2000) return JULIAN_DAYS.J2000;
  if (epoch === ASTRONOMICAL_EPOCHS.J2025) return JULIAN_DAYS.J2025;
  if (epoch === ASTRONOMICAL_EPOCHS.EPOCH_2023) return JULIAN_DAYS.EPOCH_2023;

  // Handle date strings (YYYY-MM-DD format)
  if (epoch.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = epoch.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0); // Noon UTC
    const timeInMs = date.getTime();
    const julianDay = timeInMs / 86400000 + 2440587.5;
    return julianDay;
  }

  // Handle J-prefixed epochs like J2100
  if (epoch.match(/^J\d{4}(\.\d+)?$/)) {
    const year = parseFloat(epoch.substring(1));
    // Calculate Julian Day for J-prefixed epochs
    const t = (year - 2000) / 100;
    return 2451545.0 + 36525 * t + 0.0009 * t * t;
  }

  // Default to J2000 if unknown
  console.warn(`Unknown epoch format: ${epoch}, defaulting to J2000`);
  return JULIAN_DAYS.J2000;
}

/**
 * Calculates the time difference between two epochs in years
 */
export function getEpochDifferenceYears(
  fromEpoch: string,
  toEpoch: string,
): number {
  const fromJD = getJulianDayForEpoch(fromEpoch);
  const toJD = getJulianDayForEpoch(toEpoch);
  return (toJD - fromJD) / 365.25;
}

/**
 * Updates orbital elements to a new epoch using secular perturbations.
 * This is a simplified approach - for high precision, more complex
 * perturbation calculations would be needed.
 *
 * @param orbitalElements - The orbital elements to update
 * @param newEpoch - The target epoch
 * @returns Updated orbital elements at the new epoch
 */
export function updateOrbitalElementsToEpoch(
  orbitalElements: OrbitalParameters,
  newEpoch: string,
): OrbitalParameters {
  const currentEpoch = orbitalElements.epoch;

  // If epochs are the same, return unchanged
  if (currentEpoch === newEpoch) {
    return orbitalElements;
  }

  const yearsDifference = getEpochDifferenceYears(currentEpoch, newEpoch);

  // For small time differences, we can use linear approximation
  // For larger differences, more complex perturbation theory would be needed
  if (Math.abs(yearsDifference) < 25) {
    // Simple linear secular motion approximation
    const meanMotion = (2 * Math.PI) / orbitalElements.period_s; // rad/s
    const yearsToSeconds = yearsDifference * 365.25 * 24 * 3600;
    const newMeanAnomaly =
      orbitalElements.meanAnomaly + meanMotion * yearsToSeconds;

    return {
      ...orbitalElements,
      meanAnomaly: newMeanAnomaly % (2 * Math.PI), // Keep in [0, 2π]
      epoch: newEpoch,
    };
  } else {
    // For larger time differences, warn and return unchanged
    // In a real implementation, this would use more sophisticated perturbation theory
    console.warn(
      `Large epoch difference (${yearsDifference.toFixed(1)} years) detected. ` +
        `Consider using more precise perturbation calculations for epoch ${newEpoch}.`,
    );
    return {
      ...orbitalElements,
      epoch: newEpoch,
    };
  }
}

/**
 * Calculates the current position and velocity of an object based on its orbital elements.
 * This function properly converts orbital elements to actual 3D positions at the current epoch.
 *
 * @param orbitalElements - The orbital elements at their original epoch
 * @param targetEpoch - The target epoch to calculate positions for
 * @returns The current position and velocity vectors, plus updated orbital elements
 */
export function calculateCurrentPositionFromEpoch(
  orbitalElements: OrbitalParameters,
  targetEpoch: string,
): {
  position: OSVector3;
  velocity: OSVector3;
  updatedOrbitalElements: OrbitalParameters;
} {
  const currentEpoch = orbitalElements.epoch;

  // If epochs are the same, calculate position at epoch time
  if (currentEpoch === targetEpoch) {
    const { position, velocity } = calculateKeplerianStateAtTime(
      orbitalElements,
      0,
    );
    return {
      position,
      velocity,
      updatedOrbitalElements: orbitalElements,
    };
  }

  const yearsDifference = getEpochDifferenceYears(currentEpoch, targetEpoch);
  const yearsToSeconds = yearsDifference * 365.25 * 24 * 3600;

  // Calculate the position at the target epoch using the existing Keplerian solver
  const { position, velocity } = calculateKeplerianStateAtTime(
    orbitalElements,
    yearsToSeconds,
  );

  // Update only the mean anomaly to reflect the current position, but preserve the original epoch
  // This maintains the reference data while calculating the current ephemeris
  const meanMotion = (2 * Math.PI) / orbitalElements.period_s; // radians per second
  const meanMotionPerYear = meanMotion * 365.25 * 24 * 3600; // radians per year
  const updatedMeanAnomaly =
    orbitalElements.meanAnomaly + meanMotionPerYear * yearsDifference;

  const updatedOrbitalElements: OrbitalParameters = {
    ...orbitalElements,
    meanAnomaly: updatedMeanAnomaly % (2 * Math.PI), // Keep in [0, 2π]
    // Preserve the original epoch - this is the reference data
    epoch: orbitalElements.epoch,
  };

  return {
    position,
    velocity,
    updatedOrbitalElements,
  };
}

/**
 * Standardizes orbital elements to today's date.
 * This ensures all orbital data reflects current positions.
 */
export function standardizeToCurrentEpoch(
  orbitalElements: OrbitalParameters,
): OrbitalParameters {
  const todayEpoch = getCurrentEpoch();
  return updateOrbitalElementsToEpoch(orbitalElements, todayEpoch);
}

/**
 * Standardizes orbital elements to a specific date.
 * Useful for historical or future position calculations.
 */
export function standardizeToDate(
  orbitalElements: OrbitalParameters,
  targetDate: Date,
): OrbitalParameters {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");
  const targetEpoch = `${year}-${month}-${day}`;
  return updateOrbitalElementsToEpoch(orbitalElements, targetEpoch);
}

/**
 * Validates that an epoch string is in a recognized format
 */
export function isValidEpoch(epoch: string): boolean {
  // Check if it's a known epoch constant
  if (Object.values(ASTRONOMICAL_EPOCHS).includes(epoch as AstronomicalEpoch)) {
    return true;
  }

  // Check if it's a valid date string (YYYY-MM-DD)
  if (epoch.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = epoch.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  // Check if it's a J-prefixed epoch (J2000, J2100, etc.)
  if (epoch.match(/^J\d{4}(\.\d+)?$/)) {
    return true;
  }

  return false;
}

/**
 * Gets a human-readable description of an epoch
 */
export function getEpochDescription(epoch: string): string {
  switch (epoch) {
    case ASTRONOMICAL_EPOCHS.J2000:
      return "J2000 epoch (January 1, 2000 12:00:00 UTC)";
    case ASTRONOMICAL_EPOCHS.J2025:
      return "J2025 epoch (January 1, 2025 12:00:00 UTC)";
    case ASTRONOMICAL_EPOCHS.EPOCH_2023:
      return "February 25, 2023 epoch";
    default:
      if (epoch.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return `Date epoch (${epoch})`;
      }
      if (epoch.match(/^J\d{4}(\.\d+)?$/)) {
        return `${epoch} epoch`;
      }
      return `Unknown epoch (${epoch})`;
  }
}
