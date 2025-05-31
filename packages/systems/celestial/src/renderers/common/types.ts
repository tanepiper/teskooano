import { Color, Object3D, Vector3 } from "three";

/**
 * Options for creating celestial object meshes
 */
export interface CelestialMeshOptions {
  /**
   * Level of detail to use for the mesh
   */
  detailLevel?: "high" | "medium" | "low" | "very-low";

  /**
   * Specific number of segments to use (overrides detailLevel)
   */
  segments?: number;

  /**
   * Whether to include special effects like atmospheres, rings, etc.
   * Default: true
   */
  includeEffects?: boolean;

  /**
   * Whether to include debug helpers (e.g., wireframes, normals)
   * Default: false
   */
  debug?: boolean;

  /**
   * Whether to enable gravitational lensing effects for compatible objects (e.g., black holes).
   * Default: false
   */
  enableGravitationalLensing?: boolean;
}

/**
 * Options for light sources in the scene
 */
export interface LightSourceData {
  /**
   * World position of the light source
   */
  position: Vector3;

  /**
   * Color of the light source
   */
  color: Color;

  /**
   * Optional intensity of the light source
   * Default: 1.0
   */
  intensity?: number;
}

/**
 * Map of light sources
 */
export type LightSourcesMap = Map<string, LightSourceData>;

/**
 * Defines a single level of detail for a celestial object.
 */
export interface LODLevel {
  /** The Three.js object (Mesh, Group, Points, etc.) for this level. */
  object: Object3D;
  /** The distance threshold at which this level becomes active. */
  distance: number;
}
