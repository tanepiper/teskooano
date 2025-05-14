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

export * from "./common/CelestialRenderer";

export * from "./common/BaseCelestialRenderer";

export * from "./common/CelestialRendererDebugHelper";

export * from "./gas-giants";
export * from "./particles";
export * from "./rings";
export * from "./stars";
export * from "./terrestrial";
