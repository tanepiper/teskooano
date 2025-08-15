import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal, CelestialType } from "@teskooano/data-types";

// Constants
const EPSILON = 1e-10;
const COLLISION_RESTITUTION = 0.8;

/**
 * Details about a collision between two bodies.
 */
export interface Collision {
  body1Id: string | number;
  body2Id: string | number;
  point: OSVector3;
  normal: OSVector3;
  penetrationDepth: number;
  relativeVelocity: OSVector3;
  time?: number;
}

/**
 * Detects collision between two spheres based on their positions and radii.
 * Assumes instantaneous detection (does not calculate time of impact).
 */
export function detectSphereCollision(
  body1: PhysicsStateReal,
  radius1: number,
  body2: PhysicsStateReal,
  radius2: number,
): Collision | null {
  const displacement = new OSVector3()
    .copy(body1.position_m)
    .sub(body2.position_m);
  const distanceSq = displacement.lengthSq();
  const sumRadii = radius1 + radius2;
  const sumRadiiSq = sumRadii * sumRadii;

  if (distanceSq < sumRadiiSq) {
    const distance = Math.sqrt(distanceSq);
    const penetrationDepth = sumRadii - distance;

    const normal =
      distance > EPSILON
        ? displacement.clone().multiplyScalar(1 / distance)
        : new OSVector3(1, 0, 0);

    const point = body2.position_m
      .clone()
      .add(normal.clone().multiplyScalar(radius2));

    const relativeVelocity = body1.velocity_mps.clone().sub(body2.velocity_mps);

    return {
      body1Id: body1.id,
      body2Id: body2.id,
      point,
      normal,
      penetrationDepth,
      relativeVelocity,
    };
  }

  return null;
}

/**
 * Resolves a detected collision between two bodies using elastic collision.
 */
export const resolveCollision = (
  collision: Collision,
  body1Real: PhysicsStateReal,
  body2Real: PhysicsStateReal,
): [PhysicsStateReal, PhysicsStateReal] => {
  const { normal, relativeVelocity } = collision;
  const mass1 = body1Real.mass_kg;
  const mass2 = body2Real.mass_kg;

  if (mass1 <= 0 || mass2 <= 0) {
    console.warn(
      `Collision resolution skipped between ${body1Real.id} and ${body2Real.id}: Invalid mass (<= 0).`,
    );
    return [body1Real, body2Real];
  }

  const normalVelocity = relativeVelocity.dot(normal);

  if (normalVelocity > 0) {
    return [body1Real, body2Real];
  }

  const restitution = COLLISION_RESTITUTION;
  const j = (-(1 + restitution) * normalVelocity) / (1 / mass1 + 1 / mass2);
  const impulseVector = normal.clone().multiplyScalar(j);

  const newVelocity1_mps = body1Real.velocity_mps
    .clone()
    .addScaledVector(impulseVector, 1 / mass1);

  const newVelocity2_mps = body2Real.velocity_mps
    .clone()
    .subScaledVector(impulseVector, 1 / mass2);

  const newBody1: PhysicsStateReal = {
    ...body1Real,
    velocity_mps: newVelocity1_mps,
  };

  const newBody2: PhysicsStateReal = {
    ...body2Real,
    velocity_mps: newVelocity2_mps,
  };

  return [newBody1, newBody2];
};

/**
 * Simple collision resolution based on physics rules:
 * - If it's not a star and it hits a star, it's destroyed
 * - If it's two stars, the smaller star is destroyed
 * - If it's two planets, the larger planet wins
 */
const resolveSimpleCollision = (
  id1: string,
  id2: string,
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  body1IsStar: boolean,
  body2IsStar: boolean,
  updatedBodiesMap: Map<string | number, PhysicsStateReal>,
): string[] => {
  const destroyedIds = new Set<string>();
  if (destroyedIds.has(id1) || destroyedIds.has(id2)) {
    return Array.from(destroyedIds);
  }

  // Rule 1: If it's not a star and it hits a star, it's destroyed
  if (!body1IsStar && body2IsStar) {
    destroyedIds.add(id1);
    return Array.from(destroyedIds);
  }
  if (body1IsStar && !body2IsStar) {
    destroyedIds.add(id2);
    return Array.from(destroyedIds);
  }

  // Rule 2: If it's two stars, the smaller star is destroyed
  if (body1IsStar && body2IsStar) {
    if (body1.mass_kg >= body2.mass_kg) {
      destroyedIds.add(id2);
    } else {
      destroyedIds.add(id1);
    }
    return Array.from(destroyedIds);
  }

  // Rule 3: If it's two planets, the larger planet wins
  if (!body1IsStar && !body2IsStar) {
    if (body1.mass_kg >= body2.mass_kg) {
      destroyedIds.add(id2);
    } else {
      destroyedIds.add(id1);
    }
    return Array.from(destroyedIds);
  }
  return Array.from(destroyedIds);
};

/**
 * Iterates through all pairs of bodies, detects collisions, and applies simple destruction rules.
 */
export const handleCollisions = (
  bodiesReal: PhysicsStateReal[],
  radii: Map<string | number, number>,
  isStar: Map<string | number, boolean>,
  bodyTypes: Map<string | number, CelestialType>,
  ignoreCollisions?: Map<string | number, boolean>,
): [PhysicsStateReal[], Set<string>] => {
  const updatedBodiesMap = new Map<string | number, PhysicsStateReal>();
  const destroyedIds = new Set<string>();

  // Initialize the map with all bodies
  bodiesReal.forEach((body) => updatedBodiesMap.set(body.id, { ...body }));

  const numBodies = bodiesReal.length;

  for (let i = 0; i < numBodies; i++) {
    const body1 = bodiesReal[i];
    const id1 = body1.id;

    for (let j = i + 1; j < numBodies; j++) {
      const body2 = bodiesReal[j];
      const id2 = body2.id;

      // Check if either object should ignore collisions
      const body1IgnoreCollisions = ignoreCollisions?.get(id1) ?? false;
      const body2IgnoreCollisions = ignoreCollisions?.get(id2) ?? false;

      if (body1IgnoreCollisions || body2IgnoreCollisions) {
        continue;
      }

      const radius1 = radii.get(id1);
      const radius2 = radii.get(id2);
      const body1IsStar = isStar.get(id1) ?? false;
      const body2IsStar = isStar.get(id2) ?? false;

      if (radius1 === undefined || radius2 === undefined) {
        console.warn(
          `Skipping collision check between ${id1} and ${id2}: Missing radius information.`,
        );
        continue;
      }

      const collision = detectSphereCollision(body1, radius1, body2, radius2);

      if (collision) {
        // Use simple destruction rules
        const newDestroyedIds = resolveSimpleCollision(
          id1,
          id2,
          body1,
          body2,
          body1IsStar,
          body2IsStar,
          updatedBodiesMap,
        );
        newDestroyedIds.forEach((id) => destroyedIds.add(id));
      }
    }
  }

  const finalBodies = Array.from(updatedBodiesMap.values()).filter(
    (body) => !destroyedIds.has(body.id),
  );

  return [finalBodies, destroyedIds];
};
