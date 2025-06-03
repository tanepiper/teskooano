import { CelestialObject } from "../celestial-object";
import { CelestialStatus, CelestialType } from "../types";
import {
  AU,
  GRAVITATIONAL_CONSTANT,
  calculateDistance,
  calculateHillRadius,
  calculateRelativeVelocity,
  canCapture,
} from "@teskooano/core-physics";
import { findNearestStar } from "./parent-selection"; // Assumes parent-selection.ts is in the same directory

// Helper to adapt new CelestialObject to the structure core-physics functions expect
// This is a temporary measure. Ideally, core-physics would accept a more generic interface.
const toOldPhysicsObject = (obj: CelestialObject | null | undefined): any => {
  if (!obj) return null;
  return {
    id: obj.id,
    type: obj.type,
    status: obj.status,
    realMass_kg: obj.physicsState?.mass_kg,
    realRadius_m: obj.physicalProperties?.radius,
    physicsStateReal: obj.physicsState
      ? {
          id: obj.id,
          mass_kg: obj.physicsState.mass_kg,
          position_m: obj.physicsState.position_m,
          velocity_mps: obj.physicsState.velocity_mps,
          ticksSinceLastPhysicsUpdate:
            obj.physicsState.ticksSinceLastPhysicsUpdate,
        }
      : undefined,
    orbit: obj.orbit
      ? {
          realSemiMajorAxis_m: obj.orbit.semiMajorAxis_m,
          eccentricity: obj.orbit.eccentricity,
          inclination: obj.orbit.inclination,
          longitudeOfAscendingNode: obj.orbit.longitudeOfAscendingNode,
          argumentOfPeriapsis: obj.orbit.argumentOfPeriapsis,
          meanAnomaly: obj.orbit.meanAnomaly,
          period_s: obj.orbit.period_s,
        }
      : undefined,
  };
};

/**
 * Re-evaluates whether a child (typically a moon) is still bound to its parent (typically a planet)
 * using Hill-sphere and energy checks.
 * @param child The child CelestialObject (e.g., a moon).
 * @param parent The parent CelestialObject (e.g., a planet).
 * @param systemPrimaryStarMassKg The mass of the primary star in the system, for Hill radius calculation.
 * @returns True if the child is bound, false otherwise.
 */
export function isChildBoundToParent(
  child: CelestialObject,
  parent: CelestialObject,
  systemPrimaryStarMassKg: number,
): boolean {
  if (!child.physicsState || !parent.physicsState) return false;
  // This logic is specific to MOON type children orbiting PLANET or GAS_GIANT parents.
  // It could be generalized if other child-parent type pairings need similar checks.
  if (child.type !== CelestialType.MOON) return false;
  if (
    parent.type !== CelestialType.PLANET &&
    parent.type !== CelestialType.GAS_GIANT
  )
    return false;

  const childForPhysics = toOldPhysicsObject(child);
  const parentForPhysics = toOldPhysicsObject(parent);
  if (!childForPhysics || !parentForPhysics) return false;

  const distance = calculateDistance(childForPhysics, parentForPhysics);
  const parentMass = parent.physicsState.mass_kg ?? 0;

  const semiMajor = parent.orbit?.semiMajorAxis_m ?? AU; // Use parent's orbit for its semi-major axis
  const hill = calculateHillRadius(
    parentMass,
    semiMajor,
    systemPrimaryStarMassKg,
  );
  if (distance > hill) return false;

  if (!child.physicsState.velocity_mps || !parent.physicsState.velocity_mps)
    return false;
  const relVel = calculateRelativeVelocity(
    child.physicsState.velocity_mps,
    parent.physicsState.velocity_mps,
  );
  const totalEnergy =
    0.5 * relVel * relVel + (-GRAVITATIONAL_CONSTANT * parentMass) / distance; // Use relVel * relVel for square of speed
  if (totalEnergy > 0) return false; // child has escape energy.

  return true;
}

/**
 * Internal helper that also checks nearby star influences for child binding.
 */
function isChildBoundToParentWithContext(
  child: CelestialObject,
  parent: CelestialObject,
  systemPrimaryStarMassKg: number,
  allObjects: Record<string, CelestialObject>,
): boolean {
  if (!isChildBoundToParent(child, parent, systemPrimaryStarMassKg))
    return false;

  const childForPhysics = toOldPhysicsObject(child);
  const parentForPhysics = toOldPhysicsObject(parent);
  if (!childForPhysics || !parentForPhysics) return false;

  const distance = calculateDistance(childForPhysics, parentForPhysics);
  const parentMass = parent.physicsState.mass_kg ?? 0;
  if (parentMass === 0 || distance === 0) return false; // Avoid division by zero

  const parentAccel =
    (GRAVITATIONAL_CONSTANT * parentMass) / (distance * distance);

  let maxStarAccel = 0;
  for (const obj of Object.values(allObjects)) {
    if (
      obj.type !== CelestialType.STAR ||
      obj.status !== CelestialStatus.ACTIVE
    )
      continue;
    if (!obj.physicsState || !obj.physicsState.mass_kg) continue;

    const starForPhysics = toOldPhysicsObject(obj);
    if (!starForPhysics) continue;

    const d = calculateDistance(childForPhysics, starForPhysics);
    if (d === 0) continue; // Avoid division by zero
    const a = (GRAVITATIONAL_CONSTANT * obj.physicsState.mass_kg) / (d * d);
    if (a > maxStarAccel) maxStarAccel = a;
  }
  return maxStarAccel <= 3 * parentAccel;
}

/**
 * When a parent object (e.g., planet) is destroyed, its children (e.g., moons) need new parents.
 * Attempts to re-parent children to the largest surviving child or to the nearest star.
 *
 * Note: This function returns a list of proposed parent changes. The caller is responsible
 * for actually updating the parent/child relationships on the CelestialObject instances.
 */
export function determineNewParentsForOrphanedChildren(
  orphanedChildren: CelestialObject[],
  allObjects: Record<string, CelestialObject>,
  // _destroyedParentId: string, // No longer strictly needed if we operate on child objects directly
): Map<string, string> {
  // Map of childId to newParentId
  const parentAssignments = new Map<string, string>();
  if (orphanedChildren.length === 0) return parentAssignments;

  const sortedChildren = [...orphanedChildren].sort(
    (a, b) => (b.physicsState.mass_kg ?? 0) - (a.physicsState.mass_kg ?? 0),
  );

  const primaryStarMass =
    Object.values(allObjects).find(
      (o) =>
        o.type === CelestialType.STAR &&
        o.status === CelestialStatus.ACTIVE &&
        !o.parent,
    )?.physicsState.mass_kg ?? 1e30;

  if (sortedChildren.length > 1) {
    const largestChild = sortedChildren[0];
    const largestChildForPhysics = toOldPhysicsObject(largestChild);

    // Try to make smaller children orbit the largest one.
    for (let i = 1; i < sortedChildren.length; i++) {
      const currentChild = sortedChildren[i];
      const currentChildForPhysics = toOldPhysicsObject(currentChild);

      if (
        largestChildForPhysics &&
        currentChildForPhysics &&
        canCapture(
          largestChildForPhysics,
          currentChildForPhysics,
          primaryStarMass,
        )
      ) {
        parentAssignments.set(currentChild.id, largestChild.id);
      }
    }

    // The largest child itself now orbits the nearest star, if not already assigned.
    if (!parentAssignments.has(largestChild.id)) {
      const nearestStar = findNearestStar(largestChild, allObjects);
      if (nearestStar) {
        parentAssignments.set(largestChild.id, nearestStar.id);
      }
    }
  } else if (sortedChildren.length === 1) {
    const singleOrphan = sortedChildren[0];
    if (!parentAssignments.has(singleOrphan.id)) {
      const nearestStar = findNearestStar(singleOrphan, allObjects);
      if (nearestStar) {
        parentAssignments.set(singleOrphan.id, nearestStar.id);
      }
    }
  }

  // Any remaining unassigned children are also punted to the nearest star.
  for (const child of sortedChildren) {
    if (!parentAssignments.has(child.id)) {
      const nearestStar = findNearestStar(child, allObjects);
      if (nearestStar) {
        parentAssignments.set(child.id, nearestStar.id);
      }
    }
  }

  return parentAssignments;
}

/**
 * Checks all child objects (moons) and identifies those that may have escaped their parent's gravity.
 * Returns a map of childId to new suggested parentId (typically the nearest star).
 */
export function identifyEscapedChildren(
  allObjects: Record<string, CelestialObject>,
): Map<string, string> {
  // Map of childId to newParentId
  const newParentAssignments = new Map<string, string>();

  const primaryStar = Object.values(allObjects).find(
    (o) =>
      o.type === CelestialType.STAR &&
      o.status === CelestialStatus.ACTIVE &&
      !o.parent, // A main star doesn't have a parent in this context
  );
  if (!primaryStar || !primaryStar.physicsState?.mass_kg)
    return newParentAssignments;
  const primaryStarMassKg = primaryStar.physicsState.mass_kg;

  const childrenToCheck = Object.values(allObjects).filter(
    // Generalize to any object that has a parent and is not itself a star
    (o) =>
      o.parent &&
      o.status === CelestialStatus.ACTIVE &&
      o.type !== CelestialType.STAR,
  );

  for (const child of childrenToCheck) {
    const parent = child.parent; // Direct reference
    if (!parent || parent.status !== CelestialStatus.ACTIVE) {
      const nearestStar = findNearestStar(child, allObjects);
      if (nearestStar) {
        newParentAssignments.set(child.id, nearestStar.id);
      }
      continue;
    }
    // If child is a moon and parent is planet/gas_giant, perform specific bound check
    if (
      child.type === CelestialType.MOON &&
      (parent.type === CelestialType.PLANET ||
        parent.type === CelestialType.GAS_GIANT)
    ) {
      if (
        !isChildBoundToParentWithContext(
          child,
          parent,
          primaryStarMassKg,
          allObjects,
        )
      ) {
        const parentForPhysics = toOldPhysicsObject(parent);
        const childForPhysics = toOldPhysicsObject(child);

        if (
          parentForPhysics &&
          childForPhysics &&
          parentForPhysics.realMass_kg &&
          parentForPhysics.orbit
        ) {
          const semiMajor = parentForPhysics.orbit.realSemiMajorAxis_m ?? AU;
          const hill = calculateHillRadius(
            parentForPhysics.realMass_kg,
            semiMajor,
            primaryStarMassKg,
          );
          const dist = calculateDistance(childForPhysics, parentForPhysics);
          if (dist > 2 * hill) {
            // If significantly outside Hill sphere
            const nearestStar = findNearestStar(child, allObjects);
            if (nearestStar) {
              newParentAssignments.set(child.id, nearestStar.id);
            }
          }
        } else {
          // Fallback if detailed check can't be done, assign to nearest star
          const nearestStar = findNearestStar(child, allObjects);
          if (nearestStar) {
            newParentAssignments.set(child.id, nearestStar.id);
          }
        }
      }
    } else if (parent.type === CelestialType.STAR) {
      // If child is orbiting a star, this specific escape logic might not apply in the same way,
      // or would be covered by findBestGravitationalParent if it switches stars.
      // For now, we don't reassign children of stars with this specific function.
    } else {
      // For other parent-child types, if a generic escape check is needed, it could be added here.
      // As a fallback, if parent is inactive or gone, reassign to nearest star.
      const nearestStar = findNearestStar(child, allObjects);
      if (nearestStar) {
        newParentAssignments.set(child.id, nearestStar.id);
      }
    }
  }
  return newParentAssignments;
}
