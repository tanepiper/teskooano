import { StateAccessor } from "@teskooano/core-state";
import { type CelestialRenderer } from "@teskooano/renderer-threejs-celestial";
import type * as THREE from "three";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type { LightSourceComponent } from "@teskooano/renderer-threejs-lighting";
import type { RenderableCelestialObject } from "@teskooano/data-types"; // Corrected import path

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
  lightingManager: LightingManager;
}

/**
 * Helper class responsible for iterating through different categories of celestial renderers
 * and calling their respective `update` methods. This centralizes the update logic.
 */
export class RendererUpdater {
  private celestialRenderers: Map<string, CelestialRenderer>;

  private lightingManager: LightingManager;
  private loggedIds = new Set<string>();

  constructor(config: RendererUpdaterConfig) {
    this.celestialRenderers = config.celestialRenderers;
    this.lightingManager = config.lightingManager;
  }

  updateRenderers(
    time: number,
    timeScale: number,
    camera: THREE.PerspectiveCamera,
    allMeshes: Map<string, THREE.Object3D>,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
  ): void {
    const allRenderableObjects = StateAccessor.getCurrentRenderableObjects();
    const context = {
      time,
      timeScale,
      camera,
      renderer,
      scene,
      allMeshes,
      allRenderableObjects,
    };

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
      camera: THREE.PerspectiveCamera;
      allMeshes: Map<string, THREE.Object3D>;
      renderer?: THREE.WebGLRenderer;
      scene?: THREE.Scene;
      allRenderableObjects: Record<string, RenderableCelestialObject>;
    },
  ) {
    // const allObjects = StateAccessor.getCurrentRenderableObjects(); // Removed redundant call

    rendererMap.forEach((rendererInstance, objectId) => {
      const object = context.allRenderableObjects[objectId]; // Use directly from context
      if (!object) {
        return;
      }

      const {
        time,
        timeScale,
        camera,
        renderer,
        scene,
        allMeshes,
        allRenderableObjects,
      } = context;

      if (this.lightingManager) {
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
          allRenderableObjects, // Pass the pre-fetched allRenderableObjects
          Object.fromEntries(allMeshes),
        );
      } else {
        // Fallback if no lighting manager is present
        rendererInstance.update(
          object,
          time,
          timeScale,
          new Map(), // Pass empty map
          camera,
          allRenderableObjects, // Pass the pre-fetched allRenderableObjects
          Object.fromEntries(allMeshes),
        );
      }
    });
  }

  dispose(): void {
    this.loggedIds.clear();
  }
}
