import { OSVector3 } from "@teskooano/core-math";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import type {
  CelestialObject,
  IceSurfaceProperties,
  OrbitalParameters,
  PlanetProperties,
  ProceduralSurfaceProperties,
  SurfacePropertiesUnion,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType
} from "@teskooano/data-types";
import * as CONST from "../constants";
import { generateCelestialName } from "../name-generator";
import * as UTIL from "../utils";

/**
 * Generates data for a single moon orbiting a parent planet.
 * @param random The seeded random function.
 * @param parentPlanetData The data of the parent planet.
 * @param parentPlanetMass The mass of the parent planet (kg).
 * @param parentPlanetRadius The radius of the parent planet (m).
 * @param lastMoonDistance_radii The distance of the previous moon (in parent radii).
 * @param systemSeed The main system seed.
 * @returns The generated moon's data and the new last distance.
 */
export function generateMoon(
  random: () => number,
  parentPlanetData: CelestialObject,
  parentPlanetMass: number,
  parentPlanetRadius: number,
  lastMoonDistance_radii: number,
  systemSeed: string
): { moonData: CelestialObject | null; nextLastMoonDistance_radii: number } {
  const moonName = generateCelestialName(random);
  const moonId = `moon-${parentPlanetData.id}-${moonName.toLowerCase()}`;

  // Captured asteroid chance
  const isCaptured = random() < 0.1; // 10% chance

  // Moon Mass & Radius
  const moonMass =
    parentPlanetMass * (0.00001 + random() * (isCaptured ? 0.0005 : 0.001));
  const moonDensity = isCaptured
    ? 2500 + random() * 1500
    : 1500 + random() * 2000;
  const moonRadius = UTIL.calculateRadius(moonMass, moonDensity);

  // Moon Orbit (relative to parent planet)
  const distanceIncrease_radii = 1.5 + random() * 5;
  const moonDistance_radii = lastMoonDistance_radii + distanceIncrease_radii;
  const moonSemiMajorAxis_m = moonDistance_radii * parentPlanetRadius;

  const moonOrbitalPeriod_s = UTIL.calculateOrbitalPeriod_s(
    parentPlanetMass,
    moonSemiMajorAxis_m,
    moonMass
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

  // --- Validate Moon Orbit ---
  if (parentPlanetMass <= 0 || !Number.isFinite(parentPlanetMass)) {
    console.warn(
      `[generateMoon] Invalid parent planet mass (${parentPlanetMass}) for orbit validation of ${moonId}. Skipping moon.`
    );
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    }; // Indicate failure
  }
  if (
    moonOrbit.realSemiMajorAxis_m <= 0 ||
    !Number.isFinite(moonOrbit.realSemiMajorAxis_m)
  ) {
    console.warn(
      `[generateMoon] Invalid semi-major axis (${moonOrbit.realSemiMajorAxis_m}) for ${moonId}. Skipping moon.`
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
      `[generateMoon] Invalid eccentricity (${moonOrbit.eccentricity}) for ${moonId}. Skipping moon.`
    );
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }
  const moonPeriapsis =
    moonOrbit.realSemiMajorAxis_m * (1 - moonOrbit.eccentricity);
  if (moonPeriapsis <= (parentPlanetRadius ?? 0) * 1.1) {
    // Check if orbit intersects planet (with margin)
    console.warn(
      `[generateMoon] Orbit periapsis (${moonPeriapsis} m) too close to or inside parent radius (${parentPlanetRadius} m) for ${moonId}. Skipping moon.`
    );
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }
  // --- End Validation ---

  // --- Calculate Initial Physics State (Absolute) ---
  let initialWorldPos_m: OSVector3;
  let initialWorldVel_mps: OSVector3;
  const parentPlanetState = parentPlanetData.physicsStateReal;
  try {
    const initialRelativePos_m = calculateOrbitalPosition(
      parentPlanetState, // Parent PLANET's state
      moonOrbit, // Moon's orbital params relative to planet
      0 // time = 0 for initial state
    );
    initialWorldVel_mps = calculateOrbitalVelocity(
      parentPlanetState,
      moonOrbit,
      0
    );
    // Absolute position = parent's position + relative orbital position
    initialWorldPos_m = initialRelativePos_m
      .clone()
      .add(parentPlanetState.position_m);
    // Absolute velocity = parent's velocity + relative orbital velocity
    initialWorldVel_mps.add(parentPlanetState.velocity_mps);

    if (
      !initialWorldPos_m ||
      !initialWorldVel_mps ||
      !Number.isFinite(initialWorldPos_m.x) ||
      !Number.isFinite(initialWorldVel_mps.x)
    ) {
      throw new Error(
        "Calculated initial moon state contains non-finite values."
      );
    }
  } catch (error) {
    console.error(
      `[generateMoon] Error calculating initial physics state for ${moonId}:`,
      error
    );
    console.error("Inputs:", {
      parentState: parentPlanetState,
      orbitParams: moonOrbit,
    });
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    }; // Indicate failure
  }
  // --- End Initial Physics State Calculation ---

  // Moon Specific Properties
  const moonPlanetType = isCaptured
    ? PlanetType.BARREN
    : UTIL.getRandomItem(
        [PlanetType.ROCKY, PlanetType.ICE, PlanetType.BARREN],
        random
      );
  const moonSurfaceType =
    moonPlanetType === PlanetType.ICE
      ? SurfaceType.ICE_FLATS
      : UTIL.getRandomItem(
          [SurfaceType.CRATERED, SurfaceType.FLAT, SurfaceType.MOUNTAINOUS],
          random
        );

  // --- Create detailed surface object based on moonPlanetType ---
  let detailedSurface: SurfacePropertiesUnion;

  // Define base properties (will be spread)
  const baseProps = {
    type: moonSurfaceType,
    roughness: random() * 0.4 + 0.3,
    // color and planetType assigned in switch
  };

  switch (moonPlanetType) {
    case PlanetType.ROCKY:
    case PlanetType.BARREN:
      detailedSurface = {
        ...baseProps,
        planetType: moonPlanetType,
        color: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.midLight, random), // Assign base color
        color1: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.dark, random),
        color2: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.midDark, random),
        color3: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.midLight, random),
        color4: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.light, random),
        color5: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.highlight, random),
        transition2: 0.25 + random() * 0.2,
        transition3: 0.5 + random() * 0.2,
        transition4: 0.75 + random() * 0.15,
        transition5: 0.9 + random() * 0.05,
        blend12: 0.1,
        blend23: 0.1,
        blend34: 0.1,
        blend45: 0.1,
      } as ProceduralSurfaceProperties; // Cast to correct type
      break;
    case PlanetType.ICE:
      detailedSurface = {
        ...baseProps,
        planetType: moonPlanetType,
        color: UTIL.getRandomItem(CONST.ICE_COLORS.main, random), // Base ice color
        secondaryColor: UTIL.getRandomItem(CONST.ICE_COLORS.crevasse, random), // Crevasse color
        // Add Ice specific non-color props if needed later
        // crackIntensity: random(),
        // glossiness: random(),
      } as IceSurfaceProperties;
      break;
    default: // Fallback to Barren
      detailedSurface = {
        ...baseProps,
        planetType: PlanetType.BARREN,
        color: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.midLight, random),
        color1: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.dark, random),
        color2: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.midDark, random),
        color3: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.midLight, random),
        color4: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.light, random),
        color5: UTIL.getRandomItem(CONST.ROCKY_COLOR_BANDS.highlight, random),
        transition2: 0.25 + random() * 0.2,
        transition3: 0.5 + random() * 0.2,
        transition4: 0.75 + random() * 0.15,
        transition5: 0.9 + random() * 0.05,
        blend12: 0.1,
        blend23: 0.1,
        blend34: 0.1,
        blend45: 0.1,
      } as ProceduralSurfaceProperties;
  }
  // -----------------------------------------------------------

  const moonSpecificProperties: PlanetProperties = {
    type: CelestialType.PLANET, // Moons use PlanetProperties schema
    planetType: moonPlanetType,
    isMoon: true,
    parentPlanet: parentPlanetData.id,
    composition: UTIL.getRandomItem(
      moonPlanetType === PlanetType.ICE
        ? CONST.ICE_COMPOSITION
        : CONST.ROCKY_COMPOSITION,
      random
    ).split(","),
    surface: detailedSurface, // Use the detailed surface object
    atmosphere: undefined,
  };

  // Generate a reproducible seed for this moon
  const moonSeed = `${systemSeed}-${moonId}`;

  // --- Rotation Parameters (moved earlier for potential use in state) ---
  const rotationPeriod_s = 72000 + random() * (1800000 - 72000);
  const tilt_deg = random() * 90;
  const tilt_rad = tilt_deg * (Math.PI / 180);
  const tiltAxis = new OSVector3(0, Math.cos(tilt_rad), Math.sin(tilt_rad));
  // --- End Rotation Parameters ---

  const moonData: CelestialObject = {
    id: moonId,
    name: moonName,
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentPlanetData.id,
    currentParentId: parentPlanetData.id, // Moon's parent is the planet
    realMass_kg: moonMass,
    realRadius_m: moonRadius,

    temperature: parentPlanetData.temperature, // Inherit parent's temp
    orbit: moonOrbit,
    properties: moonSpecificProperties, // Assign PlanetProperties here
    seed: moonSeed,
    siderealRotationPeriod_s: rotationPeriod_s,
    axialTilt: tiltAxis,

    // Add missing state properties
    physicsStateReal: {
      id: moonId,
      mass_kg: moonMass,
      position_m: initialWorldPos_m,
      velocity_mps: initialWorldVel_mps,
    },
  };

  // Add atmosphere/surface to the top level for compatibility (like in planet.ts)
  if (
    moonData.properties?.type === CelestialType.MOON ||
    moonData.properties?.type === CelestialType.PLANET ||
    moonData.properties?.type === CelestialType.DWARF_PLANET
  ) {
    const props = moonData.properties as PlanetProperties;
    moonData.atmosphere = props.atmosphere; // Although moons might not have generated one here
    moonData.surface = props.surface; // Copy surface props to top level
  }

  return { moonData, nextLastMoonDistance_radii: moonDistance_radii };
}
