import type { PhysicsStateReal } from "@teskooano/data-types";
import type { SimulationConfiguration } from "@teskooano/core-state";
import type { OSVector3 } from "@teskooano/core-math";

/**
 * Result of a simulation step containing updated bodies and metadata
 */
export interface SimulationStepResult {
  bodies: Record<string, PhysicsStateReal>;
  metadata: {
    stepTime: number;
    algorithmUsed: string;
    integratorUsed: string;
    forceCalculationTime?: number;
    integrationTime?: number;
    collisionDetectionTime?: number;
    totalBodies: number;
  };
}

/**
 * Parameters passed to simulation strategies
 */
export interface SimulationParameters {
  bodies: Record<string, PhysicsStateReal>;
  deltaTime: number;
  configuration: SimulationConfiguration;
  octreeSize?: number;
  theta?: number; // Barnes-Hut approximation parameter
}

/**
 * Base interface for all simulation strategies
 */
export interface ISimulationStrategy {
  readonly name: string;
  readonly description: string;
  readonly complexity: string; // O(N), O(N log N), O(N²)

  /**
   * Performs one simulation step
   */
  simulate(params: SimulationParameters): SimulationStepResult;

  /**
   * Validates if this strategy can handle the given configuration
   */
  canHandle(config: SimulationConfiguration): boolean;

  /**
   * Gets recommended parameters for this strategy
   */
  getRecommendedParameters(): Partial<SimulationParameters>;
}

/**
 * Interface for N-Body force calculation algorithms
 */
export interface IAlgorithmStrategy {
  readonly name: string;
  readonly complexity: string;
  readonly recommendedMinBodies: number;
  readonly recommendedMaxBodies: number;

  /**
   * Calculates forces for all bodies
   */
  calculateForces(
    bodies: Record<string, PhysicsStateReal>,
    params: SimulationParameters,
  ): Record<string, OSVector3>;

  /**
   * Returns true if this algorithm is optimal for the given body count
   */
  isOptimalFor(bodyCount: number): boolean;
}

/**
 * Interface for numerical integration methods
 */
export interface IIntegratorStrategy {
  readonly name: string;
  readonly order: number; // Integration order (1st, 2nd, 4th, etc.)
  readonly isAdaptive: boolean;
  readonly isSymplectic: boolean; // Energy preserving

  /**
   * Integrates position and velocity for one time step
   */
  integrate(
    body: PhysicsStateReal,
    force: OSVector3,
    deltaTime: number,
  ): PhysicsStateReal;

  /**
   * Returns recommended time step for stability
   */
  getRecommendedTimeStep(
    bodies: Record<string, PhysicsStateReal>,
    maxTimeStep: number,
  ): number;
}
