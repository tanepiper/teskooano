import { OSVector3 } from "@teskooano/core-math";
import type {
  AsteroidFieldProperties,
  CelestialObject,
  OrbitalParameters,
  PhysicsStateReal,
  StarProperties,
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
 * @param parentStar The parent star object with its properties.
 * @param index The index in the generation loop for deterministic naming.
 * @param bodyDistanceAU The distance of the belt's center from the star in AU.
 * @returns Realistic CelestialObject for the asteroid belt or null if invalid.
 */
export function generateAsteroidBelt(
  random: () => number,
  parentStar: CelestialObject,
  index: number,
  bodyDistanceAU: number,
): CelestialObject | null {
  // Validate distance range - asteroid belts form in specific zones
  if (!isValidAsteroidBeltDistance(bodyDistanceAU, parentStar.realMass_kg)) {
    console.warn(
      `[generateAsteroidBelt] Invalid distance ${bodyDistanceAU} AU for asteroid belt formation. Skipping.`,
    );
    return null;
  }

  const beltName = generateAsteroidBeltName(index, bodyDistanceAU);
  const beltId = `asteroidbelt-${parentStar.id}-${beltName
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

  // Calculate realistic belt mass based on volume and density
  const beltMass_kg = calculateBeltMass(beltDimensions, bodyDistanceAU, random);

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
  const beltOrbit = generateBeltOrbit(
    bodyDistanceAU,
    parentStar.realMass_kg,
    random,
  );

  if (parentStar.realMass_kg <= 0 || !Number.isFinite(parentStar.realMass_kg)) {
    console.warn(
      `[generateAsteroidBelt] Invalid parent star mass (${parentStar.realMass_kg}) for ${beltId}. Skipping belt.`,
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
    id: parentStar.id,
    mass_kg: parentStar.realMass_kg,
    position_m: parentStar.physicsStateReal.position_m.clone(),
    velocity_mps: parentStar.physicsStateReal.velocity_mps.clone(),
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
    initialPosition = parentStar.physicsStateReal.position_m.clone();
    initialVelocity = parentStar.physicsStateReal.velocity_mps.clone();
  }

  // Calculate realistic temperature based on the parent star's properties
  const beltTemperature = calculateBeltTemperature(bodyDistanceAU, parentStar);

  const belt: CelestialObject = {
    id: beltId,
    name: beltName,
    type: CelestialType.ASTEROID_FIELD,
    status: CelestialStatus.ACTIVE,
    parentId: parentStar.id,
    realMass_kg: beltMass_kg, // Now has realistic mass for gravitational effects
    realRadius_m: beltDimensions.outerRadius * CONST.AU_TO_METERS,
    temperature: beltTemperature,
    orbit: beltOrbit,
    properties: beltProperties,
    ignorePhysics: true, // Belt itself doesn't move, but its mass affects other objects
    ignoreCollisions: true,
    physicsStateReal: {
      id: beltId,
      mass_kg: beltMass_kg,
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
  // Belt width: typically 10-25% of the central distance (reduced from 20-40%)
  const relativeWidth = 0.1 + random() * 0.15; // 10-25%
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
  const baseDensity = 500 + random() * 1500; // Increased from 100-500 to 500-2000 particles per cubic AU

  const totalCount = Math.floor(beltVolume * baseDensity * densityFactor);

  // Realistic range: 5,000 to 100,000 visible objects (increased from 1,000-50,000)
  return Math.max(5000, Math.min(100000, totalCount));
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
 * Calculates realistic belt mass based on volume and density
 */
function calculateBeltMass(
  dimensions: { innerRadius: number; outerRadius: number; height: number },
  distanceAU: number,
  random: () => number,
): number {
  // Belt volume in cubic AU
  const beltVolume =
    Math.PI *
    (dimensions.outerRadius * dimensions.outerRadius -
      dimensions.innerRadius * dimensions.innerRadius) *
    dimensions.height;

  // Density varies with distance from star
  // Inner belts: higher density (more material)
  // Outer belts: lower density (less material available)
  const densityFactor = Math.pow(distanceAU, -1.5); // Inverse square-ish law

  // Base density in kg per cubic AU
  // Asteroid belt density varies significantly, but we can estimate
  const baseDensity = 1e12 + random() * 5e12; // 1-6 trillion kg per cubic AU

  const totalMass = beltVolume * baseDensity * densityFactor;

  // Realistic range: 1e18 to 1e22 kg (similar to real asteroid belts)
  return Math.max(1e18, Math.min(1e22, totalMass));
}

/**
 * Calculates belt temperature based on the parent star's actual properties
 */
function calculateBeltTemperature(
  distanceAU: number,
  parentStar: CelestialObject,
): number {
  // Use the star's actual luminosity from its properties if available
  let starLuminosity: number;

  if (
    parentStar.properties &&
    parentStar.properties.type === CelestialType.STAR
  ) {
    const starProps = parentStar.properties as StarProperties;
    if (starProps.luminosity && starProps.luminosity > 0) {
      starLuminosity = starProps.luminosity * CONST.SOLAR_LUMINOSITY;
    } else {
      // Fallback to mass-based calculation if luminosity is missing or invalid
      const massRatio = Math.max(
        0.01,
        parentStar.realMass_kg / CONST.SOLAR_MASS_KG,
      );
      starLuminosity = CONST.SOLAR_LUMINOSITY * Math.pow(massRatio, 3.5);
    }
  } else {
    // Fallback to mass-based calculation if star properties aren't available
    const massRatio = Math.max(
      0.01,
      parentStar.realMass_kg / CONST.SOLAR_MASS_KG,
    );
    starLuminosity = CONST.SOLAR_LUMINOSITY * Math.pow(massRatio, 3.5);
  }

  // Ensure we have a valid luminosity
  if (!Number.isFinite(starLuminosity) || starLuminosity <= 0) {
    console.warn(
      "[calculateBeltTemperature] Invalid star luminosity, using default",
    );
    starLuminosity = CONST.SOLAR_LUMINOSITY; // Default to solar luminosity
  }

  // Calculate equilibrium temperature at distance
  const distanceM = distanceAU * CONST.AU_TO_METERS;

  // T = (L / (16π σ d²))^(1/4) for a gray body with albedo ~0.1
  const temperature = Math.pow(
    starLuminosity /
      (16 * Math.PI * CONST.STEFAN_BOLTZMANN * distanceM * distanceM),
    0.25,
  );

  // Ensure we have a valid temperature
  if (!Number.isFinite(temperature) || temperature <= 0) {
    console.warn(
      "[calculateBeltTemperature] Invalid temperature calculated, using default",
    );
    return 50; // Default temperature for asteroid belts
  }

  return Math.max(2.7, temperature); // Not colder than cosmic background
}
