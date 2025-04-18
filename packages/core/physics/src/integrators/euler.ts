// Remove THREE import
// import * as THREE from 'three';

// Import correct types
// import { PhysicsStateReal } from '@teskooano/data-types';
import { PhysicsStateReal, Integrator } from "../types"; // Import local types
import { OSVector3 } from "@teskooano/core-math"; // Import OSVector3

/**
 * Updates the state of a body using the standard Euler integration method.
 *
 * Velocity update:
 * v_new = v_old + a * dt
 *
 * Position update:
 * p_new = p_old + v_old * dt // Corrected Euler: Use v_old for position
 * // NOTE: The version using 0.5 * a * dt^2 is Verlet-like, not standard Euler position
 *
 * This method is simple but can suffer from energy drift in orbital mechanics.
 *
 * @param currentState - The current state of the body.
 * @param acceleration - The constant acceleration acting on the body during the time step (m/s^2).
 * @param dt - The time step duration (seconds).
 * @returns The new REAL state of the body after the time step.
 */
export const standardEuler: Integrator = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3, // Use OSVector3
  dt: number, // seconds
): PhysicsStateReal => {
  // Handle zero time step
  if (dt === 0) {
    return currentState;
  }

  // Clone REAL vectors to avoid modifying originals
  const pos_m = currentState.position_m.clone();
  const vel_mps = currentState.velocity_mps.clone();
  const acc = acceleration.clone(); // Use OSVector3

  // Calculate new velocity: v_new = v_old + a * dt (m/s)
  const newVelocity_mps = vel_mps.clone().add(acc.multiplyScalar(dt)); // Use initial acc clone

  // Calculate new position using old velocity: p_new = p_old + v_old * dt (meters)
  const newPosition_m = pos_m.clone().add(vel_mps.multiplyScalar(dt)); // Use initial vel_mps clone

  // Return a new state object, preserving the original id and mass_kg
  return {
    ...currentState,
    position_m: newPosition_m,
    velocity_mps: newVelocity_mps,
  };
};
