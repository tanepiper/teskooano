import * as THREE from "three";
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

  /** Performance optimization: throttle occlusion checks */
  private occlusionCheckCounter = 0;
  private readonly OCCLUSION_CHECK_FREQUENCY = 10; // Check every 10 frames

  /** Performance optimization: limit occlusion tests per frame */
  private readonly MAX_OCCLUSION_TESTS_PER_FRAME = 5;
  private labelCheckQueue: string[] = [];
  private occlusionResults: Map<
    string,
    { result: boolean; timestamp: number }
  > = new Map();
  private readonly OCCLUSION_CACHE_DURATION = 500; // Cache results for 500ms

  /**
   * @param scene The Three.js scene, optional for layers that add elements to other objects.
   */
  constructor(scene?: THREE.Scene) {
    this.scene = scene;
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
    camera: THREE.Camera,
    centralBody: THREE.Object3D,
    sceneLevels: VisibilityLevel[],
    valueSelector: (element: HTMLElement) => number,
  ): void {
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    const cameraDistSceneUnits = cameraPosition.distanceTo(
      centralBody.position,
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
    camera: THREE.Camera,
    centralBody?: THREE.Object3D,
    objectManager?: any,
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
    labelPosition: THREE.Vector3,
    camera: THREE.Camera,
    objectManager?: ObjectManager,
    labelObjectId?: string,
  ): boolean {
    if (!objectManager) return false;

    // Check cache first
    const cached = this.occlusionResults.get(labelId);
    const now = Date.now();
    if (cached && now - cached.timestamp < this.OCCLUSION_CACHE_DURATION) {
      return cached.result;
    }

    // Spatial culling: quick distance check
    const cameraPosition = this.tempVector.clone();
    camera.getWorldPosition(cameraPosition);
    const distance = cameraPosition.distanceTo(labelPosition);

    // If label is very close to camera, it's unlikely to be occluded
    if (distance < 10) {
      this.occlusionResults.set(labelId, { result: false, timestamp: now });
      return false;
    }

    // Throttling: only check a limited number of labels per frame
    this.occlusionCheckCounter++;
    const shouldCheckThisFrame =
      this.occlusionCheckCounter % this.OCCLUSION_CHECK_FREQUENCY === 0;

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
      testsPerformed < this.MAX_OCCLUSION_TESTS_PER_FRAME
    ) {
      const queuedLabelId = this.labelCheckQueue.shift()!;
      if (queuedLabelId === labelId) {
        // Perform the actual occlusion test
        const result = this.performOcclusionTest(
          labelPosition,
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
    labelPosition: THREE.Vector3,
    camera: THREE.Camera,
    objectManager: ObjectManager,
    labelObjectId?: string,
  ): boolean {
    // Get camera world position
    const cameraPosition = this.tempVector.clone();
    camera.getWorldPosition(cameraPosition);

    // Calculate direction from camera to label
    const direction = labelPosition.clone().sub(cameraPosition).normalize();
    const distance = cameraPosition.distanceTo(labelPosition);

    // Set up the raycaster
    this.raycaster.set(cameraPosition, direction);
    this.raycaster.far = distance - 0.1; // Stop just before the label

    // Get all celestial objects for intersection testing
    const allObjects = objectManager.getLatestRenderableObjects();
    const intersectableObjects: THREE.Object3D[] = [];

    Object.keys(allObjects).forEach((objectId) => {
      // Skip the object this label belongs to (don't occlude with self)
      if (labelObjectId && objectId === labelObjectId) return;

      const mesh = objectManager.getObject(objectId);
      if (mesh && mesh.visible) {
        // Only test against objects that are reasonably close to the ray path
        const objectPosition = mesh.position;
        const rayToObjectDistance = this.tempVector
          .copy(cameraPosition)
          .add(direction.clone().multiplyScalar(distance * 0.5))
          .distanceTo(objectPosition);

        // Only include objects that could realistically block this ray
        if (rayToObjectDistance < distance * 0.5) {
          intersectableObjects.push(mesh);
          mesh.traverse((child) => {
            if (child.type === "Mesh" || child.type === "LOD") {
              intersectableObjects.push(child);
            }
          });
        }
      }
    });

    // Perform the intersection test
    const intersections = this.raycaster.intersectObjects(
      intersectableObjects,
      false,
    );

    // If we hit something, the label is occluded
    return intersections.length > 0;
  }

  /**
   * Legacy method for backward compatibility - now uses optimized version
   * @deprecated Use isLabelOccludedOptimized instead
   */
  protected isLabelOccluded(
    labelPosition: THREE.Vector3,
    camera: THREE.Camera,
    objectManager?: ObjectManager,
    labelObjectId?: string,
  ): boolean {
    // Generate a simple ID based on position for legacy calls
    const labelId = `${labelPosition.x.toFixed(1)},${labelPosition.y.toFixed(1)},${labelPosition.z.toFixed(1)}`;
    return this.isLabelOccludedOptimized(
      labelId,
      labelPosition,
      camera,
      objectManager,
      labelObjectId,
    );
  }
}
