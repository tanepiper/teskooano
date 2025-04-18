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

    // Get primary light source direction
    if (lightSources && lightSources.size > 0) {
      let primaryLightSource;

      // Try to find the primary light source for this object
      if (
        object.primaryLightSourceId &&
        lightSources.has(object.primaryLightSourceId)
      ) {
        primaryLightSource = lightSources.get(object.primaryLightSourceId);
      } else {
        // Fall back to the first light source
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

    // Get parent position if available
    if (object.parentId) {
      // The parent position would typically come from the renderable objects store
      // We can't include that dependency here, so this would be added by the renderer
    }

    // Add velocity if available - using explicit type checking to avoid TypeScript errors
    // The physicsStateReal property is not part of the RenderableCelestialObject interface,
    // so we need to be very careful when accessing it to avoid runtime errors
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

        // Check that velocity has the required x,y,z properties
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

    // Store the vectors
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

    // Add mass if available
    if ("realMass_kg" in object && typeof object.realMass_kg === "number") {
      physicsData.mass = object.realMass_kg;
    }

    // Add radius if available
    if ("realRadius_m" in object && typeof object.realRadius_m === "number") {
      physicsData.radius = object.realRadius_m;

      // Add mass-derived calculations if both mass and radius are available
      if ("realMass_kg" in object && typeof object.realMass_kg === "number") {
        const mass = object.realMass_kg;
        const radius = object.realRadius_m;

        // Calculate density
        const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
        physicsData.density = mass / volume;

        // Calculate escape velocity
        const G = 6.6743e-11; // Gravitational constant in m^3 kg^-1 s^-2
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

    // Add lighting details if available
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

    // Add temperature if available from the object
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

    // Clear debug data if disabling
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
