export * from "./celestial";

import * as THREE from "three";
import { PhysicsStateReal } from "./physics";
import { OSVector3 } from "@teskooano/core-math";

/**
 * State interface for the simulation
 */
export interface SimulationState {
  time: number;
  timeScale: number;
  paused: boolean;
  selectedObject: string | null;
  focusedObjectId: string | null;
  camera: {
    position: OSVector3;
    target: OSVector3;
    fov: number;
  };
}

export type PairForceCalculator = (
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  G?: number,
) => OSVector3;

/**
 * Function type for physics integrators that update body state
 */
export type Integrator = (
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  dt: number,
) => PhysicsStateReal;

/**
 * The simulation mode determines the type of physics calculation used.
 */
export enum SimulationMode {
  IDEAL = "ideal", // Keplerian/ideal orbital mechanics
  NBODY = "nbody", // Full N-body physics simulation
}

/**
 * The numerical integration method used for N-Body simulations.
 * Simplified to only include symplectic integrators for optimal energy conservation.
 */
export enum IntegratorType {
  /** @deprecated Use VERLET instead */
  EULER = "euler",
  /** @deprecated Use VERLET instead */
  SYMPLECTIC = "symplectic",
  /** Velocity Verlet - recommended symplectic integrator for N-body simulations */
  VERLET = "verlet",
  /** @deprecated Use VERLET instead */
  RK4 = "rk4",
  /** @deprecated Use VERLET instead */
  ADAPTIVE = "adaptive",
  /** @deprecated Use VERLET instead */
  YOSHIDA4 = "yoshida4",
  /** @deprecated Use VERLET instead */
  FOREST_RUTH = "forest-ruth",
  /** @deprecated Use VERLET instead */
  PEFRL = "pefrl",
  /** Leapfrog - alternative symplectic integrator */
  LEAPFROG = "leapfrog",
}

/**
 * The force calculation algorithm used for N-Body simulations.
 * Simplified to only include Barnes-Hut, which is optimal for planetary N-body simulations.
 */
export enum AlgorithmType {
  /** @deprecated Use BARNES_HUT instead */
  NEIGHBOR_BASED = "neighbor-based",
  /** Barnes-Hut - O(N log N) tree-based approximation, optimal for planetary systems */
  BARNES_HUT = "barnes-hut",
  /** @deprecated Removed - use BARNES_HUT instead */
  FMM = "fmm",
  /** @deprecated Removed - use BARNES_HUT instead */
  P3M = "p3m",
  /** @deprecated Removed - use BARNES_HUT instead */
  TREE_PM = "tree-pm",
}

/**
 * Configuration for the simulation physics system.
 */
export interface SimulationConfiguration {
  mode: SimulationMode;
  integrator?: IntegratorType;
  algorithm?: AlgorithmType;
  neighborDistance?: number;
  collisionDetection?: boolean;
}

// Note: Validation utilities are available in @teskooano/core-state

/**
 * The quality of the trail rendering.
 */

/**
 * Represents the fundamental properties of a celestial body required for rendering and simulation.
 */
