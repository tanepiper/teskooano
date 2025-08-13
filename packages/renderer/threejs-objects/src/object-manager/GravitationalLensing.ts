import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { CelestialRenderer } from "@teskooano/renderer-threejs-celestial";
import {
  CelestialType,
  StarProperties,
  StellarType,
} from "@teskooano/data-types";
import { GravitationalLensingHelper } from "@teskooano/celestials-stars";

/**
 * @internal
 * Configuration for GravitationalLensingHandler.
 */
export interface GravitationalLensingHandlerConfig {
  celestialRenderers: Map<string, CelestialRenderer>;
}

/**
 * Manages the setup and lifecycle of gravitational lensing effects for massive objects.
 * It identifies which objects need the effect, then creates, updates, and disposes of
 * the underlying `GravitationalLensingHelper` instances.
 */
export class GravitationalLensingHandler {
  private celestialRenderers: Map<string, CelestialRenderer>;
  private lensingHelpers: Map<string, GravitationalLensingHelper> = new Map();

  constructor(config: GravitationalLensingHandlerConfig) {
    this.celestialRenderers = config.celestialRenderers;
  }

  /**
   * Checks if a given celestial object requires gravitational lensing.
   * @param object - The celestial object data.
   * @returns `true` if the object requires lensing, `false` otherwise.
   */
  public needsGravitationalLensing(object: RenderableCelestialObject): boolean {
    if (object.type === CelestialType.STAR) {
      const starProps = object.properties as StarProperties;
      return (
        starProps?.stellarType === StellarType.BLACK_HOLE ||
        starProps?.stellarType === StellarType.NEUTRON_STAR
      );
    }
    return false;
  }

  /**
   * Creates and applies the gravitational lensing effect for a specific object.
   * If a helper already exists for the object, this method does nothing.
   * @param object - The data for the celestial object.
   * @param renderer - The main WebGLRenderer instance.
   * @param scene - The main Three.js scene.
   * @param camera - The main Three.js camera.
   * @param mesh - The specific Three.js mesh/Object3D for the celestial object.
   */
  public applyGravitationalLensing(
    object: RenderableCelestialObject,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    mesh: THREE.Object3D,
  ): void {
    if (this.lensingHelpers.has(object.id)) {
      return; // Already has a lensing helper
    }

    const helper = new GravitationalLensingHelper(
      renderer,
      scene,
      camera,
      mesh,
    );
    this.lensingHelpers.set(object.id, helper);
  }

  /**
   * Removes and disposes of the lensing helper associated with the given object ID.
   * @param objectId - The ID of the celestial object to remove lensing from.
   */
  public removeLensingObject(objectId: string): void {
    const helper = this.lensingHelpers.get(objectId);
    if (helper) {
      helper.dispose();
      this.lensingHelpers.delete(objectId);
    }
  }

  /**
   * Updates all active gravitational lensing effects. This should be called once per frame.
   * @param renderer - The main WebGLRenderer instance.
   * @param scene - The main Three.js scene.
   * @param camera - The main Three.js camera.
   */
  public updateAll(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): void {
    this.lensingHelpers.forEach((helper) => {
      helper.update(renderer, scene, camera);
    });
  }

  /**
   * Disposes of all managed lensing helpers.
   */
  public clear(): void {
    this.lensingHelpers.forEach((helper) => helper.dispose());
    this.lensingHelpers.clear();
  }
}
