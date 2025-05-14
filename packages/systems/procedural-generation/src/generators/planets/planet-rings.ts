import type { RingProperties, RockyType } from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";

/**
 * Generates ring properties for a planet based on chance, allowed types, and parent size.
 *
 * @param random The seeded random function.
 * @param chance Probability (0-1) of rings being generated.
 * @param allowedTypes Array of permissible ring material types.
 * @param parentVisualRadius_m The VISUAL radius of the parent body in METERS (used for scaling).
 * @param outerRadiusFactor Maximum outer radius multiplier relative to inner radius (default 1.5).
 * @returns An array containing the generated ring properties, or undefined if no rings are generated.
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
    const ringType = UTIL.getRandomItem(allowedTypes, random);
    if (!ringType) {
      console.warn(
        `[generateRings] Failed to get random ring type from allowed types:`,
        allowedTypes,
      );
      return undefined;
    }

    const innerRadiusMultiplier = 1.3 + random() * 0.7;
    const outerRadiusMultiplier =
      innerRadiusMultiplier + (0.1 + random() * outerRadiusFactor);

    const innerRadius_m = innerRadiusMultiplier * parentVisualRadius_m;
    const outerRadius_m = outerRadiusMultiplier * parentVisualRadius_m;

    const ringComp = CONST.RING_COMPOSITION[ringType];
    if (!ringComp) {
      console.warn(
        `[generateRings] No composition defined for ring type: ${ringType}`,
      );
      return undefined;
    }
    const ringColor = UTIL.getRandomItem(CONST.RING_COLORS[ringType], random);
    if (!ringColor) {
      console.warn(
        `[generateRings] Failed to get random ring color for type: ${ringType}.`,
      );
      return undefined;
    }

    return [
      {
        innerRadius: innerRadius_m,
        outerRadius: outerRadius_m,
        density: 0.3 + random() * 0.7,
        opacity: 0.2 + random() * 0.4,
        color: ringColor,
        tilt: (random() - 0.5) * 0.15,
        rotationRate: 0,
        texture: "placeholder_ring_texture",
        composition: ringComp,
        type: ringType,
      },
    ];
  }

  return undefined;
}
