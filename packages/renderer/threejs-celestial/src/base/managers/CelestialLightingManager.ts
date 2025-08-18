import type { RenderableCelestialObject } from "@teskooano/data-types";
import { LightSourceData, LightSourcesMap, LightingConfig } from "../lighting";
import { LightingCalculator } from "../lighting/LightingCalculator";
import { ShadowCasterUtils } from "../lighting/ShadowCasterUtils";
import type { ShadowCasterData } from "../lighting/ShadowCasterUtils";
import { BaseCelestialRenderer } from "../BaseCelestialRenderer";

/**
 * Manages lighting functionality for celestial renderers.
 * Provides centralized access to lighting calculations, shadow casting, and light source management.
 */
export class CelestialLightingManager {
  /**
   * Reference to the base celestial renderer that owns this manager.
   */
  private renderer?: BaseCelestialRenderer;

  /**
   * Instance-based lighting calculator for this manager.
   */
  private lightingCalculator?: LightingCalculator;

  /**
   * Instance-based shadow caster utility for this manager.
   */
  private shadowCasterUtils?: ShadowCasterUtils;

  /**
   * Internal light sources map managed by this lighting manager.
   */
  private lightSources: LightSourcesMap = new Map();

  /**
   * Creates a new CelestialLightingManager.
   * @param renderer Optional reference to the base celestial renderer.
   */
  constructor(renderer?: BaseCelestialRenderer) {
    this.renderer = renderer;
  }

  /**
   * Updates the internal light sources map.
   * @param lightSources Map of light sources to store
   */
  public updateLightSources(lightSources: LightSourcesMap): void {
    if (!lightSources || !(lightSources instanceof Map)) {
      console.warn(
        "CelestialLightingManager: lightSources is not a Map in updateLightSources",
      );
      return;
    }
    this.lightSources = new Map(lightSources);
  }

  /**
   * Gets the current light sources map.
   * @returns The current light sources map
   */
  public getLightSources(): LightSourcesMap {
    return this.lightSources;
  }

  /**
   * Applies distance-based attenuation to the internal light sources.
   * This is a common operation that should be performed by most renderers to ensure
   * physically accurate lighting falloff.
   *
   * @param config Optional configuration for attenuation
   * @param forceRefresh Whether to force a cache refresh
   * @returns The attenuated light sources
   */
  public applyLightAttenuation(
    config?: LightingConfig,
    forceRefresh: boolean = false,
  ): LightSourcesMap {
    if (!this.lightingCalculator) {
      return this.lightSources;
    }
    return this.lightingCalculator.applyDistanceAttenuation(
      this.lightSources,
      config,
      forceRefresh,
    );
  }

  /**
   * Finds all shadow casters that can affect a celestial object.
   * This includes moons for planets, or parent planets for moons.
   *
   * @param forceRefresh Whether to force a cache refresh
   * @returns Array of shadow caster data
   */
  public findShadowCasters(forceRefresh: boolean = false): ShadowCasterData[] {
    if (!this.shadowCasterUtils) {
      return [];
    }
    return this.shadowCasterUtils.findShadowCasters(forceRefresh);
  }

  /**
   * Finds shadow casters specifically for ring systems.
   * This includes the parent body and any moons.
   *
   * @param forceRefresh Whether to force a cache refresh
   * @returns Array of shadow caster data
   */
  public findRingShadowCasters(
    forceRefresh: boolean = false,
  ): ShadowCasterData[] {
    if (!this.shadowCasterUtils) {
      return [];
    }
    return this.shadowCasterUtils.findRingShadowCasters(forceRefresh);
  }

  /**
   * Finds the closest light source to a celestial object.
   * This is useful for effects that need to respond to a single primary light source.
   *
   * @param forceRefresh Whether to force a cache refresh
   * @returns The closest light source, or null if none available
   */
  public findClosestLightSource(
    forceRefresh: boolean = false,
  ): LightSourceData | null {
    if (!this.lightingCalculator) {
      return null;
    }
    return this.lightingCalculator.findClosestLightSource(
      this.lightSources,
      forceRefresh,
    );
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
    if (!this.lightingCalculator) {
      return lightSource.intensity ?? 1.0;
    }
    return this.lightingCalculator.calculateLightIntensityAtDistance(
      lightSource,
      distance,
      falloffFactor,
    );
  }

  /**
   * Calculates dynamic ambient lighting based on nearby stars and their luminosity.
   * This replaces hardcoded ambient values with realistic distance-based ambient light.
   *
   * @param forceRefresh Whether to force a cache refresh
   * @returns Dynamic ambient light intensity based on star proximity and luminosity
   */
  public calculateDynamicAmbientLight(forceRefresh: boolean = false): number {
    if (!this.lightingCalculator) {
      return 0.05; // Default minimum ambient - much darker for better contrast
    }
    return this.lightingCalculator.calculateDynamicAmbientLight(
      this.lightSources,
      forceRefresh,
    );
  }

  /**
   * Sets the base celestial renderer reference.
   * @param renderer The renderer to set.
   */
  public setRenderer(renderer: BaseCelestialRenderer): void {
    this.renderer = renderer;
  }

  /**
   * Initializes the lighting calculator and shadow caster utils with a celestial object.
   * @param object The celestial object to initialize with.
   */
  public initializeLightingCalculator(object: RenderableCelestialObject): void {
    this.lightingCalculator = new LightingCalculator(object);
    this.shadowCasterUtils = new ShadowCasterUtils(object);
  }

  /**
   * Updates the lighting calculator and shadow caster utils with new object data.
   * @param object The updated celestial object.
   * @param allObjects Optional map of all objects for enhanced calculations.
   */
  public updateLightingCalculator(
    object: RenderableCelestialObject,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): void {
    if (this.lightingCalculator) {
      this.lightingCalculator.updateObject(object);
      if (allObjects) {
        this.lightingCalculator.updateAllObjects(allObjects);
      }
    }

    if (this.shadowCasterUtils) {
      this.shadowCasterUtils.updateObject(object);
      if (allObjects) {
        this.shadowCasterUtils.updateAllObjects(allObjects);
      }
    }
  }

  /**
   * Gets lighting calculator cache statistics for debugging.
   * @returns Cache statistics or null if calculator not initialized.
   */
  public getLightingCacheStats() {
    return this.lightingCalculator?.getCacheStats() || null;
  }

  /**
   * Gets shadow caster cache statistics for debugging.
   * @returns Cache statistics or null if shadow caster utils not initialized.
   */
  public getShadowCasterCacheStats() {
    return this.shadowCasterUtils?.getCacheStats() || null;
  }

  /**
   * Clears the shadow caster cache.
   */
  public dispose(): void {
    this.shadowCasterUtils?.dispose();
  }
}
