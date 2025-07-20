import type { CelestialObject } from "@teskooano/data-types";
import type { StellarSystemConfiguration } from "../zones/types";
import { generateStar } from "../generators/stars/star";
import { CelestialZoneManager } from "../zones";
import { generateStellarSystem } from "./star-system-generator";
import { SYSTEM_DESCRIPTIONS } from "../generators/names/descriptions";

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

  // Set isMainStar property based on the hierarchy established in generateStellarSystem
  stars.forEach((star, index) => {
    const starProps = star.properties as any;
    if (starProps) {
      starProps.isMainStar = index === 0; // First star (most massive) is main star
    }
  });

  // Set the system name based on the main star (first star after sorting by mass)
  const mainStar = stars[0];
  systemConfig.systemName = mainStar.name;

  // Randomly select a funny description for the system
  const descriptionIndex = Math.floor(random() * SYSTEM_DESCRIPTIONS.length);
  systemConfig.description = SYSTEM_DESCRIPTIONS[descriptionIndex];

  return { stars, systemConfig };
}
