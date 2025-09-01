import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialObject,
  DeviceTier,
  SimulationMode,
} from "@teskooano/data-types";

// CameraState has been moved to stores/CameraStore.ts to support enhanced camera state management

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
 * This includes time, control parameters, and performance settings.
 * Camera state is managed separately by CameraStore.
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
