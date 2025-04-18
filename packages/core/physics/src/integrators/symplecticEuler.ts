// Remove THREE import
// import * as THREE from 'three';

// Import correct types
import { Integrator, PhysicsStateReal } from '../types';
import { OSVector3 } from '@teskooano/core-math';

/**
 * Updates the state of a body using the symplectic Euler integration method.
 * This variant updates velocity first, then uses the new velocity to update position.
 * 
 * Velocity update:
 * v_new = v_old + a * dt
 * 
 * Position update:
 * p_new = p_old + v_new * dt
 * 
 * This method provides better energy conservation for orbital mechanics compared to standard Euler.
 * 
 * @param currentState - The current state of the body.
 * @param acceleration - The constant acceleration acting on the body during the time step (m/s^2).
 * @param dt - The time step duration (seconds).
 * @returns The new REAL state of the body after the time step.
 */
export const symplecticEuler: Integrator = (
  currentState: PhysicsStateReal, 
  acceleration: OSVector3, // Use OSVector3
  dt: number // seconds
): PhysicsStateReal => {
  // Clone REAL vectors to avoid modifying originals
  const pos_m = currentState.position_m.clone();
  const vel_mps = currentState.velocity_mps.clone();
  const acc = acceleration.clone(); // Use OSVector3
  
  // Calculate new velocity first (m/s)
  // Reuse acc vector scaled by dt
  acc.multiplyScalar(dt);
  const newVelocity_mps = vel_mps.clone().add(acc);
  
  // Calculate new position using new velocity: p_new = p_old + v_new * dt (meters)
  // Reuse acc vector (which is now acc*dt) and add vel_mps to get new velocity
  // Clone new velocity and scale by dt for position update
  const newPosition_m = pos_m.clone().add(newVelocity_mps.clone().multiplyScalar(dt));
  
  // Return a new state object, preserving the original id and mass_kg
  return {
    ...currentState,
    position_m: newPosition_m,
    velocity_mps: newVelocity_mps,
  };
}; 