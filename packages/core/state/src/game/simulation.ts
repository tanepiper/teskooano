import { BehaviorSubject } from "rxjs";
import * as THREE from "three";
import { OSVector3 } from "@teskooano/core-math";
import { AU_METERS, SCALE } from "@teskooano/data-types";

export interface CameraState {
  position: OSVector3;
  target: OSVector3;
  fov: number;
}

export type PhysicsEngineType = "euler" | "symplectic" | "verlet";

export type PerformanceProfileType = "low" | "medium" | "high" | "cosmic";

export interface VisualSettingsState {
  trailLengthMultiplier: number;
}

export interface SimulationState {
  time: number;
  timeScale: number;
  paused: boolean;
  selectedObject: string | null;
  focusedObjectId: string | null;
  camera: CameraState;
  physicsEngine: PhysicsEngineType;
  visualSettings: VisualSettingsState;
  renderer?: {
    fps?: number;
    drawCalls?: number;
    triangles?: number;
    memory?: { usedJSHeapSize?: number };
  };
  performanceProfile: PerformanceProfileType;
}

const initialState: SimulationState = {
  time: 0,
  timeScale: 1,
  paused: false,
  selectedObject: null,
  focusedObjectId: null,
  camera: {
    position: new OSVector3(0, 100, 100),
    target: new OSVector3(0, 0, 0),
    fov: 75,
  },
  physicsEngine: "verlet",
  visualSettings: {
    trailLengthMultiplier: 2,
  },
  performanceProfile: "medium",
};

const _simulationState = new BehaviorSubject<SimulationState>(initialState);

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

  setPhysicsEngine: (engine: PhysicsEngineType) => {
    _simulationState.next({
      ..._simulationState.getValue(),
      physicsEngine: engine,
    });
  },

  setPerformanceProfile: (profile: PerformanceProfileType) => {
    const currentState = _simulationState.getValue();
    if (profile !== currentState.performanceProfile) {
      _simulationState.next({
        ...currentState,
        performanceProfile: profile,
      });
    }
  },

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

export const getSimulationState = () => _simulationState.getValue();

export const setSimulationState = (newState: SimulationState) =>
  _simulationState.next(newState);
