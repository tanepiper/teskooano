import { BehaviorSubject } from "rxjs";
import * as THREE from "three";
import { OSVector3 } from "@teskooano/core-math";
import { AU_METERS, SCALE } from "@teskooano/data-types";

export interface CameraState {
  position: OSVector3;
  target: OSVector3;
  fov: number;
}

// Define the possible physics engine types
export type PhysicsEngineType = "euler" | "symplectic" | "verlet";

// --- ADD Performance Profile Type ---
export type PerformanceProfileType = "low" | "medium" | "high" | "cosmic";
// --- END ADD ---

export interface VisualSettingsState {
  trailLengthMultiplier: number;
  // View-specific settings like label visibility belong in PanelViewState
}

export interface SimulationState {
  time: number;
  timeScale: number;
  paused: boolean;
  selectedObject: string | null;
  focusedObjectId: string | null;
  camera: CameraState;
  physicsEngine: PhysicsEngineType; // Added physics engine state
  visualSettings: VisualSettingsState; // Add visual settings group
  renderer?: {
    // Add this optional field for renderer stats
    fps?: number;
    drawCalls?: number;
    triangles?: number;
    memory?: { usedJSHeapSize?: number }; // Reflecting performance.memory structure
  };
  performanceProfile: PerformanceProfileType; // Added performance profile
}

const initialState: SimulationState = {
  time: 0,
  timeScale: 1, // Default to 1x speed
  paused: false,
  selectedObject: null,
  focusedObjectId: null,
  camera: {
    position: new OSVector3(0, 100, 100), // Use OSVector3
    target: new OSVector3(0, 0, 0), // Use OSVector3
    fov: 75, // Default Field of View
  },
  physicsEngine: "verlet", // Changed default to Verlet
  visualSettings: {
    // Initialize visual settings
    trailLengthMultiplier: 100,
    // Add other visual defaults here
  },
  performanceProfile: "medium", // Default performance profile
};

// Define the BehaviorSubject internally
const _simulationState = new BehaviorSubject<SimulationState>(initialState);
// Export the observable for external use
export const simulationState$ = _simulationState.asObservable();

/**
 * Actions for updating simulation state
 */
export const simulationActions = {
  setTimeScale: (scale: number) => {
    _simulationState.next({
      ..._simulationState.getValue(),
      timeScale: scale,
    });
  },

  togglePause: () => {
    _simulationState.next({
      ..._simulationState.getValue(),
      paused: !_simulationState.getValue().paused,
    });
  },

  resetTime: () => {
    const currentState = _simulationState.getValue();
    _simulationState.next({
      ...currentState,
      time: 0,
      timeScale: 1,
      paused: false,
    });
  },

  stepTime: (dt: number = 1) => {
    const currentState = _simulationState.getValue();
    if (currentState.paused) {
      _simulationState.next({
        ...currentState,
        time: currentState.time + dt,
      });
    } else {
      console.warn(
        "[simulationActions] Cannot step time while simulation is running.",
      );
    }
  },

  selectObject: (objectId: string | null) => {
    _simulationState.next({
      ..._simulationState.getValue(),
      selectedObject: objectId,
    });
  },

  setFocusedObject: (objectId: string | null) => {
    _simulationState.next({
      ..._simulationState.getValue(),
      focusedObjectId: objectId,
    });
  },

  updateCamera: (position: OSVector3, target: OSVector3) => {
    _simulationState.next({
      ..._simulationState.getValue(),
      camera: {
        ..._simulationState.getValue().camera,
        position,
        target,
      },
    });
  },

  // Action to set the physics engine
  setPhysicsEngine: (engine: PhysicsEngineType) => {
    _simulationState.next({
      ..._simulationState.getValue(),
      physicsEngine: engine,
    });
  },

  // Action to set the performance profile
  setPerformanceProfile: (profile: PerformanceProfileType) => {
    const currentState = _simulationState.getValue();
    if (profile !== currentState.performanceProfile) {
      _simulationState.next({
        ...currentState,
        performanceProfile: profile,
      });
    }
  },

  // Action to set the trail length multiplier
  setTrailLengthMultiplier: (multiplier: number) => {
    const validatedMultiplier = Math.max(0, multiplier);
    const currentState = _simulationState.getValue();
    if (
      validatedMultiplier !== currentState.visualSettings.trailLengthMultiplier
    ) {
      _simulationState.next({
        ...currentState,
        visualSettings: {
          ...currentState.visualSettings,
          trailLengthMultiplier: validatedMultiplier,
        },
      });
    } else {
      console.warn(
        `[simulationActions] Multiplier unchanged (${validatedMultiplier}), skipping state set.`,
      );
    }
  },
};

// Export getter for synchronous access (use with caution)
export const getSimulationState = () => _simulationState.getValue();
// Export setter for synchronous access (use with caution)
export const setSimulationState = (newState: SimulationState) =>
  _simulationState.next(newState);
