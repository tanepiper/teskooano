import { PhysicsStateReal } from "../types";
import { OSVector3, EPSILON } from "@teskooano/core-math";

/**
 * Speed of light in meters per second
 */
const SPEED_OF_LIGHT = 299792458;
const SPEED_OF_LIGHT_SQ = SPEED_OF_LIGHT * SPEED_OF_LIGHT;

/**
 * Calculates the relativistic correction factor γ (gamma)
 * γ = 1 / √(1 - v²/c²)
 */
const calculateGamma = (velocity: OSVector3): number => {
  const speedSq = velocity.lengthSq();
  if (speedSq >= SPEED_OF_LIGHT_SQ) {
    return Infinity;
  }
  return 1 / Math.sqrt(1 - speedSq / SPEED_OF_LIGHT_SQ);
};

/**
 * Calculates the relativistic gravitational force between two bodies
 * This is a simplified version that only accounts for relativistic mass increase
 * and gravitational time dilation. For a full relativistic treatment,
 * we would need to use the Einstein field equations.
 */
export const calculateRelativisticGravitationalForce = (
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  G: number,
): OSVector3 => {
  const displacement = new OSVector3()
    .copy(body1.position_m)
    .sub(body2.position_m);
  const distanceSq = displacement.lengthSq();
  const distance = Math.sqrt(distanceSq);

  if (distance < EPSILON) {
    return new OSVector3(0, 0, 0);
  }

  const gamma1 = calculateGamma(body1.velocity_mps);
  const gamma2 = calculateGamma(body2.velocity_mps);

  if (!isFinite(gamma1) || !isFinite(gamma2)) return new OSVector3(0, 0, 0);

  const relativisticMass1 = body1.mass_kg * gamma1;
  const relativisticMass2 = body2.mass_kg * gamma2;

  const schwarzschildRadius = (2 * G * relativisticMass1) / SPEED_OF_LIGHT_SQ;
  const timeDilationFactor = Math.sqrt(1 - schwarzschildRadius / distance);
  if (isNaN(timeDilationFactor)) {
    return new OSVector3(0, 0, 0);
  }

  const forceMagnitude =
    (G * relativisticMass1 * relativisticMass2) /
    (distanceSq * timeDilationFactor);

  displacement.normalize().multiplyScalar(forceMagnitude);

  return displacement;
};

/**
 * Calculates the relativistic acceleration of a body
 * This takes into account the relativistic mass increase: a = F / (m * gamma)
 */
export const calculateRelativisticAcceleration = (
  mass_kg: number,
  force: OSVector3,
  velocity_mps: OSVector3,
): OSVector3 => {
  if (mass_kg === 0) {
    return new OSVector3(0, 0, 0);
  }

  const gamma = calculateGamma(velocity_mps);
  if (!isFinite(gamma)) return new OSVector3(0, 0, 0);

  const relativisticMass = mass_kg * gamma;
  if (relativisticMass === 0) return new OSVector3(0, 0, 0);

  const acceleration = force.clone().multiplyScalar(1 / relativisticMass);
  return acceleration;
};
