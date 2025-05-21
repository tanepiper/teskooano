import type { CelestialAppearanceBase } from "./base";
import type {
  AtmosphereEffectAppearance,
  CloudLayerAppearance,
} from "./effects";
import type { SurfaceAppearanceUnion } from "./surface";

/** Appearance for standard solid planets, moons, dwarf planets. */
export interface StandardPlanetAppearance extends CelestialAppearanceBase {
  shapeModel?: "sphere" | "asteroid" | string; // Default 'sphere'
  surface?: SurfaceAppearanceUnion; // Now simplified
  atmosphere?: AtmosphereEffectAppearance;
  clouds?: CloudLayerAppearance;
}
