import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialType,
  PhysicsStateReal,
  OrbitalParameters,
} from "@teskooano/data-types";
import {
  handleCollisions,
  type DestructionEvent,
} from "../collision/collision";
/**
 * Define a return type that includes both states and accelerations
 */
export interface SimulationStepResult {
  states: PhysicsStateReal[];
  accelerations: Map<string, OSVector3>;
  destroyedIds: Set<string | number>;
  destructionEvents: DestructionEvent[];
}

/**
 * Simulation configuration interface (local definition to avoid circular dependency)
 */
export interface SimulationConfiguration {
  mode: "ideal" | "nbody";
  integrator?: 
    | "euler" | "symplectic" | "verlet" | "rk4" | "adaptive"
    | "yoshida4" | "forest-ruth" | "pefrl" | "leapfrog";
  algorithm?: 
    | "direct" | "barnes-hut" | "fmm" | "p3m" 
    | "tree-pm";
}

/**
 * Defines the parameters needed for a simulation step, excluding state and dt.
 */
export interface SimulationParameters {
  radii: Map<string | number, number>;
  isStar: Map<string | number, boolean>;
  bodyTypes: Map<string | number, CelestialType>;
  parentIds?: Map<string | number, string | undefined>;
  octreeSize?: number;
  barnesHutTheta?: number;
  simulationConfig: SimulationConfiguration;
  orbitalParameters?: Map<string | number, OrbitalParameters>;
  currentTime_s?: number;
}
