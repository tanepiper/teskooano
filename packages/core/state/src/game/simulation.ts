import { OSVector3 } from "@teskooano/core-math";
import { BehaviorSubject, Observable } from "rxjs";
import type {
  PerformanceProfileType,
  PhysicsEngineType,
  SimulationState,
} from "./types";

/**
 * @class SimulationStateService
 * @description Manages the simulation's control state including time, pause status,
 * selected objects, camera, physics engine, and visual settings.
 */
export class SimulationStateService {
  private static instance: SimulationStateService;

  private readonly _initialState: SimulationState = {
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
      showAllOrbits: true,
      showAllLabels: false,
      showAuMarkers: true,
      predictionSteps: 500,
      predictionDuration: 2,
    },
    performanceProfile: "medium",
  };

  private readonly _simulationState: BehaviorSubject<SimulationState>;
  /** Observable for the current simulation state. */
  public readonly simulationState$: Observable<SimulationState>;

  private constructor() {
    this._simulationState = new BehaviorSubject<SimulationState>(
      this._initialState,
    );
    this.simulationState$ = this._simulationState.asObservable();
  }

  /**
   * @public
   * @static
   * @description Provides access to the singleton instance of the SimulationStateService.
   * @returns {SimulationStateService} The singleton instance.
   */
  public static getInstance(): SimulationStateService {
    if (!SimulationStateService.instance) {
      SimulationStateService.instance = new SimulationStateService();
    }
    return SimulationStateService.instance;
  }

  /** Gets the current complete simulation state object. */
  public getSimulationState(): SimulationState {
    return this._simulationState.getValue();
  }

  /**
   * Sets the entire simulation state. Use with caution.
   * Prefer specific action methods for partial updates.
   * @param newState The complete new simulation state.
   */
  public setSimulationState(newState: SimulationState): void {
    this._simulationState.next(newState);
  }

  public setTimeScale(scale: number): void {
    this.setSimulationState({
      ...this.getSimulationState(),
      timeScale: scale,
    });
  }

  public togglePause(): void {
    const currentState = this.getSimulationState();
    this.setSimulationState({
      ...currentState,
      paused: !currentState.paused,
    });
  }

  public resetTime(): void {
    const currentState = this.getSimulationState();
    this.setSimulationState({
      ...currentState,
      time: 0,
      timeScale: 1,
      paused: false,
    });
  }

  public stepTime(dt: number = 1): void {
    const currentState = this.getSimulationState();
    if (currentState.paused) {
      this.setSimulationState({
        ...currentState,
        time: currentState.time + dt,
      });
    } else {
      console.warn(
        "[SimulationStateService] Cannot step time while simulation is running.",
      );
    }
  }

  public selectObject(objectId: string | null): void {
    this.setSimulationState({
      ...this.getSimulationState(),
      selectedObject: objectId,
    });
  }

  public setFocusedObject(objectId: string | null): void {
    this.setSimulationState({
      ...this.getSimulationState(),
      focusedObjectId: objectId,
    });
  }

  public updateCamera(position: OSVector3, target: OSVector3): void {
    const currentState = this.getSimulationState();
    this.setSimulationState({
      ...currentState,
      camera: {
        ...currentState.camera,
        position,
        target,
      },
    });
  }

  public setPhysicsEngine(engine: PhysicsEngineType): void {
    this.setSimulationState({
      ...this.getSimulationState(),
      physicsEngine: engine,
    });
  }

  public setPerformanceProfile(profile: PerformanceProfileType): void {
    const currentState = this.getSimulationState();
    if (profile !== currentState.performanceProfile) {
      this.setSimulationState({
        ...currentState,
        performanceProfile: profile,
      });
    }
  }

  public setTrailLengthMultiplier(multiplier: number): void {
    const validatedMultiplier = Math.max(0, multiplier);
    const currentState = this.getSimulationState();
    if (
      validatedMultiplier !== currentState.visualSettings.trailLengthMultiplier
    ) {
      this.setSimulationState({
        ...currentState,
        visualSettings: {
          ...currentState.visualSettings,
          trailLengthMultiplier: validatedMultiplier,
        },
      });
    } else {
      console.warn(
        `[SimulationStateService] Multiplier unchanged (${validatedMultiplier}), skipping state set.`,
      );
    }
  }

  public setPredictionSettings(steps: number, duration: number): void {
    const currentState = this.getSimulationState();
    const newSteps = Math.max(10, steps);
    const newDuration = Math.max(0.1, duration);

    if (
      newSteps !== currentState.visualSettings.predictionSteps ||
      newDuration !== currentState.visualSettings.predictionDuration
    ) {
      this.setSimulationState({
        ...currentState,
        visualSettings: {
          ...currentState.visualSettings,
          predictionSteps: newSteps,
          predictionDuration: newDuration,
        },
      });
    }
  }
}

/** Singleton instance of the SimulationStateService. */
export const simulationStateService = SimulationStateService.getInstance();
