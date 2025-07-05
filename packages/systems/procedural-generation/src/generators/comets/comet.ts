import { OSVector3 } from "@teskooano/core-math";
import type {
  CelestialObject,
  CometProperties,
  OrbitalParameters,
  PhysicsStateReal,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  CometClass,
  METERS_TO_SCENE_UNITS,
} from "@teskooano/data-types";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";
import { generateCelestialName } from "../names/celestial-name";

/**
 * Generates data for a single comet with a highly elliptical and inclined orbit,
 * typical of long-period comets originating from the outer system.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param parentStar The parent star `CelestialObject`.
 * @param distanceAU The perihelion distance for the comet's orbit in AU.
 * @param index The index in the generation loop for deterministic naming.
 * @returns A `CelestialObject` for the comet, or `null` if parameters are invalid.
 */
export function generateComet(
  random: () => number,
  parentStar: CelestialObject,
  distanceAU: number, // This will be used as the basis for the orbit
  index: number,
): CelestialObject | null {
  const starId = parentStar.id;
  const starMass_kg = parentStar.realMass_kg;

  if (starMass_kg <= 0 || !Number.isFinite(starMass_kg)) {
    console.warn(
      `[generateComet] Invalid parent star mass (${starMass_kg}). Skipping comet generation.`,
    );
    return null;
  }

  const cometName = generateCelestialName(random);
  const cometId = `comet-${starId}-${cometName.toLowerCase().replace(/\s+/g, "-")}`;

  // Comets are small, icy bodies with low density
  const nucleusRadius_km = 1 + random() * 20; // 1-21 km radius
  const nucleusRadius_m = nucleusRadius_km * 1000;
  const density = 600; // Low density for comets (kg/m^3)
  const mass_kg = (4 / 3) * Math.PI * Math.pow(nucleusRadius_m, 3) * density;

  // Generate a highly elliptical and inclined orbit
  const orbit = generateCometOrbit(random, distanceAU, starMass_kg, mass_kg);

  const cometProperties: CometProperties = {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    composition: CONST.ICE_COMPOSITION,
    activity: 0.5 + random() * 0.5, // Active comets
    visualComaRadius:
      nucleusRadius_m * (50 + random() * 50) * METERS_TO_SCENE_UNITS,
    visualComaColor: "#C8DCFF",
    visualComaOpacity: 0.5,
    visualMaxTailLength:
      orbit.realSemiMajorAxis_m * 0.1 * METERS_TO_SCENE_UNITS, // Tail can be 10% of SMA
    visualTailColor: "#DCE6FF",
    visualTailOpacity: 0.6,
  };

  const parentPhysicsState: PhysicsStateReal = {
    id: starId,
    mass_kg: starMass_kg,
    position_m:
      parentStar.physicsStateReal?.position_m ?? new OSVector3(0, 0, 0),
    velocity_mps:
      parentStar.physicsStateReal?.velocity_mps ?? new OSVector3(0, 0, 0),
  };

  let initialPosition: OSVector3;
  let initialVelocity: OSVector3;

  try {
    // Start at a random point in the orbit
    const trueAnomaly = random() * 2 * Math.PI;
    initialPosition = calculateOrbitalPosition(
      parentPhysicsState,
      orbit,
      trueAnomaly,
    );
    initialVelocity = calculateOrbitalVelocity(
      parentPhysicsState,
      orbit,
      trueAnomaly,
    );
  } catch (error) {
    console.warn(
      `[generateComet] Error calculating initial state for ${cometId}, using default position.`,
      error,
    );
    const perihelion_m = orbit.realSemiMajorAxis_m * (1 - orbit.eccentricity);
    initialPosition = new OSVector3(perihelion_m, 0, 0);
    initialVelocity = new OSVector3(0, 0, 0);
  }

  const comet: CelestialObject = {
    id: cometId,
    name: cometName,
    type: CelestialType.COMET,
    status: CelestialStatus.ACTIVE,
    parentId: starId,
    realMass_kg: mass_kg,
    realRadius_m: nucleusRadius_m,
    temperature: 200, // Effective temp, will vary wildly based on distance
    orbit: orbit,
    properties: cometProperties,
    ignorePhysics: false,
    physicsStateReal: {
      id: cometId,
      mass_kg: mass_kg,
      position_m: initialPosition,
      velocity_mps: initialVelocity,
    },
  };

  return comet;
}

/**
 * Generates realistic orbital parameters for a long-period comet.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param distanceAU The average distance from the star, used to calculate semi-major axis.
 * @param starMass_kg The mass of the parent star.
 * @param cometMass_kg The mass of the comet.
 * @returns A populated `OrbitalParameters` object.
 */
function generateCometOrbit(
  random: () => number,
  distanceAU: number,
  starMass_kg: number,
  cometMass_kg: number,
): OrbitalParameters {
  // Comets have very high eccentricity
  const eccentricity = 0.8 + random() * 0.199; // 0.8 - 0.999

  // Use the provided distance as the semi-major axis for long-period comets
  const semiMajorAxis_m = distanceAU * CONST.AU_TO_METERS;

  const period_s = UTIL.calculateOrbitalPeriod_s(
    starMass_kg,
    semiMajorAxis_m,
    cometMass_kg,
  );

  // High inclination, can be retrograde
  const inclination = (random() - 0.5) * Math.PI; // +/- 90 degrees

  return {
    realSemiMajorAxis_m: semiMajorAxis_m,
    eccentricity: eccentricity,
    inclination: inclination,
    longitudeOfAscendingNode: random() * 2 * Math.PI,
    argumentOfPeriapsis: random() * 2 * Math.PI,
    meanAnomaly: random() * 2 * Math.PI, // Start at random point in orbit
    period_s: period_s,
  };
}
