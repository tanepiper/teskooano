import type { CelestialObject } from "@teskooano/data-types";
import type { StellarSystemConfiguration } from "../zones/types";
import { generateStar } from "../generators/stars/star";
import { CelestialZoneManager } from "../zones";
import { generateStellarSystem } from "./star-system-generator";

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

  // Determine stellar system configuration using zone manager
  const zoneManager = new CelestialZoneManager(random);
  const systemConfig = zoneManager.determineStellarConfiguration();

  // Generate the stellar system based on configuration
  const stars = generateStellarSystem(random, primaryStar, systemConfig);

  return { stars, systemConfig };
}
