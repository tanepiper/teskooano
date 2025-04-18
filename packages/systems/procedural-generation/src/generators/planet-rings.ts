import type { RingProperties, RockyType } from "@teskooano/data-types";
import * as CONST from "../constants";
import * as UTIL from "../utils";

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
  outerRadiusFactor: number = 1.5, // Controls max spread from inner radius
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

    // Calculate radii multipliers relative to the PARENT'S VISUAL RADIUS
    const innerRadiusMultiplier = 1.3 + random() * 0.7; // Rings start further out (1.3x to 2.0x parent radius)
    const outerRadiusMultiplier =
      innerRadiusMultiplier + (0.1 + random() * outerRadiusFactor);

    // Calculate actual radii in METERS based on the visual radius
    const innerRadius_m = innerRadiusMultiplier * parentVisualRadius_m;
    const outerRadius_m = outerRadiusMultiplier * parentVisualRadius_m;

    const ringComp = CONST.RING_COMPOSITION[ringType];
    if (!ringComp) {
      console.warn(
        `[generateRings] No composition defined for ring type: ${ringType}`,
      );
      return undefined; // Cannot create ring without composition
    }
    const ringColor = UTIL.getRandomItem(CONST.RING_COLORS[ringType], random);
    if (!ringColor) {
      console.warn(
        `[generateRings] Failed to get random ring color for type: ${ringType}.`,
      );
      return undefined;
    }

    // Generate properties for a single ring band for now
    return [
      {
        innerRadius: innerRadius_m, // Assign real meters
        outerRadius: outerRadius_m, // Assign real meters
        density: 0.3 + random() * 0.7,
        opacity: 0.2 + random() * 0.4,
        color: ringColor,
        tilt: (random() - 0.5) * 0.15, // Slight tilt relative to parent equator
        rotationRate: 0, // Assuming static for now, could be dynamic
        texture: "placeholder_ring_texture", // Placeholder
        composition: ringComp,
        type: ringType,
      },
    ];
  }

  return undefined;
}
