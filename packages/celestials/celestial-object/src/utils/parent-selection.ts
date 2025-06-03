import { CelestialObject } from "../celestial-object";
import { CelestialStatus, CelestialTypes, PhysicsEngineType } from "../types";
import {
  calculateDistance,
  calculateGravitationalInfluence,
  AU,
} from "@teskooano/core-physics";

/**
 * Finds the nearest active star to the given object (straight-line distance).
 */
export function findNearestStar(
  object: CelestialObject,
  allObjects: Record<string, CelestialObject>,
): CelestialObject | null {
  let nearest: CelestialObject | null = null;
  let minDist = Infinity;

  // Ensure the primary object has physics state for distance calculation
  if (!object.physicsState?.position_m) return null;

  for (const cand of Object.values(allObjects)) {
    if (
      cand.type !== CelestialTypes.STAR ||
      cand.status !== CelestialStatus.ACTIVE ||
      !cand.physicsState?.position_m // Ensure candidate star also has physics state for distance
    ) {
      continue;
    }

    // Pass new CelestialObject directly
    const d = calculateDistance(object, cand);
    if (d < minDist) {
      minDist = d;
      nearest = cand;
    }
  }
  return nearest;
}

/**
 * Chooses the best gravitational parent for `targetObject` from the provided map.
 */
export function findBestGravitationalParent(
  targetObject: CelestialObject,
  allObjects: Record<string, CelestialObject>,
  physicsEngine: PhysicsEngineType,
  excludeIds: string[] = [],
): CelestialObject | null {
  if (physicsEngine !== "verlet" && physicsEngine !== "symplectic") {
    if (targetObject.parent) {
      const currentParent = targetObject.parent;
      if (
        currentParent &&
        currentParent.status === CelestialStatus.ACTIVE &&
        !excludeIds.includes(currentParent.id)
      ) {
        return currentParent;
      }
    }
    return null;
  }

  let best: CelestialObject | null = null;
  let maxInfluence = 0;

  // Ensure target object has necessary physics data for calculations and filtering
  if (
    !targetObject.physicsState?.position_m ||
    targetObject.physicsState.mass_kg === undefined
  )
    return null;

  const candidates = Object.values(allObjects).filter((obj) => {
    if (obj.id === targetObject.id) return false;
    if (excludeIds.includes(obj.id)) return false;
    if (obj.status !== CelestialStatus.ACTIVE) return false;
    // Ensure candidate has a complete physics state for calculations and filtering
    if (
      !(
        obj.physicsState?.position_m &&
        obj.physicsState.velocity_mps &&
        obj.physicsState.mass_kg !== undefined
      )
    )
      return false;

    if (obj.type === CelestialTypes.STAR) return true;

    if (
      targetObject.type === CelestialTypes.MOON ||
      targetObject.type === CelestialTypes.ASTEROID_FIELD
    ) {
      if (obj.type === CelestialTypes.GAS_GIANT) return true;
      if (
        obj.type === CelestialTypes.PLANET &&
        obj.physicsState.mass_kg > targetObject.physicsState.mass_kg // Both guaranteed non-null by checks above
      )
        return true;
    }
    return false;
  });

  if (
    targetObject.type === CelestialTypes.PLANET ||
    targetObject.type === CelestialTypes.GAS_GIANT
  ) {
    const stars = candidates.filter((c) => c.type === CelestialTypes.STAR);
    for (const star of stars) {
      // star.physicsState and targetObject.physicsState are guaranteed by prior checks
      // Pass new CelestialObject directly
      const inf = calculateGravitationalInfluence(star, targetObject);
      if (inf > maxInfluence) {
        maxInfluence = inf;
        best = star;
      }
    }
    return best;
  }

  for (const candidate of candidates) {
    // candidate.physicsState and targetObject.physicsState are guaranteed non-null by prior checks
    // Pass new CelestialObject directly
    const dist = calculateDistance(targetObject, candidate);
    const distAU = dist / AU;
    // Pass new CelestialObject directly
    let influence = calculateGravitationalInfluence(candidate, targetObject);

    if (candidate.type !== CelestialTypes.STAR && distAU > 0.1) {
      influence *= Math.exp(-distAU * 10);
    }

    if (influence > maxInfluence) {
      maxInfluence = influence;
      best = candidate;
    }
  }
  return best;
}

/**
 * When the current main star bites the dust, the most massive remaining star becomes the new anchor.
 */
export function findNewMainStar(
  allObjects: Record<string, CelestialObject>,
  physicsEngine: PhysicsEngineType,
  excludeStarIds: string[] = [],
): CelestialObject | null {
  if (physicsEngine !== "verlet" && physicsEngine !== "symplectic") {
    return null;
  }

  const remainingStars = Object.values(allObjects).filter(
    (obj) =>
      obj.type === CelestialTypes.STAR &&
      obj.status === CelestialStatus.ACTIVE &&
      !excludeStarIds.includes(obj.id) &&
      obj.physicsState &&
      obj.physicsState.mass_kg !== undefined, // Ensure mass is present for sorting
  );

  if (remainingStars.length === 0) return null;

  remainingStars.sort(
    (a, b) => (b.physicsState!.mass_kg ?? 0) - (a.physicsState!.mass_kg ?? 0),
  );

  const newMainStar = remainingStars[0];
  return newMainStar;
}
