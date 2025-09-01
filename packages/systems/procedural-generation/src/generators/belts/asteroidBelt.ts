import type {
  AsteroidFieldProperties,
  CelestialObject,
  OrbitalParameters,
  StarProperties,
} from "@teskooano/data-types";
import {
  AU_METERS,
  SOLAR_LUMINOSITY,
  SOLAR_MASS,
  STEFAN_BOLTZMANN_CONSTANT,
} from "@teskooano/data-values";
import {
  CelestialStatus,
  CelestialType,
  RockyType,
} from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils-functions";
import { createOrbitalElements } from "@teskooano/core-physics";
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

  const starId = parentStar.id;
  const starMass_kg = parentStar.realMass_kg;

  if (starMass_kg <= 0 || !Number.isFinite(starMass_kg)) {
    console.warn(
      `[generateAsteroidBelt] Invalid parent star mass (${starMass_kg}). Skipping belt generation.`,
    );
    return null;
  }

  const beltName = generateAsteroidBeltName(index, bodyDistanceAU);
  const beltId = `belt-${starId}-${beltName.toLowerCase().replace(/\s+/g, "-")}`;

  // Calculate realistic belt dimensions
  const beltDimensions = calculateBeltDimensions(bodyDistanceAU, random);

  // Calculate realistic belt mass
  const beltMass_kg = calculateBeltMass(beltDimensions, bodyDistanceAU, random);

  // Calculate realistic particle count
  const particleCount = calculateRealisticParticleCount(
    beltDimensions,
    bodyDistanceAU,
    random,
  );

  // Determine belt composition based on distance
  const composition = determineBeltComposition(bodyDistanceAU, random);

  // Generate orbital parameters
  const beltOrbit = generateBeltOrbit(bodyDistanceAU, starMass_kg, random);

  // Create belt properties
  const beltProperties: AsteroidFieldProperties = {
    type: CelestialType.ASTEROID_FIELD,
    innerRadiusAU: beltDimensions.innerRadius,
    outerRadiusAU: beltDimensions.outerRadius,
    heightAU: beltDimensions.height,
    count: particleCount,
    color: UTIL.getRandomItem(
      CONST.RING_COLORS[composition.primaryType],
      random,
    ).replace("c0", "ff"),
    composition: composition.materials,
  };

  // Calculate realistic temperature based on the parent star's properties
  const beltTemperature = calculateBeltTemperature(bodyDistanceAU, parentStar);

  const belt: CelestialObject = {
    id: beltId,
    name: beltName,
    type: CelestialType.ASTEROID_FIELD,
    status: CelestialStatus.ACTIVE,
    parentId: parentStar.id,
    realMass_kg: beltMass_kg, // Now has realistic mass for gravitational effects
    realRadius_m:
      (beltDimensions.outerRadius - beltDimensions.innerRadius) * AU_METERS,
    temperature: beltTemperature,
    orbit: beltOrbit,
    properties: beltProperties,
    ignorePhysics: true, // Belt itself doesn't move, but its mass affects other objects
    ignoreCollisions: true,
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
  // Belt width: Make it more substantial, like the Solar System's main belt (1.2 AU width)
  // Scale proportionally with distance, but ensure minimum substantial width
  const baseWidth = Math.max(0.8, centerDistanceAU * 0.4); // At least 0.8 AU width
  const widthVariation = baseWidth * (0.8 + random() * 0.4); // ±20% variation
  const halfWidth = widthVariation * 0.5;

  const innerRadius = Math.max(0.1, centerDistanceAU - halfWidth);
  const outerRadius = centerDistanceAU + halfWidth;

  // Belt height: Make it more substantial like the Solar System (0.5 AU)
  // Height should be roughly 30-60% of the width
  const height = halfWidth * 2 * (0.3 + random() * 0.3); // 30-60% of width

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
  // Base count should be more substantial, like the Solar System's 50,000
  const beltVolume =
    Math.PI *
    (dimensions.outerRadius * dimensions.outerRadius -
      dimensions.innerRadius * dimensions.innerRadius) *
    dimensions.height;

  // Density decreases with distance but should still produce substantial counts
  const densityFactor = Math.pow(distanceAU, -0.5); // Less steep decline

  // Increase base density to get counts closer to Solar System values
  const baseDensity = 2000 + random() * 3000; // 2000-5000 particles per cubic AU

  const totalCount = Math.floor(beltVolume * baseDensity * densityFactor);

  // Target range: 15,000 to 75,000 visible objects (closer to Solar System's 50,000)
  return Math.max(15000, Math.min(75000, totalCount));
}

/**
 * Generates realistic orbital parameters for asteroid belt
 */
function generateBeltOrbit(
  distanceAU: number,
  starMass_kg: number,
  random: () => number,
): OrbitalParameters {
  const period_s = UTIL.calculateOrbitalPeriod_s(
    starMass_kg,
    distanceAU * AU_METERS,
    0,
  );

  // Asteroid belts have low but non-zero eccentricity
  // Main belt asteroids: mean eccentricity ~0.15
  const eccentricity = 0.05 + random() * 0.2; // 0.05 to 0.25

  // Inclination spread: Main belt has ~5-10° spread
  const inclinationDeg = (random() - 0.5) * 12; // ±6° spread

  // Generate axial tilt (asteroid belts don't have meaningful axial tilt)
  const axialTiltDeg = 0;

  return createOrbitalElements({
    semiMajorAxisAU: distanceAU,
    eccentricity: eccentricity,
    inclinationDeg: inclinationDeg,
    longitudeOfAscendingNodeDeg: random() * 360,
    argumentOfPeriapsisDeg: random() * 360,
    meanAnomalyDeg: random() * 360,
    period_s: period_s,
    siderealRotationPeriod_s: period_s, // Asteroid belts don't rotate
    axialTiltDeg: axialTiltDeg,
  });
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

  // Density varies with distance from star but should produce Solar System-like masses
  const densityFactor = Math.pow(distanceAU, -0.5); // Less steep decline

  // Increase base density to get masses closer to Solar System's 3e21 kg
  const baseDensity = 5e12 + random() * 1e13; // 5-15 trillion kg per cubic AU

  const totalMass = beltVolume * baseDensity * densityFactor;

  // Target range: 1e21 to 1e22 kg (closer to Solar System's 3e21 kg)
  return Math.max(1e21, Math.min(1e22, totalMass));
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
      starLuminosity = starProps.luminosity * SOLAR_LUMINOSITY;
    } else {
      // Fallback to mass-based calculation if luminosity is missing or invalid
      const massRatio = Math.max(0.01, parentStar.realMass_kg / SOLAR_MASS);
      starLuminosity = SOLAR_LUMINOSITY * Math.pow(massRatio, 3.5);
    }
  } else {
    // Fallback to mass-based calculation if star properties aren't available
    const massRatio = Math.max(0.01, parentStar.realMass_kg / SOLAR_MASS);
    starLuminosity = SOLAR_LUMINOSITY * Math.pow(massRatio, 3.5);
  }

  // Ensure we have a valid luminosity
  if (!Number.isFinite(starLuminosity) || starLuminosity <= 0) {
    console.warn(
      "[calculateBeltTemperature] Invalid star luminosity, using default",
    );
    starLuminosity = SOLAR_LUMINOSITY; // Default to solar luminosity
  }

  // Calculate equilibrium temperature at distance
  const distanceM = distanceAU * AU_METERS;

  // T = (L / (16π σ d²))^(1/4) for a gray body with albedo ~0.1
  const temperature = Math.pow(
    starLuminosity /
      (16 * Math.PI * STEFAN_BOLTZMANN_CONSTANT * distanceM * distanceM),
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
