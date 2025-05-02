import type { OSVector3 } from "@teskooano/core-math";

/**
 * Represents the physics state of a body in REAL-WORLD units.
 */
export interface PhysicsStateReal {
  /** Unique identifier matching the CelestialObject id. */
  id: string;
  /** Mass in kilograms (kg). */
  mass_kg: number;
  /** Position vector in meters (m). */
  position_m: OSVector3;
  /** Velocity vector in meters per second (m/s). */
  velocity_mps: OSVector3;
  /** Optional: Tracks ticks since last update for throttling */
  ticksSinceLastPhysicsUpdate?: number;
}

/**
 * Interface for a function that calculates the net force acting on a specific body
 * within a system of bodies (using REAL units).
 *
 * @param targetBody - The body (real state) for which to calculate the net force.
 * @param allBodies - An array of all bodies (real state) in the system.
 * @returns The net force vector acting on the targetBody (Newtons - kg*m/s^2).
 */
export type NetForceCalculator = (
  targetBody: PhysicsStateReal,
  allBodies: readonly PhysicsStateReal[],
) => OSVector3;

/**
 * Interface for a function that calculates the force exerted by one body on another (using REAL units).
 * Used as a building block for NetForceCalculators.
 *
 * @param body1 - The body (real state) exerting the force.
 * @param body2 - The body (real state) experiencing the force.
 * @returns The force vector acting on body2 due to body1 (Newtons - kg*m/s^2).
 */
export type PairForceCalculator = (
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
) => OSVector3;

/**
 * Interface for an integration method (using REAL units).
 * Takes the current state and acceleration, returns the new state.
 * For methods like Velocity Verlet, it might also need a way to recalculate acceleration.
 */
export type Integrator = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  dt: number,

  calculateNewAcceleration?: (newStateGuess: PhysicsStateReal) => OSVector3,
) => PhysicsStateReal;
