import * as THREE from "three";
import type { CelestialObject } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

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

// Export interfaces and types from the common directory
export * from "./common/CelestialRenderer";

// Export the base renderer class
export * from "./common/BaseCelestialRenderer";

// Export the debug helper
export * from "./common/CelestialRendererDebugHelper";

// Export all specific renderers
export * from "./stars";
export * from "./gas-giants";
export * from "./terrestrial";
export * from "./particles";
export * from "./rings";
export * from "../textures/TextureFactory";
