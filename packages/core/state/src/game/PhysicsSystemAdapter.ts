import type { CelestialObject, PhysicsStateReal } from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import type { SimulationStepResult } from "@teskooano/core-physics"; // Assuming this path is correct or will be resolved by TS
import { gameStateService } from "./stores";

/**
 * @class PhysicsSystemAdapter
 * @description Acts as a bridge between the core game state (managed by GameStateService)
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
    Object.values(gameStateService.getCelestialObjects())
      .filter(
        (obj) =>
          obj.status !== CelestialStatus.DESTROYED &&
          obj.status !== CelestialStatus.ANNIHILATED && // Also exclude annihilated
          !obj.ignorePhysics,
      )
      .forEach((obj) => {
        if (obj.physicsStateReal) {
          bodies.push(obj.physicsStateReal);
        } else {
          console.warn(
            `[PhysicsSystemAdapter] Object ${obj.id} is active for physics but missing physicsStateReal, skipping in simulation.`,
          );
        }
      });
    return bodies;
  }

  /**
   * Returns a snapshot of the current celestial objects map from the GameStateService.
   */
  public getCelestialObjectsSnapshot(): Record<string, CelestialObject> {
    return gameStateService.getCelestialObjects();
  }

  /**
   * Updates the game state from the results of a physics simulation step.
   * This includes updating positions, velocities, handling destroyed objects,
   * and updating acceleration vectors.
   * @param result - The SimulationStepResult from the physics engine.
   */
  public updateStateFromResult(result: SimulationStepResult): void {
    const currentCelestialObjects = gameStateService.getCelestialObjects();
    // Start with a copy of current objects to progressively update
    const newCelestialObjectsMap: Record<string, CelestialObject> = {
      ...currentCelestialObjects,
    };

    // Update states for existing bodies from the simulation result
    result.states.forEach((updatedState) => {
      const id = String(updatedState.id);
      const existingObject = newCelestialObjectsMap[id];
      if (existingObject) {
        newCelestialObjectsMap[id] = {
          ...existingObject,
          physicsStateReal: updatedState,
        };
      } else {
        console.warn(
          `[PhysicsSystemAdapter] Received updated state for object ID: ${id}, which was not found in the current celestial objects map. This might happen if the object was created and destroyed in the same tick or if getPhysicsBodies was not perfectly synced.`,
        );
      }
    });

    // Handle destroyed objects
    result.destroyedIds.forEach((id) => {
      const destroyedIdStr = String(id);
      const existingObject = newCelestialObjectsMap[destroyedIdStr];
      if (existingObject) {
        const destructionEvent = result.destructionEvents.find(
          (event) => event.destroyedId === id,
        );
        let finalStatus = CelestialStatus.DESTROYED;

        if (destructionEvent) {
          const survivorIdStr = String(destructionEvent.survivorId);
          // Check original map for survivor type integrity before it's potentially marked destroyed too
          const survivorObject = currentCelestialObjects[survivorIdStr];
          if (survivorObject && survivorObject.type === CelestialType.STAR) {
            finalStatus = CelestialStatus.ANNIHILATED;
          } else if (destructionEvent.survivorId === "MUTUAL_DESTRUCTION") {
            finalStatus = CelestialStatus.ANNIHILATED;
          }
        } else {
          // This can happen if core-physics destroys something without a specific event (e.g. falling into a black hole without explicit collision logic)
          console.warn(
            `[PhysicsSystemAdapter] No specific destruction event found for destroyed ID: ${id}. Defaulting to DESTROYED status.`,
          );
        }
        newCelestialObjectsMap[destroyedIdStr] = {
          ...existingObject,
          status: finalStatus,
          // Consider what to do with physicsStateReal for destroyed objects.
          // The original loop kept it; matching that behavior for now.
        };
      }
    });

    gameStateService.setAllCelestialObjects(newCelestialObjectsMap);
    gameStateService.updateAccelerationVectors(result.accelerations);
  }
}

export const physicsSystemAdapter = PhysicsSystemAdapter.getInstance();
