import type { CelestialObject } from "@teskooano/data-types";
import type { StellarSystemConfiguration } from "../zones/types";
import { generateStar } from "../generators/stars/star";
import { calculateBinaryStability } from "./binary-stability";
import { setupBinaryOrbit } from "./binary-orbit-setup";
import {
  updateStarPropertiesForBinary,
  updateStarPropertiesForContact,
} from "./star-properties";

/**
 * Generates a close binary system with stability validation
 */
export function generateCloseBinary(
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
    separation = stabilityCheck.recommendedSeparationAU;
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
export function generateWideBinary(
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
 * Generates a contact binary system with stability validation
 */
export function generateContactBinary(
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
    separation = stabilityCheck.recommendedSeparationAU;
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
