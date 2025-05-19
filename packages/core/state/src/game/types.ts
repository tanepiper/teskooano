import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  CelestialType,
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
 * Defines the available types of physics engines for the simulation.
 * - `euler`: Standard Euler integration (simple, less accurate).
 * - `symplectic`: Symplectic Euler integration (better energy conservation than standard Euler).
 * - `verlet`: Velocity Verlet integration (good stability and energy conservation, often default).
 */
export type PhysicsEngineType = "euler" | "symplectic" | "verlet";

/**
 * Defines the performance profile settings for the simulation.
 * These can be used to adjust quality vs. performance trade-offs.
 * - `low`: Prioritizes performance, may reduce visual fidelity or simulation accuracy.
 * - `medium`: A balance between performance and quality.
 * - `high`: Prioritizes quality/accuracy, may impact performance.
 * - `cosmic`: Maximum quality/accuracy, potentially very demanding.
 */
export type PerformanceProfileType = "low" | "medium" | "high" | "cosmic";

/**
 * Defines settings related to visual aspects of the simulation, like trails.
 */
export interface VisualSettingsState {
  /** A multiplier affecting the length of rendered trails for objects. */
  trailLengthMultiplier: number;
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
  /** The type of physics engine currently active in the simulation. */
  physicsEngine: PhysicsEngineType;
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
  performanceProfile: PerformanceProfileType;
}

/**
 * Defines the state for a generic panel view within the UI, often for debug or informational panels.
 * This might control what visual helpers or information are displayed in a particular view.
 */
export interface PanelViewState {
  /** The camera position associated with this panel view. */
  cameraPosition: OSVector3;
  /** The camera target associated with this panel view. */
  cameraTarget: OSVector3;
  /** The ID of the object focused in this panel view, if any. */
  focusedObjectId: string | null;
  /** Whether to show a grid helper in this panel view. */
  showGrid?: boolean;
  /** Whether to show labels for celestial objects in this panel view. */
  showCelestialLabels?: boolean;
  /** Whether to show Astronomical Unit (AU) markers in this panel view. */
  showAuMarkers?: boolean;
  /** Whether to show visual effects for debris in this panel view. */
  showDebrisEffects?: boolean;
  /** Whether to show a generic debug sphere in this panel view. */
  showDebugSphere?: boolean;
}

/**
 * Input data required to create a new celestial object.
 * Focuses on core blueprint properties.
 */
export interface CelestialObjectCreationInput {
  id: string;
  name: string;
  type: CelestialType;
  realMass_kg: number;
  realRadius_m: number;
  parentId?: string;
  orbit?: OrbitalParameters;
  temperature?: number;
  albedo?: number;
  siderealRotationPeriod_s?: number;
  axialTilt?: OSVector3;
  atmosphere?: CelestialObject["atmosphere"];
  surface?: CelestialObject["surface"];
  properties?: CelestialSpecificPropertiesUnion;
  seed?: string | number;
  ignorePhysics?: boolean;
}

/**
 * Options for state clearing
 */
export interface ClearStateOptions {
  resetCamera?: boolean;
  resetTime?: boolean;
  resetSelection?: boolean;
}
