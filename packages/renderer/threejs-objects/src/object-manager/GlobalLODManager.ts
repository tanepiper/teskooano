import type { RenderableCelestialObject } from "@teskooano/data-types";
import * as THREE from "three";

/**
 * Global LOD Manager for tracking all LOD objects in the scene.
 * This is separate from the celestial LOD manager which handles per-object LOD levels.
 *
 * The GlobalLODManager provides a simple registry for THREE.LOD objects that are created
 * by celestial renderers. Each celestial object can register its LOD object here for
 * global tracking and cleanup.
 */
export class GlobalLODManager {
  private lods: Map<string, THREE.LOD> = new Map();

  constructor() {
    // @ts-ignore
    if (window.teskooano) {
      // @ts-ignore
      window.teskooano.GlobalLODManager = this;
    }
  }

  /**
   * Registers a LOD object for a celestial object.
   * This is called by celestial renderers when they create their LOD objects.
   * @param objectId The ID of the celestial object.
   * @param lod The THREE.LOD object to register.
   */
  public registerLOD(objectId: string, lod: THREE.LOD): void {
    this.lods.set(objectId, lod);
  }

  /**
   * Gets a LOD object by celestial object ID.
   * @param objectId The ID of the celestial object.
   * @returns The LOD object, or undefined if not found.
   */
  public getLOD(objectId: string): THREE.LOD | undefined {
    return this.lods.get(objectId);
  }

  /**
   * Removes a LOD object and cleans up its resources.
   * This is called when a celestial object is destroyed or removed from the scene.
   * @param objectId The ID of the celestial object.
   */
  public remove(objectId: string): void {
    const lod = this.lods.get(objectId);
    if (lod) {
      // Remove all children from the scene
      while (lod.children.length > 0) {
        lod.remove(lod.children[0]);
      }
      this.lods.delete(objectId);
    }
  }

  /**
   * Creates and registers a LOD object for a celestial object.
   * This is a convenience method that creates a THREE.LOD, adds the provided levels,
   * and registers it with the global manager.
   * @param object The celestial object.
   * @param levels The LOD levels to add to the LOD object.
   * @returns The created LOD object.
   */
  public createAndRegisterLOD(
    object: RenderableCelestialObject,
    levels: any[],
  ): THREE.LOD {
    const lod = new THREE.LOD();
    levels.forEach((level: any) => {
      lod.addLevel(level.object, level.distance);
    });
    this.lods.set(object.id, lod);
    return lod;
  }

  /**
   * Gets the current LOD level index for a celestial object.
   * Note: THREE.LOD doesn't expose this information easily, so this is a simplified implementation.
   * @param objectId The ID of the celestial object.
   * @returns The current LOD level index, or undefined if not found.
   */
  public getCurrentLODLevelIndex(objectId: string): number | undefined {
    const lod = this.lods.get(objectId);
    if (!lod) return undefined;

    // THREE.LOD doesn't expose the current level index, so we return 0 as a fallback
    // This is used primarily for label visibility decisions
    return 0;
  }

  /**
   * Cleans up all LOD objects and their resources.
   * This should be called when the ObjectManager is disposed.
   */
  public dispose(): void {
    this.lods.forEach((lod: THREE.LOD) => {
      // Remove all children from the scene
      while (lod.children.length > 0) {
        lod.remove(lod.children[0]);
      }
    });
    this.lods.clear();
  }

  /**
   * Gets the number of registered LOD objects.
   * @returns The count of registered LOD objects.
   */
  public getLODCount(): number {
    return this.lods.size;
  }

  /**
   * Gets all registered LOD object IDs.
   * @returns An array of all registered object IDs.
   */
  public getLODIds(): string[] {
    return Array.from(this.lods.keys());
  }
}
