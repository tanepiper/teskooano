import type { CelestiaClassType, RingProperties } from "@teskooano/data-types";
import { RockyType } from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";

/**
 * Calculates the Roche limit for a given planet
 * @param planetRadius_m Planet radius in meters
 * @param planetDensity_kgm3 Planet density in kg/m³
 * @param particleDensity_kgm3 Ring particle density in kg/m³
 * @returns Roche limit in meters
 */
function calculateRocheLimit(
  planetRadius_m: number,
  planetDensity_kgm3: number = 5500, // Earth-like density default
  particleDensity_kgm3: number = 2000, // Ice/rock mixture default
): number {
  // Roche limit = 2.44 * R_planet * (ρ_planet / ρ_particle)^(1/3)
  const densityRatio = planetDensity_kgm3 / particleDensity_kgm3;
  return 2.44 * planetRadius_m * Math.pow(densityRatio, 1 / 3);
}

/**
 * Generates enhanced ring properties with realistic characteristics
 */
function generateEnhancedRingProperties(
  random: () => number,
  ringType: RockyType,
  innerRadius_m: number,
  outerRadius_m: number,
  stellarDistanceAU: number,
  systemTilt: number,
): RingProperties {
  const ringComp = CONST.RING_COMPOSITION[ringType];
  if (!ringComp) {
    throw new Error(`No composition defined for ring type: ${ringType}`);
  }

  // Generate realistic ring properties
  const opacity = 0.3 + random() * 0.7; // 0.3 to 1.0
  const density = 0.3 + random() * 0.7; // 0.3 to 1.0
  const color = UTIL.getRandomItem(
    CONST.RING_COLORS[ringType] || ["#CCCCCC"],
    random,
  );
  const texture = getEnhancedRingTexture(ringType);
  const rotationRate =
    0.001 / Math.pow((innerRadius_m + outerRadius_m) / 2e8, 1.5);

  return {
    innerRadius: innerRadius_m,
    outerRadius: outerRadius_m,
    density,
    opacity,
    color,
    tilt: systemTilt,
    rotationRate,
    texture,
    composition: ringComp,
    type: ringType,
  };
}

/**
 * Gets enhanced ring texture based on ring type
 */
function getEnhancedRingTexture(ringType: RockyType): string {
  const textures: Record<RockyType, string> = {
    [RockyType.ICE]: "ice_rings",
    [RockyType.ICE_DUST]: "ice_dust_rings",
    [RockyType.LIGHT_ROCK]: "light_rock_rings",
    [RockyType.DARK_ROCK]: "dark_rock_rings",
    [RockyType.METALLIC]: "metallic_rings",
    [RockyType.DUST]: "dust_rings",
  };

  return textures[ringType] || "default_rings";
}

/**
 * Generates ring systems for planets based on probability and allowed types.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param chance The probability of ring formation (0-1).
 * @param allowedTypes Array of allowed ring composition types.
 * @param parentVisualRadius_m The visual radius of the parent planet in meters.
 * @param outerRadiusFactor Factor for determining outer ring radius (default: 1.5).
 * @returns Array of RingProperties or undefined if no rings are generated.
 */
export function generateRings(
  random: () => number,
  chance: number,
  allowedTypes: RockyType[],
  parentVisualRadius_m: number,
  outerRadiusFactor: number = 1.5,
): RingProperties[] | undefined {
  const roll = random();

  if (roll < chance && allowedTypes.length > 0) {
    const rings: RingProperties[] = [];

    // Simple ring count (1-5 rings)
    const numRings = Math.floor(random() * 5) + 1;

    // Determine the type for the whole ring system once.
    const ringType = UTIL.getRandomItem(allowedTypes, random);
    if (!ringType) {
      console.warn(
        `[generateRings] Failed to get random ring type from allowed types:`,
        allowedTypes,
      );
      return undefined;
    }

    const ringComp = CONST.RING_COMPOSITION[ringType];
    if (!ringComp) {
      console.warn(
        `[generateRings] No composition defined for ring type: ${ringType}`,
      );
      return undefined;
    }

    // Calculate Roche limit for ring placement
    const rocheLimit = calculateRocheLimit(parentVisualRadius_m);

    // All rings in a system share the same tilt
    const systemTilt = (random() - 0.5) * 0.15;

    // Start the first ring outside the Roche limit with safety margin
    let currentInnerRadius_m = Math.max(
      (1.3 + random() * 0.7) * parentVisualRadius_m,
      rocheLimit * 1.1, // 10% safety margin outside Roche limit
    );

    for (let i = 0; i < numRings; i++) {
      const innerRadius_m = currentInnerRadius_m;

      // Calculate a variable width for each ring
      const baseWidth =
        (0.05 + random() * (outerRadiusFactor / 5)) * parentVisualRadius_m;

      // Ring width decreases with distance
      const distanceFactor = Math.max(0.5, 1 - i * 0.1);
      const ringWidth_m = baseWidth * distanceFactor;

      const outerRadius_m = innerRadius_m + ringWidth_m;

      // Generate ring properties
      const ring = generateEnhancedRingProperties(
        random,
        ringType,
        innerRadius_m,
        outerRadius_m,
        5.0, // Default stellar distance
        systemTilt,
      );

      rings.push(ring);

      // Define the gap between this ring and the next one
      const minGap = ringWidth_m * 0.1;
      const maxGap = ringWidth_m * 1.5;
      const gap = minGap + random() * (maxGap - minGap);

      currentInnerRadius_m = outerRadius_m + gap;
    }

    return rings;
  }

  return undefined;
}
