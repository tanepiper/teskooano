import { OSVector3 } from "@teskooano/core-math";
import type {
  AsteroidFieldProperties,
  CelestialObject,
  OrbitalParameters,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  RockyType,
} from "@teskooano/data-types";
import * as CONST from "../constants";
import * as UTIL from "../utils";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
  type PhysicsStateReal,
} from "@teskooano/core-physics";

/**
 * Generates data for an asteroid belt at a given distance.
 * @param random The seeded random function.
 * @param starId The ID of the parent star.
 * @param starMass_kg The mass of the parent star (kg).
 * @param index The index in the generation loop (for naming).
 * @param bodyDistanceAU The distance of the belt center from the star (AU).
 * @returns The generated asteroid belt's data.
 */
export function generateAsteroidBelt(
  random: () => number,
  starId: string,
  starMass_kg: number,
  index: number,
  bodyDistanceAU: number,
): CelestialObject | null {
  const beltName = `Belt ${String.fromCharCode(65 + index)}`;
  const beltId = `asteroidbelt-${starId}-${beltName
    .toLowerCase()
    .replace(" ", "-")}`;
  const beltType = UTIL.getRandomItem(
    [
      RockyType.LIGHT_ROCK,
      RockyType.DARK_ROCK,
      RockyType.ICE,
      RockyType.METALLIC,
    ],
    random,
  );

  const beltProperties: AsteroidFieldProperties = {
    type: CelestialType.ASTEROID_FIELD,
    innerRadiusAU: bodyDistanceAU - (0.2 + random() * 0.8),
    outerRadiusAU: bodyDistanceAU + (0.2 + random() * 0.8),
    heightAU: 0.1 + random() * 0.4,
    count: 1000 + random() * 4000,
    color: UTIL.getRandomItem(CONST.RING_COLORS[beltType], random).replace(
      "c0",
      "ff",
    ),
    composition: CONST.RING_COMPOSITION[beltType],
  };

  const beltOrbit: OrbitalParameters = {
    realSemiMajorAxis_m: bodyDistanceAU * CONST.AU_TO_METERS,
    eccentricity: random() * 0.05,
    inclination: (random() - 0.5) * 0.02,
    longitudeOfAscendingNode: random() * 2 * Math.PI,
    argumentOfPeriapsis: random() * 2 * Math.PI,
    meanAnomaly: random() * 2 * Math.PI,
    period_s: 0,
  };

  // Calculate orbital period (assuming negligible belt mass)
  beltOrbit.period_s = UTIL.calculateOrbitalPeriod_s(
    starMass_kg,
    beltOrbit.realSemiMajorAxis_m,
    0,
  );

  // --- Validate Belt Orbit ---
  if (starMass_kg <= 0 || !Number.isFinite(starMass_kg)) {
    console.warn(
      `[generateAsteroidBelt] Invalid parent star mass (${starMass_kg}) for period calculation of ${beltId}. Skipping belt.`,
    );
    return null;
  }
  if (
    beltOrbit.realSemiMajorAxis_m <= 0 ||
    !Number.isFinite(beltOrbit.realSemiMajorAxis_m)
  ) {
    console.warn(
      `[generateAsteroidBelt] Invalid semi-major axis (${beltOrbit.realSemiMajorAxis_m}) for ${beltId}. Skipping belt.`,
    );
    return null;
  }
  if (
    beltOrbit.eccentricity < 0 ||
    beltOrbit.eccentricity >= 1 ||
    !Number.isFinite(beltOrbit.eccentricity)
  ) {
    console.warn(
      `[generateAsteroidBelt] Invalid eccentricity (${beltOrbit.eccentricity}) for ${beltId}. Skipping belt.`,
    );
    return null;
  }
  // --- End Validation ---

  // --- Calculate initial position and velocity from orbital parameters ---
  // We'll assume the star is at (0,0,0) with zero velocity for initial placement
  const starPhysicsState: PhysicsStateReal = {
    id: starId,
    mass_kg: starMass_kg,
    position_m: new OSVector3(0, 0, 0),
    velocity_mps: new OSVector3(0, 0, 0),
  };

  // Calculate initial position and velocity
  let initialPosition: OSVector3;
  let initialVelocity: OSVector3;

  try {
    // Use the imported calculation functions
    initialPosition = calculateOrbitalPosition(starPhysicsState, beltOrbit, 0);
    initialVelocity = calculateOrbitalVelocity(starPhysicsState, beltOrbit, 0);
  } catch (error) {
    console.warn(
      `[generateAsteroidBelt] Error calculating initial state for ${beltId}, using default position.`,
      error,
    );
    // Fallback to a simple position at the semi-major axis distance on the x-axis
    initialPosition = new OSVector3(beltOrbit.realSemiMajorAxis_m, 0, 0);
    initialVelocity = new OSVector3(0, 0, 0);
  }
  // --- End calculate initial position and velocity ---

  const belt: CelestialObject = {
    id: beltId,
    name: beltName,
    type: CelestialType.ASTEROID_FIELD,
    status: CelestialStatus.ACTIVE,
    parentId: starId,
    realMass_kg: 0,
    realRadius_m:
      Math.max(beltProperties.outerRadiusAU, beltProperties.innerRadiusAU) *
      CONST.AU_TO_METERS,
    temperature: 150 - bodyDistanceAU * 10,
    orbit: beltOrbit,
    properties: beltProperties,
    ignorePhysics: true,
    physicsStateReal: {
      id: beltId,
      mass_kg: 0,
      position_m: initialPosition,
      velocity_mps: initialVelocity,
    },
  };

  return belt;
}
