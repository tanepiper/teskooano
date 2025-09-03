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

/**
 * Represents the stability analysis of an orbital body
 */
export interface StabilityReport {
  /** Whether the orbit is currently stable */
  isStable: boolean;
  /** Position error magnitude in meters */
  positionError: number;
  /** Velocity error magnitude in m/s */
  velocityError: number;
  /** Recommended correction magnitude */
  correctionMagnitude: number;
  /** Recommended action to take */
  recommendedAction: "none" | "position" | "velocity" | "both";
  /** Confidence level of the analysis (0-1) */
  confidence: number;
}

/**
 * Represents a correction vector for hybrid mode
 */
export interface CorrectionVector {
  /** Position correction in meters */
  positionCorrection: OSVector3;
  /** Velocity correction in m/s */
  velocityCorrection: OSVector3;
  /** Whether this correction preserves momentum */
  preservesMomentum: boolean;
  /** Priority of this correction (higher = more important) */
  priority: number;
}

/**
 * Configuration for hybrid mode corrections
 */
export interface HybridCorrectionConfig {
  /** Frequency of corrections */
  frequency: "per-step" | "adaptive" | "manual";
  /** Threshold for applying corrections (0.01 = 1%) */
  threshold: number;
  /** Whether to preserve total momentum */
  preserveMomentum: boolean;
  /** Whether to apply corrections hierarchically */
  hierarchicalCorrections: boolean;
  /** Maximum correction magnitude to prevent over-correction */
  maxCorrectionMagnitude: number;
  /** Adaptive correction parameters */
  adaptive: {
    /** Base correction frequency */
    baseFrequency: number;
    /** Time scale scaling factor */
    timeScaleFactor: number;
    /** Body count scaling factor */
    bodyCountFactor: number;
    /** Error magnitude scaling factor */
    errorFactor: number;
  };
}
