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
 * The type of physics engine to use for the simulation.
 */
export type PhysicsEngineType = "euler" | "symplectic" | "verlet" | "ideal";

/**
 * The quality of the trail rendering.
 */

/**
 * Represents the fundamental properties of a celestial body required for rendering and simulation.
 */
