import type { RenderableCelestialObject } from "@teskooano/data-types";
import { renderableStore } from "@teskooano/core-state";
import { type CelestialRenderer } from "@teskooano/systems-celestial";
import type * as THREE from "three";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type { LightSourceComponent } from "@teskooano/renderer-threejs-lighting";

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
  lightingManager: LightingManager;
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
  private lightingManager: LightingManager;
  private loggedIds = new Set<string>();

  constructor(config: RendererUpdaterConfig) {
    this.celestialRenderers = config.celestialRenderers;
    this.starRenderers = config.starRenderers;
    this.planetRenderers = config.planetRenderers;
    this.moonRenderers = config.moonRenderers;
    this.lightingManager = config.lightingManager;
  }

  updateRenderers(
    time: number,
    timeScale: number,
    camera: THREE.Camera,
    allMeshes: Map<string, THREE.Object3D>,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
  ): void {
    const context = { time, timeScale, camera, renderer, scene, allMeshes };

    this.processRendererMap(this.starRenderers, context);
    this.processRendererMap(this.planetRenderers, context);
    this.processRendererMap(this.moonRenderers, context);
    this.processRendererMap(this.celestialRenderers, context);
  }

  private convertToLightSourceMap(
    lights: LightSourceComponent[],
  ): LightSourcesMap {
    const map: LightSourcesMap = new Map();
    lights.forEach((comp) => {
      const light = comp.light as THREE.PointLight;
      map.set(comp.celestialObject.celestialObjectId, {
        position: light.position,
        color: light.color,
        intensity: light.intensity,
      });
    });
    return map;
  }

  private processRendererMap(
    rendererMap: Map<string, CelestialRenderer>,
    context: {
      time: number;
      timeScale: number;
      camera: THREE.Camera;
      allMeshes: Map<string, THREE.Object3D>;
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

      const { time, timeScale, camera, renderer, scene, allMeshes } = context;

      // Get influential lights specifically for this object
      const influentialLights =
        this.lightingManager.getInfluentialLights(object);
      const lightSources = this.convertToLightSourceMap(influentialLights);

      rendererInstance.update(
        object,
        time,
        timeScale,
        lightSources,
        camera,
        allObjects,
        Object.fromEntries(allMeshes),
      );
    });
  }

  dispose(): void {
    this.loggedIds.clear();
  }
}
