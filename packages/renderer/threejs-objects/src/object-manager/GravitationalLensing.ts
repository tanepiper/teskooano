import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { CelestialType, StellarType } from "@teskooano/data-types";
import { StarProperties } from "@teskooano/data-types";
import {
  CelestialRenderer,
  SchwarzschildBlackHoleRenderer,
  KerrBlackHoleRenderer,
  NeutronStarRenderer,
} from "@teskooano/systems-celestial";

/**
 * @internal
 * Configuration for GravitationalLensingHandler.
 */
export interface GravitationalLensingHandlerConfig {
  starRenderers: Map<string, CelestialRenderer>;
  // Add other dependencies if they exist, e.g., post-processing manager
}

/**
 * Manages the setup and potential teardown of gravitational lensing effects for specific types of celestial objects
 * (Black Holes, Neutron Stars). It identifies objects requiring lensing based on their properties and collaborates
 * with their specialized `CelestialRenderer` instances (e.g., `SchwarzschildBlackHoleRenderer`) to apply the effect,
 * passing necessary Three.js context (renderer, scene, camera, mesh).
 */
export class GravitationalLensingHandler {
  /** @internal Set of object IDs that have been identified as needing lensing but haven't had the effect applied yet. */
  private lensingObjectsToAdd: Set<string> = new Set();
  /** @internal Reference to the map of active star renderers, used to find the correct renderer for applying lensing. */
  private starRenderers: Map<string, CelestialRenderer>;
  private lensingObjects: Map<
    string,
    { pass?: any; objectData: RenderableCelestialObject }
  > = new Map(); // Store pass reference if applicable

  /**
   * Creates a new GravitationalLensingHandler instance.
   * @param config - Configuration object containing the active star renderers.
   */
  constructor(config: GravitationalLensingHandlerConfig) {
    this.starRenderers = config.starRenderers;
  }

  /**
   * Checks if a given celestial object requires gravitational lensing based on its type and properties.
   * Currently checks for `StellarType.BLACK_HOLE`, `StellarType.KERR_BLACK_HOLE`, and `StellarType.NEUTRON_STAR`.
   *
   * @param object - The celestial object data.
   * @returns `true` if the object requires lensing, `false` otherwise.
   */
  needsGravitationalLensing(object: RenderableCelestialObject): boolean {
    if (object.type === CelestialType.STAR) {
      const starProps = object.properties as StarProperties;

      return (
        starProps?.stellarType === StellarType.BLACK_HOLE ||
        starProps?.stellarType === StellarType.KERR_BLACK_HOLE ||
        starProps?.stellarType === StellarType.NEUTRON_STAR
      );
    }

    return false;
  }

  /**
   * Marks an object ID as needing gravitational lensing setup.
   * This is typically called by the `ObjectManager` when an object identified by `needsGravitationalLensing`
   * is first added to the scene.
   *
   * @param objectId - The ID of the celestial object to mark.
   */
  addLensingObject(objectId: string): void {
    this.lensingObjectsToAdd.add(objectId);
  }

  /**
   * Removes an object ID from the set of objects needing lensing setup.
   * This is used if the object is removed from the scene before the lensing effect could be applied.
   * NOTE: Currently does not handle *removing* an already applied lensing effect.
   *
   * @param objectId - The ID of the celestial object to remove from the pending list.
   */
  removeLensingObject(objectId: string): void {
    this.lensingObjectsToAdd.delete(objectId);
  }

  /**
   * Attempts to apply the gravitational lensing effect setup to a specific object.
   * This method is called by the `ObjectManager` when a new object mesh is created.
   * It checks if the object ID is in the `lensingObjectsToAdd` set, finds the corresponding
   * specialized star renderer (e.g., `SchwarzschildBlackHoleRenderer`), and calls its
   * `addGravitationalLensing` method, passing the required context.
   *
   * @param objectData - The data for the celestial object.
   * @param renderer - The main WebGLRenderer instance.
   * @param scene - The main Three.js scene.
   * @param camera - The main Three.js camera.
   * @param mesh - The specific Three.js mesh/Object3D for the celestial object.
   */
  applyGravitationalLensing(
    objectData: RenderableCelestialObject,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    mesh: THREE.Object3D,
  ): void {
    if (!this.lensingObjectsToAdd.has(objectData.celestialObjectId)) return;

    const starRenderer = this.starRenderers.get(objectData.celestialObjectId);

    if (mesh && starRenderer) {
      if (
        starRenderer instanceof SchwarzschildBlackHoleRenderer ||
        starRenderer instanceof KerrBlackHoleRenderer ||
        starRenderer instanceof NeutronStarRenderer
      ) {
        starRenderer.addGravitationalLensing(
          objectData,
          renderer,
          scene,
          camera,
          mesh,
        );

        this.lensingObjectsToAdd.delete(objectData.celestialObjectId);
      }
    } else {
      console.warn(
        `[LensingHandler] Mesh or StarRenderer not ready for lensing object ${objectData.celestialObjectId}`,
      );
    }
  }

  /**
   * Clears the set of object IDs pending gravitational lensing setup.
   * Typically called during the `dispose` phase of the `ObjectManager`.
   */
  clear(): void {
    this.lensingObjectsToAdd.clear();
  }
}
