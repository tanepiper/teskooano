import {
  CelestialType,
  GasGiantClass,
  GasGiantProperties,
  StarProperties,
  StellarType,
} from "@teskooano/data-types";
import type { LODManager } from "@teskooano/renderer-threejs-effects";
import {
  BaseTerrestrialRenderer,
  createStarRenderer,
  type CelestialRenderer,
  type LODLevel,
} from "@teskooano/systems-celestial";
import { RingSystemRenderer } from "@teskooano/systems-celestial";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import {
  createAsteroidFieldMesh,
  createAsteroidMesh,
  createFallbackSphere,
  createGasGiantMesh,
  createMoonMesh,
  createPlanetMesh,
  createRingSystemMesh,
  createStarMesh,
} from "./mesh-creators"; // Import creator functions

/**
 * @internal
 * Configuration for MeshFactory.
 */
export interface MeshFactoryConfig {
  celestialRenderers: Map<string, CelestialRenderer>;
  starRenderers: Map<string, CelestialRenderer>;
  planetRenderers: Map<string, CelestialRenderer>;
  moonRenderers: Map<string, CelestialRenderer>;
  ringSystemRenderers: Map<string, RingSystemRenderer>;
  lodManager: LODManager;
  camera: THREE.PerspectiveCamera; // Needed for LOD registration?
  createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * @internal
 * Factory class responsible for creating appropriate Three.js mesh objects
 * for different types of celestial bodies based on their data.
 * It delegates the actual creation logic to specialized functions.
 */
export class MeshFactory {
  private celestialRenderers: Map<string, CelestialRenderer>;
  private starRenderers: Map<string, CelestialRenderer>;
  private planetRenderers: Map<string, CelestialRenderer>;
  private moonRenderers: Map<string, CelestialRenderer>;
  private ringSystemRenderers: Map<string, RingSystemRenderer>;
  private lodManager: LODManager;
  private createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
  private camera: THREE.PerspectiveCamera;
  private debugMode: boolean = false;

  // Store deps needed by creator functions
  private creatorDeps: {
    starRenderers: Map<string, CelestialRenderer>;
    planetRenderers: Map<string, CelestialRenderer>;
    moonRenderers: Map<string, CelestialRenderer>;
    ringSystemRenderers: Map<string, RingSystemRenderer>;
    celestialRenderers: Map<string, CelestialRenderer>;
    createLodCallback: (
      object: RenderableCelestialObject,
      levels: LODLevel[],
    ) => THREE.LOD;
  };

  constructor(config: MeshFactoryConfig) {
    this.celestialRenderers = config.celestialRenderers;
    this.starRenderers = config.starRenderers;
    this.planetRenderers = config.planetRenderers;
    this.moonRenderers = config.moonRenderers;
    this.ringSystemRenderers = config.ringSystemRenderers;
    this.lodManager = config.lodManager;
    this.createLodCallback = config.createLodCallback;
    this.camera = config.camera;

    // Prepare deps object for creator functions
    this.creatorDeps = {
      starRenderers: this.starRenderers,
      planetRenderers: this.planetRenderers,
      moonRenderers: this.moonRenderers,
      ringSystemRenderers: this.ringSystemRenderers,
      celestialRenderers: this.celestialRenderers,
      createLodCallback: this.createLodCallback,
    };
  }

  /**
   * Gets the camera instance used by the factory.
   * Potentially needed by other managers like ObjectLifecycleManager for lensing.
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Enables or disables debug mode.
   * In debug mode, simpler fallback meshes (like spheres) might be created.
   * @param enabled - True to enable debug mode, false otherwise.
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    // Note: This only affects subsequently created meshes.
    // Consider adding logic to recreate existing meshes if needed.
  }

  /**
   * Creates a Three.js Object3D (usually a Mesh or Group) for a given celestial object.
   * Selects the appropriate creation method based on the object's type and potentially
   * its class (e.g., for Gas Giants).
   * @param object - The data defining the celestial object.
   * @returns A Three.js Object3D representing the object, or null if creation fails.
   */
  public createObjectMesh(
    object: RenderableCelestialObject,
  ): THREE.Object3D | null {
    if (this.debugMode) {
      // Use the imported fallback function
      return createFallbackSphere(object);
    }

    try {
      let mesh: THREE.Object3D | null = null;

      // Prepare common arguments/dependencies for creators
      const deps = this.creatorDeps;

      // Call the appropriate imported creator function
      switch (object.type) {
        case CelestialType.STAR:
          mesh = createStarMesh(object, deps);
          break;
        case CelestialType.PLANET:
        case CelestialType.DWARF_PLANET:
          mesh = createPlanetMesh(object, deps);
          break;
        case CelestialType.MOON:
          mesh = createMoonMesh(object, deps);
          break;
        case CelestialType.GAS_GIANT:
          mesh = createGasGiantMesh(object, deps);
          break;
        case CelestialType.SPACE_ROCK:
          mesh = createAsteroidMesh(object, deps);
          break;
        case CelestialType.RING_SYSTEM:
          mesh = createRingSystemMesh(object, deps);
          break;
        case CelestialType.ASTEROID_FIELD:
          mesh = createAsteroidFieldMesh(object, deps);
          break;
        default:
          console.warn(
            `[MeshFactory] No mesh creation logic for type: ${object.type} (${object.celestialObjectId}). Creating fallback sphere.`,
          );
          // Use imported fallback function
          mesh = createFallbackSphere(object);
      }

      if (mesh) {
        mesh.name = `${object.type}_${object.celestialObjectId}`;
        mesh.userData = {
          celestialId: object.celestialObjectId,
          type: object.type,
        };
        // Set initial position and rotation
        mesh.position.copy(object.position);
        mesh.quaternion.copy(object.rotation);
      }

      return mesh;
    } catch (error) {
      console.error(
        `[MeshFactory] Error creating mesh for ${object.celestialObjectId} (${object.type}):`,
        error,
      );
      // Use imported fallback function
      return createFallbackSphere(object); // Return fallback on error
    }
  }

  // --- Private Creation Methods --- (These will be removed, including the class's private createFallbackSphere)
}
