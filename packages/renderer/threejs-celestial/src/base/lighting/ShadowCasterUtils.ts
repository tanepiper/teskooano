import type { RenderableCelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import { WasmSpatialService } from "@teskooano/core-physics";
import * as THREE from "three";
import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-values";

/**
 * Shadow caster data for lighting calculations
 */
export interface ShadowCasterData {
  position: THREE.Vector3;
  radius: number;
}

/**
 * Instance-based utility for managing shadow casters in celestial rendering
 *
 * This class is designed to be instantiated per BaseCelestialRenderer and provides
 * efficient shadow caster detection using the WASM spatial service.
 */
export class ShadowCasterUtils {
  private spatialService: WasmSpatialService;
  private object: RenderableCelestialObject;
  private allObjects?: Record<string, RenderableCelestialObject>;

  // Cache for shadow caster results to avoid repeated calculations
  private shadowCasterCache: ShadowCasterData[] = [];
  private lastUpdateTime: number = 0;
  private cacheValid: boolean = false;

  constructor(object: RenderableCelestialObject) {
    this.object = object;
    this.spatialService = WasmSpatialService.getInstance();
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
   * Finds all shadow casters that can affect this celestial object
   *
   * @param forceRefresh Whether to force a cache refresh
   * @returns Array of shadow caster data
   */
  findShadowCasters(forceRefresh: boolean = false): ShadowCasterData[] {
    // Return cached result if valid and not forcing refresh
    if (!forceRefresh && this.cacheValid && this.shadowCasterCache.length > 0) {
      return this.shadowCasterCache;
    }

    const shadowCasters: ShadowCasterData[] = [];

    if (!this.allObjects) {
      return shadowCasters;
    }

    // If the object is a planet-like body, its moons are shadow casters
    if (
      this.object.type === CelestialType.PLANET ||
      this.object.type === CelestialType.DWARF_PLANET ||
      this.object.type === CelestialType.GAS_GIANT
    ) {
      // Search for moons within a reasonable distance (0.1 AU)
      const searchDistance = 0.1 * AU_METERS; // 0.1 AU in meters

      // Convert position from scene units to meters
      const positionInMeters = new THREE.Vector3(
        this.object.position.x / METERS_TO_SCENE_UNITS,
        this.object.position.y / METERS_TO_SCENE_UNITS,
        this.object.position.z / METERS_TO_SCENE_UNITS,
      );

      const nearbyBodies = this.spatialService.findBodiesInRange(
        positionInMeters,
        searchDistance,
      );

      // Filter for moons of this object
      for (const bodyId of nearbyBodies) {
        const moon = this.allObjects[bodyId];
        if (
          moon &&
          moon.type === CelestialType.MOON &&
          moon.parentId === this.object.id
        ) {
          shadowCasters.push({
            position: moon.position.clone(),
            radius: moon.radius ?? 0,
          });
        }
      }
    }
    // Universal rule: any object can be shadowed by its parent, unless the parent is a star
    else if (this.object.parentId) {
      const parentBody = this.allObjects[this.object.parentId];
      if (parentBody && parentBody.type !== CelestialType.STAR) {
        shadowCasters.push({
          position: parentBody.position.clone(),
          radius: parentBody.radius ?? 0,
        });
      }
    }

    // Update cache
    this.shadowCasterCache = shadowCasters;
    this.lastUpdateTime = Date.now();
    this.cacheValid = true;

    return shadowCasters;
  }

  /**
   * Finds shadow casters specifically for ring systems
   *
   * @param forceRefresh Whether to force a cache refresh
   * @returns Array of shadow caster data
   */
  findRingShadowCasters(forceRefresh: boolean = false): ShadowCasterData[] {
    const shadowCasters: ShadowCasterData[] = [];

    if (!this.allObjects) {
      return shadowCasters;
    }

    // The parent body itself is the primary shadow caster for its rings
    shadowCasters.push({
      position: this.object.position.clone(),
      radius: this.object.radius ?? 0,
    });

    // Search for moons within a reasonable distance (0.1 AU)
    const searchDistance = 0.1 * AU_METERS; // 0.1 AU in meters

    // Convert position from scene units to meters
    const positionInMeters = new THREE.Vector3(
      this.object.position.x / METERS_TO_SCENE_UNITS,
      this.object.position.y / METERS_TO_SCENE_UNITS,
      this.object.position.z / METERS_TO_SCENE_UNITS,
    );

    const nearbyBodies = this.spatialService.findBodiesInRange(
      positionInMeters,
      searchDistance,
    );

    // Filter for moons of this object
    for (const bodyId of nearbyBodies) {
      const other = this.allObjects[bodyId];
      if (
        other &&
        other.parentId === this.object.id &&
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

  /**
   * Clears the shadow caster cache
   */
  dispose(): void {
    this.shadowCasterCache = [];
    this.cacheValid = false;
  }

  /**
   * Gets cache statistics for debugging
   */
  getCacheStats(): {
    cached: boolean;
    lastUpdate: number;
    cacheSize: number;
  } {
    return {
      cached: this.cacheValid,
      lastUpdate: this.lastUpdateTime,
      cacheSize: this.shadowCasterCache.length,
    };
  }
}
