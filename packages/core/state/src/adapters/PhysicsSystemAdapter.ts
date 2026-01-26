import { type CelestialObject } from "@teskooano/data-types";
import type {
  SimulationStepResult,
  PhysicsStateReal,
} from "@teskooano/core-physics";
import { Observable } from "rxjs";
import { celestialStore } from "../stores/CelestialStore";
import { physicsStore } from "../stores/PhysicsStore";
import { PhysicsStateProvider } from "../services/PhysicsStateProvider";
import { PhysicsStateCalculator } from "../services/PhysicsStateCalculator";
import type { OrbitalParameters } from "@teskooano/data-types";
import { filterActiveCelestialObjects } from "../utils";

/**
 * @class PhysicsSystemAdapter
 * @description Acts as a bridge between the core game state (managed by CelestialStore)
 * and the physics engine. It prepares data for the physics simulation and applies
 * the simulation results back to the game state.
 */
export class PhysicsSystemAdapter {
  private static instance: PhysicsSystemAdapter;

  private constructor() {
    // private constructor to prevent direct instantiation
  }

  public static getInstance(): PhysicsSystemAdapter {
    if (!PhysicsSystemAdapter.instance) {
      PhysicsSystemAdapter.instance = new PhysicsSystemAdapter();
    }
    return PhysicsSystemAdapter.instance;
  }

  /**
   * Get an array of REAL physics states for active celestial objects to be fed into the simulation.
   * Uses RxJS observables for efficient filtering and caching.
   */
  public getPhysicsBodies(): PhysicsStateReal[] {
    return PhysicsStateProvider.getPhysicsStates();
  }

  /**
   * Get an observable of physics states for active celestial objects.
   * This is the reactive version of getPhysicsBodies().
   */
  public getPhysicsBodies$(): Observable<PhysicsStateReal[]> {
    return PhysicsStateProvider.physicsStates$;
  }

  /**
   * Get an observable of active celestial objects (filtered for physics simulation).
   */
  public getPhysicsActiveObjects$(): Observable<
    Record<string, CelestialObject>
  > {
    return PhysicsStateProvider.physicsActiveObjects$;
  }

  /**
   * Returns a snapshot of the current celestial objects map from the CelestialStore.
   */
  public getCelestialObjectsSnapshot(): Record<string, CelestialObject> {
    return celestialStore.getObjects();
  }

  /**
   * Returns a snapshot of active celestial objects (filtered for physics simulation).
   * Uses shared filtering utilities for consistency.
   */
  public getActiveCelestialObjectsSnapshot(): Record<string, CelestialObject> {
    return filterActiveCelestialObjects(this.getCelestialObjectsSnapshot());
  }

  /**
   * Returns a snapshot of the orbital parameters for all celestial objects.
   */
  public getOrbitalParametersSnapshot(): Map<string, OrbitalParameters> {
    const orbitalParams = new Map<string, OrbitalParameters>();
    const allObjects = this.getCelestialObjectsSnapshot();

    for (const obj of Object.values(allObjects)) {
      if (obj.orbit) {
        orbitalParams.set(obj.id, obj.orbit);
      }
    }
    return orbitalParams;
  }

  /**
   * Updates the global state with the results from a physics simulation step.
   * This includes updating object positions and handling simple destruction.
   */
  public updateStateFromResult(result: SimulationStepResult): void {
    const currentCelestialObjects = celestialStore.getObjects();
    const newCelestialObjectsMap: Record<string, CelestialObject> = {
      ...currentCelestialObjects,
    };

    this.updatePhysicsStates(result, newCelestialObjectsMap);

    // Convert destroyed IDs to strings and use CelestialStore's destruction processing
    const destroyedIds = Array.from(result.destroyedIds).map((id: any) =>
      String(id),
    );
    const updatedObjectsMap =
      celestialStore.processDestructionEvents(destroyedIds);

    // Clean up physics state cache for destroyed objects
    destroyedIds.forEach((id) => {
      PhysicsStateProvider.removeFromCache(id);
    });

    celestialStore.setAllObjects(updatedObjectsMap);
    physicsStore.updateAccelerationVectors(result.accelerations);
  }

  /**
   * Updates the physics state cache with simulation results for all objects.
   */
  private updatePhysicsStates(
    result: SimulationStepResult,
    newCelestialObjectsMap: Record<string, CelestialObject>,
  ): void {
    result.states.forEach((updatedState) => {
      const id = updatedState.id;
      const existingObject = newCelestialObjectsMap[id];
      if (existingObject) {
        PhysicsStateProvider.updateCacheWithSimulationResult(id, updatedState);
      } else {
        console.warn(
          `[PhysicsSystemAdapter] Received updated state for object ID: ${id}, which was not found in the current celestial objects map. This might happen if the object was created and destroyed in the same tick or if getPhysicsBodies was not perfectly synced.`,
        );
      }
    });
  }

  // Note: Destruction event processing has been moved to CelestialStore.processDestructionEvents()
  // to eliminate code duplication and ensure consistent destruction handling across the application
}

export const physicsSystemAdapter = PhysicsSystemAdapter.getInstance();

// @ts-ignore
if (window.teskooano) {
  // @ts-ignore
  window.teskooano.PhysicsSystemAdapter = PhysicsSystemAdapter.getInstance();
}
