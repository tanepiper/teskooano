import { OSVector3 } from "@teskooano/core-math";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
  createOrbitalElements,
} from "@teskooano/core-physics";
import type { CelestialObject, PhysicsStateReal } from "@teskooano/data-types";
import type { StellarSystemConfiguration } from "../zones/types";
import { generateStar } from "../generators/stars/star";
import { setupBinaryOrbit } from "./binary-orbit-setup";
import {
  updateStarPropertiesForBinary,
  updateStarPropertiesForMultiple,
} from "./star-properties";
import * as CONST from "../constants";
import * as UTIL from "../utils";

/**
 * Generates a hierarchical triple system (close binary + distant third star)
 * This creates interesting dynamics like the Alpha Centauri system
 */
export function generateHierarchicalTriple(
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
  const tertiaryOrbit = createOrbitalElements({
    semiMajorAxisAU: tertiaryDistance,
    eccentricity: tertiaryEccentricity,
    inclinationDeg: tertiaryInclination * (180 / Math.PI),
    longitudeOfAscendingNodeDeg: random() * 360,
    argumentOfPeriapsisDeg: random() * 360,
    meanAnomalyDeg: random() * 360,
    period_s: tertiaryPeriod,
    siderealRotationPeriod_s: tertiaryPeriod,
    axialTiltDeg: random() * 30,
  });

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

    // Note: physicsStateReal is not part of the current CelestialObject interface
    // Position and velocity will be calculated by the physics system
  } catch (error) {
    // Silent error handling for tertiary orbit calculation
  }

  // Update stellar properties
  updateStarPropertiesForBinary(primary, secondary);
  updateStarPropertiesForMultiple(tertiaryStar, [primary, secondary]);

  return [primary, secondary, tertiaryStar];
}
