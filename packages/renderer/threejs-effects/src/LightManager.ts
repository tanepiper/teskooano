import { renderableObjects$ } from "@teskooano/core-state";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { Observable, Subscription } from "rxjs";
import * as THREE from "three";

/**
 * Manages light sources in the scene, particularly star lights
 */
export class LightManager {
  private starLights: Map<string, THREE.Light> = new Map();
  private scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight;

  private objectsSubscription: Subscription | null = null;

  /**
   * Create a new LightManager
   */
  constructor(
    scene: THREE.Scene,

    private objects$: Observable<
      Record<string, RenderableCelestialObject>
    > = renderableObjects$,
  ) {
    this.scene = scene;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    this.subscribeToStore();
  }

  /**
   * Subscribe to the renderable objects store to update light positions.
   * @internal
   */
  private subscribeToStore(): void {
    this.objectsSubscription = this.objects$.subscribe(
      (objects: Record<string, RenderableCelestialObject>) => {
        for (const id in objects) {
          const objectData = objects[id];
          if (objectData.type === "STAR" && objectData.position) {
            const light = this.starLights.get(id);
            if (light) {
              light.position.copy(objectData.position);
            } else {
            }
          }
        }
      },
    );
  }

  /**
   * Add a star light to the scene
   */
  addStarLight(
    id: string,
    position: THREE.Vector3,
    color: number = 0xffffff,
    intensity: number = 1.5,
  ): void {
    const light = new THREE.PointLight(color, intensity, 0, 0.5);
    light.position.set(position.x, position.y, position.z);
    this.scene.add(light);
    this.starLights.set(id, light);
  }

  /**
   * Update a star light's position
   * DEPRECATED: Position is now updated via store subscription.
   * Kept for potential direct manipulation if needed, but generally unused.
   */
  updateStarLight(id: string, position: THREE.Vector3): void {
    console.warn(
      "[LightManager] updateStarLight is deprecated. Positions are updated via store subscription.",
    );
    const light = this.starLights.get(id);
    if (light) {
      light.position.set(position.x, position.y, position.z);
    }
  }

  /**
   * Remove a star light from the scene
   */
  removeStarLight(id: string): void {
    const light = this.starLights.get(id);
    if (light) {
      this.scene.remove(light);
      this.starLights.delete(id);
    }
  }

  /**
   * Get all star light positions for use in shaders or other calculations
   */
  getStarLightPositions(): Map<string, THREE.Vector3> {
    const positions = new Map<string, THREE.Vector3>();

    this.starLights.forEach((light, id) => {
      positions.set(id, light.position.clone());
    });

    return positions;
  }

  /**
   * Get all star light data (position, color, and intensity) for use in renderers
   */
  getStarLightsData(): Map<
    string,
    { position: THREE.Vector3; color: THREE.Color; intensity: number }
  > {
    const lightData = new Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >();

    this.starLights.forEach((light, id) => {
      if (
        light instanceof THREE.PointLight ||
        light instanceof THREE.SpotLight
      ) {
        lightData.set(id, {
          position: light.position.clone(),
          color: light.color.clone(),
          intensity: light.intensity,
        });
      } else if (light instanceof THREE.DirectionalLight) {
        lightData.set(id, {
          position: light.position.clone(),
          color: light.color.clone(),
          intensity: light.intensity,
        });
      } else {
        console.warn(
          `LightManager: Light with id ${id} is not a recognized type with color/intensity properties.`,
        );
        lightData.set(id, {
          position: light.position.clone(),
          color: new THREE.Color(0xffffff),
          intensity: 1.0,
        });
      }
    });

    return lightData;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.objectsSubscription?.unsubscribe();
    this.objectsSubscription = null;

    this.starLights.forEach((light) => {
      this.scene.remove(light);
    });
    this.starLights.clear();

    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
    }
  }
}
