import type { CelestialObject } from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";

import { calculateGravitationalInfluence } from "@teskooano/core-physics";
import {
  findNewMainStar,
  findBestGravitationalParent,
} from "./parent-selection";
import { reassignOrphanedMoons } from "./moon-logic";

/**
 * Main entry – handle orphaning when bodies are destroyed.
 */
export function reassignOrphanedObjects(
  destroyedIds: string[],
  allObjects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  if (destroyedIds.length === 0) return allObjects;

  const updated = { ...allObjects };
  const destroyedStarIds = destroyedIds.filter(
    (id) => allObjects[id]?.type === CelestialType.STAR,
  );
  const destroyedPlanetIds = destroyedIds.filter((id) => {
    const t = allObjects[id]?.type;
    return t === CelestialType.PLANET || t === CelestialType.GAS_GIANT;
  });

  // --- STARS -----------------------------------------------------------------
  if (destroyedStarIds.length) {
    const destroyedMain = destroyedStarIds.find((id) => {
      const s = allObjects[id];
      return s && !s.parentId && !s.currentParentId;
    });

    if (destroyedMain) {
      const newMain = findNewMainStar(allObjects, destroyedStarIds);
      if (!newMain) {
        console.error("[parent-reassignment] No stars remain in the system!");
        return updated;
      }

      updated[newMain.id] = {
        ...newMain,
        parentId: undefined,
        currentParentId: undefined,
      };
      if (updated[newMain.id].properties) {
        (updated[newMain.id].properties as any).isMainStar = true;
      }

      // Re-parent any remaining stars that orbited the old main.
      for (const obj of Object.values(updated)) {
        if (
          obj.type === CelestialType.STAR &&
          obj.status === CelestialStatus.ACTIVE &&
          (obj.parentId === destroyedMain ||
            obj.currentParentId === destroyedMain) &&
          obj.id !== newMain.id
        ) {
          updated[obj.id] = {
            ...obj,
            parentId: newMain.id,
            currentParentId: newMain.id,
          };
        }
      }
    }

    // Re-parent planets that orbited a now-dead star.
    for (const obj of Object.values(updated)) {
      if (
        obj.status === CelestialStatus.ACTIVE &&
        (obj.type === CelestialType.PLANET ||
          obj.type === CelestialType.GAS_GIANT) &&
        obj.parentId &&
        destroyedStarIds.includes(obj.parentId)
      ) {
        const best = findBestGravitationalParent(
          obj,
          updated,
          destroyedStarIds,
        );
        if (best)
          updated[obj.id] = {
            ...obj,
            parentId: best.id,
            currentParentId: best.id,
          };
      }
    }
  }

  // --- PLANETS (moon handling) ----------------------------------------------
  for (const planetId of destroyedPlanetIds) {
    const moons = Object.values(updated).filter(
      (o) =>
        o.type === CelestialType.MOON &&
        o.status === CelestialStatus.ACTIVE &&
        o.parentId === planetId,
    );
    if (moons.length) {
      Object.assign(updated, reassignOrphanedMoons(moons, updated, planetId));
    }
  }

  return updated;
}

/**
 * In multi-star systems make sure each planet/gas-giant is orbiting the star that has
 * the strongest pull on it (with a 1.5× safety margin).
 */
export function checkAndReassignPlanetsToProperStars(
  allObjects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  const updated = { ...allObjects };
  const stars = Object.values(allObjects).filter(
    (o) => o.type === CelestialType.STAR && o.status === CelestialStatus.ACTIVE,
  );
  if (stars.length <= 1) return updated; // nothing to do in a single-star system.

  const planets = Object.values(allObjects).filter(
    (o) =>
      (o.type === CelestialType.PLANET || o.type === CelestialType.GAS_GIANT) &&
      o.status === CelestialStatus.ACTIVE,
  );

  for (const planet of planets) {
    if (!planet.physicsStateReal || !planet.parentId) continue;

    let best: CelestialObject | null = null;
    let maxInf = 0;
    for (const star of stars) {
      if (!star.physicsStateReal) continue;
      const inf = calculateGravitationalInfluence(star, planet);
      if (inf > maxInf) {
        maxInf = inf;
        best = star;
      }
    }

    if (
      best &&
      best.id !== planet.parentId &&
      best.id !== planet.currentParentId
    ) {
      const currentParent = allObjects[planet.parentId];
      if (currentParent && currentParent.physicsStateReal) {
        const currentInf = calculateGravitationalInfluence(
          currentParent,
          planet,
        );
        if (maxInf > currentInf * 1.5) {
          updated[planet.id] = {
            ...planet,
            parentId: best.id,
            currentParentId: best.id,
          };
        }
      }
    }
  }

  return updated;
}

// ---------------------------------------------------------------------------
// Barrel exports – keeps legacy import paths alive while letting callers pick
// newer granular modules if they want.
// ---------------------------------------------------------------------------
export * from "./parent-selection";
export * from "./moon-logic";
