import type { RenderableCelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import * as THREE from "three";

/**
 * Options for light sources in the scene
 */
export interface LightSourceData {
  /**
   * World position of the light source
   */
  position: THREE.Vector3;

  /**
   * Color of the light source
   */
  color: THREE.Color;

  /**
   * Optional intensity of the light source
   * Default: 1.0
   */
  intensity?: number;
}

/**
 * Map of light sources
 */
export type LightSourcesMap = Map<string, LightSourceData>;

/**
 * Configuration for lighting calculations
 */
export interface LightingConfig {
  /**
   * Falloff factor for distance-based attenuation
   * Larger values create more dramatic falloff
   * @default 0.00000001
   */
  falloffFactor?: number;

  /**
   * Whether to modify light sources in-place or return new data
   * @default true
   */
  modifyInPlace?: boolean;
}

/**
 * Instance-based utility for calculating lighting effects and attenuation
 *
 * This class is designed to be instantiated per BaseCelestialRenderer and provides
 * efficient lighting calculations with caching and context awareness.
 */
export class LightingCalculator {
  /**
   * Default falloff factor for physically-based distance attenuation
   * using inverse-square law, scaled for solar system distances
   */
  private static readonly DEFAULT_FALLOFF_FACTOR = 0.00000001;

  /**
   * Ambient light calculation constants
   */
  private static readonly AMBIENT_FALLOFF_FACTOR = 0.000000001; // Stronger falloff for ambient
  private static readonly BASE_AMBIENT_INTENSITY = 0.35; // Base ambient when very close to a bright star
  private static readonly MIN_AMBIENT_INTENSITY = 0.02; // Minimum ambient - balanced contrast

  private object: RenderableCelestialObject;
  private allObjects?: Record<string, RenderableCelestialObject>;

  // Cache for lighting calculations
  private attenuatedLightSourcesCache: LightSourcesMap | null = null;
  private ambientLightCache: number | null = null;
  private closestLightSourceCache: LightSourceData | null = null;
  private lastUpdateTime: number = 0;
  private cacheValid: boolean = false;

  constructor(object: RenderableCelestialObject) {
    this.object = object;
  }

  /**
   * Updates the object reference and clears cache
   */
  updateObject(object: RenderableCelestialObject): void {
    this.object = object;
    this.cacheValid = false;
  }

  /**
   * Updates the allObjects reference and clears cache
   */
  updateAllObjects(
    allObjects: Record<string, RenderableCelestialObject>,
  ): void {
    this.allObjects = allObjects;
    this.cacheValid = false;
  }

  /**
   * Applies distance-based attenuation to light sources for this celestial object
   *
   * @param lightSources Map of light sources to attenuate
   * @param config Optional configuration for attenuation calculations
   * @param forceRefresh Whether to force a cache refresh
   * @returns The modified light sources map (or new map if modifyInPlace is false)
   */
  applyDistanceAttenuation(
    lightSources: LightSourcesMap,
    config: LightingConfig = {},
    forceRefresh: boolean = false,
  ): LightSourcesMap {
    // Return cached result if valid and not forcing refresh
    if (!forceRefresh && this.cacheValid && this.attenuatedLightSourcesCache) {
      return this.attenuatedLightSourcesCache;
    }

    const {
      falloffFactor = LightingCalculator.DEFAULT_FALLOFF_FACTOR,
      modifyInPlace = true,
    } = config;

    // Ensure lightSources is a Map
    if (!lightSources || !(lightSources instanceof Map)) {
      console.warn(
        "LightingCalculator: lightSources is not a Map, returning empty Map",
      );
      return new Map();
    }

    const resultSources = modifyInPlace ? lightSources : new Map(lightSources);

    if (!resultSources || resultSources.size === 0) {
      return resultSources;
    }

    resultSources.forEach((lightData) => {
      const distanceSq = this.object.position.distanceToSquared(
        lightData.position,
      );
      const attenuation = 1.0 / (1.0 + distanceSq * falloffFactor);

      // Update the intensity directly in the map
      lightData.intensity = (lightData.intensity ?? 1.0) * attenuation;
    });

    // Update cache
    this.attenuatedLightSourcesCache = resultSources;
    this.lastUpdateTime = Date.now();
    this.cacheValid = true;

    return resultSources;
  }

  /**
   * Finds the closest light source to this celestial object
   *
   * @param lightSources Map of available light sources
   * @param forceRefresh Whether to force a cache refresh
   * @returns The closest light source, or null if none available
   */
  findClosestLightSource(
    lightSources: LightSourcesMap,
    forceRefresh: boolean = false,
  ): LightSourceData | null {
    // Return cached result if valid and not forcing refresh
    if (!forceRefresh && this.cacheValid && this.closestLightSourceCache) {
      return this.closestLightSourceCache;
    }

    // Ensure lightSources is a Map
    if (!lightSources || !(lightSources instanceof Map)) {
      console.warn(
        "LightingCalculator: lightSources is not a Map in findClosestLightSource",
      );
      return null;
    }

    if (!lightSources || lightSources.size === 0) {
      return null;
    }

    let closestLight: LightSourceData | null = null;
    let minDistanceSq = Infinity;

    const objectPosition = this.object.position;

    for (const lightData of lightSources.values()) {
      const distanceSq = objectPosition.distanceToSquared(lightData.position);
      if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        closestLight = lightData;
      }
    }

    // Update cache
    this.closestLightSourceCache = closestLight;
    this.lastUpdateTime = Date.now();
    this.cacheValid = true;

    return closestLight;
  }

  /**
   * Calculates light intensity at a specific distance from a light source
   *
   * @param lightSource The light source
   * @param distance Distance from the light source
   * @param falloffFactor Optional custom falloff factor
   * @returns Attenuated light intensity
   */
  calculateLightIntensityAtDistance(
    lightSource: LightSourceData,
    distance: number,
    falloffFactor: number = LightingCalculator.DEFAULT_FALLOFF_FACTOR,
  ): number {
    const distanceSq = distance * distance;
    const attenuation = 1.0 / (1.0 + distanceSq * falloffFactor);
    return (lightSource.intensity ?? 1.0) * attenuation;
  }

  /**
   * Calculates dynamic ambient lighting based on nearby stars and their luminosity
   *
   * @param lightSources Map of light sources (stars) to calculate ambient from
   * @param forceRefresh Whether to force a cache refresh
   * @returns Dynamic ambient light intensity based on star proximity and luminosity
   */
  calculateDynamicAmbientLight(
    lightSources: LightSourcesMap,
    forceRefresh: boolean = false,
  ): number {
    // Return cached result if valid and not forcing refresh
    if (!forceRefresh && this.cacheValid && this.ambientLightCache !== null) {
      return this.ambientLightCache;
    }

    // Ensure lightSources is a Map
    if (!lightSources || !(lightSources instanceof Map)) {
      console.warn(
        "LightingCalculator: lightSources is not a Map in calculateDynamicAmbientLight",
      );
      return LightingCalculator.MIN_AMBIENT_INTENSITY;
    }

    if (!lightSources || lightSources.size === 0) {
      return LightingCalculator.MIN_AMBIENT_INTENSITY;
    }

    let totalAmbient = 0;

    // Calculate ambient contribution from each star
    for (const [starId, lightData] of lightSources.entries()) {
      const distance = this.object.position.distanceTo(lightData.position);
      const distanceSq = distance * distance;

      // Use luminosity from star properties if available, otherwise use light intensity
      let luminosity = lightData.intensity ?? 1.0;

      // Try to get actual luminosity from star properties
      if (this.allObjects && this.allObjects[starId]) {
        const starObject = this.allObjects[starId];
        if (starObject.type === CelestialType.STAR && starObject.properties) {
          const starProps = starObject.properties as any;
          // Use systemLighting.starLightIntensity for visual lighting instead of realistic luminosity
          luminosity =
            starProps.systemLighting?.starLightIntensity ??
            lightData.intensity ??
            1.0;
        }
      }

      // Calculate ambient falloff (stronger than direct light falloff)
      const ambientFalloff =
        1.0 / (1.0 + distanceSq * LightingCalculator.AMBIENT_FALLOFF_FACTOR);

      // Scale ambient based on star luminosity and distance
      const ambientContribution =
        LightingCalculator.BASE_AMBIENT_INTENSITY *
        luminosity *
        ambientFalloff *
        (1.0 + (1.0 - ambientFalloff) * 0.5);

      totalAmbient += ambientContribution;
    }

    // Clamp the result between minimum and a reasonable maximum
    const result = Math.max(
      LightingCalculator.MIN_AMBIENT_INTENSITY,
      Math.min(totalAmbient, LightingCalculator.BASE_AMBIENT_INTENSITY),
    );

    // Update cache
    this.ambientLightCache = result;
    this.lastUpdateTime = Date.now();
    this.cacheValid = true;

    return result;
  }

  /**
   * Finds the most influential light source for this object
   * It prioritizes the object's `primaryLightSourceId` if it exists and is
   * present in the provided light sources map. Otherwise, it falls back to the
   * closest light source.
   *
   * @param lightSources Map of available light sources
   * @param forceRefresh Whether to force a cache refresh
   * @returns The most influential light source, or null if none are available
   */
  findPrimaryLightSource(
    lightSources: LightSourcesMap,
    forceRefresh: boolean = false,
  ): LightSourceData | null {
    if (!lightSources || lightSources.size === 0) return null;

    if (
      this.object.primaryLightSourceId &&
      lightSources.has(this.object.primaryLightSourceId)
    ) {
      return lightSources.get(this.object.primaryLightSourceId) || null;
    }

    // Fall back to closest light source
    return this.findClosestLightSource(lightSources, forceRefresh);
  }

  /**
   * Clears the lighting calculation cache
   */
  dispose(): void {
    this.attenuatedLightSourcesCache = null;
    this.ambientLightCache = null;
    this.closestLightSourceCache = null;
    this.cacheValid = false;
  }

  /**
   * Gets cache statistics for debugging
   */
  getCacheStats(): {
    cached: boolean;
    lastUpdate: number;
    hasAttenuatedCache: boolean;
    hasAmbientCache: boolean;
    hasClosestCache: boolean;
  } {
    return {
      cached: this.cacheValid,
      lastUpdate: this.lastUpdateTime,
      hasAttenuatedCache: this.attenuatedLightSourcesCache !== null,
      hasAmbientCache: this.ambientLightCache !== null,
      hasClosestCache: this.closestLightSourceCache !== null,
    };
  }
}
