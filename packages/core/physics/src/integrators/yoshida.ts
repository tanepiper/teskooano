import { PhysicsStateReal } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Configuration for symplectic integrators
 */
export interface SymplecticConfig {
  /** The symplectic method to use */
  method: "yoshida4" | "forest-ruth" | "pefrl" | "simple-leapfrog";
  /** Order of the method (informational) */
  order: 2 | 4 | 6;
}

/**
 * Default symplectic configuration
 */
export const DEFAULT_SYMPLECTIC_CONFIG: SymplecticConfig = {
  method: "yoshida4",
  order: 4,
};

/**
 * Fourth-order Yoshida symplectic integrator.
 *
 * The Yoshida method is a composition of lower-order symplectic steps that
 * achieves 4th-order accuracy while preserving the symplectic structure.
 * This results in excellent long-term energy conservation, making it ideal
 * for planetary dynamics and other Hamiltonian systems.
 *
 * The method uses three substeps with specific coefficients derived from
 * the requirement that the method be symplectic and 4th-order accurate.
 *
 * @param currentState - The current state of the body
 * @param acceleration - The current acceleration acting on the body (m/s^2)
 * @param calculateNewAcceleration - Function to recalculate acceleration after position updates
 * @param dt - The time step duration (seconds)
 * @returns The new state of the body after the symplectic integration step
 */
export const yoshida4Integrate = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  calculateNewAcceleration: (stateGuess: PhysicsStateReal) => OSVector3,
  dt: number,
): PhysicsStateReal => {
  if (dt === 0) {
    return currentState;
  }

  // Yoshida 4th-order coefficients
  const w0 = -Math.cbrt(2) / (2 - Math.cbrt(2));
  const w1 = 1 / (2 - Math.cbrt(2));
  const c1 = w1 / 2;
  const c4 = w1 / 2;
  const c2 = (w0 + w1) / 2;
  const c3 = (w0 + w1) / 2;
  const d1 = w1;
  const d3 = w1;
  const d2 = w0;

  let pos = currentState.position_m.clone();
  let vel = currentState.velocity_mps.clone();
  let acc = acceleration.clone();

  // Substep 1
  pos = pos.clone().add(vel.clone().multiplyScalar(c1 * dt));
  const newState1: PhysicsStateReal = {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
  acc = calculateNewAcceleration(newState1);
  vel = vel.clone().add(acc.clone().multiplyScalar(d1 * dt));

  // Substep 2
  pos = pos.clone().add(vel.clone().multiplyScalar(c2 * dt));
  const newState2: PhysicsStateReal = {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
  acc = calculateNewAcceleration(newState2);
  vel = vel.clone().add(acc.clone().multiplyScalar(d2 * dt));

  // Substep 3
  pos = pos.clone().add(vel.clone().multiplyScalar(c3 * dt));
  const newState3: PhysicsStateReal = {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
  acc = calculateNewAcceleration(newState3);
  vel = vel.clone().add(acc.clone().multiplyScalar(d3 * dt));

  // Final position update
  pos = pos.clone().add(vel.clone().multiplyScalar(c4 * dt));

  return {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
};

/**
 * Forest-Ruth symplectic integrator.
 *
 * This is another 4th-order symplectic integrator with different coefficients
 * than Yoshida. It may perform better for certain types of problems.
 *
 * @param currentState - The current state of the body
 * @param acceleration - The current acceleration acting on the body (m/s^2)
 * @param calculateNewAcceleration - Function to recalculate acceleration after position updates
 * @param dt - The time step duration (seconds)
 * @returns The new state of the body after the symplectic integration step
 */
export const forestRuthIntegrate = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  calculateNewAcceleration: (stateGuess: PhysicsStateReal) => OSVector3,
  dt: number,
): PhysicsStateReal => {
  if (dt === 0) {
    return currentState;
  }

  // Forest-Ruth coefficients
  const theta = 1 / (2 - Math.pow(2, 1 / 3));
  const c1 = theta / 2;
  const c4 = theta / 2;
  const c2 = (1 - theta) / 2;
  const c3 = (1 - theta) / 2;
  const d1 = theta;
  const d3 = theta;
  const d2 = 1 - 2 * theta;

  let pos = currentState.position_m.clone();
  let vel = currentState.velocity_mps.clone();
  let acc = acceleration.clone();

  // Substep 1
  pos = pos.clone().add(vel.clone().multiplyScalar(c1 * dt));
  const newState1: PhysicsStateReal = {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
  acc = calculateNewAcceleration(newState1);
  vel = vel.clone().add(acc.clone().multiplyScalar(d1 * dt));

  // Substep 2
  pos = pos.clone().add(vel.clone().multiplyScalar(c2 * dt));
  const newState2: PhysicsStateReal = {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
  acc = calculateNewAcceleration(newState2);
  vel = vel.clone().add(acc.clone().multiplyScalar(d2 * dt));

  // Substep 3
  pos = pos.clone().add(vel.clone().multiplyScalar(c3 * dt));
  const newState3: PhysicsStateReal = {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
  acc = calculateNewAcceleration(newState3);
  vel = vel.clone().add(acc.clone().multiplyScalar(d3 * dt));

  // Final position update
  pos = pos.clone().add(vel.clone().multiplyScalar(c4 * dt));

  return {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
};

/**
 * PEFRL (Position Extended Forest-Ruth-Like) symplectic integrator.
 *
 * This is a highly optimized 4th-order symplectic integrator that minimizes
 * the leading error terms. It's particularly effective for problems where
 * energy conservation is critical over very long integration times.
 *
 * @param currentState - The current state of the body
 * @param acceleration - The current acceleration acting on the body (m/s^2)
 * @param calculateNewAcceleration - Function to recalculate acceleration after position updates
 * @param dt - The time step duration (seconds)
 * @returns The new state of the body after the symplectic integration step
 */
export const pefrlIntegrate = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  calculateNewAcceleration: (stateGuess: PhysicsStateReal) => OSVector3,
  dt: number,
): PhysicsStateReal => {
  if (dt === 0) {
    return currentState;
  }

  // PEFRL coefficients (optimized for minimal error)
  const xi = 0.1786178958448091;
  const lambda = -0.2123418310626054;
  const chi = -0.06626458266981849;

  const c1 = xi;
  const c2 = chi;
  const c3 = 1 - 2 * (chi + xi);
  const c4 = chi;
  const c5 = xi;

  const d1 = (1 - 2 * lambda) / 2;
  const d2 = lambda;
  const d3 = lambda;
  const d4 = (1 - 2 * lambda) / 2;

  let pos = currentState.position_m.clone();
  let vel = currentState.velocity_mps.clone();
  let acc = acceleration.clone();

  // Substep 1
  pos = pos.clone().add(vel.clone().multiplyScalar(c1 * dt));
  const newState1: PhysicsStateReal = {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
  acc = calculateNewAcceleration(newState1);
  vel = vel.clone().add(acc.clone().multiplyScalar(d1 * dt));

  // Substep 2
  pos = pos.clone().add(vel.clone().multiplyScalar(c2 * dt));
  const newState2: PhysicsStateReal = {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
  acc = calculateNewAcceleration(newState2);
  vel = vel.clone().add(acc.clone().multiplyScalar(d2 * dt));

  // Substep 3
  pos = pos.clone().add(vel.clone().multiplyScalar(c3 * dt));
  const newState3: PhysicsStateReal = {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
  acc = calculateNewAcceleration(newState3);
  vel = vel.clone().add(acc.clone().multiplyScalar(d3 * dt));

  // Substep 4
  pos = pos.clone().add(vel.clone().multiplyScalar(c4 * dt));
  const newState4: PhysicsStateReal = {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
  acc = calculateNewAcceleration(newState4);
  vel = vel.clone().add(acc.clone().multiplyScalar(d4 * dt));

  // Final position update
  pos = pos.clone().add(vel.clone().multiplyScalar(c5 * dt));

  return {
    ...currentState,
    position_m: pos,
    velocity_mps: vel,
  };
};

/**
 * Simple leapfrog integrator (2nd order symplectic).
 *
 * This is the classic symplectic integrator, simple and robust.
 * While only 2nd order, it has excellent energy conservation properties.
 *
 * @param currentState - The current state of the body
 * @param acceleration - The current acceleration acting on the body (m/s^2)
 * @param calculateNewAcceleration - Function to recalculate acceleration after position updates
 * @param dt - The time step duration (seconds)
 * @returns The new state of the body after the symplectic integration step
 */
export const leapfrogIntegrate = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  calculateNewAcceleration: (stateGuess: PhysicsStateReal) => OSVector3,
  dt: number,
): PhysicsStateReal => {
  if (dt === 0) {
    return currentState;
  }

  const pos = currentState.position_m.clone();
  const vel = currentState.velocity_mps.clone();
  const acc = acceleration.clone();

  // Leapfrog: kick-drift-kick
  const halfDt = dt * 0.5;

  // Half velocity update
  const velHalf = vel.clone().add(acc.clone().multiplyScalar(halfDt));

  // Full position update
  const newPos = pos.clone().add(velHalf.clone().multiplyScalar(dt));

  // Recalculate acceleration at new position
  const newState: PhysicsStateReal = {
    ...currentState,
    position_m: newPos,
    velocity_mps: velHalf,
  };
  const newAcc = calculateNewAcceleration(newState);

  // Final half velocity update
  const newVel = velHalf.clone().add(newAcc.clone().multiplyScalar(halfDt));

  return {
    ...currentState,
    position_m: newPos,
    velocity_mps: newVel,
  };
};

/**
 * Generic symplectic integrator that dispatches to the specified method.
 *
 * @param currentState - The current state of the body
 * @param acceleration - The current acceleration acting on the body (m/s^2)
 * @param calculateNewAcceleration - Function to recalculate acceleration after position updates
 * @param dt - The time step duration (seconds)
 * @param config - Configuration specifying which symplectic method to use
 * @returns The new state of the body after the symplectic integration step
 */
export const symplecticIntegrate = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  calculateNewAcceleration: (stateGuess: PhysicsStateReal) => OSVector3,
  dt: number,
  config: SymplecticConfig = DEFAULT_SYMPLECTIC_CONFIG,
): PhysicsStateReal => {
  switch (config.method) {
    case "yoshida4":
      return yoshida4Integrate(
        currentState,
        acceleration,
        calculateNewAcceleration,
        dt,
      );
    case "forest-ruth":
      return forestRuthIntegrate(
        currentState,
        acceleration,
        calculateNewAcceleration,
        dt,
      );
    case "pefrl":
      return pefrlIntegrate(
        currentState,
        acceleration,
        calculateNewAcceleration,
        dt,
      );
    case "simple-leapfrog":
      return leapfrogIntegrate(
        currentState,
        acceleration,
        calculateNewAcceleration,
        dt,
      );
    default:
      console.warn(
        `Unknown symplectic method: ${config.method}, falling back to yoshida4`,
      );
      return yoshida4Integrate(
        currentState,
        acceleration,
        calculateNewAcceleration,
        dt,
      );
  }
};
