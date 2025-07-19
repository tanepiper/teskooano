import type { CelestialObject } from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import { generateCelestialName } from "../names/celestial-name";
import {
  determineMoonFormation,
  calculateHillRadius,
  calculateRocheLimit,
} from "./moon-formation";
import {
  generateRealisticMoonMass,
  generateMoonDensity,
  calculateMoonRadius,
  generateMoonRotation,
  generateMoonAxialTilt,
} from "./moon-physics";
import {
  calculateNextMoonDistance,
  calculateMoonOrbitalPeriod,
  generateMoonOrbit,
} from "./moon-orbit";
import {
  determineMoonType,
  createMoonPlanetProperties,
} from "./moon-properties";

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
  const moonRadius = calculateMoonRadius(moonMass, moonDensity);

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

  const moonOrbitalPeriod_s = calculateMoonOrbitalPeriod(
    parentPlanetMass,
    moonSemiMajorAxis_m,
    moonMass,
  );

  // Generate orbital parameters based on formation mechanism
  // Note: The moon will inherit the parent planet's orbital plane characteristics
  // (inclination and longitude of ascending node) to maintain realistic coplanar orbits
  const orbitalParams = generateMoonOrbit(
    random,
    moonSemiMajorAxis_m,
    moonOrbitalPeriod_s,
    formationMechanism,
    parentPlanetData.orbit,
  );

  // Validate orbital parameters
  if (parentPlanetMass <= 0 || !Number.isFinite(parentPlanetMass)) {
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }

  if (
    orbitalParams.realSemiMajorAxis_m <= 0 ||
    !Number.isFinite(orbitalParams.realSemiMajorAxis_m)
  ) {
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
    return {
      moonData: null,
      nextLastMoonDistance_radii: lastMoonDistance_radii,
    };
  }

  // Check Roche limit - moon must be outside the fluid Roche limit
  const parentPlanetDensity =
    parentPlanetMass / ((4 / 3) * Math.PI * Math.pow(parentPlanetRadius, 3));
  const rocheLimit = calculateRocheLimit(
    parentPlanetRadius,
    parentPlanetDensity,
    moonDensity,
  );
  const moonPeriapsis =
    orbitalParams.realSemiMajorAxis_m * (1 - orbitalParams.eccentricity);

  if (moonPeriapsis <= rocheLimit * 1.2) {
    // 20% safety margin
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

  const moonSpecificProperties = createMoonPlanetProperties(
    random,
    moonPlanetType,
    formationMechanism,
    parentPlanetData,
  );

  const moonSeed = `${systemSeed}-${moonId}`;

  // Generate realistic rotation - many moons are tidally locked
  const rotationPeriod_s = generateMoonRotation(
    random,
    moonOrbitalPeriod_s,
    moonSemiMajorAxis_m,
    parentPlanetRadius,
  );

  // Generate axial tilt (generally small for moons)
  const tiltAxis = generateMoonAxialTilt(random);

  const moonData: CelestialObject = {
    id: moonId,
    name: moonName,
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentPlanetData.id,
    realMass_kg: moonMass,
    realRadius_m: moonRadius,
    temperature: parentPlanetData.temperature, // Inherit from parent for simplicity
    orbit: {
      ...orbitalParams,
      siderealRotationPeriod_s: rotationPeriod_s,
      axialTilt: tiltAxis,
    },
    properties: moonSpecificProperties,
    seed: moonSeed,
  };

  return { moonData, nextLastMoonDistance_radii: moonDistance_radii };
}
