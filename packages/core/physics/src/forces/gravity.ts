import { PhysicsStateReal, PairForceCalculator } from "../types"; // Import local types
import { GRAVITATIONAL_CONSTANT } from "@teskooano/data-types"; // Keep G constant
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
  // Return OSVector3
  // Create a new OSVector3 for displacement
  const displacement = new OSVector3();
  displacement.copy(body1.position_m).sub(body2.position_m); // Use OSVector3 methods

  const distanceSq = displacement.lengthSq();

  // Avoid division by zero or extremely large forces at very small distances
  if (distanceSq < EPSILON * EPSILON) {
    // Compare squared distance to squared epsilon
    return new OSVector3(0, 0, 0); // Return a new zero vector
  }

  // Use REAL mass from physicsStateReal
  const forceMagnitude = (G * (body1.mass_kg * body2.mass_kg)) / distanceSq;

  // Force direction is from body2 towards body1
  // Normalize displacement and scale by magnitude
  displacement.normalize().multiplyScalar(forceMagnitude); // Modify displacement in-place

  return displacement; // Return the calculated force vector
};
