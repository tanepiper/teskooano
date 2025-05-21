import type { CelestialAppearanceBase } from "./base";

/** Appearance for Comets. */
export interface CometAppearance extends CelestialAppearanceBase {
  nucleusColor?: string; // Hex, color of the comet's solid nucleus
  comaColor?: string; // Hex with alpha, color of the coma
  comaRadius?: number; // Scaled units
  tailColor?: string; // Hex with alpha, color of the tail(s)
  maxTailLength?: number; // Scaled units
}
