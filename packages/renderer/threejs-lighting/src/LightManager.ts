import * as THREE from "three";
import { renderableStore } from "@teskooano/core-state";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import {
  CelestialType,
  StarProperties,
  SystemLightingProperties,
} from "@teskooano/data-types";
import { EMPTY, Observable, Subscription } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import type { LightActionPlan, LightManagerConfig } from "./types";

/**
 * Manages light sources within the Three.js scene, focusing on PointLights
 * representing stars. It subscribes to the renderable objects state
 * to automatically add, update, and remove star lights.
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
  /** @internal Configuration for default light values and calculations. */
  private config: Required<
    Pick<
      LightManagerConfig,
      | "ambientLightColor"
      | "ambientLightIntensity"
      | "defaultStarLightColor"
      | "defaultStarLightIntensity"
      | "defaultStarLightDistance"
      | "defaultStarLightDecay"
      | "intensityCalculation"
    >
  >;
  /** @internal Flag to ensure system-wide lighting is set only once. */
  private systemLightingInitialized: boolean = false;

  /**
   * Creates an instance of LightManager.
   * @param config - The configuration object for the LightManager.
   */
  constructor(config: LightManagerConfig) {
    this.scene = config.scene;
    this.objects$ = config.objects$ || renderableStore.renderableObjects$;

    // Set defaults for optional config values
    this.config = {
      ambientLightColor: config.ambientLightColor ?? 0xffffff,
      ambientLightIntensity: config.ambientLightIntensity ?? 1,
      defaultStarLightColor: config.defaultStarLightColor ?? 0xffffff,
      defaultStarLightIntensity: config.defaultStarLightIntensity ?? 1.5,
      defaultStarLightDistance: config.defaultStarLightDistance ?? 1,
      defaultStarLightDecay: config.defaultStarLightDecay ?? 2,
      intensityCalculation: config.intensityCalculation ?? {
        base: 1.0,
        minTemp: 3000,
        divisor: 5000,
      },
    };

    // Initialize with a soft white ambient light
    this.ambientLight = new THREE.AmbientLight(
      this.config.ambientLightColor,
      this.config.ambientLightIntensity,
    );
    this.scene.add(this.ambientLight);

    this.subscribeToStore();
  }

  /**
   * Updates the scene's ambient light and default star intensity based on
   * properties from the primary star.
   * @param lightingProps - The system lighting properties.
   */
  public updateSystemLighting(lightingProps: SystemLightingProperties): void {
    if (!lightingProps) return;

    const newColor = new THREE.Color(lightingProps.ambientLightColor).getHex();
    this.ambientLight.color.setHex(newColor);
    this.config.ambientLightColor = newColor;

    this.ambientLight.intensity = lightingProps.ambientLightIntensity;
    this.config.ambientLightIntensity = lightingProps.ambientLightIntensity;

    this.config.defaultStarLightIntensity = lightingProps.starLightIntensity;

    console.log(
      `[LightManager] System lighting updated from primary star. Ambient: #${newColor.toString(16)} @ ${lightingProps.ambientLightIntensity.toFixed(2)}`,
    );
  }

  /**
   * @internal
   * Subscribes to the `objects$` stream to manage star lights based on object data.
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
                objectData.properties
              ) {
                const starProps = objectData.properties as StarProperties;

                // If this is the main star, update the system-wide lighting, but only once.
                if (
                  !this.systemLightingInitialized &&
                  starProps.isMainStar &&
                  starProps.systemLighting
                ) {
                  this.updateSystemLighting(starProps.systemLighting);
                  this.systemLightingInitialized = true;
                }

                const color = starProps.color
                  ? new THREE.Color(starProps.color).getHex()
                  : undefined;
                let intensity = starProps.systemLighting
                  ? starProps.systemLighting.starLightIntensity
                  : this.calculateIntensity(objectData.temperature);
                const position = objectData.position;

                if (typeof intensity !== "number" || !isFinite(intensity)) {
                  console.warn(
                    `[LightManager] Calculated invalid intensity for ${id} (temperature: ${objectData.temperature}). Using default.`,
                  );
                  intensity = this.config.defaultStarLightIntensity;
                }

                incomingStarIds.add(id);

                if (currentLightIds.has(id)) {
                  plan.updates.push({ id, position, color, intensity });
                } else {
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
          plan.removes.forEach((id) => this.removeStarLight(id));

          plan.updates.forEach((update) => {
            const light = this.starLights.get(update.id);
            if (light) {
              light.position.copy(update.position);
              if (update.color !== undefined) light.color.setHex(update.color);
              if (update.intensity !== undefined)
                light.intensity = update.intensity;
            }
          });

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
   *
   * @param id - The unique identifier for the star object.
   * @param position - The position of the star light.
   * @param color - The color of the light. Uses configured default if not provided.
   * @param intensity - The intensity of the light. Uses configured default if not provided.
   * @param distance - The distance of the light. Uses configured default if not provided.
   * @param decay - The decay of the light. Uses configured default if not provided.
   */
  addStarLight(
    id: string,
    position: THREE.Vector3,
    color?: number,
    intensity?: number,
    distance?: number,
    decay?: number,
  ): void {
    if (this.starLights.has(id)) {
      console.warn(
        `[LightManager] Star light ${id} already exists. Skipping add.`,
      );
      return;
    }
    const light = new THREE.PointLight(
      color ?? this.config.defaultStarLightColor,
      intensity ?? this.config.defaultStarLightIntensity,
      distance ?? this.config.defaultStarLightDistance,
      decay ?? this.config.defaultStarLightDecay,
    );
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
      lightData.set(id, {
        position: light.position.clone(),
        color: light.color.clone(),
        intensity: light.intensity,
      });
    });
    //console.log("lightData", lightData);
    return lightData;
  }

  /**
   * @internal
   * Calculates light intensity based on star temperature using configured parameters.
   * @param temperature - Star temperature in Kelvin.
   * @returns Calculated light intensity.
   */
  private calculateIntensity(temperature: number): number {
    if (typeof temperature !== "number" || !isFinite(temperature)) {
      return this.config.intensityCalculation.base;
    }
    const { base, minTemp, divisor } = this.config.intensityCalculation;
    return base + Math.max(0, (temperature - minTemp) / divisor);
  }

  /**
   * Cleans up resources used by the LightManager.
   */
  dispose(): void {
    this.objectsSubscription?.unsubscribe();
    this.objectsSubscription = null;

    this.starLights.forEach((light) => {
      this.scene.remove(light);
      light.dispose?.();
    });
    this.starLights.clear();

    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
      this.ambientLight.dispose?.();
    }
  }
}
