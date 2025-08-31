import {
  CelestialStatus,
  CelestialType,
  type CelestialObject,
} from "@teskooano/data-types";
import type {
  SimulationStepResult,
  PhysicsStateReal,
} from "@teskooano/core-physics";
import { Observable, take } from "rxjs";
import { celestialStore } from "../stores/CelestialStore";
import { physicsStore } from "../stores/PhysicsStore";
import { PhysicsStateProvider } from "../services/PhysicsStateProvider";
import type { OrbitalParameters } from "@teskooano/data-types";

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
    this.processDestructionEvents(result, newCelestialObjectsMap);

    celestialStore.setAllObjects(newCelestialObjectsMap);
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

  /**
   * Processes destruction events and updates object statuses.
   * Ring systems automatically destroy themselves if their parent is destroyed.
   */
  private processDestructionEvents(
    result: SimulationStepResult,
    newCelestialObjectsMap: Record<string, CelestialObject>,
  ): void {
    // Process direct destruction events first
    result.destroyedIds.forEach((idToDestroy) => {
      const idToDestroyStr = String(idToDestroy);
      const existingObject = newCelestialObjectsMap[idToDestroyStr];
      if (
        existingObject &&
        existingObject.status !== CelestialStatus.DESTROYED &&
        existingObject.status !== CelestialStatus.ANNIHILATED
      ) {
        // Simple destruction - all destroyed objects get DESTROYED status
        newCelestialObjectsMap[idToDestroyStr] = {
          ...existingObject,
          status: CelestialStatus.DESTROYED,
        };
      }
    });

    // Now handle reactive ring system destruction
    Object.values(newCelestialObjectsMap).forEach((object) => {
      if (
        object.type === CelestialType.RING_SYSTEM &&
        object.parentId &&
        object.status !== CelestialStatus.DESTROYED &&
        object.status !== CelestialStatus.ANNIHILATED
      ) {
        const parent = newCelestialObjectsMap[object.parentId];
        if (
          parent &&
          (parent.status === CelestialStatus.DESTROYED ||
            parent.status === CelestialStatus.ANNIHILATED)
        ) {
          // Ring system automatically destroys itself when parent is destroyed
          newCelestialObjectsMap[object.id] = {
            ...object,
            status: parent.status, // Inherit parent's destruction status
          };
          console.debug(
            `[PhysicsSystemAdapter] Ring system ${object.id} auto-destroyed due to parent ${object.parentId} destruction`,
          );
        }
      }
    });
  }
}

export const physicsSystemAdapter = PhysicsSystemAdapter.getInstance();

// @ts-ignore
if (window.teskooano) {
  // @ts-ignore
  window.teskooano.PhysicsSystemAdapter = PhysicsSystemAdapter.getInstance();
}
