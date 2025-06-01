import { CelestialType } from "@teskooano/data-types";
import { PhysicsStateReal } from "../types";
import { detectSphereCollision } from "./collision-detection";
import {
  isPlanetOrMoon,
  resolveGeneralNonStarCollision,
  resolveMoonMoonCollision,
  resolvePlanetGasGiantCollision,
  resolveStarCollision,
  resolveStarNonStarCollision,
} from "./collision-resolution";
import { DestructionEvent } from "./collision-types";

export * from "./collision-detection";
export * from "./collision-resolution";
export * from "./collision-types";

/**
 * Iterates through all pairs of bodies, detects collisions, and applies appropriate resolution.
 * Handles different scenarios using helper functions:
 * - Star vs Star / Star vs Non-Star (Absorption)
 * - Moon vs Moon (Mutual Destruction)
 * - Planet/Moon vs Gas Giant (Elastic Bounce)
 * - General Non-Star vs Non-Star (Elastic/Inelastic based on mass)
 * - Ignores collisions involving `RING_SYSTEM` objects.
 *
 * @param bodiesReal - An array of the current real-world physics states for all bodies.
 * @param radii - A Map associating body IDs with their real-world radii in meters.
 * @param isStar - A Map associating body IDs with a boolean indicating if the body is a star.
 * @param bodyTypes - A Map associating body IDs with their `CelestialType`.
 * @returns A tuple: `[finalStates, destroyedIds, destructionEvents]` where
 *          `finalStates` is the updated array of `PhysicsStateReal` objects (excluding destroyed ones),
 *          `destroyedIds` is a Set containing the IDs of bodies destroyed in this collision pass,
 *          `destructionEvents` is an array containing details about each destructive collision.
 */
export const handleCollisions = (
  bodiesReal: PhysicsStateReal[],
  radii: Map<string | number, number>,
  isStar: Map<string | number, boolean>,
  bodyTypes: Map<string | number, CelestialType>,
): [PhysicsStateReal[], Set<string | number>, DestructionEvent[]] => {
  const updatedBodiesMap = new Map<string | number, PhysicsStateReal>();
  bodiesReal.forEach((body) => updatedBodiesMap.set(body.id, { ...body }));

  const destroyedIds = new Set<string | number>();
  const destructionEvents: DestructionEvent[] = [];
  const numBodies = bodiesReal.length;

  for (let i = 0; i < numBodies; i++) {
    const id1 = bodiesReal[i].id;

    if (destroyedIds.has(id1)) continue;

    for (let j = i + 1; j < numBodies; j++) {
      const id2 = bodiesReal[j].id;

      if (destroyedIds.has(id2) || id1 === id2) continue;

      const body1 = updatedBodiesMap.get(id1);
      const body2 = updatedBodiesMap.get(id2);

      if (!body1 || !body2) continue;

      const type1 = bodyTypes.get(id1);
      const type2 = bodyTypes.get(id2);

      if (
        type1 === CelestialType.RING_SYSTEM ||
        type2 === CelestialType.RING_SYSTEM
      ) {
        continue;
      }

      const radius1 = radii.get(id1);
      const radius2 = radii.get(id2);
      const body1IsStar = isStar.get(id1) ?? false;
      const body2IsStar = isStar.get(id2) ?? false;

      if (
        radius1 === undefined ||
        radius2 === undefined ||
        type1 === undefined ||
        type2 === undefined
      ) {
        console.warn(
          `Skipping collision check between ${id1} and ${id2}: Missing radius or type information.`,
        );
        continue;
      }

      const collision = detectSphereCollision(body1, radius1, body2, radius2);

      if (collision) {
        if (body1IsStar && body2IsStar) {
          resolveStarCollision(
            id1,
            id2,
            body1,
            body2,
            updatedBodiesMap,
            destroyedIds,
            destructionEvents,
            radii,
          );
        } else if (body1IsStar) {
          resolveStarNonStarCollision(
            id1,
            id2,
            updatedBodiesMap,
            destroyedIds,
            destructionEvents,
            radii,
          );
        } else if (body2IsStar) {
          resolveStarNonStarCollision(
            id2,
            id1,
            updatedBodiesMap,
            destroyedIds,
            destructionEvents,
            radii,
          );
        } else if (
          type1 === CelestialType.MOON &&
          type2 === CelestialType.MOON
        ) {
          resolveMoonMoonCollision(
            id1,
            id2,
            body1,
            body2,
            destroyedIds,
            destructionEvents,
            radii,
          );
        } else if (
          (isPlanetOrMoon(type1) && type2 === CelestialType.GAS_GIANT) ||
          (isPlanetOrMoon(type2) && type1 === CelestialType.GAS_GIANT)
        ) {
          resolvePlanetGasGiantCollision(
            id1,
            id2,
            body1,
            body2,
            collision,
            updatedBodiesMap,
          );
        } else {
          resolveGeneralNonStarCollision(
            id1,
            id2,
            body1,
            body2,
            collision,
            updatedBodiesMap,
            destroyedIds,
            destructionEvents,
            radii,
          );
        }
      }
    }
  }

  const finalBodies = Array.from(updatedBodiesMap.values()).filter(
    (body) => !destroyedIds.has(body.id),
  );

  return [finalBodies, destroyedIds, destructionEvents];
};
