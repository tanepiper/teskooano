import { SimulationState } from "../types/types";
import { getDefaultConfiguration, isValidConfiguration } from "../utils";
import {
  AlgorithmType,
  DeviceTier,
  IntegratorType,
  SimulationMode,
  SimulationConfiguration,
} from "@teskooano/data-types";
import { simulationStore } from "../stores/SimulationStore";

/**
 * @class SimulationManager
 * @description Manages the simulation's control state including time, pause status,
 * selected objects, camera, physics engine, and visual settings.
 * It follows a singleton pattern and delegates state persistence to SimulationStore.
 */
export class SimulationManager {
  private static instance: SimulationManager;

  /**
   * Private constructor to enforce the singleton pattern.
   */
  private constructor() {}

  /**
   * Provides access to the singleton instance of the SimulationManager.
   * Creates the instance if it doesn't exist.
   * @returns The singleton instance.
   */
  public static getInstance(): SimulationManager {
    if (!SimulationManager.instance) {
      SimulationManager.instance = new SimulationManager();
    }
    return SimulationManager.instance;
  }

  /**
   * Gets the current, instantaneous snapshot of the entire simulation state.
   * @returns The current simulation state object.
   */
  public getSimulationState(): SimulationState {
    return simulationStore.getSimulationState();
  }

  /**
   * Gets the simulation state observable for reactive subscriptions.
   * @returns Observable of simulation state changes.
   */
  public getSimulationState$() {
    return simulationStore.simulationState$;
  }

  /**
   * Sets the speed at which simulation time progresses relative to real time.
   * @param scale - The new time scale factor. `1` is real-time, `>1` is faster, `<1` is slower.
   */
  public setTimeScale(scale: number): void {
    simulationStore.updateSimulationState({ timeScale: scale });
  }

  /**
   * Toggles the simulation's paused state.
   */
  public togglePause(): void {
    const currentState = simulationStore.getSimulationState();
    simulationStore.updateSimulationState({
      paused: !currentState.paused,
    });
  }

  /**
   * Resets the simulation clock to zero, sets the time scale to 1, and un-pauses.
   */
  public resetTime(resetPaused: boolean = false): void {
    const currentState = simulationStore.getSimulationState();
    simulationStore.updateSimulationState({
      time: 0,
      timeScale: 1,
      // Logic is if it's currently paused, we don't want to un-pause it unless resetPaused is true
      paused: currentState.paused && !resetPaused,
    });
  }

  /**
   * Sets the simulation start date.
   */
  public setStartDate(startDate: Date): void {
    simulationStore.updateSimulationState({
      startDate: new Date(startDate),
    });
  }

  /**
   * Resets the simulation state to a new start date with time zero.
   */
  public resetToStartDate(startDate: Date): void {
    simulationStore.updateSimulationState({
      time: 0,
      timeScale: 1,
      startDate: new Date(startDate),
      paused: false,
    });
  }

  /**
   * Advances the simulation time by a single discrete step.
   * This method only works when the simulation is paused.
   * @param dt The amount of time to step forward, in simulation seconds. Defaults to 1.
   */
  public stepTime(dt: number = 1): void {
    const currentState = simulationStore.getSimulationState();
    if (currentState.paused) {
      simulationStore.updateSimulationState({
        time: currentState.time + dt,
      });
    } else {
      console.warn(
        "[SimulationManager] Cannot step time while simulation is running.",
      );
    }
  }

  /**
   * Sets the complete simulation configuration (mode, algorithm, integrator).
   * This is the preferred method for configuring the physics simulation.
   * @param config The new simulation configuration.
   */
  public setSimulationConfiguration(config: SimulationConfiguration): void {
    if (!isValidConfiguration(config)) {
      throw new Error(
        `Invalid simulation configuration: ${JSON.stringify(config)}`,
      );
    }

    simulationStore.updateSimulationState({
      simulationConfig: config,
    });
  }

  /**
   * Sets the simulation mode (ideal orrery vs n-body physics).
   * @param mode The simulation mode to use.
   */
  public setSimulationMode(mode: SimulationMode): void {
    const currentState = simulationStore.getSimulationState();
    const currentConfig = currentState.simulationConfig;

    let newConfig: SimulationConfiguration;
    if (mode === SimulationMode.IDEAL) {
      newConfig = { mode: SimulationMode.IDEAL };
    } else {
      // For n-body mode, preserve existing algorithm/integrator or use defaults
      newConfig = {
        mode: SimulationMode.NBODY,
        algorithm: currentConfig.algorithm || AlgorithmType.BARNES_HUT,
        integrator: currentConfig.integrator || IntegratorType.PEFRL,
      };
    }

    this.setSimulationConfiguration(newConfig);
  }

  /**
   * Sets the N-Body algorithm (only valid when in n-body mode).
   * @param algorithm The N-Body algorithm to use.
   */
  public setNBodyAlgorithm(algorithm: AlgorithmType): void {
    const currentState = simulationStore.getSimulationState();
    const currentConfig = currentState.simulationConfig;

    if (currentConfig.mode !== SimulationMode.NBODY) {
      throw new Error("Cannot set N-Body algorithm when not in N-Body mode");
    }

    const newConfig: SimulationConfiguration = {
      mode: SimulationMode.NBODY,
      algorithm,
      integrator: currentConfig.integrator || IntegratorType.PEFRL,
    };

    this.setSimulationConfiguration(newConfig);
  }

  /**
   * Sets the N-Body integrator (only valid when in n-body mode).
   * @param integrator The numerical integrator to use.
   */
  public setNBodyIntegrator(integrator: IntegratorType): void {
    const currentState = simulationStore.getSimulationState();
    const currentConfig = currentState.simulationConfig;

    if (currentConfig.mode !== SimulationMode.NBODY) {
      throw new Error("Cannot set N-Body integrator when not in N-Body mode");
    }

    const newConfig: SimulationConfiguration = {
      mode: SimulationMode.NBODY,
      algorithm: currentConfig.algorithm || AlgorithmType.BARNES_HUT,
      integrator,
    };

    this.setSimulationConfiguration(newConfig);
  }

  /**
   * Gets the current simulation configuration.
   * @returns The current simulation configuration.
   */
  public getSimulationConfiguration(): SimulationConfiguration {
    return simulationStore.getSimulationState().simulationConfig;
  }

  /**
   * Checks if the current configuration is valid.
   * @returns True if the configuration is valid, false otherwise.
   */
  public isConfigurationValid(): boolean {
    return isValidConfiguration(this.getSimulationConfiguration());
  }

  /**
   * Sets the performance profile, which can be used to adjust visual quality
   * and simulation complexity to match the user's hardware.
   * For performance, consumers should avoid calling this with an unchanged value.
   * @param profile The desired performance profile name.
   */
  public setPerformanceProfile(profile: DeviceTier): void {
    simulationStore.updateSimulationState({
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
    const currentState = simulationStore.getSimulationState();
    simulationStore.updateSimulationState({
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
    const currentState = simulationStore.getSimulationState();
    const newSteps = Math.max(10, steps);
    const newDuration = Math.max(0.1, duration);

    simulationStore.updateSimulationState({
      visualSettings: {
        ...currentState.visualSettings,
        predictionSteps: newSteps,
        predictionDuration: newDuration,
      },
    });
  }

  /**
   * Sets the visualization mode for Keplerian orbits (Full or Trail).
   * @param mode The desired Kepler orbit mode.
   */
  public setKeplerOrbitMode(mode: "full" | "trail"): void {
    const currentState = simulationStore.getSimulationState();
    simulationStore.updateSimulationState({
      visualSettings: {
        ...currentState.visualSettings,
        keplerOrbitMode: mode,
      },
    });
  }

  /**
   * Resets the simulation state to the initial default values.
   */
  public resetToInitialState(): void {
    simulationStore.resetToInitialState();
  }
}

/** Singleton instance of the SimulationManager. */
export const simulationManager = SimulationManager.getInstance();
