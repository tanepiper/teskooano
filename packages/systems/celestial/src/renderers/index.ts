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

export * from "./common/CelestialRenderer";

export * from "./common/BaseCelestialRenderer";

export * from "./common/CelestialRendererDebugHelper";

export * from "./stars";
export * from "./gas-giants";
export * from "./terrestrial";
export * from "./particles";
export * from "./rings";
