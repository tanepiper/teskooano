// import * as THREE from 'three';
import { PhysicsStateReal } from '..';
import { OSVector3 } from '@teskooano/core-math';

/**
 * Updates the state of a body using the Verlet integration method.
 * Requires the state from the *previous* timestep.
 * 
 * Position update:
 * x_new = x_current + (x_current - x_previous) + a * dt²
 * (Simplified to avoid 0.5 factor, common variation)
 * 
 * Velocity update (optional, can be estimated):
 * v_new = (x_new - x_previous) / (2 * dt)
 * 
 * @param currentState - The current state of the body (time t).
 * @param previousState - The previous state of the body (time t-dt).
 * @param acceleration - The acceleration acting on the body at time t (m/s^2).
 * @param dt - The time step duration (seconds).
 * @returns The new REAL state of the body (time t+dt).
 */
export const verletIntegrate = (
  currentState: PhysicsStateReal,
  previousState: PhysicsStateReal,
  acceleration: OSVector3,
  dt: number
): PhysicsStateReal => {
  // Handle zero time step case
  if (dt === 0) {
    return currentState;
  }

  // Calculate new position using Verlet integration
  // x_new = x_current + (x_current - x_previous) + a * dt²
  const dtSquared = dt * dt;
  
  // Clone position vectors to avoid modifying originals
  const currentPos = currentState.position_m.clone();
  const prevPos = previousState.position_m.clone();
  const acc = acceleration.clone();
  
  // Calculate displacement term: x_current - x_previous
  const displacement = currentPos.clone().sub(prevPos); 
  
  // Calculate acceleration term: a * dt²
  const accTerm = acc.multiplyScalar(dtSquared);
  
  // Calculate new position: x_current + displacement + accTerm
  const newPosition = currentPos.clone().add(displacement).add(accTerm);

  // Estimate new velocity: (new_position - previous_position) / (2 * dt)
  // This is often recalculated or handled differently depending on the simulation needs.
  // For consistency, let's keep this estimation.
  const newVelocity = newPosition.clone().sub(prevPos).multiplyScalar(0.5 / dt);

  return {
    ...currentState,
    position_m: newPosition,
    velocity_mps: newVelocity,
  };
};

/**
 * Updates the state of a body using the Velocity Verlet integration method.
 * This is a variant of Verlet integration that directly computes velocity,
 * often preferred for better stability and explicit velocity handling.
 * 
 * Position update:
 * x_new = x + v*dt + 0.5*a*dt²
 * 
 * Velocity update: 
 * v_new = v + 0.5*(a + a_new)*dt
 * 
 * This requires the acceleration to be recalculated based on the new position.
 * 
 * @param currentState - The current state of the body.
 * @param acceleration - The current acceleration of the body (m/s^2).
 * @param calculateNewAcceleration - Function to calculate acceleration at the new state.
 * @param dt - The time step duration (seconds).
 * @returns The new REAL state of the body after the time step.
 */
export const velocityVerletIntegrate = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  calculateNewAcceleration: (newStateGuess: PhysicsStateReal) => OSVector3,
  dt: number
): PhysicsStateReal => {
  // Handle zero time step case
  if (dt === 0) {
    return currentState;
  }

  // Clone vectors to avoid modifying originals
  const pos = currentState.position_m.clone();
  const vel = currentState.velocity_mps.clone();
  const acc = acceleration.clone(); // Current acceleration
  
  const halfDt = 0.5 * dt;
  const halfDtSquared = 0.5 * dt * dt;

  // Step 1: Update position using current velocity and acceleration
  // x_new = x + v*dt + 0.5*a*dt²
  const velTerm = vel.clone().multiplyScalar(dt);
  const accTerm = acc.clone().multiplyScalar(halfDtSquared);
  const newPosition = pos.clone().add(velTerm).add(accTerm);

  // Step 2: Calculate an intermediate velocity (v_half = v + 0.5*a*dt)
  const halfVel = vel.clone().add(acc.clone().multiplyScalar(halfDt));

  // Step 3: Calculate acceleration at the new position
  // Create a temporary state guess with the new position and intermediate velocity
  const stateGuess: PhysicsStateReal = { 
      ...currentState, 
      position_m: newPosition, 
      velocity_mps: halfVel // Use intermediate velocity for a potentially better guess
  };
  const newAcceleration = calculateNewAcceleration(stateGuess); // Use OSVector3

  // Step 4: Update velocity using average of old and new accelerations
  // v_new = v_half + 0.5*a_new*dt 
  // (v_half already includes 0.5*a*dt, so we add 0.5*a_new*dt)
  const newAccTerm = newAcceleration.clone().multiplyScalar(halfDt);
  const newVelocity = halfVel.clone().add(newAccTerm);

  return {
    ...currentState,
    position_m: newPosition,
    velocity_mps: newVelocity,
  };
}; 