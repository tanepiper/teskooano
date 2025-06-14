import { OSVector3 } from "@teskooano/core-math";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import type {
  CelestialObject,
  OrbitalParameters,
  PlanetProperties,
  ProceduralSurfaceProperties,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType,
} from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";
import { generateCelestialName } from "../names";

/**
 * Generates data for a single moon orbiting a parent planet.
 *
 * This function calculates the moon's physical properties (mass, radius),
 * determines its orbital parameters, and generates its surface characteristics.
 * It handles potential "captured" moons by adjusting their properties for a more
 * irregular appearance. It also performs validation to ensure the generated orbit
 * is stable and does not intersect the parent planet.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param parentPlanetData The data of the parent planet `CelestialObject`.
 * @param parentPlanetMass The mass of the parent planet in kilograms.
 * @param parentPlanetRadius The radius of the parent planet in meters.
 * @param lastMoonDistance_radii The orbital distance of the previous moon in
 *   multiples of the parent's radius. This is used to place subsequent moons
 *   further out.
 * @param systemSeed The main system seed, used for generating a unique seed for the moon.
 * @returns An object containing:
 *  - `moonData`: The generated `CelestialObject` for the moon, or `null` if
 *    generation fails (e.g., due to an unstable orbit).
 *  - `nextLastMoonDistance_radii`: The new orbital distance to be used for the
 *    next moon in the sequence.
 */
export function generateMoon(
  random: () => number,
  parentPlanetData: CelestialObject,
  parentPlanetMass: number,
  parentPlanetRadius: number,
  lastMoonDistance_radii: number,
  systemSeed: string,
): { moonData: CelestialObject | null; nextLastMoonDistance_radii: number } {
  const moonName = generateCelestialName(random);
  const moonId = `moon-${parentPlanetData.id}-${moonName.toLowerCase()}`;

  const isCaptured = random() < 0.1;

  const moonMass =
    parentPlanetMass * (0.00001 + random() * (isCaptured ? 0.0005 : 0.001));
  const moonDensity = isCaptured
    ? 2500 + random() * 1500
    : 1500 + random() * 2000;
  const moonRadius = UTIL.calculateRadius(moonMass, moonDensity);

  const distanceIncrease_radii = 1.5 + random() * 5;
  const moonDistance_radii = lastMoonDistance_radii + distanceIncrease_radii;
  const moonSemiMajorAxis_m = moonDistance_radii * parentPlanetRadius;

  const moonOrbitalPeriod_s = UTIL.calculateOrbitalPeriod_s(
    parentPlanetMass,
    moonSemiMajorAxis_m,
    moonMass,
  );

  const moonOrbit: OrbitalParameters = {
    realSemiMajorAxis_m: moonSemiMajorAxis_m,
    eccentricity: random() * (isCaptured ? 0.2 : 0.05),
    inclination: (random() - 0.5) * (isCaptured ? 0.5 : 0.1),
    longitudeOfAscendingNode: random() * 2 * Math.PI,
    argumentOfPeriapsis: random() * 2 * Math.PI,
    meanAnomaly: random() * 2 * Math.PI,
    period_s: moonOrbitalPeriod_s,
  };

  if (parentPlanetMass <= 0 || !Number.isFinite(parentPlanetMass)) {
    console.warn(
      `[generateMoon] Invalid parent planet mass (${parentPlanetMass}) for orbit validation of ${moonId}. Skipping moon.`,
    );
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }
  if (
    moonOrbit.realSemiMajorAxis_m <= 0 ||
    !Number.isFinite(moonOrbit.realSemiMajorAxis_m)
  ) {
    console.warn(
      `[generateMoon] Invalid semi-major axis (${moonOrbit.realSemiMajorAxis_m}) for ${moonId}. Skipping moon.`,
    );
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }
  if (
    moonOrbit.eccentricity < 0 ||
    moonOrbit.eccentricity >= 1 ||
    !Number.isFinite(moonOrbit.eccentricity)
  ) {
    console.warn(
      `[generateMoon] Invalid eccentricity (${moonOrbit.eccentricity}) for ${moonId}. Skipping moon.`,
    );
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }
  const moonPeriapsis =
    moonOrbit.realSemiMajorAxis_m * (1 - moonOrbit.eccentricity);
  if (moonPeriapsis <= (parentPlanetRadius ?? 0) * 1.1) {
    console.warn(
      `[generateMoon] Orbit periapsis (${moonPeriapsis} m) too close to or inside parent radius (${parentPlanetRadius} m) for ${moonId}. Skipping moon.`,
    );
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }

  let initialWorldPos_m: OSVector3;
  let initialWorldVel_mps: OSVector3;
  const parentPlanetState = parentPlanetData.physicsStateReal;
  try {
    const initialRelativePos_m = calculateOrbitalPosition(
      parentPlanetState,
      moonOrbit,
      0,
    );
    initialWorldVel_mps = calculateOrbitalVelocity(
      parentPlanetState,
      moonOrbit,
      0,
    );

    initialWorldPos_m = initialRelativePos_m
      .clone()
      .add(parentPlanetState.position_m);

    if (
      !initialWorldPos_m ||
      !initialWorldVel_mps ||
      !Number.isFinite(initialWorldPos_m.x) ||
      !Number.isFinite(initialWorldVel_mps.x)
    ) {
      throw new Error(
        "Calculated initial moon state contains non-finite values.",
      );
    }
  } catch (error) {
    console.error(
      `[generateMoon] Error calculating initial physics state for ${moonId}:`,
      error,
    );
    console.error("Inputs:", {
      parentState: parentPlanetState,
      orbitParams: moonOrbit,
    });
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }

  const moonPlanetType = isCaptured
    ? PlanetType.BARREN
    : UTIL.getRandomItem(
        [PlanetType.ROCKY, PlanetType.ICE, PlanetType.BARREN],
        random,
      );
  const moonSurfaceType =
    moonPlanetType === PlanetType.ICE
      ? SurfaceType.ICE_FLATS
      : UTIL.getRandomItem(
          [SurfaceType.CRATERED, SurfaceType.FLAT, SurfaceType.MOUNTAINOUS],
          random,
        );

  let detailedSurface: ProceduralSurfaceProperties;

  const baseProps = {
    type: moonSurfaceType,
    roughness: random() * 0.4 + 0.3,
  };

  switch (moonPlanetType) {
    case PlanetType.BARREN:
    case PlanetType.ROCKY:
    case PlanetType.TERRESTRIAL:
    case PlanetType.ICE:
    case PlanetType.DESERT:
    case PlanetType.LAVA:
      detailedSurface = UTIL.createProceduralSurfaceProperties(
        random,
        moonPlanetType,
      );
      break;
    default:
      detailedSurface = UTIL.createProceduralSurfaceProperties(
        random,
        PlanetType.ROCKY,
      );
  }

  const moonSpecificProperties: PlanetProperties = {
    type: CelestialType.PLANET,
    planetType: moonPlanetType,
    isMoon: true,
    parentPlanet: parentPlanetData.id,
    composition: UTIL.getRandomItem(
      moonPlanetType === PlanetType.ICE
        ? CONST.ICE_COMPOSITION
        : CONST.ROCKY_COMPOSITION,
      random,
    ).split(","),
    surface: detailedSurface as any,
    atmosphere: undefined,
  };

  const moonSeed = `${systemSeed}-${moonId}`;

  const rotationPeriod_s = 72000 + random() * (1800000 - 72000);
  const tilt_deg = random() * 90;
  const tilt_rad = tilt_deg * (Math.PI / 180);
  const tiltAxis = new OSVector3(0, Math.cos(tilt_rad), Math.sin(tilt_rad));

  const moonData: CelestialObject = {
    id: moonId,
    name: moonName,
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentPlanetData.id,
    currentParentId: parentPlanetData.id,
    realMass_kg: moonMass,
    realRadius_m: moonRadius,

    temperature: parentPlanetData.temperature,
    orbit: moonOrbit,
    properties: moonSpecificProperties,
    seed: moonSeed,
    siderealRotationPeriod_s: rotationPeriod_s,
    axialTilt: tiltAxis,

    physicsStateReal: {
      id: moonId,
      mass_kg: moonMass,
      position_m: initialWorldPos_m,
      velocity_mps: initialWorldVel_mps,
    },
  };

  if (
    moonData.properties?.type === CelestialType.MOON ||
    moonData.properties?.type === CelestialType.PLANET ||
    moonData.properties?.type === CelestialType.DWARF_PLANET
  ) {
    const props = moonData.properties as PlanetProperties;
    moonData.atmosphere = props.atmosphere;
    moonData.surface = props.surface;
  }

  return { moonData, nextLastMoonDistance_radii: moonDistance_radii };
}
