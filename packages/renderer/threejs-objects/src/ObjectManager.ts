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

import type { Observable, Subscription } from "rxjs";
import * as THREE from "three";
import {
  AccelerationVisualizer,
  DebrisEffectManager,
  GlobalLODManager,
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
  private lodManager: GlobalLODManager;
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

  private lastUpdateTime: number = 0;

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
   * @param css2DManager - Manager for CSS2D labels and interactions.
   * @param acceleration$ - Observable stream for acceleration vectors.
   * @param lightingManager - Lighting manager to use.
   */
  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
    renderer: THREE.WebGLRenderer,
    css2DManager: LabelVisibilityManager & Layer2DManager,
    acceleration$: Observable<Record<string, OSVector3>>,
    lightingManager: LightingManager,
  ) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.renderableObjects$ = renderableObjects$;
    this.renderer = renderer;
    this.css2DManager = css2DManager;
    this.acceleration$ = acceleration$;

    // Initialize managers
    this.lodManager = new GlobalLODManager();
    this.lightingManager =
      lightingManager ||
      new LightingManager(this.scene, this.renderableObjects$);
    this.lensingHandler = new GravitationalLensingHandler({
      celestialRenderers: this.celestialRenderers,
    });
    this.debrisEffectManager = new DebrisEffectManager({ scene: this.scene });
    this.accelerationVisualizer = new AccelerationVisualizer({
      objects: this.objects,
    });

    // Setup MeshFactory with LOD callback
    this.meshFactory = new MeshFactory({
      celestialRenderers: this.celestialRenderers,
      lodManager: this.lodManager,
      lightingManager: this.lightingManager,
      camera: this.camera,
      createLodCallback: (object: RenderableCelestialObject, levels: any[]) => {
        const lod = new THREE.LOD();
        levels.forEach((level: any) => {
          lod.addLevel(level.object, level.distance);
        });
        this.lodManager.registerLOD(object.id, lod);
        return lod;
      },
    });

    // Setup ObjectLifecycleManager
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
    });

    // Setup reactive RendererUpdater
    this.rendererUpdater = new RendererUpdater({
      celestialRenderers: this.celestialRenderers,
      lightingManager: this.lightingManager,
      renderableObjects$: this.renderableObjects$,
      camera: this.camera,
      renderer: this.renderer,
      scene: this.scene,
      allMeshes: this.objects,
    });

    // Subscribe to state changes and events
    this.subscribeToStateChanges();
    this.subscribeToDestructionEvents();
  }

  /**
   * @internal Subscribes to the renderable objects stream from the core state.
   */
  private subscribeToStateChanges(): void {
    this.subscribeToState(
      this.renderableObjects$,
      (objects: Record<string, RenderableCelestialObject>) => {
        this.latestRenderableObjects = objects;
        this.objectLifecycleManager.syncObjectsWithState(
          this.latestRenderableObjects,
        );
        this.updateLabelVisibility();
      },
    );
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
          destroyedId: fullObject.id,
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
    // Find the sun (or primary star) using pre-filtered active objects
    const activeObjects = StateAccessor.getActiveObjects();
    const centralBodyId = Object.keys(activeObjects).find((id) => {
      const obj = activeObjects[id];
      return (
        obj.type === CelestialType.STAR && !obj.parentId // Assuming the primary star has no parent
      );
    });

    if (centralBodyId) {
      return this.objects.get(centralBodyId) ?? undefined;
    }

    // Fallback to the first active object if no primary star is found
    const firstId = Object.keys(activeObjects)[0];
    return this.objects.get(firstId) ?? undefined;
  }

  /**
   * Updates all specialized renderers (stars, planets, etc.).
   * @param time - The current simulation time.
   * @param timeScale - The current simulation time scale.
   * @param renderer - The WebGLRenderer instance.
   * @param scene - The main Three.js scene.
   * @param camera - The main perspective camera.
   * @deprecated Use reactive renderer updates instead. This method is kept for backward compatibility.
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
          const parentLOD = this.lodManager.getLOD(objectData.parentId);
          // Show if parent LOD exists and is close (we can't easily determine LOD level from THREE.LOD)
          showLabel = parentLOD !== undefined;
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
   * Updates visual effects that require per-frame updates for smooth animation.
   * Renderer updates are now handled reactively via state subscriptions.
   *
   * @param renderer - The WebGLRenderer instance.
   * @param scene - The main Three.js scene.
   * @param camera - The main perspective camera.
   */
  update(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): void {
    const deltaTime = this.getDeltaTime();

    // Update visual effects that need per-frame updates for smooth animation
    this.lensingHandler.updateAll(renderer, scene, camera);
    this.debrisEffectManager.update(deltaTime);

    // Trigger renderer updates continuously for smooth rotation
    // This ensures celestial objects rotate continuously as time progresses
    if (Object.keys(this.celestialRenderers).length > 0) {
      const allRenderableObjects = StateAccessor.getRenderableObjects();
      this.rendererUpdater.updateRenderersReactive(allRenderableObjects);
    }
  }

  /**
   * Cleans up all resources managed by this ObjectManager and its sub-managers.
   */
  dispose(): void {
    if (this.accelerationSubscription) {
      this.accelerationSubscription.unsubscribe();
    }
    super.dispose();

    // Dispose sub-managers
    this.objectLifecycleManager.dispose();
    this.rendererUpdater.dispose();
    this.lodManager.dispose();
    this.lensingHandler.clear();
    this.accelerationVisualizer.clear();

    // Clear maps
    this.celestialRenderers.clear();
    this.objects.clear();

    // Clean up references
    (this.accelerationSubscription as any) = null;
    (this.latestRenderableObjects as any) = null;
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

  /**
   * Returns an array of all currently rendered Three.js Object3D instances.
   * This is primarily used for raycasting and occlusion tests by other systems (e.g., UI labels).
   * @returns An array of THREE.Object3D instances.
   */
  public getAllRenderedMeshes(): THREE.Object3D[] {
    return Array.from(this.objects.values());
  }
}
