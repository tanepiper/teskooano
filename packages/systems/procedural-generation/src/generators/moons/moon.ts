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
  PhysicsStateReal,
} from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";
import { createProceduralSurfaceProperties } from "../../properties";
import { calculatePlanetOrbitAndInitialState } from "../planets/planet-orbit";
import { generateCelestialName } from "../names/celestial-name";

/**
 * Generates scientifically accurate moon data based on real moon formation models
 * and observed satellite systems in our solar system.
 *
 * This function considers:
 * - Hill sphere constraints for orbital stability
 * - Realistic mass ratios based on formation mechanisms
 * - Tidal evolution effects on orbital parameters
 * - Co-accretion vs. capture formation scenarios
 *
 * @param random The seeded pseudo-random number generator function.
 * @param parentPlanetData The data of the parent planet CelestialObject.
 * @param parentPlanetMass The mass of the parent planet in kilograms.
 * @param parentPlanetRadius The radius of the parent planet in meters.
 * @param lastMoonDistance_radii The orbital distance of the previous moon.
 * @param systemSeed The main system seed for deterministic generation.
 * @returns Moon data and next orbital distance for subsequent moons.
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

  // Determine formation mechanism based on realistic probabilities
  const formationMechanism = determineMoonFormation(random, parentPlanetMass);

  // Generate mass based on formation mechanism and realistic constraints
  const moonMass = generateRealisticMoonMass(
    random,
    parentPlanetMass,
    formationMechanism,
  );

  // Calculate density based on formation mechanism
  const moonDensity = generateMoonDensity(random, formationMechanism);
  const moonRadius = UTIL.calculateRadius(moonMass, moonDensity);

  // Calculate orbital distance with realistic spacing (Bode-like law for moons)
  const moonDistance_radii = calculateNextMoonDistance(
    random,
    lastMoonDistance_radii,
    formationMechanism,
    parentPlanetRadius,
    parentPlanetMass,
  );

  const moonSemiMajorAxis_m = moonDistance_radii * parentPlanetRadius;

  // Check Hill sphere constraint for orbital stability
  const parentOrbitSMA =
    parentPlanetData.orbit?.realSemiMajorAxis_m || 1.496e11; // Default to 1 AU
  const parentStarMass = 1.989e30; // Assume solar mass star for Hill sphere calc
  const hillRadius = calculateHillRadius(
    parentOrbitSMA,
    parentPlanetMass,
    parentStarMass,
  );

  if (moonSemiMajorAxis_m > hillRadius * 0.3) {
    // Conservative limit at 30% of Hill radius
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }

  const moonOrbitalPeriod_s = UTIL.calculateOrbitalPeriod_s(
    parentPlanetMass,
    moonSemiMajorAxis_m,
    moonMass,
  );

  // Generate orbital parameters based on formation mechanism
  const orbitalParams = generateMoonOrbit(
    random,
    moonSemiMajorAxis_m,
    moonOrbitalPeriod_s,
    formationMechanism,
  );

  // Validate orbital parameters
  if (parentPlanetMass <= 0 || !Number.isFinite(parentPlanetMass)) {
    console.warn(
      `[generateMoon] Invalid parent planet mass (${parentPlanetMass}) for ${moonId}. Skipping moon.`,
    );
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }

  if (
    orbitalParams.realSemiMajorAxis_m <= 0 ||
    !Number.isFinite(orbitalParams.realSemiMajorAxis_m)
  ) {
    console.warn(
      `[generateMoon] Invalid semi-major axis (${orbitalParams.realSemiMajorAxis_m}) for ${moonId}. Skipping moon.`,
    );
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }

  if (
    orbitalParams.eccentricity < 0 ||
    orbitalParams.eccentricity >= 1 ||
    !Number.isFinite(orbitalParams.eccentricity)
  ) {
    console.warn(
      `[generateMoon] Invalid eccentricity (${orbitalParams.eccentricity}) for ${moonId}. Skipping moon.`,
    );
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }

  // Check Roche limit - moon must be outside the fluid Roche limit
  const parentPlanetDensity =
    parentPlanetMass / ((4 / 3) * Math.PI * Math.pow(parentPlanetRadius, 3));
  const rocheLimit =
    2.44 *
    parentPlanetRadius *
    Math.pow(parentPlanetDensity / moonDensity, 1 / 3);
  const moonPeriapsis =
    orbitalParams.realSemiMajorAxis_m * (1 - orbitalParams.eccentricity);

  if (moonPeriapsis <= rocheLimit * 1.2) {
    // 20% safety margin
    console.warn(
      `[generateMoon] Orbit periapsis (${moonPeriapsis} m) too close to Roche limit (${rocheLimit} m) for ${moonId}. Skipping moon.`,
    );
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }

  // Calculate initial physics state
  let initialWorldPos_m: OSVector3;
  let initialWorldVel_mps: OSVector3;
  const parentPlanetState = parentPlanetData.physicsStateReal;

  try {
    const initialRelativePos_m = calculateOrbitalPosition(
      parentPlanetState,
      orbitalParams,
      0,
    );
    const initialRelativeVel_mps = calculateOrbitalVelocity(
      parentPlanetState,
      orbitalParams,
      0,
    );

    initialWorldPos_m = initialRelativePos_m
      .clone()
      .add(parentPlanetState.position_m);
    initialWorldVel_mps = initialRelativeVel_mps
      .clone()
      .add(parentPlanetState.velocity_mps);

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
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }

  // Determine moon composition and surface properties
  const moonPlanetType = determineMoonType(
    random,
    formationMechanism,
    parentPlanetData,
  );
  const moonSurfaceType = determineMoonSurface(
    moonPlanetType,
    formationMechanism,
  );

  let detailedSurface: ProceduralSurfaceProperties;
  switch (moonPlanetType) {
    case PlanetType.BARREN:
    case PlanetType.ROCKY:
    case PlanetType.TERRESTRIAL:
    case PlanetType.ICE:
    case PlanetType.DESERT:
    case PlanetType.LAVA:
      detailedSurface = createProceduralSurfaceProperties(
        random,
        moonPlanetType,
      );
      break;
    default:
      detailedSurface = createProceduralSurfaceProperties(
        random,
        PlanetType.ROCKY,
      );
  }

  const moonSpecificProperties: PlanetProperties = {
    type: CelestialType.PLANET,
    planetType: moonPlanetType,
    isMoon: true,
    parentPlanet: parentPlanetData.id,
    composition: determineMoonComposition(
      random,
      moonPlanetType,
      formationMechanism,
    ),
    surface: detailedSurface as any,
    atmosphere: undefined, // Most moons lack significant atmospheres
  };

  const moonSeed = `${systemSeed}-${moonId}`;

  // Generate realistic rotation - many moons are tidally locked
  const rotationPeriod_s = generateMoonRotation(
    random,
    moonOrbitalPeriod_s,
    moonSemiMajorAxis_m,
    parentPlanetRadius,
  );

  // Generate axial tilt (generally small for moons)
  const tilt_deg = random() * 10; // Most moons have low obliquity
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
    temperature: parentPlanetData.temperature, // Inherit from parent for simplicity
    orbit: orbitalParams,
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

  // Set surface and atmosphere properties
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

/**
 * Determine moon formation mechanism based on planet mass and realistic probabilities
 */
function determineMoonFormation(
  random: () => number,
  planetMass: number,
): "co-accretion" | "capture" | "impact" {
  const earthMass = 5.972e24;
  const planetMassRatio = planetMass / earthMass;

  // Larger planets more likely to have co-accreted moons
  if (planetMassRatio > 10) {
    // Gas giants
    if (random() < 0.8) return "co-accretion";
    else return "capture";
  } else if (planetMassRatio > 0.5) {
    // Large terrestrial planets
    if (random() < 0.4) return "co-accretion";
    else if (random() < 0.7) return "impact";
    else return "capture";
  } else {
    // Small planets
    if (random() < 0.6) return "capture";
    else if (random() < 0.8) return "impact";
    else return "co-accretion";
  }
}

/**
 * Generate realistic moon mass based on formation mechanism
 */
function generateRealisticMoonMass(
  random: () => number,
  planetMass: number,
  formation: string,
): number {
  const earthMass = 5.972e24;

  switch (formation) {
    case "co-accretion":
      // Co-accreted moons: 0.001% - 0.1% of planet mass (like Galilean moons)
      return planetMass * (0.00001 + random() * 0.001);

    case "impact":
      // Impact-formed moons: larger, like Earth's Moon (1.2% of Earth's mass)
      return planetMass * (0.005 + random() * 0.02);

    case "capture":
      // Captured objects: highly variable, generally smaller
      return planetMass * (0.000001 + random() * 0.0001);

    default:
      return planetMass * (0.00001 + random() * 0.001);
  }
}

/**
 * Generate moon density based on formation mechanism
 */
function generateMoonDensity(random: () => number, formation: string): number {
  switch (formation) {
    case "co-accretion":
      // Similar to parent planet, moderate density
      return 2000 + random() * 2500; // 2.0 - 4.5 g/cm³

    case "impact":
      // Iron-depleted, rocky (like Earth's Moon: 3.34 g/cm³)
      return 3000 + random() * 1000; // 3.0 - 4.0 g/cm³

    case "capture":
      // Variable density, often low (asteroids/comets)
      return 1000 + random() * 3000; // 1.0 - 4.0 g/cm³

    default:
      return 2000 + random() * 2000;
  }
}

/**
 * Calculate next moon orbital distance using realistic spacing
 */
function calculateNextMoonDistance(
  random: () => number,
  lastDistance: number,
  formation: string,
  planetRadius: number,
  planetMass: number,
): number {
  // Minimum distance: 2.5 planetary radii (outside Roche limit)
  const minDistance = Math.max(2.5, lastDistance);

  let spacingFactor: number;

  switch (formation) {
    case "co-accretion":
      // Regular spacing like Galilean moons (factor of ~1.8-2.2)
      spacingFactor = 1.8 + random() * 0.4;
      break;

    case "impact":
      // Impact moons often single, large spacing
      spacingFactor = 3.0 + random() * 2.0;
      break;

    case "capture":
      // Irregular spacing for captured objects
      spacingFactor = 1.5 + random() * 4.0;
      break;

    default:
      spacingFactor = 2.0 + random() * 2.0;
  }

  return minDistance * spacingFactor;
}

/**
 * Calculate Hill radius for orbital stability check
 */
function calculateHillRadius(
  orbitRadius: number,
  planetMass: number,
  starMass: number,
): number {
  return orbitRadius * Math.pow(planetMass / (3 * starMass), 1 / 3);
}

/**
 * Generate moon orbital parameters based on formation mechanism
 */
function generateMoonOrbit(
  random: () => number,
  semiMajorAxis: number,
  period: number,
  formation: string,
): OrbitalParameters {
  let eccentricity: number;
  let inclination: number;

  switch (formation) {
    case "co-accretion":
      // Regular, circular orbits (like Galilean moons)
      eccentricity = random() * 0.01; // Very circular
      inclination = (random() - 0.5) * 0.05; // Nearly coplanar
      break;

    case "impact":
      // Moderate eccentricity, coplanar
      eccentricity = random() * 0.1;
      inclination = (random() - 0.5) * 0.1;
      break;

    case "capture":
      // Highly eccentric, inclined orbits
      eccentricity = 0.1 + random() * 0.4; // Higher eccentricity
      inclination = (random() - 0.5) * 0.5; // Can be highly inclined
      break;

    default:
      eccentricity = random() * 0.05;
      inclination = (random() - 0.5) * 0.1;
  }

  return {
    realSemiMajorAxis_m: semiMajorAxis,
    eccentricity: eccentricity,
    inclination: inclination,
    longitudeOfAscendingNode: random() * 2 * Math.PI,
    argumentOfPeriapsis: random() * 2 * Math.PI,
    meanAnomaly: random() * 2 * Math.PI,
    period_s: period,
  };
}

/**
 * Determine moon type based on formation and parent planet
 */
function determineMoonType(
  random: () => number,
  formation: string,
  parentPlanet: CelestialObject,
): PlanetType {
  const parentProps = parentPlanet.properties as PlanetProperties;

  switch (formation) {
    case "co-accretion":
      // Similar to parent planet material
      if (parentProps?.planetType === PlanetType.TERRESTRIAL) {
        return PlanetType.ROCKY;
      } else {
        return PlanetType.ICE; // Moons of gas giants are often icy
      }

    case "impact":
      // Impact moons are typically rocky/barren
      return PlanetType.BARREN;

    case "capture":
      // Captured objects vary widely
      const types = [PlanetType.BARREN, PlanetType.ROCKY, PlanetType.ICE];
      return types[Math.floor(random() * types.length)];

    default:
      return PlanetType.ROCKY;
  }
}

/**
 * Determine moon surface type
 */
function determineMoonSurface(
  moonType: PlanetType,
  formation: string,
): SurfaceType {
  if (moonType === PlanetType.ICE) {
    return SurfaceType.ICE_FLATS;
  }

  switch (formation) {
    case "impact":
      return SurfaceType.CRATERED; // Heavy bombardment
    case "capture":
      return SurfaceType.CRATERED; // Asteroid-like
    default:
      return SurfaceType.FLAT; // Processed surface
  }
}

/**
 * Determine moon composition
 */
function determineMoonComposition(
  random: () => number,
  moonType: PlanetType,
  formation: string,
): string[] {
  if (moonType === PlanetType.ICE) {
    return CONST.ICE_COMPOSITION;
  }

  switch (formation) {
    case "impact":
      return ["silicates", "iron", "magnesium"]; // Iron-depleted
    case "capture":
      return ["carbon", "silicates", "water ice"]; // Asteroid-like
    default:
      return UTIL.getRandomItem(CONST.ROCKY_COMPOSITION, random).split(",");
  }
}

/**
 * Generate realistic moon rotation period (many moons are tidally locked)
 */
function generateMoonRotation(
  random: () => number,
  orbitalPeriod: number,
  moonDistance: number,
  planetRadius: number,
): number {
  // Close moons are likely tidally locked
  const tidal_locking_threshold = planetRadius * 15;

  if (moonDistance < tidal_locking_threshold) {
    // Tidally locked: rotation period = orbital period
    return orbitalPeriod * (0.95 + random() * 0.1); // Some variation
  } else {
    // Non-tidally locked: independent rotation
    return 50000 + random() * 500000; // 14 hours to 6 days
  }
}
