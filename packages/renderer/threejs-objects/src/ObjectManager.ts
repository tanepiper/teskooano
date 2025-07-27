import { debugConfig, setVisualizationEnabled } from "@teskooano/core-debug";
import { OSVector3 } from "@teskooano/core-math";
import { StateAccessor, StateSubscriptionMixin } from "@teskooano/core-state";
import {
  CelestialStatus,
  CelestialType,
  type RenderableCelestialObject,
} from "@teskooano/data-types";
import {
  DestructionPayload,
  rendererEvents,
} from "@teskooano/renderer-threejs";
import type { Layer2DManager } from "@teskooano/renderer-threejs-labels";
import { CSS2DLayerType } from "@teskooano/renderer-threejs-labels";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { LODManager, LODLevel } from "@teskooano/renderer-threejs-lod";
import { 
  SceneGraphManager, 
  HierarchicalLODManager 
} from "@teskooano/renderer-threejs-core";

import type { Observable, Subscription } from "rxjs";
import * as THREE from "three";
import {
  AccelerationVisualizer,
  DebrisEffectManager,
  GravitationalLensingHandler,
  MeshFactory,
  ObjectLifecycleManager,
  RendererUpdater,
} from "./object-manager";
import type { CelestialRenderer } from "@teskooano/renderer-threejs-celestial";

/**
 * @internal Interface defining the required methods for managing label visibility.
 *          This allows decoupling from the full CSS2DManager if needed.
 */
interface LabelVisibilityManager {
  showInstance(layer: CSS2DLayerType, id: string): void;
  hideInstance(layer: CSS2DLayerType, id: string): void;
}

/**
 * @class ObjectManager
 * @description Orchestrates the management of Three.js scene objects representing celestial bodies.
 *              It coordinates various specialized managers for object lifecycle (creation, update, removal),
 *              visual effects (LOD, lensing, debris), debug visualizations (acceleration vectors),
 *              and interactions (labels via CSS2DManager).
 *              It subscribes to state updates (renderable objects, acceleration) and events (destruction)
 *              to keep the Three.js scene synchronized with the simulation state.
 */
export class ObjectManager extends StateSubscriptionMixin {
  /** @internal Map storing the primary Three.js Object3D for each celestial object ID. */
  private objects: Map<string, THREE.Object3D> = new Map();
  /** @internal Reference to the main Three.js scene. */
  private scene: THREE.Scene;
  /** @internal Reference to the main camera, used for LOD and potentially other effects. */
  private camera: THREE.PerspectiveCamera;
  /** @internal Reference to the WebGLRenderer, potentially used by sub-managers (e.g., lensing). */
  private renderer: THREE.WebGLRenderer;
  /** @internal Manages Levels of Detail for objects based on camera distance. */
  private lodManager: LODManager;
  /** @internal Manages the influence and calculation of the new component-based lighting system. */
  public lightingManager: LightingManager;
  /** @internal Map storing specialized renderers keyed by their specific type (e.g., GasGiantClass). */
  private celestialRenderers: Map<string, CelestialRenderer> = new Map();

  /** @internal Observable stream of renderable object data from the core state. */
  private renderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;
  /** @internal Stores the latest snapshot of renderable objects received from the stream. */
  private latestRenderableObjects: Record<string, RenderableCelestialObject> =
    {};

  /** @internal Manages CSS2D labels and potentially other 2D elements, optional. */
  private css2DManager?: LabelVisibilityManager & Layer2DManager;
  /** @internal Observable stream of acceleration vectors from the core state. */
  private acceleration$: Observable<Record<string, OSVector3>>;

  /** @internal Manages the visualization of acceleration vectors as arrows in the scene. */
  private accelerationVisualizer: AccelerationVisualizer;
  private accelerationSubscription: Subscription | null = null;

  /** @internal Handles gravitational lensing effects for massive objects like black holes. */
  private lensingHandler: GravitationalLensingHandler;
  /** @internal Factory responsible for creating the appropriate Three.js mesh for each celestial object type. */
  private meshFactory: MeshFactory;
  /** @internal Updates specialized renderers (e.g., for stars, planets) each frame. */
  private rendererUpdater: RendererUpdater;
  /** @internal Manages particle effects for object destruction events. */
  private objectLifecycleManager: ObjectLifecycleManager;
  private debrisEffectManager: DebrisEffectManager;

  private debugMode: boolean = false;
  private lastUpdateTime: number = 0;

  /** @internal Reusable vector to avoid allocations in loops. */
  private tempVector3 = new THREE.Vector3();

  /**
   * Public accessor for the camera.
   * @returns The THREE.PerspectiveCamera instance.
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Public accessor for the scene.
   * @returns The THREE.Scene instance.
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Public accessor for the latest renderable objects data.
   * @returns A record of `RenderableCelestialObject`.
   */
  public getLatestRenderableObjects(): Record<
    string,
    RenderableCelestialObject
  > {
    return this.latestRenderableObjects;
  }

  /**
   * Public accessor for the celestial renderers map.
   * @returns Map of celestial renderers keyed by object ID.
   */
  public getCelestialRenderers(): Map<string, CelestialRenderer> {
    return this.celestialRenderers;
  }

  /**
   * Creates an instance of ObjectManager.
   *
   * @param scene - The main Three.js scene.
   * @param camera - The main perspective camera.
   * @param renderableObjects$ - Observable stream of renderable celestial object data.
   * @param renderer - The WebGLRenderer instance.
   * @param css2DManager - Optional manager for CSS2D labels and interactions.
   * @param acceleration$ - Optional observable stream for acceleration vectors.
   * @param lightingManager - Optional lighting manager to use. If not provided, creates its own.
   * @param sceneGraphManager - Optional hierarchical scene graph manager.
   * @param hierarchicalLODManager - Optional hierarchical LOD manager.
   */
  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
    renderer: THREE.WebGLRenderer,
    css2DManager?: LabelVisibilityManager & Layer2DManager,
    acceleration$: Observable<
      Record<string, OSVector3>
    > = StateAccessor.getAccelerationVectorsStream(),
    lightingManager?: LightingManager,
    sceneGraphManager?: SceneGraphManager,
    hierarchicalLODManager?: HierarchicalLODManager,
  ) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.renderableObjects$ = renderableObjects$;
    this.renderer = renderer;
    this.css2DManager = css2DManager;
    this.acceleration$ = acceleration$; // Assign the observable

    // Use hierarchical LOD manager if provided, otherwise create standard LOD manager
    this.lodManager = hierarchicalLODManager || new LODManager(camera);
    this.lightingManager = lightingManager || new LightingManager(this.scene);
    this.lensingHandler = new GravitationalLensingHandler({
      celestialRenderers: this.celestialRenderers,
    });

    // Create LOD callback adapter
    const createLodCallback = hierarchicalLODManager
      ? (object: RenderableCelestialObject, levels: LODLevel[]) => {
          // Convert LOD levels to mesh format for hierarchical manager
          const meshes: { [key: string]: THREE.Object3D } = {};
          levels.forEach((level, index) => {
            switch (index) {
              case 0: meshes.high = level.object; break;
              case 1: meshes.medium = level.object; break;
              case 2: meshes.low = level.object; break;
              case 3: meshes.billboard = level.object; break;
            }
          });
          return hierarchicalLODManager.createAutoLOD(object, meshes);
        }
      : this.lodManager.createAndRegisterLOD.bind(this.lodManager);

    // Setup the MeshFactory with dependencies
    this.meshFactory = new MeshFactory({
      celestialRenderers: this.celestialRenderers,
      lodManager: this.lodManager,
      lightingManager: this.lightingManager,
      camera: this.camera,
      createLodCallback,
    });

    // Setup the ObjectLifecycleManager with dependencies including hierarchical managers
    this.objectLifecycleManager = new ObjectLifecycleManager({
      objects: this.objects,
      scene: this.scene,
      camera: this.camera,
      meshFactory: this.meshFactory,
      lodManager: this.lodManager,
      lightingManager: this.lightingManager,
      lensingHandler: this.lensingHandler,
      renderer: this.renderer,
      css2DManager: this.css2DManager,
      sceneGraphManager: sceneGraphManager, // NEW: Pass scene graph manager
      hierarchicalLODManager: hierarchicalLODManager, // NEW: Pass hierarchical LOD manager
    });

    // Setup other managers
    this.accelerationVisualizer = new AccelerationVisualizer({
      objects: this.objects,
    });
    this.rendererUpdater = new RendererUpdater({
      celestialRenderers: this.celestialRenderers,
      lightingManager: this.lightingManager,
    });

    this.debrisEffectManager = new DebrisEffectManager({ scene: this.scene });

    // Start listening to destruction events immediately
    this.subscribeToDestructionEvents();
    
    // Defer state subscription if hierarchical managers are provided
    // This allows the hierarchy to be set up first
    if (!sceneGraphManager && !hierarchicalLODManager) {
      this.subscribeToStateChanges();
      this.isSubscribedToState = true;
    }
  }

  /**
   * Starts the state subscription for object synchronization.
   * This can be called explicitly when using hierarchical managers.
   */
  public startStateSubscription(): void {
    if (!this.isSubscribedToState) {
      this.subscribeToStateChanges();
      this.isSubscribedToState = true;
    }
  }

  private isSubscribedToState: boolean = false;

  /**
   * @internal Subscribes to the renderable objects and acceleration vector streams from the core state.
   */
  private subscribeToStateChanges(): void {
    // Subscribe to renderable objects and sync the scene via ObjectLifecycleManager
    this.subscribeToState(
      this.renderableObjects$,
      (objects: Record<string, RenderableCelestialObject>) => {
        this.latestRenderableObjects = objects;
        this.objectLifecycleManager.syncObjectsWithState(
          this.latestRenderableObjects,
        );
      },
    );

    // No longer subscribe to acceleration here unconditionally
  }

  /**
   * @internal Subscribes to destruction events emitted via the rendererEvents bus.
   */
  private subscribeToDestructionEvents(): void {
    this.subscribeToState(
      rendererEvents.destruction$,
      (payload: DestructionPayload) => {
        const fullObject = this.latestRenderableObjects[payload.object.id];
        if (!fullObject) return;

        // The manager has its own internal check for whether effects are enabled.
        this.debrisEffectManager.createDebrisEffect({
          destroyedId: fullObject.celestialObjectId,
          survivorId: fullObject.parentId ?? "unknown",
          impactPosition: OSVector3.fromThreeJS(fullObject.position),
          relativeVelocity: new OSVector3().setZero(), // Placeholder
          destroyedRadius: fullObject.radius,
        });
      },
    );
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
    return this.objects.get(id) || null;
  }

  /**
   * Retrieves the primary central body of the system, typically the main star.
   * It finds the first star object that does not have a parent object.
   *
   * @returns The corresponding Object3D, or undefined if not found.
   */
  getCentralBody(): THREE.Object3D | undefined {
    // Find the sun (or primary star)
    const centralBodyId = Object.keys(this.latestRenderableObjects).find(
      (id) => {
        const obj = this.latestRenderableObjects[id];
        return (
          obj.type === CelestialType.STAR &&
          obj.status !== CelestialStatus.DESTROYED &&
          !obj.parentId // Assuming the primary star has no parent
        );
      },
    );

    if (centralBodyId) {
      return this.objects.get(centralBodyId) ?? undefined;
    }

    // Fallback to the first object if no primary star is found
    const firstId = Object.keys(this.latestRenderableObjects)[0];
    return this.objects.get(firstId) ?? undefined;
  }

  /**
   * Updates all specialized renderers (stars, planets, etc.).
   * @param time - The current simulation time.
   * @param timeScale - The current simulation time scale.
   * @param renderer - The WebGLRenderer instance.
   * @param scene - The main Three.js scene.
   * @param camera - The main perspective camera.
   */
  public updateRenderers(
    time: number,
    timeScale: number,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
    camera?: THREE.PerspectiveCamera,
  ): void {
    if (!this.camera) {
      if (!camera) return;
      this.camera = camera;
    }
    const cam = camera ?? this.camera;

    // Use the RendererUpdater to handle the logic
    this.rendererUpdater.updateRenderers(
      time,
      timeScale,
      cam,
      this.objects,
      renderer,
      scene,
    );
  }

  /**
   * @internal Updates the visibility of CSS2D labels based on object type and LOD levels.
   *          Hides labels for destroyed objects or objects at high LOD distances (e.g., distant moons).
   */
  private updateLabelVisibility(): void {
    if (!this.css2DManager) return; // Skip if no CSS2D manager

    const allRenderableObjects = this.latestRenderableObjects;

    for (const objectId in allRenderableObjects) {
      const objectData = allRenderableObjects[objectId];

      // Hide label if object is destroyed or its mesh doesn't exist
      if (
        objectData.status === CelestialStatus.DESTROYED ||
        !this.objects.has(objectId)
      ) {
        // Only hide if currently visible
        if (
          this.css2DManager
            .getLayer(CSS2DLayerType.CELESTIAL_LABELS)
            ?.getElement(objectId)?.visible
        ) {
          this.css2DManager.hideInstance(
            CSS2DLayerType.CELESTIAL_LABELS,
            objectId,
          );
        }
        continue;
      }

      let showLabel = true; // Default to showing labels
      const type = objectData.type;

      // Hide labels for specific types that shouldn't have them
      if (type === CelestialType.RING_SYSTEM) {
        showLabel = false;
      } else if (type === CelestialType.MOON) {
        // For moons, only show label if parent is close (low LOD level)
        if (objectData.parentId) {
          const parentLODLevel = this.lodManager.getCurrentLODLevel(
            objectData.parentId,
          );
          // Show if parent LOD is 0 or 1 (closest levels)
          showLabel = parentLODLevel !== undefined && parentLODLevel <= 1;
        }
      }

      const currentLabelElement = this.css2DManager
        .getLayer(CSS2DLayerType.CELESTIAL_LABELS)
        ?.getElement(objectId);
      const isCurrentlyVisible = currentLabelElement?.visible ?? false;

      // Apply visibility change only if it differs from current state
      if (showLabel && !isCurrentlyVisible) {
        this.css2DManager.showInstance(
          CSS2DLayerType.CELESTIAL_LABELS,
          objectId,
        );
      } else if (!showLabel && isCurrentlyVisible) {
        this.css2DManager.hideInstance(
          CSS2DLayerType.CELESTIAL_LABELS,
          objectId,
        );
      }
    }
  }

  /**
   * @internal Calculates the time elapsed since the last frame.
   * @returns The delta time in seconds.
   */
  private getDeltaTime(): number {
    const now = performance.now();
    const deltaTime = (now - (this.lastUpdateTime || now)) / 1000;
    this.lastUpdateTime = now;
    return deltaTime;
  }

  /**
   * @internal Manages the visibility of object labels based on camera distance and LOD.
   * @param scene - The main Three.js scene.
   * @param camera - The main perspective camera.
   */
  update(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): void {
    const time = Date.now() / 1000;
    const deltaTime = this.getDeltaTime();

    // 1. Update LODs for all objects
    this.lodManager.update();

    // 2. Update all lighting components and the manager itself
    this.lightingManager.update();

    // 3. Update all the custom renderers (for shaders, effects, etc.)
    this.updateRenderers(time, 1.0, renderer, scene, camera);

    // 4. Update gravitational lensing effect
    this.lensingHandler.updateAll(renderer, scene, camera);

    // 5. Update debris effects
    this.debrisEffectManager.update(deltaTime);

    // 6. Update label visibility
    this.updateLabelVisibility();

    this.lastUpdateTime = performance.now();
  }

  /**
   * Cleans up all resources managed by this ObjectManager and its sub-managers.
   * Unsubscribes from observables, disposes objects, clears maps.
   */
  dispose(): void {
    if (this.accelerationSubscription) {
      this.accelerationSubscription.unsubscribe();
    }
    super.dispose();

    // Dispose sub-managers in logical order (e.g., lifecycle last?)
    this.objectLifecycleManager.dispose(); // Disposes individual objects and their resources
    this.accelerationVisualizer.clear(); // Clear arrows

    // Dispose renderers and clear their maps
    this.rendererUpdater.dispose();
    this.lodManager.dispose();
    this.lensingHandler.clear();

    this.celestialRenderers.clear();
    // Clear the main object map (should be empty after lifecycle disposal, but good practice)
    this.objects.clear();

    // Only nullify properties that won't be reused
    // Don't nullify managers that are reused (objectLifecycleManager, lodManager, etc.)
    (this.accelerationSubscription as any) = null;
    (this.latestRenderableObjects as any) = null;
  }

  /**
   * Toggles debug visualization for the LOD manager.
   * @param enabled - True to show LOD debug helpers, false to hide.
   */
  toggleLODDebug(enabled: boolean): void {
    this.lodManager.setDebugMode(enabled);
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
   * Recreates all meshes from the current state.
   * Useful for applying global visual changes.
   */
  public recreateAllMeshes(): void {
    // Dispose all current objects via the lifecycle manager
    this.objectLifecycleManager.dispose();
    // Immediately resync with the latest state to recreate objects
    this.objectLifecycleManager.syncObjectsWithState(
      this.latestRenderableObjects,
    );
  }

  public setDebugVisualization(enabled: boolean): void {
    setVisualizationEnabled(enabled);

    if (enabled) {
      if (
        !this.accelerationSubscription ||
        this.accelerationSubscription.closed
      ) {
        // Create subscription if it doesn't exist or is closed
        this.accelerationSubscription = this.acceleration$.subscribe(
          (accelerations: Record<string, OSVector3>) => {
            // The check is implicit now because we only subscribe when enabled
            this.accelerationVisualizer.syncAccelerationArrows(
              accelerations,
              this.latestRenderableObjects,
            );
          },
        );
      }
    } else {
      // Unsubscribe and clear visuals if it exists
      if (this.accelerationSubscription) {
        this.accelerationSubscription.unsubscribe();
        this.accelerationSubscription = null;
      }
      this.accelerationVisualizer.clear();
    }
  }

  /**
   * Toggles the state of debug visualizations and returns the new state.
   * @returns The new visibility state of the debug visualizations.
   */
  public toggleDebugVisualization(): boolean {
    const isEnabled = debugConfig.visualize;
    this.setDebugVisualization(!isEnabled);
    return !isEnabled;
  }

  /**
   * Enables or disables the particle effects shown when objects are destroyed.
   * @param enabled Whether debris effects should be shown.
   */
  public setDebrisEffectsEnabled(enabled: boolean): void {
    this.debrisEffectManager.setDebrisEffectsEnabled(enabled);
  }

  /**
   * Toggles debris effects on or off.
   * @returns The new state (true if enabled, false if disabled).
   */
  public toggleDebrisEffects(): boolean {
    return this.debrisEffectManager.toggleDebrisEffects();
  }
}
