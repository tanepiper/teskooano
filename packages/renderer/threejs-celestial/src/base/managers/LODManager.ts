import type { RenderableCelestialObject } from "@teskooano/data-types";
import * as THREE from "three";

/**
 * Manages Level of Detail (LOD) objects for celestial renderers.
 * Handles creation, tracking, updates, and cleanup of THREE.LOD objects.
 */
export class LODManager {
  /**
   * A map of Level of Detail (LOD) objects, keyed by celestial object ID.
   */
  private lods: Map<string, THREE.LOD> = new Map();

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
