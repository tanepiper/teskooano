import {
  CelestialStatus,
  CelestialType,
  type CelestialObject,
} from "@teskooano/data-types";
import type {
  SimulationStepResult,
  PhysicsStateReal,
} from "@teskooano/core-physics";
import { celestialStore } from "./stores/celestialStore";
import { physicsStore } from "./stores/physicsStore";
import { PhysicsStateProvider } from "./services/PhysicsStateProvider";
import type { OrbitalParameters } from "@teskooano/data-types";

/**
 * @class PhysicsSystemAdapter
 * @description Acts as a bridge between the core game state (managed by CelestialStore)
 * and the physics engine. It prepares data for the physics simulation and applies
 * the simulation results back to the game state.
 */
class PhysicsSystemAdapter {
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
   * Filters out destroyed objects or those explicitly ignoring physics.
   */
  public getPhysicsBodies(): PhysicsStateReal[] {
    const bodies: PhysicsStateReal[] = [];
    const allObjects = celestialStore.getObjects();

    Object.values(allObjects)
      .filter(
        (obj: CelestialObject) =>
          obj.status !== CelestialStatus.DESTROYED &&
          obj.status !== CelestialStatus.ANNIHILATED && // Also exclude annihilated
          !obj.ignorePhysics,
      )
      .forEach((obj: CelestialObject) => {
        const physicsState = PhysicsStateProvider.getPhysicsState(obj);
        if (physicsState) {
          bodies.push(physicsState);
        } else {
          console.warn(
            `[PhysicsSystemAdapter] Object ${obj.id} is active for physics but could not calculate physics state, skipping in simulation.`,
          );
        }
      });
    return bodies;
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
  public getOrbitalParametersSnapshot(): Map<
    string | number,
    OrbitalParameters
  > {
    const orbitalParams = new Map<string | number, OrbitalParameters>();
    const allObjects = this.getCelestialObjectsSnapshot();

    for (const obj of Object.values(allObjects)) {
      if (obj.orbit) {
        orbitalParams.set(obj.id, obj.orbit);
      }
    }
    return orbitalParams;
  }

  /**
   * Updates the game state from the results of a physics simulation step.
   * This includes updating positions, velocities, handling destroyed objects,
   * and updating acceleration vectors.
   * @param result - The SimulationStepResult from the physics engine.
   */
  public updateStateFromResult(result: SimulationStepResult): void {
    const currentCelestialObjects = celestialStore.getObjects();
    const newCelestialObjectsMap: Record<string, CelestialObject> = {
      ...currentCelestialObjects,
    };

    // Update the physics state cache with the new states
    result.states.forEach((updatedState) => {
      const id = String(updatedState.id);
      const existingObject = newCelestialObjectsMap[id];
      if (existingObject) {
        // Update the physics state cache with the simulation results
        PhysicsStateProvider.updateCacheWithSimulationResult(id, updatedState);
      } else {
        console.warn(
          `[PhysicsSystemAdapter] Received updated state for object ID: ${id}, which was not found in the current celestial objects map. This might happen if the object was created and destroyed in the same tick or if getPhysicsBodies was not perfectly synced.`,
        );
      }
    });

    // Handle destroyed objects, including cascading destruction for ring systems
    const allIdsToDestroy = new Set<string>(
      Array.from(result.destroyedIds).map(String),
    );

    result.destroyedIds.forEach((id) => {
      const destroyedIdStr = String(id);
      const parentObject = currentCelestialObjects[destroyedIdStr]; // Check against the original map before it's potentially altered

      if (parentObject) {
        // Check if the destroyed object is a type that can have rings
        const canHaveRings =
          parentObject.type === CelestialType.PLANET ||
          parentObject.type === CelestialType.DWARF_PLANET ||
          parentObject.type === CelestialType.GAS_GIANT;

        if (canHaveRings) {
          const ringSystemId = `ring-system-${parentObject.id}`;
          const ringSystemObject = currentCelestialObjects[ringSystemId];
          if (
            ringSystemObject &&
            ringSystemObject.type === CelestialType.RING_SYSTEM
          ) {
            allIdsToDestroy.add(ringSystemId);
            console.debug(
              `[PhysicsSystemAdapter] Cascading destruction to ring system: ${ringSystemId} for parent ${parentObject.id}`,
            );
          }
        }
      }
    });

    allIdsToDestroy.forEach((idToDestroy) => {
      const existingObject = newCelestialObjectsMap[idToDestroy]; // Use the map that's being updated
      if (
        existingObject &&
        existingObject.status !== CelestialStatus.DESTROYED &&
        existingObject.status !== CelestialStatus.ANNIHILATED
      ) {
        let finalStatus = CelestialStatus.DESTROYED;
        // Try to find if there's a specific destruction event for this ID (original or cascaded)
        const destructionEvent = result.destructionEvents.find(
          (event) => String(event.destroyedId) === idToDestroy,
        );

        if (destructionEvent) {
          const survivorIdStr = String(destructionEvent.survivorId);
          const survivorObject = currentCelestialObjects[survivorIdStr]; // Check original map for survivor type
          if (survivorObject && survivorObject.type === CelestialType.STAR) {
            finalStatus = CelestialStatus.ANNIHILATED;
          } else if (destructionEvent.survivorId === "MUTUAL_DESTRUCTION") {
            finalStatus = CelestialStatus.ANNIHILATED;
          }
        } else if (
          existingObject.type === CelestialType.RING_SYSTEM &&
          result.destroyedIds.has(existingObject.parentId as string)
        ) {
          // If it's a ring system and its parent was in the original destroyedIds, it's a cascaded destruction.
          // No specific event for the ring system itself, but parent had one (or was generically destroyed)
          // Default to DESTROYED, unless parent was annihilated by a star.
          const parentDestroyEvent = result.destructionEvents.find(
            (event) => String(event.destroyedId) === existingObject.parentId,
          );
          if (parentDestroyEvent) {
            const parentSurvivor =
              currentCelestialObjects[String(parentDestroyEvent.survivorId)];
            if (parentSurvivor && parentSurvivor.type === CelestialType.STAR) {
              finalStatus = CelestialStatus.ANNIHILATED;
            } else if (parentDestroyEvent.survivorId === "MUTUAL_DESTRUCTION") {
              finalStatus = CelestialStatus.ANNIHILATED;
            }
          }
          // If no parent event, or parent just "destroyed", ring system is also "destroyed".
        } else {
          console.warn(
            `[PhysicsSystemAdapter] No specific destruction event found for destroyed ID: ${idToDestroy}. Defaulting to DESTROYED status.`,
          );
        }

        newCelestialObjectsMap[idToDestroy] = {
          ...existingObject,
          status: finalStatus,
        };
      } else if (
        existingObject &&
        (existingObject.status === CelestialStatus.DESTROYED ||
          existingObject.status === CelestialStatus.ANNIHILATED)
      ) {
        // Already marked, possibly by an earlier step in a multi-destruction event. Log if needed.
        // console.debug(`[PhysicsSystemAdapter] Object ${idToDestroy} already marked as ${existingObject.status}.`);
      }
    });

    celestialStore.setAllObjects(newCelestialObjectsMap);
    physicsStore.updateAccelerationVectors(result.accelerations);
  }
}

export const physicsSystemAdapter = PhysicsSystemAdapter.getInstance();
