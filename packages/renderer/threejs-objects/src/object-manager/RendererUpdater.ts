import { StateAccessor, StateSubscriptionMixin } from "@teskooano/core-state";
import { type CelestialRenderer } from "@teskooano/renderer-threejs-celestial";
import type * as THREE from "three";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type { LightSourceComponent } from "@teskooano/renderer-threejs-lighting";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { Observable } from "rxjs";

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
  renderableObjects$: Observable<Record<string, RenderableCelestialObject>>;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  allMeshes: Map<string, THREE.Object3D>;
}

/**
 * Helper class responsible for updating celestial renderers reactively based on state changes.
 * This class subscribes to renderable objects state changes and automatically updates
 * renderers when the state changes, rather than being called manually every frame.
 */
export class RendererUpdater extends StateSubscriptionMixin {
  private celestialRenderers: Map<string, CelestialRenderer>;
  private lightingManager: LightingManager;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private allMeshes: Map<string, THREE.Object3D>;
  private renderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;
  private loggedIds = new Set<string>();
  private lastUpdateTime = 0;

  constructor(config: RendererUpdaterConfig) {
    super();
    this.celestialRenderers = config.celestialRenderers;
    this.lightingManager = config.lightingManager;
    this.camera = config.camera;
    this.renderer = config.renderer;
    this.scene = config.scene;
    this.allMeshes = config.allMeshes;
    this.renderableObjects$ = config.renderableObjects$;

    // Subscribe to state changes
    this.subscribeToStateChanges();
  }

  /**
   * @internal Subscribes to renderable objects state changes to trigger renderer updates.
   */
  private subscribeToStateChanges(): void {
    // Subscribe to renderable objects changes
    this.subscribeToState(
      this.renderableObjects$,
      (objects: Record<string, RenderableCelestialObject>) => {
        this.updateRenderersReactive(objects);
      },
    );

    // Subscribe to simulation state changes (for time and timeScale updates)
    this.subscribeToState(StateAccessor.simulation$(), (simulationState) => {
      // Only update if we have renderable objects
      if (Object.keys(this.celestialRenderers).length > 0) {
        const allRenderableObjects = StateAccessor.getRenderableObjects();
        this.updateRenderersReactive(allRenderableObjects);
      }
    });
  }

  /**
   * Updates all renderers reactively when state changes.
   */
  public updateRenderersReactive(
    allRenderableObjects: Record<string, RenderableCelestialObject>,
  ): void {
    const simulationState = StateAccessor.getSimulationState();
    const time = simulationState.time;
    const timeScale = simulationState.timeScale;
    const allMeshesObject = Object.fromEntries(this.allMeshes);

    const context = {
      time,
      timeScale,
      camera: this.camera,
      renderer: this.renderer,
      scene: this.scene,
      allMeshes: this.allMeshes,
      allMeshesObject,
      allRenderableObjects,
    };

    this.processRendererMap(this.celestialRenderers, context);
  }

  /**
   * @deprecated Use reactive updates instead. This method is kept for backward compatibility.
   */
  updateRenderers(
    time: number,
    timeScale: number,
    camera: THREE.PerspectiveCamera,
    allMeshes: Map<string, THREE.Object3D>,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
  ): void {
    const allRenderableObjects = StateAccessor.getRenderableObjects();
    const currentTimeScale = StateAccessor.getSimulationState().timeScale;
    const context = {
      time,
      timeScale: currentTimeScale,
      camera,
      renderer: renderer || this.renderer,
      scene: scene || this.scene,
      allMeshes,
      allMeshesObject: Object.fromEntries(allMeshes),
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
      map.set(comp.celestialObject.id, {
        position: comp.celestialObject.position.clone(),
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
      allMeshesObject: Record<string, THREE.Object3D>;
      renderer?: THREE.WebGLRenderer;
      scene?: THREE.Scene;
      allRenderableObjects: Record<string, RenderableCelestialObject>;
    },
  ) {
    // const allObjects = StateAccessor.getRenderableObjects(); // Removed redundant call

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
        allMeshesObject,
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
          allMeshesObject,
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
          allMeshesObject,
        );
      }
    });
  }

  dispose(): void {
    this.loggedIds.clear();
  }
}
