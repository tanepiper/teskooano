import type { OSVector3 } from "@teskooano/core-math";
import type {
  CelestialObject,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import { Observable, startWith } from "rxjs";
import {
  accelerationVectors$,
  celestial,
  celestialHierarchy$,
  celestialObjects$,
  currentSeed$,
  physics,
  seed,
  simulationState$,
  simulationStateService,
} from "../game";
import { renderableStore } from "../game/renderableStore";
import type { SimulationState } from "../game/types";

/**
 * Standardized accessor for all state in the Teskooano application.
 *
 * This utility provides consistent patterns for accessing state both reactively
 * (with Observable streams) and imperatively (with getter functions). It eliminates
 * the inconsistency between direct imports of observables/getters and provides
 * a single point of access for all state.
 *
 * @example
 * ```typescript
 * // Reactive access with initial value
 * StateAccessor.celestialObjects$().subscribe(objects => {
 *   // Handle objects update
 * });
 *
 * // Imperative access
 * const currentObjects = StateAccessor.getCelestialObjects();
 * ```
 */
export class StateAccessor {
  // Celestial Objects
  /**
   * Gets a reactive stream of celestial objects with the current value as initial emission.
   * Preferred over direct import of celestialObjects$ when you need the current state immediately.
   */
  static celestialObjects$(): Observable<Record<string, CelestialObject>> {
    return celestialObjects$.pipe(startWith(celestial.getObjects()));
  }

  /**
   * Gets the current celestial objects imperatively.
   */
  static getCelestialObjects(): Record<string, CelestialObject> {
    return celestial.getObjects();
  }

  // Simulation State
  /**
   * Gets a reactive stream of simulation state with the current value as initial emission.
   * Preferred over direct import of simulationState$ when you need the current state immediately.
   */
  static simulation$(): Observable<SimulationState> {
    return simulationState$.pipe(
      startWith(simulationStateService.getSimulationState()),
    );
  }

  /**
   * Gets the current simulation state imperatively.
   */
  static getSimulationState(): SimulationState {
    return simulationStateService.getSimulationState();
  }

  // Celestial Hierarchy
  /**
   * Gets a reactive stream of celestial hierarchy with the current value as initial emission.
   */
  static celestialHierarchy$(): Observable<Record<string, string[]>> {
    return celestialHierarchy$.pipe(startWith(celestial.getHierarchy()));
  }

  /**
   * Gets the current celestial hierarchy imperatively.
   */
  static getCelestialHierarchy(): Record<string, string[]> {
    return celestial.getHierarchy();
  }

  // Acceleration Vectors
  /**
   * Gets a reactive stream of acceleration vectors with the current value as initial emission.
   */
  static accelerationVectors$(): Observable<Record<string, OSVector3>> {
    return accelerationVectors$.pipe(
      startWith(physics.getAccelerationVectors()),
    );
  }

  /**
   * Gets the current acceleration vectors imperatively.
   */
  static getAccelerationVectors(): Record<string, OSVector3> {
    return physics.getAccelerationVectors();
  }

  // Current Seed
  /**
   * Gets a reactive stream of the current seed with the current value as initial emission.
   */
  static getCurrentSeedStream(): Observable<string> {
    return currentSeed$.pipe(startWith(seed.getCurrentSeed()));
  }

  /**
   * Gets the current seed imperatively.
   */
  static getCurrentSeed(): string {
    return seed.getCurrentSeed();
  }

  // Convenience methods for common patterns
  /**
   * Gets a specific celestial object by ID.
   * @param objectId The ID of the object to retrieve
   * @returns The celestial object or undefined if not found
   */
  static getCelestialObject(objectId: string): CelestialObject | undefined {
    return this.getCelestialObjects()[objectId];
  }

  /**
   * Gets multiple celestial objects by their IDs.
   * @param objectIds Array of object IDs to retrieve
   * @returns Array of celestial objects (only existing objects are included)
   */
  static getCelestialObjectsByIds(objectIds: string[]): CelestialObject[] {
    const allObjects = this.getCelestialObjects();
    return objectIds
      .map((id) => allObjects[id])
      .filter((obj): obj is CelestialObject => obj !== undefined);
  }

  /**
   * Gets multiple celestial objects by their IDs as a map.
   * @param objectIds Array of object IDs to retrieve
   * @returns Record mapping IDs to celestial objects (only existing objects are included)
   */
  static getCelestialObjectsMapByIds(
    objectIds: string[],
  ): Record<string, CelestialObject> {
    const allObjects = this.getCelestialObjects();
    const result: Record<string, CelestialObject> = {};

    objectIds.forEach((id) => {
      const obj = allObjects[id];
      if (obj) {
        result[id] = obj;
      }
    });

    return result;
  }

  /**
   * Checks if a celestial object exists by ID.
   * @param objectId The ID to check
   * @returns True if the object exists
   */
  static hasCelestialObject(objectId: string): boolean {
    return objectId in this.getCelestialObjects();
  }

  /**
   * Gets all celestial object IDs.
   * @returns Array of all celestial object IDs
   */
  static getCelestialObjectIds(): string[] {
    return Object.keys(this.getCelestialObjects());
  }

  /**
   * Gets the count of celestial objects.
   * @returns Number of celestial objects in the system
   */
  static getCelestialObjectCount(): number {
    return Object.keys(this.getCelestialObjects()).length;
  }

  /**
   * Checks if the system has any celestial objects.
   * @returns True if there are celestial objects in the system
   */
  static hasAnyCelestialObjects(): boolean {
    return this.getCelestialObjectCount() > 0;
  }

  // =============================================================================
  // RENDERABLE OBJECTS ACCESS
  // =============================================================================

  /**
   * Gets the current snapshot of all renderable objects (reactive).
   * @returns Observable of the current renderable objects map with initial value
   */
  static renderableObjects$(): Observable<
    Record<string, RenderableCelestialObject>
  > {
    return renderableStore.renderableObjects$.pipe(
      startWith(renderableStore.getRenderableObjects()),
    );
  }

  /**
   * Gets the current snapshot of all renderable objects (imperative).
   * @returns The current renderable objects map
   */
  static getRenderableObjects(): Record<string, RenderableCelestialObject> {
    return renderableStore.getRenderableObjects();
  }

  /**
   * Gets a specific renderable object by ID.
   * @param objectId The ID of the renderable object to retrieve
   * @returns The renderable object or undefined if not found
   */
  static getRenderableObject(
    objectId: string,
  ): RenderableCelestialObject | undefined {
    return this.getRenderableObjects()[objectId];
  }

  /**
   * Gets multiple renderable objects by their IDs.
   * @param objectIds Array of object IDs to retrieve
   * @returns Array of renderable objects (only existing objects are included)
   */
  static getRenderableObjectsByIds(
    objectIds: string[],
  ): RenderableCelestialObject[] {
    const allObjects = this.getRenderableObjects();
    return objectIds
      .map((id) => allObjects[id])
      .filter((obj): obj is RenderableCelestialObject => obj !== undefined);
  }

  /**
   * Gets multiple renderable objects by their IDs as a map.
   * @param objectIds Array of object IDs to retrieve
   * @returns Record mapping IDs to renderable objects (only existing objects are included)
   */
  static getRenderableObjectsMapByIds(
    objectIds: string[],
  ): Record<string, RenderableCelestialObject> {
    const allObjects = this.getRenderableObjects();
    const result: Record<string, RenderableCelestialObject> = {};

    objectIds.forEach((id) => {
      const obj = allObjects[id];
      if (obj) {
        result[id] = obj;
      }
    });

    return result;
  }

  /**
   * Checks if a renderable object exists by ID.
   * @param objectId The ID to check
   * @returns True if the renderable object exists
   */
  static hasRenderableObject(objectId: string): boolean {
    return objectId in this.getRenderableObjects();
  }

  /**
   * Gets all renderable object IDs.
   * @returns Array of all renderable object IDs
   */
  static getRenderableObjectIds(): string[] {
    return Object.keys(this.getRenderableObjects());
  }

  /**
   * Gets the count of renderable objects.
   * @returns Number of renderable objects in the system
   */
  static getRenderableObjectCount(): number {
    return Object.keys(this.getRenderableObjects()).length;
  }
}
