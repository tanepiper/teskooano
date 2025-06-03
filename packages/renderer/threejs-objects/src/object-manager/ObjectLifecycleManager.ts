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
import * as THREE from "three";
import type { MeshFactory } from "./MeshFactory";
import { ObjectLifecycleManagerConfig } from "../types";
import {
  BasicCelestialRenderer,
  CelestialObject,
} from "@teskooano/celestials-base";
import { gameStateService } from "@teskooano/core-state";

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
  private css2DManager?: CSS2DManager;
  private renderer: THREE.WebGLRenderer | null;
  private camera: THREE.PerspectiveCamera;
  private activeRenderers: Map<string, BasicCelestialRenderer>;

  constructor(config: ObjectLifecycleManagerConfig) {
    this.objects = config.objects;
    this.activeRenderers = config.activeRenderers;
    this.scene = config.scene;
    this.meshFactory = config.meshFactory;
    this.lodManager = config.lodManager;
    this.lightManager = config.lightManager;
    this.renderer = config.renderer;
    this.camera = config.camera;
    this.css2DManager = config.css2DManager;
  }

  /**
   * Synchronizes the Three.js scene objects with the latest state.
   * Adds new objects, updates existing ones, and removes objects no longer present.
   * @param newState - The latest state of renderable objects.
   */
  syncObjectsWithState(
    newStateRecord: Record<string, RenderableCelestialObject>,
  ): void {
    const newStateMap = new Map(Object.entries(newStateRecord));
    const newStateIds = new Set(newStateMap.keys());
    const currentIds = new Set(this.objects.keys());

    // Remove objects that are no longer in the new state
    currentIds.forEach((id) => {
      if (!newStateIds.has(id)) {
        this.removeObject(id);
      }
    });

    // Process objects in the new state
    newStateIds.forEach((id) => {
      const objectData = newStateMap.get(id);
      if (!objectData) return; // Should not happen if newStateIds comes from newStateMap.keys()

      const mesh = this.objects.get(id); // Check if a THREE.Object3D (the renderer.lod) exists

      // Handle destroyed or annihilated objects first
      if (objectData.status === CelestialStatus.DESTROYED) {
        if (mesh) {
          // If a mesh exists for a destroyed object, remove it
          this.removeObject(id);
        }
        // If no mesh, and it's destroyed, do nothing further with this object.
        return;
      }

      // At this point, objectData.status is not DESTROYED or ANNIHILATED.
      if (mesh) {
        // Object has an existing mesh and is not marked for destruction, so update it.
        // The updateObject method will call renderer.update(), which should use the object's current state.
        this.updateObject(objectData, newStateMap);
      } else {
        // No mesh exists for this object, and it's not marked for destruction.
        // Add it only if it's ACTIVE.
        if (objectData.status === CelestialStatus.ACTIVE) {
          this.addObject(objectData, newStateMap);
        }
        // If it's INACTIVE or some other non-destructive, non-active state, and no mesh exists,
        // we don't create one here. It will be created if/when its status changes to ACTIVE.
      }
    });
  }

  /**
   * Creates and adds a new Three.js mesh representation for a celestial object.
   * @param object - The data for the new celestial object.
   * @param allRenderableObjects - A map of all currently renderable objects, to look up parent data for labels.
   */
  addObject(
    object: RenderableCelestialObject,
    allRenderableObjects: ReadonlyMap<string, RenderableCelestialObject>,
  ): void {
    const objectId = object.celestialObjectId;
    if (this.objects.has(objectId) || this.activeRenderers.has(objectId)) {
      console.warn(
        `[ObjectLifecycleManager] Attempted to add existing object or renderer for ${objectId}. Updating instead.`,
      );
      this.updateObject(object, allRenderableObjects);
      return;
    }

    const allCoreCelestialObjects = gameStateService.getCelestialObjects();
    const fullCelestialObject = allCoreCelestialObjects[objectId];

    if (!fullCelestialObject) {
      console.error(
        `[ObjectLifecycleManager] CRITICAL: CelestialObject with ID '${objectId}' not found in gameStateService. Cannot create renderer. RenderableCelestialObject received:`,
        object,
      );
      return;
    }

    const newRenderer =
      this.meshFactory.createObjectRenderer(fullCelestialObject);

    if (!newRenderer || !newRenderer.lod) {
      console.warn(
        `[ObjectLifecycleManager] MeshFactory failed to create renderer or LOD for ${objectId}. Skipping add.`,
      );
      return;
    }

    const mesh = newRenderer.lod;

    this.scene.add(mesh);
    this.objects.set(objectId, mesh);
    this.activeRenderers.set(objectId, newRenderer);

    if (this.css2DManager) {
      this.css2DManager.createCelestialLabel(
        object,
        mesh,
        allRenderableObjects,
      );
    }
  }

  /**
   * Updates the position and rotation of an existing Three.js mesh.
   * @param object - The updated data for the celestial object.
   * @param allRenderableObjects - A map of all currently renderable objects, for context if needed.
   */
  updateObject(
    objectData: RenderableCelestialObject,
    allRenderableObjects: ReadonlyMap<string, RenderableCelestialObject>,
  ): void {
    const objectId = objectData.celestialObjectId;
    const existingRenderer = this.activeRenderers.get(objectId);
    const existingMesh = this.objects.get(objectId);

    if (!existingRenderer || !existingMesh) {
      console.warn(
        `[ObjectLifecycleManager] updateObject called for ${objectId}, but no existing renderer or mesh was found. This might indicate an object that was previously filtered out or an issue in the overall synchronization logic. It will not be added or updated by this method call.`,
      );
      return;
    }

    existingRenderer.update();

    if (this.css2DManager && existingMesh) {
      // Example: If label content needs to be updated from RenderableCelestialObject explicitly
      // this.css2DManager.updateCelestialLabel(objectData, existingMesh, allRenderableObjects);
    }
  }

  /**
   * Removes a Three.js mesh and associated resources from the scene and internal maps.
   * @param objectId - The ID of the celestial object to remove.
   */
  removeObject(objectId: string): void {
    const mesh = this.objects.get(objectId);
    const rendererInstance = this.activeRenderers.get(objectId);

    if (rendererInstance) {
      rendererInstance.dispose();
      this.activeRenderers.delete(objectId);
    } else {
      console.warn(
        `[ObjectLifecycleManager] No active renderer found for ${objectId} during removal.`,
      );
    }

    if (mesh) {
      if (this.css2DManager) {
        this.css2DManager.removeElement(
          CSS2DLayerType.CELESTIAL_LABELS,
          objectId,
        );
      }
      this.lodManager.remove(objectId);
      this.scene.remove(mesh);

      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
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
        }
      });

      this.objects.delete(objectId);
    }
  }

  /**
   * Cleans up all managed objects.
   */
  dispose(): void {
    this.activeRenderers.forEach((renderer, id) => {
      renderer.dispose();
    });
    this.activeRenderers.clear();

    this.objects.forEach((obj, id) => this.removeObject(id));
    this.objects.clear();
  }
}
