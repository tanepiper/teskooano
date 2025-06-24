import { Observable, startWith } from "rxjs";
import type { CelestialObject } from "@teskooano/data-types";
import type { OSVector3 } from "@teskooano/core-math";
import {
  celestialObjects$,
  getCelestialObjects,
  simulationState$,
  getSimulationState,
  celestialHierarchy$,
  getCelestialHierarchy,
  accelerationVectors$,
  getAccelerationVectors,
  currentSeed$,
  getCurrentSeed,
} from "../game";
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
 * StateAccessor.getCelestialObjectsStream().subscribe(objects => {
 *   // Handle objects update
 * });
 * 
 * // Imperative access
 * const currentObjects = StateAccessor.getCurrentCelestialObjects();
 * ```
 */
export class StateAccessor {
  // Celestial Objects
  /**
   * Gets a reactive stream of celestial objects with the current value as initial emission.
   * Preferred over direct import of celestialObjects$ when you need the current state immediately.
   */
  static getCelestialObjectsStream(): Observable<Record<string, CelestialObject>> {
    return celestialObjects$.pipe(startWith(getCelestialObjects()));
  }

  /**
   * Gets the current celestial objects imperatively.
   */
  static getCurrentCelestialObjects(): Record<string, CelestialObject> {
    return getCelestialObjects();
  }

  // Simulation State
  /**
   * Gets a reactive stream of simulation state with the current value as initial emission.
   * Preferred over direct import of simulationState$ when you need the current state immediately.
   */
  static getSimulationStateStream(): Observable<SimulationState> {
    return simulationState$.pipe(startWith(getSimulationState()));
  }

  /**
   * Gets the current simulation state imperatively.
   */
  static getCurrentSimulationState(): SimulationState {
    return getSimulationState();
  }

  // Celestial Hierarchy
  /**
   * Gets a reactive stream of celestial hierarchy with the current value as initial emission.
   */
  static getCelestialHierarchyStream(): Observable<Record<string, string[]>> {
    return celestialHierarchy$.pipe(startWith(getCelestialHierarchy()));
  }

  /**
   * Gets the current celestial hierarchy imperatively.
   */
  static getCurrentCelestialHierarchy(): Record<string, string[]> {
    return getCelestialHierarchy();
  }

  // Acceleration Vectors
  /**
   * Gets a reactive stream of acceleration vectors with the current value as initial emission.
   */
  static getAccelerationVectorsStream(): Observable<Record<string, OSVector3>> {
    return accelerationVectors$.pipe(startWith(getAccelerationVectors()));
  }

  /**
   * Gets the current acceleration vectors imperatively.
   */
  static getCurrentAccelerationVectors(): Record<string, OSVector3> {
    return getAccelerationVectors();
  }

  // Current Seed
  /**
   * Gets a reactive stream of the current seed with the current value as initial emission.
   */
  static getCurrentSeedStream(): Observable<string> {
    return currentSeed$.pipe(startWith(getCurrentSeed()));
  }

  /**
   * Gets the current seed imperatively.
   */
  static getCurrentSeed(): string {
    return getCurrentSeed();
  }

  // Convenience methods for common patterns
  /**
   * Gets a specific celestial object by ID.
   * @param objectId The ID of the object to retrieve
   * @returns The celestial object or undefined if not found
   */
  static getCelestialObject(objectId: string): CelestialObject | undefined {
    return getCelestialObjects()[objectId];
  }

  /**
   * Checks if a celestial object exists by ID.
   * @param objectId The ID to check
   * @returns True if the object exists
   */
  static hasCelestialObject(objectId: string): boolean {
    return objectId in getCelestialObjects();
  }

  /**
   * Gets all celestial object IDs.
   * @returns Array of all celestial object IDs
   */
  static getCelestialObjectIds(): string[] {
    return Object.keys(getCelestialObjects());
  }

  /**
   * Gets the count of celestial objects.
   * @returns Number of celestial objects in the system
   */
  static getCelestialObjectCount(): number {
    return Object.keys(getCelestialObjects()).length;
  }

  /**
   * Checks if the system has any celestial objects.
   * @returns True if there are celestial objects in the system
   */
  static hasAnyCelestialObjects(): boolean {
    return this.getCelestialObjectCount() > 0;
  }
}