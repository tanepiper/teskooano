import type { CelestialObject, StarProperties } from "@teskooano/data-types";
import { CelestialType, CelestialStatus } from "@teskooano/data-types";

/**
 * Validates and corrects the star hierarchy in a generated system.
 * Ensures the main star is the most massive and all objects are correctly parented.
 * @param objects Array of all celestial objects in the system
 * @returns Corrected array of celestial objects
 */
export function validateAndCorrectHierarchy(
  objects: CelestialObject[]
): CelestialObject[] {
  console.log("[validateAndCorrectHierarchy] Starting system hierarchy validation...");
  
  // Deep clone objects to avoid mutations
  const correctedObjects = objects.map(obj => ({ ...obj }));
  
  // Step 1: Find all stars and validate main star
  const stars = correctedObjects.filter(obj => obj.type === CelestialType.STAR);
  
  if (stars.length === 0) {
    console.error("[validateAndCorrectHierarchy] No stars found in system!");
    return correctedObjects;
  }
  
  // Sort stars by mass (descending)
  stars.sort((a, b) => (b.realMass_kg || 0) - (a.realMass_kg || 0));
  
  // The most massive star should be the main star
  const mostMassiveStar = stars[0];
  const currentMainStar = stars.find(star => 
    (star.properties as StarProperties)?.isMainStar === true
  );
  
  // Check if correction is needed
  if (!currentMainStar || currentMainStar.id !== mostMassiveStar.id) {
    console.log(
      `[validateAndCorrectHierarchy] Correcting main star: ${currentMainStar?.name || 'none'} (${currentMainStar?.realMass_kg?.toExponential(2) || 0} kg) -> ${mostMassiveStar.name} (${mostMassiveStar.realMass_kg.toExponential(2)} kg)`
    );
    
    // Clear current main star flag
    if (currentMainStar && currentMainStar.properties) {
      (currentMainStar.properties as StarProperties).isMainStar = false;
    }
    
    // Set new main star
    if (mostMassiveStar.properties) {
      (mostMassiveStar.properties as StarProperties).isMainStar = true;
    }
    
    // Clear parent references for the main star
    mostMassiveStar.parentId = undefined;
    mostMassiveStar.currentParentId = undefined;
    
    // Update other stars to be children of the main star
    stars.forEach(star => {
      if (star.id !== mostMassiveStar.id) {
        star.parentId = mostMassiveStar.id;
        star.currentParentId = mostMassiveStar.id;
        
        // Update partner stars arrays
        if (star.properties) {
          const props = star.properties as StarProperties;
          props.partnerStars = [mostMassiveStar.id];
        }
      }
    });
    
    // Update main star's partner stars
    if (mostMassiveStar.properties) {
      const mainProps = mostMassiveStar.properties as StarProperties;
      mainProps.partnerStars = stars
        .filter(s => s.id !== mostMassiveStar.id)
        .map(s => s.id);
    }
  }
  
  // Step 2: Validate orbital hierarchies
  const nonStarObjects = correctedObjects.filter(obj => obj.type !== CelestialType.STAR);
  
  for (const obj of nonStarObjects) {
    if (!obj.parentId) {
      console.warn(
        `[validateAndCorrectHierarchy] Object ${obj.name} (${obj.type}) has no parent! Assigning to nearest gravitational parent.`
      );
      
      // Find the best gravitational parent
      const bestParent = findBestGravitationalParent(obj, correctedObjects);
      if (bestParent) {
        obj.parentId = bestParent.id;
        obj.currentParentId = bestParent.id;
        console.log(
          `[validateAndCorrectHierarchy] Assigned ${obj.name} to parent ${bestParent.name}`
        );
      }
    } else {
      // Verify parent exists and is active
      const parent = correctedObjects.find(p => p.id === obj.parentId);
      if (!parent) {
        console.error(
          `[validateAndCorrectHierarchy] Parent ${obj.parentId} not found for ${obj.name}!`
        );
        // Find new parent
        const bestParent = findBestGravitationalParent(obj, correctedObjects);
        if (bestParent) {
          obj.parentId = bestParent.id;
          obj.currentParentId = bestParent.id;
        }
      }
    }
  }
  
  // Step 3: Special validation for moons
  const moons = correctedObjects.filter(obj => obj.type === CelestialType.MOON);
  for (const moon of moons) {
    const parent = correctedObjects.find(p => p.id === moon.parentId);
    if (parent && parent.type === CelestialType.STAR) {
      console.warn(
        `[validateAndCorrectHierarchy] Moon ${moon.name} incorrectly parented to star ${parent.name}!`
      );
      // Find nearest planet or gas giant
      const planets = correctedObjects.filter(obj => 
        obj.type === CelestialType.PLANET || obj.type === CelestialType.GAS_GIANT
      );
      
      if (planets.length > 0) {
        const nearestPlanet = findNearestObject(moon, planets);
        if (nearestPlanet) {
          moon.parentId = nearestPlanet.id;
          moon.currentParentId = nearestPlanet.id;
          console.log(
            `[validateAndCorrectHierarchy] Re-parented moon ${moon.name} to planet ${nearestPlanet.name}`
          );
        }
      }
    }
  }
  
  // Step 4: Log final hierarchy summary
  console.log("[validateAndCorrectHierarchy] Final hierarchy summary:");
  const mainStar = correctedObjects.find(obj => 
    obj.type === CelestialType.STAR && 
    (obj.properties as StarProperties)?.isMainStar === true
  );
  
  if (mainStar) {
    console.log(`  Main Star: ${mainStar.name} (${mainStar.realMass_kg.toExponential(2)} kg)`);
    
    // Log companion stars
    const companions = correctedObjects.filter(obj => 
      obj.type === CelestialType.STAR && 
      obj.parentId === mainStar.id
    );
    companions.forEach(star => {
      console.log(`    Companion Star: ${star.name} (${star.realMass_kg.toExponential(2)} kg)`);
    });
    
    // Log planets per star
    stars.forEach(star => {
      const starPlanets = correctedObjects.filter(obj => 
        (obj.type === CelestialType.PLANET || obj.type === CelestialType.GAS_GIANT) &&
        obj.parentId === star.id
      );
      if (starPlanets.length > 0) {
        console.log(`  ${star.name} has ${starPlanets.length} planets`);
      }
    });
  }
  
  return correctedObjects;
}

/**
 * Finds the best gravitational parent for an object based on mass and distance.
 * @param obj The object needing a parent
 * @param allObjects All objects in the system
 * @returns The best parent object, or null if none found
 */
function findBestGravitationalParent(
  obj: CelestialObject,
  allObjects: CelestialObject[]
): CelestialObject | null {
  let bestParent: CelestialObject | null = null;
  let maxInfluence = 0;
  
  const potentialParents = allObjects.filter(parent => {
    if (parent.id === obj.id) return false;
    if (parent.status !== CelestialStatus.ACTIVE) return false;
    
    // Stars can parent planets and gas giants
    if (parent.type === CelestialType.STAR) {
      return obj.type === CelestialType.PLANET || 
             obj.type === CelestialType.GAS_GIANT ||
             obj.type === CelestialType.ASTEROID_FIELD;
    }
    
    // Planets and gas giants can parent moons
    if (parent.type === CelestialType.PLANET || parent.type === CelestialType.GAS_GIANT) {
      return obj.type === CelestialType.MOON;
    }
    
    return false;
  });
  
  for (const parent of potentialParents) {
    const influence = calculateGravitationalInfluence(parent, obj);
    if (influence > maxInfluence) {
      maxInfluence = influence;
      bestParent = parent;
    }
  }
  
  return bestParent;
}

/**
 * Finds the nearest object to a target from a list of candidates.
 * @param target The target object
 * @param candidates List of candidate objects
 * @returns The nearest object, or null if none found
 */
function findNearestObject(
  target: CelestialObject,
  candidates: CelestialObject[]
): CelestialObject | null {
  let nearest: CelestialObject | null = null;
  let minDistance = Infinity;
  
  for (const candidate of candidates) {
    const distance = calculateDistance(target, candidate);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = candidate;
    }
  }
  
  return nearest;
}

/**
 * Calculates the distance between two objects.
 * @param obj1 First object
 * @param obj2 Second object
 * @returns Distance in meters
 */
function calculateDistance(
  obj1: CelestialObject,
  obj2: CelestialObject
): number {
  if (!obj1.physicsStateReal || !obj2.physicsStateReal) {
    // Fallback to orbital distance if physics state not available
    const dist1 = obj1.orbit?.realSemiMajorAxis_m || 0;
    const dist2 = obj2.orbit?.realSemiMajorAxis_m || 0;
    return Math.abs(dist1 - dist2);
  }
  
  const pos1 = obj1.physicsStateReal.position_m;
  const pos2 = obj2.physicsStateReal.position_m;
  
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates gravitational influence score.
 * @param influencer The object exerting influence
 * @param target The target object
 * @returns Influence score (mass / distance²)
 */
function calculateGravitationalInfluence(
  influencer: CelestialObject,
  target: CelestialObject
): number {
  const distance = calculateDistance(influencer, target);
  if (distance === 0) return 0;
  
  const mass = influencer.realMass_kg || 0;
  const distanceAU = distance / 1.496e11; // Convert to AU
  
  return mass / (distanceAU * distanceAU);
} 