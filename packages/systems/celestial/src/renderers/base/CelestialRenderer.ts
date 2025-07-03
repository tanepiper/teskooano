import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";

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

  createLodCallback?: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;

  lightingInfluenceManager?: LightingManager;
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
 * Map of light sources
 */
export type LightSourcesMap = Map<string, LightSourceData>;

/**
 * Utility class for managing light and shadow caster arrays in shader materials
 */
export class LightArrayUtils {
  /**
   * Creates an initial array of light sources with the specified size
   */
  static createLightSourceArray(size: number = 4): Array<{
    position: THREE.Vector3;
    color: THREE.Color;
    intensity: number;
  }> {
    return Array(size)
      .fill(0)
      .map(() => ({
        position: new THREE.Vector3(),
        color: new THREE.Color(),
        intensity: 0,
      }));
  }

  /**
   * Creates an initial array of shadow casters with the specified size
   */
  static createShadowCasterArray(size: number = 4): Array<{
    position: THREE.Vector3;
    radius: number;
  }> {
    return Array(size)
      .fill(0)
      .map(() => ({
        position: new THREE.Vector3(),
        radius: 0,
      }));
  }

  /**
   * Resizes a light source array to the new size, preserving existing data
   *
   * @param material The shader material containing the uniforms
   * @param newSize The new size for the array
   * @param currentArray The current array of light sources
   * @returns A new array of light sources with the specified size
   */
  static resizeLightArray(
    material: THREE.ShaderMaterial,
    newSize: number,
    currentArray: Array<{
      position: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }>,
  ): Array<{
    position: THREE.Vector3;
    color: THREE.Color;
    intensity: number;
  }> {
    const defineSize = Math.max(1, newSize);

    // Update the shader define if needed
    if (material.defines.MAX_LIGHTS !== defineSize) {
      material.defines.MAX_LIGHTS = defineSize;
      material.needsUpdate = true;
    }

    const newArray: Array<{
      position: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }> = [];

    // Copy existing data and add new slots as needed
    for (let i = 0; i < defineSize; i++) {
      if (i < currentArray.length && currentArray[i]) {
        newArray.push(currentArray[i]);
      } else {
        newArray.push({
          position: new THREE.Vector3(),
          color: new THREE.Color(),
          intensity: 0,
        });
      }
    }

    return newArray;
  }

  /**
   * Resizes a shadow caster array to the new size, preserving existing data
   *
   * @param material The shader material containing the uniforms
   * @param newSize The new size for the array
   * @param currentArray The current array of shadow casters
   * @returns A new array of shadow casters with the specified size
   */
  static resizeShadowCasterArray(
    material: THREE.ShaderMaterial,
    newSize: number,
    currentArray: Array<{
      position: THREE.Vector3;
      radius: number;
    }>,
  ): Array<{
    position: THREE.Vector3;
    radius: number;
  }> {
    const defineSize = Math.max(1, newSize);

    // Update the shader define if needed
    if (material.defines.MAX_SHADOW_CASTERS !== defineSize) {
      material.defines.MAX_SHADOW_CASTERS = defineSize;
      material.needsUpdate = true;
    }

    const newArray: Array<{
      position: THREE.Vector3;
      radius: number;
    }> = [];

    // Copy existing data and add new slots as needed
    for (let i = 0; i < defineSize; i++) {
      if (i < currentArray.length && currentArray[i]) {
        newArray.push(currentArray[i]);
      } else {
        newArray.push({
          position: new THREE.Vector3(),
          radius: 0,
        });
      }
    }

    return newArray;
  }
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
   * Update the object's state
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void;

  /**
   * Update the level of detail for an object based on camera distance
   *
   * This is an optional method that can be implemented by renderers that support LOD.
   * Some renderers may handle LOD automatically via THREE.LOD, while others may need
   * explicit shader or material adjustments.
   *
   * @param objectId ID of the object to update
   * @param camera The camera object
   */
  updateLOD?(objectId: string, camera: THREE.Camera): void;

  /**
   * Clean up any resources used by the renderer
   *
   * This method should:
   * 1. Dispose of all materials, textures, and geometries
   * 2. Clear any maps or caches
   * 3. Remove any event listeners or other references
   */
  dispose(): void;

  materials: Map<string, THREE.Material | THREE.Material[]>;

  initialize: (
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) => void;

  getLOD(object: RenderableCelestialObject): THREE.LOD | undefined;
}
