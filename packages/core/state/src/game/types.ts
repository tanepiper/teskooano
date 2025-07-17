import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  CelestialType,
  DeviceTier,
  OrbitalParameters,
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
 * The simulation mode determines the type of physics calculation used.
 */
export type SimulationMode = "ideal" | "nbody";

/**
 * The numerical integration method used for N-Body simulations.
 */
export type IntegratorType =
  | "euler" // Simple Euler integration
  | "symplectic" // Symplectic Euler (energy preserving)
  | "verlet" // Velocity Verlet (stable, reversible)
  | "rk4" // Runge-Kutta 4th order (high accuracy)
  | "adaptive" // Adaptive step size (auto-optimizing)
  | "yoshida4" // 4th-order symplectic (Yoshida method)
  | "forest-ruth" // 4th-order symplectic (Forest-Ruth method)
  | "pefrl" // Optimized 4th-order symplectic (PEFRL)
  | "leapfrog"; // Classic 2nd-order symplectic

/**
 * The force calculation algorithm used for N-Body simulations.
 */
export type AlgorithmType =
  | "barnes-hut" // O(N log N) - tree-based approximation
  | "fmm" // O(N) - Fast Multipole Method
  | "p3m" // O(N log N) - Particle-Mesh hybrid
  | "tree-pm"; // O(N log N) - Tree-PM hybrid (recommended)

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
  if (config.mode === "ideal") {
    // Ideal mode doesn't need integrator or algorithm
    return config.integrator === undefined && config.algorithm === undefined;
  }

  if (config.mode === "nbody") {
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
    mode: "nbody",
    integrator: "pefrl",
    algorithm: "tree-pm",
  };
}

/**
 * Gets a user-friendly display name for a configuration.
 */
export function getConfigurationDisplayName(
  config: SimulationConfiguration,
): string {
  if (config.mode === "ideal") {
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
  if (config.mode === "ideal") {
    return "Ideal";
  }

  const algorithmShort =
    config.algorithm === "barnes-hut"
      ? "BH"
      : config.algorithm === "fmm"
        ? "FMM"
        : config.algorithm === "p3m"
          ? "P3M"
          : "TPM"; // tree-pm is the default

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
