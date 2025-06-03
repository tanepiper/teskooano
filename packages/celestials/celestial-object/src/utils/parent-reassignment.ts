import { CelestialObject } from "../celestial-object";
import { CelestialStatus, CelestialTypes, PhysicsEngineType } from "../types";

import { calculateGravitationalInfluence } from "@teskooano/core-physics";
import {
  findNewMainStar,
  findBestGravitationalParent,
} from "./parent-selection";
import {
  determineNewParentsForOrphanedChildren,
  identifyEscapedChildren,
} from "./child-logic";
import { CelestialType } from "packages/data/types/src";

/**
 * Adapts a `CelestialObject` instance to the data structure expected by
 * `calculateGravitationalInfluence` from `@teskooano/core-physics`.
 * This is intended as a temporary compatibility layer.
 *
 * @param obj The `CelestialObject` to adapt.
 * @returns An object formatted for legacy physics functions, or `null` if the input is null.
 */
const toOldPhysicsObjectAdapter = (
  obj: CelestialObject | null | undefined,
): any => {
  if (!obj) return null;
  return {
    id: obj.id,
    type: obj.type,
    status: obj.status,
    realMass_kg: obj.physicsState?.mass_kg,
    physicsStateReal: obj.physicsState
      ? {
          // Ensure physicsStateReal is populated
          id: obj.id,
          mass_kg: obj.physicsState.mass_kg,
          position_m: obj.physicsState.position_m,
          velocity_mps: obj.physicsState.velocity_mps,
          ticksSinceLastPhysicsUpdate:
            obj.physicsState.ticksSinceLastPhysicsUpdate,
        }
      : undefined,
    // Ensure other fields like orbit are present if calculateGravitationalInfluence uses them indirectly
    // For now, assuming calculateGravitationalInfluence primarily needs mass and position via physicsStateReal
  };
};

/**
 * Handles re-parenting when celestial objects are destroyed.
 * Modifies CelestialObject instances in `allObjects` directly.
 * @param destroyedIds IDs of objects that were destroyed.
 * @param allObjects A record of all active CelestialObject instances.
 * @param physicsEngine The current physics engine type.
 */
export function reassignOrphanedObjects(
  destroyedIds: string[],
  allObjects: Record<string, CelestialObject>,
  physicsEngine: PhysicsEngineType,
): void {
  // No longer returns a new record; modifies in place
  if (physicsEngine !== "verlet" && physicsEngine !== "symplectic") {
    return; // In non-N-body modes, do not reassign parents dynamically.
  }
  if (destroyedIds.length === 0) return;

  const destroyedStarIds = destroyedIds.filter(
    (id) => allObjects[id]?.type === CelestialTypes.STAR,
  );
  const destroyedPlanetIds = destroyedIds.filter((id) => {
    const obj = allObjects[id];
    return (
      obj &&
      (obj.type === CelestialTypes.PLANET ||
        obj.type === CelestialTypes.GAS_GIANT)
    );
  });

  // --- Main Star Destruction & Replacement ---
  if (destroyedStarIds.length) {
    const mainStarWasDestroyed = destroyedStarIds.some(
      (id) => allObjects[id]?.isMainStar,
    );

    if (mainStarWasDestroyed) {
      const newMain = findNewMainStar(
        allObjects,
        physicsEngine,
        destroyedStarIds,
      );
      if (newMain) {
        // Unset old main stars
        Object.values(allObjects).forEach((obj) => {
          if (
            obj.type === CelestialType.STAR &&
            obj.isMainStar &&
            obj.id !== newMain.id
          ) {
            obj.isMainStar = false;
          }
        });
        // Set new main star
        newMain.isMainStar = true;
        newMain.parent = undefined; // Main star has no parent

        // Re-parent any stars that orbited a destroyed main star to the new main star
        for (const obj of Object.values(allObjects)) {
          if (
            obj.type === CelestialType.STAR &&
            obj.status === CelestialStatus.ACTIVE &&
            obj.parent &&
            destroyedStarIds.includes(obj.parent.id) && // Was child of a destroyed star
            obj.id !== newMain.id // Is not the new main star itself
          ) {
            obj.parent?.removeChild(obj); // Detach from old (destroyed) parent if relationship was set
            newMain.addChild(obj);
            obj.parent = newMain;
          }
        }
      } else {
        console.error(
          "[parent-reassignment] Main star destroyed and no suitable replacement found!",
        );
        // Potentially handle catastrophic scenario: e.g., mark all objects for removal or a different state.
      }
    }

    // Re-parent planets that orbited any now-dead star.
    for (const objId in allObjects) {
      const obj = allObjects[objId];
      if (
        obj.status === CelestialStatus.ACTIVE &&
        (obj.type === CelestialType.PLANET ||
          obj.type === CelestialType.GAS_GIANT) &&
        obj.parent &&
        destroyedStarIds.includes(obj.parent.id) // Parent was a destroyed star
      ) {
        const bestNewParent = findBestGravitationalParent(
          obj,
          allObjects,
          physicsEngine,
          destroyedStarIds, // Exclude destroyed stars from being potential new parents
        );
        if (bestNewParent) {
          obj.parent?.removeChild(obj);
          bestNewParent.addChild(obj);
          obj.parent = bestNewParent;
        } else {
          // Planet becomes orphaned, could drift or be handled by a subsequent pass
          obj.parent?.removeChild(obj);
          obj.parent = undefined;
        }
      }
    }
  }

  // --- Planet Destruction (handles their children/moons) ---
  for (const planetId of destroyedPlanetIds) {
    const parentPlanet = allObjects[planetId]; // This object is being destroyed
    if (!parentPlanet) continue;

    const childrenOfDestroyedPlanet = Object.values(allObjects).filter(
      (o) => o.parent?.id === planetId,
    );

    if (childrenOfDestroyedPlanet.length > 0) {
      const newParentAssignments = determineNewParentsForOrphanedChildren(
        childrenOfDestroyedPlanet,
        allObjects,
      );
      newParentAssignments.forEach((newParentId, childId) => {
        const child = allObjects[childId];
        const newParent = allObjects[newParentId];
        if (child && newParent) {
          child.parent?.removeChild(child); // Detach from original parent (which is being destroyed)
          newParent.addChild(child);
          child.parent = newParent;
        } else {
          // Child couldn't be reassigned, becomes orphaned
          child.parent?.removeChild(child);
          child.parent = undefined;
        }
      });
    }
  }
}

/**
 * In multi-star systems, ensures planets orbit the star with the strongest gravitational pull.
 * Modifies CelestialObject instances in `allObjects` directly.
 */
export function checkAndReassignPlanetsToProperStars(
  allObjects: Record<string, CelestialObject>,
  physicsEngine: PhysicsEngineType,
): void {
  // Modifies in place
  if (physicsEngine !== "verlet" && physicsEngine !== "symplectic") {
    return;
  }

  const stars = Object.values(allObjects).filter(
    (o) => o.type === CelestialType.STAR && o.status === CelestialStatus.ACTIVE,
  );
  if (stars.length <= 1) return; // Nothing to do in a single-star system.

  const planetsAndGasGiants = Object.values(allObjects).filter(
    (o) =>
      (o.type === CelestialType.PLANET || o.type === CelestialType.GAS_GIANT) &&
      o.status === CelestialStatus.ACTIVE,
  );

  for (const planet of planetsAndGasGiants) {
    if (!planet.physicsState || !planet.parent) continue; // Planet must have physics and a current parent

    let bestStarParent: CelestialObject | null = null;
    let maxInfluence = 0;

    const planetForPhysics = toOldPhysicsObjectAdapter(planet);
    if (!planetForPhysics) continue;

    for (const star of stars) {
      if (!star.physicsState) continue;
      const starForPhysics = toOldPhysicsObjectAdapter(star);
      if (!starForPhysics) continue;

      const influence = calculateGravitationalInfluence(
        starForPhysics,
        planetForPhysics,
      );
      if (influence > maxInfluence) {
        maxInfluence = influence;
        bestStarParent = star;
      }
    }

    if (bestStarParent && bestStarParent.id !== planet.parent.id) {
      const currentParentForPhysics = toOldPhysicsObjectAdapter(planet.parent);
      if (currentParentForPhysics) {
        const currentInfluence = calculateGravitationalInfluence(
          currentParentForPhysics,
          planetForPhysics,
        );
        // Switch if the new best star is significantly more influential (e.g., 1.5x threshold)
        if (maxInfluence > currentInfluence * 1.5) {
          planet.parent?.removeChild(planet);
          bestStarParent.addChild(planet);
          planet.parent = bestStarParent;
        }
      }
    }
  }
}

/**
 * Checks for children (e.g. moons) that might have escaped their parent's gravity and reassigns them,
 * typically to the nearest star. Modifies CelestialObject instances in `allObjects` directly.
 */
export function checkAndReassignEscapedChildren(
  allObjects: Record<string, CelestialObject>,
  physicsEngine: PhysicsEngineType, // Added for consistency, though not directly used by identifyEscapedChildren yet
): void {
  // Modifies in place
  if (physicsEngine !== "verlet" && physicsEngine !== "symplectic") {
    return;
  }

  const newParentAssignments = identifyEscapedChildren(allObjects);
  if (newParentAssignments.size === 0) return;

  newParentAssignments.forEach((newParentId, childId) => {
    const child = allObjects[childId];
    const newParent = allObjects[newParentId];
    if (child && newParent) {
      child.parent?.removeChild(child); // Detach from old parent
      newParent.addChild(child);
      child.parent = newParent;
    } else if (child) {
      // New parent not found (e.g. star itself was destroyed concurrently), child becomes orphaned
      child.parent?.removeChild(child);
      child.parent = undefined;
    }
  });
}
