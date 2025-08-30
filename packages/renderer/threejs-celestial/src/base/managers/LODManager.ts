import type {
  RenderableCelestialObject,
  DeviceTier,
} from "@teskooano/data-types";
import * as THREE from "three";
import { StateAccessor, StateSubscriptionMixin } from "@teskooano/core-state";
import { rendererEvents } from "@teskooano/renderer-threejs-core";

/**
 * Defines a single level for a Level of Detail (LOD) object.
 */
export interface LODLevel {
  object: THREE.Object3D;
  distance: number;
  name?: string; // Optional name for the LOD level (e.g., "high", "medium", "low", "billboard")
}

/**
 * Manages Level of Detail (LOD) objects for celestial renderers.
 * Handles creation, tracking, updates, and cleanup of THREE.LOD objects.
 * Supports performance-based scaling and named LOD levels.
 */
export class LODManager extends StateSubscriptionMixin {
  /**
   * A map of Level of Detail (LOD) objects, keyed by celestial object ID.
   */
  private lods: Map<string, THREE.LOD> = new Map();

  /**
   * Current performance profile for scaling LOD distances.
   */
  private currentProfile: DeviceTier = "medium";

  /**
   * Performance optimization settings from the renderer.
   */
  private performanceOptimization: any = null;

  constructor() {
    super();

    // Initialize with current performance profile
    this.currentProfile = StateAccessor.getSimulationState().performanceProfile;

    // Subscribe to performance profile changes
    this.subscribeToState(StateAccessor.simulation$(), (state) => {
      if (state.performanceProfile !== this.currentProfile) {
        this.currentProfile = state.performanceProfile;
      }
    });

    // Subscribe to performance optimization changes
    this.subscribeToState(
      rendererEvents.performanceOptimizationChanged$,
      (optimization) => {
        this.performanceOptimization = optimization;
      },
    );
  }

  /**
   * Creates a new LOD instance for a celestial object and registers it for management.
   * This method applies performance-based scaling to the distance thresholds.
   *
   * @param object The celestial object that this LOD represents.
   * @param levels An array of LOD levels, ordered from highest detail (smallest distance) to lowest detail (largest distance).
   * @returns The created THREE.LOD instance.
   */
  public createAndRegisterLOD(
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ): THREE.LOD {
    if (!levels || levels.length === 0) {
      throw new Error(`No LOD levels provided for object ${object.id}`);
    }

    // Apply performance-based scaling to distances
    const scaledLevels = levels.map((level) => ({
      ...level,
      distance: level.distance * this.getLODScaleFactor(),
    }));

    const lod = new THREE.LOD();
    lod.name = `${object.id}-LODContainer`;

    scaledLevels.forEach((level) => {
      lod.addLevel(level.object, level.distance);
    });

    this.registerLOD(object.id, lod);
    return lod;
  }

  /**
   * Registers an LOD object with the manager.
   * @param objectId The celestial object ID to associate with the LOD.
   * @param lod The THREE.LOD object to register.
   */
  public registerLOD(objectId: string, lod: THREE.LOD): void {
    // Dispose of existing LOD if it exists
    const existingLOD = this.lods.get(objectId);
    if (existingLOD) {
      this.disposeLOD(existingLOD);
    }

    this.lods.set(objectId, lod);
  }

  /**
   * Gets an LOD object by celestial object ID.
   * @param objectId The celestial object ID.
   * @returns The THREE.LOD object, or undefined if not found.
   */
  public getLOD(objectId: string): THREE.LOD | undefined {
    return this.lods.get(objectId);
  }

  /**
   * Gets an LOD object by celestial object.
   * @param object The celestial object.
   * @returns The THREE.LOD object, or undefined if not found.
   */
  public getLODForObject(
    object: RenderableCelestialObject,
  ): THREE.LOD | undefined {
    return this.lods.get(object.id);
  }

  /**
   * Updates the LOD for a specific object based on its distance to the camera.
   * @param objectId The ID of the object whose LOD should be updated.
   * @param camera The scene's main camera.
   * @returns True if the LOD was found and updated, false otherwise.
   */
  public updateLOD(objectId: string, camera: THREE.PerspectiveCamera): boolean {
    const lod = this.lods.get(objectId);
    if (lod) {
      lod.update(camera);
      return true;
    }
    return false;
  }

  /**
   * Updates LOD position and level for a celestial object.
   * This is the main update method called during the render loop.
   * @param object The celestial object being updated.
   * @param camera The scene's main camera.
   * @returns True if the LOD was found and updated, false otherwise.
   */
  public updateObjectLOD(
    object: RenderableCelestialObject,
    camera: THREE.PerspectiveCamera,
  ): boolean {
    const lod = this.lods.get(object.id);

    if (lod) {
      // Always update the LOD's position from the object's state.
      // This is crucial for "ideal" mode and ensures the visual position
      // always matches the physics position.
      lod.position.copy(object.position);
      lod.update(camera);
      return true;
    }

    return false;
  }

  /**
   * Updates all registered LOD objects based on the current camera position.
   * This method should be called every frame from the main render pipeline.
   * @param camera The scene's main camera.
   */
  public update(camera: THREE.PerspectiveCamera): void {
    this.lods.forEach((lod) => {
      lod.update(camera);
    });
  }

  /**
   * Calculates a normalized LOD level (0 to 1) based on the distance from
   * the camera to an object and the object's radius.
   * @param distance The distance from the camera to the object.
   * @param objectRadius The radius of the object.
   * @returns A normalized value representing the LOD level.
   */
  public calculateLODLevel(distance: number, objectRadius: number): number {
    const normalizedDistance = distance / (objectRadius * 100);
    return Math.max(0, Math.min(1, normalizedDistance - 0.5));
  }

  /**
   * Gets the current distance-based LOD level for an object.
   * @param object The celestial object.
   * @param camera The scene's main camera.
   * @returns The current LOD level (0 to 1), or null if LOD not found.
   */
  public getCurrentLODLevel(
    object: RenderableCelestialObject,
    camera: THREE.PerspectiveCamera,
  ): number | null {
    const lod = this.lods.get(object.id);
    if (!lod) return null;

    const distance = camera.position.distanceTo(object.position);
    return this.calculateLODLevel(distance, object.radius || 1);
  }

  /**
   * Gets the current LOD level index for an object.
   * @param objectId The ID of the celestial object.
   * @returns The current LOD level index (0 for closest, higher for farther), or undefined if not found.
   */
  public getCurrentLODLevelIndex(objectId: string): number | undefined {
    const lod = this.lods.get(objectId);
    if (!lod) return undefined;

    // Find the current level by checking which child is visible
    for (let i = 0; i < lod.children.length; i++) {
      const child = lod.children[i];
      if (child.visible) {
        return i;
      }
    }

    // If no visible child found, return the highest level
    return lod.children.length - 1;
  }

  /**
   * Removes and disposes of an LOD object.
   * @param objectId The celestial object ID whose LOD should be removed.
   * @returns True if the LOD was found and removed, false otherwise.
   */
  public removeLOD(objectId: string): boolean {
    const lod = this.lods.get(objectId);
    if (lod) {
      this.disposeLOD(lod);
      this.lods.delete(objectId);
      return true;
    }
    return false;
  }

  /**
   * Alias for removeLOD to match the interface expected by ObjectLifecycleManager.
   * @param objectId The ID of the celestial object whose LOD should be removed.
   */
  public remove(objectId: string): void {
    this.removeLOD(objectId);
  }

  /**
   * Checks if an LOD object exists for the given object ID.
   * @param objectId The celestial object ID to check.
   * @returns True if an LOD exists for the object.
   */
  public hasLOD(objectId: string): boolean {
    return this.lods.has(objectId);
  }

  /**
   * Gets the number of managed LOD objects.
   * @returns The count of LOD objects.
   */
  public getLODCount(): number {
    return this.lods.size;
  }

  /**
   * Gets all registered LOD object IDs.
   * @returns An array of all celestial object IDs that have LODs.
   */
  public getLODIds(): string[] {
    return Array.from(this.lods.keys());
  }

  /**
   * Determines the scaling factor for LOD distances based on the current profile and device capabilities.
   * Higher quality profiles use smaller distances (switch LODs sooner).
   * @returns The scaling factor (e.g., 1.0 for medium, 0.5 for cosmic).
   */
  private getLODScaleFactor(): number {
    // Base scaling from user profile
    let baseScale: number;
    switch (this.currentProfile) {
      case "low":
        baseScale = 1.5;
        break;
      case "medium":
        baseScale = 1.0;
        break;
      case "high":
        baseScale = 0.75;
        break;
      case "cosmic":
        baseScale = 0.5;
        break;
      default:
        baseScale = 1.0;
    }

    // Apply device capability scaling if available
    if (this.performanceOptimization?.lodDistanceMultiplier) {
      return baseScale * this.performanceOptimization.lodDistanceMultiplier;
    }

    return baseScale;
  }

  /**
   * Disposes of a specific LOD object and its children.
   * @param lod The THREE.LOD object to dispose.
   * @private
   */
  private disposeLOD(lod: THREE.LOD): void {
    // Dispose of all children and their materials/geometries
    lod.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });

    // Remove from parent if it has one
    if (lod.parent) {
      lod.parent.remove(lod);
    }
  }

  /**
   * Cleans up all managed LOD objects.
   * This should be called when the manager is no longer needed.
   */
  public dispose(): void {
    this.lods.forEach((lod) => {
      this.disposeLOD(lod);
    });
    this.lods.clear();
  }
}
