import type { CelestialObject, PhysicsStateReal } from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import type { SimulationStepResult } from "@teskooano/core-physics"; // Assuming this path is correct or will be resolved by TS
import { gameStateService } from "./stores";
import {
  reassignOrphanedObjects,
  checkAndReassignEscapedMoons,
  checkAndReassignPlanetsToProperStars,
} from "./utils/parent-reassignment";

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
   * This is the main entry point for applying physics simulation results back to the game state.
   *
   * The process involves several steps:
   * 1. Update physics states (positions, velocities) for all active objects
   * 2. Handle object destruction and cascading effects (e.g., ring systems)
   * 3. Reassign orphaned objects to nearest stars when their parent star is destroyed
   * 4. Check and reassign moons that have escaped their parent's gravitational influence
   * 5. Check and reassign planets to their proper gravitational parent star
   * 6. Update acceleration vectors for rendering/debugging purposes
   *
   * @param result - The SimulationStepResult from the physics engine containing updated states and destruction events.
   */
  public updateStateFromResult(result: SimulationStepResult): void {
    const currentCelestialObjects = gameStateService.getCelestialObjects();

    // Step 1: Update physics states for all objects
    let updatedObjectsMap = this.updatePhysicsStates(
      result,
      currentCelestialObjects,
    );

    // Step 2: Handle destruction events and cascading effects
    updatedObjectsMap = this.handleDestructionEvents(
      result,
      currentCelestialObjects,
      updatedObjectsMap,
    );

    // Step 3: Reassign orphaned objects when stars are destroyed
    updatedObjectsMap = this.handleParentReassignment(
      result,
      currentCelestialObjects,
      updatedObjectsMap,
    );

    // Step 4: Check and reassign escaped moons
    // This runs periodically to ensure moons that drift too far from their parent planets
    // are reassigned to the nearest star
    if (this.shouldCheckMoons()) {
      updatedObjectsMap = checkAndReassignEscapedMoons(updatedObjectsMap);
    }

    // Step 5: Check and reassign planets to proper stars
    // This runs periodically to ensure planets orbit the star with the strongest gravitational influence
    if (this.shouldCheckPlanets()) {
      updatedObjectsMap =
        checkAndReassignPlanetsToProperStars(updatedObjectsMap);
    }

    // Step 6: Apply final state and update acceleration vectors
    gameStateService.setAllCelestialObjects(updatedObjectsMap);
    gameStateService.updateAccelerationVectors(result.accelerations);
  }

  /**
   * Updates the physics states (position, velocity, mass) for all objects from simulation results.
   * @param result - The simulation step result containing updated physics states
   * @param currentObjects - The current celestial objects map
   * @returns Updated celestial objects map with new physics states
   */
  private updatePhysicsStates(
    result: SimulationStepResult,
    currentObjects: Record<string, CelestialObject>,
  ): Record<string, CelestialObject> {
    const updatedObjectsMap: Record<string, CelestialObject> = {
      ...currentObjects,
    };

    result.states.forEach((updatedState) => {
      const id = String(updatedState.id);
      const existingObject = updatedObjectsMap[id];

      if (existingObject) {
        updatedObjectsMap[id] = {
          ...existingObject,
          physicsStateReal: updatedState,
        };
      } else {
        console.warn(
          `[PhysicsSystemAdapter] Received updated state for object ID: ${id}, which was not found in the current celestial objects map. This might happen if the object was created and destroyed in the same tick or if getPhysicsBodies was not perfectly synced.`,
        );
      }
    });

    return updatedObjectsMap;
  }

  /**
   * Handles destruction events from the physics simulation, including cascading destruction effects.
   *
   * This method:
   * - Marks destroyed objects with appropriate status (DESTROYED or ANNIHILATED)
   * - Handles cascading destruction (e.g., ring systems when their parent planet is destroyed)
   * - Determines destruction status based on the type of collision (star absorption = ANNIHILATED)
   *
   * @param result - The simulation step result containing destruction events
   * @param currentObjects - The original celestial objects map (before physics updates)
   * @param updatedObjects - The celestial objects map with updated physics states
   * @returns Updated celestial objects map with destruction statuses applied
   */
  private handleDestructionEvents(
    result: SimulationStepResult,
    currentObjects: Record<string, CelestialObject>,
    updatedObjects: Record<string, CelestialObject>,
  ): Record<string, CelestialObject> {
    const objectsMap = { ...updatedObjects };

    // Collect all IDs to destroy, including cascading destructions
    const allIdsToDestroy = this.collectDestructionTargets(
      result,
      currentObjects,
    );

    // Apply destruction status to each target
    allIdsToDestroy.forEach((idToDestroy) => {
      const existingObject = objectsMap[idToDestroy];

      if (this.shouldProcessDestruction(existingObject)) {
        const finalStatus = this.determineDestructionStatus(
          idToDestroy,
          result,
          currentObjects,
          existingObject,
        );

        objectsMap[idToDestroy] = {
          ...existingObject,
          status: finalStatus,
          // Store destruction time for UI display
          destroyedTime: Date.now(),
        } as CelestialObject;
      }
    });

    return objectsMap;
  }

  /**
   * Collects all object IDs that should be destroyed, including cascading effects.
   * For example, when a planet is destroyed, its ring system should also be destroyed.
   */
  private collectDestructionTargets(
    result: SimulationStepResult,
    currentObjects: Record<string, CelestialObject>,
  ): Set<string> {
    const allIdsToDestroy = new Set<string>(
      Array.from(result.destroyedIds).map(String),
    );

    // Handle cascading destruction for ring systems
    result.destroyedIds.forEach((id) => {
      const destroyedIdStr = String(id);
      const parentObject = currentObjects[destroyedIdStr];

      if (parentObject && this.canHaveRings(parentObject)) {
        const ringSystemId = `ring-system-${parentObject.id}`;
        const ringSystemObject = currentObjects[ringSystemId];

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
    });

    return allIdsToDestroy;
  }

  /**
   * Determines whether an object can have ring systems that would be affected by cascading destruction.
   */
  private canHaveRings(object: CelestialObject): boolean {
    return (
      object.type === CelestialType.PLANET ||
      object.type === CelestialType.DWARF_PLANET ||
      object.type === CelestialType.GAS_GIANT
    );
  }

  /**
   * Checks if an object should be processed for destruction (not already destroyed).
   */
  private shouldProcessDestruction(
    object: CelestialObject | undefined,
  ): object is CelestialObject {
    return !!(
      object &&
      object.status !== CelestialStatus.DESTROYED &&
      object.status !== CelestialStatus.ANNIHILATED
    );
  }

  /**
   * Determines the appropriate destruction status based on the type of destruction event.
   *
   * - ANNIHILATED: Object was absorbed by a star or destroyed in mutual destruction
   * - DESTROYED: Object was destroyed in other types of collisions
   */
  private determineDestructionStatus(
    objectId: string,
    result: SimulationStepResult,
    currentObjects: Record<string, CelestialObject>,
    targetObject: CelestialObject,
  ): CelestialStatus {
    // Look for a specific destruction event for this object
    const destructionEvent = result.destructionEvents.find(
      (event) => String(event.destroyedId) === objectId,
    );

    if (destructionEvent) {
      return this.getStatusFromDestructionEvent(
        destructionEvent,
        currentObjects,
      );
    }

    // Handle cascaded destruction (e.g., ring systems)
    if (this.isCascadedDestruction(targetObject, result)) {
      return this.getStatusFromParentDestruction(
        targetObject,
        result,
        currentObjects,
      );
    }

    // Default case - no specific event found
    console.warn(
      `[PhysicsSystemAdapter] No specific destruction event found for destroyed ID: ${objectId}. Defaulting to DESTROYED status.`,
    );
    return CelestialStatus.DESTROYED;
  }

  /**
   * Determines destruction status from a specific destruction event.
   */
  private getStatusFromDestructionEvent(
    event: any,
    currentObjects: Record<string, CelestialObject>,
  ): CelestialStatus {
    const survivorIdStr = String(event.survivorId);
    const survivorObject = currentObjects[survivorIdStr];

    if (survivorObject && survivorObject.type === CelestialType.STAR) {
      return CelestialStatus.ANNIHILATED; // Absorbed by a star
    }

    if (event.survivorId === "MUTUAL_DESTRUCTION") {
      return CelestialStatus.ANNIHILATED; // Mutual destruction
    }

    return CelestialStatus.DESTROYED; // Regular collision
  }

  /**
   * Checks if this is a cascaded destruction (e.g., ring system destroyed because parent was destroyed).
   */
  private isCascadedDestruction(
    object: CelestialObject,
    result: SimulationStepResult,
  ): boolean {
    return (
      object.type === CelestialType.RING_SYSTEM &&
      !!object.parentId &&
      result.destroyedIds.has(object.parentId)
    );
  }

  /**
   * Determines destruction status for cascaded destructions based on parent's destruction.
   */
  private getStatusFromParentDestruction(
    object: CelestialObject,
    result: SimulationStepResult,
    currentObjects: Record<string, CelestialObject>,
  ): CelestialStatus {
    const parentDestroyEvent = result.destructionEvents.find(
      (event) => String(event.destroyedId) === object.parentId,
    );

    if (parentDestroyEvent) {
      return this.getStatusFromDestructionEvent(
        parentDestroyEvent,
        currentObjects,
      );
    }

    return CelestialStatus.DESTROYED; // Default for cascaded destruction
  }

  /**
   * Handles parent reassignment for objects that become orphaned when their parent star is destroyed.
   *
   * This is crucial for maintaining simulation stability - when a star is destroyed, any planets
   * orbiting it need to be reassigned to the nearest remaining star to continue participating
   * in the gravitational simulation properly.
   *
   * @param result - The simulation step result
   * @param currentObjects - The original celestial objects map
   * @param updatedObjects - The celestial objects map with destruction events applied
   * @returns Updated celestial objects map with parent reassignments applied
   */
  private handleParentReassignment(
    result: SimulationStepResult,
    currentObjects: Record<string, CelestialObject>,
    updatedObjects: Record<string, CelestialObject>,
  ): Record<string, CelestialObject> {
    // Identify which destroyed objects were stars
    const destroyedStarIds = Array.from(result.destroyedIds)
      .map(String)
      .filter((id) => {
        const obj = currentObjects[id];
        return obj && obj.type === CelestialType.STAR;
      });

    // If no stars were destroyed, no reassignment needed
    if (destroyedStarIds.length === 0) {
      return updatedObjects;
    }

    console.log(
      `[PhysicsSystemAdapter] Handling parent reassignment for ${destroyedStarIds.length} destroyed stars: ${destroyedStarIds.join(", ")}`,
    );

    // Use the reassignment utility to find new parents for orphaned objects
    return reassignOrphanedObjects(destroyedStarIds, updatedObjects);
  }

  /**
   * Determines if moon checking should be performed this update.
   * We don't need to check every frame - moons don't suddenly escape their orbits.
   * Checking roughly once per simulated week should be sufficient for realistic scenarios.
   * @returns true if moon checking should be performed
   */
  private shouldCheckMoons(): boolean {
    // Check roughly every 1000 physics updates (about once per simulated week at typical time scales)
    const updateCount = (this as any)._updateCount || 0;
    (this as any)._updateCount = updateCount + 1;

    return updateCount % 1000 === 0;
  }

  /**
   * Determines if planet checking should be performed this update.
   * Planets move slowly, so we can check less frequently than moons.
   * @returns true if planet checking should be performed
   */
  private shouldCheckPlanets(): boolean {
    // Check roughly every 5000 physics updates (about once per simulated month at typical time scales)
    const updateCount = (this as any)._updateCount || 0;

    return updateCount % 5000 === 0;
  }
}

export const physicsSystemAdapter = PhysicsSystemAdapter.getInstance();
