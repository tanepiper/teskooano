import {
  CelestialStatus,
  CelestialType,
  GasGiantClass,
} from "@teskooano/data-types";
import {
  AsteroidFieldRenderer,
  CelestialRenderer,
  ClassIGasGiantRenderer,
  ClassIIGasGiantRenderer,
  ClassIIIGasGiantRenderer,
  ClassIVGasGiantRenderer,
  ClassVGasGiantRenderer,
  // OortCloudRenderer, // DISABLED: for performance reasons
  RingSystemRenderer,
} from "@teskooano/systems-celestial";
import * as THREE from "three";
import { LODManager } from "@teskooano/renderer-threejs-effects";
import {
  GravitationalLensingHandler,
  MeshFactory,
  RendererUpdater,
} from "./object-manager";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LightManager } from "@teskooano/renderer-threejs-effects";
import { OSVector3 } from "@teskooano/core-math"; // Needed for type check
import type { CSS2DManager } from "@teskooano/renderer-threejs-interaction";
import { CSS2DLayerType } from "@teskooano/renderer-threejs-interaction";
import type { MapStore } from "nanostores"; // Import MapStore for typing
import {
  accelerationVectorsStore,
  renderableObjectsStore as globalRenderableObjectsStore,
} from "@teskooano/core-state"; // Import global store
// Import LODLevel interface
import type { LODLevel } from "@teskooano/systems-celestial";

// --- Interface refinement for CSS2DManager (assuming this structure) ---
interface LabelVisibilityManager {
  showLabel(layer: CSS2DLayerType, id: string): void;
  hideLabel(layer: CSS2DLayerType, id: string): void;
  // OR: setLabelVisibility(layer: CSS2DLayerType, id: string, visible: boolean): void;
}
// --- End Interface refinement ---

/**
 * Manages the creation, updating, and removal of Three.js meshes representing celestial objects in the scene.
 * It listens to a Nanostore (`renderableObjectsStore`) for changes in celestial object data and synchronizes the
 * Three.js scene accordingly. It also handles LOD (Level of Detail), object-specific renderers,
 * gravitational lensing effects (via `GravitationalLensingHandler`), and potentially other visual aspects
 * like labels (via `CSS2DManager`) and debug visualizations (e.g., acceleration vectors).
 */
export class ObjectManager {
  /** @internal Map storing the actual Three.js Object3D instances, keyed by celestial object ID. */
  private objects: Map<string, THREE.Object3D> = new Map();
  /** @internal The main Three.js scene where objects are added. */
  private scene: THREE.Scene;
  /** @internal The primary camera used for rendering and LOD calculations. */
  private camera: THREE.PerspectiveCamera;
  /** @internal The main WebGL renderer instance, potentially used by specialized renderers (e.g., lensing). */
  private renderer: THREE.WebGLRenderer | null = null;
  /** @internal Manages Level of Detail for meshes to optimize performance. */
  private lodManager: LODManager;
  /** @internal Map storing specialized renderers for non-standard celestial types (e.g., gas giants, asteroid fields). Keyed by type or class enum. */
  private celestialRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers specifically for stars. Keyed by celestial object ID. */
  private starRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers specifically for planets (including terrestrial, dwarf). Keyed by celestial object ID. */
  private planetRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers specifically for moons. Keyed by celestial object ID. */
  private moonRenderers: Map<string, CelestialRenderer> = new Map();
  /** @internal Map storing specialized renderers for ring systems. Keyed by celestial object ID (matching the ring system). */
  private ringSystemRenderers: Map<string, RingSystemRenderer> = new Map();

  /** @internal The Nanostore providing the source of truth for renderable celestial object data. */
  private renderableObjectsStore: MapStore<
    Record<string, RenderableCelestialObject>
  >;

  /** @internal Manages light sources in the scene, particularly those associated with stars. */
  private lightManager: LightManager;

  /** @internal Optional manager for handling 2D CSS labels attached to objects. Needs visibility methods. */
  private css2DManager?: LabelVisibilityManager & CSS2DManager; // Combine with assumed interface

  /** @internal Map storing ArrowHelper instances used to visualize acceleration vectors. Keyed by celestial object ID. */
  private accelerationArrows: Map<string, THREE.ArrowHelper> = new Map();
  /** @internal Scaling factor applied to acceleration vectors for visualization. Needs tuning. */
  private readonly arrowScaleFactor = 1e-11; // TODO: Tune this scale factor! Drastically reduced.
  /** @internal Color used for acceleration vector arrows. */
  private readonly arrowColor = 0xff00ff; // Magenta for visibility

  /** @internal Handles the application and management of gravitational lensing post-processing effects. */
  private lensingHandler: GravitationalLensingHandler;
  /** @internal Factory responsible for creating the appropriate Three.js mesh based on object type and properties. */
  private meshFactory: MeshFactory;
  /** @internal Helper class responsible for calling the `update` method on all active specialized renderers. */
  private rendererUpdater: RendererUpdater;

  // Storethe unsubscribe function
  /** @internal Function to unsubscribe from the renderable objects store. */
  private unsubscribeObjects: (() => void) | null = null;
  /** @internal Function to unsubscribe from the acceleration vectors store. */
  private unsubscribeAccelerations: (() => void) | null = null;

  /** @internal Temporary vector used for calculations to avoid allocations. */
  private tempVector3 = new THREE.Vector3();

  /**
   * Creates an instance of ObjectManager.
   * @param scene - The main Three.js scene.
   * @param camera - The primary Three.js camera.
   * @param renderableObjectsStore - The Nanostore containing the state of objects to be rendered.
   * @param lightManager - The manager for scene lighting, especially star lights.
   * @param renderer - The main WebGL renderer instance.
   * @param css2DManager - Optional manager for CSS2D labels. Must implement `showLabel` and `hideLabel`.
   * @param accelerationStore - The Nanostore containing acceleration vectors for objects.
   */
  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderableObjectsStore: MapStore<Record<string, RenderableCelestialObject>>,
    lightManager: LightManager,
    renderer: THREE.WebGLRenderer,
    css2DManager?: LabelVisibilityManager & CSS2DManager, // Use combined type
    // Add acceleration store dependency
    private accelerationStore: typeof accelerationVectorsStore = accelerationVectorsStore
  ) {
    this.scene = scene;
    this.camera = camera;
    // Use the globally imported store if none is provided (or adjust logic as needed)
    this.renderableObjectsStore =
      renderableObjectsStore || globalRenderableObjectsStore;
    this.lightManager = lightManager;
    this.lodManager = new LODManager(camera);
    this.css2DManager = css2DManager; // Store the potentially undefined CSS2DManager instance

    // Store renderer instance
    this.renderer = renderer;

    // Initialize sub-components
    this.initCelestialRenderers();

    this.lensingHandler = new GravitationalLensingHandler(this.starRenderers);

    this.meshFactory = new MeshFactory(
      this.celestialRenderers,
      this.starRenderers,
      this.planetRenderers,
      (object: RenderableCelestialObject, levels: LODLevel[]) => 
        this.lodManager.createAndRegisterLOD(object, levels),
      this.lodManager
    );

    this.rendererUpdater = new RendererUpdater(
      this.celestialRenderers,
      this.starRenderers,
      this.planetRenderers,
      this.moonRenderers,
      this.ringSystemRenderers
    );

    // Start listening to the passed-in store
    this.subscribeToStateChanges();
  }

  /**
   * Initializes the maps holding specialized renderers for different celestial object types/classes.
   * @internal
   */
  private initCelestialRenderers(): void {
    // For stars, planets, moons, rings: MeshFactory gets/creates renderers on demand

    // Initialize gas giant renderers for each class
    this.celestialRenderers.set(
      GasGiantClass.CLASS_I,
      new ClassIGasGiantRenderer()
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_II,
      new ClassIIGasGiantRenderer()
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_III,
      new ClassIIIGasGiantRenderer()
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_IV,
      new ClassIVGasGiantRenderer()
    );
    this.celestialRenderers.set(
      GasGiantClass.CLASS_V,
      new ClassVGasGiantRenderer()
    );

    // Add asteroid field and Oort cloud renderers (with type assertion for now)
    this.celestialRenderers.set(
      CelestialType.ASTEROID_FIELD,
      new AsteroidFieldRenderer() as any
    );
    // DISABLED: OortCloudRenderer for performance reasons
    // this.celestialRenderers.set(
    //   CelestialType.OORT_CLOUD,
    //   new OortCloudRenderer() as any
    // );

    // Add RingSystemRenderer for the specific type
    // This one isn't stored per-ID, but used by MeshFactory based on type
    this.celestialRenderers.set(
      CelestialType.RING_SYSTEM,
      new RingSystemRenderer()
    );
  }

  /**
   * Subscribes to the renderable objects and acceleration stores to react to state changes.
   * @internal
   */
  private subscribeToStateChanges(): void {
    this.unsubscribeObjects = this.renderableObjectsStore.subscribe(
      (objects: Record<string, RenderableCelestialObject>) => {
        this.syncObjectsWithState(objects);
      }
    );

    // Subscribe to acceleration changes
    this.unsubscribeAccelerations = this.accelerationStore.subscribe(
      (accelerations: Record<string, OSVector3>) => {
        this.syncAccelerationArrows(accelerations);
      }
    );
  }

  /**
   * Synchronizes the Three.js scene objects with the latest state from the `renderableObjectsStore`.
   * Adds new objects, updates existing ones, and removes objects no longer present in the state.
   * @internal
   * @param newState - The latest state of renderable objects from the store.
   */
  private syncObjectsWithState(
    newState: Record<string, RenderableCelestialObject>
  ): void {
    const newStateIds = new Set(Object.keys(newState));
    const currentIds = new Set(this.objects.keys());

    // 1. Objects to remove (exist in current state, but not in new state)
    currentIds.forEach((id) => {
      if (!newStateIds.has(id)) {
        this.internalRemoveObject(id);
      }
    });

    // 2. Objects to add or update
    newStateIds.forEach((id) => {
      const objectData = newState[id];
      if (currentIds.has(id)) {
        // Exists, potentially update or remove if destroyed
        if (objectData.status === CelestialStatus.DESTROYED) {
          // If marked as destroyed, remove its visual representation
          this.internalRemoveObject(id);
        } else {
          // Otherwise, update the existing object
          this.internalUpdateObject(objectData);
        }
      } else {
        // New object, add only if not destroyed
        if (objectData.status !== CelestialStatus.DESTROYED) {
          this.internalAddObject(objectData);
        }
        // If it's new but already destroyed, do nothing (it won't be rendered)
      }
    });
  }

  /**
   * Synchronizes the visibility and properties of acceleration vector arrows
   * based on the latest data from the `accelerationStore`.
   * @internal
   * @param accelerations - The latest acceleration vectors from the store.
   */
  private syncAccelerationArrows(
    accelerations: Record<string, OSVector3>
  ): void {
    const updatedArrowIds = new Set<string>();

    for (const objectId in accelerations) {
      const accelerationVec = accelerations[objectId];
      const parentObject = this.objects.get(objectId);

      if (!parentObject || !accelerationVec) {
        continue; // Skip if no parent object or no acceleration data
      }

      // Convert OSVector3 direction to THREE.Vector3 (normalize)
      // Avoid normalizing zero vectors
      const direction = new THREE.Vector3(
        accelerationVec.x,
        accelerationVec.y,
        accelerationVec.z
      );
      const length = direction.length(); // Get magnitude before normalizing
      if (length > 1e-9) {
        // Check if length is not effectively zero
        direction.normalize();
      } else {
        direction.set(0, 1, 0); // Default direction if acceleration is zero
      }

      const scaledLength = length * this.arrowScaleFactor;

      let arrow = this.accelerationArrows.get(objectId);

      if (arrow) {
        // Update existing arrow
        arrow.setDirection(direction);
        arrow.setLength(scaledLength);
        // Ensure it's visible (in case it was hidden)
        arrow.visible = true;
      } else {
        // Create new arrow
        arrow = new THREE.ArrowHelper(
          direction,
          new THREE.Vector3(0, 0, 0), // Origin relative to parent
          scaledLength,
          this.arrowColor
        );
        parentObject.add(arrow); // Add arrow as child of the celestial object mesh
        this.accelerationArrows.set(objectId, arrow);
      }
      updatedArrowIds.add(objectId);
    }

    // Remove or hide arrows for objects that no longer have acceleration data
    this.accelerationArrows.forEach((arrow, objectId) => {
      if (!updatedArrowIds.has(objectId)) {
        arrow.visible = false;
      }
    });
  }
  // --- End syncAccelerationArrows ---

  // --- Internal Add/Update/Remove Methods (to be called by subscription handler) ---
  /**
   * Creates and adds a new Three.js mesh representation for a celestial object to the scene.
   * Also handles setting up associated labels and potential gravitational lensing effects.
   * Called internally when a new object appears in the `renderableObjectsStore`.
   * @internal
   * @param object - The data for the new celestial object.
   */
  private internalAddObject(object: RenderableCelestialObject): void {
    // Safety check: Do not add if marked as destroyed
    if (object.status === CelestialStatus.DESTROYED) {
      console.warn(
        `[ObjectManager] Attempted to add already destroyed object ${object.celestialObjectId}. Skipping.`
      );
      return;
    }

    const objectId = object.celestialObjectId;
    if (this.objects.has(objectId)) {
      this.internalUpdateObject(object);
      return;
    }
    const mesh = this.meshFactory.createObjectMesh(object);

    // --- Check if mesh creation failed ---
    if (!mesh) {
      console.warn(
        `[ObjectManager internalAddObject] MeshFactory FAILED to create mesh for ${objectId}. Skipping add.`
      );
      return;
    }

    this.scene.add(mesh);
    this.objects.set(objectId, mesh);

    // --- Add LightManager call for new stars ---
    // Restore call to add light when star object is added
    if (object.type === CelestialType.STAR && object.position) {
      this.lightManager.addStarLight(objectId, object.position);
    }
    // --- End LightManager call ---

    // Create label *after* mesh is created and added to map
    // Label visibility will be handled in updateRenderers
    if (this.css2DManager) {
      this.css2DManager.createCelestialLabel(object, mesh);
      // Initially hide labels for secondary objects? Or let updateRenderers handle it first time.
      // Let's let updateRenderers handle initial visibility based on parent LOD.
    }

    // Check and apply lensing effect setup *after* adding the mesh
    if (this.lensingHandler.needsGravitationalLensing(object)) {
      if (this.renderer) {
        this.lensingHandler.applyGravitationalLensing(
          object,
          this.renderer,
          this.scene,
          this.camera,
          mesh
        );
      } else {
        console.warn(
          `[ObjectManager] Cannot apply lensing for ${object.celestialObjectId}: Renderer instance not available.`
        );
      }
    }
  }

  /**
   * Updates the position and rotation of an existing Three.js mesh based on new data.
   * Called internally when an object's data changes in the `renderableObjectsStore`.
   * @internal
   * @param object - The updated data for the celestial object.
   */
  private internalUpdateObject(object: RenderableCelestialObject): void {
    // Safety check: If updated object is now destroyed, remove it instead
    if (object.status === CelestialStatus.DESTROYED) {
      this.internalRemoveObject(object.celestialObjectId);
      return;
    }

    const objectId = object.celestialObjectId;
    const existingMesh = this.objects.get(objectId);
    if (!existingMesh) {
      // This can happen if the object was added and then immediately updated
      // before the next frame rendered. Let's try adding it.
      if (object.status === CelestialStatus.ACTIVE) {
        console.warn(
          `[ObjectManager] internalUpdateObject called for non-existent object ${objectId}. Attempting to add.`
        );
        this.internalAddObject(object);
      }
      return;
    }

    existingMesh.position.copy(object.position);
    existingMesh.quaternion.copy(object.rotation);

    // Label visibility is handled in updateRenderers
    // Material updates etc. are handled by specialized renderers called by rendererUpdater
  }

  /**
   * Removes a Three.js mesh and associated resources (geometry, material, label, lensing, arrow)
   * from the scene and internal maps. Called internally when an object disappears
   * from the `renderableObjectsStore`.
   * @internal
   * @param objectId - The ID of the celestial object to remove.
   */
  private internalRemoveObject(objectId: string): void {
    const mesh = this.objects.get(objectId);
    if (!mesh) {
      return;
    }

    // Remove associated acceleration arrow first (if it's a child)
    const arrow = this.accelerationArrows.get(objectId);
    if (arrow) {
      mesh.remove(arrow); // Remove from parent mesh
      this.accelerationArrows.delete(objectId);
    }

    // Remove the label associated with this object
    if (this.css2DManager) {
      this.css2DManager.removeElement(
        CSS2DLayerType.CELESTIAL_LABELS,
        objectId
      );
    }

    this.lodManager.remove(objectId); // Must happen before mesh disposal if LOD added debug labels
    this.scene.remove(mesh);

    // Dispose geometry/material - Traverse the mesh and its children
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat?.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });

    // Delete from map
    this.objects.delete(objectId);
    this.lensingHandler.removeLensingObject(objectId);

    // --- Add LightManager removal ---
    // Restore call to remove light when object is removed
    this.lightManager.removeStarLight(objectId); // Handles non-existent IDs gracefully
    // --- End LightManager removal ---

    // Remove from specialized renderer maps if necessary
    // (Though renderers themselves should handle disposal of resources if needed)
    this.starRenderers.delete(objectId);
    this.planetRenderers.delete(objectId);
    this.moonRenderers.delete(objectId);
    this.ringSystemRenderers.delete(objectId);
  }

  /**
   * Retrieves the Three.js Object3D instance associated with a given celestial object ID.
   * @param id - The unique ID of the celestial object.
   * @returns The corresponding Three.js Object3D, or null if not found.
   */
  getObject(id: string): THREE.Object3D | null {
    return this.objects.get(id) || null;
  }

  /**
   * Updates specialized renderers and manages label visibility based on LOD levels.
   * This is typically called once per frame.
   * @param time - The current simulation time or delta time for animations.
   * @param lightSources - Map of active light sources and their properties.
   * @param renderer - Optional WebGLRenderer instance, potentially needed by specialized renderers.
   * @param scene - Optional Scene instance, potentially needed by specialized renderers.
   * @param camera - Optional Camera instance, potentially needed by specialized renderers.
   */
  updateRenderers(
    time: number,
    lightSources: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
    camera?: THREE.PerspectiveCamera
  ): void {
    // 1. Update LOD levels first
    this.lodManager.update();

    // 2. Call specialized renderers update (stars, planets, moons, rings, etc.)
    this.rendererUpdater.updateRenderers(
      time,
      lightSources,
      this.objects,
      renderer,
      scene,
      camera
    );

    // 3. Update Label Visibility based on LOD
    if (this.css2DManager) {
      const allRenderableObjects = this.renderableObjectsStore.get(); // Get current state

      for (const objectId in allRenderableObjects) {
        const objectData = allRenderableObjects[objectId];

        // Skip destroyed objects
        if (objectData.status === CelestialStatus.DESTROYED) continue;

        // Check if the object exists in our scene map
        if (!this.objects.has(objectId)) continue;

        // Determine label visibility
        let showLabel = false; // Default to hidden

        const type = objectData.type;

        // Always show primary types
        if (
          type === CelestialType.STAR ||
          type === CelestialType.PLANET ||
          type === CelestialType.GAS_GIANT ||
          type === CelestialType.OORT_CLOUD ||
          type === CelestialType.DWARF_PLANET || // Treat dwarf planets like planets
          type === CelestialType.ASTEROID_FIELD
        ) {
          showLabel = true;
        }
        // Show moons/rings only when parent is close enough (using LOD as proxy)
        else if (type === CelestialType.MOON || type === CelestialType.RING_SYSTEM) {
          if (objectData.parentId) {
            const parentLODLevel = this.lodManager.getCurrentLODLevel(
              objectData.parentId
            );
            // Show label if parent LOD level is 0 or 1 (highest/high detail)
            if (parentLODLevel !== undefined && parentLODLevel <= 1) {
              showLabel = true;
            }
          }
          // If no parent ID or parent is too far (low LOD), keep showLabel = false
        }
        // Default: Hide other types (Comets, Stations, etc.)
        else {
          showLabel = false;
        }

        // Apply visibility change
        if (showLabel) {
          this.css2DManager.showLabel(
            CSS2DLayerType.CELESTIAL_LABELS,
            objectId
          );
        } else {
          this.css2DManager.hideLabel(
            CSS2DLayerType.CELESTIAL_LABELS,
            objectId
          );
        }
      }
    }
  }

  /**
   * Main update loop method for the ObjectManager. Currently minimal.
   * Gravitational lensing updates are handled by specialized renderers or post-processing passes.
   * LOD updates happen in `updateRenderers`.
   * @param renderer - The main WebGL renderer.
   * @param scene - The main scene.
   * @param camera - The main camera.
   */
  update(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ): void {
    // Lensing is handled elsewhere (e.g., within star renderer or post-processing)
    // LODManager.update is now called within updateRenderers
    // Main updates happen via store subscription and updateRenderers call
  }

  /**
   * Cleans up all resources managed by the ObjectManager.
   * Unsubscribes from stores, removes and disposes all meshes, materials, geometries,
   * clears internal maps, and disposes of helper managers (LOD, Lensing, RendererUpdater).
   * Should be called when the visualization is destroyed.
   */
  dispose(): void {
    // Call the stored unsubscribe function
    this.unsubscribeObjects?.();
    this.unsubscribeObjects = null; // Clear reference
    this.unsubscribeAccelerations?.();
    this.unsubscribeAccelerations = null;

    this.objects.forEach((_, id) => this.internalRemoveObject(id)); // Use internalRemove
    this.objects.clear();

    this.rendererUpdater.dispose();
    this.celestialRenderers.clear();
    this.starRenderers.clear();
    this.planetRenderers.clear();
    this.moonRenderers.clear();
    this.ringSystemRenderers.clear();
    this.lodManager.clear();
    this.lensingHandler.clear();

    // Clean up acceleration arrows (already handled mostly by internalRemoveObject)
    this.accelerationArrows.clear();

    // Optional: Explicitly clear CSS2D layer if needed
    // if (this.css2DManager) {
    //   this.css2DManager.clearLayer(CSS2DLayerType.CELESTIAL_LABELS);
    // }
  }

  /**
   * Toggles the visibility of debug visualizations for the LOD manager.
   * @param enabled - Whether to enable LOD debug visualizations.
   */
  toggleLODDebug(enabled: boolean): void {
    this.lodManager.toggleDebug(enabled);
  }

  /**
   * Directly adds an arbitrary Three.js object to the scene managed by this ObjectManager.
   * Use with caution, as this object won't be managed by the standard add/update/remove lifecycle.
   * @param obj - The Three.js object to add.
   */
  addRawObjectToScene(obj: THREE.Object3D): void {
    this.scene.add(obj);
  }

  /**
   * Directly removes an arbitrary Three.js object from the scene, if it's a direct child.
   * Use with caution.
   * @param obj - The Three.js object to remove.
   */
  removeRawObjectFromScene(obj: THREE.Object3D): void {
    if (obj.parent === this.scene) {
      this.scene.remove(obj);
    }
  }
}
