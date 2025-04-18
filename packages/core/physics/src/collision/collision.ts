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
  body2Real: PhysicsStateReal,
): [PhysicsStateReal, PhysicsStateReal] => {
  const { normal, relativeVelocity } = collision;
  const mass1 = body1Real.mass_kg;
  const mass2 = body2Real.mass_kg;

  // Prevent division by zero or nonsensical physics with invalid mass
  if (mass1 <= 0 || mass2 <= 0) {
    console.warn(
      `Collision resolution skipped between ${body1Real.id} and ${body2Real.id}: Invalid mass (<= 0).`,
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

/** Helper function to check if a type is a planet, dwarf planet, or moon */
const isPlanetOrMoon = (type: CelestialType): boolean => {
  return (
    type === CelestialType.PLANET ||
    type === CelestialType.DWARF_PLANET ||
    type === CelestialType.MOON
  );
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
  // Use a map to store potentially updated states during the iteration
  const updatedBodiesMap = new Map<string | number, PhysicsStateReal>();
  bodiesReal.forEach((body) => updatedBodiesMap.set(body.id, { ...body })); // Start with clones

  const destroyedIds = new Set<string | number>();
  const destructionEvents: DestructionEvent[] = [];
  const numBodies = bodiesReal.length;
  // Threshold for mass difference to trigger inelastic collision (destruction)
  const MASS_DIFF_THRESHOLD = 0.1; // e.g., obj1 is < 10% mass of obj2

  /**
   * Handles an inelastic collision where one body (survivor) absorbs another (destroyed).
   * Conserves momentum by calculating a new velocity for the combined mass.
   * Updates the survivor's state in `updatedBodiesMap` and adds the destroyed ID to `destroyedIds`.
   * Creates and adds a DestructionEvent to the `destructionEvents` array.
   *
   * @param survivorId - The ID of the body that survives the collision.
   * @param destroyedId - The ID of the body that is destroyed/absorbed.
   * @param destructionEventsRef - Reference to the array collecting destruction events.
   * @private - Internal helper function.
   */
  const handleInelasticCollision = (
    survivorId: string | number,
    destroyedId: string | number,
    destructionEventsRef: DestructionEvent[],
  ): void => {
    // Check if either body was already involved in a destructive collision in this step
    if (destroyedIds.has(survivorId) || destroyedIds.has(destroyedId)) {
      return; // Avoid processing already destroyed bodies
    }
    const survivor = updatedBodiesMap.get(survivorId)!;
    const destroyed = updatedBodiesMap.get(destroyedId)!;
    const destroyedRadius = radii.get(destroyedId);

    if (!survivor || !destroyed || destroyedRadius === undefined) {
      console.warn(
        `[handleInelasticCollision] Could not find states/radius for survivor ${survivorId} or destroyed ${destroyedId}`,
      );
      if (destroyedId) destroyedIds.add(destroyedId);
      return;
    }

    // --- Create Destruction Event ---
    const relativeVelocity = survivor.velocity_mps
      .clone()
      .sub(destroyed.velocity_mps);
    const impactPosition = destroyed.position_m.clone();

    const destructionEvent: DestructionEvent = {
      survivorId,
      destroyedId,
      impactPosition,
      relativeVelocity,
      destroyedRadius,
    };
    destructionEventsRef.push(destructionEvent);
    // --- End Create Destruction Event ---

    // --- Momentum Conservation ---
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
        `[handleInelasticCollision] Skipping inelastic collision between ${survivorId} and ${destroyedId}: Zero or negative total mass (${totalMass} kg).`,
      );
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

    // Mark the other body as destroyed for this step AFTER creating the event
    destroyedIds.add(destroyedId);
  };

  // --- Collision Detection and Resolution Loop ---
  for (let i = 0; i < numBodies; i++) {
    const id1 = bodiesReal[i].id;
    if (destroyedIds.has(id1)) continue;
    const body1 = updatedBodiesMap.get(id1)!;

    for (let j = i + 1; j < numBodies; j++) {
      const id2 = bodiesReal[j].id;
      if (destroyedIds.has(id2)) continue;
      const body2 = updatedBodiesMap.get(id2)!;

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

      if (radius1 === undefined || radius2 === undefined) {
        console.warn(
          `Skipping collision check between ${id1} and ${id2}: Missing radius information.`,
        );
        continue;
      }

      const collision = detectSphereCollision(body1, radius1, body2, radius2);

      if (collision) {
        // Scenario 1: Star Collision
        if (body1IsStar || body2IsStar) {
          if (body1IsStar && body2IsStar) {
            if (body1.mass_kg >= body2.mass_kg) {
              handleInelasticCollision(id1, id2, destructionEvents);
            } else {
              handleInelasticCollision(id2, id1, destructionEvents);
            }
          } else if (body1IsStar) {
            handleInelasticCollision(id1, id2, destructionEvents);
          } else {
            handleInelasticCollision(id2, id1, destructionEvents);
          }
          continue; // Handled star collision
        }

        // Scenario 2: Non-Star Collisions (Refined Logic)
        else {
          // Ensure types are defined before checking
          if (type1 === undefined || type2 === undefined) {
            console.warn(
              `[Collision] Skipping collision between ${id1} and ${id2}: Undefined body type.`,
            );
            continue;
          }

          // Sub-Scenario 2a: Moon vs Moon -> Mutual Destruction
          if (type1 === CelestialType.MOON && type2 === CelestialType.MOON) {
            destroyedIds.add(id1);
            destroyedIds.add(id2);
            // Create one event representing the collision site (using body1's info)
            const relativeVelocity = body1.velocity_mps
              .clone()
              .sub(body2.velocity_mps);
            const destructionEvent: DestructionEvent = {
              survivorId: "MUTUAL_DESTRUCTION", // Special ID or null?
              destroyedId: `${id1} & ${id2}`,
              impactPosition: body1.position_m.clone(),
              relativeVelocity: relativeVelocity,
              destroyedRadius: radius1, // Use first moon's radius for effect scaling
            };
            destructionEvents.push(destructionEvent);
            console.log(`[Collision] Mutual Destruction: ${id1} & ${id2}`);
            continue; // Handled Moon vs Moon
          }

          // Sub-Scenario 2b: Planet/Moon vs Gas Giant -> Elastic Bounce
          else if (
            (isPlanetOrMoon(type1) && type2 === CelestialType.GAS_GIANT) ||
            (isPlanetOrMoon(type2) && type1 === CelestialType.GAS_GIANT)
          ) {
            // Always elastic regardless of mass ratio
            const [resolvedBody1, resolvedBody2] = resolveCollision(
              collision,
              body1,
              body2,
            );
            updatedBodiesMap.set(id1, resolvedBody1);
            updatedBodiesMap.set(id2, resolvedBody2);
            console.log(
              `[Collision] Elastic Bounce (Planet/Moon vs Gas Giant): ${id1} & ${id2}`,
            );
            continue; // Handled Planet/Moon vs Gas Giant
          }

          // Sub-Scenario 2c: All Other Non-Star Collisions (Planet/Moon vs Planet/Moon, etc.)
          else {
            const mass1 = body1.mass_kg;
            const mass2 = body2.mass_kg;
            if (mass1 <= 0 || mass2 <= 0) {
              console.warn(
                `Skipping collision resolution between non-stars ${id1} and ${id2}: Invalid mass.`,
              );
              continue;
            }
            const massRatio = Math.min(mass1, mass2) / Math.max(mass1, mass2);

            if (massRatio < MASS_DIFF_THRESHOLD) {
              // Inelastic: Larger absorbs smaller
              if (mass1 < mass2) {
                handleInelasticCollision(id2, id1, destructionEvents);
              } else {
                handleInelasticCollision(id1, id2, destructionEvents);
              }
            } else {
              // Elastic Collision
              const [resolvedBody1, resolvedBody2] = resolveCollision(
                collision,
                body1,
                body2,
              );
              updatedBodiesMap.set(id1, resolvedBody1);
              updatedBodiesMap.set(id2, resolvedBody2);
            }
          } // End of standard Planet/Moon vs Planet/Moon logic
        } // End Non-Star Collision Block
      } // End if (collision)
    } // End inner loop (j)
  } // End outer loop (i)

  // --- Finalize Results ---
  // Create the final array of states, excluding any bodies marked as destroyed
  const finalBodies = Array.from(updatedBodiesMap.values()).filter(
    (body) => !destroyedIds.has(body.id),
  );

  return [finalBodies, destroyedIds, destructionEvents];
};
