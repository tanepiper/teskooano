import {
  CelestialType,
  GasGiantClass,
  GasGiantProperties,
  PlanetProperties,
  RingProperties,
  StarProperties,
  SCALE,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import {
  BaseTerrestrialRenderer,
  CelestialRenderer,
  createStarRenderer,
  RingSystemRenderer,
  type LODLevel, // Import the LODLevel interface
} from "@teskooano/systems-celestial";
import * as THREE from "three";
import type { LODManager } from "@teskooano/renderer-threejs-effects"; // Import LODManager type

/**
 * Factory responsible for creating appropriate Three.js `Object3D` instances (primarily THREE.LOD objects)
 * for different types of celestial objects based on their `RenderableCelestialObject` data.
 * It utilizes specialized `CelestialRenderer` instances which are responsible for providing
 * the necessary LOD levels.
 */
export class MeshFactory {
  /** @internal Map storing specialized renderers for non-standard types (e.g., gas giants, asteroid fields). Keyed by type or class enum. */
  private celestialRenderers: Map<string, CelestialRenderer>;
  /** @internal Map storing specialized renderers specifically for stars. Keyed by object ID. */
  private starRenderers: Map<string, CelestialRenderer>;
  /** @internal Map storing specialized renderers specifically for planets/moons. Keyed by object ID. */
  private planetRenderers: Map<string, CelestialRenderer>;
  /** @internal Function provided by ObjectManager/LODManager to create a THREE.LOD object from levels. */
  private createAndRegisterLOD: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
  /** @internal Reference to the LODManager to query parent LOD levels. */
  private lodManager: LODManager;

  /**
   * Creates an instance of MeshFactory.
   * @param celestialRenderers - A map containing pre-initialized renderers for specific non-star/planet types.
   * @param starRenderers - An empty map that will be populated with star-specific renderers.
   * @param planetRenderers - An empty map that will be populated with planet/moon-specific renderers.
   * @param createAndRegisterLOD - A function passed from the `LODManager` used to construct a `THREE.LOD` object from an array of `LODLevel`.
   * @param lodManager - The LODManager instance itself, used to query parent LOD levels.
   */
  constructor(
    celestialRenderers: Map<string, CelestialRenderer>,
    starRenderers: Map<string, CelestialRenderer>,
    planetRenderers: Map<string, CelestialRenderer>,
    createAndRegisterLOD: (
      object: RenderableCelestialObject,
      levels: LODLevel[],
    ) => THREE.LOD,
    lodManager: LODManager, // Added lodManager parameter
  ) {
    this.celestialRenderers = celestialRenderers;
    this.starRenderers = starRenderers;
    this.planetRenderers = planetRenderers;
    this.createAndRegisterLOD = createAndRegisterLOD;
    this.lodManager = lodManager; // Store the LODManager instance
  }

  /**
   * Finds or creates the appropriate CelestialRenderer for the given object.
   * @internal
   * @param object - The celestial object data.
   * @returns The corresponding CelestialRenderer instance, or `null` if none is found/created.
   */
  private getOrCreateRenderer(
    object: RenderableCelestialObject,
  ): CelestialRenderer | null {
    const objectId = object.celestialObjectId;

    // --- Specific Type Handling ---
    if (object.type === CelestialType.STAR) {
      if (this.starRenderers.has(objectId)) {
        return this.starRenderers.get(objectId)!;
      }
      const starProps = object.properties as StarProperties;
      if (!starProps) {
        console.error(`[MeshFactory] Missing properties for STAR ${objectId}`);
        return null;
      }
      const renderer = createStarRenderer(
        starProps.spectralClass,
        starProps.stellarType,
      );
      if (renderer) {
        this.starRenderers.set(objectId, renderer);
      }
      return renderer;
    }

    if (
      object.type === CelestialType.PLANET ||
      object.type === CelestialType.DWARF_PLANET ||
      object.type === CelestialType.MOON
    ) {
      if (this.planetRenderers.has(objectId)) {
        return this.planetRenderers.get(objectId)!;
      }
      // Assuming BaseTerrestrialRenderer handles all these for now
      // It will need to implement getLODLevels
      try {
        const renderer = new BaseTerrestrialRenderer();
        this.planetRenderers.set(objectId, renderer);
        return renderer;
      } catch (error) {
        console.error(
          `[MeshFactory] Failed to instantiate BaseTerrestrialRenderer for ${objectId}:`,
          error,
        );
        return null;
      }
    }

    // --- Specialized Renderers (from celestialRenderers map) ---
    let rendererKey: string | undefined;
    if (object.type === CelestialType.GAS_GIANT) {
      const properties = object.properties as GasGiantProperties;
      if (properties?.gasGiantClass) {
        rendererKey = properties.gasGiantClass;
      } else {
        console.warn(
          `[MeshFactory] Missing gasGiantClass for GAS_GIANT ${objectId}. Falling back.`,
        );
        rendererKey = GasGiantClass.CLASS_I; // Fallback to Class I Gas Giant renderer
      }
    } else {
      // Use the CelestialType enum value as the key for other types
      rendererKey = object.type;
    }

    if (rendererKey && this.celestialRenderers.has(rendererKey)) {
      return this.celestialRenderers.get(rendererKey)!;
    }

    // Specific fallback for Gas Giants if class-specific wasn't found
    if (
      object.type === CelestialType.GAS_GIANT &&
      rendererKey !== GasGiantClass.CLASS_I
    ) {
      console.warn(
        `[MeshFactory] Renderer for ${rendererKey} not found. Using default CLASS_I Gas Giant renderer for ${objectId}.`,
      );
      return this.celestialRenderers.get(GasGiantClass.CLASS_I) || null;
    }

    console.warn(
      `[MeshFactory] No specific renderer found for ${object.celestialObjectId} (Type: ${object.type}).`,
    );
    return null;
  }

  /**
   * The main method to create a Three.js `Object3D` (usually a THREE.LOD object) for a given celestial object.
   * It finds the appropriate renderer, calls its `getLODLevels` method, and uses the LODManager
   * to construct the final LOD object.
   *
   * @param object - The data describing the celestial object to render.
   * @returns A Three.js `Object3D` representing the celestial object, or a fallback sphere on failure.
   */
  createObjectMesh(object: RenderableCelestialObject): THREE.Object3D {
    const renderer = this.getOrCreateRenderer(object);

    if (!renderer) {
      console.error(
        `[MeshFactory] No renderer found for ${object.celestialObjectId}. Creating fallback sphere.`,
      );
      return this.createFallbackSphere(object);
    }

    // --- Standard LOD Path ---
    try {
      // Check if the renderer has the required getLODLevels method
      if (typeof (renderer as any).getLODLevels !== "function") {
        throw new Error(
          `Renderer for type ${object.type} (ID: ${object.celestialObjectId}) does not implement getLODLevels.`,
        );
      }

      // --- Ring System Specific Logic ---
      let options: any = { detailLevel: "high" }; // Default options
      if (
        (object.type === CelestialType.RING_SYSTEM ||
          object.type === CelestialType.ASTEROID_FIELD) &&
        object.parentId
      ) {
        const parentLOD = this.lodManager.getLODById(object.parentId);
        if (parentLOD) {
          const parentDistances = parentLOD.levels.map(
            (level: { distance: number }) => level.distance,
          );
          // Ensure distances are sorted if necessary (LOD levels should be)
          // parentDistances.sort((a, b) => a - b);
          options.parentLODDistances = parentDistances;
        } else {
          console.warn(
            `[MeshFactory] Could not find parent LOD for ring system ${object.celestialObjectId} (Parent ID: ${object.parentId}). Rings might not follow parent LOD.`,
          );
        }
      }
      // --- End Ring System Specific Logic ---

      const levels = (renderer as any).getLODLevels(object, options); // Pass constructed options

      if (!levels || levels.length === 0) {
        throw new Error(
          `getLODLevels returned empty or invalid levels for ${object.celestialObjectId}.`,
        );
      }

      // Use the function provided by LODManager to create the THREE.LOD object
      const lodObject = this.createAndRegisterLOD(object, levels);
      lodObject.name = object.celestialObjectId; // Set name on the final LOD object
      return lodObject;
    } catch (error) {
      console.error(
        `[MeshFactory] Failed to create LOD mesh for ${object.celestialObjectId}:`,
        error,
      );
      return this.createFallbackSphere(object);
    }
  }

  /**
   * Creates a simple fallback sphere mesh when a proper renderer or LOD levels are unavailable.
   * @internal
   */
  private createFallbackSphere(object: RenderableCelestialObject): THREE.Mesh {
    console.warn(
      `[MeshFactory] Creating fallback sphere for ${object.celestialObjectId}`,
    );
    const geometry = new THREE.SphereGeometry(
      object.radius > 0 ? object.radius : 1,
      16,
      8,
    );
    const material = new THREE.MeshBasicMaterial({
      color: this.getFallbackColor(object.type),
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${object.celestialObjectId}-fallback`;
    return mesh;
  }

  /**
   * Helper function to get a fallback color based on object type.
   * @internal
   */
  private getFallbackColor(type: CelestialType): THREE.ColorRepresentation {
    switch (type) {
      case CelestialType.STAR:
        return 0xffff00; // Yellow
      case CelestialType.PLANET:
        return 0x00ff00; // Green
      case CelestialType.DWARF_PLANET:
        return 0x00ffff; // Cyan
      case CelestialType.MOON:
        return 0xaaaaaa; // Grey
      case CelestialType.GAS_GIANT:
        return 0xff8800; // Orange
      case CelestialType.ASTEROID_FIELD:
        return 0x888888; // Dark Grey
      case CelestialType.OORT_CLOUD:
        return 0xeeeeee; // Light Grey
      case CelestialType.RING_SYSTEM:
        return 0xaa8844; // Brownish
      default:
        return 0xff00ff; // Magenta (error/unknown)
    }
  }

  // Remove obsolete private methods like:
  // createStarMesh
  // createPlanetMesh
  // createMoonMesh
  // createAsteroidOrOortCloudMesh
  // createSpecializedOrGasGiantMesh
  // createDefaultMesh
  // getPlanetColor
  // createRingSystemMesh
  // (getOrCreateRenderer and createObjectMesh replace their core logic)
}
