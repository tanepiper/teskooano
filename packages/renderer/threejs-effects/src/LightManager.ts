import * as THREE from "three";
import { renderableStore } from "@teskooano/core-state";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { CelestialType, StarProperties } from "@teskooano/data-types";
import { Observable, Subscription, EMPTY } from "rxjs";
import { tap, catchError, map } from "rxjs/operators";

/**
 * @internal Structure defining the actions to perform on lights based on state changes.
 */
interface LightActionPlan {
  adds: {
    id: string;
    position: THREE.Vector3;
    color?: number;
    intensity?: number;
  }[];
  updates: {
    id: string;
    position: THREE.Vector3;
    color?: number;
    intensity?: number;
  }[];
  removes: string[];
}

/**
 * @class LightManager
 * @description Manages light sources within the Three.js scene, focusing on PointLights
 *              representing stars. It subscribes to the renderable objects state
 *              to automatically add, update, and remove star lights.
 */
export class LightManager {
  /** @internal Scene graph object where lights are added. */
  private scene: THREE.Scene;
  /** @internal Map storing active star point lights, keyed by object ID. */
  private starLights: Map<string, THREE.PointLight> = new Map();
  /** @internal Ambient light providing baseline illumination. */
  private ambientLight: THREE.AmbientLight;
  /** @internal Subscription to the object state changes. */
  private objectsSubscription: Subscription | null = null;
  /** @internal Observable stream of renderable object data. */
  private objects$: Observable<Record<string, RenderableCelestialObject>>;

  /**
   * Creates an instance of LightManager.
   * @param scene - The Three.js scene to manage lights within.
   * @param camera - The Three.js camera.
   * @param enablePostProcessing - Whether post-processing is enabled.
   * @param objects$ - An optional Observable stream of renderable objects. Defaults to `renderableStore.renderableObjects$` from `@teskooano/core-state`.
   * @param textureLoader - An optional THREE.TextureLoader for loading textures.
   */
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    enablePostProcessing: boolean,
    objects$: Observable<
      Record<string, RenderableCelestialObject>
    > = renderableStore.renderableObjects$,
    private textureLoader?: THREE.TextureLoader,
  ) {
    this.scene = scene;
    this.objects$ = objects$;

    // Initialize with a soft white ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    this.subscribeToStore();
  }

  /**
   * @internal
   * Subscribes to the `objects$` stream to manage star lights based on object data.
   * - Adds new star lights.
   * - Updates positions of existing star lights.
   * - Removes star lights for objects no longer present or not stars.
   */
  private subscribeToStore(): void {
    if (this.objectsSubscription) {
      console.warn(
        "[LightManager] Already subscribed to store. Ignoring call.",
      );
      return;
    }

    this.objectsSubscription = this.objects$
      .pipe(
        map(
          (
            objects: Record<string, RenderableCelestialObject>,
          ): LightActionPlan => {
            // Calculate the changes needed based on the new object state
            const plan: LightActionPlan = {
              adds: [],
              updates: [],
              removes: [],
            };
            const currentLightIds = new Set(this.starLights.keys());
            const incomingStarIds = new Set<string>();

            // Determine adds and updates
            for (const id in objects) {
              const objectData = objects[id];
              if (
                objectData.type === CelestialType.STAR &&
                objectData.position &&
                objectData.properties // Ensure properties exist for color
              ) {
                const starProps = objectData.properties as StarProperties;
                const color = starProps.color
                  ? new THREE.Color(starProps.color).getHex()
                  : undefined;
                const intensity = objectData.temperature
                  ? this.calculateIntensity(objectData.temperature)
                  : undefined;
                const position = objectData.position; // Already a THREE.Vector3

                incomingStarIds.add(id);

                if (currentLightIds.has(id)) {
                  // Exists, plan an update
                  plan.updates.push({ id, position, color, intensity });
                } else {
                  // New, plan an add
                  plan.adds.push({ id, position, color, intensity });
                }
              }
            }

            // Determine removals
            currentLightIds.forEach((id) => {
              if (!incomingStarIds.has(id)) {
                plan.removes.push(id);
              }
            });

            return plan;
          },
        ),
        tap((plan: LightActionPlan) => {
          // Execute the plan: Perform side effects
          // Removals first
          plan.removes.forEach((id) => this.removeStarLight(id));

          // Then updates
          plan.updates.forEach((update) => {
            const light = this.starLights.get(update.id);
            if (light) {
              light.position.copy(update.position);
              if (update.color !== undefined) light.color.setHex(update.color);
              if (update.intensity !== undefined)
                light.intensity = update.intensity;
            }
          });

          // Finally adds
          plan.adds.forEach((add) => {
            this.addStarLight(add.id, add.position, add.color, add.intensity);
          });
        }),
        catchError((error) => {
          console.error("[LightManager] Error in object subscription:", error);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  /**
   * Adds a point light representing a star to the scene.
   * Typically called internally by the store subscription, but can be used manually.
   *
   * @param id - The unique identifier for the star object.
   * @param position - The position of the star light.
   * @param color - The color of the light (default: 0xffffff).
   * @param intensity - The intensity of the light (default: 1.5).
   * @param distance - The distance of the light (default: 0).
   * @param decay - The decay of the light (default: 0.5).
   */
  addStarLight(
    id: string,
    position: THREE.Vector3,
    color: number = 0xffffff,
    intensity: number = 1.5,
    distance: number = 0,
    decay: number = 0.5,
  ): void {
    if (this.starLights.has(id)) {
      console.warn(
        `[LightManager] Star light ${id} already exists. Skipping add.`,
      );
      return;
    }
    const light = new THREE.PointLight(color, intensity, distance, decay);
    light.position.copy(position);
    this.scene.add(light);
    this.starLights.set(id, light);
  }

  /**
   * Removes a star light from the scene and internal tracking.
   *
   * @param id - The unique identifier of the star light to remove.
   */
  removeStarLight(id: string): void {
    const light = this.starLights.get(id);
    if (light) {
      this.scene.remove(light);
      light.dispose();
      this.starLights.delete(id);
    }
  }

  /**
   * Retrieves the current positions of all active star lights.
   *
   * @returns A Map where keys are star IDs and values are their THREE.Vector3 positions.
   */
  getStarLightPositions(): Map<string, THREE.Vector3> {
    const positions = new Map<string, THREE.Vector3>();
    this.starLights.forEach((light, id) => {
      positions.set(id, light.position.clone());
    });
    return positions;
  }

  /**
   * Retrieves detailed data (position, color, intensity) for all active star lights.
   *
   * @returns A Map where keys are star IDs and values are objects containing position, color, and intensity.
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
      // Currently only handles PointLight, ensure type safety if other types are added.
      lightData.set(id, {
        position: light.position.clone(),
        color: light.color.clone(),
        intensity: light.intensity,
      });
    });

    return lightData;
  }

  /**
   * @internal
   * Calculates light intensity based on star temperature (Placeholder).
   * Needs a more physically accurate model.
   * @param temperature - Star temperature in Kelvin.
   * @returns Calculated light intensity.
   */
  private calculateIntensity(temperature: number): number {
    // Basic placeholder: Intensity increases with temperature.
    // Scale factor needs tuning based on visual requirements.
    return 1.0 + Math.max(0, (temperature - 3000) / 5000); // Example scaling
  }

  /**
   * Cleans up resources used by the LightManager.
   * Removes all lights from the scene and unsubscribes from the store.
   */
  dispose(): void {
    // Unsubscribe from the observable
    this.objectsSubscription?.unsubscribe();
    this.objectsSubscription = null;

    // Remove all managed star lights
    this.starLights.forEach((light) => {
      this.scene.remove(light);
      light.dispose?.(); // Dispose if needed
    });
    this.starLights.clear();

    // Remove ambient light
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
      this.ambientLight.dispose?.(); // Dispose if needed
    }
  }
}
