import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
  createOrbitalElements,
} from "@teskooano/core-physics";
import type {
  OrbitalParameters,
  PhysicsStateReal,
} from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";

/**
 * Calculates escape velocity at a given distance from a central mass
 * @param centralMass_kg Mass of the central body in kg
 * @param distance_m Distance from the central body in meters
 * @returns Escape velocity in m/s
 */
function calculateEscapeVelocity(
  centralMass_kg: number,
  distance_m: number,
): number {
  const G = 6.6743e-11; // Gravitational constant
  return Math.sqrt((2 * G * centralMass_kg) / distance_m);
}

/**
 * Validates that orbital velocity is reasonable compared to escape velocity
 * @param orbitalVelocity_mps Orbital velocity in m/s
 * @param escapeVelocity_mps Escape velocity in m/s
 * @param distanceAU Distance in AU for logging
 * @returns true if velocity is reasonable, false if too high
 */
function validateOrbitalVelocity(
  orbitalVelocity_mps: number,
  escapeVelocity_mps: number,
  distanceAU: number,
  planetId: string,
): boolean {
  const velocityRatio = orbitalVelocity_mps / escapeVelocity_mps;

  // Add a safety margin - orbital velocity should be less than 95% of escape velocity
  // This ensures stable orbits even with small perturbations
  if (velocityRatio >= 0.95) {
    console.warn(
      `[PlanetOrbit] ${planetId} at ${distanceAU.toFixed(2)} AU: ` +
        `Orbital velocity (${orbitalVelocity_mps.toFixed(1)} m/s) >= 95% of Escape velocity (${escapeVelocity_mps.toFixed(1)} m/s). ` +
        `Ratio: ${velocityRatio.toFixed(3)}`,
    );
    return false;
  }

  // Log extreme cases for debugging
  if (velocityRatio > 0.8) {
    console.warn(
      `[PlanetOrbit] ${planetId} at ${distanceAU.toFixed(2)} AU: ` +
        `High velocity ratio: ${velocityRatio.toFixed(3)} ` +
        `(Orbital: ${orbitalVelocity_mps.toFixed(1)} m/s, Escape: ${escapeVelocity_mps.toFixed(1)} m/s)`,
    );
  }

  return true;
}

/**
 * Calculates scientifically accurate orbital parameters and initial physics state for a planet
 * based on observed exoplanet statistics and orbital mechanics principles.
 *
 * This function generates realistic orbital elements based on:
 * - Rayleigh distribution for eccentricity (most planets have low eccentricity)
 * - Gaussian distribution for inclination around the invariable plane
 * - Proper Keplerian orbital mechanics
 *
 * @param random The seeded pseudo-random number generator function.
 * @param starMass_kg Mass of the parent star in kilograms.
 * @param planetMass_kg Mass of the planet in kilograms.
 * @param bodyDistanceAU The target semi-major axis for the orbit in AU.
 * @param planetId The unique ID of the planet.
 * @returns An object containing realistic OrbitalParameters.
 */
export function calculatePlanetOrbitAndInitialState(
  random: () => number,
  starMass_kg: number,
  planetMass_kg: number,
  bodyDistanceAU: number,
  planetId: string,
): {
  orbit: OrbitalParameters;
} {
  // Allow all distances - even those at the interstellar fringe!
  // These distant objects can be fascinating rogue planets, captured objects, or primordial bodies

  const orbitalPeriod_s = UTIL.calculateOrbitalPeriod_s(
    starMass_kg,
    bodyDistanceAU * CONST.AU_TO_METERS,
    planetMass_kg,
  );

  // Generate realistic orbital eccentricity using Rayleigh distribution
  // Most planets have low eccentricity (< 0.1), with mean around 0.05
  let eccentricity = generateRealisticEccentricity(random, bodyDistanceAU);

  // Ensure eccentricity is reasonable for orbital stability
  // For very close planets, keep eccentricity very low
  if (bodyDistanceAU < 0.1) {
    eccentricity = Math.min(eccentricity, 0.05); // Very low for stability
  }
  // For close planets (0.1 - 1 AU), be extremely conservative with eccentricity
  else if (bodyDistanceAU < 1.0) {
    eccentricity = Math.min(eccentricity, 0.02); // Nearly circular for stability
  }
  // For medium planets (1-10 AU), be conservative
  else if (bodyDistanceAU < 10) {
    eccentricity = Math.min(eccentricity, 0.1); // Low eccentricity
  }
  // For distant planets, cap eccentricity to prevent orbital instability
  else if (bodyDistanceAU > 10) {
    eccentricity = Math.min(eccentricity, 0.3); // More conservative than before
  }

  // Validate that the orbit stays within system boundary by checking aphelion
  // If not, reduce eccentricity until it fits
  while (!UTIL.isOrbitWithinSystemBoundary(bodyDistanceAU, eccentricity)) {
    eccentricity *= 0.9; // Reduce eccentricity by 10%
    if (eccentricity < 0.01) {
      // If we've reduced it too much, make it nearly circular
      eccentricity = 0.01;
      break;
    }
  }

  // Additional validation: ensure semi-latus rectum is positive for orbital stability
  const semiLatusRectum =
    bodyDistanceAU * CONST.AU_TO_METERS * (1 - eccentricity * eccentricity);
  if (semiLatusRectum <= 0) {
    console.warn(
      `[PlanetOrbit] Semi-latus rectum is non-positive (${semiLatusRectum.toFixed(2)} m) for ${planetId}. ` +
        `Reducing eccentricity from ${eccentricity.toFixed(3)} to ensure orbital stability.`,
    );
    // Reduce eccentricity to ensure positive semi-latus rectum
    eccentricity = Math.min(eccentricity, 0.99); // Cap at 0.99 to keep p > 0
  }

  // Generate realistic inclination - most planets are nearly coplanar
  // Use Gaussian distribution centered on 0° with standard deviation of ~2-3°
  const inclinationRad = generateRealisticInclination(random);
  const inclinationDeg = inclinationRad * (180 / Math.PI);

  // Other orbital angles are uniformly distributed
  const longitudeOfAscendingNodeDeg = random() * 360;
  const argumentOfPeriapsisDeg = random() * 360;
  const meanAnomalyDeg = random() * 360;

  // Calculate sidereal rotation period (tidally locked for close planets)
  let siderealRotationPeriod_s: number;
  if (bodyDistanceAU < 0.1) {
    // Very close planets are likely tidally locked
    siderealRotationPeriod_s = orbitalPeriod_s;
  } else {
    // Distant planets have independent rotation
    siderealRotationPeriod_s = 50000 + random() * 500000; // 14 hours to 6 days
  }

  // Generate axial tilt (most planets have moderate tilt)
  const axialTiltDeg = random() * 90; // 0-90 degrees

  const orbit = createOrbitalElements({
    semiMajorAxisAU: bodyDistanceAU,
    eccentricity: eccentricity,
    inclinationDeg: inclinationDeg,
    longitudeOfAscendingNodeDeg: longitudeOfAscendingNodeDeg,
    argumentOfPeriapsisDeg: argumentOfPeriapsisDeg,
    meanAnomalyDeg: meanAnomalyDeg,
    period_s: orbitalPeriod_s,
    siderealRotationPeriod_s: siderealRotationPeriod_s,
    axialTiltDeg: axialTiltDeg,
  });

  return { orbit };
}

/**
 * Generates realistic orbital eccentricity based on exoplanet observations
 * Uses a Rayleigh distribution with distance-dependent parameters
 */
function generateRealisticEccentricity(
  random: () => number,
  distanceAU: number,
): number {
  // Close-in planets (< 0.1 AU) tend to be circularized by tidal forces
  if (distanceAU < 0.1) {
    return random() * 0.02; // Very circular orbits
  }

  // Hot Jupiters and close planets (0.1 - 1 AU) have moderate eccentricity
  if (distanceAU < 1.0) {
    // Rayleigh distribution with σ = 0.01 (mean ~0.013) - extremely conservative
    const sigma = 0.01;
    const u1 = random();
    const u2 = random();
    const rayleigh =
      sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.min(0.03, Math.abs(rayleigh)); // Cap at 0.03 for close planets (extremely conservative)
  }

  // Outer planets can have higher eccentricity due to planet-planet interactions
  if (distanceAU < 5.0) {
    // Slightly higher eccentricity for outer planets
    const sigma = 0.05;
    const u1 = random();
    const u2 = random();
    const rayleigh =
      sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.min(0.4, Math.abs(rayleigh)); // Cap at 0.4 (more conservative)
  }

  // Very distant planets can have high eccentricity (like comets)
  const sigma = 0.1;
  const u1 = random();
  const u2 = random();
  const rayleigh =
    sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.min(0.5, Math.abs(rayleigh)); // Cap at 0.5 for orbital stability (more conservative)
}

/**
 * Generates realistic orbital inclination based on protoplanetary disk models
 * Most planets form in a thin disk and remain nearly coplanar
 */
function generateRealisticInclination(random: () => number): number {
  // Box-Muller transform for normal distribution
  const u1 = random();
  const u2 = random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // Standard deviation of ~2.5 degrees (0.044 radians) for planetary systems
  const stdDev = 0.044; // ~2.5 degrees in radians
  const inclination = Math.abs(z0 * stdDev);

  // Cap at 15 degrees (0.26 radians) - highly inclined planets are rare
  return Math.min(inclination, 0.26);
}
