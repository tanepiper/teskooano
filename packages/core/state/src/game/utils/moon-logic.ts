import type { CelestialObject } from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import {
  AU,
  GRAVITATIONAL_CONSTANT,
  calculateDistance,
  calculateEscapeVelocity,
  calculateHillRadius,
  calculateRelativeVelocity,
  canCapture,
} from "@teskooano/core-physics";
import { findNearestStar } from "./parent-selection";

/**
 * Re-evaluate whether a moon is still bound to its parent planet using Hill-sphere + energy checks.
 */
export function isMoonBoundToParent(
  moon: CelestialObject,
  parent: CelestialObject,
  starMassKg: number,
): boolean {
  if (!moon.physicsStateReal || !parent.physicsStateReal) return false;
  if (moon.type !== CelestialType.MOON) return false;
  if (
    parent.type !== CelestialType.PLANET &&
    parent.type !== CelestialType.GAS_GIANT
  )
    return false;

  const distance = calculateDistance(moon, parent);
  const parentMass = parent.realMass_kg ?? 0;

  const semiMajor = parent.orbit?.realSemiMajorAxis_m ?? AU;
  const hill = calculateHillRadius(parentMass, semiMajor, starMassKg);
  if (distance > hill) return false;

  const relVel = calculateRelativeVelocity(
    moon.physicsStateReal.velocity_mps,
    parent.physicsStateReal.velocity_mps,
  );
  const totalEnergy =
    0.5 * relVel * relVel + (-GRAVITATIONAL_CONSTANT * parentMass) / distance;
  if (totalEnergy > 0) return false; // moon has escape energy.

  return true;
}

/**
 * Internal helper that also checks nearby star influences – used by escaped-moon pass.
 */
function isMoonBoundToParentWithContext(
  moon: CelestialObject,
  parent: CelestialObject,
  starMassKg: number,
  allObjects: Record<string, CelestialObject>,
): boolean {
  if (!isMoonBoundToParent(moon, parent, starMassKg)) return false;

  // Additional tug-of-war check – if a star is pulling >3× harder, assume capture by star.
  const distance = calculateDistance(moon, parent);
  const parentAccel =
    (GRAVITATIONAL_CONSTANT * (parent.realMass_kg ?? 0)) /
    (distance * distance);

  let maxStarAccel = 0;
  for (const obj of Object.values(allObjects)) {
    if (
      obj.type !== CelestialType.STAR ||
      obj.status !== CelestialStatus.ACTIVE
    )
      continue;
    if (!obj.physicsStateReal || !obj.realMass_kg) continue;

    const d = calculateDistance(moon, obj);
    const a = (GRAVITATIONAL_CONSTANT * obj.realMass_kg) / (d * d);
    if (a > maxStarAccel) maxStarAccel = a;
  }

  return maxStarAccel <= 3 * parentAccel;
}

/**
 * When a planet is destroyed, its moons need somewhere to go.
 * We try to bind them to the biggest surviving moon or punt them to the nearest star.
 */
export function reassignOrphanedMoons(
  moons: CelestialObject[],
  allObjects: Record<string, CelestialObject>,
  _destroyedPlanetId: string,
): Record<string, CelestialObject> {
  const updated: Record<string, CelestialObject> = {};
  const sorted = [...moons].sort(
    (a, b) => (b.realMass_kg ?? 0) - (a.realMass_kg ?? 0),
  );

  if (sorted.length > 1) {
    const largest = sorted[0];
    const primaryMass =
      Object.values(allObjects).find(
        (o) =>
          o.type === CelestialType.STAR && o.status === CelestialStatus.ACTIVE,
      )?.realMass_kg ?? 1e30;

    // Try to capture the smaller moons.
    for (let i = 1; i < sorted.length; i++) {
      const m = sorted[i];
      if (canCapture(largest, m, primaryMass)) {
        updated[m.id] = {
          ...m,
          parentId: largest.id,
          currentParentId: largest.id,
        };
      }
    }

    // Largest moon itself now orbits nearest star.
    const star = findNearestStar(largest, allObjects);
    if (star) {
      updated[largest.id] = {
        ...largest,
        parentId: star.id,
        currentParentId: star.id,
      };
    }

    // Any stragglers also punted to nearest star.
    for (const m of sorted) {
      if (updated[m.id]) continue;
      const s = findNearestStar(m, allObjects);
      if (s) updated[m.id] = { ...m, parentId: s.id, currentParentId: s.id };
    }
  } else if (sorted.length === 1) {
    const moon = sorted[0];
    const star = findNearestStar(moon, allObjects);
    if (star)
      updated[moon.id] = {
        ...moon,
        parentId: star.id,
        currentParentId: star.id,
      };
  }

  return updated;
}

/**
 * Pass over all moons and kick escaped ones to their nearest star.
 */
export function checkAndReassignEscapedMoons(
  allObjects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  const updated = { ...allObjects };

  const primaryStar = Object.values(allObjects).find(
    (o) =>
      o.type === CelestialType.STAR &&
      o.status === CelestialStatus.ACTIVE &&
      !o.parentId &&
      !o.currentParentId,
  );
  if (!primaryStar || !primaryStar.realMass_kg) return updated;

  const moons = Object.values(allObjects).filter(
    (o) => o.type === CelestialType.MOON && o.status === CelestialStatus.ACTIVE,
  );

  for (const moon of moons) {
    if (!moon.parentId) continue;
    const parent = allObjects[moon.parentId];
    if (!parent || parent.status !== CelestialStatus.ACTIVE) {
      const star = findNearestStar(moon, allObjects);
      if (star)
        updated[moon.id] = {
          ...moon,
          parentId: star.id,
          currentParentId: star.id,
        };
      continue;
    }

    if (
      !isMoonBoundToParentWithContext(
        moon,
        parent,
        primaryStar.realMass_kg,
        allObjects,
      )
    ) {
      const semiMajor = parent.orbit?.realSemiMajorAxis_m ?? AU;
      const hill = calculateHillRadius(
        parent.realMass_kg!,
        semiMajor,
        primaryStar.realMass_kg,
      );
      const dist = calculateDistance(moon, parent);
      if (dist > 2 * hill) {
        const star = findNearestStar(moon, allObjects);
        if (star)
          updated[moon.id] = {
            ...moon,
            parentId: star.id,
            currentParentId: star.id,
          };
      }
    }
  }

  return updated;
}
