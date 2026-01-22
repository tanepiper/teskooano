import { BehaviorSubject, Observable } from "rxjs";
import { SimulationState } from "../types/types";
import { getDefaultConfiguration } from "../utils";

/**
 * @class SimulationStore
 * @description Singleton store managing the simulation's control state including time, pause status,
 * selected objects, camera, physics engine, and visual settings.
 */
export class SimulationStore {
  private static instance: SimulationStore;

  /** The initial, default state for the simulation. */
  private readonly _initialState: SimulationState = {
    time: 0,
    timeScale: 1,
    startDate: new Date(),
    paused: false,
    simulationConfig: getDefaultConfiguration(),
    visualSettings: {
      trailLengthMultiplier: 2,
      showAllOrbits: true,
      showAllLabels: false,
      showAuMarkers: true,
      predictionSteps: 500,
      predictionDuration: 2,
      keplerOrbitMode: "trail",
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
   * Provides access to the singleton instance of the SimulationStore.
   * Creates the instance if it doesn't exist.
   * @returns The singleton instance.
   */
  public static getInstance(): SimulationStore {
    if (!SimulationStore.instance) {
      SimulationStore.instance = new SimulationStore();
    }
    return SimulationStore.instance;
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
   * prefer using the SimulationManager methods.
   * @param newState The complete new simulation state.
   */
  public setSimulationState(newState: SimulationState): void {
    this._simulationState.next(newState);
  }

  /**
   * Updates the simulation state by merging with the current state.
   * @param updates Partial state updates to merge with current state.
   */
  public updateSimulationState(updates: Partial<SimulationState>): void {
    const currentState = this.getSimulationState();
    this.setSimulationState({
      ...currentState,
      ...updates,
    });
  }

  /**
   * Resets the simulation state to the initial default values.
   */
  public resetToInitialState(): void {
    this.setSimulationState(this._initialState);
  }
}

/** Singleton instance of the SimulationStore. */
export const simulationStore = SimulationStore.getInstance();
