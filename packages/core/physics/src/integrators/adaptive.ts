import { PhysicsStateReal } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Configuration options for adaptive integration
 */
export interface AdaptiveConfig {
  /** Target relative error tolerance (default: 1e-8) */
  tolerance: number;
  /** Minimum allowed timestep (default: 1e-12) */
  minDt: number;
  /** Maximum allowed timestep (default: 1e-2) */
  maxDt: number;
  /** Safety factor for timestep adjustment (default: 0.9) */
  safetyFactor: number;
  /** Maximum timestep growth factor (default: 2.0) */
  maxGrowth: number;
  /** Maximum timestep shrink factor (default: 0.1) */
  maxShrink: number;
}

/**
 * Default configuration for adaptive integration
 */
export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  tolerance: 1e-8,
  minDt: 1e-12,
  maxDt: 1e-2,
  safetyFactor: 0.9,
  maxGrowth: 2.0,
  maxShrink: 0.1,
};

/**
 * Result of an adaptive integration step
 */
export interface AdaptiveStepResult {
  /** The new state after integration */
  newState: PhysicsStateReal;
  /** The actual timestep used */
  actualDt: number;
  /** The suggested next timestep */
  nextDt: number;
  /** The estimated error for this step */
  error: number;
  /** Number of substeps taken */
  stepsTaken: number;
}

/**
 * Adaptive Runge-Kutta integrator using embedded RK4(5) method (Dormand-Prince).
 * 
 * This integrator automatically adjusts the timestep to maintain a specified accuracy.
 * It uses a 5th-order method to estimate the solution and a 4th-order method to 
 * estimate the error, then adjusts the timestep accordingly.
 * 
 * The Dormand-Prince method is particularly well-suited for smooth systems and
 * provides excellent balance between accuracy and computational efficiency.
 * 
 * @param currentState - The current state of the body
 * @param acceleration - The current acceleration acting on the body (m/s^2)
 * @param calculateNewAcceleration - Function to recalculate acceleration for intermediate states
 * @param dt - The desired time step duration (will be adjusted)
 * @param config - Configuration options for adaptive integration
 * @returns Result containing new state, actual timestep used, and next suggested timestep
 */
export const adaptiveRKIntegrate = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  calculateNewAcceleration: (stateGuess: PhysicsStateReal) => OSVector3,
  dt: number,
  config: Partial<AdaptiveConfig> = {},
): AdaptiveStepResult => {
  const cfg = { ...DEFAULT_ADAPTIVE_CONFIG, ...config };
  
  if (dt === 0) {
    return {
      newState: currentState,
      actualDt: 0,
      nextDt: cfg.maxDt,
      error: 0,
      stepsTaken: 0,
    };
  }

  let currentDt = Math.max(cfg.minDt, Math.min(cfg.maxDt, Math.abs(dt)));
  let stepsTaken = 0;
  const maxSteps = 1000; // Prevent infinite loops

  while (stepsTaken < maxSteps) {
    stepsTaken++;
    
    const result = dormandPrinceStep(
      currentState,
      acceleration,
      calculateNewAcceleration,
      currentDt
    );

    const error = result.error;
    const tolerance = cfg.tolerance;

    if (error <= tolerance || currentDt <= cfg.minDt) {
      // Step accepted
      let nextDt = currentDt;
      
      if (error > 0) {
        // Calculate optimal next timestep
        const factor = cfg.safetyFactor * Math.pow(tolerance / error, 0.2);
        nextDt = currentDt * Math.max(cfg.maxShrink, Math.min(cfg.maxGrowth, factor));
      } else {
        // Very small error, can grow timestep
        nextDt = currentDt * cfg.maxGrowth;
      }
      
      nextDt = Math.max(cfg.minDt, Math.min(cfg.maxDt, nextDt));
      
      return {
        newState: result.newState,
        actualDt: currentDt,
        nextDt,
        error,
        stepsTaken,
      };
    } else {
      // Step rejected, reduce timestep
      const factor = cfg.safetyFactor * Math.pow(tolerance / error, 0.25);
      currentDt = currentDt * Math.max(cfg.maxShrink, factor);
      currentDt = Math.max(cfg.minDt, currentDt);
    }
  }

  // Fallback if max steps exceeded
  console.warn(`Adaptive integration exceeded ${maxSteps} steps, using fallback`);
  return {
    newState: rk4Step(currentState, acceleration, calculateNewAcceleration, cfg.minDt),
    actualDt: cfg.minDt,
    nextDt: cfg.minDt,
    error: cfg.tolerance * 10,
    stepsTaken,
  };
};

/**
 * Dormand-Prince RK4(5) method with embedded error estimation
 */
function dormandPrinceStep(
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  calculateNewAcceleration: (stateGuess: PhysicsStateReal) => OSVector3,
  dt: number,
): { newState: PhysicsStateReal; error: number } {
  const pos0 = currentState.position_m.clone();
  const vel0 = currentState.velocity_mps.clone();
  const acc0 = acceleration.clone();

  // Dormand-Prince coefficients
  const a21 = 1/5, a31 = 3/40, a32 = 9/40;
  const a41 = 44/45, a42 = -56/15, a43 = 32/9;
  const a51 = 19372/6561, a52 = -25360/2187, a53 = 64448/6561, a54 = -212/729;
  const a61 = 9017/3168, a62 = -355/33, a63 = 46732/5247, a64 = 49/176, a65 = -5103/18656;
  
  const b1 = 35/384, b3 = 500/1113, b4 = 125/192, b5 = -2187/6784, b6 = 11/84;
  const bb1 = 5179/57600, bb3 = 7571/16695, bb4 = 393/640, bb5 = -92097/339200, bb6 = 187/2100, bb7 = 1/40;

  // k1
  const k1_pos = vel0.clone();
  const k1_vel = acc0.clone();

  // k2
  const pos1 = pos0.clone().add(k1_pos.clone().multiplyScalar(a21 * dt));
  const vel1 = vel0.clone().add(k1_vel.clone().multiplyScalar(a21 * dt));
  const state1: PhysicsStateReal = { ...currentState, position_m: pos1, velocity_mps: vel1 };
  const acc1 = calculateNewAcceleration(state1);
  const k2_pos = vel1.clone();
  const k2_vel = acc1.clone();

  // k3
  const pos2 = pos0.clone()
    .add(k1_pos.clone().multiplyScalar(a31 * dt))
    .add(k2_pos.clone().multiplyScalar(a32 * dt));
  const vel2 = vel0.clone()
    .add(k1_vel.clone().multiplyScalar(a31 * dt))
    .add(k2_vel.clone().multiplyScalar(a32 * dt));
  const state2: PhysicsStateReal = { ...currentState, position_m: pos2, velocity_mps: vel2 };
  const acc2 = calculateNewAcceleration(state2);
  const k3_pos = vel2.clone();
  const k3_vel = acc2.clone();

  // k4
  const pos3 = pos0.clone()
    .add(k1_pos.clone().multiplyScalar(a41 * dt))
    .add(k2_pos.clone().multiplyScalar(a42 * dt))
    .add(k3_pos.clone().multiplyScalar(a43 * dt));
  const vel3 = vel0.clone()
    .add(k1_vel.clone().multiplyScalar(a41 * dt))
    .add(k2_vel.clone().multiplyScalar(a42 * dt))
    .add(k3_vel.clone().multiplyScalar(a43 * dt));
  const state3: PhysicsStateReal = { ...currentState, position_m: pos3, velocity_mps: vel3 };
  const acc3 = calculateNewAcceleration(state3);
  const k4_pos = vel3.clone();
  const k4_vel = acc3.clone();

  // k5
  const pos4 = pos0.clone()
    .add(k1_pos.clone().multiplyScalar(a51 * dt))
    .add(k2_pos.clone().multiplyScalar(a52 * dt))
    .add(k3_pos.clone().multiplyScalar(a53 * dt))
    .add(k4_pos.clone().multiplyScalar(a54 * dt));
  const vel4 = vel0.clone()
    .add(k1_vel.clone().multiplyScalar(a51 * dt))
    .add(k2_vel.clone().multiplyScalar(a52 * dt))
    .add(k3_vel.clone().multiplyScalar(a53 * dt))
    .add(k4_vel.clone().multiplyScalar(a54 * dt));
  const state4: PhysicsStateReal = { ...currentState, position_m: pos4, velocity_mps: vel4 };
  const acc4 = calculateNewAcceleration(state4);
  const k5_pos = vel4.clone();
  const k5_vel = acc4.clone();

  // k6
  const pos5 = pos0.clone()
    .add(k1_pos.clone().multiplyScalar(a61 * dt))
    .add(k2_pos.clone().multiplyScalar(a62 * dt))
    .add(k3_pos.clone().multiplyScalar(a63 * dt))
    .add(k4_pos.clone().multiplyScalar(a64 * dt))
    .add(k5_pos.clone().multiplyScalar(a65 * dt));
  const vel5 = vel0.clone()
    .add(k1_vel.clone().multiplyScalar(a61 * dt))
    .add(k2_vel.clone().multiplyScalar(a62 * dt))
    .add(k3_vel.clone().multiplyScalar(a63 * dt))
    .add(k4_vel.clone().multiplyScalar(a64 * dt))
    .add(k5_vel.clone().multiplyScalar(a65 * dt));
  const state5: PhysicsStateReal = { ...currentState, position_m: pos5, velocity_mps: vel5 };
  const acc5 = calculateNewAcceleration(state5);
  const k6_pos = vel5.clone();
  const k6_vel = acc5.clone();

  // 5th order solution
  const newPos = pos0.clone()
    .add(k1_pos.clone().multiplyScalar(b1 * dt))
    .add(k3_pos.clone().multiplyScalar(b3 * dt))
    .add(k4_pos.clone().multiplyScalar(b4 * dt))
    .add(k5_pos.clone().multiplyScalar(b5 * dt))
    .add(k6_pos.clone().multiplyScalar(b6 * dt));
  
  const newVel = vel0.clone()
    .add(k1_vel.clone().multiplyScalar(b1 * dt))
    .add(k3_vel.clone().multiplyScalar(b3 * dt))
    .add(k4_vel.clone().multiplyScalar(b4 * dt))
    .add(k5_vel.clone().multiplyScalar(b5 * dt))
    .add(k6_vel.clone().multiplyScalar(b6 * dt));

  // 4th order solution for error estimation
  const k7_pos = newVel.clone();
  const k7_vel = calculateNewAcceleration({ ...currentState, position_m: newPos, velocity_mps: newVel });

  const altPos = pos0.clone()
    .add(k1_pos.clone().multiplyScalar(bb1 * dt))
    .add(k3_pos.clone().multiplyScalar(bb3 * dt))
    .add(k4_pos.clone().multiplyScalar(bb4 * dt))
    .add(k5_pos.clone().multiplyScalar(bb5 * dt))
    .add(k6_pos.clone().multiplyScalar(bb6 * dt))
    .add(k7_pos.clone().multiplyScalar(bb7 * dt));
  
  const altVel = vel0.clone()
    .add(k1_vel.clone().multiplyScalar(bb1 * dt))
    .add(k3_vel.clone().multiplyScalar(bb3 * dt))
    .add(k4_vel.clone().multiplyScalar(bb4 * dt))
    .add(k5_vel.clone().multiplyScalar(bb5 * dt))
    .add(k6_vel.clone().multiplyScalar(bb6 * dt))
    .add(k7_vel.clone().multiplyScalar(bb7 * dt));

  // Error estimation
  const posError = newPos.clone().sub(altPos).length();
  const velError = newVel.clone().sub(altVel).length();
  const posScale = Math.max(pos0.length(), newPos.length());
  const velScale = Math.max(vel0.length(), newVel.length());
  
  const relPosError = posScale > 0 ? posError / posScale : posError;
  const relVelError = velScale > 0 ? velError / velScale : velError;
  const error = Math.max(relPosError, relVelError);

  return {
    newState: {
      ...currentState,
      position_m: newPos,
      velocity_mps: newVel,
    },
    error,
  };
}

/**
 * Fallback RK4 step for error cases
 */
function rk4Step(
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  calculateNewAcceleration: (stateGuess: PhysicsStateReal) => OSVector3,
  dt: number,
): PhysicsStateReal {
  const pos0 = currentState.position_m.clone();
  const vel0 = currentState.velocity_mps.clone();
  const acc0 = acceleration.clone();

  // Standard RK4
  const k1_pos = vel0.clone();
  const k1_vel = acc0.clone();

  const halfDt = dt * 0.5;
  const pos1 = pos0.clone().add(k1_pos.clone().multiplyScalar(halfDt));
  const vel1 = vel0.clone().add(k1_vel.clone().multiplyScalar(halfDt));
  const state1: PhysicsStateReal = { ...currentState, position_m: pos1, velocity_mps: vel1 };
  const k2_pos = vel1.clone();
  const k2_vel = calculateNewAcceleration(state1);

  const pos2 = pos0.clone().add(k2_pos.clone().multiplyScalar(halfDt));
  const vel2 = vel0.clone().add(k2_vel.clone().multiplyScalar(halfDt));
  const state2: PhysicsStateReal = { ...currentState, position_m: pos2, velocity_mps: vel2 };
  const k3_pos = vel2.clone();
  const k3_vel = calculateNewAcceleration(state2);

  const pos3 = pos0.clone().add(k3_pos.clone().multiplyScalar(dt));
  const vel3 = vel0.clone().add(k3_vel.clone().multiplyScalar(dt));
  const state3: PhysicsStateReal = { ...currentState, position_m: pos3, velocity_mps: vel3 };
  const k4_pos = vel3.clone();
  const k4_vel = calculateNewAcceleration(state3);

  const dtSixth = dt / 6.0;
  const newPos = pos0.clone()
    .add(k1_pos.clone().add(k2_pos.clone().multiplyScalar(2)).add(k3_pos.clone().multiplyScalar(2)).add(k4_pos).multiplyScalar(dtSixth));
  const newVel = vel0.clone()
    .add(k1_vel.clone().add(k2_vel.clone().multiplyScalar(2)).add(k3_vel.clone().multiplyScalar(2)).add(k4_vel).multiplyScalar(dtSixth));

  return {
    ...currentState,
    position_m: newPos,
    velocity_mps: newVel,
  };
}