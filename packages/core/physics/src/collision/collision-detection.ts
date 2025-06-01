import { EPSILON, OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "../types";
import { Collision } from "./collision-types";

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
