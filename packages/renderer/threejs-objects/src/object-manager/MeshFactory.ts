import {
  CelestialType,
  GasGiantClass,
  GasGiantProperties,
  StarProperties,
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

  // --- Private Creation Methods ---

  private createStarMesh(object: RenderableCelestialObject): THREE.Object3D {
    let renderer = this.starRenderers.get(object.celestialObjectId);

    // If no ID-specific renderer, try to create one
    if (!renderer) {
      // Ensure properties are available and are StarProperties
      if (object.type === CelestialType.STAR && object.properties) {
        const starProps = object.properties as StarProperties;
        try {
          // Create renderer using the factory function
          const newRenderer = createStarRenderer(
            starProps.spectralClass,
            starProps.stellarType,
          );
          if (newRenderer) {
            renderer = newRenderer;
            this.starRenderers.set(object.celestialObjectId, renderer);
          } else {
            console.warn(
              `[MeshFactory] createStarRenderer failed for ${object.celestialObjectId} (Class: ${starProps.spectralClass}, Type: ${starProps.stellarType}).`,
            );
          }
        } catch (error) {
          console.error(
            `[MeshFactory] Error calling createStarRenderer for ${object.celestialObjectId}:`,
            error,
          );
          // Proceed without a specific renderer, will likely hit fallback
        }
      } else {
        console.warn(
          `[MeshFactory] Missing or invalid properties for STAR ${object.celestialObjectId}. Cannot create specific renderer.`,
        );
      }
    }

    // If we found or created a renderer, try using it
    if (renderer?.getLODLevels) {
      const lodLevels = renderer.getLODLevels(object);
      if (lodLevels && lodLevels.length > 0) {
        const lod = this.createLodCallback(object, lodLevels);
        // Ensure renderer is stored if it was just created (already done above)
        return lod;
      } else {
        console.warn(
          `[MeshFactory] Renderer for STAR ${object.celestialObjectId} provided invalid LOD levels.`,
        );
      }
    } else {
      // Log if we failed to get levels even if renderer exists
      if (renderer) {
        console.warn(
          `[MeshFactory] Renderer found for STAR ${object.celestialObjectId} but it lacks getLODLevels.`,
        );
      } else {
        console.warn(
          `[MeshFactory] No suitable renderer found or created for STAR ${object.celestialObjectId}.`,
        );
      }
    }

    // Fallback if any step above failed
    return this.createFallbackSphere(object);
  }

  private createPlanetMesh(object: RenderableCelestialObject): THREE.Object3D {
    let renderer = this.planetRenderers.get(object.celestialObjectId);

    // If no ID-specific renderer, create and store a default one
    if (!renderer) {
      try {
        renderer = new BaseTerrestrialRenderer(); // Assuming this is the default
        // Only set if successfully created
        if (renderer) {
          this.planetRenderers.set(object.celestialObjectId, renderer);
        }
      } catch (error) {
        console.error(
          `[MeshFactory] Failed to create default BaseTerrestrialRenderer for ${object.celestialObjectId}:`,
          error,
        );
        return this.createFallbackSphere(object);
      }
    }

    // Add check here: if renderer is still undefined after try/catch, fallback
    if (!renderer) {
      console.error(
        `[MeshFactory] Failed to find or create a renderer for PLANET/DWARF ${object.celestialObjectId}.`,
      );
      return this.createFallbackSphere(object);
    }

    if (renderer.getLODLevels) {
      const lodLevels = renderer.getLODLevels(object);
      if (lodLevels && lodLevels.length > 0) {
        const lod = this.createLodCallback(object, lodLevels);
        return lod;
      } else {
        console.warn(
          `[MeshFactory] Renderer for PLANET/DWARF ${object.celestialObjectId} provided invalid LOD levels.`,
        );
      }
    } else {
      console.warn(
        `[MeshFactory] Renderer for PLANET/DWARF ${object.celestialObjectId} does not have getLODLevels.`,
      );
    }
    return this.createFallbackSphere(object);
  }

  private createMoonMesh(object: RenderableCelestialObject): THREE.Object3D {
    let renderer = this.moonRenderers.get(object.celestialObjectId);

    // If no ID-specific renderer, create and store a default one (assuming same as planet)
    if (!renderer) {
      try {
        renderer = new BaseTerrestrialRenderer();
        // Only set if successfully created
        if (renderer) {
          this.moonRenderers.set(object.celestialObjectId, renderer);
        }
      } catch (error) {
        console.error(
          `[MeshFactory] Failed to create default BaseTerrestrialRenderer for MOON ${object.celestialObjectId}:`,
          error,
        );
        return this.createFallbackSphere(object);
      }
    }

    // Add check here: if renderer is still undefined after try/catch, fallback
    if (!renderer) {
      console.error(
        `[MeshFactory] Failed to find or create a renderer for MOON ${object.celestialObjectId}.`,
      );
      return this.createFallbackSphere(object);
    }

    if (renderer.getLODLevels) {
      const lodLevels = renderer.getLODLevels(object);
      if (lodLevels && lodLevels.length > 0) {
        const lod = this.createLodCallback(object, lodLevels);
        return lod;
      } else {
        console.warn(
          `[MeshFactory] Renderer for MOON ${object.celestialObjectId} provided invalid LOD levels.`,
        );
      }
    } else {
      console.warn(
        `[MeshFactory] Renderer for MOON ${object.celestialObjectId} does not have getLODLevels.`,
      );
    }
    return this.createFallbackSphere(object);
  }

  private createGasGiantMesh(
    object: RenderableCelestialObject,
  ): THREE.Object3D {
    // Type assertion to access gasGiantClass
    const properties = object.properties as GasGiantProperties | undefined;
    const rendererKey = properties?.gasGiantClass; // Use the class directly as the key

    if (!rendererKey) {
      console.warn(
        `[MeshFactory] Missing or invalid gasGiantClass for GAS_GIANT ${object.celestialObjectId}. Using fallback.`,
      );
      return this.createFallbackSphere(object);
    }

    const renderer = this.celestialRenderers.get(rendererKey);
    if (renderer?.getLODLevels) {
      const lodLevels = renderer.getLODLevels(object);
      if (lodLevels && lodLevels.length > 0) {
        const lod = this.createLodCallback(object, lodLevels);
        // Don't store instance renderer for gas giants usually, managed by class key
        return lod;
      } else {
        console.warn(
          `[MeshFactory] Renderer for GAS_GIANT ${object.celestialObjectId} (Key: ${rendererKey}) provided invalid LOD levels.`,
        );
      }
    } else {
      console.warn(
        `[MeshFactory] No suitable renderer with getLODLevels found for GAS_GIANT ${object.celestialObjectId} (Key: ${rendererKey}).`,
      );
    }
    return this.createFallbackSphere(object);
  }

  private createAsteroidMesh(
    object: RenderableCelestialObject,
  ): THREE.Object3D {
    // Use SPACE_ROCK type for lookup
    const renderer = this.celestialRenderers.get(CelestialType.SPACE_ROCK);
    if (renderer?.getLODLevels) {
      const lodLevels = renderer.getLODLevels(object);
      if (lodLevels && lodLevels.length > 0) {
        const lod = this.createLodCallback(object, lodLevels);
        // Store renderer instance? Probably not for individual asteroids if using a shared one.
        return lod;
      } else {
        console.warn(
          `[MeshFactory] Renderer for SPACE_ROCK ${object.celestialObjectId} provided invalid LOD levels.`,
        );
      }
    } else {
      // Fallback if no LODLevels, maybe a direct mesh creation method exists?
      // For now, assume LOD is preferred.
      console.warn(
        `[MeshFactory] No suitable renderer with getLODLevels found for SPACE_ROCK ${object.celestialObjectId}.`,
      );
    }
    return this.createFallbackSphere(object);
  }

  private createRingSystemMesh(
    object: RenderableCelestialObject,
  ): THREE.Object3D {
    let renderer = this.ringSystemRenderers.get(object.celestialObjectId);

    // If no ID-specific renderer, create and store a default one
    if (!renderer) {
      try {
        renderer = new RingSystemRenderer();
        this.ringSystemRenderers.set(object.celestialObjectId, renderer);
      } catch (error) {
        console.error(
          `[MeshFactory] Failed to create default RingSystemRenderer for ${object.celestialObjectId}:`,
          error,
        );
        return this.createFallbackSphere(object);
      }
    }

    // Now renderer is guaranteed to be RingSystemRenderer if created successfully
    if (renderer?.getLODLevels) {
      const lodLevels = renderer.getLODLevels(object);
      if (lodLevels && lodLevels.length > 0) {
        const lod = this.createLodCallback(object, lodLevels);
        return lod;
      } else {
        console.warn(
          `[MeshFactory] RingSystemRenderer for ${object.celestialObjectId} provided invalid LOD levels.`,
        );
      }
    } else {
      // This case should be less likely now if constructor succeeded
      console.warn(
        `[MeshFactory] RingSystemRenderer for ${object.celestialObjectId} does not have getLODLevels.`,
      );
    }
    return this.createFallbackSphere(object);
  }

  private createAsteroidFieldMesh(
    object: RenderableCelestialObject,
  ): THREE.Object3D {
    const renderer = this.celestialRenderers.get(CelestialType.ASTEROID_FIELD);
    if (renderer?.getLODLevels) {
      const lodLevels = renderer.getLODLevels(object);
      if (lodLevels && lodLevels.length > 0) {
        const lod = this.createLodCallback(object, lodLevels);
        // Don't store instance renderer for fields
        return lod;
      } else {
        console.warn(
          `[MeshFactory] Renderer for ASTEROID_FIELD ${object.celestialObjectId} provided invalid LOD levels.`,
        );
      }
    } else {
      // Asteroid fields might have a direct creation method if they don't use LODManager
      // E.g., if (typeof renderer?.createPoints === 'function') { return renderer.createPoints(object); }
      console.warn(
        `[MeshFactory] No suitable renderer with getLODLevels found for ASTEROID_FIELD ${object.celestialObjectId}.`,
      );
    }
    return this.createFallbackSphere(object);
  }

  /**
   * Creates a simple fallback sphere mesh.
   * Used when debug mode is enabled or if specific mesh creation fails.
   * @param object - The celestial object data (used for radius).
   * @returns A simple THREE.Mesh sphere.
   */
  private createFallbackSphere(object: RenderableCelestialObject): THREE.Mesh {
    const radius = object.radius || 1; // Use radius or default
    const geometry = new THREE.SphereGeometry(radius * 0.0001, 16, 8); // Slightly larger scale for visibility
    const material = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
  }
}
