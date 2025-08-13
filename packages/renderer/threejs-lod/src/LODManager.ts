import * as THREE from "three";
import type {
  RenderableCelestialObject,
  DeviceTier,
} from "@teskooano/data-types";

import type { LODLevel, DebugLabel } from "./lod-manager";

import { StateAccessor, StateSubscriptionMixin } from "@teskooano/core-state";

import {
  createDebugLabel,
  updateDebugLabel,
  disposeDebugLabel,
  setDebugLabelVisibility,
} from "./lod-manager";

import { rendererEvents } from "@teskooano/renderer-threejs-core";

/**
 * Manages Level of Detail (LOD) for celestial objects by creating THREE.LOD instances
 * based on levels provided by specific CelestialRenderers.
 */
export class LODManager extends StateSubscriptionMixin {
  private camera: THREE.PerspectiveCamera;
  private objectLODs: Map<string, THREE.LOD> = new Map();
  private debugLabels: Map<string, DebugLabel> = new Map();
  private debugEnabled: boolean = false;
  private currentProfile: DeviceTier = "medium";
  private performanceOptimization: any = null;

  constructor(camera: THREE.PerspectiveCamera) {
    super();
    this.camera = camera;

    this.currentProfile =
      StateAccessor.getCurrentSimulationState().performanceProfile;

    this.subscribeToState(StateAccessor.getSimulationStateStream(), (state) => {
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
  createAndRegisterLOD(
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ): THREE.LOD {
    // Apply performance-based scaling to distances
    const scaledLevels = levels.map((level) => ({
      ...level,
      distance: level.distance * this.getLODScaleFactor(),
    }));

    const lod = new THREE.LOD();
    scaledLevels.forEach((level) => {
      lod.addLevel(level.object, level.distance);
    });

    this.objectLODs.set(object.id, lod);
    return lod;
  }

  /**
   * Updates all registered LOD objects based on the current camera position.
   * This method should be called every frame from the main render pipeline.
   */
  update(): void {
    this.objectLODs.forEach((lod) => {
      lod.update(this.camera);
    });

    if (this.debugEnabled) {
      this.updateDebugLabels();
    }
  }

  /**
   * Removes an LOD instance from management and disposes of its resources.
   * @param objectId The ID of the celestial object whose LOD should be removed.
   */
  removeLOD(objectId: string): void {
    const lod = this.objectLODs.get(objectId);
    if (lod) {
      // Dispose of all levels
      lod.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      this.objectLODs.delete(objectId);

      // Remove debug label if it exists
      const debugLabel = this.debugLabels.get(objectId);
      if (debugLabel) {
        disposeDebugLabel(debugLabel);
        this.debugLabels.delete(objectId);
      }
    }
  }

  /**
   * Alias for removeLOD to match the interface expected by ObjectLifecycleManager.
   * @param objectId The ID of the celestial object whose LOD should be removed.
   */
  remove(objectId: string): void {
    this.removeLOD(objectId);
  }

  /**
   * Gets the current LOD level for an object by ID.
   * @param objectId The ID of the celestial object.
   * @returns The current LOD level (0 for closest, higher for farther), or undefined if not found.
   */
  getCurrentLODLevel(objectId: string): number | undefined {
    const lod = this.objectLODs.get(objectId);
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
   * Toggles debug mode, which displays labels showing the current LOD level for each object.
   * @param enabled Whether debug mode should be enabled.
   */
  setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;

    if (enabled) {
      // Create debug labels for existing LODs
      this.objectLODs.forEach((lod, objectId) => {
        if (!this.debugLabels.has(objectId)) {
          const label = createDebugLabel();
          this.debugLabels.set(objectId, label);
        }
      });
    } else {
      // Remove all debug labels
      this.debugLabels.forEach((label) => {
        disposeDebugLabel(label);
      });
      this.debugLabels.clear();
    }
  }

  /**
   * Updates the positions and content of debug labels to match the current LOD states.
   */
  private updateDebugLabels(): void {
    this.objectLODs.forEach((lod, objectId) => {
      let label = this.debugLabels.get(objectId);
      if (!label) {
        label = createDebugLabel();
        this.debugLabels.set(objectId, label);
      }

      updateDebugLabel(label, lod, this.camera.position);
    });
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
   * Cleans up all resources used by the LODManager.
   * This should be called when the manager is no longer needed.
   */
  dispose(): void {
    // Remove all LODs
    this.objectLODs.forEach((lod, objectId) => {
      this.removeLOD(objectId);
    });

    // Clear maps
    this.objectLODs.clear();
    this.debugLabels.clear();
  }
}
