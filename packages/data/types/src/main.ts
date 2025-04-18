export * from "./celestial";
export * from "./scaling";

// Import THREE.Vector3 directly for use in type definitions
import * as THREE from "three";
import { PhysicsStateReal } from "./physics";

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
    position: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
  };
}

export type PairForceCalculator = (
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  G?: number,
) => THREE.Vector3;

/**
 * Function type for physics integrators that update body state
 */
export type Integrator = (
  currentState: PhysicsStateReal,
  acceleration: THREE.Vector3,
  dt: number,
) => PhysicsStateReal;
