import type { SimulationStepResult } from "@teskooano/core-physics";
import {
  CelestialObject,
  type CelestialPhysicsState,
  CelestialStatus,
  CelestialType,
  type PhysicsEngineType,
} from "@teskooano/celestial-object";
import { gameStateService } from "./stores";
import { simulationStateService } from "./simulation";

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
   * Filters out destroyed objects.
   * Note: The 'ignorePhysics' flag from the old CelestialObject is not present in the new one.
   * Logic is simplified to process non-destroyed objects. Stars are inherently processed.
   */
  public getPhysicsBodies(): CelestialPhysicsState[] {
    const bodies: CelestialPhysicsState[] = [];
    Object.values(gameStateService.getCelestialObjects())
      .filter(
        (obj) => obj.status !== CelestialStatus.DESTROYED && !obj.ignorePhysics,
      )
      .forEach((obj) => {
        if (obj.physicsState) {
          bodies.push(obj.physicsState);
        } else {
          console.warn(
            `[PhysicsSystemAdapter] Object ${obj.id} is active for physics but missing physicsState, skipping in simulation.`,
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
    const physicsEngine =
      simulationStateService.getCurrentState().physicsEngine;

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
    const destroyedStarIds = Array.from(result.destroyedIds)
      .map(String)
      .filter((id) => {
        const obj = currentCelestialObjects[id];
        return obj && obj.type === CelestialType.STAR;
      });

    if (destroyedStarIds.length > 0) {
      console.log(
        `[PhysicsSystemAdapter] Handling parent reassignment for ${destroyedStarIds.length} destroyed stars: ${destroyedStarIds.join(", ")}`,
      );
      CelestialObject.handleDestroyedObjects(
        destroyedStarIds,
        updatedObjectsMap,
        physicsEngine,
      );
    }

    // Step 4 & 5: System-wide hierarchy maintenance (escaped moons, planet-star assignment)
    if (this.shouldPerformHierarchyMaintenance()) {
      CelestialObject.performSystemHierarchyMaintenance(
        updatedObjectsMap,
        physicsEngine,
      );
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
        existingObject.physicsState = updatedState as CelestialPhysicsState;
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
          existingObject as CelestialObject,
        );

        objectsMap[idToDestroy] = {
          ...existingObject,
          status: finalStatus,
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

      if (parentObject && this.canHaveRings(parentObject as CelestialObject)) {
        const ringSystemId = `ring-system-${parentObject.id}`;
        const ringSystemObject = currentObjects[ringSystemId];

        if (
          ringSystemObject &&
          (ringSystemObject as CelestialObject).type ===
            CelestialType.RING_SYSTEM
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
    return !!(object && object.status !== CelestialStatus.DESTROYED);
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

    if (
      survivorObject &&
      (survivorObject as CelestialObject).type === CelestialType.STAR
    ) {
      return CelestialStatus.DESTROYED;
    }

    if (event.survivorId === "MUTUAL_DESTRUCTION") {
      return CelestialStatus.DESTROYED;
    }

    return CelestialStatus.DESTROYED;
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
      !!object.parent?.id &&
      result.destroyedIds.has(object.parent.id)
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
      (event) => String(event.destroyedId) === object.parent?.id,
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
   * Determines if system-wide hierarchy maintenance should be performed this update.
   * Combines previous moon and planet check frequencies.
   * @returns true if hierarchy maintenance should be performed
   */
  private shouldPerformHierarchyMaintenance(): boolean {
    // Check roughly every 1000 physics updates (adjust as needed)
    const updateCount = (this as any)._updateCount || 0;
    (this as any)._updateCount = updateCount + 1;
    return updateCount % 1000 === 0;
  }
}

export const physicsSystemAdapter = PhysicsSystemAdapter.getInstance();
