import { EPSILON, OSVector3 } from "@teskooano/core-math";
import { CelestialType } from "@teskooano/data-types";
import { PhysicsStateReal } from "../types";

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
  radius2: number
): Collision | null {
  // Calculate displacement vector from body2 center to body1 center
  const displacement = new OSVector3()
    .copy(body1.position_m)
    .sub(body2.position_m);
  const distanceSq = displacement.lengthSq();
  const sumRadii = radius1 + radius2;
  const sumRadiiSq = sumRadii * sumRadii;

  // Check if squared distance is less than squared sum of radii (faster than sqrt)
  if (distanceSq < sumRadiiSq) {
    const distance = Math.sqrt(distanceSq);
    const penetrationDepth = sumRadii - distance;

    // Calculate the collision normal (normalized displacement vector)
    // Handle potential zero distance case with a default normal
    const normal =
      distance > EPSILON
        ? displacement.clone().multiplyScalar(1 / distance)
        : new OSVector3(1, 0, 0); // Default normal if centers coincide

    // Approximate collision point: on body2's surface along the normal vector
    const point = body2.position_m
      .clone()
      .add(normal.clone().multiplyScalar(radius2));

    // Calculate relative velocity (v1 - v2)
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

  // No collision detected
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
  body2Real: PhysicsStateReal
): [PhysicsStateReal, PhysicsStateReal] => {
  const { normal, relativeVelocity } = collision;
  const mass1 = body1Real.mass_kg;
  const mass2 = body2Real.mass_kg;

  // Prevent division by zero or nonsensical physics with invalid mass
  if (mass1 <= 0 || mass2 <= 0) {
    console.warn(
      `Collision resolution skipped between ${body1Real.id} and ${body2Real.id}: Invalid mass (<= 0).`
    );
    return [body1Real, body2Real]; // Return original states without modification
  }

  // Calculate velocity component along the collision normal
  const normalVelocity = relativeVelocity.dot(normal);

  // If objects are already moving apart along the normal, no impulse is needed
  if (normalVelocity > 0) {
    return [body1Real, body2Real];
  }

  // Coefficient of restitution (elasticity)
  // 1.0 = perfectly elastic, 0.0 = perfectly inelastic
  // TODO: Make restitution configurable per object/material type
  const restitution = 1.0;

  // Calculate the magnitude of the impulse (scalar value j)
  const j = (-(1 + restitution) * normalVelocity) / (1 / mass1 + 1 / mass2);

  // Calculate the impulse vector (direction * magnitude)
  const impulseVector = normal.clone().multiplyScalar(j);

  // Apply the impulse to the velocities (v_new = v_old + impulse / mass)
  // Ensure new Vector instances are created
  const newVelocity1_mps = body1Real.velocity_mps
    .clone()
    .add(impulseVector.clone().multiplyScalar(1 / mass1));

  const newVelocity2_mps = body2Real.velocity_mps
    .clone()
    .sub(impulseVector.clone().multiplyScalar(1 / mass2)); // Impulse is opposite for body2

  // Return new state objects with updated velocities
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
 * Iterates through all pairs of bodies, detects collisions, and applies appropriate resolution.
 * Handles different scenarios:
 * - Sphere-Sphere elastic collisions for similar mass objects.
 * - Inelastic collisions (absorption/destruction) for objects with significant mass difference.
 * - Special handling for stars (absorption of non-stars, merging of stars).
 * - Ignores collisions involving `RING_SYSTEM` objects.
 *
 * Operates on and returns `PhysicsStateReal` objects.
 *
 * @param bodiesReal - An array of the current real-world physics states for all bodies.
 * @param radii - A Map associating body IDs with their real-world radii in meters.
 * @param isStar - A Map associating body IDs with a boolean indicating if the body is a star.
 * @param bodyTypes - A Map associating body IDs with their `CelestialType`.
 * @returns A tuple: `[finalStates, destroyedIds]` where
 *          `finalStates` is the updated array of `PhysicsStateReal` objects (excluding destroyed ones),
 *          `destroyedIds` is a Set containing the IDs of bodies destroyed in this collision pass.
 */
export const handleCollisions = (
  bodiesReal: PhysicsStateReal[],
  radii: Map<string | number, number>,
  isStar: Map<string | number, boolean>,
  bodyTypes: Map<string | number, CelestialType>
): [PhysicsStateReal[], Set<string | number>] => {
  // Use a map to store potentially updated states during the iteration
  const updatedBodiesMap = new Map<string | number, PhysicsStateReal>();
  bodiesReal.forEach((body) => updatedBodiesMap.set(body.id, { ...body })); // Start with clones

  const destroyedIds = new Set<string | number>();
  const numBodies = bodiesReal.length;
  // Threshold for mass difference to trigger inelastic collision (destruction)
  const MASS_DIFF_THRESHOLD = 0.1; // e.g., obj1 is < 10% mass of obj2

  /**
   * Handles an inelastic collision where one body (survivor) absorbs another (destroyed).
   * Conserves momentum by calculating a new velocity for the combined mass.
   * Updates the survivor's state in `updatedBodiesMap` and adds the destroyed ID to `destroyedIds`.
   *
   * @param survivorId - The ID of the body that survives the collision.
   * @param destroyedId - The ID of the body that is destroyed/absorbed.
   * @private - Internal helper function.
   */
  const handleInelasticCollision = (
    survivorId: string | number,
    destroyedId: string | number
  ): void => {
    // Check if either body was already involved in a destructive collision in this step
    if (destroyedIds.has(survivorId) || destroyedIds.has(destroyedId)) {
      return; // Avoid processing already destroyed bodies
    }
    const survivor = updatedBodiesMap.get(survivorId)!;
    const destroyed = updatedBodiesMap.get(destroyedId)!;

    if (!survivor || !destroyed) {
      console.warn(
        `[handleInelasticCollision] Could not find states for survivor ${survivorId} or destroyed ${destroyedId}`
      );
      return;
    }

    // --- Momentum Conservation ---
    // p = m * v
    const momentum1 = survivor.velocity_mps
      .clone()
      .multiplyScalar(survivor.mass_kg);
    const momentum2 = destroyed.velocity_mps
      .clone()
      .multiplyScalar(destroyed.mass_kg);
    const totalMomentum = momentum1.add(momentum2);

    const totalMass = survivor.mass_kg + destroyed.mass_kg;

    // Check for zero total mass to prevent division by zero
    if (totalMass <= 0) {
      console.warn(
        `[handleInelasticCollision] Skipping inelastic collision between ${survivorId} and ${destroyedId}: Zero or negative total mass (${totalMass} kg).`
      );
      // Optionally mark both as destroyed if mass is nonsensical?
      // destroyedIds.add(survivorId);
      destroyedIds.add(destroyedId);
      return;
    }

    // v_new = p_total / m_total
    const newVelocity = totalMomentum.multiplyScalar(1 / totalMass);
    // --- End Momentum Conservation ---

    // Update the state of the surviving body
    updatedBodiesMap.set(survivorId, {
      ...survivor,
      mass_kg: totalMass,
      velocity_mps: newVelocity,
    });

    // Mark the other body as destroyed for this step
    destroyedIds.add(destroyedId);
  };

  // --- Collision Detection and Resolution Loop ---
  // Iterate through all unique pairs of bodies (i, j where j > i)
  for (let i = 0; i < numBodies; i++) {
    const id1 = bodiesReal[i].id;
    // Skip if this body was already destroyed by a previous interaction in *this* timestep
    if (destroyedIds.has(id1)) continue;

    const body1 = updatedBodiesMap.get(id1)!; // Get the latest state for body1

    for (let j = i + 1; j < numBodies; j++) {
      const id2 = bodiesReal[j].id;
      // Skip if body2 was already destroyed
      if (destroyedIds.has(id2)) continue;

      const body2 = updatedBodiesMap.get(id2)!; // Get the latest state for body2

      // --- Check for special types (Ring Systems) ---
      const type1 = bodyTypes.get(id1);
      const type2 = bodyTypes.get(id2);
      // Ring systems are visual representations and do not participate in physical collisions
      // TODO: Add ring system specific collision handling logic
      if (
        type1 === CelestialType.RING_SYSTEM ||
        type2 === CelestialType.RING_SYSTEM
      ) {
        continue; // Skip collision check
      }
      // --- End Special Type Check ---

      const radius1 = radii.get(id1);
      const radius2 = radii.get(id2);
      const body1IsStar = isStar.get(id1) ?? false;
      const body2IsStar = isStar.get(id2) ?? false;

      // Ensure radii are available for collision detection
      if (radius1 === undefined || radius2 === undefined) {
        console.warn(
          `Skipping collision check between ${id1} and ${id2}: Missing radius information.`
        );
        continue;
      }

      // --- Detect Collision ---
      const collision = detectSphereCollision(body1, radius1, body2, radius2);

      if (collision) {
        // --- Handle Detected Collision ---

        // Scenario 1: Star Collision
        if (body1IsStar || body2IsStar) {
          if (body1IsStar && body2IsStar) {
            // Star-Star: Merge into the more massive one (or body1 if equal)
            if (body1.mass_kg >= body2.mass_kg) {
              handleInelasticCollision(id1, id2);
            } else {
              handleInelasticCollision(id2, id1);
            }
          } else if (body1IsStar) {
            // Star-NonStar: Star absorbs the other body
            handleInelasticCollision(id1, id2);
          } else {
            // NonStar-Star: Star absorbs the other body
            handleInelasticCollision(id2, id1);
          }
          // Potential future enhancement: transfer angular momentum during absorption
          continue; // Move to next pair after inelastic handling
        }
        // Scenario 2: Non-Star vs Non-Star Collision
        else {
          const mass1 = body1.mass_kg;
          const mass2 = body2.mass_kg;

          // Check for valid masses before calculating ratio
          if (mass1 <= 0 || mass2 <= 0) {
            console.warn(
              `Skipping collision resolution between non-stars ${id1} and ${id2}: Invalid mass.`
            );
            continue;
          }

          // Determine if mass difference is significant
          const massRatio = Math.min(mass1, mass2) / Math.max(mass1, mass2);

          if (massRatio < MASS_DIFF_THRESHOLD) {
            // Inelastic: Significant mass difference -> Larger body absorbs smaller body
            if (mass1 < mass2) {
              handleInelasticCollision(id2, id1); // Body 2 survives
            } else {
              handleInelasticCollision(id1, id2); // Body 1 survives
            }
          } else {
            const [resolvedBody1, resolvedBody2] = resolveCollision(
              collision,
              body1,
              body2
            );
            // Update the states in the map for subsequent checks within this timestep
            updatedBodiesMap.set(id1, resolvedBody1);
            updatedBodiesMap.set(id2, resolvedBody2);
          }
        }
        // --- End Collision Handling Logic ---
      }
      // --- End Collision Detection Check ---
    }
    // --- End Inner Loop (j) ---
  }
  // --- End Outer Loop (i) ---

  // --- Finalize Results ---
  // Create the final array of states, excluding any bodies marked as destroyed
  const finalBodies = Array.from(updatedBodiesMap.values()).filter(
    (body) => !destroyedIds.has(body.id)
  );

  return [finalBodies, destroyedIds];
};
