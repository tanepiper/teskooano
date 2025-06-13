import { debugConfig, setVisualizationEnabled } from "@teskooano/core-debug";
import { OSVector3 } from "@teskooano/core-math";
import { accelerationVectors$ } from "@teskooano/core-state";
import {
  CelestialStatus,
  CelestialType,
  GasGiantClass,
  type RenderableCelestialObject,
} from "@teskooano/data-types";
import { rendererEvents } from "@teskooano/renderer-threejs";
import type { CSS2DManager } from "@teskooano/renderer-threejs-labels";
import { CSS2DLayerType } from "@teskooano/renderer-threejs-labels";
import { LightManager } from "@teskooano/renderer-threejs-lighting";
import { LODManager, type LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  AsteroidFieldRenderer,
  CelestialRenderer,
  ClassIGasGiantRenderer,
  ClassIIGasGiantRenderer,
  ClassIIIGasGiantRenderer,
  ClassIVGasGiantRenderer,
  ClassVGasGiantRenderer,
  RingSystemRenderer,
} from "@teskooano/systems-celestial";
import type { Observable, Subscription } from "rxjs";
import * as THREE from "three";
import { createDebris, type DebrisParticle } from "./debris/create-debris";
import {
  AccelerationVisualizer,
  GravitationalLensingHandler,
  MeshFactory,
  ObjectLifecycleManager,
  RendererUpdater,
} from "./object-manager";

/**
 * @internal Interface defining the required methods for managing label visibility.
 *          This allows decoupling from the full CSS2DManager if needed.
 */
interface LabelVisibilityManager {
  showLabel(layer: CSS2DLayerType, id: string): void;
  hideLabel(layer: CSS2DLayerType, id: string): void;
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
export class ObjectManager {
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
  /** @internal Map storing specialized renderers keyed by their specific type (e.g., GasGiantClass). */
  private celestialRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers specifically for stars, keyed by object ID. */
  private starRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers specifically for planets, keyed by object ID. */
  private planetRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers specifically for moons, keyed by object ID. */
  private moonRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers specifically for ring systems, keyed by object ID. */
  private ringSystemRenderers: Map<string, RingSystemRenderer> = new Map();

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
  /** @internal Observable stream of acceleration vectors from the core state. */
  private acceleration$: Observable<Record<string, OSVector3>>;

  /** @internal Manages the visualization of acceleration vectors as arrows in the scene. */
  private accelerationVisualizer: AccelerationVisualizer;

  /** @internal Handles gravitational lensing effects for massive objects like black holes. */
  private lensingHandler: GravitationalLensingHandler;
  /** @internal Factory responsible for creating the appropriate Three.js mesh for each celestial object type. */
  private meshFactory: MeshFactory;
  /** @internal Updates specialized renderers (e.g., for stars, planets) each frame. */
  private rendererUpdater: RendererUpdater;
  /** @internal Manages particle effects for object destruction events. */
  private objectLifecycleManager: ObjectLifecycleManager;

  /** @internal RxJS subscription to the renderable objects stream. */
  private objectsSubscription: Subscription | null = null;
  /** @internal RxJS subscription to the acceleration vectors stream. */
  private accelerationsSubscription: Subscription | null = null;
  /** @internal Unsubscribe function for the destruction event listener. */
  private destructionSubscription: Subscription | null = null;
  private debugMode: boolean = false;
  private debrisEffectsEnabled: boolean = true;

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
   * Creates an instance of ObjectManager.
   *
   * @param scene - The main Three.js scene.
   * @param camera - The main perspective camera.
   * @param renderableObjects$ - Observable stream of renderable celestial object data.
   * @param lightManager - The LightManager instance.
   * @param renderer - The WebGLRenderer instance.
   * @param css2DManager - Optional manager for CSS2D labels and interactions.
   * @param acceleration$ - Optional observable stream for acceleration vectors.
   */
  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
    lightManager: LightManager,
    renderer: THREE.WebGLRenderer,
    css2DManager?: LabelVisibilityManager & CSS2DManager,
    acceleration$: Observable<Record<string, OSVector3>> = accelerationVectors$,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderableObjects$ = renderableObjects$;
    this.lightManager = lightManager;
    this.renderer = renderer;
    this.css2DManager = css2DManager;
    this.acceleration$ = acceleration$; // Assign the observable

    this.lodManager = new LODManager(camera);
    this.initCelestialRenderers(); // Initialize specialized renderers
    this.lensingHandler = new GravitationalLensingHandler({
      starRenderers: this.starRenderers,
    });

    // Setup the MeshFactory with dependencies
    this.meshFactory = new MeshFactory({
      celestialRenderers: this.celestialRenderers,
      starRenderers: this.starRenderers,
      planetRenderers: this.planetRenderers,
      moonRenderers: this.moonRenderers,
      ringSystemRenderers: this.ringSystemRenderers,
      lodManager: this.lodManager,
      camera: this.camera,
      createLodCallback: (
        object: RenderableCelestialObject,
        levels: LODLevel[],
      ) => this.lodManager.createAndRegisterLOD(object, levels),
    });

    // Setup the ObjectLifecycleManager with dependencies
    this.objectLifecycleManager = new ObjectLifecycleManager({
      objects: this.objects,
      scene: this.scene,
      meshFactory: this.meshFactory,
      lodManager: this.lodManager,
      lightManager: this.lightManager,
      lensingHandler: this.lensingHandler,
      renderer: this.renderer,
      starRenderers: this.starRenderers,
      planetRenderers: this.planetRenderers,
      moonRenderers: this.moonRenderers,
      ringSystemRenderers: this.ringSystemRenderers,
      camera: this.camera,
      css2DManager: this.css2DManager,
    });

    // Setup other managers
    this.accelerationVisualizer = new AccelerationVisualizer({
      objects: this.objects,
    });
    this.rendererUpdater = new RendererUpdater({
      celestialRenderers: this.celestialRenderers,
      starRenderers: this.starRenderers,
      planetRenderers: this.planetRenderers,
      moonRenderers: this.moonRenderers,
      ringSystemRenderers: this.ringSystemRenderers,
    });

    // Start listening to state changes and events
    this.subscribeToStateChanges();
    this.subscribeToDestructionEvents();
  }

  /**
   * @internal Initializes the map of specialized celestial renderers (e.g., for different Gas Giant classes).
   */
  private initCelestialRenderers(): void {
    // Initialize renderers for specific types like Gas Giants
    this.celestialRenderers.set(
      GasGiantClass.CLASS_I,
      new ClassIGasGiantRenderer(),
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_II,
      new ClassIIGasGiantRenderer(),
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_III,
      new ClassIIIGasGiantRenderer(),
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_IV,
      new ClassIVGasGiantRenderer(),
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_V,
      new ClassVGasGiantRenderer(),
    );

    // Add renderer for asteroid fields
    this.celestialRenderers.set(
      CelestialType.ASTEROID_FIELD,
      new AsteroidFieldRenderer() as any, // Cast might be needed depending on specific interfaces
    );
  }

  /**
   * @internal Subscribes to the renderable objects and acceleration vector streams from the core state.
   */
  private subscribeToStateChanges(): void {
    // Subscribe to renderable objects and sync the scene via ObjectLifecycleManager
    this.objectsSubscription = this.renderableObjects$.subscribe(
      (objects: Record<string, RenderableCelestialObject>) => {
        this.latestRenderableObjects = objects;
        this.objectLifecycleManager.syncObjectsWithState(
          this.latestRenderableObjects,
        );
      },
    );

    // Subscribe to acceleration vectors and update the visualization
    this.accelerationsSubscription = this.acceleration$.subscribe(
      (accelerations: Record<string, OSVector3>) => {
        this.accelerationVisualizer.syncAccelerationArrows(accelerations);
      },
    );
  }

  /**
   * @internal Subscribes to destruction events emitted via the rendererEvents bus.
   */
  private subscribeToDestructionEvents(): void {
    if (this.destructionSubscription) {
      this.destructionSubscription.unsubscribe();
    }
    this.destructionSubscription = rendererEvents.destruction$.subscribe(
      (payload) => {
        if (this.debrisEffectsEnabled) {
          const debris = createDebris(
            payload.object,
            this.scene,
            this.renderer,
          );
          debris.forEach((d: DebrisParticle) => this.scene.add(d.mesh));
        }
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
   * Updates all managed renderers and systems that require frame-by-frame updates.
   * This includes LOD, specialized celestial renderers, label visibility, and debris effects.
   *
   * @param time - The current simulation time (or frame time).
   * @param lightSources - Map of active light sources and their data.
   * @param renderer - Optional override for the WebGLRenderer instance.
   * @param scene - Optional override for the Scene instance.
   * @param camera - Optional override for the Camera instance.
   */
  updateRenderers(
    time: number,
    lightSources: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
    camera?: THREE.PerspectiveCamera,
  ): void {
    // Update LOD system first
    this.lodManager.update();

    // Update specialized renderers (stars, planets, etc.)
    this.rendererUpdater.updateRenderers(
      time,
      lightSources,
      this.objects, // Pass current objects map if needed by renderers
      renderer || this.renderer || undefined,
      scene || this.scene,
      camera || this.camera,
    );

    // Update visibility of CSS2D labels based on LOD and object type
    this.updateLabelVisibility();
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
        this.css2DManager.showLabel(CSS2DLayerType.CELESTIAL_LABELS, objectId);
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
    this.accelerationsSubscription?.unsubscribe();
    this.accelerationsSubscription = null;
    this.destructionSubscription?.unsubscribe();
    this.destructionSubscription = null;

    // Dispose sub-managers in logical order (e.g., lifecycle last?)
    this.objectLifecycleManager.dispose(); // Disposes individual objects and their resources
    this.accelerationVisualizer.clear(); // Clear arrows

    // Dispose renderers and clear their maps
    this.rendererUpdater.dispose();
    this.lodManager.clear();
    this.lensingHandler.clear();

    this.celestialRenderers.clear();
    this.starRenderers.clear();
    this.planetRenderers.clear();
    this.moonRenderers.clear();
    this.ringSystemRenderers.clear();

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
    this.objectLifecycleManager.dispose();
    // Immediately resync with the latest state to recreate objects
    this.objectLifecycleManager.syncObjectsWithState(
      this.latestRenderableObjects,
    );
  }

  public setDebugVisualization(enabled: boolean): void {
    setVisualizationEnabled(enabled);
  }

  /**
   * Toggles debug visualizations on or off.
   * @returns The new state (true if enabled, false if disabled).
   */
  public toggleDebugVisualization(): boolean {
    const newState = !debugConfig.visualize;
    this.setDebugVisualization(newState);
    return newState;
  }

  /**
   * Enables or disables the particle effects shown when objects are destroyed.
   * @param enabled Whether debris effects should be shown.
   */
  public setDebrisEffectsEnabled(enabled: boolean): void {
    this.debrisEffectsEnabled = enabled;
  }

  /**
   * Toggles debris effects on or off.
   * @returns The new state (true if enabled, false if disabled).
   */
  public toggleDebrisEffects(): boolean {
    this.debrisEffectsEnabled = !this.debrisEffectsEnabled;
    return this.debrisEffectsEnabled;
  }
}
