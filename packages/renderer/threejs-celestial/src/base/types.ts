import { RenderableCelestialObject } from "@teskooano/data-types";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";

/**
 * Configuration options for the BaseCelestialRenderer.
 */
export interface BaseCelestialRendererOptions {
  /**
   * An optional reference to the scene's lighting manager. This can be used
   * by renderers to access global lighting information.
   */
  lightingManager?: LightingManager;
}

export type DetailLevel = "high" | "medium" | "low" | "very-low";

/**
 * Options for creating a celestial mesh.
 */
export interface CelestialMeshOptions {
  /**
   * The scale to render the object at.
   * @default 1.0
   */
  renderScale?: number;
  /**
   * Optional camera for effects that require multi-pass rendering or screen space calculations.
   */
  /**
   * Level of detail to use for the mesh
   */
  detailLevel?: DetailLevel;

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
   * Optional reference to the main scene camera.
   */
  camera?: THREE.Camera;

  /**
   * Optional reference to the main THREE.js scene.
   */
  scene?: THREE.Scene;

  /**
   * Optional reference to the main THREE.js renderer.
   */
  renderer?: THREE.WebGLRenderer;

  /**
   * Optional reference to the parent LOD distances.
   */
  parentLODDistances?: number[];

  createLodCallback?: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;

  lightingInfluenceManager?: LightingManager;
}
