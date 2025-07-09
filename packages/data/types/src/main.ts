export * from "./celestial";
export * from "./scaling";

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
export type SimulationMode = "ideal" | "nbody";

/**
 * The numerical integration method used for N-Body simulations.
 */
export type IntegratorType = 
  | "euler" | "symplectic" | "verlet" | "rk4" | "adaptive"
  | "yoshida4" | "forest-ruth" | "pefrl" | "leapfrog";

/**
 * The force calculation algorithm used for N-Body simulations.
 */
export type AlgorithmType = 
  | "direct" | "barnes-hut" | "fmm" | "p3m" 
  | "tree-pm";

/**
 * Configuration for the simulation physics system.
 */
export interface SimulationConfiguration {
  mode: SimulationMode;
  integrator?: IntegratorType;
  algorithm?: AlgorithmType;
}

// Note: Validation utilities are available in @teskooano/core-state

/**
 * The quality of the trail rendering.
 */

/**
 * Represents the fundamental properties of a celestial body required for rendering and simulation.
 */
