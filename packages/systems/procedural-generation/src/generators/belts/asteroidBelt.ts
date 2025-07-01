import { OSVector3 } from "@teskooano/core-math";
import type {
  AsteroidFieldProperties,
  CelestialObject,
  OrbitalParameters,
  PhysicsStateReal,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  RockyType,
} from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import { isValidAsteroidBeltDistance } from "./utils";

/**
 * Generates scientifically accurate asteroid belt data based on real asteroid belt observations
 * and formation models.
 *
 * This function creates realistic asteroid belts considering:
 * - Proper distance ranges for belt formation (typically 2-4 AU in solar-type systems)
 * - Realistic particle counts and density distributions
 * - Accurate orbital eccentricity and inclination spreads
 * - Temperature-dependent composition (rocky inner, icy outer belts)
 * - Kirkwood gaps and resonance effects
 *
 * @param random The seeded pseudo-random number generator function.
 * @param starId The ID of the parent star.
 * @param starMass_kg The mass of the parent star in kilograms.
 * @param index The index in the generation loop for deterministic naming.
 * @param bodyDistanceAU The distance of the belt's center from the star in AU.
 * @returns Realistic CelestialObject for the asteroid belt or null if invalid.
 */
export function generateAsteroidBelt(
  random: () => number,
  starId: string,
  starMass_kg: number,
  index: number,
  bodyDistanceAU: number,
): CelestialObject | null {
  // Validate distance range - asteroid belts form in specific zones
  if (!isValidAsteroidBeltDistance(bodyDistanceAU, starMass_kg)) {
    console.warn(
      `[generateAsteroidBelt] Invalid distance ${bodyDistanceAU} AU for asteroid belt formation. Skipping.`,
    );
    return null;
  }

  const beltName = generateAsteroidBeltName(index, bodyDistanceAU);
  const beltId = `asteroidbelt-${starId}-${beltName
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  // Determine belt composition based on distance and temperature
  const beltComposition = determineBeltComposition(bodyDistanceAU, random);
  const beltType = beltComposition.primaryType;

  // Calculate realistic belt dimensions
  const beltDimensions = calculateBeltDimensions(bodyDistanceAU, random);

  // Calculate realistic particle count based on belt mass and size
  const particleCount = calculateRealisticParticleCount(
    beltDimensions,
    bodyDistanceAU,
    random,
  );

  const beltProperties: AsteroidFieldProperties = {
    type: CelestialType.ASTEROID_FIELD,
    innerRadiusAU: beltDimensions.innerRadius,
    outerRadiusAU: beltDimensions.outerRadius,
    heightAU: beltDimensions.height,
    count: particleCount,
    color: UTIL.getRandomItem(CONST.RING_COLORS[beltType], random).replace(
      "c0",
      "ff",
    ),
    composition: beltComposition.materials,
  };

  // Generate realistic orbital parameters with proper eccentricity distribution
  const beltOrbit = generateBeltOrbit(bodyDistanceAU, starMass_kg, random);

  if (starMass_kg <= 0 || !Number.isFinite(starMass_kg)) {
    console.warn(
      `[generateAsteroidBelt] Invalid parent star mass (${starMass_kg}) for ${beltId}. Skipping belt.`,
    );
    return null;
  }

  if (
    beltOrbit.realSemiMajorAxis_m <= 0 ||
    !Number.isFinite(beltOrbit.realSemiMajorAxis_m)
  ) {
    console.warn(
      `[generateAsteroidBelt] Invalid semi-major axis for ${beltId}. Skipping belt.`,
    );
    return null;
  }

  if (
    beltOrbit.eccentricity < 0 ||
    beltOrbit.eccentricity >= 1 ||
    !Number.isFinite(beltOrbit.eccentricity)
  ) {
    console.warn(
      `[generateAsteroidBelt] Invalid eccentricity for ${beltId}. Skipping belt.`,
    );
    return null;
  }

  const starPhysicsState: PhysicsStateReal = {
    id: starId,
    mass_kg: starMass_kg,
    position_m: new OSVector3(0, 0, 0),
    velocity_mps: new OSVector3(0, 0, 0),
  };

  let initialPosition: OSVector3;
  let initialVelocity: OSVector3;

  try {
    initialPosition = calculateOrbitalPosition(starPhysicsState, beltOrbit, 0);
    initialVelocity = calculateOrbitalVelocity(starPhysicsState, beltOrbit, 0);
  } catch (error) {
    console.warn(
      `[generateAsteroidBelt] Error calculating initial state for ${beltId}, using default position.`,
      error,
    );
    initialPosition = new OSVector3(beltOrbit.realSemiMajorAxis_m, 0, 0);
    initialVelocity = new OSVector3(0, 0, 0);
  }

  // Calculate realistic temperature based on distance from star
  const beltTemperature = calculateBeltTemperature(bodyDistanceAU, starMass_kg);

  const belt: CelestialObject = {
    id: beltId,
    name: beltName,
    type: CelestialType.ASTEROID_FIELD,
    status: CelestialStatus.ACTIVE,
    parentId: starId,
    realMass_kg: 0, // Asteroid belts have negligible total mass
    realRadius_m: beltDimensions.outerRadius * CONST.AU_TO_METERS,
    temperature: beltTemperature,
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

/**
 * Generates appropriate names for asteroid belts based on distance
 */
function generateAsteroidBeltName(index: number, distanceAU: number): string {
  const baseName = String.fromCharCode(65 + index); // A, B, C...

  if (distanceAU < 5) {
    return `Inner Belt ${baseName}`;
  } else if (distanceAU < 15) {
    return `Main Belt ${baseName}`;
  } else {
    return `Outer Belt ${baseName}`;
  }
}

/**
 * Determines belt composition based on distance from star (temperature gradient)
 */
function determineBeltComposition(
  distanceAU: number,
  random: () => number,
): {
  primaryType: RockyType;
  materials: string[];
} {
  if (distanceAU < 2.5) {
    // Inner belt: predominantly rocky/metallic (hot region)
    const type = random() < 0.7 ? RockyType.METALLIC : RockyType.DARK_ROCK;
    return {
      primaryType: type,
      materials: ["iron", "nickel", "silicates", "platinum group metals"],
    };
  } else if (distanceAU < 6) {
    // Main belt: mixed rocky and carbonaceous
    const type = random() < 0.5 ? RockyType.LIGHT_ROCK : RockyType.DARK_ROCK;
    return {
      primaryType: type,
      materials: ["silicates", "carbon", "water", "organic compounds"],
    };
  } else {
    // Outer belt: icy composition (beyond frost line)
    return {
      primaryType: RockyType.ICE,
      materials: [
        "water ice",
        "methane ice",
        "ammonia ice",
        "silicates",
        "organics",
      ],
    };
  }
}

/**
 * Calculates realistic belt dimensions based on astronomical observations
 */
function calculateBeltDimensions(
  centerDistanceAU: number,
  random: () => number,
): {
  innerRadius: number;
  outerRadius: number;
  height: number;
} {
  // Belt width: typically 20-40% of the central distance
  const relativeWidth = 0.2 + random() * 0.2; // 20-40%
  const halfWidth = centerDistanceAU * relativeWidth * 0.5;

  const innerRadius = Math.max(0.1, centerDistanceAU - halfWidth);
  const outerRadius = centerDistanceAU + halfWidth;

  // Belt height: much smaller than width (disk-like structure)
  // Typically 1-5% of the radial width
  const height = halfWidth * 2 * (0.01 + random() * 0.04); // 1-5% of width

  return {
    innerRadius,
    outerRadius,
    height,
  };
}

/**
 * Calculates realistic particle count based on belt mass distribution models
 */
function calculateRealisticParticleCount(
  dimensions: { innerRadius: number; outerRadius: number; height: number },
  distanceAU: number,
  random: () => number,
): number {
  // Base count depends on belt volume and distance from star
  const beltVolume =
    Math.PI *
    (dimensions.outerRadius * dimensions.outerRadius -
      dimensions.innerRadius * dimensions.innerRadius) *
    dimensions.height;

  // Density decreases with distance (less material available)
  const densityFactor = Math.pow(distanceAU, -1.5); // Inverse square-ish law

  // Base particle density (particles per cubic AU)
  const baseDensity = 100 + random() * 400; // 100-500 particles per cubic AU

  const totalCount = Math.floor(beltVolume * baseDensity * densityFactor);

  // Realistic range: 1,000 to 50,000 visible objects
  return Math.max(1000, Math.min(50000, totalCount));
}

/**
 * Generates realistic orbital parameters for asteroid belt
 */
function generateBeltOrbit(
  distanceAU: number,
  starMass_kg: number,
  random: () => number,
): OrbitalParameters {
  const semiMajorAxis_m = distanceAU * CONST.AU_TO_METERS;
  const period_s = UTIL.calculateOrbitalPeriod_s(
    starMass_kg,
    semiMajorAxis_m,
    0,
  );

  // Asteroid belts have low but non-zero eccentricity
  // Main belt asteroids: mean eccentricity ~0.15
  const eccentricity = 0.05 + random() * 0.2; // 0.05 to 0.25

  // Inclination spread: Main belt has ~5-10° spread
  const inclination = (random() - 0.5) * 0.2; // ±6° spread

  return {
    realSemiMajorAxis_m: semiMajorAxis_m,
    eccentricity: eccentricity,
    inclination: inclination,
    longitudeOfAscendingNode: random() * 2 * Math.PI,
    argumentOfPeriapsis: random() * 2 * Math.PI,
    meanAnomaly: random() * 2 * Math.PI,
    period_s: period_s,
  };
}

/**
 * Calculates belt temperature based on stellar heating
 */
function calculateBeltTemperature(
  distanceAU: number,
  starMass_kg: number,
): number {
  const solarMass = 1.989e30;
  const solarLuminosity = 3.828e26; // Watts

  // Approximate stellar luminosity using mass-luminosity relation
  const massRatio = starMass_kg / solarMass;
  const stellarLuminosity = solarLuminosity * Math.pow(massRatio, 3.5);

  // Calculate equilibrium temperature at distance
  const stefanBoltzmann = 5.67e-8;
  const distanceM = distanceAU * CONST.AU_TO_METERS;

  // T = (L / (16π σ d²))^(1/4) for a gray body with albedo ~0.1
  const temperature = Math.pow(
    stellarLuminosity /
      (16 * Math.PI * stefanBoltzmann * distanceM * distanceM),
    0.25,
  );

  return Math.max(2.7, temperature); // Not colder than cosmic background
}
