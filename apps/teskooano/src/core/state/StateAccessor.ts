import { Observable } from "rxjs";
import { startWith } from "rxjs/operators";
import {
  celestialObjects$,
  getCelestialObjects,
  simulationState$,
  getSimulationState,
  currentSeed$,
  getCurrentSeed,
} from "@teskooano/core-state";
import type { CelestialObject } from "@teskooano/data-types";
import type { SimulationState } from "@teskooano/core-state";

/**
 * Standardized accessor for reactive state management.
 * Eliminates inconsistent patterns between reactive and imperative access.
 * 
 * Usage:
 * - For reactive: StateAccessor.getCelestialObjectsStream()
 * - For imperative: StateAccessor.getCurrentCelestialObjects()
 */
export class StateAccessor {
  // ===== REACTIVE ACCESS (Observable streams with initial values) =====

  /**
   * Get celestial objects as a reactive stream with initial value.
   * Preferred over direct celestialObjects$ subscription.
   */
  static getCelestialObjectsStream(): Observable<Record<string, CelestialObject>> {
    return celestialObjects$.pipe(startWith(getCelestialObjects()));
  }

  /**
   * Get simulation state as a reactive stream with initial value.
   * Preferred over direct simulationState$ subscription.
   */
  static getSimulationStateStream(): Observable<SimulationState> {
    return simulationState$.pipe(startWith(getSimulationState()));
  }



  /**
   * Get current seed as a reactive stream with initial value.
   */
  static getCurrentSeedStream(): Observable<string | null> {
    return currentSeed$.pipe(startWith(getCurrentSeed()));
  }

  // ===== IMPERATIVE ACCESS (Current state snapshots) =====

  /**
   * Get current celestial objects snapshot.
   * Use sparingly - prefer reactive streams for UI components.
   */
  static getCurrentCelestialObjects(): Record<string, CelestialObject> {
    return getCelestialObjects();
  }

  /**
   * Get current simulation state snapshot.
   * Use sparingly - prefer reactive streams for UI components.
   */
  static getCurrentSimulationState(): SimulationState {
    return getSimulationState();
  }



  /**
   * Get current seed snapshot.
   */
  static getCurrentSeed(): string | null {
    return getCurrentSeed();
  }

  // ===== CONVENIENCE METHODS =====

  /**
   * Get a specific celestial object by ID.
   */
  static getCelestialObject(objectId: string): CelestialObject | undefined {
    return getCelestialObjects()[objectId];
  }

  /**
   * Check if any celestial objects exist in the current state.
   */
  static hasCelestialObjects(): boolean {
    return Object.keys(getCelestialObjects()).length > 0;
  }

  /**
   * Get array of all celestial object IDs.
   */
  static getCelestialObjectIds(): string[] {
    return Object.keys(getCelestialObjects());
  }

  /**
   * Get array of all celestial objects.
   */
  static getCelestialObjectsArray(): CelestialObject[] {
    return Object.values(getCelestialObjects());
  }
}