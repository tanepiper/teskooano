import {
  type CelestialRenderer,
  KerrBlackHoleRenderer,
  NeutronStarRenderer,
  SchwarzschildBlackHoleRenderer,
} from "@teskooano/systems-celestial";
import type * as THREE from "three";
import { renderableStore } from "@teskooano/core-state";

type LightSourcesMap = Map<
  string,
  { position: THREE.Vector3; color: THREE.Color; intensity: number }
>;

/**
 * @internal
 * Configuration for RendererUpdater.
 */
export interface RendererUpdaterConfig {
  celestialRenderers: Map<string, CelestialRenderer>;
  starRenderers: Map<string, CelestialRenderer>;
  planetRenderers: Map<string, CelestialRenderer>;
  moonRenderers: Map<string, CelestialRenderer>;
}

/**
 * Helper class responsible for iterating through different categories of celestial renderers
 * and calling their respective `update` methods. This centralizes the update logic.
 */
export class RendererUpdater {
  private celestialRenderers: Map<string, CelestialRenderer>;
  private starRenderers: Map<string, CelestialRenderer>;
  private planetRenderers: Map<string, CelestialRenderer>;
  private moonRenderers: Map<string, CelestialRenderer>;

  constructor(config: RendererUpdaterConfig) {
    this.celestialRenderers = config.celestialRenderers;
    this.starRenderers = config.starRenderers;
    this.planetRenderers = config.planetRenderers;
    this.moonRenderers = config.moonRenderers;
  }

  updateRenderers(
    time: number,
    timeScale: number,
    camera: THREE.Camera,
    lightSources?: LightSourcesMap,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
  ): void {
    const context = { time, timeScale, lightSources, camera, renderer, scene };

    this.processRendererMap(this.starRenderers, context);
    this.processRendererMap(this.planetRenderers, context);
    this.processRendererMap(this.moonRenderers, context);
    this.processRendererMap(this.celestialRenderers, context);
  }

  private processRendererMap(
    rendererMap: Map<string, CelestialRenderer>,
    context: {
      time: number;
      timeScale: number;
      lightSources: LightSourcesMap | undefined;
      camera: THREE.Camera;
      renderer?: THREE.WebGLRenderer;
      scene?: THREE.Scene;
    },
  ) {
    const allObjects = renderableStore.getRenderableObjects();

    rendererMap.forEach((rendererInstance, objectId) => {
      const object = allObjects[objectId];
      if (!object) {
        return;
      }

      const { time, timeScale, lightSources, camera, renderer, scene } =
        context;

      if (
        (rendererInstance instanceof SchwarzschildBlackHoleRenderer ||
          rendererInstance instanceof KerrBlackHoleRenderer ||
          rendererInstance instanceof NeutronStarRenderer) &&
        renderer &&
        scene
      ) {
        rendererInstance.update(
          object,
          time,
          timeScale,
          lightSources,
          camera,
          renderer,
          scene,
        );
      } else {
        rendererInstance.update(object, time, timeScale, lightSources, camera);
      }
    });
  }

  dispose(): void {}
}
