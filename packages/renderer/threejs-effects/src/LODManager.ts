import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
// Import LODLevel from the correct location (adjust path if necessary)
import type { LODLevel } from "@teskooano/systems-celestial";
// --- Import simulation state ---
import {
  simulationState,
  type PerformanceProfileType,
} from "@teskooano/core-state";
// --- End import ---

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
  private currentProfile: PerformanceProfileType = "medium"; // Store current profile
  private unsubscribeSimState: (() => void) | null = null; // For unsubscribing

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    // Get initial profile
    this.currentProfile = simulationState.get().performanceProfile;
    // Subscribe to profile changes
    this.unsubscribeSimState = simulationState.subscribe((state) => {
      if (state.performanceProfile !== this.currentProfile) {
        this.currentProfile = state.performanceProfile;
        // Note: Existing LOD objects won't automatically update distances.
        // A more complex implementation could potentially update them,
        // but for now, new objects will use the new profile.
      }
    });
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
    levels: LODLevel[],
  ): THREE.LOD {
    if (!levels || levels.length === 0) {
      throw new Error(
        `[LODManager] Cannot create LOD for ${object.celestialObjectId}: No LOD levels provided.`,
      );
    }

    const lod = new THREE.LOD();
    lod.name = `${object.celestialObjectId}-LODContainer`; // Add a name for debugging

    // --- Scale distances based on profile ---
    const scaleFactor = this.getLODScaleFactor();
    // --- End Scale ---

    levels.forEach((level) => {
      if (!level.object || typeof level.distance !== "number") {
        console.warn(
          `[LODManager] Invalid LOD level provided for ${object.celestialObjectId}:`,
          level,
        );
        // Skip invalid levels
        return;
      }
      // Apply scaling factor to the distance
      const scaledDistance = level.distance * scaleFactor;
      lod.addLevel(level.object, scaledDistance);
      // console.log(`[LODManager] Adding level for ${object.celestialObjectId} at scaled distance ${scaledDistance} (Original: ${level.distance}, Scale: ${scaleFactor})`);
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

    // If LOD exists, dispose its levels' resources before deleting from map
    if (lod) {
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
    // Unsubscribe from state changes
    this.unsubscribeSimState?.();
    this.unsubscribeSimState = null;
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

  /**
   * Determines the scaling factor for LOD distances based on the current profile.
   * Higher quality profiles use smaller distances (switch LODs sooner).
   * @returns The scaling factor (e.g., 1.0 for medium, 0.5 for cosmic).
   */
  private getLODScaleFactor(): number {
    switch (this.currentProfile) {
      case "low":
        return 1.5;
      case "medium":
        return 1.0;
      case "high":
        return 0.75;
      case "cosmic":
        return 0.5; // Switch levels much closer for max detail
      default:
        return 1.0; // Default to medium if profile is unknown
    }
  }
}
