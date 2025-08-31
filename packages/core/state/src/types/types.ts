import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialObject,
  DeviceTier,
  SimulationMode,
} from "@teskooano/data-types";

/**
 * Defines the state of the camera in the simulation.
 */
export interface CameraState {
  /** The position of the camera in 3D space (real-world units, typically meters if not otherwise specified by context). */
  position: OSVector3;
  /** The point in 3D space the camera is looking at (real-world units). */
  target: OSVector3;
  /** The vertical field of view of the camera in degrees. */
  fov: number;
}

/**
 * Configuration for the simulation physics system.
 * Supports both ideal (Keplerian) and N-body physics modes.
 */
export interface SimulationConfiguration {
  /**
   * The mode of the simulation.
   */
  mode: SimulationMode;
  /**
   * The integrator type to use for the simulation.
   */
  integrator?: string;
  /**
   * The algorithm type to use for the simulation.
   */
  algorithm?: string;
  /** Enable resonance-aware corrections and analysis */
  resonanceModeling?: boolean;
  /** Apply resonance corrections during ideal (Keplerian) mode */
  resonanceInIdealMode?: boolean;
  /** Compute/display resonance state during N-body mode (no force override) */
  resonanceInNBody?: boolean;
}

/**
 * Defines settings related to visual aspects of the simulation, like trails.
 */
export interface VisualSettingsState {
  /** Renders orbit paths for all objects if true. */
  showAllOrbits: boolean;
  /** Renders labels for all objects if true. */
  showAllLabels: boolean;
  /** Renders AU (Astronomical Unit) marker lines from the primary star if true. */
  showAuMarkers: boolean;
  /** A multiplier affecting the length of rendered trails for objects. */
  trailLengthMultiplier: number;
  /** The number of steps to calculate for trajectory prediction. */
  predictionSteps: number;
  /** The duration (in simulation years) to predict trajectories for. */
  predictionDuration: number;
}

/**
 * Represents the overall state of the simulation at any given time.
 * This includes time, control parameters, selected objects, camera, and performance settings.
 */
export interface SimulationState {
  /** The current accumulated simulation time in seconds. */
  time: number;
  /** The scaling factor for simulation time (e.g., 2 means simulation runs twice as fast as real-time). */
  timeScale: number;
  /** The start date for the simulation (base date + time = current simulation date). */
  startDate: Date;
  /** Indicates whether the simulation is currently paused. */
  paused: boolean;
  /** The ID of the currently selected celestial object, or null if none selected. */
  selectedObject: string | null;
  /** The ID of the celestial object that the camera is focused on, or null. */
  focusedObjectId: string | null;
  /** The current state of the simulation camera. */
  camera: CameraState;
  /** The simulation configuration (mode, algorithm, integrator). */
  simulationConfig: SimulationConfiguration;
  /** Current visual settings for the simulation. */
  visualSettings: VisualSettingsState;
  /** Optional renderer statistics. */
  renderer?: {
    /** Frames per second. */
    fps?: number;
    /** Number of draw calls per frame. */
    drawCalls?: number;
    /** Number of triangles rendered per frame. */
    triangles?: number;
    /** Renderer memory usage information. */
    memory?: { usedJSHeapSize?: number };
  };
  /** The currently active performance profile. */
  performanceProfile: DeviceTier;
}

/**
 * Options for state clearing
 */
export interface ClearStateOptions {
  resetCamera?: boolean;
  resetTime?: boolean;
  resetSelection?: boolean;
}

export type CelestialRegistry = Record<string, CelestialObject>;
