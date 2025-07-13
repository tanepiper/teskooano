import { OSVector3 } from "@teskooano/core-math";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import type {
  CelestialObject,
  OrbitalParameters,
  PhysicsStateReal,
  StarProperties,
} from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import * as CONST from "../constants";
import { generateStar } from "../generators/stars/star";
import * as UTIL from "../utils";
import {
  CelestialZoneManager,
  type StellarSystemConfiguration,
  StellarSystemType,
} from "../zones";

// Note: StarSystemHierarchy interface removed - using direct CelestialObject arrays for simplicity

/**
 * Calculates binary stability constraints to prevent orbital decay
 */
interface BinaryStabilityResult {
  isStable: boolean;
  minSeparationAU: number;
  recommendedSeparationAU: number;
  warnings: string[];
}

/**
 * Validates and calculates binary stability constraints
 */
function calculateBinaryStability(
  star1: CelestialObject,
  star2: CelestialObject,
  proposedSeparationAU: number,
): BinaryStabilityResult {
  const warnings: string[] = [];

  // Convert stellar radii to AU for calculations
  const star1RadiusAU = star1.realRadius_m / CONST.AU_TO_METERS;
  const star2RadiusAU = star2.realRadius_m / CONST.AU_TO_METERS;

  // Minimum separation: must be outside both stellar photospheres with safety margin
  const minSeparationAU = (star1RadiusAU + star2RadiusAU) * 3.0; // 3x safety margin

  // Calculate Roche limit for stability (simplified calculation)
  const massRatio = star2.realMass_kg / star1.realMass_kg;
  const rocheLimit =
    (proposedSeparationAU * 0.49 * Math.pow(massRatio, 2 / 3)) /
    (0.6 * Math.pow(massRatio, 2 / 3) +
      Math.log(1 + Math.pow(massRatio, 1 / 3)));

  // Minimum stable separation (conservative estimate)
  const rocheStableSeparation = Math.max(minSeparationAU, rocheLimit * 2.5);

  // For n-body stability, close binaries should have circular orbits
  // Recommended separation for numerical stability
  const recommendedSeparationAU = Math.max(rocheStableSeparation, 0.5); // At least 0.5 AU for close binaries

  // Check various stability conditions
  let isStable = true;

  if (proposedSeparationAU < minSeparationAU) {
    isStable = false;
    warnings.push(
      `Stars too close: ${proposedSeparationAU.toFixed(3)} AU < minimum ${minSeparationAU.toFixed(3)} AU`,
    );
  }

  if (proposedSeparationAU < rocheStableSeparation) {
    isStable = false;
    warnings.push(
      `Within Roche limit: potential mass transfer and instability`,
    );
  }

  // Warning for very tight systems that might need smaller timesteps
  if (proposedSeparationAU < 1.0 && isStable) {
    warnings.push(
      `Close binary detected: may require smaller simulation timesteps for stability`,
    );
  }

  return {
    isStable,
    minSeparationAU,
    recommendedSeparationAU,
    warnings,
  };
}

/**
 * Suggests physics engine configuration for binary system stability
 */
function suggestBinaryPhysicsConfig(
  separationAU: number,
  totalMass_kg: number,
  orbitalPeriod_s: number,
): {
  recommendedTimestep_s: number;
  recommendedAlgorithm: string;
  notes: string[];
} {
  const notes: string[] = [];
  let recommendedTimestep_s: number;
  let recommendedAlgorithm: string;

  // Calculate dynamic timestep based on orbital period
  // Rule of thumb: timestep should be 1/100th of orbital period for stability
  const baseDynamicTimestep = orbitalPeriod_s / 100;

  if (separationAU < 0.5) {
    // Very close binary - needs small timestep
    recommendedTimestep_s = Math.min(baseDynamicTimestep, 1800); // Max 30 minutes
    recommendedAlgorithm = "verlet"; // Symplectic integrator for stability
    notes.push(
      `Very close binary (${separationAU.toFixed(3)} AU): Use small timestep and symplectic integrator`,
    );
  } else if (separationAU < 2.0) {
    // Close binary - moderate timestep
    recommendedTimestep_s = Math.min(baseDynamicTimestep, 3600); // Max 1 hour
    recommendedAlgorithm = "verlet";
    notes.push(
      `Close binary (${separationAU.toFixed(3)} AU): Use moderate timestep with stable integrator`,
    );
  } else if (separationAU < 10.0) {
    // Wide binary - normal timestep
    recommendedTimestep_s = Math.min(baseDynamicTimestep, 7200); // Max 2 hours
    recommendedAlgorithm = "barnes-hut";
    notes.push(
      `Wide binary (${separationAU.toFixed(3)} AU): Standard configuration acceptable`,
    );
  } else {
    // Very wide binary - standard timestep
    recommendedTimestep_s = Math.min(baseDynamicTimestep, 14400); // Max 4 hours
    recommendedAlgorithm = "barnes-hut";
    notes.push(
      `Very wide binary (${separationAU.toFixed(3)} AU): Standard physics configuration`,
    );
  }

  // Additional notes for massive systems
  if (totalMass_kg > 2 * CONST.SOLAR_MASS_KG) {
    notes.push(
      `Massive binary system: Consider relativistic effects for very close orbits`,
    );
  }

  return {
    recommendedTimestep_s,
    recommendedAlgorithm,
    notes,
  };
}

/**
 * Generates sophisticated stellar systems with realistic orbital mechanics and hierarchical structures.
 * Supports single stars, binary systems, hierarchical triples, and contact binaries.
 *
 * @param random The seeded pseudo-random number generator function.
 * @returns An array of `CelestialObject` representing the generated stars with proper physics.
 */
export function generateStars(random: () => number): {
  stars: CelestialObject[];
  systemConfig: StellarSystemConfiguration;
} {
  // Generate the primary star first to determine system characteristics
  const primaryStar = generateStar(random);
  const primaryMass_solar = primaryStar.realMass_kg / CONST.SOLAR_MASS_KG;

  // Determine stellar system configuration using zone manager
  const zoneManager = new CelestialZoneManager(random);
  const systemConfig = zoneManager.determineStellarConfiguration();

  // Generate the stellar system based on configuration
  const stars = generateStellarSystem(random, primaryStar, systemConfig);

  return { stars, systemConfig };
}

/**
 * Generates a complete stellar system based on the configuration
 */
function generateStellarSystem(
  random: () => number,
  primaryStar: CelestialObject,
  config: StellarSystemConfiguration,
): CelestialObject[] {
  const stars: CelestialObject[] = [primaryStar];

  switch (config.type) {
    case StellarSystemType.SINGLE_STAR:
      // Single star has no parent (it's the center of the system)
      primaryStar.parentId = undefined;
      return stars;

    case StellarSystemType.BINARY_CLOSE:
      const closeSeparation = 0.5 + random() * 1.5; // 0.5 - 2.0 AU (more conservative)
      const closeConfig = { ...config, separationAU: [closeSeparation] };
      return generateCloseBinary(random, primaryStar, closeConfig);

    case StellarSystemType.BINARY_WIDE:
      const wideSeparation = 2.0 + random() * 98.0; // 2 - 100 AU (gap to avoid unstable range)
      const wideConfig = { ...config, separationAU: [wideSeparation] };
      return generateWideBinary(random, primaryStar, wideConfig);

    case StellarSystemType.TRIPLE_HIERARCHICAL:
      const binarySeparation = 0.5 + random() * 9.5; // Close binary
      const tertiaryDistance = 100 + random() * 400; // 100 - 500 AU
      const tripleConfig = {
        ...config,
        separationAU: [binarySeparation, tertiaryDistance],
      };
      return generateHierarchicalTriple(random, primaryStar, tripleConfig);

    case StellarSystemType.MULTIPLE_COMPLEX:
      // Generate multiple stars in complex arrangement
      const starCount = config.stars;
      for (let i = 1; i < starCount; i++) {
        const newStar = generateStar(random);
        const distance = (10 + random() * 90) * (i + 1); // Increasing distances
        newStar.physicsStateReal.position_m = new OSVector3(
          distance * CONST.AU_TO_METERS * Math.cos((i * Math.PI) / 3),
          distance * CONST.AU_TO_METERS * Math.sin((i * Math.PI) / 3),
          0,
        );
        newStar.parentId = primaryStar.id; // All stars orbit the primary
        stars.push(newStar);
      }
      return stars;

    default:
      return stars;
  }
}

/**
 * Generates a close binary system with stability validation
 */
function generateCloseBinary(
  random: () => number,
  primaryStar: CelestialObject,
  config: StellarSystemConfiguration,
): CelestialObject[] {
  const companionStar = generateStar(random);
  let separation = config.separationAU![0];

  // Validate binary stability and adjust separation if needed
  const stabilityCheck = calculateBinaryStability(
    primaryStar,
    companionStar,
    separation,
  );

  if (!stabilityCheck.isStable) {
    console.warn(
      `[generateCloseBinary] Unstable binary detected. Adjusting separation from ${separation.toFixed(3)} AU to ${stabilityCheck.recommendedSeparationAU.toFixed(3)} AU`,
    );
    stabilityCheck.warnings.forEach((warning) =>
      console.warn(`[generateCloseBinary] ${warning}`),
    );
    separation = stabilityCheck.recommendedSeparationAU;
  } else if (stabilityCheck.warnings.length > 0) {
    // Log warnings for stable but potentially problematic systems
    console.info(
      `[generateCloseBinary] Binary stability notes for ${primaryStar.id}-${companionStar.id}:`,
    );
    stabilityCheck.warnings.forEach((warning) =>
      console.info(`[generateCloseBinary] ${warning}`),
    );
  }

  // Close binaries have more circular orbits and aligned inclinations for stability
  const eccentricity = 0.01 + random() * 0.05; // Very low eccentricity for stability (0.01-0.06)
  const inclination = (random() - 0.5) * 0.05; // Very small inclination for stability (±1.4°)

  const [primary, companion] = setupBinaryOrbit(
    primaryStar,
    companionStar,
    separation,
    eccentricity,
    inclination,
    random,
  );

  // Update stellar properties for binary system
  updateStarPropertiesForBinary(primary, companion);

  return [primary, companion];
}

/**
 * Generates a wide binary system (1-100 AU separation)
 */
function generateWideBinary(
  random: () => number,
  primaryStar: CelestialObject,
  config: StellarSystemConfiguration,
): CelestialObject[] {
  const companionStar = generateStar(random);
  const separation = config.separationAU![0];

  // Wide binaries can have more eccentric and inclined orbits
  const eccentricity = 0.05 + random() * 0.4; // Higher eccentricity
  const inclination = (random() - 0.5) * 0.3; // Larger inclination range

  const [primary, companion] = setupBinaryOrbit(
    primaryStar,
    companionStar,
    separation,
    eccentricity,
    inclination,
    random,
  );

  updateStarPropertiesForBinary(primary, companion);

  return [primary, companion];
}

/**
 * Generates a hierarchical triple system (close binary + distant third star)
 * This creates interesting dynamics like the Alpha Centauri system
 */
function generateHierarchicalTriple(
  random: () => number,
  primaryStar: CelestialObject,
  config: StellarSystemConfiguration,
): CelestialObject[] {
  // First create the close binary pair
  const secondaryStar = generateStar(random);
  const binarySeparation = config.separationAU![0];
  const tertiaryDistance = config.separationAU![1];

  // Set up the close binary
  const binaryEccentricity = 0.01 + random() * 0.1;
  const binaryInclination = (random() - 0.5) * 0.05;

  const [primary, secondary] = setupBinaryOrbit(
    primaryStar,
    secondaryStar,
    binarySeparation,
    binaryEccentricity,
    binaryInclination,
    random,
  );

  // Generate the distant tertiary star
  const tertiaryStar = generateStar(random);

  // Calculate tertiary orbit around the binary pair's barycenter
  const tertiaryEccentricity = 0.1 + random() * 0.5; // Can be quite eccentric
  const tertiaryInclination = (random() - 0.5) * 0.8; // Can have significant inclination

  const binaryTotalMass = primary.realMass_kg + secondary.realMass_kg;
  const tertiaryPeriod = UTIL.calculateOrbitalPeriod_s(
    binaryTotalMass,
    tertiaryDistance * CONST.AU_TO_METERS,
    tertiaryStar.realMass_kg,
  );

  // Set up tertiary orbit
  const tertiaryOrbit: OrbitalParameters = {
    realSemiMajorAxis_m: tertiaryDistance * CONST.AU_TO_METERS,
    eccentricity: tertiaryEccentricity,
    inclination: tertiaryInclination,
    longitudeOfAscendingNode: random() * 2 * Math.PI,
    argumentOfPeriapsis: random() * 2 * Math.PI,
    meanAnomaly: random() * 2 * Math.PI,
    period_s: tertiaryPeriod,
  };

  tertiaryStar.orbit = tertiaryOrbit;
  tertiaryStar.parentId = primary.id; // Orbits the primary star

  try {
    // Calculate initial position for tertiary around the barycenter
    const barycentricState: PhysicsStateReal = {
      id: "barycenter",
      mass_kg: binaryTotalMass,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    };

    const tertiaryInitialPos = calculateOrbitalPosition(
      barycentricState,
      tertiaryOrbit,
      0,
    );
    const tertiaryInitialVel = calculateOrbitalVelocity(
      barycentricState,
      tertiaryOrbit,
      0,
    );

    tertiaryStar.physicsStateReal.position_m = tertiaryInitialPos;
    tertiaryStar.physicsStateReal.velocity_mps = tertiaryInitialVel;
  } catch (error) {
    console.error(
      `[generateHierarchicalTriple] Error calculating tertiary orbit:`,
      error,
    );
  }

  // Update stellar properties
  updateStarPropertiesForBinary(primary, secondary);
  updateStarPropertiesForMultiple(tertiaryStar, [primary, secondary]);

  return [primary, secondary, tertiaryStar];
}

/**
 * Generates a contact binary system with stability validation
 */
function generateContactBinary(
  random: () => number,
  primaryStar: CelestialObject,
  config: StellarSystemConfiguration,
): CelestialObject[] {
  const companionStar = generateStar(random);
  let separation = config.separationAU![0];

  // Validate binary stability and adjust separation if needed
  const stabilityCheck = calculateBinaryStability(
    primaryStar,
    companionStar,
    separation,
  );

  if (!stabilityCheck.isStable) {
    console.warn(
      `[generateContactBinary] Unstable contact binary detected. Adjusting separation from ${separation.toFixed(3)} AU to ${stabilityCheck.recommendedSeparationAU.toFixed(3)} AU`,
    );
    stabilityCheck.warnings.forEach((warning) =>
      console.warn(`[generateContactBinary] ${warning}`),
    );
    separation = stabilityCheck.recommendedSeparationAU;
  } else if (stabilityCheck.warnings.length > 0) {
    // Log warnings for stable but potentially problematic systems
    console.info(
      `[generateContactBinary] Contact binary stability notes for ${primaryStar.id}-${companionStar.id}:`,
    );
    stabilityCheck.warnings.forEach((warning) =>
      console.info(`[generateContactBinary] ${warning}`),
    );
  }

  // Contact binaries are nearly circular and coplanar for maximum stability
  const eccentricity = 0.001 + random() * 0.005; // Extremely low eccentricity (0.001-0.006)
  const inclination = (random() - 0.5) * 0.01; // Extremely small inclination (±0.3°)

  const [primary, companion] = setupBinaryOrbit(
    primaryStar,
    companionStar,
    separation,
    eccentricity,
    inclination,
    random,
  );

  // Contact binaries affect each other's properties
  // They typically have enhanced activity and mass transfer
  updateStarPropertiesForContact(random, primary, companion);

  return [primary, companion];
}

/**
 * Sets up proper binary orbital mechanics with barycentric motion and stability enhancements
 */
function setupBinaryOrbit(
  primaryStar: CelestialObject,
  companionStar: CelestialObject,
  separationAU: number,
  eccentricity: number,
  inclination: number,
  random: () => number,
): [CelestialObject, CelestialObject] {
  const M1 = primaryStar.realMass_kg;
  const M2 = companionStar.realMass_kg;
  const totalMass = M1 + M2;

  const separationMeters = separationAU * CONST.AU_TO_METERS;

  // Calculate semi-major axes for both stars around barycenter
  const primarySMA = (M2 / totalMass) * separationMeters;
  const companionSMA = (M1 / totalMass) * separationMeters;

  const orbitalPeriod = UTIL.calculateOrbitalPeriod_s(
    totalMass,
    separationMeters,
    0,
  );

  // Improved orbital angles for stability
  const longitudeOfAscendingNode = random() * 2 * Math.PI;
  const argumentOfPeriapsis = random() * 2 * Math.PI;

  // For better stability, avoid starting both stars at periapsis/apoapsis
  // Use a random phase but ensure they're 180° apart
  const baseMeanAnomaly = random() * 2 * Math.PI;

  // Primary orbit (around barycenter)
  const primaryOrbit: OrbitalParameters = {
    realSemiMajorAxis_m: primarySMA,
    eccentricity: eccentricity,
    inclination: inclination,
    longitudeOfAscendingNode: longitudeOfAscendingNode,
    argumentOfPeriapsis: argumentOfPeriapsis,
    meanAnomaly: baseMeanAnomaly,
    period_s: orbitalPeriod,
  };

  // Companion orbit (180° out of phase for stability)
  const companionOrbit: OrbitalParameters = {
    realSemiMajorAxis_m: companionSMA,
    eccentricity: eccentricity,
    inclination: inclination,
    longitudeOfAscendingNode: longitudeOfAscendingNode,
    argumentOfPeriapsis: (argumentOfPeriapsis + Math.PI) % (2 * Math.PI),
    meanAnomaly: (baseMeanAnomaly + Math.PI) % (2 * Math.PI),
    period_s: orbitalPeriod,
  };

  primaryStar.orbit = primaryOrbit;
  companionStar.orbit = companionOrbit;
  
  // In binary systems, both stars orbit each other around their barycenter
  // For the physics system, we need to choose one star as the "parent" for orbital calculations
  // The primary star (more massive) becomes the reference point
  primaryStar.parentId = undefined; // Primary star has no parent (fixed reference)
  companionStar.parentId = primaryStar.id; // Companion orbits the primary

  try {
    // Calculate initial positions
    const barycentricState: PhysicsStateReal = {
      id: "barycenter",
      mass_kg: totalMass,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    };

    const primaryInitialPos = calculateOrbitalPosition(
      barycentricState,
      primaryOrbit,
      0,
    );
    const primaryInitialVel = calculateOrbitalVelocity(
      barycentricState,
      primaryOrbit,
      0,
    );

    const companionInitialPos = calculateOrbitalPosition(
      barycentricState,
      companionOrbit,
      0,
    );
    const companionInitialVel = calculateOrbitalVelocity(
      barycentricState,
      companionOrbit,
      0,
    );

    // Validate initial conditions for stability
    const actualSeparation = primaryInitialPos.distanceTo(companionInitialPos);
    const expectedSeparation = separationMeters;
    const separationError =
      Math.abs(actualSeparation - expectedSeparation) / expectedSeparation;

    if (separationError > 0.05) {
      // 5% tolerance
      console.warn(
        `[setupBinaryOrbit] Large separation error: expected ${(expectedSeparation / CONST.AU_TO_METERS).toFixed(3)} AU, got ${(actualSeparation / CONST.AU_TO_METERS).toFixed(3)} AU`,
      );
    }

    // Validate velocity magnitudes for circular/low-eccentricity orbits
    const primaryVelMag = primaryInitialVel.length();
    const companionVelMag = companionInitialVel.length();
    const G = 6.674e-11; // Gravitational constant in m^3 kg^-1 s^-2
    const expectedPrimaryVel = Math.sqrt((G * totalMass) / primarySMA);
    const expectedCompanionVel = Math.sqrt((G * totalMass) / companionSMA);

    if (
      Math.abs(primaryVelMag - expectedPrimaryVel) / expectedPrimaryVel >
      0.1
    ) {
      console.warn(
        `[setupBinaryOrbit] Primary velocity discrepancy: expected ${(expectedPrimaryVel / 1000).toFixed(1)} km/s, got ${(primaryVelMag / 1000).toFixed(1)} km/s`,
      );
    }

    primaryStar.physicsStateReal.position_m = primaryInitialPos;
    primaryStar.physicsStateReal.velocity_mps = primaryInitialVel;

    companionStar.physicsStateReal.position_m = companionInitialPos;
    companionStar.physicsStateReal.velocity_mps = companionInitialVel;

    // Log successful binary setup for debugging
    console.info(
      `[setupBinaryOrbit] Stable binary created: ${primaryStar.id}-${companionStar.id}, separation: ${separationAU.toFixed(3)} AU, period: ${(orbitalPeriod / 86400).toFixed(1)} days`,
    );

    // Provide physics engine configuration suggestions
    const physicsConfig = suggestBinaryPhysicsConfig(
      separationAU,
      totalMass,
      orbitalPeriod,
    );
    console.info(
      `[setupBinaryOrbit] Physics recommendations: timestep ≤ ${(physicsConfig.recommendedTimestep_s / 3600).toFixed(1)}h, algorithm: ${physicsConfig.recommendedAlgorithm}`,
    );
    physicsConfig.notes.forEach((note) =>
      console.info(`[setupBinaryOrbit] ${note}`),
    );
  } catch (error) {
    console.error(`[setupBinaryOrbit] Error calculating binary orbits:`, error);
  }

  return [primaryStar, companionStar];
}

/**
 * Updates star properties for binary systems
 */
function updateStarPropertiesForBinary(
  primary: CelestialObject,
  companion: CelestialObject,
): void {
  const primaryProps = primary.properties as StarProperties;
  const companionProps = companion.properties as StarProperties;

  // Set primary/secondary status
  primaryProps.isMainStar = true;
  companionProps.isMainStar = false;

  // Link the stars
  primaryProps.partnerStars = [companion.id];
  companionProps.partnerStars = [primary.id];
}

/**
 * Updates star properties for multiple star systems
 */
function updateStarPropertiesForMultiple(
  star: CelestialObject,
  companions: CelestialObject[],
): void {
  const starProps = star.properties as StarProperties;
  starProps.isMainStar = false; // Tertiary is never the main star
  starProps.partnerStars = companions.map((c) => c.id);

  // Update companions to include this star
  companions.forEach((companion) => {
    const companionProps = companion.properties as StarProperties;
    if (!companionProps.partnerStars) {
      companionProps.partnerStars = [];
    }
    companionProps.partnerStars.push(star.id);
  });
}

/**
 * Updates star properties for contact binary systems
 */
function updateStarPropertiesForContact(
  random: () => number,
  primary: CelestialObject,
  companion: CelestialObject,
): void {
  updateStarPropertiesForBinary(primary, companion);

  // Contact binaries can have enhanced activity and mass transfer effects
  // This could affect temperature, luminosity, and stellar winds
  const primaryProps = primary.properties as StarProperties;
  const companionProps = companion.properties as StarProperties;

  // Slightly enhance luminosity due to interaction effects
  primaryProps.luminosity *= 1.0 + random() * 0.2;
  companionProps.luminosity *= 1.0 + random() * 0.2;
}
