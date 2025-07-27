import * as THREE from "three";
import { OSVector3 } from "@teskooano/core-math";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-types";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";

/**
 * Defines the structure for a component that can be registered with the CSS2DManager.
 */
export interface UIRegistryComponent {
  tagName: string;
  componentClass: CustomElementConstructor;
}

/**
 * Configuration for a single visibility level.
 */
export interface VisibilityLevel {
  cameraDistScene: number;
  minLabelScene: number;
}

export abstract class BaseLabelLayer {
  protected elements: Map<string, CSS2DObject> = new Map();
  public isVisible: boolean = true;
  protected scene?: THREE.Scene;

  /** Raycaster for occlusion testing */
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  /** Reusable vector for calculations */
  private tempVector = new THREE.Vector3();
  // Pre-allocated vectors for performance in occlusion testing
  private _tempVector3_1 = new THREE.Vector3();
  private _tempVector3_2 = new THREE.Vector3();
  private _tempVector3_3 = new THREE.Vector3();

  /** Performance optimization: throttle occlusion checks */
  private occlusionCheckCounter = 0;

  /** Public occlusion configuration options */
  public occlusionConfig = {
    /** Check frequency: how often to perform occlusion tests (in frames) */
    checkFrequency: 60, // Check every 60 frames (once per second at 60fps)

    /** Maximum number of occlusion tests to perform per frame */
    maxTestsPerFrame: 3,

    /** How long to cache occlusion results (in milliseconds) */
    cacheDuration: 2000, // Cache results for 2 seconds

    /** Distance threshold for skipping occlusion tests on nearby labels (in scene units) */
    nearbyDistanceThreshold: 50,

    /** Whether occlusion checking is enabled */
    enabled: true,
  };

  private labelCheckQueue: string[] = [];
  private occlusionResults: Map<
    string,
    { result: boolean; timestamp: number }
  > = new Map();

  /**
   * @param scene The Three.js scene, optional for layers that add elements to other objects.
   * @param occlusionOptions Optional configuration for occlusion testing performance
   */
  constructor(
    scene?: THREE.Scene,
    occlusionOptions?: {
      checkFrequency?: number;
      maxTestsPerFrame?: number;
      cacheDuration?: number;
      nearbyDistanceThreshold?: number;
      enabled?: boolean;
    },
  ) {
    this.scene = scene;

    // Apply occlusion options if provided
    if (occlusionOptions) {
      if (occlusionOptions.checkFrequency !== undefined) {
        this.occlusionConfig.checkFrequency = occlusionOptions.checkFrequency;
      }
      if (occlusionOptions.maxTestsPerFrame !== undefined) {
        this.occlusionConfig.maxTestsPerFrame =
          occlusionOptions.maxTestsPerFrame;
      }
      if (occlusionOptions.cacheDuration !== undefined) {
        this.occlusionConfig.cacheDuration = occlusionOptions.cacheDuration;
      }
      if (occlusionOptions.nearbyDistanceThreshold !== undefined) {
        this.occlusionConfig.nearbyDistanceThreshold =
          occlusionOptions.nearbyDistanceThreshold;
      }
      if (occlusionOptions.enabled !== undefined) {
        this.occlusionConfig.enabled = occlusionOptions.enabled;
      }
    }

    // Configure raycaster for better performance
    this.raycaster.far = Infinity;
    this.raycaster.near = 0;
  }

  /**
   * Specifies the custom elements required by this layer.
   * @returns An array of component definitions.
   */
  public getRequiredComponents(): UIRegistryComponent[] {
    return [];
  }

  /**
   * Toggles the visibility of all labels in this layer.
   * @param visible The desired visibility state.
   */
  public setVisibility(visible: boolean): void {
    this.isVisible = visible;
    this.elements.forEach((element) => {
      element.visible = visible;
    });
  }

  public removeElement(id: string): void {
    const element = this.elements.get(id);
    if (element) {
      element.removeFromParent();
      this.elements.delete(id);
    }
  }

  public clear(): void {
    this.elements.forEach((element) => {
      element.removeFromParent();
    });
    this.elements.clear();
  }

  /**
   * Converts a value from Astronomical Units (AU) into the renderer's internal scene units.
   * @param au - The value in AU.
   * @returns The equivalent value in scene units.
   */
  protected auToSceneUnits(au: number): number {
    return au * AU_METERS * METERS_TO_SCENE_UNITS;
  }

  /**
   * Converts a value from the renderer's internal scene units into Astronomical Units (AU).
   * @param sceneUnits - The value in scene units.
   * @returns The equivalent value in AU.
   */
  protected sceneUnitsToAu(sceneUnits: number): number {
    // This is the mathematical inverse of auToSceneUnits.
    return sceneUnits / (AU_METERS * METERS_TO_SCENE_UNITS);
  }

  /**
   * A generic update handler that toggles element visibility based on a set of distance-based levels.
   *
   * @param camera - The scene camera.
   * @param centralBody - The object from which distance is measured.
   * @param sceneLevels - An array of pre-calculated visibility levels.
   * @param valueSelector - A function that extracts the numeric value to check from a label's HTML element.
   */
  protected updateVisibilityFromLevels(
    camera: THREE.PerspectiveCamera,
    centralBody: OSVector3,
    sceneLevels: VisibilityLevel[],
    valueSelector: (element: HTMLElement) => number,
  ): void {
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    const cameraDistSceneUnits = cameraPosition.distanceTo(
      centralBody.toThreeJS(),
    );

    this.elements.forEach((label) => {
      const value = valueSelector(label.element);
      let visible = true;

      const applicableLevel = sceneLevels.find(
        (level) => cameraDistSceneUnits > level.cameraDistScene,
      );

      if (applicableLevel) {
        if (value < applicableLevel.minLabelScene) {
          visible = false;
        }
      }

      label.element.toggleAttribute("visible", visible);
    });
  }

  public getElement(id: string): CSS2DObject | undefined {
    return this.elements.get(id);
  }

  public hasElements(): boolean {
    return this.elements.size > 0;
  }

  /**
   * Default implementation does nothing.
   * Subclasses should override this method to implement LOD or other updates.
   */
  public update(
    camera: THREE.PerspectiveCamera,
    centralBody: OSVector3,
    objectManager: ObjectManager,
  ): void {}

  /**
   * Optimized occlusion checking with spatial culling and caching.
   * Only performs expensive raycasting when necessary.
   *
   * @param labelId Unique identifier for the label
   * @param labelPosition The world position of the label
   * @param camera The camera to raycast from
   * @param objectManager The ObjectManager containing all celestial meshes
   * @param labelObjectId Optional ID of the object the label belongs to
   * @returns true if the label is behind a celestial object and should be hidden
   */
  protected isLabelOccludedOptimized(
    labelId: string,
    labelPosition: OSVector3,
    camera: THREE.PerspectiveCamera,
    objectManager: ObjectManager,
    labelObjectId: string,
  ): boolean {
    // Check if occlusion is enabled
    if (!this.occlusionConfig.enabled) {
      return false;
    }

    // Check cache first
    const cached = this.occlusionResults.get(labelId);
    const now = Date.now();
    if (cached && now - cached.timestamp < this.occlusionConfig.cacheDuration) {
      return cached.result;
    }

    // Spatial culling: quick distance check
    // Reuse _tempVector3_1 for cameraPosition
    const cameraPosition = this._tempVector3_1;
    camera.getWorldPosition(cameraPosition);
    // Reuse _tempVector3_2 for label position conversion
    const labelPosThree = labelPosition.toThreeJS();
    const distance = cameraPosition.distanceTo(labelPosThree);

    // If label is very close to camera, it's unlikely to be occluded
    if (distance < this.occlusionConfig.nearbyDistanceThreshold) {
      this.occlusionResults.set(labelId, { result: false, timestamp: now });
      return false;
    }

    // Throttling: only check a limited number of labels per frame
    this.occlusionCheckCounter++;
    const shouldCheckThisFrame =
      this.occlusionCheckCounter % this.occlusionConfig.checkFrequency === 0;

    if (!shouldCheckThisFrame) {
      // If we have a cached result, use it; otherwise assume not occluded
      return cached ? cached.result : false;
    }

    // Add to queue for processing, but limit how many we process per frame
    if (!this.labelCheckQueue.includes(labelId)) {
      this.labelCheckQueue.push(labelId);
    }

    // Process queue up to the limit
    let testsPerformed = 0;
    while (
      this.labelCheckQueue.length > 0 &&
      testsPerformed < this.occlusionConfig.maxTestsPerFrame
    ) {
      const queuedLabelId = this.labelCheckQueue.shift()!;
      if (queuedLabelId === labelId) {
        // Perform the actual occlusion test
        const result = this.performOcclusionTest(
          labelPosThree, // Pass the pre-converted Three.js vector
          camera,
          objectManager,
          labelObjectId,
        );
        this.occlusionResults.set(labelId, { result, timestamp: now });
        testsPerformed++;
        return result;
      }
      testsPerformed++;
    }

    // If we didn't get to test this label this frame, return cached result or false
    return cached ? cached.result : false;
  }

  /**
   * Performs the actual raycasting occlusion test.
   * Separated from the main method for cleaner code organization.
   */
  private performOcclusionTest(
    labelPosition: THREE.Vector3, // Now expects a Three.js vector directly
    camera: THREE.PerspectiveCamera,
    objectManager: ObjectManager,
    labelObjectId: string,
  ): boolean {
    // Validate inputs
    if (!camera || !labelPosition || !objectManager) {
      return false;
    }

    // Get camera world position, reuse _tempVector3_1
    const cameraPosition = this._tempVector3_1;
    try {
      camera.getWorldPosition(cameraPosition);
    } catch (error) {
      // If camera doesn't have valid world position, skip occlusion test
      return false;
    }

    // Calculate direction from camera to label, reuse _tempVector3_2 for direction
    const direction = this._tempVector3_2
      .copy(labelPosition)
      .sub(cameraPosition)
      .normalize();
    const distance = cameraPosition.distanceTo(labelPosition);

    // Set up the raycaster
    this.raycaster.set(cameraPosition, direction);
    this.raycaster.far = distance - 0.1; // Stop just before the label
    this.raycaster.camera = camera; // Required for sprite intersection tests

    // Get all celestial objects for intersection testing
    const allObjects = objectManager.getLatestRenderableObjects();
    const intersectableObjects: THREE.Object3D[] = [];

    Object.keys(allObjects).forEach((objectId) => {
      // Skip the object this label belongs to (don't occlude with self)
      if (labelObjectId && objectId === labelObjectId) return;

      const mesh = objectManager.getObject(objectId);
      if (mesh && mesh.visible && mesh.matrixWorld) {
        // Only test against objects that are reasonably close to the ray path
        const objectPosition = this._tempVector3_3.copy(mesh.position);
        if (objectPosition) {
          const rayToObjectDistance = this._tempVector3_1 // Reuse tempVector3_1
            .copy(cameraPosition)
            .add(this._tempVector3_2.clone().multiplyScalar(distance * 0.5))
            .distanceTo(objectPosition);

          // Only include objects that could realistically block this ray
          if (rayToObjectDistance < distance * 0.5) {
            // Add the main mesh and its immediate children if they are meshes or LODs
            intersectableObjects.push(mesh);
            mesh.traverse((child) => {
              if (
                child &&
                child !== mesh && // Avoid adding the parent mesh twice
                child.matrixWorld &&
                (child.type === "Mesh" ||
                  child.type === "LOD" ||
                  child.type === "Sprite") // Include sprites as they can occlude
              ) {
                intersectableObjects.push(child);
              }
            });
          }
        }
      }
    });

    try {
      // Perform the intersection test
      const intersections = this.raycaster.intersectObjects(
        intersectableObjects,
        false,
      );

      // If we hit something, the label is occluded
      return intersections.length > 0;
    } catch (error) {
      // If intersection test fails, assume not occluded
      console.warn("Occlusion test failed:", error);
      return false;
    }
  }

  /**
   * Convenience method to enable/disable occlusion checking
   */
  public setOcclusionEnabled(enabled: boolean): void {
    this.occlusionConfig.enabled = enabled;
  }

  /**
   * Convenience method to set occlusion check frequency
   */
  public setOcclusionCheckFrequency(frequency: number): void {
    this.occlusionConfig.checkFrequency = frequency;
  }

  /**
   * Convenience method to set maximum occlusion tests per frame
   */
  public setMaxOcclusionTestsPerFrame(maxTests: number): void {
    this.occlusionConfig.maxTestsPerFrame = maxTests;
  }

  /**
   * Convenience method to set occlusion cache duration
   */
  public setOcclusionCacheDuration(duration: number): void {
    this.occlusionConfig.cacheDuration = duration;
  }

  /**
   * Convenience method to set nearby distance threshold
   */
  public setNearbyDistanceThreshold(threshold: number): void {
    this.occlusionConfig.nearbyDistanceThreshold = threshold;
  }

  /**
   * Get current occlusion configuration
   */
  public getOcclusionConfig() {
    return { ...this.occlusionConfig };
  }
}
