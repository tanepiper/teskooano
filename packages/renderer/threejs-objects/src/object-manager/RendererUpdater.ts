import {
  type CelestialRenderer,
  type RingSystemRenderer,
  KerrBlackHoleRenderer,
  NeutronStarRenderer,
  SchwarzschildBlackHoleRenderer,
} from "@teskooano/systems-celestial";
import type * as THREE from "three";
import { getRenderableObjects } from "@teskooano/core-state";

/**
 * @internal
 * Configuration for RendererUpdater.
 */
export interface RendererUpdaterConfig {
  celestialRenderers: Map<string, CelestialRenderer>;
  starRenderers: Map<string, CelestialRenderer>;
  planetRenderers: Map<string, CelestialRenderer>;
  moonRenderers: Map<string, CelestialRenderer>;
  ringSystemRenderers: Map<string, RingSystemRenderer>;
}

/**
 * Helper class responsible for iterating through different categories of celestial renderers
 * (standard celestial, stars, planets, moons) and calling their respective `update` methods.
 * This centralizes the update logic, allowing the `ObjectManager` to simply delegate the task.
 * It specifically handles potentially different update requirements for specialized renderers
 * like black holes or neutron stars, passing necessary context like the renderer, scene, and camera.
 */
export class RendererUpdater {
  /** @internal Map storing general celestial renderers (e.g., asteroid fields, Oort clouds). Keyed by object ID. */
  private celestialRenderers: Map<string, CelestialRenderer>;
  /** @internal Map storing specialized star renderers. Keyed by object ID. */
  private starRenderers: Map<string, CelestialRenderer>;
  /** @internal Map storing specialized planet renderers. Keyed by object ID. */
  private planetRenderers: Map<string, CelestialRenderer>;
  /** @internal Map storing specialized moon renderers. Keyed by object ID. */
  private moonRenderers: Map<string, CelestialRenderer>;
  /** @internal Map storing ring system renderers. Keyed by object ID. */
  private ringSystemRenderers: Map<string, RingSystemRenderer>;

  /**
   * Creates an instance of RendererUpdater.
   * @param config - Configuration object containing maps of the different renderer types.
   */
  constructor(config: RendererUpdaterConfig) {
    this.celestialRenderers = config.celestialRenderers;
    this.starRenderers = config.starRenderers;
    this.planetRenderers = config.planetRenderers;
    this.moonRenderers = config.moonRenderers;
    this.ringSystemRenderers = config.ringSystemRenderers;
  }

  /**
   * Iterates through all managed renderer maps and calls the `update` method on each renderer instance
   * that has one defined. Passes the current time and optional context (lights, objects, renderer, scene, camera).
   * Differentiates between standard and specialized renderers.
   *
   * @param time - The current simulation time or delta time.
   * @param lightSources - Optional map of active light sources.
   * @param objects - Optional map of the actual THREE.Object3D instances (currently unused but available).
   * @param renderer - Optional WebGLRenderer instance, needed for some specialized renderers.
   * @param scene - Optional Scene instance, needed for some specialized renderers.
   * @param camera - Optional PerspectiveCamera instance, needed for some specialized renderers.
   */
  updateRenderers(
    time: number,
    lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    objects?: Map<string, THREE.Object3D>,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
    camera?: THREE.PerspectiveCamera,
  ): void {
    this.updateStandardRenderers(time, lightSources, camera, objects);

    this.updateSpecializedRenderers(
      time,
      lightSources,
      renderer,
      scene,
      camera,
      objects,
    );
  }

  /**
   * Updates renderers for standard objects like planets, moons, and generic celestial types.
   * Passes time, light sources, and camera information.
   * @internal
   * @param time - Current simulation time or delta time.
   * @param lightSources - Map of active light sources.
   * @param camera - The main camera.
   * @param objects - Map of the current THREE.Object3D instances managed by ObjectManager.
   */
  private updateStandardRenderers(
    time: number,
    lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    camera?: THREE.Camera,
    objects?: Map<string, THREE.Object3D>,
  ): void {
    const allRenderableObjects = getRenderableObjects();

    const processRendererMap = (
      rendererMap: Map<string, CelestialRenderer>,
    ) => {
      rendererMap.forEach((rendererInstance, id) => {
        if (rendererInstance.updateWith) {
          const renderableObject = allRenderableObjects[id];
          const existingMesh = objects?.get(id);

          if (renderableObject && existingMesh) {
            rendererInstance.updateWith(renderableObject, existingMesh);
          } else {
            if (!renderableObject) {
              console.warn(
                `[RendererUpdater] No RenderableCelestialObject found for ID: ${id} during updateWith call.`,
              );
            }
            if (!existingMesh) {
              console.warn(
                `[RendererUpdater] No existingMesh (THREE.Object3D) found for ID: ${id} from objects map during updateWith call.`,
              );
            }
          }
        }

        if (rendererInstance.update) {
          rendererInstance.update(time, lightSources, camera);
        }
      });
    };

    processRendererMap(this.celestialRenderers);
    processRendererMap(this.planetRenderers);
    processRendererMap(this.moonRenderers);
  }

  /**
   * Updates specialized renderers, particularly stars, checking if they require extra context
   * (renderer, scene, camera) for effects like gravitational lensing.
   * @internal
   * @param time - Current simulation time or delta time.
   * @param lightSources - Map of active light sources.
   * @param renderer - WebGLRenderer instance.
   * @param scene - Scene instance.
   * @param camera - PerspectiveCamera instance.
   * @param objects - Map of the current THREE.Object3D instances managed by ObjectManager.
   */
  private updateSpecializedRenderers(
    time: number,
    lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
    camera?: THREE.PerspectiveCamera,
    objects?: Map<string, THREE.Object3D>,
  ): void {
    this.starRenderers.forEach((starRenderer, id) => {
      if (starRenderer.update) {
        if (
          starRenderer instanceof SchwarzschildBlackHoleRenderer ||
          starRenderer instanceof KerrBlackHoleRenderer ||
          starRenderer instanceof NeutronStarRenderer
        ) {
          if (renderer && scene && camera) {
            starRenderer.update(time, lightSources, camera);
          }
        } else {
          starRenderer.update(time, lightSources, camera);
        }
      }
    });

    this.ringSystemRenderers.forEach((ringRenderer, id) => {
      if (objects && objects.has(id)) {
        if (ringRenderer.update) {
          ringRenderer.update(time, lightSources);
        }
      } else {
      }
    });
  }

  /**
   * Calls the dispose method on all managed renderers that have one.
   */
  dispose(): void {}
}
