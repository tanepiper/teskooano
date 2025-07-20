import { OSVector3 } from "@teskooano/core-math";
import {
  AlgorithmType,
  CelestialObject,
  DeviceTier,
  IntegratorType,
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
  mode: SimulationMode;
  integrator?: IntegratorType; // Only required for N-Body mode
  algorithm?: AlgorithmType; // Only required for N-Body mode
}

/**
 * Validates if a simulation configuration is valid.
 */
export function isValidConfiguration(config: SimulationConfiguration): boolean {
  if (config.mode === SimulationMode.IDEAL) {
    // Ideal mode doesn't need integrator or algorithm
    return config.integrator === undefined && config.algorithm === undefined;
  }

  if (config.mode === SimulationMode.NBODY) {
    // N-Body mode requires both integrator and algorithm
    return config.integrator !== undefined && config.algorithm !== undefined;
  }

  return false;
}

/**
 * Returns the default simulation configuration.
 */
export function getDefaultConfiguration(): SimulationConfiguration {
  return {
    mode: SimulationMode.NBODY,
    integrator: IntegratorType.PEFRL,
    algorithm: AlgorithmType.TREE_PM,
  };
}

/**
 * Gets a user-friendly display name for a configuration.
 */
export function getConfigurationDisplayName(
  config: SimulationConfiguration,
): string {
  if (config.mode === SimulationMode.IDEAL) {
    return "Ideal Orrery";
  }

  const integrator = config.integrator
    ? config.integrator.charAt(0).toUpperCase() + config.integrator.slice(1)
    : "Unknown";
  const algorithm = config.algorithm
    ? config.algorithm
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-")
    : "Unknown";

  return `N-Body (${algorithm} + ${integrator})`;
}

/**
 * Gets a short name for display in constrained UI spaces.
 */
export function getConfigurationShortName(
  config: SimulationConfiguration,
): string {
  if (config.mode === SimulationMode.IDEAL) {
    return "Ideal";
  }

  let algorithmShort: string;
  switch (config.algorithm) {
    case AlgorithmType.BARNES_HUT:
      algorithmShort = "BH";
      break;
    case AlgorithmType.FMM:
      algorithmShort = "FMM";
      break;
    case AlgorithmType.P3M:
      algorithmShort = "P3M";
      break;
    default:
      algorithmShort = "TPM"; // tree-pm is the default
      break;
  }

  const integratorShort = config.integrator
    ? config.integrator.charAt(0).toUpperCase() + config.integrator.slice(1, 3)
    : "Unk";

  return `${algorithmShort}-${integratorShort}`;
}

/**
 * Defines the performance profile settings for the simulation.
 * These can be used to adjust quality vs. performance trade-offs.
 * - `low`: Prioritizes performance, may reduce visual fidelity or simulation accuracy.
 * - `medium`: A balance between performance and quality.
 * - `high`: Prioritizes quality/accuracy, may impact performance.
 * - `cosmic`: Maximum quality/accuracy, potentially very demanding.
 */

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
