import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type {
  LightManager,
  LODManager,
} from "@teskooano/renderer-threejs-effects";
import {
  CSS2DLayerType,
  type CSS2DManager,
} from "@teskooano/renderer-threejs-interaction";
import type {
  CelestialRenderer,
  RingSystemRenderer,
} from "@teskooano/systems-celestial";
import * as THREE from "three";
import type { MeshFactory } from "./MeshFactory";
import type { GravitationalLensingHandler } from "./GravitationalLensing";

/**
 * @internal
 * Configuration object for ObjectLifecycleManager dependencies.
 */
export interface ObjectLifecycleManagerConfig {
  objects: Map<string, THREE.Object3D>;
  scene: THREE.Scene;
  meshFactory: MeshFactory;
  lodManager: LODManager;
  lightManager: LightManager;
  lensingHandler: GravitationalLensingHandler;
  renderer: THREE.WebGLRenderer | null;
  starRenderers: Map<string, CelestialRenderer>;
  planetRenderers: Map<string, CelestialRenderer>;
  moonRenderers: Map<string, CelestialRenderer>;
  ringSystemRenderers: Map<string, RingSystemRenderer>;
  camera: THREE.PerspectiveCamera;
  css2DManager?: CSS2DManager;
}

/**
 * @internal
 * Manages the creation, updating, and removal of Three.js Object3D instances
 * representing celestial objects within the main scene.
 */
export class ObjectLifecycleManager {
  private objects: Map<string, THREE.Object3D>;
  private scene: THREE.Scene;
  private meshFactory: MeshFactory;
  private lodManager: LODManager;
  private lightManager: LightManager;
  private lensingHandler: GravitationalLensingHandler;
  private css2DManager?: CSS2DManager;
  private renderer: THREE.WebGLRenderer | null;
  private starRenderers: Map<string, CelestialRenderer>;
  private planetRenderers: Map<string, CelestialRenderer>;
  private moonRenderers: Map<string, CelestialRenderer>;
  private ringSystemRenderers: Map<string, RingSystemRenderer>;
  private camera: THREE.PerspectiveCamera; // Add camera reference

  constructor(config: ObjectLifecycleManagerConfig) {
    this.objects = config.objects;
    this.scene = config.scene;
    this.meshFactory = config.meshFactory;
    this.lodManager = config.lodManager;
    this.lightManager = config.lightManager;
    this.lensingHandler = config.lensingHandler;
    this.renderer = config.renderer;
    this.starRenderers = config.starRenderers;
    this.planetRenderers = config.planetRenderers;
    this.moonRenderers = config.moonRenderers;
    this.ringSystemRenderers = config.ringSystemRenderers;
    this.camera = config.camera;
    this.css2DManager = config.css2DManager;
  }

  /**
   * Synchronizes the Three.js scene objects with the latest state.
   * Adds new objects, updates existing ones, and removes objects no longer present.
   * @param newState - The latest state of renderable objects.
   */
  syncObjectsWithState(
    newState: Record<string, RenderableCelestialObject>,
  ): void {
    const newStateIds = new Set(Object.keys(newState));
    const currentIds = new Set(this.objects.keys());

    // Remove objects not in the new state
    currentIds.forEach((id) => {
      if (!newStateIds.has(id)) {
        this.removeObject(id);
      }
    });

    // Add or update objects from the new state
    newStateIds.forEach((id) => {
      const objectData = newState[id];
      const mesh = this.objects.get(id);

      // Handle destroyed/annihilated objects explicitly
      if (
        objectData.status === CelestialStatus.DESTROYED ||
        objectData.status === CelestialStatus.ANNIHILATED
      ) {
        if (mesh) {
          this.removeObject(id);
        }
        return; // Skip further processing for destroyed objects
      }

      // Update existing active object or add new active object
      if (mesh) {
        if (objectData.status === CelestialStatus.ACTIVE) {
          this.updateObject(objectData);
        }
      } else if (objectData.status === CelestialStatus.ACTIVE) {
        this.addObject(objectData);
      }
    });
  }

  /**
   * Creates and adds a new Three.js mesh representation for a celestial object.
   * @param object - The data for the new celestial object.
   */
  addObject(object: RenderableCelestialObject): void {
    const objectId = object.celestialObjectId;
    if (this.objects.has(objectId)) {
      console.warn(
        `[ObjectLifecycleManager] Attempted to add existing object ${objectId}. Updating instead.`,
      );
      this.updateObject(object);
      return;
    }

    const mesh = this.meshFactory.createObjectMesh(object);
    if (!mesh) {
      console.warn(
        `[ObjectLifecycleManager] MeshFactory failed to create mesh for ${objectId}. Skipping add.`,
      );
      return;
    }

    this.scene.add(mesh);
    this.objects.set(objectId, mesh);

    // Handle associated components (lights, labels, lensing)
    if (object.type === CelestialType.STAR && object.position) {
      this.lightManager.addStarLight(objectId, object.position);
    }

    if (this.css2DManager) {
      this.css2DManager.createCelestialLabel(object, mesh);
    }

    if (this.lensingHandler.needsGravitationalLensing(object)) {
      if (this.renderer) {
        this.lensingHandler.applyGravitationalLensing(
          object,
          this.renderer,
          this.scene,
          this.camera, // Use stored camera reference
          mesh,
        );
      } else {
        console.warn(
          `[ObjectLifecycleManager] Cannot apply lensing for ${objectId}: Renderer instance not available.`,
        );
      }
    }
  }

  /**
   * Updates the position and rotation of an existing Three.js mesh.
   * @param object - The updated data for the celestial object.
   */
  updateObject(object: RenderableCelestialObject): void {
    const objectId = object.celestialObjectId;
    const existingMesh = this.objects.get(objectId);

    if (!existingMesh) {
      // This case should ideally be handled by syncObjectsWithState, but as a fallback:
      if (object.status === CelestialStatus.ACTIVE) {
        console.warn(
          `[ObjectLifecycleManager] updateObject called for non-existent active object ${objectId}. Adding.`,
        );
        this.addObject(object);
      }
      return;
    }

    // Check if the object was marked destroyed previously and is now active again (unlikely but possible)
    // This might require resetting visual appearance if a "destroyed look" was applied.

    // Apply updates
    existingMesh.position.copy(object.position);
    existingMesh.quaternion.copy(object.rotation);

    // Update light position if it's a star
    if (object.type === CelestialType.STAR && object.position) {
      // This is now handled by the store subscription in LightManager
      // this.lightManager.updateStarLight(objectId, object.position);
    }

    // Update LOD, CSS labels, etc. if necessary (often handled in the main update loop)
  }

  /**
   * Removes a Three.js mesh and associated resources from the scene and internal maps.
   * @param objectId - The ID of the celestial object to remove.
   */
  removeObject(objectId: string): void {
    const mesh = this.objects.get(objectId);
    if (!mesh) {
      return; // Already removed or never existed
    }

    // Remove associated components first
    if (this.css2DManager) {
      this.css2DManager.removeElement(
        CSS2DLayerType.CELESTIAL_LABELS,
        objectId,
      );
    }
    this.lodManager.remove(objectId); // Remove from LOD manager
    this.lensingHandler.removeLensingObject(objectId); // Remove from lensing
    this.lightManager.removeStarLight(objectId); // Remove associated light

    // Clean up specialized renderers associated with this object ID
    const starRenderer = this.starRenderers.get(objectId);
    if (starRenderer?.dispose) starRenderer.dispose();
    this.starRenderers.delete(objectId);

    const planetRenderer = this.planetRenderers.get(objectId);
    if (planetRenderer?.dispose) planetRenderer.dispose();
    this.planetRenderers.delete(objectId);

    const moonRenderer = this.moonRenderers.get(objectId);
    if (moonRenderer?.dispose) moonRenderer.dispose();
    this.moonRenderers.delete(objectId);

    const ringSystemRenderer = this.ringSystemRenderers.get(objectId);
    if (ringSystemRenderer?.dispose) ringSystemRenderer.dispose();
    this.ringSystemRenderers.delete(objectId);

    // Remove the main mesh from the scene
    this.scene.remove(mesh);

    // Dispose of geometries and materials
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Log the child mesh and its material for debugging
        console.log(
          `[ObjectLifecycleManager] Disposing child mesh: ${child.name} (${child.uuid}), Material:`,
          child.material,
        );

        // Dispose geometry
        child.geometry?.dispose();

        // Dispose material(s)
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat && typeof mat.dispose === "function") {
              mat.dispose();
            } else if (mat) {
              console.warn(
                `[ObjectLifecycleManager] Child mesh material in array for ${child.name} lacks dispose method:`,
                mat,
              );
            }
          });
        } else if (child.material) {
          if (typeof child.material.dispose === "function") {
            child.material.dispose();
          } else {
            console.warn(
              `[ObjectLifecycleManager] Child mesh material for ${child.name} lacks dispose method:`,
              child.material,
            );
          }
        }
      } else {
        // Optionally log non-mesh children if needed
        // console.log(`[ObjectLifecycleManager] Traversing non-mesh child: ${child.name} (${child.type})`);
      }
    });

    // Remove from the main tracking map
    this.objects.delete(objectId);

    console.log(`[ObjectLifecycleManager] Removed object ${objectId}`);
  }

  /**
   * Cleans up all managed objects.
   */
  dispose(): void {
    const currentIds = Array.from(this.objects.keys());
    currentIds.forEach((id) => this.removeObject(id));
    this.objects.clear(); // Ensure the map is cleared
  }
}
