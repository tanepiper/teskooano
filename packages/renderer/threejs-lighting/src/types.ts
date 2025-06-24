import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { Observable } from "rxjs";
import type * as THREE from "three";

/**
 * @internal Structure defining the actions to perform on lights based on state changes.
 */
export interface LightActionPlan {
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
 * Configuration for the LightManager.
 */
export interface LightManagerConfig {
  /** The Three.js scene to manage lights within. */
  scene: THREE.Scene;
  /** The Three.js camera. */
  camera: THREE.Camera;
  /** Whether post-processing is enabled. */
  enablePostProcessing: boolean;
  /** An optional Observable stream of renderable objects. Defaults to `StateAccessor.getRenderableObjectsStream()`. */
  objects$?: Observable<Record<string, RenderableCelestialObject>>;
  /** The color of the ambient light. Defaults to 0xffffff. */
  ambientLightColor?: number;
  /** The intensity of the ambient light. Defaults to 0.3. */
  ambientLightIntensity?: number;
  /** The default color for new star point lights. Defaults to 0xffffff. */
  defaultStarLightColor?: number;
  /** The default intensity for new star point lights. Defaults to 1.5. */
  defaultStarLightIntensity?: number;
  /** The default distance for new star point lights. Defaults to 0 (no falloff). */
  defaultStarLightDistance?: number;
  /** The default decay for new star point lights. Defaults to 0.5. */
  defaultStarLightDecay?: number;
  /** Configuration for calculating star light intensity from temperature. */
  intensityCalculation?: {
    /** The base intensity value. Defaults to 1.0. */
    base: number;
    /** The minimum temperature (in Kelvin) before intensity starts increasing. Defaults to 3000. */
    minTemp: number;
    /** The divisor used to scale the temperature difference. Defaults to 5000. */
    divisor: number;
  };
}
