/**
 * Debug Helper class to add debug functionality to CelestialRenderers
 * This file is in the celestial package to bridge between renderers and the debug package
 */
import * as THREE from "three";
import {
  celestialDebugger,
  isVisualizationEnabled,
  CelestialVectorPairs,
  OrbitalDebugData,
  PhysicsDebugData,
  MaterialDebugData,
  LightingDebugData,
} from "@teskooano/core-debug";
import type { LightSourcesMap } from "../common/CelestialRenderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Helper class that adds debug functionality to CelestialRenderers
 */
export class CelestialRendererDebugHelper {
  /**
   * Flag to control whether debug mode is enabled
   * This is checked in addition to the global isVisualizationEnabled()
   */
  private _debugEnabled: boolean = false;

  /**
   * The object ID this helper is associated with
   */
  private _objectId: string;

  /**
   * Constructor
   * @param objectId The ID of the celestial object this helper is for
   */
  constructor(objectId: string) {
    this._objectId = objectId;
  }

  /**
   * Update debug vectors for the celestial object
   *
   * @param object The renderable celestial object
   * @param lightSources Map of light sources
   */
  public updateDebugVectors(
    object: RenderableCelestialObject,
    lightSources?: LightSourcesMap,
  ): void {
    if (!this._debugEnabled || !isVisualizationEnabled()) return;

    const vectors: CelestialVectorPairs = {};

    if (lightSources && lightSources.size > 0) {
      let primaryLightSource;

      if (
        object.primaryLightSourceId &&
        lightSources.has(object.primaryLightSourceId)
      ) {
        primaryLightSource = lightSources.get(object.primaryLightSourceId);
      } else {
        primaryLightSource = lightSources.values().next().value;
      }

      if (primaryLightSource) {
        const lightDir = new THREE.Vector3()
          .copy(primaryLightSource.position)
          .sub(object.position || new THREE.Vector3())
          .normalize();

        vectors.lightDirection = lightDir;
      }
    }

    if (object.parentId) {
    }

    if (
      "physicsStateReal" in object &&
      typeof object.physicsStateReal === "object" &&
      object.physicsStateReal !== null
    ) {
      const physicsState = object.physicsStateReal as Record<string, unknown>;

      if (
        "velocity" in physicsState &&
        typeof physicsState.velocity === "object" &&
        physicsState.velocity !== null
      ) {
        const velocity = physicsState.velocity as Record<string, unknown>;

        if (
          "x" in velocity &&
          "y" in velocity &&
          "z" in velocity &&
          typeof velocity.x === "number" &&
          typeof velocity.y === "number" &&
          typeof velocity.z === "number"
        ) {
          vectors.velocity = new THREE.Vector3(
            velocity.x,
            velocity.y,
            velocity.z,
          );
        }
      }
    }

    celestialDebugger.setVectors(this._objectId, vectors);
  }

  /**
   * Update orbital debug data for the celestial object
   *
   * @param object The renderable celestial object
   */
  public updateOrbitalDebugData(object: RenderableCelestialObject): void {
    if (!this._debugEnabled || !isVisualizationEnabled()) return;

    const orbitalData: OrbitalDebugData = {};

    if (object.orbit) {
      orbitalData.semiMajorAxis = object.orbit.realSemiMajorAxis_m;
      orbitalData.eccentricity = object.orbit.eccentricity;
      orbitalData.inclination = object.orbit.inclination;
      orbitalData.longitudeAscendingNode =
        object.orbit.longitudeOfAscendingNode;
      orbitalData.argumentOfPeriapsis = object.orbit.argumentOfPeriapsis;
      orbitalData.meanAnomaly = object.orbit.meanAnomaly;
      orbitalData.period = object.orbit.period_s;
    }

    celestialDebugger.setOrbitalData(this._objectId, orbitalData);
  }

  /**
   * Update physics debug data for the celestial object
   *
   * @param object The renderable celestial object
   */
  public updatePhysicsDebugData(object: RenderableCelestialObject): void {
    if (!this._debugEnabled || !isVisualizationEnabled()) return;

    const physicsData: PhysicsDebugData = {};

    if ("realMass_kg" in object && typeof object.realMass_kg === "number") {
      physicsData.mass = object.realMass_kg;
    }

    if ("realRadius_m" in object && typeof object.realRadius_m === "number") {
      physicsData.radius = object.realRadius_m;

      if ("realMass_kg" in object && typeof object.realMass_kg === "number") {
        const mass = object.realMass_kg;
        const radius = object.realRadius_m;

        const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
        physicsData.density = mass / volume;

        const G = 6.6743e-11;
        physicsData.escapeVelocity = Math.sqrt((2 * G * mass) / radius);
      }
    }

    celestialDebugger.setPhysicsData(this._objectId, physicsData);
  }

  /**
   * Update material debug data with material details
   *
   * @param materialInfo Details about the material
   */
  public updateMaterialDebugData(materialInfo: MaterialDebugData): void {
    if (!this._debugEnabled || !isVisualizationEnabled()) return;

    celestialDebugger.setMaterialData(this._objectId, materialInfo);
  }

  /**
   * Update lighting debug data for the celestial object
   *
   * @param object The renderable celestial object
   * @param lightSources Map of light sources
   */
  public updateLightingDebugData(
    object: RenderableCelestialObject,
    lightSources?: LightSourcesMap,
  ): void {
    if (!this._debugEnabled || !isVisualizationEnabled()) return;

    const lightingData: LightingDebugData = {
      primaryLightSource: object.primaryLightSourceId,
    };

    if (
      object.primaryLightSourceId &&
      lightSources &&
      lightSources.has(object.primaryLightSourceId)
    ) {
      const lightSource = lightSources.get(object.primaryLightSourceId);
      if (lightSource) {
        lightingData.intensity = lightSource.intensity;
        lightingData.color = lightSource.color.getHexString();
      }
    }

    if ("temperature" in object && typeof object.temperature === "number") {
      lightingData.effectiveTemperature = object.temperature;
    }

    celestialDebugger.setLightingData(this._objectId, lightingData);
  }

  /**
   * Update all debug data for the celestial object
   *
   * @param object The renderable celestial object
   * @param lightSources Map of light sources
   */
  public updateAllDebugData(
    object: RenderableCelestialObject,
    lightSources?: LightSourcesMap,
  ): void {
    if (!this._debugEnabled || !isVisualizationEnabled()) return;

    this.updateDebugVectors(object, lightSources);
    this.updateOrbitalDebugData(object);
    this.updatePhysicsDebugData(object);
    this.updateLightingDebugData(object, lightSources);
  }

  /**
   * Clear all debug data for this object
   */
  public clearDebugData(): void {
    celestialDebugger.clearObjectDebugData(this._objectId);
  }

  /**
   * Enable or disable debug mode for this helper
   */
  public setDebugEnabled(enabled: boolean): void {
    this._debugEnabled = enabled;

    if (!enabled) {
      this.clearDebugData();
    }
  }

  /**
   * Check if debug mode is enabled for this helper
   */
  public isDebugEnabled(): boolean {
    return this._debugEnabled && isVisualizationEnabled();
  }
}
