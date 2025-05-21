import type { CelestialAppearanceBase } from "./base";

/** Appearance for Stars. */
export interface StarAppearance extends CelestialAppearanceBase {
  color: string; // The primary emissive color of the star (Hex)
  coronaColor?: string; // Color of the star's corona/glow (Hex)
  emissiveIntensity: number;
  // Potentially add: lens flare properties, surface texture (if applicable for some star types)
}
