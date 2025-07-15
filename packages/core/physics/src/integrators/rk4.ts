import { PhysicsStateReal } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Updates the state of a body using the fourth-order Runge-Kutta (RK4) integration method.
 *
 * The RK4 method provides high accuracy (4th order) by using four estimates of the derivative
 * at different points within the time step. This method is particularly effective for smooth
 * force fields and provides excellent energy conservation properties.
 *
 * Algorithm:
 * k1 = f(t, y)
 * k2 = f(t + dt/2, y + k1*dt/2)
 * k3 = f(t + dt/2, y + k2*dt/2)
 * k4 = f(t + dt, y + k3*dt)
 * y_new = y + (dt/6)*(k1 + 2*k2 + 2*k3 + k4)
 *
 * Where f(t, y) represents the system derivative [velocity, acceleration].
 *
 * @param currentState - The current state of the body
 * @param acceleration - The current acceleration acting on the body (m/s^2)
 * @param calculateNewAcceleration - Function to recalculate acceleration for intermediate states
 * @param dt - The time step duration (seconds)
 * @returns The new state of the body after the time step
 */
export const rk4Integrate = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  calculateNewAcceleration: (stateGuess: PhysicsStateReal) => OSVector3,
  dt: number,
): PhysicsStateReal => {
  if (dt === 0) {
    return currentState;
  }

  const pos0 = currentState.position_m.clone();
  const vel0 = currentState.velocity_mps.clone();
  const acc0 = acceleration.clone();

  // RK4 Step 1: k1 = f(t, y)
  const k1_pos = vel0.clone();
  const k1_vel = acc0.clone();

  // RK4 Step 2: k2 = f(t + dt/2, y + k1*dt/2)
  const halfDt = dt * 0.5;
  const pos1 = pos0.clone().add(k1_pos.clone().multiplyScalar(halfDt));
  const vel1 = vel0.clone().add(k1_vel.clone().multiplyScalar(halfDt));

  const state1: PhysicsStateReal = {
    ...currentState,
    position_m: pos1,
    velocity_mps: vel1,
  };
  const acc1 = calculateNewAcceleration(state1);

  const k2_pos = vel1.clone();
  const k2_vel = acc1.clone();

  // RK4 Step 3: k3 = f(t + dt/2, y + k2*dt/2)
  const pos2 = pos0.clone().add(k2_pos.clone().multiplyScalar(halfDt));
  const vel2 = vel0.clone().add(k2_vel.clone().multiplyScalar(halfDt));

  const state2: PhysicsStateReal = {
    ...currentState,
    position_m: pos2,
    velocity_mps: vel2,
  };
  const acc2 = calculateNewAcceleration(state2);

  const k3_pos = vel2.clone();
  const k3_vel = acc2.clone();

  // RK4 Step 4: k4 = f(t + dt, y + k3*dt)
  const pos3 = pos0.clone().add(k3_pos.clone().multiplyScalar(dt));
  const vel3 = vel0.clone().add(k3_vel.clone().multiplyScalar(dt));

  const state3: PhysicsStateReal = {
    ...currentState,
    position_m: pos3,
    velocity_mps: vel3,
  };
  const acc3 = calculateNewAcceleration(state3);

  const k4_pos = vel3.clone();
  const k4_vel = acc3.clone();

  // Final step: y_new = y + (dt/6)*(k1 + 2*k2 + 2*k3 + k4)
  const dtSixth = dt / 6.0;

  const positionIncrement = k1_pos
    .clone()
    .add(k2_pos.clone().multiplyScalar(2))
    .add(k3_pos.clone().multiplyScalar(2))
    .add(k4_pos)
    .multiplyScalar(dtSixth);

  const velocityIncrement = k1_vel
    .clone()
    .add(k2_vel.clone().multiplyScalar(2))
    .add(k3_vel.clone().multiplyScalar(2))
    .add(k4_vel)
    .multiplyScalar(dtSixth);

  const newPosition = pos0.clone().add(positionIncrement);
  const newVelocity = vel0.clone().add(velocityIncrement);

  return {
    ...currentState,
    position_m: newPosition,
    velocity_mps: newVelocity,
  };
};

/**
 * Simplified RK4 integrator that doesn't require force recalculation.
 * Useful when acceleration is approximately constant over the timestep,
 * trading accuracy for performance.
 *
 * @param currentState - The current state of the body
 * @param acceleration - The current acceleration acting on the body (m/s^2)
 * @param dt - The time step duration (seconds)
 * @returns The new state of the body after the time step
 */
export const rk4IntegrateSimple = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  dt: number,
): PhysicsStateReal => {
  if (dt === 0) {
    return currentState;
  }

  const pos = currentState.position_m.clone();
  const vel = currentState.velocity_mps.clone();
  const acc = acceleration.clone();

  // For constant acceleration, RK4 simplifies significantly
  const halfDt = dt * 0.5;
  const dtSquared = dt * dt;

  // Position: x = x0 + v0*t + 0.5*a*t^2
  const newPosition = pos
    .clone()
    .addScaledVector(vel, dt)
    .addScaledVector(acc, 0.5 * dtSquared);

  // Velocity: v = v0 + a*t
  const newVelocity = vel.clone().addScaledVector(acc, dt);

  return {
    ...currentState,
    position_m: newPosition,
    velocity_mps: newVelocity,
  };
};
