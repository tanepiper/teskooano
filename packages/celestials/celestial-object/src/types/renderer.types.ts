import * as THREE from "three";
import type { CelestialBillboardConfig, Billboard } from "./billboard.types";

/**
 * Defines a level of detail for a 3D object.
 */
export interface LODLevel {
  /** The 3D object for this LOD level. */
  object: THREE.Object3D;
  /** The distance at which this LOD level becomes visible. */
  distance: number;
  /** Optional: Hysteresis factor for LOD switching. Refer to THREE.LOD documentation. */
  hysteresis?: number;
}

/**
 * Defines the distances for different Levels of Detail (LOD).
 * These values are multiplied by the object's radius to determine LOD transition distances.
 */
export interface LODDistances {
  /** Distance for medium detail LOD. Defaults to `DEFAULT_MEDIUM_DETAIL_DISTANCE`. */
  medium?: number;
  /** Distance for low detail LOD. Defaults to `DEFAULT_LOW_DETAIL_DISTANCE`. */
  low?: number;
  /** Distance for billboard/far LOD. Defaults to `DEFAULT_BILLBOARD_DISTANCE`. */
  billboard?: number;
}

/**
 * Options for configuring the BasicCelestialRenderer instance.
 * This interface can be extended by subclasses for more specific renderer options.
 */
export interface BasicRendererOptions {
  /** Optional configuration for LOD distances. These are factors multiplied by object radius. */
  lodDistances?: LODDistances;
  /** Optional: Configuration for the billboard, including visuals and associated light. */
  billboardConfig?: CelestialBillboardConfig;
  /**
   * Optional: A custom billboard generator. If not provided, a default implementation will be used.
   * This allows for different types of billboards (e.g., standard star flare, black hole lensing).
   */
  billboardGenerator?: Billboard;
}

/**
 * Interface for all celestial object renderers.
 * Defines the contract for rendering a celestial object in the scene.
 * The `lod` property (a `THREE.LOD` instance) is the main entry point for adding the renderer's output to the scene.
 * Its levels often contain `THREE.Group` instances to manage complex visual objects.
 */
export interface CelestialRenderer {
  /**
   * The main Three.js LOD object that manages different levels of detail for this celestial object.
   */
  lod: THREE.LOD;

  /**
   * Updates the visual representation of the celestial object.
   * This is typically called in the main render loop.
   */
  update(): void;

  /**
   * Disposes of the renderer's resources (geometry, material, etc.)
   * to free up memory.
   */
  dispose(): void;
}
