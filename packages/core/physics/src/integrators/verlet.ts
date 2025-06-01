import { PhysicsStateReal } from "..";
import { OSVector3 } from "@teskooano/core-math";

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
  dt: number,
): PhysicsStateReal => {
  if (dt === 0) {
    return currentState;
  }

  const dtSquared = dt * dt;

  const stateCurrentPos = currentState.position_m;
  const statePrevPos = previousState.position_m;
  const stateAcc = acceleration;

  const displacement = stateCurrentPos.clone().sub(statePrevPos);

  const accEffect = stateAcc.clone().multiplyScalar(dtSquared);

  const newPosition = stateCurrentPos.clone().add(displacement).add(accEffect);

  const newVelocity = newPosition
    .clone()
    .sub(statePrevPos)
    .multiplyScalar(0.5 / dt);

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
  dt: number,
): PhysicsStateReal => {
  if (dt === 0) {
    return currentState;
  }

  const statePos = currentState.position_m;
  const stateVel = currentState.velocity_mps;
  const currentAcc = acceleration;

  const halfDt = 0.5 * dt;
  const halfDtSquared = 0.5 * dt * dt;

  const velContrib = stateVel.clone().multiplyScalar(dt);
  const accContrib = currentAcc.clone().multiplyScalar(halfDtSquared);
  const newPosition = statePos.clone().add(velContrib).add(accContrib);

  const firstHalfAccEffect = currentAcc.clone().multiplyScalar(halfDt);
  const v_intermediate = stateVel.clone().add(firstHalfAccEffect);

  const stateGuess: PhysicsStateReal = {
    ...currentState,
    position_m: newPosition,
    velocity_mps: v_intermediate,
  };
  const newCalculatedAcc = calculateNewAcceleration(stateGuess);

  const secondHalfAccEffect = newCalculatedAcc.clone().multiplyScalar(halfDt);
  const newVelocity = v_intermediate.clone().add(secondHalfAccEffect);

  return {
    ...currentState,
    position_m: newPosition,
    velocity_mps: newVelocity,
  };
};
