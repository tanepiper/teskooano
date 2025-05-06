import { EPSILON, OSVector3 } from "@teskooano/core-math";
import { CelestialType } from "@teskooano/data-types";
import { PhysicsStateReal } from "../types";

/** Threshold for mass difference to trigger inelastic collision (e.g., obj1 is < 10% mass of obj2) */
const MASS_DIFF_THRESHOLD = 0.1;
/** Special identifier for mutual destruction events */
const MUTUAL_DESTRUCTION_ID = "MUTUAL_DESTRUCTION";

/**
 * Represents detailed information about a detected collision between two physical bodies.
 * All units are in the SI system (meters, kg, seconds).
 */
export interface Collision {
  /** Unique identifier of the first body involved in the collision. */
  body1Id: string | number;
  /** Unique identifier of the second body involved in the collision. */
  body2Id: string | number;
  /** Estimated point of collision in world space (meters). */
  point: OSVector3;
  /**
   * Collision normal vector (unit vector).
   * Points from the center of body2 towards the center of body1 at the moment of collision.
   */
  normal: OSVector3;
  /** Estimated depth of penetration between the two bodies (meters). */
  penetrationDepth: number;
  /** Relative velocity between the two bodies at the point of contact (body1.velocity - body2.velocity, in m/s). */
  relativeVelocity: OSVector3;
  /** Time of collision (currently unused, intended for future continuous collision detection). */
  time?: number;
}

/**
 * Details about a collision event that resulted in the destruction
 * of one body by another.
 */
export interface DestructionEvent {
  /** ID of the object that survived and absorbed the other. */
  survivorId: string | number;
  /** ID of the object that was destroyed. */
  destroyedId: string | number;
  /** Approximate position where the destruction occurred (center of destroyed body). */
  impactPosition: OSVector3;
  /** Relative velocity between the two bodies at the point of contact (survivor.velocity - destroyed.velocity, in m/s). */
  relativeVelocity: OSVector3;
  /** Approximate radius of the destroyed object, useful for scaling effects. */
  destroyedRadius: number;
}

/**
 * Detects collision between two spheres based on their positions and radii.
 * Assumes instantaneous detection (does not calculate time of impact).
 *
 * @param body1 - The real-world physics state (position, velocity, mass) of the first spherical body.
 * @param radius1 - The radius of the first body in meters.
 * @param body2 - The real-world physics state of the second spherical body.
 * @param radius2 - The radius of the second body in meters.
 * @returns A `Collision` object containing details if the spheres intersect, otherwise `null`.
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
 * Resolves a detected collision between two bodies using the principles of elastic collision.
 * Calculates and applies impulses to conserve momentum and kinetic energy (based on restitution).
 * Operates directly on the `PhysicsStateReal` objects.
 *
 * @param collision - The detailed collision information obtained from `detectSphereCollision`.
 * @param body1Real - The complete `PhysicsStateReal` of the first body.
 * @param body2Real - The complete `PhysicsStateReal` of the second body.
 * @returns A tuple containing the two updated `PhysicsStateReal` objects `[newState1, newState2]` after applying the collision impulse.
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

  const restitution = 1.0;

  const j = (-(1 + restitution) * normalVelocity) / (1 / mass1 + 1 / mass2);

  const impulseVector = normal.clone().multiplyScalar(j);

  const newVelocity1_mps = body1Real.velocity_mps
    .clone()
    .add(impulseVector.clone().multiplyScalar(1 / mass1));

  const newVelocity2_mps = body2Real.velocity_mps
    .clone()
    .sub(impulseVector.clone().multiplyScalar(1 / mass2));

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

/** Helper function to check if a type is a planet, dwarf planet, or moon */
const isPlanetOrMoon = (type: CelestialType): boolean => {
  return (
    type === CelestialType.PLANET ||
    type === CelestialType.DWARF_PLANET ||
    type === CelestialType.MOON
  );
};

/**
 * Handles an inelastic collision where one body (survivor) absorbs another (destroyed).
 * Conserves momentum, updates survivor state, marks destroyed ID, and creates an event.
 */
const handleInelasticAbsorption = (
  survivorId: string | number,
  destroyedId: string | number,
  updatedBodiesMap: Map<string | number, PhysicsStateReal>,
  destroyedIds: Set<string | number>,
  destructionEvents: DestructionEvent[],
  radii: Map<string | number, number>,
): void => {
  if (destroyedIds.has(survivorId) || destroyedIds.has(destroyedId)) {
    return;
  }

  const survivor = updatedBodiesMap.get(survivorId);
  const destroyed = updatedBodiesMap.get(destroyedId);
  const destroyedRadius = radii.get(destroyedId);

  if (!survivor || !destroyed || destroyedRadius === undefined) {
    console.warn(
      `[handleInelasticAbsorption] Could not find states/radius for survivor ${survivorId} or destroyed ${destroyedId}`,
    );
    if (destroyedId) destroyedIds.add(destroyedId);
    return;
  }

  const relativeVelocity = survivor.velocity_mps
    .clone()
    .sub(destroyed.velocity_mps);
  const impactPosition = destroyed.position_m.clone();

  destructionEvents.push({
    survivorId,
    destroyedId,
    impactPosition,
    relativeVelocity,
    destroyedRadius,
  });

  const momentum1 = survivor.velocity_mps
    .clone()
    .multiplyScalar(survivor.mass_kg);
  const momentum2 = destroyed.velocity_mps
    .clone()
    .multiplyScalar(destroyed.mass_kg);
  const totalMomentum = momentum1.add(momentum2);
  const totalMass = survivor.mass_kg + destroyed.mass_kg;

  if (totalMass <= 0) {
    console.warn(
      `[handleInelasticAbsorption] Skipping inelastic collision between ${survivorId} and ${destroyedId}: Zero or negative total mass (${totalMass} kg).`,
    );
    destroyedIds.add(destroyedId);
    return;
  }

  const newVelocity = totalMomentum.multiplyScalar(1 / totalMass);

  updatedBodiesMap.set(survivorId, {
    ...survivor,
    mass_kg: totalMass,
    velocity_mps: newVelocity,
  });

  destroyedIds.add(destroyedId);
};

/** Handles collision between two stars (larger absorbs smaller). */
const resolveStarCollision = (
  id1: string | number,
  id2: string | number,
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  updatedBodiesMap: Map<string | number, PhysicsStateReal>,
  destroyedIds: Set<string | number>,
  destructionEvents: DestructionEvent[],
  radii: Map<string | number, number>,
) => {
  if (body1.mass_kg >= body2.mass_kg) {
    handleInelasticAbsorption(
      id1,
      id2,
      updatedBodiesMap,
      destroyedIds,
      destructionEvents,
      radii,
    );
  } else {
    handleInelasticAbsorption(
      id2,
      id1,
      updatedBodiesMap,
      destroyedIds,
      destructionEvents,
      radii,
    );
  }
};

/** Handles collision where a star absorbs a non-star. */
const resolveStarNonStarCollision = (
  starId: string | number,
  nonStarId: string | number,
  updatedBodiesMap: Map<string | number, PhysicsStateReal>,
  destroyedIds: Set<string | number>,
  destructionEvents: DestructionEvent[],
  radii: Map<string | number, number>,
) => {
  handleInelasticAbsorption(
    starId,
    nonStarId,
    updatedBodiesMap,
    destroyedIds,
    destructionEvents,
    radii,
  );
};

/** Handles collision between two moons (mutual destruction). */
const resolveMoonMoonCollision = (
  id1: string | number,
  id2: string | number,
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  destroyedIds: Set<string | number>,
  destructionEvents: DestructionEvent[],
  radii: Map<string | number, number>,
) => {
  if (destroyedIds.has(id1) || destroyedIds.has(id2)) return;

  destroyedIds.add(id1);
  destroyedIds.add(id2);

  const radius1 = radii.get(id1);
  if (radius1 === undefined) {
    console.warn(`[resolveMoonMoonCollision] Missing radius for ${id1}`);
    return;
  }

  const relativeVelocity = body1.velocity_mps.clone().sub(body2.velocity_mps);
  destructionEvents.push({
    survivorId: MUTUAL_DESTRUCTION_ID,
    destroyedId: `${id1} & ${id2}`,
    impactPosition: body1.position_m.clone(),
    relativeVelocity: relativeVelocity,
    destroyedRadius: radius1,
  });
};

/** Handles elastic collision between Planet/Moon and Gas Giant. */
const resolvePlanetGasGiantCollision = (
  id1: string | number,
  id2: string | number,
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  collision: Collision,
  updatedBodiesMap: Map<string | number, PhysicsStateReal>,
) => {
  const [resolvedBody1, resolvedBody2] = resolveCollision(
    collision,
    body1,
    body2,
  );
  updatedBodiesMap.set(id1, resolvedBody1);
  updatedBodiesMap.set(id2, resolvedBody2);
};

/** Handles general non-star collisions (elastic or inelastic based on mass ratio). */
const resolveGeneralNonStarCollision = (
  id1: string | number,
  id2: string | number,
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  collision: Collision,
  updatedBodiesMap: Map<string | number, PhysicsStateReal>,
  destroyedIds: Set<string | number>,
  destructionEvents: DestructionEvent[],
  radii: Map<string | number, number>,
) => {
  const mass1 = body1.mass_kg;
  const mass2 = body2.mass_kg;

  if (mass1 <= 0 || mass2 <= 0) {
    console.warn(
      `Skipping collision resolution between non-stars ${id1} and ${id2}: Invalid mass.`,
    );
    return;
  }

  const massRatio = Math.min(mass1, mass2) / Math.max(mass1, mass2);

  if (massRatio < MASS_DIFF_THRESHOLD) {
    if (mass1 < mass2) {
      handleInelasticAbsorption(
        id2,
        id1,
        updatedBodiesMap,
        destroyedIds,
        destructionEvents,
        radii,
      );
    } else {
      handleInelasticAbsorption(
        id1,
        id2,
        updatedBodiesMap,
        destroyedIds,
        destructionEvents,
        radii,
      );
    }
  } else {
    const [resolvedBody1, resolvedBody2] = resolveCollision(
      collision,
      body1,
      body2,
    );
    updatedBodiesMap.set(id1, resolvedBody1);
    updatedBodiesMap.set(id2, resolvedBody2);
  }
};

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
