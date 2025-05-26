import type { CelestialObject } from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";

/**
 * Calculates the distance between two celestial objects using their physics states.
 * @param obj1 First celestial object
 * @param obj2 Second celestial object
 * @returns Distance in meters, or Infinity if either object lacks physics state
 */
export function calculateDistance(
  obj1: CelestialObject,
  obj2: CelestialObject,
): number {
  if (!obj1.physicsStateReal || !obj2.physicsStateReal) {
    return Infinity;
  }

  const pos1 = obj1.physicsStateReal.position_m;
  const pos2 = obj2.physicsStateReal.position_m;

  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Finds the nearest active star to a given celestial object.
 * @param targetObject The object that needs a new parent
 * @param allObjects All celestial objects in the system
 * @param excludeStarIds Optional array of star IDs to exclude from consideration
 * @returns The nearest star object, or null if no suitable star is found
 */
export function findNearestStar(
  targetObject: CelestialObject,
  allObjects: Record<string, CelestialObject>,
  excludeStarIds: string[] = [],
): CelestialObject | null {
  let nearestStar: CelestialObject | null = null;
  let minDistance = Infinity;

  // Find all active stars
  const activeStars = Object.values(allObjects).filter(
    (obj) =>
      obj.type === CelestialType.STAR &&
      obj.status === CelestialStatus.ACTIVE &&
      !excludeStarIds.includes(obj.id) &&
      obj.physicsStateReal,
  );

  if (activeStars.length === 0) {
    console.warn(
      `[findNearestStar] No active stars available for reassignment of ${targetObject.id}`,
    );
    return null;
  }

  // Calculate distances and find the nearest
  for (const star of activeStars) {
    const distance = calculateDistance(targetObject, star);
    if (distance < minDistance) {
      minDistance = distance;
      nearestStar = star;
    }
  }

  if (nearestStar) {
    console.log(
      `[findNearestStar] Found nearest star ${nearestStar.id} (${nearestStar.name}) for ${targetObject.id} at distance ${(minDistance / 1.496e11).toFixed(2)} AU`,
    );
  }

  return nearestStar;
}

/**
 * Reassigns orphaned objects to the nearest available star when their parent is destroyed.
 * @param destroyedStarIds Array of star IDs that were destroyed
 * @param allObjects All celestial objects in the system
 * @returns Updated celestial objects map with reassigned parents
 */
export function reassignOrphanedObjects(
  destroyedStarIds: string[],
  allObjects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  if (destroyedStarIds.length === 0) {
    return allObjects;
  }

  const updatedObjects = { ...allObjects };
  
  // Check if any destroyed star was a root star (main star with no parent)
  const destroyedRootStars = destroyedStarIds.filter(starId => {
    const star = allObjects[starId];
    return star && !star.parentId && !star.currentParentId;
  });
  
  if (destroyedRootStars.length > 0) {
    console.log(
      `[reassignOrphanedObjects] Destroyed stars include ${destroyedRootStars.length} root star(s). Need to find new main star.`
    );
    
    // Find all remaining active stars
    const remainingStars = Object.values(allObjects).filter(
      (obj) =>
        obj.type === CelestialType.STAR &&
        obj.status === CelestialStatus.ACTIVE &&
        !destroyedStarIds.includes(obj.id)
    );
    
    if (remainingStars.length === 0) {
      console.error(
        `[reassignOrphanedObjects] No remaining stars after destruction. System has no stars!`
      );
      return updatedObjects;
    }
    
    // Choose the new main star (prefer one that already has isMainStar property, or just the first one)
    let newMainStar = remainingStars.find(star => {
      const props = star.properties as any;
      return props?.isMainStar === true;
    });
    
    if (!newMainStar) {
      newMainStar = remainingStars[0];
    }
    
    console.log(
      `[reassignOrphanedObjects] Selected ${newMainStar.id} (${newMainStar.name}) as new main star`
    );
    
    // Update the new main star to have no parent and set isMainStar property
    updatedObjects[newMainStar.id] = {
      ...newMainStar,
      parentId: undefined,
      currentParentId: undefined,
    };
    
    if (updatedObjects[newMainStar.id].properties) {
      (updatedObjects[newMainStar.id].properties as any).isMainStar = true;
    }
    
    // Now find all objects that need reassignment
    // This includes both direct orphans and objects that were in the hierarchy under the destroyed root star
    const objectsToReassign: CelestialObject[] = [];
    
    Object.values(updatedObjects).forEach((obj) => {
      // Skip the new main star itself
      if (obj.id === newMainStar!.id) return;
      
      // Skip other destroyed objects
      if (obj.status !== CelestialStatus.ACTIVE) return;
      
      // Check if this object's parent chain leads to a destroyed star
      let needsReassignment = false;
      let currentParent = obj.parentId || obj.currentParentId;
      
      while (currentParent) {
        if (destroyedStarIds.includes(currentParent)) {
          needsReassignment = true;
          break;
        }
        const parent = allObjects[currentParent];
        if (!parent) break;
        currentParent = parent.parentId || parent.currentParentId;
      }
      
      // Also check if object has no parent (was at root level) and isn't a star
      if (!obj.parentId && !obj.currentParentId && obj.type !== CelestialType.STAR) {
        needsReassignment = true;
      }
      
      if (needsReassignment) {
        objectsToReassign.push(obj);
      }
    });
    
    console.log(
      `[reassignOrphanedObjects] Found ${objectsToReassign.length} objects to reassign to new hierarchy`
    );
    
    // Reassign each object to the nearest star (which might be the new main star)
    objectsToReassign.forEach((orphan) => {
      const nearestStar = findNearestStar(
        orphan,
        updatedObjects,
        destroyedStarIds,
      );

      if (nearestStar) {
        console.log(
          `[reassignOrphanedObjects] Reassigning ${orphan.id} (${orphan.name}) to ${nearestStar.id} (${nearestStar.name})`
        );

        updatedObjects[orphan.id] = {
          ...orphan,
          parentId: nearestStar.id,
          currentParentId: nearestStar.id,
        };
      }
    });
    
  } else {
    // Original logic for non-root stars
    const orphanedObjects: CelestialObject[] = [];

    // Find all objects that are now orphaned
    Object.values(updatedObjects).forEach((obj) => {
      if (
        obj.parentId &&
        destroyedStarIds.includes(obj.parentId) &&
        obj.status === CelestialStatus.ACTIVE &&
        obj.type !== CelestialType.STAR // Don't reassign stars
      ) {
        orphanedObjects.push(obj);
      }
    });

    if (orphanedObjects.length === 0) {
      console.log(
        `[reassignOrphanedObjects] No orphaned objects found for destroyed stars: ${destroyedStarIds.join(", ")}`,
      );
      return updatedObjects;
    }

    console.log(
      `[reassignOrphanedObjects] Found ${orphanedObjects.length} orphaned objects to reassign`,
    );

    // Reassign each orphaned object to the nearest star
    orphanedObjects.forEach((orphan) => {
      const nearestStar = findNearestStar(
        orphan,
        updatedObjects,
        destroyedStarIds,
      );

      if (nearestStar) {
        console.log(
          `[reassignOrphanedObjects] Reassigning ${orphan.id} (${orphan.name}) from destroyed parent ${orphan.parentId} to new parent ${nearestStar.id} (${nearestStar.name})`,
        );

        updatedObjects[orphan.id] = {
          ...orphan,
          parentId: nearestStar.id,
          currentParentId: nearestStar.id,
        };

        // Also reassign any children of this object (like moons)
        const children = Object.values(updatedObjects).filter(
          (obj) =>
            obj.parentId === orphan.id && obj.status === CelestialStatus.ACTIVE,
        );

        children.forEach((child) => {
          console.log(
            `[reassignOrphanedObjects] Child ${child.id} (${child.name}) will inherit new grandparent ${nearestStar.id} through parent ${orphan.id}`,
          );
        });
      } else {
        console.warn(
          `[reassignOrphanedObjects] Could not find a suitable star to reassign ${orphan.id} (${orphan.name}). Object will remain orphaned.`,
        );
      }
    });
  }

  return updatedObjects;
}
