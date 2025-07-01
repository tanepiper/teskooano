import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import type {
  OrbitalParameters,
  PhysicsStateReal,
} from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";

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
 * @param parentStarState The physics state of the parent star.
 * @param planetId The unique ID of the planet.
 * @returns An object containing realistic OrbitalParameters and initial PhysicsStateReal.
 */
export function calculatePlanetOrbitAndInitialState(
  random: () => number,
  starMass_kg: number,
  planetMass_kg: number,
  bodyDistanceAU: number,
  parentStarState: PhysicsStateReal,
  planetId: string,
): {
  orbit: OrbitalParameters;
  initialPhysicsState: PhysicsStateReal | null;
} {
  const semiMajorAxis_m = bodyDistanceAU * CONST.AU_TO_METERS;
  const orbitalPeriod_s = UTIL.calculateOrbitalPeriod_s(
    starMass_kg,
    semiMajorAxis_m,
    planetMass_kg,
  );

  // Generate realistic orbital eccentricity using Rayleigh distribution
  // Most planets have low eccentricity (< 0.1), with mean around 0.05
  const eccentricity = generateRealisticEccentricity(random, bodyDistanceAU);

  // Generate realistic inclination - most planets are nearly coplanar
  // Use Gaussian distribution centered on 0° with standard deviation of ~2-3°
  const inclination = generateRealisticInclination(random);

  // Other orbital angles are uniformly distributed
  const longitudeOfAscendingNode = random() * 2 * Math.PI;
  const argumentOfPeriapsis = random() * 2 * Math.PI;
  const meanAnomaly = random() * 2 * Math.PI;

  const orbit: OrbitalParameters = {
    realSemiMajorAxis_m: semiMajorAxis_m,
    eccentricity: eccentricity,
    inclination: inclination,
    longitudeOfAscendingNode: longitudeOfAscendingNode,
    argumentOfPeriapsis: argumentOfPeriapsis,
    meanAnomaly: meanAnomaly,
    period_s: orbitalPeriod_s,
  };

  let initialPhysicsState: PhysicsStateReal | null = null;
  try {
    const initialRelativePos_m = calculateOrbitalPosition(
      parentStarState,
      orbit,
      0,
    );
    const initialRelativeVel_mps = calculateOrbitalVelocity(
      parentStarState,
      orbit,
      0,
    );

    const initialWorldPos_m = initialRelativePos_m
      .clone()
      .add(parentStarState.position_m);
    const initialWorldVel_mps = initialRelativeVel_mps
      .clone()
      .add(parentStarState.velocity_mps);

    if (
      !initialWorldPos_m ||
      !initialWorldVel_mps ||
      !Number.isFinite(initialWorldPos_m.x) ||
      !Number.isFinite(initialWorldPos_m.y) ||
      !Number.isFinite(initialWorldPos_m.z) ||
      !Number.isFinite(initialWorldVel_mps.x) ||
      !Number.isFinite(initialWorldVel_mps.y) ||
      !Number.isFinite(initialWorldVel_mps.z)
    ) {
      throw new Error(
        "Calculated initial planet state contains non-finite values.",
      );
    }

    initialPhysicsState = {
      id: planetId,
      mass_kg: planetMass_kg,
      position_m: initialWorldPos_m,
      velocity_mps: initialWorldVel_mps,
    };
  } catch (error) {
    console.error(
      `[PlanetOrbit] Error calculating initial physics state for ${planetId}:`,
      error,
    );
    console.error("Inputs:", {
      parentState: parentStarState,
      orbitParams: orbit,
      planetMass_kg: planetMass_kg,
    });
  }

  return { orbit, initialPhysicsState };
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
    // Rayleigh distribution with σ = 0.05 (mean ~0.063)
    const sigma = 0.05;
    const u1 = random();
    const u2 = random();
    const rayleigh =
      sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.min(0.3, Math.abs(rayleigh)); // Cap at 0.3 for close planets
  }

  // Outer planets can have higher eccentricity due to planet-planet interactions
  if (distanceAU < 5.0) {
    // Slightly higher eccentricity for outer planets
    const sigma = 0.08;
    const u1 = random();
    const u2 = random();
    const rayleigh =
      sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.min(0.6, Math.abs(rayleigh)); // Cap at 0.6
  }

  // Very distant planets can have high eccentricity (like comets)
  const sigma = 0.15;
  const u1 = random();
  const u2 = random();
  const rayleigh =
    sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.min(0.9, Math.abs(rayleigh)); // Cap at 0.9 for stability
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
