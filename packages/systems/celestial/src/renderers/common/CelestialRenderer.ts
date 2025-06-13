import * as THREE from "three";
import type {
  CelestialObject,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import { LODLevel } from "@teskooano/renderer-threejs-effects";

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
}

/**
 * Options for light sources in the scene
 */
export interface LightSourceData {
  /**
   * World position of the light source
   */
  position: THREE.Vector3;

  /**
   * Color of the light source
   */
  color: THREE.Color;

  /**
   * Optional intensity of the light source
   * Default: 1.0
   */
  intensity?: number;
}

/**
 * Common interface for all celestial renderers
 *
 * All renderers should implement this interface to ensure consistent behavior
 * across different celestial object types.
 */
export interface CelestialRenderer {
  /**
   * Creates and returns an array of LOD levels for the given celestial object.
   * Levels should be ordered from highest detail (smallest distance) to lowest detail (largest distance).
   * The first level (index 0) should typically have a distance of 0.
   *
   * @param object - The celestial object data.
   * @param options - Optional hints (e.g., { quality: 'high' | 'medium' | 'low' }).
   * @returns An array of LODLevel objects.
   * @throws {Error} If LOD levels cannot be generated for the object.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];

  /**
   * Update the renderer with the current simulation state
   *
   * This method should:
   * 1. Update time-based shader uniforms
   * 2. Update light source information in shaders
   * 3. Handle any animations or effects
   * 4. Potentially update LOD based on camera distance
   *
   * @param time The current elapsed simulation time
   * @param lightSources Map of light source IDs to their position and color data
   * @param camera The camera object (for LOD calculations)
   */
  update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
  ): void;

  /**
   * Update the renderer with the current simulation state
   *
   * This method should:
   * 1. Update time-based shader uniforms
   * 2. Update light source information in shaders
   *
   * @param object The celestial object data
   * @param existingMesh The existing mesh to update
   */
  updateWith?(
    object: RenderableCelestialObject,
    existingMesh: THREE.Object3D,
  ): void;

  /**
   * Update the level of detail for an object based on camera distance
   *
   * This is an optional method that can be implemented by renderers that support LOD.
   * Some renderers may handle LOD automatically via THREE.LOD, while others may need
   * explicit shader or material adjustments.
   *
   * @param objectId ID of the object to update
   * @param distance Distance from the camera to the object
   * @param camera The camera object
   */
  updateLOD?(objectId: string, distance: number, camera: THREE.Camera): void;

  /**
   * Clean up any resources used by the renderer
   *
   * This method should:
   * 1. Dispose of all materials, textures, and geometries
   * 2. Clear any maps or caches
   * 3. Remove any event listeners or other references
   */
  dispose(): void;
}

/**
 * Map of light sources
 */
export type LightSourcesMap = Map<string, LightSourceData>;
