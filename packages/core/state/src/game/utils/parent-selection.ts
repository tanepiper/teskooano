import type { CelestialObject } from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  type PhysicsEngineType,
} from "@teskooano/data-types";
import {
  calculateDistance,
  calculateGravitationalInfluence,
  AU,
} from "@teskooano/core-physics";
import { simulationStateService } from "../simulation";

/**
 * Finds the nearest active star to the given object (straight-line distance).
 */
export function findNearestStar(
  object: CelestialObject,
  allObjects: Record<string, CelestialObject>,
): CelestialObject | null {
  let nearest: CelestialObject | null = null;
  let minDist = Infinity;

  for (const obj of Object.values(allObjects)) {
    if (
      obj.type !== CelestialType.STAR ||
      obj.status !== CelestialStatus.ACTIVE
    )
      continue;
    const d = calculateDistance(object, obj);
    if (d < minDist) {
      minDist = d;
      nearest = obj;
    }
  }
  return nearest;
}

/**
 * Chooses the best gravitational parent for `targetObject` from the provided map.
 * See inline comments for the rule-set – essentially: stars win, massive planets can grab moons, etc.
 */
export function findBestGravitationalParent(
  targetObject: CelestialObject,
  allObjects: Record<string, CelestialObject>,
  excludeIds: string[] = [],
): CelestialObject | null {
  const currentPhysicsEngine: PhysicsEngineType =
    simulationStateService.getCurrentState().physicsEngine;
  if (
    currentPhysicsEngine !== "verlet" &&
    currentPhysicsEngine !== "symplectic"
  ) {
    // In ideal modes, if the object has a valid current parent, stick with it.
    if (targetObject.parentId) {
      const currentParent = allObjects[targetObject.parentId];
      if (
        currentParent &&
        currentParent.status === CelestialStatus.ACTIVE &&
        !excludeIds.includes(currentParent.id)
      ) {
        return currentParent;
      }
    }
    return null; // Otherwise, no change or no clear parent in ideal mode.
  }

  let best: CelestialObject | null = null;
  let maxInfluence = 0;

  const candidates = Object.values(allObjects).filter((obj) => {
    if (obj.id === targetObject.id) return false;
    if (excludeIds.includes(obj.id)) return false;
    if (obj.status !== CelestialStatus.ACTIVE) return false;
    if (!obj.physicsStateReal) return false;

    // Stars can parent anything.
    if (obj.type === CelestialType.STAR) return true;

    // Moons / asteroid-fields can be captured by big planets / gas-giants.
    if (
      targetObject.type === CelestialType.MOON ||
      targetObject.type === CelestialType.ASTEROID_FIELD
    ) {
      if (obj.type === CelestialType.GAS_GIANT) return true;
      if (
        obj.type === CelestialType.PLANET &&
        (obj.realMass_kg ?? 0) > (targetObject.realMass_kg ?? 0)
      )
        return true;
    }

    return false;
  });

  if (
    targetObject.type === CelestialType.PLANET ||
    targetObject.type === CelestialType.GAS_GIANT
  ) {
    // For planets choose among stars only.
    const stars = candidates.filter((c) => c.type === CelestialType.STAR);
    for (const star of stars) {
      const inf = calculateGravitationalInfluence(star, targetObject);
      if (inf > maxInfluence) {
        maxInfluence = inf;
        best = star;
      }
    }
    return best;
  }

  // For moons etc – mix of stars and planets with distance decay for planets.
  for (const candidate of candidates) {
    const dist = calculateDistance(targetObject, candidate);
    const distAU = dist / AU;
    let influence = calculateGravitationalInfluence(candidate, targetObject);

    if (candidate.type !== CelestialType.STAR && distAU > 0.1) {
      influence *= Math.exp(-distAU * 10); // steep fall-off for far planets.
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
  excludeStarIds: string[] = [],
): CelestialObject | null {
  const currentPhysicsEngine: PhysicsEngineType =
    simulationStateService.getCurrentState().physicsEngine;
  if (
    currentPhysicsEngine !== "verlet" &&
    currentPhysicsEngine !== "symplectic"
  ) {
    // Don't select a *new* main star if not in N-body mode.
    // If a current main star exists (no parentId) and isn't excluded, it remains main implicitly.
    // This function's purpose is to find a *replacement* if the old main is gone.
    // In ideal modes, such a replacement shouldn't automatically occur via this specific logic.
    return null;
  }

  const remaining = Object.values(allObjects).filter(
    (obj) =>
      obj.type === CelestialType.STAR &&
      obj.status === CelestialStatus.ACTIVE &&
      !excludeStarIds.includes(obj.id),
  );

  if (remaining.length === 0) return null;

  remaining.sort((a, b) => (b.realMass_kg ?? 0) - (a.realMass_kg ?? 0));
  return remaining[0];
}
