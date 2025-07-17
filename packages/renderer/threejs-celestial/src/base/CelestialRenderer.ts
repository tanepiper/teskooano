import type { RenderableCelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { CelestialMeshOptions } from "./types";

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
 * Shadow caster data for lighting calculations
 */
export interface ShadowCasterData {
  position: THREE.Vector3;
  radius: number;
}

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
 * Utility class for calculating lighting effects and attenuation
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
  private static readonly BASE_AMBIENT_INTENSITY = 0.5; // Base ambient when very close to a bright star
  private static readonly MIN_AMBIENT_INTENSITY = 0.25; // Minimum ambient - "just enough glow"

  /**
   * Applies distance-based attenuation to light sources for a celestial object
   *
   * @param object The celestial object receiving light
   * @param lightSources Map of light sources to attenuate
   * @param config Optional configuration for attenuation calculations
   * @returns The modified light sources map (or new map if modifyInPlace is false)
   */
  static applyDistanceAttenuation(
    object: RenderableCelestialObject,
    lightSources: LightSourcesMap,
    config: LightingConfig = {},
  ): LightSourcesMap {
    const {
      falloffFactor = LightingCalculator.DEFAULT_FALLOFF_FACTOR,
      modifyInPlace = true,
    } = config;

    const resultSources = modifyInPlace ? lightSources : new Map(lightSources);

    if (!resultSources || resultSources.size === 0) {
      return resultSources;
    }

    resultSources.forEach((lightData) => {
      const distanceSq = object.position.distanceToSquared(lightData.position);
      const attenuation = 1.0 / (1.0 + distanceSq * falloffFactor);

      // Update the intensity directly in the map
      lightData.intensity = (lightData.intensity ?? 1.0) * attenuation;
    });

    return resultSources;
  }

  /**
   * Finds the closest light source to a celestial object
   *
   * @param object The celestial object
   * @param lightSources Map of available light sources
   * @returns The closest light source, or null if none available
   */
  static findClosestLightSource(
    object: RenderableCelestialObject,
    lightSources: LightSourcesMap,
  ): LightSourceData | null {
    if (!lightSources || lightSources.size === 0) {
      return null;
    }

    let closestLight: LightSourceData | null = null;
    let minDistanceSq = Infinity;

    const objectPosition = object.position;

    for (const lightData of lightSources.values()) {
      const distanceSq = objectPosition.distanceToSquared(lightData.position);
      if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        closestLight = lightData;
      }
    }

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
  static calculateLightIntensityAtDistance(
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
   * @param object The celestial object receiving ambient light
   * @param lightSources Map of light sources (stars) to calculate ambient from
   * @returns Dynamic ambient light intensity based on star proximity and luminosity
   */
  static calculateDynamicAmbientLight(
    object: RenderableCelestialObject,
    lightSources: LightSourcesMap,
  ): number {
    if (!lightSources || lightSources.size === 0) {
      return LightingCalculator.MIN_AMBIENT_INTENSITY;
    }

    let totalAmbient = 0;

    // Calculate ambient contribution from each star
    for (const [starId, lightData] of lightSources.entries()) {
      const distance = object.position.distanceTo(lightData.position);
      const distanceSq = distance * distance;

      // Use luminosity from star properties if available, otherwise use light intensity
      let luminosity = lightData.intensity ?? 1.0;

      // Try to get actual luminosity from star properties
      const starObjects = object as any; // We'll need to pass allObjects to get star data
      // For now, use the light intensity as a proxy for luminosity

      // Calculate ambient falloff (stronger than direct light falloff)
      const ambientFalloff =
        1.0 / (1.0 + distanceSq * LightingCalculator.AMBIENT_FALLOFF_FACTOR);

      // Scale ambient based on star luminosity and distance
      const ambientContribution =
        LightingCalculator.BASE_AMBIENT_INTENSITY * luminosity * ambientFalloff;

      totalAmbient += ambientContribution;
    }

    // Clamp the result between minimum and a reasonable maximum
    return Math.max(
      LightingCalculator.MIN_AMBIENT_INTENSITY,
      Math.min(totalAmbient, LightingCalculator.BASE_AMBIENT_INTENSITY),
    );
  }

  /**
   * Enhanced version that takes star objects to access actual luminosity data
   *
   * @param object The celestial object receiving ambient light
   * @param lightSources Map of light sources to calculate ambient from
   * @param allObjects Map of all objects to access star properties
   * @returns Dynamic ambient light intensity based on star luminosity and distance
   */
  static calculateDynamicAmbientLightWithStarData(
    object: RenderableCelestialObject,
    lightSources: LightSourcesMap,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): number {
    if (!lightSources || lightSources.size === 0) {
      return LightingCalculator.MIN_AMBIENT_INTENSITY;
    }

    let totalAmbient = 0;

    // Calculate ambient contribution from each star
    for (const [starId, lightData] of lightSources.entries()) {
      const distance = object.position.distanceTo(lightData.position);
      const distanceSq = distance * distance;

      // Get actual star luminosity if possible
      let luminosity = lightData.intensity ?? 1.0;
      if (allObjects && allObjects[starId]) {
        const starObject = allObjects[starId];
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
        LightingCalculator.BASE_AMBIENT_INTENSITY * luminosity * ambientFalloff;

      totalAmbient += ambientContribution;
    }

    // Clamp the result between minimum and a reasonable maximum
    return Math.max(
      LightingCalculator.MIN_AMBIENT_INTENSITY,
      Math.min(totalAmbient, LightingCalculator.BASE_AMBIENT_INTENSITY),
    );
  }
}

/**
 * Utility class for managing shadow casters in celestial rendering
 */
export class ShadowCasterUtils {
  /**
   * Finds all shadow casters that can affect a given celestial object
   *
   * @param object The celestial object that might receive shadows
   * @param allObjects Map of all objects in the scene
   * @returns Array of shadow caster data
   */
  static findShadowCasters(
    object: RenderableCelestialObject,
    allObjects: Record<string, RenderableCelestialObject>,
  ): ShadowCasterData[] {
    const shadowCasters: ShadowCasterData[] = [];

    if (!allObjects) {
      return shadowCasters;
    }

    // If the object is a planet-like body, its moons are shadow casters
    if (
      object.type === CelestialType.PLANET ||
      object.type === CelestialType.DWARF_PLANET ||
      object.type === CelestialType.GAS_GIANT
    ) {
      const moons = Object.values(allObjects).filter(
        (obj) =>
          obj.type === CelestialType.MOON &&
          obj.parentId === object.celestialObjectId,
      );

      for (const moon of moons) {
        shadowCasters.push({
          position: moon.position.clone(),
          radius: moon.radius ?? 0,
        });
      }
    }
    // Universal rule: any object can be shadowed by its parent, unless the parent is a star
    else if (object.parentId) {
      const parentBody = allObjects[object.parentId];
      if (parentBody && parentBody.type !== CelestialType.STAR) {
        shadowCasters.push({
          position: parentBody.position.clone(),
          radius: parentBody.radius ?? 0,
        });
      }
    }

    return shadowCasters;
  }

  /**
   * Finds shadow casters for ring systems specifically
   *
   * @param object The object that owns the ring system
   * @param allObjects Map of all objects in the scene
   * @returns Array of shadow caster data
   */
  static findRingShadowCasters(
    object: RenderableCelestialObject,
    allObjects: Record<string, RenderableCelestialObject>,
  ): ShadowCasterData[] {
    const shadowCasters: ShadowCasterData[] = [];

    if (!allObjects) {
      return shadowCasters;
    }

    // The parent body itself is the primary shadow caster for its rings
    shadowCasters.push({
      position: object.position.clone(),
      radius: object.radius ?? 0,
    });

    // Find moons of the parent object to act as additional shadow casters
    for (const other of Object.values(allObjects)) {
      if (
        other.parentId === object.celestialObjectId &&
        other.type === CelestialType.MOON
      ) {
        shadowCasters.push({
          position: other.position.clone(),
          radius: other.radius ?? 0,
        });
      }
    }

    return shadowCasters;
  }

  /**
   * Converts shadow caster data to the format expected by shader materials
   *
   * @param shadowCasters Array of shadow caster data
   * @returns Array formatted for shader uniforms
   */
  static toShaderFormat(shadowCasters: ShadowCasterData[]): Array<{
    position: THREE.Vector3;
    radius: number;
  }> {
    return shadowCasters.map((caster) => ({
      position: caster.position.clone(),
      radius: caster.radius,
    }));
  }
}

/**
 * Utility class for managing light and shadow caster arrays in shader materials
 */
export class LightArrayUtils {
  /**
   * Creates an initial array of light sources with the specified size
   */
  static createLightSourceArray(size: number = 4): Array<{
    position: THREE.Vector3;
    color: THREE.Color;
    intensity: number;
  }> {
    return Array(size)
      .fill(0)
      .map(() => ({
        position: new THREE.Vector3(),
        color: new THREE.Color(),
        intensity: 0,
      }));
  }

  /**
   * Creates an initial array of shadow casters with the specified size
   */
  static createShadowCasterArray(size: number = 4): Array<{
    position: THREE.Vector3;
    radius: number;
  }> {
    return Array(size)
      .fill(0)
      .map(() => ({
        position: new THREE.Vector3(),
        radius: 0,
      }));
  }

  /**
   * Resizes a light source array to the new size, preserving existing data
   *
   * @param material The shader material containing the uniforms
   * @param newSize The new size for the array
   * @param currentArray The current array of light sources
   * @returns A new array of light sources with the specified size
   */
  static resizeLightArray(
    material: THREE.ShaderMaterial,
    newSize: number,
    currentArray: Array<{
      position: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }>,
  ): Array<{
    position: THREE.Vector3;
    color: THREE.Color;
    intensity: number;
  }> {
    const defineSize = Math.max(1, newSize);

    // Update the shader define if needed
    if (material.defines.MAX_LIGHTS !== defineSize) {
      material.defines.MAX_LIGHTS = defineSize;
      material.needsUpdate = true;
    }

    const newArray: Array<{
      position: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }> = [];

    // Copy existing data and add new slots as needed
    for (let i = 0; i < defineSize; i++) {
      if (i < currentArray.length && currentArray[i]) {
        newArray.push(currentArray[i]);
      } else {
        newArray.push({
          position: new THREE.Vector3(),
          color: new THREE.Color(),
          intensity: 0,
        });
      }
    }

    return newArray;
  }

  /**
   * Resizes a shadow caster array to the new size, preserving existing data
   *
   * @param material The shader material containing the uniforms
   * @param newSize The new size for the array
   * @param currentArray The current array of shadow casters
   * @returns A new array of shadow casters with the specified size
   */
  static resizeShadowCasterArray(
    material: THREE.ShaderMaterial,
    newSize: number,
    currentArray: Array<{
      position: THREE.Vector3;
      radius: number;
    }>,
  ): Array<{
    position: THREE.Vector3;
    radius: number;
  }> {
    const defineSize = Math.max(1, newSize);

    // Update the shader define if needed
    if (material.defines.MAX_SHADOW_CASTERS !== defineSize) {
      material.defines.MAX_SHADOW_CASTERS = defineSize;
      material.needsUpdate = true;
    }

    const newArray: Array<{
      position: THREE.Vector3;
      radius: number;
    }> = [];

    // Copy existing data and add new slots as needed
    for (let i = 0; i < defineSize; i++) {
      if (i < currentArray.length && currentArray[i]) {
        newArray.push(currentArray[i]);
      } else {
        newArray.push({
          position: new THREE.Vector3(),
          radius: 0,
        });
      }
    }

    return newArray;
  }

  /**
   * Converts LightSourcesMap to shader-compatible array format
   *
   * @param lightSources Map of light sources
   * @returns Array formatted for shader uniforms
   */
  static toShaderFormat(lightSources: LightSourcesMap): Array<{
    position: THREE.Vector3;
    color: THREE.Color;
    intensity: number;
  }> {
    const lights: Array<{
      position: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }> = [];

    for (const lightData of lightSources.values()) {
      lights.push({
        position: lightData.position.clone(),
        color: lightData.color.clone(),
        intensity: lightData.intensity ?? 1.0,
      });
    }

    return lights;
  }
}

/**
 * Common interface for all celestial renderers
 *
 * All renderers should implement this interface to ensure consistent behavior
 * across different celestial object types.
 */
export interface CelestialRenderer {
  /**
   * Creates and returns an array of LOD levels for the given celestial object.
   * Levels should be ordered from highest detail (smallest distance) to lowest detail (largest distance).
   * The first level (index 0) should typically have a distance of 0.
   *
   * @param object - The celestial object data.
   * @param options - Optional hints (e.g., { quality: 'high' | 'medium' | 'low' }).
   * @returns An array of LODLevel objects.
   * @throws {Error} If LOD levels cannot be generated for the object.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];

  /**
   * Update the object's state
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void;

  /**
   * Update the level of detail for an object based on camera distance
   *
   * This is an optional method that can be implemented by renderers that support LOD.
   * Some renderers may handle LOD automatically via THREE.LOD, while others may need
   * explicit shader or material adjustments.
   *
   * @param objectId ID of the object to update
   * @param camera The camera object
   */
  updateLOD?(objectId: string, camera: THREE.Camera): void;

  /**
   * Clean up any resources used by the renderer
   *
   * This method should:
   * 1. Dispose of all materials, textures, and geometries
   * 2. Clear any maps or caches
   * 3. Remove any event listeners or other references
   */
  dispose(): void;

  materials: Map<string, THREE.Material | THREE.Material[]>;

  initialize: (
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) => void;

  getLOD(object: RenderableCelestialObject): THREE.LOD | undefined;
}
