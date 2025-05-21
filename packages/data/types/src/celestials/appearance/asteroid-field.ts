import type { CelestialAppearanceBase } from "./base";

/** Appearance for Asteroid Fields. */
export interface AsteroidFieldAppearance extends CelestialAppearanceBase {
  baseColor: string; // Hex, average color of asteroids
  particleSize?: number; // Average size for rendered particles/impostors
  density?: number; // Visual density for particle systems
}
