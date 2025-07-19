import type { CelestialObject } from "@teskooano/data-types";
import type { StellarSystemConfiguration } from "../zones/types";
import { StellarSystemType } from "../zones/types";
import { generateStar } from "../generators/stars/star";
import { generateCloseBinary } from "./binary-systems";
import { generateWideBinary } from "./binary-systems";
import { generateHierarchicalTriple } from "./hierarchical-triple";

/**
 * Generates a complete stellar system based on the configuration
 */
export function generateStellarSystem(
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
        newStar.parentId = primaryStar.id; // All stars orbit the primary
        stars.push(newStar);
      }
      return stars;

    default:
      return stars;
  }
}
