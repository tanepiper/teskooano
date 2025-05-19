import { OSVector3 } from "@teskooano/core-math";

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
