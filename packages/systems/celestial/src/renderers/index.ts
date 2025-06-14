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
}

export * from "./base/CelestialRenderer";
export * from "./base/BaseCelestialRenderer";
export * from "./utils/CelestialRendererDebugHelper";
export * from "./effects/gravitational-lensing";

export * from "./gas-giants";
export * from "./particles";
export * from "./rings";
export * from "./stars";
export * from "./terrestrial";
