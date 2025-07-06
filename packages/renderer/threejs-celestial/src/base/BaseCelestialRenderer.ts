import { RenderableCelestialObject } from "@teskooano/data-types";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { BillboardManager } from "../billboards";
import {
  CelestialRenderer,
  LightSourceData,
  LightSourcesMap,
} from "./CelestialRenderer";
import { BaseCelestialRendererOptions, CelestialMeshOptions } from "./types";

/**
 * Abstract base class for all celestial renderers.
 *
 * Provides common functionality for all objects that are rendered in the scene,
 * including material and resource management, light source handling, time tracking,
 * and Level of Detail (LOD) utilities. It serves as the foundation upon which
 * more specific renderers (e.g., for planets, stars) are built.
 */
export abstract class BaseCelestialRenderer implements CelestialRenderer {
  /**
   * A map of materials used by the renderer, keyed by a unique identifier
   * (typically the celestial object ID). This is used for tracking and proper disposal.
   */
  public materials: Map<string, THREE.Material | THREE.Material[]> = new Map();

  /**
   * A map of Level of Detail (LOD) objects, keyed by a unique identifier
   * (typically the celestial object ID).
   */
  protected lods: Map<string, THREE.LOD> = new Map();

  /**
   * The timestamp when the renderer was instantiated, used to calculate elapsed time.
   */
  protected startTime: number = Date.now() / 1000;

  /**
   * The current elapsed time since the renderer was instantiated.
   */
  protected elapsedTime: number = 0;

  /**
   * Reusable `THREE.Vector3` instances to avoid allocations in performance-critical
   * update loops.
   */
  protected _tempVector1: THREE.Vector3 = new THREE.Vector3();
  protected _tempVector2: THREE.Vector3 = new THREE.Vector3();
  protected _tempVector3: THREE.Vector3 = new THREE.Vector3();
  /**
   * An optional reference to the scene's lighting manager.
   */
  protected lightingManager?: LightingManager;
  /**
   * A dedicated manager for handling billboard creation and updates.
   */
  protected billboardManager: BillboardManager;

  /**
   * Initializes the renderer, setting up the lighting and billboard managers.
   * @param options Configuration options for the renderer.
   */
  constructor(options: BaseCelestialRendererOptions = {}) {
    this.lightingManager = options.lightingManager;
    this.billboardManager = new BillboardManager();
  }

  /**
   * Abstract method to be implemented by subclasses. It should return an array
   * of `LODLevel` objects that define the different levels of detail for a given
   * celestial object.
   * @param object The celestial object for which to get LOD levels.
   * @param options Additional options for creating the mesh.
   */
  abstract getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];

  /**
   * The main update method, called once per frame. It orchestrates calls to update
   * the object's LOD and its billboard representation. Subclasses should extend this
   * to add their own update logic (e.g., for materials and shaders).
   * @param object The celestial object being updated.
   * @param time The current simulation time.
   * @param timeScale The current time scale factor.
   * @param lightSources A map of influential light sources for this object.
   * @param camera The scene's main camera.
   * @param allObjects A map of all renderable objects in the scene.
   * @param allMeshes A map of all THREE.Object3D meshes in the scene.
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    const lod = this.lods.get(object.celestialObjectId);

    if (lod) {
      // Always update the LOD's position from the object's state.
      // This is crucial for "ideal" mode and ensures the visual position
      // always matches the physics position.
      lod.position.copy(object.position);
      lod.update(camera);
    }

    if (allObjects && allMeshes) {
      this.billboardManager.update(camera, allObjects, allMeshes);
    }
  }

  /**
   * Updates the LOD for a specific object based on its distance to the camera.
   * @param objectId The ID of the object whose LOD should be updated.
   * @param camera The scene's main camera.
   */
  updateLOD(objectId: string, camera: THREE.Camera): void {
    const lod = this.lods.get(objectId);
    if (lod) {
      lod.update(camera as THREE.Camera);
    }
  }
  /**
   * Cleans up all managed resources, including materials and billboard assets,
   * to prevent memory leaks when the renderer is no longer needed.
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
    this.billboardManager.dispose();
  }

  /**
   * A helper method that maps a qualitative detail level (e.g., "high") to a
   * concrete number of segments for creating geometries.
   * @param detailLevel A string representing the desired detail level.
   * @param defaultSegments A fallback number of segments if the detail level is not specified.
   * @returns The calculated number of segments.
   */
  protected getSegmentsForDetailLevel(
    detailLevel?: string,
    defaultSegments: number = 16,
  ): number {
    if (!detailLevel) return defaultSegments;

    switch (detailLevel) {
      case "high":
        return 32;
      case "medium":
        return 16;
      case "low":
        return 8;
      case "very-low":
        return 4;
      default:
        return defaultSegments;
    }
  }

  /**
   * Registers a material with the renderer for tracking and later disposal.
   * If a material with the same ID already exists, it is disposed of before
   * the new one is added.
   * @param id A unique identifier for the material.
   * @param material The material instance to register.
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
   * A utility method to safely apply a texture to a material property or uniform.
   * It handles both standard `THREE.Material` and `THREE.ShaderMaterial` types.
   * @param material The material to which the texture will be applied.
   * @param textureKey The name of the property or uniform to set.
   * @param texture The texture to apply.
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
   * Calculates a normalized LOD level (0 to 1) based on the distance from
   * the camera to an object and the object's radius.
   * @param distance The distance from the camera to the object.
   * @param objectRadius The radius of the object.
   * @returns A normalized value representing the LOD level.
   */
  protected calculateLODLevel(distance: number, objectRadius: number): number {
    const normalizedDistance = distance / (objectRadius * 100);

    return Math.max(0, Math.min(1, normalizedDistance - 0.5));
  }

  /**
   * A helper method to get the world position of an object.
   * @param object The celestial object.
   * @returns A clone of the object's position vector.
   */
  protected getWorldPosition(object: RenderableCelestialObject): THREE.Vector3 {
    return object.position.clone();
  }

  /**
   * A helper method to find the most influential light source for a given object.
   * It prioritizes the object's `primaryLightSourceId` if it exists and is
   * present in the provided light sources map. Otherwise, it falls back to the
   * first available light source.
   * @param object The celestial object.
   * @param lightSources A map of available light sources.
   * @returns The most influential light source, or null if none are available.
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

  /**
   * A helper method to get the LOD object for a given celestial object.
   * @param object The celestial object.
   * @returns The LOD object, or undefined if it doesn't exist.
   */
  public getLOD(object: RenderableCelestialObject): THREE.LOD | undefined {
    return this.lods.get(object.celestialObjectId);
  }

  /**
   * An initialization method intended to be overridden by subclasses.
   * This provides a hook for post-constructor setup logic.
   * @param object The celestial object to initialize.
   * @param options Additional options for initialization.
   */
  public initialize(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): void {
    // Base implementation does nothing, subclasses should override.
  }
}
