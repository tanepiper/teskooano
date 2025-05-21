import type { CelestialAppearanceBase } from "./base";
import { RockyType } from "../common"; // Adjusted path to common

/** Defines the visual properties of a single ring or a segment of a ring system. */
export interface RingProperties {
  innerRadius: number; // SCALED relative to parent's scaled radius or absolute units for scene
  outerRadius: number; // SCALED or absolute
  density: number; // Visual density of particles
  opacity: number; // (0.0 = transparent, 1.0 = opaque)
  color: string; // Hex, base color tint of ring particles
  tilt?: number; // Radians, relative to parent's equatorial plane or system plane
  rotationRate?: number; // Radians per second, if animated
  texture: string; // Path or identifier for ring texture
  compositionType: RockyType; // e.g., ICE, DUST, ROCK (from common.ts)
}

export interface RingSystemAppearance extends CelestialAppearanceBase {
  rings: RingProperties[];
  // parentId is implicit from the CelestialObject this appearance belongs to.
}
