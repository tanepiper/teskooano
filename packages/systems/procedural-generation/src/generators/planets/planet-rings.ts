import type { RingProperties, RockyType } from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";

/**
 * Generates properties for a planetary ring system.
 *
 * This function determines whether a planet should have rings based on a given
 * probability (`chance`). If rings are generated, it calculates their properties,
 * such as inner and outer radii, density, color, and composition, based on the
 * provided parameters.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param chance The probability (0-1) that rings will be generated.
 * @param allowedTypes An array of `RockyType` values that are permissible for
 *   the ring's composition.
 * @param parentVisualRadius_m The visual radius of the parent body in meters,
 *   used for scaling the ring system appropriately.
 * @param outerRadiusFactor A multiplier that controls the maximum width of the
 *   ring system relative to its inner radius. Defaults to 1.5.
 * @returns An array containing a single `RingProperties` object if rings are
 *   generated, or `undefined` otherwise.
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
