import { atom } from "nanostores";
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
    trailLengthMultiplier: 150, // Default to 30
  },
};

export const simulationState = atom<SimulationState>(initialState);

/**
 * Actions for updating simulation state
 */
export const simulationActions = {
  setTimeScale: (scale: number) => {
    simulationState.set({
      ...simulationState.get(),
      timeScale: scale,
    });
  },

  togglePause: () => {
    simulationState.set({
      ...simulationState.get(),
      paused: !simulationState.get().paused,
    });
  },

  resetTime: () => {
    const currentState = simulationState.get();
    simulationState.set({
      ...currentState,
      time: 0,
      timeScale: 1,
      paused: false,
    });
  },

  stepTime: (dt: number = 1) => {
    // Default step of 1 second
    const currentState = simulationState.get();
    if (currentState.paused) {
      // Only step if paused
      simulationState.set({
        ...currentState,
        time: currentState.time + dt,
      });
      // console.log(`[simulationActions] Stepped time by ${dt}s.`);
    } else {
      console.warn(
        "[simulationActions] Cannot step time while simulation is running.",
      );
    }
  },

  selectObject: (objectId: string | null) => {
    simulationState.set({
      ...simulationState.get(),
      selectedObject: objectId,
    });
  },

  setFocusedObject: (objectId: string | null) => {
    simulationState.set({
      ...simulationState.get(),
      focusedObjectId: objectId,
    });
  },

  updateCamera: (position: OSVector3, target: OSVector3) => {
    simulationState.set({
      ...simulationState.get(),
      camera: {
        ...simulationState.get().camera,
        position,
        target,
      },
    });
  },

  // Action to set the physics engine
  setPhysicsEngine: (engine: PhysicsEngineType) => {
    simulationState.set({
      ...simulationState.get(),
      physicsEngine: engine,
    });
  },

  // Action to set the trail length multiplier
  setTrailLengthMultiplier: (multiplier: number) => {
    const validatedMultiplier = Math.max(0, multiplier);
    const currentState = simulationState.get();
    if (
      validatedMultiplier !== currentState.visualSettings.trailLengthMultiplier
    ) {
      simulationState.set({
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
