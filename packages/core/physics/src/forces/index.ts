// import * as THREE from 'three';
import { calculateNewtonianGravitationalForce } from './gravity';
import { OSVector3 } from '@teskooano/core-math';

export * from './non-gravitational';
export * from './relativistic';
export * from './gravity';

/**
 * Re-export calculateNewtonianGravitationalForce as calculateGravitationalForce for 
 * backward compatibility
 */
export const calculateGravitationalForce = calculateNewtonianGravitationalForce;

/**
 * Calculates acceleration from force and mass (a = F/m).
 * 
 * @param mass - The mass of the body (kg).
 * @param force - The total force acting on the body (Newtons).
 * @returns The acceleration vector (m/s^2).
 */
export const calculateAcceleration = (mass: number, force: OSVector3): OSVector3 => {
  if (mass === 0) {
    return new OSVector3(0, 0, 0); // Return OSVector3 zero vector
  }
  // Clone the force vector before scaling to avoid modifying the original
  const acceleration = force.clone(); 
  acceleration.multiplyScalar(1 / mass); // Use OSVector3 method
  return acceleration;
}; 