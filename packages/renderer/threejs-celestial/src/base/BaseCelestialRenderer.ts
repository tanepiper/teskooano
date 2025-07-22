import { RenderableCelestialObject } from "@teskooano/data-types";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { BillboardManager } from "../billboards";
import {
  CelestialRenderer,
  LightSourceData,
  LightSourcesMap,
  ShadowCasterData,
  LightingConfig,
} from "./CelestialRenderer";
import { BaseCelestialRendererOptions, CelestialMeshOptions } from "./types";
import {
  MaterialManager,
  LODManager,
  CelestialLightingManager,
  GeometryUtilities,
  TimeManager,
} from "./managers";

/**
 * Abstract base class for all celestial renderers.
 *
 * This class provides a clean interface for celestial rendering by delegating
 * specific responsibilities to specialized manager classes. It serves as a
 * coordination layer that orchestrates the various aspects of celestial rendering.
 *
 * @template TMaterial The specific material type this renderer works with (e.g., BaseStarMaterial, BaseGasGiantMaterial)
 */
export abstract class BaseCelestialRenderer<
  TMaterial extends THREE.Material = THREE.Material,
> implements CelestialRenderer
{
  /**
   * Manager for material lifecycle and operations
   */
  protected materialManager: MaterialManager;

  /**
   * Manager for Level of Detail objects and operations
   */
  protected lodManager: LODManager;

  /**
   * Manager for lighting-related calculations and operations
   */
  protected lightingManager: CelestialLightingManager;

  /**
   * Manager for time tracking and calculations
   */
  protected timeManager: TimeManager;

  /**
   * Manager for billboard creation and updates
   */
  protected billboardManager: BillboardManager;

  /**
   * Whether billboard LOD levels are disabled for this renderer
   */
  protected billboardDisabled: boolean;

  /**
   * Reusable Vector3 instances to avoid allocations in performance-critical update loops
   */
  protected _tempVector1: THREE.Vector3 = new THREE.Vector3();
  protected _tempVector2: THREE.Vector3 = new THREE.Vector3();
  protected _tempVector3: THREE.Vector3 = new THREE.Vector3();

  /**
   * Initializes the renderer and its manager components.
   * @param object The renderable celestial object data required for initialization.
   * @param options Configuration options for the renderer.
   */
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    this.materialManager = new MaterialManager();
    this.lodManager = new LODManager();
    this.lightingManager = new CelestialLightingManager();
    this.timeManager = new TimeManager();
    this.billboardManager = new BillboardManager();
    this.billboardDisabled = options.disableBillboard ?? false;
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
   * Optional abstract method for subclasses to create their specific material type.
   * When implemented, this method will be called by getMaterial() to create materials.
   * @param object The celestial object for which to create the material.
   * @returns The specific material type for this renderer.
   */
  protected createMaterial?(object: RenderableCelestialObject): TMaterial;

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
    // Update time tracking
    this.timeManager.update(time, timeScale);

    // Update LOD position and level
    this.lodManager.updateObjectLOD(object, camera);

    // Update billboards if needed and not disabled
    if (!this.billboardDisabled && allObjects && allMeshes) {
      this.billboardManager.update(camera, allObjects, allMeshes);
    }
  }

  /**
   * Updates the LOD for a specific object based on its distance to the camera.
   * @param objectId The ID of the object whose LOD should be updated.
   * @param camera The scene's main camera.
   */
  updateLOD(objectId: string, camera: THREE.Camera): void {
    this.lodManager.updateLOD(objectId, camera);
  }

  // === Lighting Delegation Methods ===

  /**
   * Applies distance-based attenuation to light sources for this celestial object.
   * @param object The celestial object
   * @param lightSources Map of light sources to attenuate
   * @param config Optional configuration for attenuation
   * @returns The attenuated light sources
   */
  protected applyLightAttenuation(
    object: RenderableCelestialObject,
    lightSources: LightSourcesMap,
    config?: LightingConfig,
  ): LightSourcesMap {
    return this.lightingManager.applyLightAttenuation(
      object,
      lightSources,
      config,
    );
  }

  /**
   * Finds all shadow casters that can affect this celestial object.
   * @param object The celestial object
   * @param allObjects Map of all objects in the scene
   * @returns Array of shadow caster data
   */
  protected findShadowCasters(
    object: RenderableCelestialObject,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): ShadowCasterData[] {
    return this.lightingManager.findShadowCasters(object, allObjects);
  }

  /**
   * Finds shadow casters specifically for ring systems.
   * @param object The object that owns the ring system
   * @param allObjects Map of all objects in the scene
   * @returns Array of shadow caster data
   */
  protected findRingShadowCasters(
    object: RenderableCelestialObject,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): ShadowCasterData[] {
    return this.lightingManager.findRingShadowCasters(object, allObjects);
  }

  /**
   * Finds the closest light source to this celestial object.
   * @param object The celestial object
   * @param lightSources Map of available light sources
   * @returns The closest light source, or null if none available
   */
  protected findClosestLightSource(
    object: RenderableCelestialObject,
    lightSources?: LightSourcesMap,
  ): LightSourceData | null {
    return this.lightingManager.findClosestLightSource(object, lightSources);
  }

  // === Material Delegation Methods ===

  /**
   * Registers a material with the renderer for tracking and later disposal.
   * @param id A unique identifier for the material.
   * @param material The material instance to register.
   */
  public registerMaterial(id: string, material: THREE.Material): void {
    this.materialManager.registerMaterial(id, material);
  }

  /**
   * Gets a material by its registered ID. Returns the generic THREE.Material type.
   * @param id The unique identifier for the material.
   * @returns The material or material array, or undefined if not found.
   */
  public getMaterial(
    id: string,
  ): THREE.Material | THREE.Material[] | undefined {
    return this.materialManager.getMaterial(id);
  }

  /**
   * Gets a typed material by its registered ID. This provides better type safety
   * when you know the specific material type.
   * @param id The unique identifier for the material.
   * @returns The material cast to the specific type, or undefined if not found.
   */
  public getTypedMaterial(id: string): TMaterial | undefined {
    const material = this.materialManager.getMaterial(id);
    if (material && !Array.isArray(material)) {
      return material as TMaterial;
    }
    return undefined;
  }

  /**
   * Creates and registers a material for a celestial object.
   * This method will call the subclass's createMaterial method if implemented.
   * @param object The celestial object for which to create the material.
   * @returns The created material, or undefined if createMaterial is not implemented.
   */
  public createAndRegisterMaterial(
    object: RenderableCelestialObject,
  ): TMaterial | undefined {
    if (this.createMaterial) {
      const material = this.createMaterial(object);
      this.registerMaterial(object.celestialObjectId, material);
      return material;
    }
    return undefined;
  }

  /**
   * Safely applies a texture to a material property or uniform.
   * @param material The material to which the texture will be applied.
   * @param textureKey The name of the property or uniform to set.
   * @param texture The texture to apply.
   */
  protected applyTexture(
    material: THREE.Material,
    textureKey: string,
    texture: THREE.Texture | null,
  ): void {
    this.materialManager.applyTexture(material, textureKey, texture);
  }

  // === Geometry Utilities Delegation ===

  /**
   * Maps a qualitative detail level to a concrete number of segments for creating geometries.
   * @param detailLevel A string representing the desired detail level.
   * @param defaultSegments A fallback number of segments if the detail level is not specified.
   * @returns The calculated number of segments.
   */
  protected getSegmentsForDetailLevel(
    detailLevel?: string,
    defaultSegments: number = 32,
  ): number {
    return GeometryUtilities.getSegmentsForDetailLevel(
      detailLevel,
      defaultSegments,
    );
  }

  /**
   * Gets the world position of an object.
   * @param object The celestial object.
   * @returns A clone of the object's position vector.
   */
  protected getWorldPosition(object: RenderableCelestialObject): THREE.Vector3 {
    return GeometryUtilities.getWorldPosition(object);
  }

  /**
   * Calculates a normalized LOD level based on distance and object radius.
   * @param distance The distance from the camera to the object.
   * @param objectRadius The radius of the object.
   * @returns A normalized value representing the LOD level.
   */
  protected calculateLODLevel(distance: number, objectRadius: number): number {
    return this.lodManager.calculateLODLevel(distance, objectRadius);
  }

  // === Time Management Delegation ===

  /**
   * Gets the current elapsed time since the renderer was created.
   * @returns The elapsed time in seconds.
   */
  protected getElapsedTime(): number {
    return this.timeManager.getElapsedTime();
  }

  /**
   * Gets the start time of the renderer.
   * @returns The start time in seconds.
   */
  protected getStartTime(): number {
    return this.timeManager.getStartTime();
  }

  // === Legacy Interface Support ===

  /**
   * Legacy interface: provides access to materials map for backwards compatibility.
   * @deprecated Use getMaterial() instead for better encapsulation.
   */
  public get materials(): Map<string, THREE.Material | THREE.Material[]> {
    return this.materialManager.materials;
  }

  /**
   * Finds the most influential light source for a given object.
   * @param object The celestial object.
   * @param lightSources A map of available light sources.
   * @returns The most influential light source, or null if none are available.
   */
  public findPrimaryLightSource(
    object: RenderableCelestialObject,
    lightSources?: LightSourcesMap,
  ): LightSourceData | null {
    return this.lightingManager.findPrimaryLightSource(object, lightSources);
  }

  /**
   * Gets the LOD object for a given celestial object.
   * @param object The celestial object.
   * @returns The LOD object, or undefined if it doesn't exist.
   */
  public getLOD(object: RenderableCelestialObject): THREE.LOD | undefined {
    return this.lodManager.getLODForObject(object);
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

  /**
   * Cleans up all managed resources by delegating to manager dispose methods.
   * This prevents memory leaks when the renderer is no longer needed.
   */
  dispose(): void {
    this.materialManager.dispose();
    this.lodManager.dispose();
    this.billboardManager.dispose();
    // Note: lighting and time managers don't require disposal
  }
}
