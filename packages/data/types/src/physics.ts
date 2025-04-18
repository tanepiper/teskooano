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
