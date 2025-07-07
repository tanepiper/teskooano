import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import {
  LightSourceData,
  LightSourcesMap,
  LightingCalculator,
  ShadowCasterUtils,
  ShadowCasterData,
  LightingConfig,
} from "../CelestialRenderer";
import { CelestialType } from "@teskooano/data-types";

/**
 * Manages lighting functionality for celestial renderers.
 * Provides centralized access to lighting calculations, shadow casting, and light source management.
 */
export class CelestialLightingManager {
  /**
   * Optional reference to the scene's lighting manager.
   */
  private lightingManager?: LightingManager;

  /**
   * Creates a new CelestialLightingManager.
   * @param lightingManager Optional reference to the scene's lighting manager.
   */
  constructor(lightingManager?: LightingManager) {
    this.lightingManager = lightingManager;
  }

  /**
   * Applies distance-based attenuation to light sources for a celestial object.
   * This is a common operation that should be performed by most renderers to ensure
   * physically accurate lighting falloff.
   *
   * @param object The celestial object
   * @param lightSources Map of light sources to attenuate
   * @param config Optional configuration for attenuation
   * @returns The attenuated light sources
   */
  public applyLightAttenuation(
    object: RenderableCelestialObject,
    lightSources: LightSourcesMap,
    config?: LightingConfig,
  ): LightSourcesMap {
    return LightingCalculator.applyDistanceAttenuation(
      object,
      lightSources,
      config,
    );
  }

  /**
   * Finds all shadow casters that can affect a celestial object.
   * This includes moons for planets, or parent planets for moons.
   *
   * @param object The celestial object
   * @param allObjects Map of all objects in the scene
   * @returns Array of shadow caster data
   */
  public findShadowCasters(
    object: RenderableCelestialObject,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): ShadowCasterData[] {
    if (!allObjects) {
      return [];
    }
    return ShadowCasterUtils.findShadowCasters(object, allObjects);
  }

  /**
   * Finds shadow casters specifically for ring systems.
   * This includes the parent body and any moons.
   *
   * @param object The object that owns the ring system
   * @param allObjects Map of all objects in the scene
   * @returns Array of shadow caster data
   */
  public findRingShadowCasters(
    object: RenderableCelestialObject,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): ShadowCasterData[] {
    if (!allObjects) {
      return [];
    }
    return ShadowCasterUtils.findRingShadowCasters(object, allObjects);
  }

  /**
   * Finds the closest light source to a celestial object.
   * This is useful for effects that need to respond to a single primary light source.
   *
   * @param object The celestial object
   * @param lightSources Map of available light sources
   * @returns The closest light source, or null if none available
   */
  public findClosestLightSource(
    object: RenderableCelestialObject,
    lightSources?: LightSourcesMap,
  ): LightSourceData | null {
    if (!lightSources) {
      return null;
    }
    return LightingCalculator.findClosestLightSource(object, lightSources);
  }

  /**
   * Finds the most influential light source for a given object.
   * It prioritizes the object's `primaryLightSourceId` if it exists and is
   * present in the provided light sources map. Otherwise, it falls back to the
   * first available light source.
   * @param object The celestial object.
   * @param lightSources A map of available light sources.
   * @returns The most influential light source, or null if none are available.
   */
  public findPrimaryLightSource(
    object: RenderableCelestialObject,
    lightSources?: LightSourcesMap,
  ): LightSourceData | null {
    if (!lightSources || lightSources.size === 0) return null;

    if (
      object.primaryLightSourceId &&
      lightSources.has(object.primaryLightSourceId)
    ) {
      return lightSources.get(object.primaryLightSourceId) || null;
    }

    return lightSources.values().next().value || null;
  }

  /**
   * Calculates light intensity at a specific distance from a light source.
   *
   * @param lightSource The light source
   * @param distance Distance from the light source
   * @param falloffFactor Optional custom falloff factor
   * @returns Attenuated light intensity
   */
  public calculateLightIntensityAtDistance(
    lightSource: LightSourceData,
    distance: number,
    falloffFactor?: number,
  ): number {
    return LightingCalculator.calculateLightIntensityAtDistance(
      lightSource,
      distance,
      falloffFactor,
    );
  }

  /**
   * Gets the scene's lighting manager if available.
   * @returns The lighting manager, or undefined if not set.
   */
  public getLightingManager(): LightingManager | undefined {
    return this.lightingManager;
  }

  /**
   * Sets the scene's lighting manager.
   * @param lightingManager The lighting manager to set.
   */
  public setLightingManager(lightingManager: LightingManager): void {
    this.lightingManager = lightingManager;
  }

  /**
   * Checks if a lighting manager is available.
   * @returns True if a lighting manager is set.
   */
  public hasLightingManager(): boolean {
    return this.lightingManager !== undefined;
  }
}
