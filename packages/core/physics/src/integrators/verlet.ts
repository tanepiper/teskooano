import { PhysicsStateReal } from "@teskooano/data-types";
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

  const currentPos = currentState.position_m.clone();
  const prevPos = previousState.position_m.clone();
  const acc = acceleration.clone();

  const displacement = currentPos.clone().sub(prevPos);

  const newPosition = currentPos
    .clone()
    .add(displacement)
    .addScaledVector(acc, dtSquared);

  const newVelocity = newPosition
    .clone()
    .sub(prevPos)
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

  const pos = currentState.position_m.clone();
  const vel = currentState.velocity_mps.clone();
  const acc = acceleration.clone();

  const halfDt = 0.5 * dt;
  const halfDtSquared = 0.5 * dt * dt;

  const newPosition = pos
    .clone()
    .addScaledVector(vel, dt)
    .addScaledVector(acc, halfDtSquared);

  const halfVel = vel.clone().addScaledVector(acc, halfDt);

  const stateGuess: PhysicsStateReal = {
    ...currentState,
    position_m: newPosition,
    velocity_mps: halfVel,
  };
  const newAcceleration = calculateNewAcceleration(stateGuess);

  const newVelocity = halfVel.clone().addScaledVector(newAcceleration, halfDt);

  return {
    ...currentState,
    position_m: newPosition,
    velocity_mps: newVelocity,
  };
};

/**
 * Optimized Velocity Verlet integrator with pre-allocated vectors.
 * Eliminates vector allocations in the hot path for better performance.
 *
 * Position update:
 * x_new = x + v*dt + 0.5*a*dt²
 *
 * Velocity update:
 * v_new = v + 0.5*(a + a_new)*dt
 *
 * This requires the acceleration to be recalculated based on the new position.
 */
export class VelocityVerletIntegrator {
  // Pre-allocated working vectors (created once, reused every call)
  private readonly _pos = new OSVector3();
  private readonly _vel = new OSVector3();
  private readonly _acc = new OSVector3();
  private readonly _newPos = new OSVector3();
  private readonly _halfVel = new OSVector3();
  private readonly _newVel = new OSVector3();
  private readonly _stateGuess: PhysicsStateReal;

  constructor() {
    // Pre-allocate state guess object with vectors
    this._stateGuess = {
      id: "",
      mass_kg: 0,
      position_m: new OSVector3(),
      velocity_mps: new OSVector3(),
    };
  }

  /**
   * Integrate using Velocity Verlet method with zero allocations.
   *
   * @param currentState - The current state of the body.
   * @param acceleration - The current acceleration of the body (m/s^2).
   * @param calculateNewAcceleration - Function to calculate acceleration at the new state.
   * @param dt - The time step duration (seconds).
   * @param out - Output state object to reuse (avoids allocation).
   * @returns The new REAL state of the body after the time step (same as out parameter).
   */
  integrate(
    currentState: PhysicsStateReal,
    acceleration: OSVector3,
    calculateNewAcceleration: (newStateGuess: PhysicsStateReal) => OSVector3,
    dt: number,
    out: PhysicsStateReal,
  ): PhysicsStateReal {
    if (dt === 0) {
      out.id = currentState.id;
      out.mass_kg = currentState.mass_kg;
      out.position_m.copy(currentState.position_m);
      out.velocity_mps.copy(currentState.velocity_mps);
      return out;
    }

    const halfDt = 0.5 * dt;
    const halfDtSquared = 0.5 * dt * dt;

    // Copy to working vectors (no allocation)
    this._pos.copy(currentState.position_m);
    this._vel.copy(currentState.velocity_mps);
    this._acc.copy(acceleration);

    // newPos = pos + vel*dt + 0.5*acc*dt²
    this._newPos
      .copy(this._pos)
      .addScaledVector(this._vel, dt)
      .addScaledVector(this._acc, halfDtSquared);

    // halfVel = vel + 0.5*acc*dt
    this._halfVel.copy(this._vel).addScaledVector(this._acc, halfDt);

    // Prepare state guess for acceleration calculation
    this._stateGuess.id = currentState.id;
    this._stateGuess.mass_kg = currentState.mass_kg;
    this._stateGuess.position_m.copy(this._newPos);
    this._stateGuess.velocity_mps.copy(this._halfVel);

    // Calculate new acceleration at predicted position
    const newAcceleration = calculateNewAcceleration(this._stateGuess);
    this._acc.copy(newAcceleration);

    // newVel = halfVel + 0.5*newAcc*dt
    this._newVel.copy(this._halfVel).addScaledVector(this._acc, halfDt);

    // Update output (reuse object)
    out.id = currentState.id;
    out.mass_kg = currentState.mass_kg;
    out.position_m.copy(this._newPos);
    out.velocity_mps.copy(this._newVel);

    return out;
  }
}
