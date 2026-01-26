import { PhysicsStateReal } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Configuration for algorithm-specific parameters
 * Simplified to focus on currently implemented features
 */
export interface AlgorithmConfig {
  /** Distance threshold for neighbor finding (in meters) */
  neighborDistance?: number;
  /** Barnes-Hut approximation threshold (defaults to neighborDistance) */
  barnesHutThreshold?: number;
  /** Barnes-Hut opening angle (dimensionless theta parameter) */
  barnesHutTheta?: number;
}

/**
 * Standard interface for all force calculation algorithms
 *
 * All algorithms must implement this interface to ensure compatibility
 * with the simulation manager and integrator system.
 */
export interface ForceCalculationAlgorithm {
  /**
   * Calculate acceleration for a target body using the algorithm's method
   *
   * @param targetBody - The body to calculate acceleration for
   * @param allBodies - All bodies in the simulation
   * @param config - Algorithm-specific configuration
   * @returns Acceleration vector in m/s²
   */
  calculateAcceleration(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    config: AlgorithmConfig,
  ): OSVector3;

  /**
   * Initialize the algorithm with the given bodies
   * Called once at the start of simulation
   *
   * @param bodies - All bodies in the simulation
   */
  initialize?(bodies: PhysicsStateReal[]): void;

  /**
   * Update the algorithm's internal state
   * Called each simulation step
   *
   * @param bodies - All bodies in the simulation
   */
  update?(bodies: PhysicsStateReal[]): void;

  /**
   * Clean up resources
   * Called when simulation ends
   */
  dispose?(): void;
}

/**
 * Dependencies that algorithms may need
 */
export interface AlgorithmDependencies {
  /** WASM spatial partitioning service */
  spatialPartitioning: any; // Will be properly typed when we update SpatialPartitioning
}
