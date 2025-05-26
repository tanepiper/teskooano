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
 * Calculates the gravitational influence of one object on another.
 * Uses Newton's law of gravitation: F = G * m1 * m2 / r^2
 * We return G * m1 / r^2 as the "gravitational influence score"
 * @param influencer The object exerting gravitational influence
 * @param target The object being influenced
 * @returns Gravitational influence score, or 0 if calculation fails
 */
export function calculateGravitationalInfluence(
  influencer: CelestialObject,
  target: CelestialObject,
): number {
  const distance = calculateDistance(influencer, target);
  if (distance === Infinity || distance === 0) return 0;
  
  const mass = influencer.realMass_kg || 0;
  if (mass === 0) return 0;
  
  // G * m / r^2 (we don't need the actual force, just relative influence)
  // Using normalized units to avoid huge numbers
  const distanceAU = distance / 1.496e11; // Convert to AU for manageable numbers
  return mass / (distanceAU * distanceAU);
}

/**
 * Determines if an object can capture another based on mass and velocity.
 * A simple check based on whether the target is within the Hill sphere
 * and has low enough velocity relative to the capturer.
 * @param capturer The object attempting to capture
 * @param target The object being captured
 * @param primaryMass The mass of the primary body (e.g., star) in kg
 * @returns true if capture is possible
 */
export function canCapture(
  capturer: CelestialObject,
  target: CelestialObject,
  primaryMass: number,
): boolean {
  if (!capturer.physicsStateReal || !target.physicsStateReal) return false;
  
  const distance = calculateDistance(capturer, target);
  const capturerMass = capturer.realMass_kg || 0;
  const targetMass = target.realMass_kg || 0;
  
  // Skip if capturer is less massive than target (can't capture something bigger)
  if (capturerMass <= targetMass) return false;
  
  // Calculate Hill sphere radius (simplified)
  // r_H ≈ a * (m_planet / 3*m_star)^(1/3)
  const semiMajorAxis = capturer.orbit?.realSemiMajorAxis_m || distance;
  const hillRadius = semiMajorAxis * Math.pow(capturerMass / (3 * primaryMass), 1/3);
  
  // Check if target is within Hill sphere
  if (distance > hillRadius) return false;
  
  // Check relative velocity (simplified - just check if it's not too high)
  const vel1 = capturer.physicsStateReal.velocity_mps;
  const vel2 = target.physicsStateReal.velocity_mps;
  const relVel = Math.sqrt(
    Math.pow(vel1.x - vel2.x, 2) +
    Math.pow(vel1.y - vel2.y, 2) +
    Math.pow(vel1.z - vel2.z, 2)
  );
  
  // Escape velocity from capturer at current distance
  const G = 6.67430e-11;
  const escapeVel = Math.sqrt(2 * G * capturerMass / distance);
  
  // Can capture if relative velocity is less than escape velocity
  return relVel < escapeVel;
}

/**
 * Finds the most suitable parent for an object based on gravitational influence.
 * Considers mass and distance to find the dominant gravitational attractor.
 * @param targetObject The object that needs a new parent
 * @param allObjects All celestial objects in the system
 * @param excludeIds Optional array of object IDs to exclude from consideration
 * @returns The most suitable parent object, or null if none found
 */
export function findBestGravitationalParent(
  targetObject: CelestialObject,
  allObjects: Record<string, CelestialObject>,
  excludeIds: string[] = [],
): CelestialObject | null {
  let bestParent: CelestialObject | null = null;
  let maxInfluence = 0;
  
  // Consider all active objects that could be parents
  const potentialParents = Object.values(allObjects).filter((obj) => {
    if (obj.id === targetObject.id) return false;
    if (excludeIds.includes(obj.id)) return false;
    if (obj.status !== CelestialStatus.ACTIVE) return false;
    if (!obj.physicsStateReal) return false;
    
    // Stars can be parents to anything
    if (obj.type === CelestialType.STAR) return true;
    
    // Gas giants and large planets can capture smaller objects
    if (obj.type === CelestialType.GAS_GIANT) return true;
    if (obj.type === CelestialType.PLANET && obj.realMass_kg && obj.realMass_kg > (targetObject.realMass_kg || 0)) return true;
    
    return false;
  });
  
  // Find the object with the highest gravitational influence
  for (const parent of potentialParents) {
    const influence = calculateGravitationalInfluence(parent, targetObject);
    
    if (influence > maxInfluence) {
      maxInfluence = influence;
      bestParent = parent;
    }
  }
  
  if (bestParent) {
    const distance = calculateDistance(targetObject, bestParent) / 1.496e11; // Convert to AU
    console.log(
      `[findBestGravitationalParent] Best parent for ${targetObject.id} (${targetObject.name}) is ${bestParent.id} (${bestParent.name}) with influence score ${maxInfluence.toExponential(2)} at ${distance.toFixed(2)} AU`
    );
  }
  
  return bestParent;
}

/**
 * Finds the new main star when the current main star is destroyed.
 * The most massive remaining star becomes the new main star.
 * @param allObjects All celestial objects in the system
 * @param excludeStarIds Star IDs to exclude (destroyed stars)
 * @returns The new main star, or null if no stars remain
 */
export function findNewMainStar(
  allObjects: Record<string, CelestialObject>,
  excludeStarIds: string[] = [],
): CelestialObject | null {
  const remainingStars = Object.values(allObjects).filter(
    (obj) =>
      obj.type === CelestialType.STAR &&
      obj.status === CelestialStatus.ACTIVE &&
      !excludeStarIds.includes(obj.id)
  );
  
  if (remainingStars.length === 0) return null;
  
  // Sort by mass (descending) and pick the most massive
  remainingStars.sort((a, b) => (b.realMass_kg || 0) - (a.realMass_kg || 0));
  
  const newMainStar = remainingStars[0];
  console.log(
    `[findNewMainStar] Selected ${newMainStar.id} (${newMainStar.name}) as new main star with mass ${newMainStar.realMass_kg?.toExponential(2)} kg`
  );
  
  return newMainStar;
}

/**
 * Handles the special case of moon reassignment when their parent planet is destroyed.
 * Moons can either be captured by the star or become independent bodies.
 * @param moons Array of moon objects that lost their parent
 * @param allObjects All celestial objects in the system
 * @param destroyedPlanetId The ID of the destroyed planet
 * @returns Updated moon objects with new parents or as independent bodies
 */
export function reassignOrphanedMoons(
  moons: CelestialObject[],
  allObjects: Record<string, CelestialObject>,
  destroyedPlanetId: string,
): Record<string, CelestialObject> {
  const updatedMoons: Record<string, CelestialObject> = {};
  
  // Sort moons by mass (largest first)
  const sortedMoons = [...moons].sort((a, b) => (b.realMass_kg || 0) - (a.realMass_kg || 0));
  
  if (sortedMoons.length > 1) {
    // Multiple moons - they might form a new system
    const largestMoon = sortedMoons[0];
    console.log(
      `[reassignOrphanedMoons] Multiple moons orphaned. Largest moon ${largestMoon.id} (${largestMoon.name}) may become primary.`
    );
    
    // Check if the largest moon can gravitationally bind the others
    let boundMoons = false;
    for (let i = 1; i < sortedMoons.length; i++) {
      const moon = sortedMoons[i];
      const primaryMass = Object.values(allObjects).find(obj => obj.type === CelestialType.STAR && obj.status === CelestialStatus.ACTIVE)?.realMass_kg || 1e30;
      
      if (canCapture(largestMoon, moon, primaryMass)) {
        // This moon is captured by the largest moon
        updatedMoons[moon.id] = {
          ...moon,
          parentId: largestMoon.id,
          currentParentId: largestMoon.id,
        };
        boundMoons = true;
        console.log(
          `[reassignOrphanedMoons] Moon ${moon.id} (${moon.name}) captured by larger moon ${largestMoon.id}`
        );
      }
    }
    
    // The largest moon needs a new parent (star or large planet)
    const bestParent = findBestGravitationalParent(largestMoon, allObjects, [destroyedPlanetId]);
    if (bestParent) {
      updatedMoons[largestMoon.id] = {
        ...largestMoon,
        parentId: bestParent.id,
        currentParentId: bestParent.id,
      };
      console.log(
        `[reassignOrphanedMoons] Largest moon ${largestMoon.id} reassigned to ${bestParent.id} (${bestParent.name})`
      );
    }
    
    // Handle any moons not captured by the largest
    for (const moon of sortedMoons) {
      if (!updatedMoons[moon.id]) {
        const bestParent = findBestGravitationalParent(moon, allObjects, [destroyedPlanetId]);
        if (bestParent) {
          updatedMoons[moon.id] = {
            ...moon,
            parentId: bestParent.id,
            currentParentId: bestParent.id,
          };
        }
      }
    }
  } else if (sortedMoons.length === 1) {
    // Single moon - find best gravitational parent
    const moon = sortedMoons[0];
    const bestParent = findBestGravitationalParent(moon, allObjects, [destroyedPlanetId]);
    
    if (bestParent) {
      updatedMoons[moon.id] = {
        ...moon,
        parentId: bestParent.id,
        currentParentId: bestParent.id,
      };
      console.log(
        `[reassignOrphanedMoons] Single moon ${moon.id} (${moon.name}) reassigned to ${bestParent.id} (${bestParent.name})`
      );
    }
  }
  
  return updatedMoons;
}

/**
 * Reassigns orphaned objects when their parent is destroyed.
 * Handles star destruction, planet destruction, and capture mechanics.
 * @param destroyedIds Array of object IDs that were destroyed
 * @param allObjects All celestial objects in the system
 * @returns Updated celestial objects map with reassigned parents
 */
export function reassignOrphanedObjects(
  destroyedIds: string[],
  allObjects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  if (destroyedIds.length === 0) return allObjects;
  
  const updatedObjects = { ...allObjects };
  const destroyedStarIds = destroyedIds.filter(id => allObjects[id]?.type === CelestialType.STAR);
  const destroyedPlanetIds = destroyedIds.filter(id => 
    allObjects[id]?.type === CelestialType.PLANET || 
    allObjects[id]?.type === CelestialType.GAS_GIANT
  );
  
  // Handle destroyed stars first
  if (destroyedStarIds.length > 0) {
    // Check if the main star was destroyed
    const destroyedMainStar = destroyedStarIds.find(id => {
      const star = allObjects[id];
      return star && (!star.parentId && !star.currentParentId);
    });
    
    if (destroyedMainStar) {
      // Find new main star (most massive remaining star)
      const newMainStar = findNewMainStar(allObjects, destroyedStarIds);
      
      if (!newMainStar) {
        console.error("[reassignOrphanedObjects] No stars remain in the system!");
        return updatedObjects;
      }
      
      // Update the new main star
      updatedObjects[newMainStar.id] = {
        ...newMainStar,
        parentId: undefined,
        currentParentId: undefined,
      };
      
      if (updatedObjects[newMainStar.id].properties) {
        (updatedObjects[newMainStar.id].properties as any).isMainStar = true;
      }
      
      // Reassign all stars that had the old main star as parent
      Object.values(updatedObjects).forEach((obj) => {
        if (
          obj.type === CelestialType.STAR &&
          obj.status === CelestialStatus.ACTIVE &&
          (obj.parentId === destroyedMainStar || obj.currentParentId === destroyedMainStar) &&
          obj.id !== newMainStar.id
        ) {
          updatedObjects[obj.id] = {
            ...obj,
            parentId: newMainStar.id,
            currentParentId: newMainStar.id,
          };
          console.log(
            `[reassignOrphanedObjects] Star ${obj.id} (${obj.name}) reassigned to new main star ${newMainStar.id}`
          );
        }
      });
    }
    
    // Handle orphaned planets from destroyed stars
    Object.values(updatedObjects).forEach((obj) => {
      if (
        obj.status === CelestialStatus.ACTIVE &&
        (obj.type === CelestialType.PLANET || obj.type === CelestialType.GAS_GIANT) &&
        obj.parentId && destroyedStarIds.includes(obj.parentId)
      ) {
        // Find best gravitational parent (might not be the closest star!)
        const bestParent = findBestGravitationalParent(obj, updatedObjects, destroyedStarIds);
        
        if (bestParent) {
          updatedObjects[obj.id] = {
            ...obj,
            parentId: bestParent.id,
            currentParentId: bestParent.id,
          };
          console.log(
            `[reassignOrphanedObjects] Planet ${obj.id} (${obj.name}) reassigned from destroyed star to ${bestParent.id} (${bestParent.name})`
          );
        }
      }
    });
  }
  
  // Handle destroyed planets (moon reassignment)
  if (destroyedPlanetIds.length > 0) {
    destroyedPlanetIds.forEach((planetId) => {
      // Find all moons of this planet
      const orphanedMoons = Object.values(updatedObjects).filter(
        (obj) =>
          obj.type === CelestialType.MOON &&
          obj.status === CelestialStatus.ACTIVE &&
          obj.parentId === planetId
      );
      
      if (orphanedMoons.length > 0) {
        const reassignedMoons = reassignOrphanedMoons(orphanedMoons, updatedObjects, planetId);
        Object.assign(updatedObjects, reassignedMoons);
      }
    });
  }
  
  return updatedObjects;
}
