import { createOrbitalElements } from "@teskooano/core-physics";
import { type OrbitalParameters } from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-values";
import * as UTIL from "../../utils-functions";

/**
 * Moon orbital mechanics and parameter generation
 *
 * This module handles the calculation of realistic moon orbital
 * parameters including distance, period, and orbital elements
 * based on formation mechanisms and stability constraints.
 */

/**
 * Calculate next moon orbital distance using realistic spacing
 */
export function calculateNextMoonDistance(
  random: () => number,
  lastDistance: number,
  formation: string,
  planetRadius: number,
  planetMass: number,
): number {
  // Minimum distance: 5 planetary radii (much more conservative)
  const minDistance = Math.max(5, lastDistance);

  let spacingFactor: number;

  switch (formation) {
    case "co-accretion":
      // Regular spacing like Galilean moons (factor of ~1.8-2.2)
      spacingFactor = 1.8 + random() * 0.4;
      break;

    case "impact":
      // Impact moons often single, large spacing
      spacingFactor = 2.5 + random() * 2.0;
      break;

    case "capture":
      // Irregular spacing for captured objects
      spacingFactor = 2.0 + random() * 3.0;
      break;

    default:
      spacingFactor = 2.0 + random() * 2.0;
  }

  return minDistance * spacingFactor;
}

/**
 * Calculate moon orbital period
 */
export function calculateMoonOrbitalPeriod(
  parentPlanetMass: number,
  moonSemiMajorAxis_m: number,
  moonMass: number,
): number {
  return UTIL.calculateOrbitalPeriod_s(
    parentPlanetMass,
    moonSemiMajorAxis_m,
    moonMass,
  );
}

/**
 * Generate moon orbital parameters based on formation mechanism.
 *
 * This function creates realistic moon orbits by:
 * 1. Inheriting the parent planet's orbital plane (inclination and longitude of ascending node)
 * 2. Adding small relative inclinations based on formation mechanism
 * 3. Randomizing the starting position in orbit (meanAnomaly) - this is correct physics
 *
 * Note: The randomized meanAnomaly means moons start at different points in their orbits,
 * which may appear as "random directions" but is actually proper orbital mechanics.
 * All moons still orbit in roughly the same plane as their parent planet.
 */
export function generateMoonOrbit(
  random: () => number,
  semiMajorAxis: number,
  period: number,
  formation: string,
  parentOrbit?: OrbitalParameters,
): OrbitalParameters {
  let eccentricity: number;
  let relativeInclination: number;

  switch (formation) {
    case "co-accretion":
      // Regular, circular orbits (like Galilean moons)
      eccentricity = random() * 0.01; // Very circular
      relativeInclination = (random() - 0.5) * 0.05; // Nearly coplanar (+/- 1.4 degrees)
      break;

    case "impact":
      // Moderate eccentricity, coplanar
      eccentricity = random() * 0.1;
      relativeInclination = (random() - 0.5) * 0.1; // +/- 2.8 degrees
      break;

    case "capture":
      // Highly eccentric, inclined orbits
      eccentricity = 0.1 + random() * 0.4; // Higher eccentricity
      relativeInclination = (random() - 0.5) * 0.5; // Can be highly inclined (+/- 14 degrees)
      break;

    default:
      eccentricity = random() * 0.05;
      relativeInclination = (random() - 0.5) * 0.1;
  }

  // Combine parent's inclination with a small relative inclination.
  // This keeps the moon orbiting roughly in the same plane as the planet.
  const finalInclinationRad =
    (parentOrbit?.inclination ?? 0) + relativeInclination;
  const finalInclinationDeg = finalInclinationRad * (180 / Math.PI);

  // Align the direction of the tilt with the parent's orbit.
  const longitudeOfAscendingNodeRad = parentOrbit
    ? parentOrbit.longitudeOfAscendingNode
    : random() * 2 * Math.PI;
  const longitudeOfAscendingNodeDeg =
    longitudeOfAscendingNodeRad * (180 / Math.PI);

  // Convert semi-major axis from meters to AU for createOrbitalElements
  const semiMajorAxisAU = semiMajorAxis / AU_METERS; // Convert m to AU

  // Generate axial tilt (moons often have low tilt due to tidal forces)
  const axialTiltDeg = random() * 30; // 0-30 degrees for most moons

  return createOrbitalElements({
    semiMajorAxisAU: semiMajorAxisAU,
    eccentricity: eccentricity,
    inclinationDeg: finalInclinationDeg,
    longitudeOfAscendingNodeDeg: longitudeOfAscendingNodeDeg,
    argumentOfPeriapsisDeg: random() * 360,
    meanAnomalyDeg: random() * 360,
    period_s: period,
    siderealRotationPeriod_s: period, // Most moons are tidally locked
    axialTiltDeg: axialTiltDeg,
  });
}
