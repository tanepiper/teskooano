import { OSVector3 } from "@teskooano/core-math";
import { accelerationVectors$ } from "@teskooano/core-state";

import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LightManager, LODManager } from "@teskooano/renderer-threejs-effects";
import type { CSS2DManager } from "@teskooano/renderer-threejs-interaction";
import { CSS2DLayerType } from "@teskooano/renderer-threejs-interaction";
import type { Observable, Subscription } from "rxjs";
import { distinctUntilChanged, tap } from "rxjs/operators";
import * as THREE from "three";
import {
  MeshFactory,
  ObjectLifecycleManager,
  RendererUpdater,
} from "./object-manager";

import { BasicCelestialRenderer } from "@teskooano/celestials-base";

import { LabelVisibilityManager } from "./types";
import {
  CelestialStatus,
  CelestialType,
  LODLevel,
} from "@teskooano/celestial-object";

/**
 * @class ObjectManager
 * @description Orchestrates the management of Three.js scene objects representing celestial bodies.
 *              It coordinates various specialized managers for object lifecycle (creation, update, removal),
 *              visual effects (LOD, lensing, debris), debug visualizations (acceleration vectors),
 *              and interactions (labels via CSS2DManager).
 *              It subscribes to state updates (renderable objects, acceleration) and events (destruction)
 *              to keep the Three.js scene synchronized with the simulation state.
 */
export class ObjectManager {
  /** @internal Map storing the primary Three.js Object3D for each celestial object ID. */
  private objects: Map<string, THREE.Object3D> = new Map();
  /** @internal Reference to the main Three.js scene. */
  private scene: THREE.Scene;
  /** @internal Reference to the main camera, used for LOD and potentially other effects. */
  private camera: THREE.PerspectiveCamera;
  /** @internal Reference to the WebGLRenderer, potentially used by sub-managers (e.g., lensing). */
  private renderer: THREE.WebGLRenderer | null = null;
  /** @internal Manages Levels of Detail for objects based on camera distance. */
  private lodManager: LODManager;
  /** @internal Map storing active BasicCelestialRenderer instances, keyed by object ID. */
  private activeRenderers: Map<string, BasicCelestialRenderer> = new Map();

  /** @internal Observable stream of renderable object data from the core state. */
  private renderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;
  /** @internal Stores the latest snapshot of renderable objects received from the stream. */
  private latestRenderableObjects: Record<string, RenderableCelestialObject> =
    {};

  /** @internal Manages light sources, particularly star lights. */
  private lightManager: LightManager;
  /** @internal Manages CSS2D labels and potentially other 2D elements, optional. */
  private css2DManager?: LabelVisibilityManager & CSS2DManager;

  /** @internal Factory responsible for creating the appropriate Three.js mesh for each celestial object type. */
  private meshFactory: MeshFactory;
  /** @internal Updates specialized renderers (e.g., for stars, planets) each frame. */
  private rendererUpdater: RendererUpdater;
  /** @internal Manages the core logic of adding, updating, and removing objects from the scene based on state. */
  private objectLifecycleManager: ObjectLifecycleManager;

  /** @internal RxJS subscription to the renderable objects stream. */
  private objectsSubscription: Subscription | null = null;

  /** @internal Reusable vector to avoid allocations in loops. */
  private tempVector3 = new THREE.Vector3();

  /**
   * Public getter for the latest renderable objects as a ReadonlyMap.
   */
  public getRenderableObjectsMap(): ReadonlyMap<
    string,
    RenderableCelestialObject
  > {
    return new Map(Object.entries(this.latestRenderableObjects));
  }

  /**
   * Creates an instance of ObjectManager.
   *
   * @param scene - The main Three.js scene.
   * @param camera - The main perspective camera.
   * @param renderableObjects$ - Observable stream of renderable celestial object data.
   * @param lightManager - The LightManager instance.
   * @param renderer - The WebGLRenderer instance.
   * @param css2DManager - Optional manager for CSS2D labels and interactions.
   */
  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
    lightManager: LightManager,
    renderer: THREE.WebGLRenderer,
    css2DManager?: LabelVisibilityManager & CSS2DManager,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderableObjects$ = renderableObjects$;
    this.lightManager = lightManager;
    this.renderer = renderer;
    this.css2DManager = css2DManager;

    this.lodManager = new LODManager(camera);

    // Setup the MeshFactory with dependencies
    this.meshFactory = new MeshFactory({
      lodManager: this.lodManager,
      camera: this.camera,
    });

    // Setup the ObjectLifecycleManager with dependencies
    this.objectLifecycleManager = new ObjectLifecycleManager({
      objects: this.objects,
      activeRenderers: this.activeRenderers,
      scene: this.scene,
      meshFactory: this.meshFactory,
      lodManager: this.lodManager,
      lightManager: this.lightManager,
      renderer: this.renderer,
      camera: this.camera,
      css2DManager: this.css2DManager,
    });

    // Setup other managers
    this.rendererUpdater = new RendererUpdater({
      activeRenderers: this.activeRenderers,
    });

    // Start listening to state changes and events
    this.subscribeToStateChanges();
  }

  /**
   * @internal Subscribes to the renderable objects stream from the core state.
   */
  private subscribeToStateChanges(): void {
    this.objectsSubscription = this.renderableObjects$
      .pipe(
        distinctUntilChanged((prev, curr) => {
          // Only stringify if both are non-null to avoid errors if the stream starts with null/undefined
          if (prev && curr) {
            return JSON.stringify(prev) === JSON.stringify(curr);
          }
          return prev === curr; // Standard reference check if one is null/undefined
        }),
      )
      .subscribe((objects: Record<string, RenderableCelestialObject>) => {
        this.latestRenderableObjects = objects;
        this.objectLifecycleManager.syncObjectsWithState(
          this.latestRenderableObjects,
        );
      });
  }

  /**
   * Sets the debug mode for mesh creation.
   * Enabling this will recreate all meshes with debug information (e.g., wireframes).
   * @param enabled - Whether to enable debug mode.
   */
  public setDebugMode(enabled: boolean): void {
    if (this.meshFactory) {
      this.meshFactory.setDebugMode(enabled);
      this.recreateAllMeshes(); // Recreate meshes to apply debug visuals
    }
  }

  /**
   * Retrieves the main Three.js Object3D associated with a celestial object ID.
   *
   * @param id - The celestial object ID.
   * @returns The corresponding Object3D, or null if not found.
   */
  getObject(id: string): THREE.Object3D | null {
    const renderer = this.activeRenderers.get(id);
    return renderer ? renderer.lod : null;
  }

  /**
   * Updates all managed renderers and systems that require frame-by-frame updates.
   * This includes LOD, specialized celestial renderers, label visibility, and debris effects.
   *
   * @param time - The current simulation time (or frame time).
   * @param lightSources - Map of active light sources and their data.
   */
  updateRenderers(
    time: number,
    lightSources: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
  ): void {
    // Update LOD system first
    this.lodManager.update();

    // Update specialized renderers (stars, planets, etc.)
    this.rendererUpdater.updateRenderers(time, lightSources);

    // Update visibility of CSS2D labels based on LOD and object type
    this.updateLabelVisibility();
  }

  /**
   * @internal Updates the visibility of CSS2D labels based on object type and LOD levels.
   *          Hides labels for destroyed objects or objects at high LOD distances (e.g., distant moons).
   */
  private updateLabelVisibility(): void {
    if (!this.css2DManager) return; // Skip if no CSS2D manager

    // First, check if the entire celestial labels layer is globally visible
    const isCelestialLayerGloballyVisible = this.css2DManager.isLayerVisible(
      CSS2DLayerType.CELESTIAL_LABELS,
    );

    // If the layer is globally hidden, ensure all our managed labels are also explicitly hidden.
    // This prevents this method from re-showing labels that the user globally hid.
    if (!isCelestialLayerGloballyVisible) {
      const allRenderableObjects = this.latestRenderableObjects;
      for (const objectId in allRenderableObjects) {
        // Only act if the object is one that *could* have a label this manager handles
        const objectData = allRenderableObjects[objectId];
        if (objectData && this.objects.has(objectId)) {
          // Check if we manage this object
          this.css2DManager.hideLabel(
            CSS2DLayerType.CELESTIAL_LABELS,
            objectId,
          );
        }
      }
      return; // Do not proceed with individual show/hide logic if layer is off
    }

    // If the layer is globally visible, proceed with LOD-based and type-based visibility
    const allRenderableObjects = this.latestRenderableObjects;

    for (const objectId in allRenderableObjects) {
      const objectData = allRenderableObjects[objectId];

      // Hide label if object is destroyed or its mesh doesn't exist
      if (
        objectData.status === CelestialStatus.DESTROYED ||
        !this.objects.has(objectId)
      ) {
        this.css2DManager.hideLabel(CSS2DLayerType.CELESTIAL_LABELS, objectId);
        continue;
      }

      let showLabel = false;
      const type = objectData.type;

      // Determine default visibility based on type
      if (
        type === CelestialType.STAR ||
        type === CelestialType.PLANET ||
        type === CelestialType.GAS_GIANT ||
        type === CelestialType.OORT_CLOUD || // Example: Always show Oort cloud representation label?
        type === CelestialType.DWARF_PLANET ||
        type === CelestialType.ASTEROID_FIELD
      ) {
        showLabel = true;
      } else if (
        // For moons and rings, only show label if parent is close (low LOD level)
        type === CelestialType.MOON ||
        type === CelestialType.RING_SYSTEM
      ) {
        if (objectData.parentId) {
          const parentLODLevel = this.lodManager.getCurrentLODLevel(
            objectData.parentId,
          );
          // Show if parent LOD is 0 or 1 (closest levels)
          if (parentLODLevel !== undefined && parentLODLevel <= 1) {
            showLabel = true;
          }
        }
      }
      // Add more specific logic here if needed

      // Apply visibility change
      if (showLabel) {
        // Only show if the layer is globally visible (redundant check now, but safe)
        if (isCelestialLayerGloballyVisible) {
          this.css2DManager.showLabel(
            CSS2DLayerType.CELESTIAL_LABELS,
            objectId,
          );
        }
      } else {
        this.css2DManager.hideLabel(CSS2DLayerType.CELESTIAL_LABELS, objectId);
      }
    }
  }

  /**
   * @internal Placeholder for getting delta time. Replace with actual clock/timer implementation.
   * @returns A fixed delta time value (e.g., for 60fps).
   */
  private getDeltaTime(): number {
    // TODO: Replace this with a proper delta time calculation from a THREE.Clock or similar
    return 0.016;
  }

  /**
   * Placeholder update method, potentially for internal ObjectManager logic if needed.
   * Currently unused.
   */
  update(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): void {
    // If the ObjectManager itself needs per-frame updates, add logic here.
    // Currently, updates are delegated to sub-managers via updateRenderers.
  }

  /**
   * Cleans up all resources managed by this ObjectManager and its sub-managers.
   * Unsubscribes from observables, disposes objects, clears maps.
   */
  dispose(): void {
    // Unsubscribe from all observables and event listeners
    this.objectsSubscription?.unsubscribe();
    this.objectsSubscription = null;

    // Dispose sub-managers in logical order (e.g., lifecycle last?)
    this.objectLifecycleManager.dispose(); // Disposes individual objects and their resources

    // Dispose renderers and clear their maps
    this.rendererUpdater.dispose();
    this.lodManager.clear();

    // Dispose active renderers
    this.activeRenderers.forEach((renderer) => renderer.dispose());
    this.activeRenderers.clear();

    // Clear the main object map (should be empty after lifecycle disposal, but good practice)
    this.objects.clear();
  }

  /**
   * Toggles debug visualization for the LOD manager.
   * @param enabled - True to show LOD debug helpers, false to hide.
   */
  toggleLODDebug(enabled: boolean): void {
    this.lodManager.toggleDebug(enabled);
  }

  /**
   * Directly adds a raw Three.js object to the scene managed by this ObjectManager.
   * Use with caution, as this bypasses the standard lifecycle management.
   * @param obj - The Object3D to add.
   */
  addRawObjectToScene(obj: THREE.Object3D): void {
    this.scene.add(obj);
  }

  /**
   * Directly removes a raw Three.js object from the scene managed by this ObjectManager.
   * Use with caution.
   * @param obj - The Object3D to remove.
   */
  removeRawObjectFromScene(obj: THREE.Object3D): void {
    // Ensure the object is actually a direct child of the scene before removing
    if (obj.parent === this.scene) {
      this.scene.remove(obj);
    }
  }

  /**
   * Forces disposal and recreation of all celestial object meshes.
   * Useful when global settings change that affect mesh generation (like debug mode).
   */
  public recreateAllMeshes(): void {
    // Dispose all current objects via the lifecycle manager
    this.objectLifecycleManager.dispose(); // This should also dispose BasicCelestialRenderers via activeRenderers
    // Immediately resync with the latest state to recreate objects
    // The syncObjectsWithState method in ObjectLifecycleManager will need to handle
    // creating new BasicCelestialRenderer instances.
    this.objectLifecycleManager.syncObjectsWithState(
      this.latestRenderableObjects,
    );
  }
}
