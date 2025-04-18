import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
// Import LODLevel from the correct location (adjust path if necessary)
import type { LODLevel } from "@teskooano/systems-celestial";

// Debug Label related imports (assuming they are now in a separate utility file)
// We might need to adjust paths or create this file if it doesn't exist
import {
  createDebugLabel,
  updateDebugLabel,
  disposeDebugLabel,
  setDebugLabelVisibility,
  type DebugLabel,
} from "./lod-manager/lod-debug-labels"; // Assuming a new file for debug label utils

/**
 * Manages Level of Detail (LOD) for celestial objects by creating THREE.LOD instances
 * based on levels provided by specific CelestialRenderers.
 */
export class LODManager {
  private camera: THREE.PerspectiveCamera;
  private objectLODs: Map<string, THREE.LOD> = new Map();
  private debugLabels: Map<string, DebugLabel> = new Map();
  private debugEnabled: boolean = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  /**
   * Toggle debug visualization
   */
  toggleDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
    setDebugLabelVisibility(this.debugLabels, enabled);
  }

  /**
   * Create or update debug label for an object
   * @internal
   */
  private _updateOrCreateDebugLabel(objectId: string, lod: THREE.LOD): void {
    if (!this.debugEnabled) return;

    let debugLabel = this.debugLabels.get(objectId);

    if (!debugLabel) {
      debugLabel = createDebugLabel();
      this.debugLabels.set(objectId, debugLabel);
      // Add the label sprite directly to the LOD object so it follows it
      lod.add(debugLabel.sprite);
    }

    updateDebugLabel(debugLabel, lod, this.camera.position);
  }

  /**
   * Creates a THREE.LOD object from the provided levels and registers it for updates.
   * This method is intended to be passed to the MeshFactory.
   *
   * @param object - The RenderableCelestialObject data (used for ID).
   * @param levels - An array of LODLevel objects provided by the specific CelestialRenderer.
   * @returns The created and registered THREE.LOD object.
   * @throws {Error} If the levels array is empty or invalid.
   */
  createAndRegisterLOD(
    object: RenderableCelestialObject,
    levels: LODLevel[]
  ): THREE.LOD {
    if (!levels || levels.length === 0) {
      throw new Error(
        `[LODManager] Cannot create LOD for ${object.celestialObjectId}: No LOD levels provided.`
      );
    }

    const lod = new THREE.LOD();
    lod.name = `${object.celestialObjectId}-LODContainer`; // Add a name for debugging

    // Add levels provided by the renderer
    levels.forEach((level) => {
      if (!level.object || typeof level.distance !== "number") {
        console.warn(
          `[LODManager] Invalid LOD level provided for ${object.celestialObjectId}:`,
          level
        );
        // Skip invalid levels
        return;
      }
      lod.addLevel(level.object, level.distance);
    });

    // Auto update needs to be true for LOD to work
    lod.autoUpdate = true;

    // Store the created LOD object
    this.objectLODs.set(object.celestialObjectId, lod);

    // Add debug label if enabled
    if (this.debugEnabled) {
      this._updateOrCreateDebugLabel(object.celestialObjectId, lod);
    }

    return lod;
  }

  /**
   * Update LOD levels based on camera position
   */
  update(): void {
    this.objectLODs.forEach((lod, objectId) => {
      // THREE.LOD.update() handles distance checks and switches levels
      // It requires the camera to be passed
      lod.update(this.camera);

      // Update debug labels if enabled
      if (this.debugEnabled) {
        this._updateOrCreateDebugLabel(objectId, lod);
      }
    });
  }

  /**
   * Remove an object's LOD and associated debug label.
   */
  remove(objectId: string): void {
    const lod = this.objectLODs.get(objectId);
    const debugLabel = this.debugLabels.get(objectId);

    if (debugLabel) {
      // The sprite is parented to the LOD, so removing LOD removes the sprite implicitly.
      // We just need to dispose the label's resources.
      disposeDebugLabel(debugLabel);
      this.debugLabels.delete(objectId);
    }

    if (lod) {
      // Important: Traverse and dispose geometry/material of *all levels* managed by this LOD
      lod.levels.forEach((levelData) => {
        levelData.object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat?.dispose());
            } else if (child.material) {
              child.material.dispose();
            }
          }
          // Handle Points material/geometry if necessary
          if (child instanceof THREE.Points) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat?.dispose());
            } else if (child.material) {
              child.material.dispose();
            }
          }
        });
      });
      this.objectLODs.delete(objectId);
      // Note: We don't remove the LOD object from the scene here,
      // that responsibility lies with the ObjectManager which added it.
    }
  }

  /**
   * Clear all managed LODs and debug labels.
   */
  clear(): void {
    // Dispose all debug labels first
    this.debugLabels.forEach(disposeDebugLabel);
    this.debugLabels.clear();

    // Remove and dispose resources for all LOD objects
    // Need to copy keys as `remove` modifies the map
    const objectIds = Array.from(this.objectLODs.keys());
    objectIds.forEach((id) => this.remove(id));
    // Should be empty now, but clear just in case
    this.objectLODs.clear();
  }

  /**
   * Retrieves the currently active LOD level index for a given object.
   * @param objectId The ID of the celestial object.
   * @returns The current LOD level index (0 is highest detail), or undefined if the object is not found.
   */
  getCurrentLODLevel(objectId: string): number | undefined {
    const lod = this.getLODById(objectId);
    // THREE.LOD objects have a getCurrentLevel method
    return lod?.getCurrentLevel();
  }

  /**
   * Retrieves the THREE.LOD object for a given object ID.
   * @param objectId The ID of the celestial object.
   * @returns The corresponding THREE.LOD object, or null if not found.
   */
  getLODById(objectId: string): THREE.LOD | null {
    return this.objectLODs.get(objectId) || null;
  }
}
