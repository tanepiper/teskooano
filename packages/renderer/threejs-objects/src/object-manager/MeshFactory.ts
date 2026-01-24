import type { RenderableCelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { createOortCloudMesh } from "@teskooano/celestials-oort-cloud";
import { createAsteroidFieldMesh } from "@teskooano/celestials-asteroid-field";
import { createStarMesh } from "@teskooano/celestials-stars";
import {
  createMoonMesh,
  createPlanetMesh,
} from "@teskooano/celestials-terrestrial";
import { createCometMesh } from "@teskooano/celestials-comet";
import { createSatelliteMesh } from "@teskooano/celestials-satellite";
import { createGasGiantMesh } from "@teskooano/celestials-gas-giants";
import { createMesh as createAsteroidMesh } from "@teskooano/celestials-asteroid"; // Import asteroid createMesh as createAsteroidMesh
import {
  type CelestialRenderer,
  createFallbackSphere,
  type LODLevel,
  LODManager,
} from "@teskooano/renderer-threejs-celestial";
import * as THREE from "three";

/**
 * @internal
 * Configuration for MeshFactory.
 */
export interface MeshFactoryConfig {
  celestialRenderers: Map<string, CelestialRenderer>;

  lodManager: LODManager;
  lightingManager: LightingManager;
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

  private lodManager: LODManager;
  private lightingManager: LightingManager;
  private createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
  private camera: THREE.PerspectiveCamera;
  private debugMode: boolean = false;

  // Store deps needed by creator functions
  private creatorDeps: {
    celestialRenderers: Map<string, CelestialRenderer>;
    lightingManager: LightingManager;
    createLodObject: (
      object: RenderableCelestialObject,
      levels: LODLevel[],
    ) => THREE.LOD;
  };

  constructor(config: MeshFactoryConfig) {
    this.celestialRenderers = config.celestialRenderers;

    this.lodManager = config.lodManager;
    this.createLodCallback = config.createLodCallback;
    this.camera = config.camera;
    this.lightingManager = config.lightingManager;

    // Prepare deps object for creator functions
    this.creatorDeps = {
      celestialRenderers: this.celestialRenderers,
      createLodObject: this.createLodCallback,
      lightingManager: this.lightingManager,
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
        case CelestialType.ASTEROID_FIELD:
          mesh = createAsteroidFieldMesh(object, deps);
          break;
        case CelestialType.COMET:
          mesh = createCometMesh(object, deps);
          break;
        case CelestialType.SATELLITE:
          mesh = createSatelliteMesh(object, deps);
          break;
        case CelestialType.OORT_CLOUD:
          mesh = createOortCloudMesh(object, deps);
          break;
        case CelestialType.ASTEROID:
          mesh = createAsteroidMesh(object, deps);
          break;
        default:
          console.warn(
            `[MeshFactory] No mesh creation logic for type: ${object.type} (${object.id}). Creating fallback sphere.`,
          );
          // Use imported fallback function
          mesh = createFallbackSphere(object);
      }

      if (mesh) {
        mesh.name = `${object.type}_${object.id}`;
        mesh.userData = {
          celestialId: object.id,
          type: object.type,
        };
        // Set initial position and rotation
        mesh.position.copy(object.position);
        mesh.quaternion.copy(object.rotation);
      }

      return mesh;
    } catch (error) {
      console.error(
        `[MeshFactory] Error creating mesh for ${object.id} (${object.type}):`,
        error,
      );
      // Use imported fallback function
      return createFallbackSphere(object); // Return fallback on error
    }
  }
}
