import type { RingProperties, RockyType } from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";

/**
 * Generates properties for a planetary ring system.
 *
 * This function determines whether a planet should have rings based on a given
 * probability (`chance`). If rings are generated, it calculates their properties,
 * such as inner and outer radii, density, color, and composition, based on the
 * provided parameters. It can generate a system with multiple ring bands.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param chance The probability (0-1) that rings will be generated.
 * @param allowedTypes An array of `RockyType` values that are permissible for
 *   the ring's composition.
 * @param parentVisualRadius_m The visual radius of the parent body in meters,
 *   used for scaling the ring system appropriately.
 * @param outerRadiusFactor A multiplier that controls the maximum width of the
 *   ring system relative to its inner radius. Defaults to 1.5.
 * @returns An array containing one or more `RingProperties` objects if rings
 *   are generated, or `undefined` otherwise.
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
    // Generate 1 to 5 rings
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

    // All rings in a system share the same tilt.
    const systemTilt = (random() - 0.5) * 0.15;

    // Start the first ring at a distance from the planet.
    let currentInnerRadius_m = (1.3 + random() * 0.7) * parentVisualRadius_m;

    for (let i = 0; i < numRings; i++) {
      const innerRadius_m = currentInnerRadius_m;

      // Calculate a variable width for each ring.
      // Use outerRadiusFactor to influence the potential width.
      const ringWidth_m =
        (0.05 + random() * (outerRadiusFactor / 5)) * parentVisualRadius_m;
      const outerRadius_m = innerRadius_m + ringWidth_m;

      const ringColor = UTIL.getRandomItem(CONST.RING_COLORS[ringType], random);
      if (!ringColor) {
        console.warn(
          `[generateRings] Failed to get random ring color for type: ${ringType}.`,
        );
        continue;
      }

      const ring: RingProperties = {
        innerRadius: innerRadius_m,
        outerRadius: outerRadius_m,
        density: 0.3 + random() * 0.7,
        opacity: 0.2 + random() * 0.4,
        color: ringColor,
        tilt: systemTilt, // Use the shared tilt
        rotationRate: 0,
        texture: "placeholder_ring_texture",
        composition: ringComp,
        type: ringType,
      };
      rings.push(ring);

      // Define the gap between this ring and the next one.
      const gap_m = ringWidth_m * (0.1 + random() * 1.5);
      currentInnerRadius_m = outerRadius_m + gap_m;
    }

    if (rings.length > 0) {
      return rings;
    }
  }

  return undefined;
}
