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
      return stars;

    case StellarSystemType.BINARY_CLOSE:
      const closeSeparation = 0.1 + random() * 0.9; // 0.1 - 1.0 AU
      const closeConfig = { ...config, separationAU: [closeSeparation] };
      return generateCloseBinary(random, primaryStar, closeConfig);

    case StellarSystemType.BINARY_WIDE:
      const wideSeparation = 1.0 + random() * 99.0; // 1 - 100 AU
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
        stars.push(newStar);
      }
      return stars;

    default:
      return stars;
  }
}

/**
 * Generates a close binary system (< 1 AU separation)
 */
function generateCloseBinary(
  random: () => number,
  primaryStar: CelestialObject,
  config: StellarSystemConfiguration,
): CelestialObject[] {
  const companionStar = generateStar(random);
  const separation = config.separationAU![0];

  // Close binaries have more circular orbits and aligned inclinations
  const eccentricity = 0.01 + random() * 0.15; // Low eccentricity
  const inclination = (random() - 0.5) * 0.1; // Small inclination

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
  tertiaryStar.parentId = primary.id; // Orbits the primary (barycenter)

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
 * Generates a contact binary system (stars nearly touching)
 */
function generateContactBinary(
  random: () => number,
  primaryStar: CelestialObject,
  config: StellarSystemConfiguration,
): CelestialObject[] {
  const companionStar = generateStar(random);
  const separation = config.separationAU![0];

  // Contact binaries are nearly circular and coplanar
  const eccentricity = 0.001 + random() * 0.01; // Very low eccentricity
  const inclination = (random() - 0.5) * 0.02; // Very small inclination

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
 * Sets up proper binary orbital mechanics with barycentric motion
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

  // Random orbital angles
  const longitudeOfAscendingNode = random() * 2 * Math.PI;
  const argumentOfPeriapsis = random() * 2 * Math.PI;
  const meanAnomaly = random() * 2 * Math.PI;

  // Primary orbit (around barycenter)
  const primaryOrbit: OrbitalParameters = {
    realSemiMajorAxis_m: primarySMA,
    eccentricity: eccentricity,
    inclination: inclination,
    longitudeOfAscendingNode: longitudeOfAscendingNode,
    argumentOfPeriapsis: argumentOfPeriapsis,
    meanAnomaly: meanAnomaly,
    period_s: orbitalPeriod,
  };

  // Companion orbit (180° out of phase)
  const companionOrbit: OrbitalParameters = {
    realSemiMajorAxis_m: companionSMA,
    eccentricity: eccentricity,
    inclination: inclination,
    longitudeOfAscendingNode: longitudeOfAscendingNode,
    argumentOfPeriapsis: (argumentOfPeriapsis + Math.PI) % (2 * Math.PI),
    meanAnomaly: (meanAnomaly + Math.PI) % (2 * Math.PI),
    period_s: orbitalPeriod,
  };

  primaryStar.orbit = primaryOrbit;
  companionStar.orbit = companionOrbit;
  companionStar.parentId = primaryStar.id;

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

    primaryStar.physicsStateReal.position_m = primaryInitialPos;
    primaryStar.physicsStateReal.velocity_mps = primaryInitialVel;

    companionStar.physicsStateReal.position_m = companionInitialPos;
    companionStar.physicsStateReal.velocity_mps = companionInitialVel;
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
