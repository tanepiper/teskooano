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
  const hillRadius =
    semiMajorAxis * Math.pow(capturerMass / (3 * primaryMass), 1 / 3);

  // Check if target is within Hill sphere
  if (distance > hillRadius) return false;

  // Check relative velocity (simplified - just check if it's not too high)
  const vel1 = capturer.physicsStateReal.velocity_mps;
  const vel2 = target.physicsStateReal.velocity_mps;
  const relVel = Math.sqrt(
    Math.pow(vel1.x - vel2.x, 2) +
      Math.pow(vel1.y - vel2.y, 2) +
      Math.pow(vel1.z - vel2.z, 2),
  );

  // Escape velocity from capturer at current distance
  const G = 6.6743e-11;
  const escapeVel = Math.sqrt((2 * G * capturerMass) / distance);

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

    // Gas giants and large planets can capture smaller objects (but not other planets/gas giants)
    if (
      targetObject.type === CelestialType.MOON ||
      targetObject.type === CelestialType.ASTEROID_FIELD
    ) {
      if (obj.type === CelestialType.GAS_GIANT) return true;
      if (
        obj.type === CelestialType.PLANET &&
        obj.realMass_kg &&
        obj.realMass_kg > (targetObject.realMass_kg || 0)
      )
        return true;
    }

    return false;
  });

  // For planets and gas giants, we should find the star with the strongest gravitational influence
  if (
    targetObject.type === CelestialType.PLANET ||
    targetObject.type === CelestialType.GAS_GIANT
  ) {
    // Only consider stars for planets
    const stars = potentialParents.filter(
      (obj) => obj.type === CelestialType.STAR,
    );

    if (stars.length === 0) {
      console.warn(
        `[findBestGravitationalParent] No active stars found for planet ${targetObject.name}`,
      );
      return null;
    }

    // Find the star with the highest gravitational influence
    // No distance penalties - pure gravitational influence
    for (const star of stars) {
      const influence = calculateGravitationalInfluence(star, targetObject);

      if (influence > maxInfluence) {
        maxInfluence = influence;
        bestParent = star;
      }
    }

    if (bestParent) {
      const distance = calculateDistance(targetObject, bestParent) / 1.496e11; // Convert to AU
      console.log(
        `[findBestGravitationalParent] Planet ${targetObject.name} assigned to star ${bestParent.name} ` +
          `(mass=${bestParent.realMass_kg?.toExponential(2)} kg) with influence ${maxInfluence.toExponential(2)} at ${distance.toFixed(2)} AU`,
      );
    }
  } else {
    // For moons and other small objects, check both stars and planets
    // but apply some distance logic to prefer closer massive objects
    for (const parent of potentialParents) {
      const distance = calculateDistance(targetObject, parent);
      const distanceAU = distance / 1.496e11;

      // For non-star parents (planets capturing moons), apply distance penalty
      let influence = calculateGravitationalInfluence(parent, targetObject);

      if (parent.type !== CelestialType.STAR && distanceAU > 0.1) {
        // 0.1 AU = ~15 million km
        // Apply distance penalty for planets trying to capture distant moons
        const distancePenalty = Math.exp(-distanceAU * 10); // Steep falloff
        influence *= distancePenalty;
      }

      if (influence > maxInfluence) {
        maxInfluence = influence;
        bestParent = parent;
      }
    }
  }

  if (bestParent) {
    const distance = calculateDistance(targetObject, bestParent) / 1.496e11; // Convert to AU
    console.log(
      `[findBestGravitationalParent] Best parent for ${targetObject.id} (${targetObject.name}) is ${bestParent.id} (${bestParent.name}) with influence score ${maxInfluence.toExponential(2)} at ${distance.toFixed(2)} AU`,
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
      !excludeStarIds.includes(obj.id),
  );

  if (remainingStars.length === 0) return null;

  // Sort by mass (descending) and pick the most massive
  remainingStars.sort((a, b) => (b.realMass_kg || 0) - (a.realMass_kg || 0));

  const newMainStar = remainingStars[0];
  console.log(
    `[findNewMainStar] Selected ${newMainStar.id} (${newMainStar.name}) as new main star with mass ${newMainStar.realMass_kg?.toExponential(2)} kg`,
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
  const sortedMoons = [...moons].sort(
    (a, b) => (b.realMass_kg || 0) - (a.realMass_kg || 0),
  );

  if (sortedMoons.length > 1) {
    // Multiple moons - they might form a new system
    const largestMoon = sortedMoons[0];
    console.log(
      `[reassignOrphanedMoons] Multiple moons orphaned. Largest moon ${largestMoon.id} (${largestMoon.name}) may become primary.`,
    );

    // Check if the largest moon can gravitationally bind the others
    let boundMoons = false;
    for (let i = 1; i < sortedMoons.length; i++) {
      const moon = sortedMoons[i];
      const primaryMass =
        Object.values(allObjects).find(
          (obj) =>
            obj.type === CelestialType.STAR &&
            obj.status === CelestialStatus.ACTIVE,
        )?.realMass_kg || 1e30;

      if (canCapture(largestMoon, moon, primaryMass)) {
        // This moon is captured by the largest moon
        updatedMoons[moon.id] = {
          ...moon,
          parentId: largestMoon.id,
          currentParentId: largestMoon.id,
        };
        boundMoons = true;
        console.log(
          `[reassignOrphanedMoons] Moon ${moon.id} (${moon.name}) captured by larger moon ${largestMoon.id}`,
        );
      }
    }

    // The largest moon needs a new parent - prefer the nearest star
    const nearestStar = findNearestStar(largestMoon, allObjects);
    if (nearestStar) {
      updatedMoons[largestMoon.id] = {
        ...largestMoon,
        parentId: nearestStar.id,
        currentParentId: nearestStar.id,
      };
      console.log(
        `[reassignOrphanedMoons] Largest moon ${largestMoon.id} reassigned to nearest star ${nearestStar.id} (${nearestStar.name})`,
      );
    }

    // Handle any moons not captured by the largest
    for (const moon of sortedMoons) {
      if (!updatedMoons[moon.id]) {
        const nearestStar = findNearestStar(moon, allObjects);
        if (nearestStar) {
          updatedMoons[moon.id] = {
            ...moon,
            parentId: nearestStar.id,
            currentParentId: nearestStar.id,
          };
        }
      }
    }
  } else if (sortedMoons.length === 1) {
    // Single moon - assign to nearest star
    const moon = sortedMoons[0];
    const nearestStar = findNearestStar(moon, allObjects);

    if (nearestStar) {
      updatedMoons[moon.id] = {
        ...moon,
        parentId: nearestStar.id,
        currentParentId: nearestStar.id,
      };
      console.log(
        `[reassignOrphanedMoons] Single moon ${moon.id} (${moon.name}) reassigned to nearest star ${nearestStar.id} (${nearestStar.name})`,
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
  const destroyedStarIds = destroyedIds.filter(
    (id) => allObjects[id]?.type === CelestialType.STAR,
  );
  const destroyedPlanetIds = destroyedIds.filter(
    (id) =>
      allObjects[id]?.type === CelestialType.PLANET ||
      allObjects[id]?.type === CelestialType.GAS_GIANT,
  );

  // Handle destroyed stars first
  if (destroyedStarIds.length > 0) {
    // Check if the main star was destroyed
    const destroyedMainStar = destroyedStarIds.find((id) => {
      const star = allObjects[id];
      return star && !star.parentId && !star.currentParentId;
    });

    if (destroyedMainStar) {
      // Find new main star (most massive remaining star)
      const newMainStar = findNewMainStar(allObjects, destroyedStarIds);

      if (!newMainStar) {
        console.error(
          "[reassignOrphanedObjects] No stars remain in the system!",
        );
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
          (obj.parentId === destroyedMainStar ||
            obj.currentParentId === destroyedMainStar) &&
          obj.id !== newMainStar.id
        ) {
          updatedObjects[obj.id] = {
            ...obj,
            parentId: newMainStar.id,
            currentParentId: newMainStar.id,
          };
          console.log(
            `[reassignOrphanedObjects] Star ${obj.id} (${obj.name}) reassigned to new main star ${newMainStar.id}`,
          );
        }
      });
    }

    // Handle orphaned planets from destroyed stars
    Object.values(updatedObjects).forEach((obj) => {
      if (
        obj.status === CelestialStatus.ACTIVE &&
        (obj.type === CelestialType.PLANET ||
          obj.type === CelestialType.GAS_GIANT) &&
        obj.parentId &&
        destroyedStarIds.includes(obj.parentId)
      ) {
        // Find best gravitational parent (might not be the closest star!)
        const bestParent = findBestGravitationalParent(
          obj,
          updatedObjects,
          destroyedStarIds,
        );

        if (bestParent) {
          updatedObjects[obj.id] = {
            ...obj,
            parentId: bestParent.id,
            currentParentId: bestParent.id,
          };
          console.log(
            `[reassignOrphanedObjects] Planet ${obj.id} (${obj.name}) reassigned from destroyed star to ${bestParent.id} (${bestParent.name})`,
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
          obj.parentId === planetId,
      );

      if (orphanedMoons.length > 0) {
        const reassignedMoons = reassignOrphanedMoons(
          orphanedMoons,
          updatedObjects,
          planetId,
        );
        Object.assign(updatedObjects, reassignedMoons);
      }
    });
  }

  return updatedObjects;
}

/**
 * Determines if a moon is still gravitationally bound to its parent planet.
 * Uses the Hill sphere calculation to check if the moon is within the planet's
 * gravitational influence zone.
 * @param moon The moon object to check
 * @param parent The parent planet
 * @param starMass The mass of the primary star in kg
 * @returns true if the moon is still bound to its parent
 */
export function isMoonBoundToParent(
  moon: CelestialObject,
  parent: CelestialObject,
  starMass: number,
): boolean {
  if (!moon.physicsStateReal || !parent.physicsStateReal) return false;
  if (moon.type !== CelestialType.MOON) return false;
  if (
    parent.type !== CelestialType.PLANET &&
    parent.type !== CelestialType.GAS_GIANT
  )
    return false;

  const distance = calculateDistance(moon, parent);
  const parentMass = parent.realMass_kg || 0;

  // Calculate Hill sphere radius for the parent planet
  // r_H ≈ a * (m_planet / 3*m_star)^(1/3)
  const parentSemiMajorAxis = parent.orbit?.realSemiMajorAxis_m || 1.496e11; // Default to 1 AU if unknown
  const hillRadius =
    parentSemiMajorAxis * Math.pow(parentMass / (3 * starMass), 1 / 3);

  // Moon should be within the Hill radius to be considered potentially bound
  // We use the full Hill radius here, not a fraction, because moons can have stable orbits
  // throughout most of the Hill sphere
  if (distance > hillRadius) {
    console.log(
      `[isMoonBoundToParent] Moon ${moon.id} (${moon.name}) at ${(distance / 1.496e11).toFixed(3)} AU ` +
        `exceeds Hill radius ${(hillRadius / 1.496e11).toFixed(3)} AU from parent ${parent.id} (${parent.name})`,
    );
    return false;
  }

  // Check if the moon is in a bound orbit using energy calculation
  // Total energy = kinetic energy + potential energy
  // E = 0.5 * m * v^2 - G * M * m / r
  // If E < 0, the orbit is bound
  const vel1 = moon.physicsStateReal.velocity_mps;
  const vel2 = parent.physicsStateReal.velocity_mps;
  const relVel = Math.sqrt(
    Math.pow(vel1.x - vel2.x, 2) +
      Math.pow(vel1.y - vel2.y, 2) +
      Math.pow(vel1.z - vel2.z, 2),
  );

  const G = 6.6743e-11;
  const kineticEnergy = 0.5 * relVel * relVel; // Per unit mass
  const potentialEnergy = (-G * parentMass) / distance; // Per unit mass
  const totalEnergy = kineticEnergy + potentialEnergy;

  // If total energy is positive, the moon has escape velocity
  if (totalEnergy > 0) {
    const escapeVel = Math.sqrt((2 * G * parentMass) / distance);
    console.log(
      `[isMoonBoundToParent] Moon ${moon.id} (${moon.name}) has positive energy ` +
        `(v=${relVel.toFixed(0)} m/s > escape v=${escapeVel.toFixed(0)} m/s) from parent ${parent.id}`,
    );
    return false;
  }

  return true;
}

/**
 * Finds the nearest star to a celestial object.
 * @param object The object to find the nearest star for
 * @param allObjects All celestial objects in the system
 * @returns The nearest star, or null if no stars exist
 */
export function findNearestStar(
  object: CelestialObject,
  allObjects: Record<string, CelestialObject>,
): CelestialObject | null {
  let nearestStar: CelestialObject | null = null;
  let minDistance = Infinity;

  const stars = Object.values(allObjects).filter(
    (obj) =>
      obj.type === CelestialType.STAR && obj.status === CelestialStatus.ACTIVE,
  );

  for (const star of stars) {
    const distance = calculateDistance(object, star);
    if (distance < minDistance) {
      minDistance = distance;
      nearestStar = star;
    }
  }

  if (nearestStar) {
    console.log(
      `[findNearestStar] Nearest star to ${object.id} (${object.name}) is ` +
        `${nearestStar.id} (${nearestStar.name}) at ${(minDistance / 1.496e11).toFixed(2)} AU`,
    );
  }

  return nearestStar;
}

/**
 * Checks all moons in the system and reassigns those that have escaped their parent's
 * gravitational influence to the nearest star.
 * @param allObjects All celestial objects in the system
 * @returns Updated celestial objects map with reassigned moons
 */
export function checkAndReassignEscapedMoons(
  allObjects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  const updatedObjects = { ...allObjects };
  let reassignedCount = 0;

  // Find the primary star for Hill sphere calculations
  const primaryStar = Object.values(allObjects).find(
    (obj) =>
      obj.type === CelestialType.STAR &&
      obj.status === CelestialStatus.ACTIVE &&
      !obj.parentId &&
      !obj.currentParentId,
  );

  if (!primaryStar || !primaryStar.realMass_kg) {
    // No primary star found, can't do Hill sphere calculations
    return updatedObjects;
  }

  // Check all moons
  const moons = Object.values(allObjects).filter(
    (obj) =>
      obj.type === CelestialType.MOON && obj.status === CelestialStatus.ACTIVE,
  );

  for (const moon of moons) {
    if (!moon.parentId) continue;

    const parent = allObjects[moon.parentId];
    if (!parent || parent.status !== CelestialStatus.ACTIVE) {
      // Parent is gone, reassign to nearest star
      const nearestStar = findNearestStar(moon, allObjects);
      if (nearestStar) {
        updatedObjects[moon.id] = {
          ...moon,
          parentId: nearestStar.id,
          currentParentId: nearestStar.id,
        };
        reassignedCount++;
        console.log(
          `[checkAndReassignEscapedMoons] Moon ${moon.id} (${moon.name}) reassigned to star ` +
            `${nearestStar.id} due to missing parent`,
        );
      }
      continue;
    }

    // Check if moon is still bound to its parent
    // Pass allObjects to isMoonBoundToParent for star distance checks
    if (
      !isMoonBoundToParentWithContext(
        moon,
        parent,
        primaryStar.realMass_kg,
        allObjects,
      )
    ) {
      // Moon has escaped, but let's double-check if it's really far away
      const distance = calculateDistance(moon, parent);
      const parentSemiMajorAxis = parent.orbit?.realSemiMajorAxis_m || 1.496e11;
      const hillRadius =
        parentSemiMajorAxis *
        Math.pow(parent.realMass_kg! / (3 * primaryStar.realMass_kg), 1 / 3);

      // Only reassign if the moon is significantly outside the Hill sphere (e.g., 2x)
      if (distance > 2 * hillRadius) {
        const nearestStar = findNearestStar(moon, allObjects);
        if (nearestStar) {
          updatedObjects[moon.id] = {
            ...moon,
            parentId: nearestStar.id,
            currentParentId: nearestStar.id,
          };
          reassignedCount++;
          console.log(
            `[checkAndReassignEscapedMoons] Moon ${moon.id} (${moon.name}) escaped from ` +
              `${parent.id} (${parent.name}) and reassigned to star ${nearestStar.id} ` +
              `(distance=${(distance / 1.496e11).toFixed(2)} AU, 2x Hill radius=${((2 * hillRadius) / 1.496e11).toFixed(2)} AU)`,
          );
        }
      }
    }
  }

  if (reassignedCount > 0) {
    console.log(
      `[checkAndReassignEscapedMoons] Reassigned ${reassignedCount} escaped moons`,
    );
  }

  return updatedObjects;
}

/**
 * Version of isMoonBoundToParent that accepts allObjects for star distance calculations
 */
function isMoonBoundToParentWithContext(
  moon: CelestialObject,
  parent: CelestialObject,
  starMass: number,
  allObjects: Record<string, CelestialObject>,
): boolean {
  if (!moon.physicsStateReal || !parent.physicsStateReal) return false;
  if (moon.type !== CelestialType.MOON) return false;
  if (
    parent.type !== CelestialType.PLANET &&
    parent.type !== CelestialType.GAS_GIANT
  )
    return false;

  const distance = calculateDistance(moon, parent);
  const parentMass = parent.realMass_kg || 0;

  // Calculate Hill sphere radius for the parent planet
  const parentSemiMajorAxis = parent.orbit?.realSemiMajorAxis_m || 1.496e11;
  const hillRadius =
    parentSemiMajorAxis * Math.pow(parentMass / (3 * starMass), 1 / 3);

  // Moon should be within the Hill radius
  if (distance > hillRadius) {
    return false;
  }

  // Check if the moon is in a bound orbit using energy calculation
  const vel1 = moon.physicsStateReal.velocity_mps;
  const vel2 = parent.physicsStateReal.velocity_mps;
  const relVel = Math.sqrt(
    Math.pow(vel1.x - vel2.x, 2) +
      Math.pow(vel1.y - vel2.y, 2) +
      Math.pow(vel1.z - vel2.z, 2),
  );

  const G = 6.6743e-11;
  const kineticEnergy = 0.5 * relVel * relVel;
  const potentialEnergy = (-G * parentMass) / distance;
  const totalEnergy = kineticEnergy + potentialEnergy;

  // If total energy is positive, the moon has escape velocity
  if (totalEnergy > 0) {
    return false;
  }

  // Additional check: compare gravitational influences
  const parentAccel = (G * parentMass) / (distance * distance);

  // Find the nearest star
  const stars = Object.values(allObjects).filter(
    (obj) =>
      obj.type === CelestialType.STAR && obj.status === CelestialStatus.ACTIVE,
  );

  if (stars.length > 0) {
    let minStarInfluence = Infinity;

    for (const star of stars) {
      if (star.physicsStateReal && star.realMass_kg) {
        const starDistance = calculateDistance(moon, star);
        const starAccel =
          (G * star.realMass_kg) / (starDistance * starDistance);
        minStarInfluence = Math.min(minStarInfluence, starAccel);
      }
    }

    // If any star's gravitational influence is more than 3x the planet's influence,
    // the moon is likely being pulled away
    if (minStarInfluence > 3 * parentAccel) {
      return false;
    }
  }

  return true;
}

/**
 * Checks all planets and gas giants in the system and reassigns them to the star
 * with the strongest gravitational influence on them.
 * This handles cases where planets might be orbiting the wrong star in multi-star systems.
 * @param allObjects All celestial objects in the system
 * @returns Updated celestial objects map with reassigned planets
 */
export function checkAndReassignPlanetsToProperStars(
  allObjects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  const updatedObjects = { ...allObjects };
  let reassignedCount = 0;

  // Get all active stars
  const activeStars = Object.values(allObjects).filter(
    (obj) =>
      obj.type === CelestialType.STAR && obj.status === CelestialStatus.ACTIVE,
  );

  if (activeStars.length <= 1) {
    // Single star or no stars - nothing to reassign
    return updatedObjects;
  }

  // Check all planets and gas giants
  const planets = Object.values(allObjects).filter(
    (obj) =>
      (obj.type === CelestialType.PLANET ||
        obj.type === CelestialType.GAS_GIANT) &&
      obj.status === CelestialStatus.ACTIVE,
  );

  for (const planet of planets) {
    if (!planet.physicsStateReal || !planet.parentId) continue;

    // Find which star has the strongest gravitational influence
    let bestStar: CelestialObject | null = null;
    let maxInfluence = 0;

    for (const star of activeStars) {
      if (!star.physicsStateReal) continue;

      const influence = calculateGravitationalInfluence(star, planet);
      if (influence > maxInfluence) {
        maxInfluence = influence;
        bestStar = star;
      }
    }

    // Check if the planet should be reassigned
    if (
      bestStar &&
      bestStar.id !== planet.parentId &&
      bestStar.id !== planet.currentParentId
    ) {
      const currentParent = allObjects[planet.parentId];

      // Only reassign if the new star has significantly more influence (at least 1.5x)
      if (currentParent && currentParent.physicsStateReal) {
        const currentInfluence = calculateGravitationalInfluence(
          currentParent,
          planet,
        );

        if (maxInfluence > currentInfluence * 1.5) {
          const oldDistance =
            calculateDistance(planet, currentParent) / 1.496e11;
          const newDistance = calculateDistance(planet, bestStar) / 1.496e11;

          updatedObjects[planet.id] = {
            ...planet,
            parentId: bestStar.id,
            currentParentId: bestStar.id,
          };
          reassignedCount++;

          console.log(
            `[checkAndReassignPlanetsToProperStars] Planet ${planet.name} reassigned from ` +
              `${currentParent.name} (${oldDistance.toFixed(2)} AU, influence=${currentInfluence.toExponential(2)}) to ` +
              `${bestStar.name} (${newDistance.toFixed(2)} AU, influence=${maxInfluence.toExponential(2)})`,
          );
        }
      }
    }
  }

  if (reassignedCount > 0) {
    console.log(
      `[checkAndReassignPlanetsToProperStars] Reassigned ${reassignedCount} planets to proper stars`,
    );
  }

  return updatedObjects;
}
