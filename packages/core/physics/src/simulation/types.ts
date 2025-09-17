import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialType,
  OrbitalParameters,
  PhysicsStateReal,
  SimulationMode,
  IntegratorType,
  AlgorithmType,
} from "@teskooano/data-types";
/**
 * Define a return type that includes both states and accelerations
 */
export interface SimulationStepResult {
  states: PhysicsStateReal[];
  accelerations: Map<string, OSVector3>;
  destroyedIds: Set<string>;
}

/**
 * Simulation configuration interface (local definition to avoid circular dependency)
 */
export interface SimulationConfiguration {
  mode: SimulationMode;
  integrator?: IntegratorType;
  algorithm?: AlgorithmType;
  /** Distance threshold for neighbor finding (in meters) */
  neighborDistance?: number;
  /** Whether to enable collision detection */
  collisionDetection?: boolean;
}

/**
 * Defines the parameters needed for a simulation step, excluding state and dt.
 */
export interface SimulationParameters {
  radii: Map<string | number, number>;
  isStar: Map<string | number, boolean>;
  bodyTypes: Map<string | number, CelestialType>;
  ignoreCollisions?: Map<string | number, boolean>;
  parentIds?: Map<string, string | undefined>;
  octreeSize?: number;
  barnesHutTheta?: number;
  simulationConfig: SimulationConfiguration;
  orbitalParameters?: Map<string | number, OrbitalParameters>;
  currentTime_s?: number;
}

/**
 * Enhanced simulation result with performance metrics and metadata
 */
export interface EnhancedSimulationResult {
  states: PhysicsStateReal[];
  accelerations: Map<string, OSVector3>;
  destroyedIds: Set<string>;
  destructionEvents: any[];
  metadata: {
    mode: SimulationMode;
    algorithm?: string;
    integrator?: string;
    executionTime: number;
    bodyCount: number;
    performanceProfile?: {
      relativeSpeed: number;
      memoryUsage: string;
      accuracy: string;
      isOptimal: boolean;
    };
    recommendations?: string[];
    warnings?: string[];
  };
}

/**
 * Parameters for the simulation manager
 */
export interface SimulationManagerParams {
  bodies: PhysicsStateReal[];
  deltaTime: number;
  configuration: SimulationConfiguration;

  // Required for ideal mode
  orbitalParameters?: Map<string, OrbitalParameters>;
  parentIds?: Map<string, string>;
  currentTime_s?: number;

  // Required for N-body mode
  radii?: Map<string, number>;
  isStar?: Map<string, boolean>;
  bodyTypes?: Map<string, any>;
  octreeSize?: number;
  barnesHutTheta?: number;
  ignoreCollisions?: Map<string, boolean>;

  // Optional preferences
  autoSelectAlgorithm?: boolean;
  performancePreferences?: {
    prioritizeAccuracy?: boolean;
    prioritizeSpeed?: boolean;
    maxMemoryUsage?: "low" | "medium" | "high";
  };
}

/**
 * Type for cached integrator functions
 */
export type IntegratorFunction = (
  body: PhysicsStateReal,
  currentAcceleration: OSVector3,
  calculateNewAcceleration: (stateGuess: PhysicsStateReal) => OSVector3,
  dt: number,
) => PhysicsStateReal;
