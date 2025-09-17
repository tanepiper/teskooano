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
 */
export enum IntegratorType {
  EULER = "euler", // Simple Euler integration
  SYMPLECTIC = "symplectic", // Symplectic Euler (energy preserving)
  VERLET = "verlet", // Velocity Verlet (stable, reversible)
  RK4 = "rk4", // Runge-Kutta 4th order (high accuracy)
  ADAPTIVE = "adaptive", // Adaptive step size (auto-optimizing)
  YOSHIDA4 = "yoshida4", // 4th-order symplectic (Yoshida method)
  FOREST_RUTH = "forest-ruth", // 4th-order symplectic (Forest-Ruth method)
  PEFRL = "pefrl", // Optimized 4th-order symplectic (PEFRL)
  LEAPFROG = "leapfrog", // Classic 2nd-order symplectic
}

/**
 * The force calculation algorithm used for N-Body simulations.
 */
export enum AlgorithmType {
  NEIGHBOR_BASED = "neighbor-based", // Direct N² calculation (for small systems)
  BARNES_HUT = "barnes-hut", // O(N log N) - tree-based approximation
  FMM = "fmm", // O(N) - Fast Multipole Method
  P3M = "p3m", // O(N log N) - Particle-Mesh hybrid
  TREE_PM = "tree-pm", // O(N log N) - Tree-PM hybrid (recommended)
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
