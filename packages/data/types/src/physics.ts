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
 * Represents a Lagrange point in a two-body system
 */
export interface LagrangePoint {
  /** Lagrange point identifier (L1, L2, L3, L4, L5) */
  id: "L1" | "L2" | "L3" | "L4" | "L5";
  /** Position of the Lagrange point in 3D space (meters) */
  position_m: OSVector3;
  /** Velocity of the Lagrange point in the rotating frame (m/s) */
  velocity_mps?: OSVector3;
  /** Distance from the smaller body (M2) in meters */
  distanceFromSecondary_m: number;
  /** Distance from the larger body (M1) in meters */
  distanceFromPrimary_m: number;
  /** Stability classification */
  stability: "stable" | "unstable" | "marginally_stable";
  /** Effective potential at this point (J/kg) */
  effectivePotential_Jkg: number;
  /** Hill sphere radius for reference (meters) */
  hillSphereRadius_m: number;
}

/**
 * Parameters for a two-body system used in Lagrange point calculations
 */
export interface TwoBodySystem {
  /** Primary body (more massive) */
  primary: PhysicsStateReal;
  /** Secondary body (less massive) */
  secondary: PhysicsStateReal;
  /** Distance between the two bodies (meters) */
  separation_m: number;
  /** Mass ratio μ = M2/(M1+M2) */
  massRatio: number; // μ = M2/(M1+M2)
  /** Total mass of the two-body system (kg) */
  totalMass_kg: number;
}

/**
 * Configuration options for Lagrange point calculations
 */
export interface LagrangeCalculationOptions {
  /** Maximum iterations for quintic equation solver */
  maxIterations?: number;
  /** Convergence tolerance for numerical methods */
  tolerance?: number;
  /** Whether to include stability analysis */
  includeStability?: boolean;
  /** Whether to calculate effective potential */
  calculatePotential?: boolean;
}
