import { OSVector3 } from "@teskooano/core-math";
import type { OrbitalParameters } from "@teskooano/data-types";
import { GRAVITATIONAL_CONSTANT, SOLAR_MASS } from "@teskooano/data-values";
import { getJulianDayForEpoch } from "./epoch-parsers";
import {
  getCurrentEpoch,
  getCurrentJulianDay,
  getEpochDifferenceYears,
} from "./epoch-conversions";
import { calculateKeplerianStateAtTime } from "./shared";

/**
 * Normalizes an epoch value, defaulting to today's date if undefined or empty.
 *
 * @param epoch - The epoch to normalize
 * @returns A valid epoch string (defaults to current date if undefined/empty)
 *
 * @example
 * ```typescript
 * normalizeEpoch(undefined); // Returns "2026-01-23"
 * normalizeEpoch("J2000"); // Returns "J2000"
 * ```
 */
export function normalizeEpoch(epoch: string | undefined): string {
  if (!epoch || epoch.trim() === "") {
    return getCurrentEpoch();
  }
  return epoch;
}

/**
 * Updates orbital elements to a new epoch using secular perturbations.
 * This is a simplified approach - for high precision, more complex
 * perturbation calculations would be needed.
 *
 * @param orbitalElements - The orbital elements to update
 * @param newEpoch - The target epoch
 * @returns Updated orbital elements at the new epoch
 *
 * @example
 * ```typescript
 * const updated = updateOrbitalElementsToEpoch(elements, "J2025");
 * ```
 */
export function updateOrbitalElementsToEpoch(
  orbitalElements: OrbitalParameters,
  newEpoch: string,
): OrbitalParameters {
  const currentEpoch = normalizeEpoch(orbitalElements.epoch);

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
 *
 * @example
 * ```typescript
 * const { position, velocity } = calculateCurrentPositionFromEpoch(elements, "2026-01-23");
 * ```
 */
export function calculateCurrentPositionFromEpoch(
  orbitalElements: OrbitalParameters,
  targetEpoch: string,
): {
  position: OSVector3;
  velocity: OSVector3;
  updatedOrbitalElements: OrbitalParameters;
} {
  const currentEpoch = normalizeEpoch(orbitalElements.epoch);

  // If epochs are the same, calculate position at epoch time
  if (currentEpoch === targetEpoch) {
    const { position, velocity } = calculateKeplerianStateAtTime(
      orbitalElements,
      0,
    );
    return {
      position,
      velocity,
      updatedOrbitalElements: { ...orbitalElements, epoch: currentEpoch },
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
    epoch: currentEpoch,
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
 *
 * @example
 * ```typescript
 * const { position, velocity } = calculateCurrentPositionPrecise(elements);
 * ```
 */
export function calculateCurrentPositionPrecise(
  orbitalElements: OrbitalParameters,
): {
  position: OSVector3;
  velocity: OSVector3;
  updatedOrbitalElements: OrbitalParameters;
} {
  const currentEpoch = normalizeEpoch(orbitalElements.epoch);
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
    epoch: currentEpoch,
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
 *
 * @param orbitalElements - The orbital elements to standardize
 * @returns Orbital elements at today's epoch
 *
 * @example
 * ```typescript
 * const current = standardizeToCurrentEpoch(historicalElements);
 * ```
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
 *
 * @param orbitalElements - The orbital elements to standardize
 * @param targetDate - The target date
 * @returns Orbital elements at the target date
 *
 * @example
 * ```typescript
 * const futureElements = standardizeToDate(elements, new Date("2030-01-01"));
 * ```
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
