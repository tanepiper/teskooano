import * as THREE from "three";
import {
  CelestialMeshOptions,
  CelestialRenderer,
  LightSourceData,
  LightSourcesMap,
} from "./CelestialRenderer";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";

export interface BaseCelestialRendererOptions {
  lightingManager?: LightingManager;
}

/**
 * Abstract base class for all celestial renderers
 *
 * Provides common functionality:
 * - Material and resource management
 * - Light source handling
 * - Basic time tracking
 * - Utility methods for LOD
 */
export abstract class BaseCelestialRenderer implements CelestialRenderer {
  /**
   * Map of materials for different objects
   * Key: object ID, Value: material instance
   */
  public materials: Map<string, THREE.Material | THREE.Material[]> = new Map();

  /**
   * Map of LOD levels for different objects
   * Key: object ID, Value: LOD instance
   */
  protected lods: Map<string, THREE.LOD> = new Map();

  /**
   * The start time of the renderer (used to calculate elapsed time)
   */
  protected startTime: number = Date.now() / 1000;

  /**
   * The current elapsed time
   */
  protected elapsedTime: number = 0;

  /**
   * Reusable vectors for calculations
   * Using instance variables avoids allocation in update loops
   */
  protected _tempVector1: THREE.Vector3 = new THREE.Vector3();
  protected _tempVector2: THREE.Vector3 = new THREE.Vector3();
  protected _tempVector3: THREE.Vector3 = new THREE.Vector3();
  protected lightingManager?: LightingManager;

  constructor(options: BaseCelestialRendererOptions = {}) {
    this.lightingManager = options.lightingManager;
  }

  /**
   * Get LOD levels for a celestial object
   * Must be implemented by subclasses
   */
  abstract getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];

  /**
   * Update the renderer with the current simulation state
   * Default implementation updates time-based uniforms for the specific object's material.
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources?: LightSourcesMap,
    camera?: THREE.Camera,
  ): void {
    const lod = this.lods.get(object.celestialObjectId);
    if (lod) {
      this.lods.get(object.celestialObjectId)?.update(camera as THREE.Camera);
    }
  }

  /**
   * Default implementation of LOD updating
   * Subclasses should override if they use custom LOD handling
   */
  updateLOD(objectId: string, distance: number, camera: THREE.Camera): void {}

  /**
   * Clean up resources
   */
  dispose(): void {
    this.materials.forEach((material) => {
      if (material instanceof THREE.Material) {
        Object.keys(material).forEach((key) => {
          const value = (material as any)[key];
          if (value instanceof THREE.Texture) {
            value.dispose();
          }
        });

        if (material instanceof THREE.ShaderMaterial) {
          Object.keys(material.uniforms || {}).forEach((key) => {
            const value = material.uniforms[key].value;
            if (value instanceof THREE.Texture) {
              value.dispose();
            }
          });
        }

        material.dispose();
      }
    });

    this.materials.clear();
    this.lods.clear();
  }

  /**
   * Helper method to map detail level to segment count
   */
  protected getSegmentsForDetailLevel(
    detailLevel?: string,
    defaultSegments: number = 64,
  ): number {
    if (!detailLevel) return defaultSegments;

    switch (detailLevel) {
      case "high":
        return 128;
      case "medium":
        return 64;
      case "low":
        return 32;
      case "very-low":
        return 16;
      default:
        return defaultSegments;
    }
  }

  /**
   * Add a material to the materials map for tracking and disposal
   */
  public registerMaterial(id: string, material: THREE.Material): void {
    const existingMaterial = this.materials.get(id);
    if (existingMaterial) {
      (Array.isArray(existingMaterial)
        ? existingMaterial
        : [existingMaterial]
      ).forEach((m) => m.dispose());
    }
    this.materials.set(id, material);
  }

  /**
   * Utility method to safely apply a texture to a material
   * Handles uniforms for shader materials
   */
  protected applyTexture(
    material: THREE.Material,
    textureKey: string,
    texture: THREE.Texture | null,
  ): void {
    if (!texture) return;

    if (material instanceof THREE.ShaderMaterial) {
      if (material.uniforms && material.uniforms[textureKey] !== undefined) {
        material.uniforms[textureKey].value = texture;
      }
    } else {
      (material as any)[textureKey] = texture;
    }
  }

  /**
   * Calculate the appropriate LOD level based on distance
   * Returns a number between 0 and 1 representing the LOD level
   * 0 = highest detail, 1 = lowest detail
   */
  protected calculateLODLevel(distance: number, objectRadius: number): number {
    const normalizedDistance = distance / (objectRadius * 100);

    return Math.max(0, Math.min(1, normalizedDistance - 0.5));
  }

  /**
   * Helper method to get the world position of an object
   */
  protected getWorldPosition(object: RenderableCelestialObject): THREE.Vector3 {
    return object.position.clone();
  }

  /**
   * Helper to find the primary light source for an object
   */
  public findPrimaryLightSource(
    object: RenderableCelestialObject,
    lightSources?: LightSourcesMap,
  ): LightSourceData | null {
    if (!lightSources || lightSources.size === 0) return null;

    if (
      object.primaryLightSourceId &&
      lightSources.has(object.primaryLightSourceId)
    ) {
      return lightSources.get(object.primaryLightSourceId) || null;
    }

    return lightSources.values().next().value || null;
  }

  public getLOD(object: RenderableCelestialObject): THREE.LOD | undefined {
    return this.lods.get(object.celestialObjectId);
  }

  public initialize(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): void {
    // Base implementation does nothing, subclasses should override.
  }
}
