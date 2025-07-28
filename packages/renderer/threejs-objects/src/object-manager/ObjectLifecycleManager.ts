import {
  CelestialStatus,
  CelestialType,
  StellarType,
  type RenderableCelestialObject,
  type StarProperties,
} from "@teskooano/data-types";
import {
  CelestialLabelLayer,
  CSS2DLayerType,
  type Layer2DManager,
} from "@teskooano/renderer-threejs-labels";
import {
  LightSourceComponent,
  type LightingManager,
} from "@teskooano/renderer-threejs-lighting";
import type { LODManager } from "@teskooano/renderer-threejs-lod";
import { RenderOrderManager } from "@teskooano/renderer-threejs-core";
import * as THREE from "three";
import type { GravitationalLensingHandler } from "./GravitationalLensing";
import type { MeshFactory } from "./MeshFactory";

/**
 * @internal
 * Configuration object for ObjectLifecycleManager dependencies.
 */
export interface ObjectLifecycleManagerConfig {
  objects: Map<string, THREE.Object3D>;
  scene: THREE.Scene;
  meshFactory: MeshFactory;
  lodManager: LODManager;
  lightingManager: LightingManager;
  lensingHandler: GravitationalLensingHandler;
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera;
  css2DManager?: Layer2DManager;
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
  private lightingManager: LightingManager;
  private lensingHandler: GravitationalLensingHandler;
  private css2DManager?: Layer2DManager;
  private renderer: THREE.WebGLRenderer | null;

  private camera: THREE.PerspectiveCamera; // Add camera reference

  constructor(config: ObjectLifecycleManagerConfig) {
    this.objects = config.objects;
    this.scene = config.scene;
    this.meshFactory = config.meshFactory;
    this.lodManager = config.lodManager;
    this.lightingManager = config.lightingManager;
    this.lensingHandler = config.lensingHandler;
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

      if (id === "barycenter") {
        return;
      }

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

    let group = this.scene.getObjectByName(`GROUP_${objectId}`);
    if (!group) {
      group = new THREE.Group();
      group.name = `GROUP_${objectId}`;
      this.scene.add(group);
    }

    const mesh = this.meshFactory.createObjectMesh(object);
    if (!mesh) {
      console.warn(
        `[ObjectLifecycleManager] MeshFactory failed to create mesh for ${objectId}. Skipping add.`,
      );

      // Additional debug info for asteroids
      if (object.type === CelestialType.ASTEROID) {
        console.error(
          `[ObjectLifecycleManager] ASTEROID MESH CREATION FAILED for ${objectId}`,
          object,
        );
      }
      return;
    }

    group.add(mesh);
    this.objects.set(objectId, mesh);

    // Apply correct render order for proper depth sorting
    RenderOrderManager.applyRenderOrder(group, object.type);

    // Handle associated components (lights, labels, lensing)
    if (object.type === CelestialType.STAR && object.position) {
      // Check if this is a black hole - black holes should NOT be light sources
      const starProps = object.properties as StarProperties;
      const isBlackHole = starProps?.stellarType === StellarType.BLACK_HOLE;

      if (!isBlackHole) {
        // Only register non-black hole stars as light sources
        // Pass the mesh group so the light is attached to the celestial object's group
        this.lightingManager.register(new LightSourceComponent(object), mesh);
      }
    }

    // Register gas giants and planets as shadow casters for inter-planetary shadowing
    if (
      (object.type === CelestialType.GAS_GIANT ||
        object.type === CelestialType.PLANET ||
        object.type === CelestialType.DWARF_PLANET ||
        object.type === CelestialType.ASTEROID ||
        object.type === CelestialType.COMET) &&
      mesh
    ) {
      mesh.castShadow = true; // Initially disabled
      mesh.receiveShadow = true; // Can receive shadows from other planets
      this.lightingManager.registerShadowCaster(objectId, mesh, object);

      // Ring shadow casters are registered by the mesh creators after LOD creation
    }

    // For comets, the mesh is an LOD object. The label should be added
    // to the LOD object itself so it's not affected by level switching.
    const celestialLayer = this.css2DManager?.getLayer(
      CSS2DLayerType.CELESTIAL_LABELS,
    ) as CelestialLabelLayer;
    if (celestialLayer) {
      celestialLayer.createLabel(object, mesh);
    } else {
      console.warn(
        `[ObjectLifecycleManager] No celestial layer available for label creation for ${objectId}`,
      );
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

    // Apply updates
    existingMesh.position.copy(object.position);

    // Only apply rotation if it's not a COMET, as comet rotation is handled internally
    if (object.type !== CelestialType.COMET) {
      existingMesh.quaternion.copy(object.rotation);
    }
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
    this.lightingManager.unregister(objectId); // Remove associated light
    this.lightingManager.unregisterShadowCaster(objectId); // Remove shadow caster registration
    this.lightingManager.unregisterRingShadowCasters(`${objectId}-rings`); // Remove ring shadow casters

    // Remove the entire object group from the scene. This is the correct way to
    // remove the object, as it's contained within this group, not as a direct
    // child of the scene.
    const group = this.scene.getObjectByName(`GROUP_${objectId}`);
    if (group) {
      this.scene.remove(group);
    } else {
      // Fallback for objects that might not be in a group (legacy or other cases)
      mesh.removeFromParent();
    }

    // Dispose of geometries and materials
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
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
      }
    });

    // Remove from the main tracking map
    this.objects.delete(objectId);
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
