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
 * It follows a singleton pattern to ensure a single source of truth for the simulation state.
 */
export class SimulationStateService {
  private static instance: SimulationStateService;

  /** The initial, default state for the simulation. */
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

  /** The RxJS BehaviorSubject holding the current simulation state. */
  private readonly _simulationState: BehaviorSubject<SimulationState>;
  /** An observable that emits the current simulation state whenever it changes. */
  public readonly simulationState$: Observable<SimulationState>;

  /**
   * Private constructor to enforce the singleton pattern.
   * Initializes the state with default values.
   */
  private constructor() {
    this._simulationState = new BehaviorSubject<SimulationState>(
      this._initialState,
    );
    this.simulationState$ = this._simulationState.asObservable();
  }

  /**
   * Provides access to the singleton instance of the SimulationStateService.
   * Creates the instance if it doesn't exist.
   * @returns The singleton instance.
   */
  public static getInstance(): SimulationStateService {
    if (!SimulationStateService.instance) {
      SimulationStateService.instance = new SimulationStateService();
    }
    return SimulationStateService.instance;
  }

  /**
   * Gets the current, instantaneous snapshot of the entire simulation state.
   * @returns The current simulation state object.
   */
  public getSimulationState(): SimulationState {
    return this._simulationState.getValue();
  }

  /**
   * Overwrites the entire simulation state with a new state object.
   * This is a powerful method and should be used with caution. For most updates,
   * prefer using the more specific setter methods like `setTimeScale` or `selectObject`.
   * @param newState The complete new simulation state.
   */
  public setSimulationState(newState: SimulationState): void {
    this._simulationState.next(newState);
  }

  /**
   * Sets the speed at which simulation time progresses relative to real time.
   * @param scale - The new time scale factor. `1` is real-time, `>1` is faster, `<1` is slower.
   */
  public setTimeScale(scale: number): void {
    this.setSimulationState({
      ...this.getSimulationState(),
      timeScale: scale,
    });
  }

  /**
   * Toggles the simulation's paused state.
   */
  public togglePause(): void {
    const currentState = this.getSimulationState();
    this.setSimulationState({
      ...currentState,
      paused: !currentState.paused,
    });
  }

  /**
   * Resets the simulation clock to zero, sets the time scale to 1, and un-pauses.
   */
  public resetTime(): void {
    const currentState = this.getSimulationState();
    this.setSimulationState({
      ...currentState,
      time: 0,
      timeScale: 1,
      paused: false,
    });
  }

  /**
   * Advances the simulation time by a single discrete step.
   * This method only works when the simulation is paused.
   * @param dt The amount of time to step forward, in simulation seconds. Defaults to 1.
   */
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

  /**
   * Sets the currently selected celestial object.
   * This is typically used for displaying information about an object in the UI.
   * @param objectId The unique ID of the object to select, or null to deselect.
   */
  public selectObject(objectId: string | null): void {
    this.setSimulationState({
      ...this.getSimulationState(),
      selectedObject: objectId,
    });
  }

  /**
   * Sets the object that the camera should be focused on or following.
   * @param objectId The unique ID of the object to focus, or null to unfocus.
   */
  public setFocusedObject(objectId: string | null): void {
    this.setSimulationState({
      ...this.getSimulationState(),
      focusedObjectId: objectId,
    });
  }

  /**
   * Updates the camera's position and target in the simulation state.
   * @param position The new position of the camera.
   * @param target The new point the camera should look at.
   */
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

  /**
   * Sets the physics integration engine to be used for orbital calculations.
   * @param engine The name of the physics engine to use.
   */
  public setPhysicsEngine(engine: PhysicsEngineType): void {
    this.setSimulationState({
      ...this.getSimulationState(),
      physicsEngine: engine,
    });
  }

  /**
   * Sets the performance profile, which can be used to adjust visual quality
   * and simulation complexity to match the user's hardware.
   * For performance, consumers should avoid calling this with an unchanged value.
   * @param profile The desired performance profile name.
   */
  public setPerformanceProfile(profile: PerformanceProfileType): void {
    this.setSimulationState({
      ...this.getSimulationState(),
      performanceProfile: profile,
    });
  }

  /**
   * Sets a multiplier for the length of historical orbital trails.
   * This allows users to see longer or shorter trails behind moving objects.
   * For performance, consumers should avoid calling this with an unchanged value.
   * @param multiplier The multiplier for the trail length. Must be non-negative.
   */
  public setTrailLengthMultiplier(multiplier: number): void {
    const validatedMultiplier = Math.max(0, multiplier);
    const currentState = this.getSimulationState();
    this.setSimulationState({
      ...currentState,
      visualSettings: {
        ...currentState.visualSettings,
        trailLengthMultiplier: validatedMultiplier,
      },
    });
  }

  /**
   * Updates the settings for trajectory prediction lines.
   * For performance, consumers should avoid calling this with unchanged values.
   * @param steps The number of points to use for the prediction line. More steps mean a smoother line.
   * @param duration The duration into the future to predict, in simulation years.
   */
  public setPredictionSettings(steps: number, duration: number): void {
    const currentState = this.getSimulationState();
    const newSteps = Math.max(10, steps);
    const newDuration = Math.max(0.1, duration);

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

/** Singleton instance of the SimulationStateService. */
export const simulationStateService = SimulationStateService.getInstance();
