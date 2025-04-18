import { PhysicsStateReal } from '../types';
import { OSVector3, EPSILON } from '@teskooano/core-math';

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
  const speedSq = velocity.lengthSq(); // Use lengthSq for efficiency
  if (speedSq >= SPEED_OF_LIGHT_SQ) {
      // Handle cases at or above light speed (avoid NaN/Infinity)
      // Depending on desired behavior, could clamp, throw error, or return Infinity
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
  body1: PhysicsStateReal, // Use PhysicsStateReal
  body2: PhysicsStateReal, // Use PhysicsStateReal
  G: number
): OSVector3 => { // Return OSVector3
  // Calculate displacement from body2 to body1
  const displacement = new OSVector3().copy(body1.position_m).sub(body2.position_m);
  const distanceSq = displacement.lengthSq();
  const distance = Math.sqrt(distanceSq);
  
  if (distance < EPSILON) { // Use epsilon
    return new OSVector3(0, 0, 0);
  }

  // Calculate relativistic masses
  const gamma1 = calculateGamma(body1.velocity_mps);
  const gamma2 = calculateGamma(body2.velocity_mps);
  // Handle infinite gamma if necessary
  if (!isFinite(gamma1) || !isFinite(gamma2)) return new OSVector3(0, 0, 0);

  const relativisticMass1 = body1.mass_kg * gamma1;
  const relativisticMass2 = body2.mass_kg * gamma2;

  // Calculate gravitational time dilation factor (simplification)
  const schwarzschildRadius = (2 * G * relativisticMass1) / SPEED_OF_LIGHT_SQ;
  const timeDilationFactor = Math.sqrt(1 - schwarzschildRadius / distance);
  if (isNaN(timeDilationFactor)) {
      // Inside event horizon or invalid state, return zero force for now
      return new OSVector3(0, 0, 0);
  }

  // Calculate force magnitude with relativistic corrections
  const forceMagnitude = (G * relativisticMass1 * relativisticMass2) / (distanceSq * timeDilationFactor);
  
  // Force direction is from body2 towards body1 (attractive force)
  displacement.normalize().multiplyScalar(forceMagnitude);
  
  return displacement;
};

/**
 * Calculates the relativistic acceleration of a body
 * This takes into account the relativistic mass increase: a = F / (m * gamma)
 */
export const calculateRelativisticAcceleration = (
  mass_kg: number, // Use real mass
  force: OSVector3, // Use OSVector3
  velocity_mps: OSVector3 // Use OSVector3
): OSVector3 => { // Return OSVector3
  if (mass_kg === 0) {
    return new OSVector3(0, 0, 0);
  }

  const gamma = calculateGamma(velocity_mps);
  if (!isFinite(gamma)) return new OSVector3(0, 0, 0); // Handle infinite gamma

  const relativisticMass = mass_kg * gamma;
  if (relativisticMass === 0) return new OSVector3(0,0,0); // Avoid division by zero

  const acceleration = force.clone().multiplyScalar(1 / relativisticMass);
  return acceleration;
}; 