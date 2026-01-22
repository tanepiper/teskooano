import { OSVector3 } from "@teskooano/core-math";
import type { OrbitalParameters } from "@teskooano/data-types";
import { GRAVITATIONAL_CONSTANT, SOLAR_MASS } from "@teskooano/data-values";
import { calculateKeplerianStateAtTime } from "./shared";

/**
 * J2000 epoch as the standard astronomical reference.
 * This is the only hard-coded epoch we keep as it's the international standard.
 */
export const J2000_EPOCH = "J2000";

/**
 * Julian Day number for J2000 epoch.
 * Julian Day is a continuous count of days since January 1, 4713 BC.
 */
export const J2000_JULIAN_DAY = 2451545.0; // January 1, 2000 12:00:00 UTC

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
 * Gets the current date and time as a precise epoch string (YYYY-MM-DDTHH:MM:SS format).
 * This provides more accurate positioning for objects that move quickly (like satellites).
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
 */
export function getCurrentJulianDay(): number {
  const now = new Date();
  return dateToJulianDay(now);
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
  return (julianDay - J2000_JULIAN_DAY) / 365.25;
}

/**
 * Converts years since J2000 to Julian Day.
 */
export function yearsSinceJ2000ToJulianDay(years: number): number {
  return J2000_JULIAN_DAY + years * 365.25;
}

/**
 * Converts a date to Julian Day number.
 * Uses the standard astronomical formula for Julian Day calculation.
 */
export function dateToJulianDay(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  // Astronomical Julian Day calculation
  let jd =
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
 * Parses a J-prefixed epoch (like J2000, J2100.5) to Julian Day.
 * Uses the standard astronomical formula for J-epochs.
 */
export function parseJEpochToJulianDay(jEpoch: string): number {
  const year = parseFloat(jEpoch.substring(1));

  // Standard astronomical formula for J-epochs
  // J2000 = 2451545.0, and each Julian year = 365.25 days
  const yearsSinceJ2000 = year - 2000;
  return J2000_JULIAN_DAY + yearsSinceJ2000 * 365.25;
}

/**
 * Gets the Julian Day number for a given epoch string.
 * Supports multiple epoch formats:
 * - J2000 (standard astronomical epoch)
 * - J-prefixed epochs (J2025, J2100.5, etc.)
 * - Date strings (YYYY-MM-DD format)
 * - Julian Day numbers (JD 2458900.5, 2458900.5, etc.)
 */
export function getJulianDayForEpoch(epoch: string): number {
  // Handle J2000 as the standard reference
  if (epoch === J2000_EPOCH) {
    return J2000_JULIAN_DAY;
  }

  // Handle J-prefixed epochs (J2025, J2100.5, etc.)
  if (epoch.match(/^J\d{4}(\.\d+)?$/)) {
    return parseJEpochToJulianDay(epoch);
  }

  // Handle Julian Day numbers with "JD" prefix (JD 2458900.5)
  if (epoch.match(/^JD\s*(\d+\.?\d*)$/)) {
    const jdMatch = epoch.match(/^JD\s*(\d+\.?\d*)$/);
    if (jdMatch) {
      return parseFloat(jdMatch[1]);
    }
  }

  // Handle Julian Day numbers without prefix (2458900.5)
  if (epoch.match(/^\d+\.?\d*$/)) {
    const jdValue = parseFloat(epoch);
    // Validate that it's a reasonable Julian Day number (between 0 and 3000000)
    if (jdValue > 0 && jdValue < 3000000) {
      return jdValue;
    }
  }

  // Handle date strings (YYYY-MM-DD format)
  if (epoch.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = epoch.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0); // Noon UTC
    return dateToJulianDay(date);
  }

  // Handle precise date-time strings (YYYY-MM-DDTHH:MM:SS format)
  if (epoch.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
    const date = new Date(epoch);
    return dateToJulianDay(date);
  }

  // Default to J2000 if unknown format
  console.warn(`Unknown epoch format: ${epoch}, defaulting to J2000`);
  return J2000_JULIAN_DAY;
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
 * Calculates the current position and velocity of an object using precise current time.
 * This is more accurate for objects that move quickly (like satellites).
 *
 * @param orbitalElements - The orbital elements at their original epoch
 * @returns The current position and velocity vectors, plus updated orbital elements
 */
export function calculateCurrentPositionPrecise(
  orbitalElements: OrbitalParameters,
): {
  position: OSVector3;
  velocity: OSVector3;
  updatedOrbitalElements: OrbitalParameters;
} {
  const currentEpoch = orbitalElements.epoch;
  const currentJulianDay = getCurrentJulianDay();
  const epochJulianDay = getJulianDayForEpoch(currentEpoch);

  // Calculate time difference in seconds
  const daysDifference = currentJulianDay - epochJulianDay;
  const secondsDifference = daysDifference * 24 * 3600;

  // Calculate the position at the current precise time using the Keplerian solver
  const { position, velocity } = calculateKeplerianStateAtTime(
    orbitalElements,
    secondsDifference,
  );

  // Update the mean anomaly to reflect the current position
  let updatedMeanAnomaly: number;

  if (orbitalElements.eccentricity > 1) {
    // Hyperbolic orbit - use hyperbolic mean motion
    // The mean motion for hyperbolic orbits is: n = sqrt(μ / |a|³)
    // We need to calculate μ from the Sun's mass
    const mu = GRAVITATIONAL_CONSTANT * SOLAR_MASS;
    const absSemiMajorAxis = Math.abs(orbitalElements.realSemiMajorAxis_m);
    const meanMotionHyperbolic = Math.sqrt(mu / Math.pow(absSemiMajorAxis, 3));
    updatedMeanAnomaly =
      orbitalElements.meanAnomaly + meanMotionHyperbolic * secondsDifference;
  } else {
    // Elliptical/parabolic orbit
    const meanMotion = (2 * Math.PI) / orbitalElements.period_s; // radians per second
    updatedMeanAnomaly =
      orbitalElements.meanAnomaly + meanMotion * secondsDifference;
  }

  const updatedOrbitalElements: OrbitalParameters = {
    ...orbitalElements,
    meanAnomaly:
      orbitalElements.eccentricity > 1
        ? updatedMeanAnomaly // Don't normalize hyperbolic mean anomaly
        : updatedMeanAnomaly % (2 * Math.PI), // Keep elliptical orbits in [0, 2π]
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
  // Check if it's J2000
  if (epoch === J2000_EPOCH) {
    return true;
  }

  // Check if it's a Julian Day number with "JD" prefix
  if (epoch.match(/^JD\s*(\d+\.?\d*)$/)) {
    const jdValue = parseFloat(epoch.replace(/^JD\s*/, ""));
    return jdValue > 0 && jdValue < 3000000;
  }

  // Check if it's a Julian Day number without prefix
  if (epoch.match(/^\d+\.?\d*$/)) {
    const jdValue = parseFloat(epoch);
    return jdValue > 0 && jdValue < 3000000;
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

  // Check if it's a valid precise date-time string (YYYY-MM-DDTHH:MM:SS)
  if (epoch.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
    const date = new Date(epoch);
    return !isNaN(date.getTime());
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
  if (epoch === J2000_EPOCH) {
    return "J2000 epoch (January 1, 2000 12:00:00 UTC)";
  }

  if (epoch.match(/^J\d{4}(\.\d+)?$/)) {
    return `${epoch} epoch`;
  }

  if (epoch.match(/^JD\s*(\d+\.?\d*)$/)) {
    const jdValue = epoch.replace(/^JD\s*/, "");
    return `Julian Day epoch (JD ${jdValue})`;
  }

  if (epoch.match(/^\d+\.?\d*$/)) {
    const jdValue = parseFloat(epoch);
    if (jdValue > 0 && jdValue < 3000000) {
      return `Julian Day epoch (${epoch})`;
    }
  }

  if (epoch.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return `Date epoch (${epoch})`;
  }

  if (epoch.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
    return `Precise date-time epoch (${epoch})`;
  }

  return `Unknown epoch (${epoch})`;
}
