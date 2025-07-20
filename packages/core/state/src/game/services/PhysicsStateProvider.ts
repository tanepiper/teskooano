import type {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { PhysicsStateCalculator } from "./PhysicsStateCalculator";
import { StateAccessor } from "@teskooano/core-state";

/**
 * Service that provides physics state for any CelestialObject by calculating it on-demand.
 * This allows components that work with CelestialObject to access physics state without
 * needing to work with RenderableCelestialObject.
 */
export class PhysicsStateProvider {
  private static cache = new Map<string, PhysicsStateReal>();

  /**
   * Gets the physics state for a celestial object, calculating it if necessary.
   */
  public static getPhysicsState<T extends CelestialSpecificPropertiesUnion>(
    object: CelestialObject<T> | undefined,
  ): PhysicsStateReal | null {
    // Check if object exists
    if (!object) {
      return null;
    }

    // Check cache first
    if (this.cache.has(object.id)) {
      return this.cache.get(object.id)!;
    }

    // Calculate physics state
    const allObjects = StateAccessor.getCurrentCelestialObjects();
    const physicsState = PhysicsStateCalculator.calculatePhysicsState(
      object,
      allObjects,
    );

    if (physicsState) {
      // Cache the result
      this.cache.set(object.id, physicsState);
    }

    return physicsState;
  }

  /**
   * Clears the physics state cache.
   */
  public static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Removes a specific object from the cache.
   */
  public static removeFromCache(objectId: string): void {
    this.cache.delete(objectId);
  }

  /**
   * Updates the cache when objects are added/updated.
   */
  public static updateCache<T extends CelestialSpecificPropertiesUnion>(
    object: CelestialObject<T>,
  ): void {
    // Remove old entry if it exists
    this.cache.delete(object.id);

    // Calculate and cache new physics state
    const allObjects = StateAccessor.getCurrentCelestialObjects();
    const physicsState = PhysicsStateCalculator.calculatePhysicsState(
      object,
      allObjects,
    );

    if (physicsState) {
      this.cache.set(object.id, physicsState);
    }
  }

  /**
   * Updates the cache with simulation results (actual calculated positions/velocities).
   */
  public static updateCacheWithSimulationResult(
    objectId: string,
    physicsState: PhysicsStateReal,
  ): void {
    this.cache.set(objectId, physicsState);
  }
}
