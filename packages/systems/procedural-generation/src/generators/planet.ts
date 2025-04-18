import { OSVector3 } from "@teskooano/core-math";
import type {
  CelestialObject,
  OrbitalParameters,
  PhysicsStateReal,
  RingProperties,
  RingSystemProperties,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  scaleSize,
} from "@teskooano/data-types";
import * as CONST from "../constants";
import { generateCelestialName } from "../name-generator";
import * as UTIL from "../utils";
import { calculatePlanetOrbitAndInitialState } from "./planet-orbit";
import { generatePlanetSpecificProperties } from "./planet-properties";
import { generateRings } from "./planet-rings";
import { determinePlanetTypeAndBaseProperties } from "./planet-type";

// Import necessary utils functions
import { calculateLuminosity, estimateTemperature } from "../utils";

/**
 * Orchestrates the generation of data for a planet and potentially its ring system
 * by calling specialized generator functions.
 *
 * @param random The seeded random function.
 * @param starId The ID of the parent star.
 * @param starMass_kg The mass of the parent star (kg).
 * @param starTemperature The temperature of the parent star (K).
 * @param starRadius The radius of the parent star (m).
 * @param bodyDistanceAU The distance of this planet from the star (AU).
 * @param systemSeed The main system seed.
 * @param parentStarState The state of the parent star for physics calculations.
 * @returns An object containing generated objects, planet mass, and planet radius.
 */
export function generatePlanet(
  random: () => number,
  starId: string,
  starMass_kg: number,
  starTemperature: number,
  starRadius: number,
  bodyDistanceAU: number,
  systemSeed: string,
  parentStarState: PhysicsStateReal,
): {
  generatedObjects: (CelestialObject | null)[];
  planetMass_kg: number;
  planetRadius_m: number;
} {
  const planetName = generateCelestialName(random);
  const planetId = `planet-${starId}-${planetName.toLowerCase()}`; // Use const

  const generatedObjects: (CelestialObject | null)[] = [];

  // 1. Determine Planet Type and Base Properties
  const baseProps = determinePlanetTypeAndBaseProperties(
    random,
    bodyDistanceAU,
    starTemperature,
    starRadius,
  );

  // 2. Calculate Preliminary Mass and Radius
  const massRangeMultiplier = 1 + bodyDistanceAU / 5; // Base multiplier + distance factor
  // Apply zone/type specific mass factor determined earlier
  const planetMassMultiplier =
    (0.1 + random() * 10) *
    massRangeMultiplier *
    baseProps.massMultiplierFactor;
  const planetMass_kg = planetMassMultiplier * CONST.EARTH_MASS_KG;

  // Recalculate radius using the target density for the final determined type
  // This provides a more accurate final radius based on composition
  const finalPlanetRadius_m = UTIL.calculateRadius(
    planetMass_kg,
    baseProps.targetDensity_kg_m3,
  );

  // 3. Generate Type-Specific Properties
  const specificProperties = generatePlanetSpecificProperties(
    random,
    baseProps,
    bodyDistanceAU, // Pass distance if needed
  );

  // 4. Calculate Visual Radius (using final radius)
  const visualPlanetRadius_m = scaleSize(
    finalPlanetRadius_m,
    baseProps.planetType,
  );

  // 5. Generate Rings (if applicable)
  let generatedRings: RingProperties[] | undefined;
  if (baseProps.ringChance > 0 && baseProps.ringAllowedTypes.length > 0) {
    generatedRings = generateRings(
      random,
      baseProps.ringChance,
      baseProps.ringAllowedTypes,
      visualPlanetRadius_m, // Pass VISUAL radius in meters
    );
  }

  // 6. Calculate Orbital Parameters and Initial Physics State
  const { orbit, initialPhysicsState } = calculatePlanetOrbitAndInitialState(
    random,
    starMass_kg,
    planetMass_kg,
    bodyDistanceAU,
    parentStarState,
    planetId,
  );

  // If initial state calculation failed, bail out
  if (!initialPhysicsState) {
    console.error(
      `[generatePlanet] Failed to calculate initial state for ${planetId}, skipping object creation.`,
    );
    return { generatedObjects: [], planetMass_kg: 0, planetRadius_m: 0 }; // Return empty/zero
  }

  // 7. Rotation Parameters
  const rotationPeriod_s = 18000 + random() * (172800 - 18000); // 5 hours to 2 days
  const tilt_deg = random() * 45; // 0 to 45 degrees tilt
  const tilt_rad = tilt_deg * (Math.PI / 180);
  // Ensure tiltAxis is normalized or correctly calculated if needed elsewhere
  // For simple tilt degrees, storing the angle might be enough, but a vector is standard
  const tiltAxis = new OSVector3(
    0,
    Math.cos(tilt_rad),
    Math.sin(tilt_rad),
  ).normalize();

  // 8. Generate Planet Seed and Temperature
  const planetSeed = `${systemSeed}-${planetId}`;
  const starLuminosity = calculateLuminosity(starRadius, starTemperature);
  const planetTemp = estimateTemperature(starLuminosity, bodyDistanceAU);

  // 9. Create the main Planet Object
  const planetData: CelestialObject = {
    id: planetId,
    name: planetName,
    status: CelestialStatus.ACTIVE,
    type: baseProps.planetType,
    parentId: starId,
    currentParentId: starId,
    realMass_kg: planetMass_kg,
    realRadius_m: finalPlanetRadius_m, // Use final radius
    temperature: planetTemp,
    orbit: orbit,
    properties: specificProperties,
    seed: planetSeed,
    siderealRotationPeriod_s: rotationPeriod_s,
    axialTilt: tiltAxis,
    physicsStateReal: initialPhysicsState,
    // Note: Scaled properties (visual radius, scaled mass) are derived
    // by the consuming system (e.g., renderer) using scaleSize/SCALE constants.
    // We don't store them directly on the core object anymore.
  };
  generatedObjects.push(planetData);

  // 10. Create Ring System Object (if rings were generated)
  if (generatedRings && generatedRings.length > 0) {
    const ringSystemId = `ring-system-${planetId}`;
    const ringSystemName = `${planetName} Rings`;

    const ringSystemProperties: RingSystemProperties = {
      type: CelestialType.RING_SYSTEM,
      rings: generatedRings,
      parentId: planetId,
    };

    // Ring system inherits position/orientation from parent
    const ringSystemData: CelestialObject = {
      id: ringSystemId,
      name: ringSystemName,
      type: CelestialType.RING_SYSTEM,
      status: CelestialStatus.ACTIVE,
      parentId: planetId,
      currentParentId: planetId,
      properties: ringSystemProperties,
      axialTilt: tiltAxis.clone(), // Inherit tilt
      // No independent orbit, mass, radius, temp
      realMass_kg: 0,
      realRadius_m: 0,
      temperature: 0,
      orbit: {} as OrbitalParameters, // Empty orbit
      // Minimal physics state, starts at parent's position/velocity
      physicsStateReal: {
        id: ringSystemId,
        mass_kg: 0,
        position_m: initialPhysicsState.position_m.clone(),
        velocity_mps: initialPhysicsState.velocity_mps.clone(),
      },
    };
    generatedObjects.push(ringSystemData);
  }

  // Return the array of generated objects and key planet stats
  return {
    generatedObjects,
    planetMass_kg,
    planetRadius_m: finalPlanetRadius_m,
  };
}
