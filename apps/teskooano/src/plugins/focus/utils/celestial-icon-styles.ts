import { CelestialType } from "@teskooano/data-types";

/**
 * Shared icon styles for celestial objects.
 * Used by both CelestialRow and other components that need to display celestial object icons.
 */
export const iconStyles: Record<string, string> = {
  [CelestialType.STAR]: "background-color: yellow;",
  [CelestialType.PLANET]: "background-color: skyblue;",
  [CelestialType.GAS_GIANT]: "background-color: orange;",
  [CelestialType.DWARF_PLANET]: "background-color: lightblue;",
  [CelestialType.MOON]: "background-color: lightgrey;",
  [CelestialType.ASTEROID_FIELD]: "background-color: brown;",
  [CelestialType.OORT_CLOUD]: "background-color: darkgrey;",
  default: "background-color: white;",
};
