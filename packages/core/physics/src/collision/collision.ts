import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal, CelestialType } from "@teskooano/data-types";

// Constants
const EPSILON = 1e-10;

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
