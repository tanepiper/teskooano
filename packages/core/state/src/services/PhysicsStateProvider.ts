import type {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { Observable, map, shareReplay } from "rxjs";
import { PhysicsStateCalculator } from "./PhysicsStateCalculator";
import { StateAccessor } from "../utils";
import { celestialStore } from "../stores";

/**
 * Service that provides physics state for any CelestialObject by calculating it on-demand.
 * This allows components that work with CelestialObject to access physics state without
 * needing to work with RenderableCelestialObject.
 */
export class PhysicsStateProvider {
  private static cache = new Map<string, PhysicsStateReal>();

  /**
   * Observable of all celestial objects that are active for physics simulation.
   * Uses the pre-filtered physicsActiveObjects$ from CelestialStore for efficiency.
   */
  public static readonly physicsActiveObjects$: Observable<
    Record<string, CelestialObject>
  > = celestialStore.physicsActiveObjects$;

  /**
   * Observable of physics states for all active celestial objects.
   * Automatically calculates and caches physics states for objects that need simulation.
   */
  public static readonly physicsStates$: Observable<PhysicsStateReal[]> =
    this.physicsActiveObjects$.pipe(
      map((activeObjects) => {
        const states: PhysicsStateReal[] = [];
        const allObjects = StateAccessor.getCelestialObjects();

        Object.values(activeObjects).forEach((obj) => {
          const physicsState = this.getPhysicsState(obj);
          if (physicsState) {
            states.push(physicsState);
          } else {
            console.warn(
              `[PhysicsStateProvider] Object ${obj.id} is active for physics but could not calculate physics state, skipping in simulation.`,
            );
          }
        });

        return states;
      }),
      shareReplay(1),
    );

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
    const allObjects = StateAccessor.getCelestialObjects();
    const physicsState = PhysicsStateCalculator.calculatePhysicsState(
      object,
      allObjects,
      new Set(),
    );

    if (physicsState) {
      // Cache the result
      this.cache.set(object.id, physicsState);
    }

    return physicsState;
  }

  /**
   * Gets the current physics states for all active objects (imperative version).
   * This is essentially a take(1) of the physicsStates$ observable.
   */
  public static getPhysicsStates(): PhysicsStateReal[] {
    const activeObjects = this.getPhysicsActiveObjects();
    const states: PhysicsStateReal[] = [];
    const allObjects = StateAccessor.getCelestialObjects();

    Object.values(activeObjects).forEach((obj) => {
      const physicsState = this.getPhysicsState(obj);
      if (physicsState) {
        states.push(physicsState);
      } else {
        console.warn(
          `[PhysicsStateProvider] Object ${obj.id} is active for physics but could not calculate physics state, skipping in simulation.`,
        );
      }
    });

    return states;
  }

  /**
   * Gets the current active objects for physics (imperative version).
   * This is essentially a take(1) of the physicsActiveObjects$ observable.
   */
  public static getPhysicsActiveObjects(): Record<string, CelestialObject> {
    return celestialStore.getPhysicsActiveObjects();
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
    const allObjects = StateAccessor.getCelestialObjects();
    const physicsState = PhysicsStateCalculator.calculatePhysicsState(
      object,
      allObjects,
      new Set(),
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
