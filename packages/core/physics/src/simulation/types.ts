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
  resonanceModeling?: boolean;
  resonanceInIdealMode?: boolean;
  resonanceInNBody?: boolean;
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
