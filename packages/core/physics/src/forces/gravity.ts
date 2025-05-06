import { PhysicsStateReal, PairForceCalculator } from "../types";
import { GRAVITATIONAL_CONSTANT } from "@teskooano/data-types";
import { OSVector3, EPSILON } from "@teskooano/core-math";

/**
 * Calculates the gravitational force exerted by body1 on body2 using Newton's law.
 * F = G * (m1 * m2) / r² * direction
 *
 * @param body1 - The body exerting the force.
 * @param body2 - The body experiencing the force.
 * @param G - The gravitational constant (m^3 kg^-1 s^-2).
 * @returns The force vector acting on body2 (Newtons - kg*m/s^2).
 */
export const calculateNewtonianGravitationalForce: PairForceCalculator = (
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  G: number = GRAVITATIONAL_CONSTANT,
): OSVector3 => {
  const displacement = new OSVector3();
  displacement.copy(body1.position_m).sub(body2.position_m);

  const distanceSq = displacement.lengthSq();

  if (distanceSq < EPSILON * EPSILON) {
    return new OSVector3(0, 0, 0);
  }

  const forceMagnitude = (G * (body1.mass_kg * body2.mass_kg)) / distanceSq;

  displacement.normalize().multiplyScalar(forceMagnitude);

  return displacement;
};
