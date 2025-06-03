import { OSVector3, EPSILON } from "@teskooano/core-math";
import { CelestialPhysicsState } from "@teskooano/celestial-object";

/**
 * Calculates the Newtonian gravitational force between two point masses.
 *
 * F = G * (m1 * m2) / r^2 * r̂
 *
 * @param body1 - The physics state of the first body.
 * @param body2 - The physics state of the second body.
 * @param G - The gravitational constant.
 * @returns The gravitational force vector acting on body1 due to body2.
 */
export const calculateNewtonianForce = (
  body1: CelestialPhysicsState,
  body2: CelestialPhysicsState,
  G: number,
): OSVector3 => {
  // Displacement should point from body2 to body1 for the force ON body1
  const displacement = OSVector3.subVectors(body1.position_m, body2.position_m);

  const distanceSq = displacement.lengthSq();

  if (distanceSq < EPSILON * EPSILON) {
    return new OSVector3(0, 0, 0);
  }

  const forceMagnitude = (G * body1.mass_kg * body2.mass_kg) / distanceSq;

  // The force vector acting on body1, pointing towards body2
  const forceVector = OSVector3.normalized(displacement);
  forceVector.multiplyScalar(forceMagnitude); // Multiply in-place

  return forceVector;
};
