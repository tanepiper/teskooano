import type { CelestialAppearanceBase } from "./base";

/** Appearance for Oort Clouds (typically particle-based). */
export interface OortCloudAppearance extends CelestialAppearanceBase {
  particleColor: string; // Hex
  particleDensity: number;
  particleCount: number; // Suggestion for rendering systems
}
