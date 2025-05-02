import { PhysicsStateReal, Integrator } from "../types";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Updates the state of a body using the standard Euler integration method.
 *
 * Velocity update:
 * v_new = v_old + a * dt
 *
 * Position update:
 * p_new = p_old + v_old * dt
 *
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
  acceleration: OSVector3,
  dt: number,
): PhysicsStateReal => {
  if (dt === 0) {
    return currentState;
  }

  const pos_m = currentState.position_m.clone();
  const vel_mps = currentState.velocity_mps.clone();
  const acc = acceleration.clone();

  const newVelocity_mps = vel_mps.clone().add(acc.multiplyScalar(dt));

  const newPosition_m = pos_m.clone().add(vel_mps.multiplyScalar(dt));

  return {
    ...currentState,
    position_m: newPosition_m,
    velocity_mps: newVelocity_mps,
  };
};
