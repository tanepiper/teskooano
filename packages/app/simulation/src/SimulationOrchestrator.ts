import { SimulationManager, WasmSpatialService } from "@teskooano/core-physics";
import {
  celestialManager,
  physicsSystemAdapter,
  simulationStateService,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import {
  CelestialType,
  OrbitUpdatePayload,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-values";
import { Observable, Subject } from "rxjs";
import { HierarchyManager } from "./HierarchyManager";
import { processLagrangeObjects } from "./LagrangeProcessor";

/**
 * Manages the overall simulation lifecycle, physics loop, state, and events.
 * Implemented as a singleton.
 */
export class SimulationOrchestrator {
  private static instance: SimulationOrchestrator;

  // Loop properties
  private isRunning = false;
  private subscriptionManager = new StateSubscriptionMixin();
  private hierarchyManager: HierarchyManager;
  private coreSimulationManager: SimulationManager;
  private wasmSpatialService: WasmSpatialService;

  // Event Subjects
  private readonly _resetTime$ = new Subject<void>();
  private readonly _orbitUpdate$ = new Subject<OrbitUpdatePayload>();

  /**
   * Private constructor to enforce the singleton pattern.
   */
  private constructor() {
    // Private constructor for singleton
    this.hierarchyManager = new HierarchyManager();
    this.coreSimulationManager = new SimulationManager();
    this.wasmSpatialService = WasmSpatialService.getInstance();
  }

  /**
   * Gets the singleton instance of the SimulationOrchestrator.
   * @returns The singleton instance.
   */
  public static getInstance(): SimulationOrchestrator {
    if (!SimulationOrchestrator.instance) {
      SimulationOrchestrator.instance = new SimulationOrchestrator();
    }
    return SimulationOrchestrator.instance;
  }

  // Public Observables for events
  /**
   * Observable that emits when the simulation time is reset.
   */
  public get onResetTime(): Observable<void> {
    return this._resetTime$.asObservable();
  }

  /**
   * Observable that emits the updated positions of celestial objects after each physics step.
   */
  public get onOrbitUpdate(): Observable<OrbitUpdatePayload> {
    return this._orbitUpdate$.asObservable();
  }

  /**
   * Starts the main simulation loop.
   * The loop will only advance the simulation if it is not paused.
   * It is safe to call this multiple times; it will not start a second loop.
   */
  public async startLoop(): Promise<void> {
    if (this.isRunning) {
      console.warn("Simulation loop is already running.");
      return;
    }
    this.coreSimulationManager.dispose();
    this.subscriptionManager.dispose(); // Clear any existing subscriptions

    // Initialize centralized WASM spatial service
    try {
      await this.wasmSpatialService.initialize({
        neighborDistance: 1000 * AU_METERS, // 1 trillion meters (~6700 AU)
      });
    } catch (error) {
      console.warn(
        "Failed to initialize centralized WASM spatial service:",
        error,
      );
    }

    // Initialize WASM simulation manager if not already initialized
    try {
      await this.coreSimulationManager.initialize();
    } catch (error) {
      console.warn(
        "Failed to initialize WASM simulation manager, falling back to traditional methods:",
        error,
      );
    }

    this.isRunning = true;

    this.subscriptionManager.subscribeToStateComposition(
      this._resetTime$,
      () => {
        // The global state time is reset by celestialFactory.clearState
      },
    );
  }

  /**
   * Stops the main simulation loop.
   * It is safe to call this multiple times.
   */
  public stopLoop(): void {
    if (!this.isRunning) {
      console.warn("Simulation loop is not running.");
      return;
    }
    this.isRunning = false;
    this.subscriptionManager.dispose();
  }

  /**
   * Checks if the simulation loop is currently running.
   * @returns True if the loop is running, false otherwise.
   */
  public get isLoopRunning(): boolean {
    return this.isRunning;
  }

  private fixedTimeStep = 1 / 30; // 30 FPS fixed timestep

  /**
   * Creates a physics simulation callback that can be registered with an AnimationLoop.
   * This eliminates the need for a separate requestAnimationFrame loop.
   * @returns A callback function that performs one physics simulation step.
   */
  public createPhysicsCallback(): (deltaTime: number) => void {
    return (deltaTime: number) => {
      if (
        !this.isRunning ||
        simulationStateService.getSimulationState().paused
      ) {
        return;
      }

      const scaledDeltaTime =
        this.fixedTimeStep *
        simulationStateService.getSimulationState().timeScale;
      const newSimulationTime = deltaTime + scaledDeltaTime;

      this.updateSimulationTime(newSimulationTime);
      this.processLagrangeObjects();
      const simulationParams =
        this.prepareSimulationParameters(newSimulationTime);
      const result = this.runPhysicsSimulation(
        scaledDeltaTime,
        simulationParams,
      );
      this.updateStateFromPhysicsResult(result);
      this.updateHierarchies();
      this.emitOrbitUpdate(result);
    };
  }

  private updateSimulationTime(newTime: number): void {
    const currentState = simulationStateService.getSimulationState();
    simulationStateService.setSimulationState({
      ...currentState,
      time: newTime,
    });
  }

  private processLagrangeObjects(): void {
    const activeBodiesArray = physicsSystemAdapter.getPhysicsBodies();
    const allCelestialObjects =
      physicsSystemAdapter.getCelestialObjectsSnapshot();

    const celestialObjectsMap = new Map(Object.entries(allCelestialObjects));
    const physicsStatesMap = new Map<string, PhysicsStateReal>();

    for (const state of activeBodiesArray) {
      physicsStatesMap.set(state.id, state);
    }

    processLagrangeObjects(celestialObjectsMap, physicsStatesMap);
  }

  private prepareSimulationParameters(newSimulationTime: number) {
    const allCelestialObjects =
      physicsSystemAdapter.getCelestialObjectsSnapshot();
    const simulationConfig =
      simulationStateService.getSimulationState().simulationConfig;
    const orbitalParameters =
      physicsSystemAdapter.getOrbitalParametersSnapshot();

    // Create all Maps in a single pass for maximum performance
    const parentIdsMap = new Map<string, string>();
    const radii = new Map<string, number>();
    const isStar = new Map<string, boolean>();
    const bodyTypes = new Map<string, any>();
    const ignoreCollisions = new Map<string, boolean>();

    for (const obj of Object.values(allCelestialObjects)) {
      if (obj.parentId) {
        parentIdsMap.set(obj.id, obj.parentId);
      }
      radii.set(obj.id, obj.realRadius_m);
      isStar.set(obj.id, obj.type === CelestialType.STAR);
      bodyTypes.set(obj.id, obj.type);
      ignoreCollisions.set(obj.id, obj.ignoreCollisions ?? false);
    }

    return {
      bodies: physicsSystemAdapter.getPhysicsBodies(),
      configuration: simulationConfig,
      orbitalParameters,
      parentIds: parentIdsMap,
      currentTime_s: newSimulationTime,
      radii,
      isStar,
      bodyTypes,
      ignoreCollisions,
    };
  }

  private runPhysicsSimulation(scaledDeltaTime: number, params: any) {
    return this.coreSimulationManager.simulate({
      ...params,
      deltaTime: scaledDeltaTime,
    });
  }

  private updateStateFromPhysicsResult(result: any): void {
    physicsSystemAdapter.updateStateFromResult(result);
  }

  private updateHierarchies(): void {
    const simulationConfig =
      simulationStateService.getSimulationState().simulationConfig;
    if (simulationConfig.mode !== "ideal") {
      this.hierarchyManager.updateHierarchies();
    }
  }

  private emitOrbitUpdate(result: any): void {
    const updatedPositions: Record<
      string,
      { x: number; y: number; z: number }
    > = {};

    for (const state of result.states) {
      updatedPositions[state.id] = {
        x: state.position_m.x,
        y: state.position_m.y,
        z: state.position_m.z,
      };
    }

    this._orbitUpdate$.next({ positions: updatedPositions });
  }

  /**
   * Resets all celestial objects and the simulation state.
   * This clears all existing bodies and can optionally skip the state-clearing
   * if an external function (like a system initializer) will handle it.
   * It always emits the `onResetTime` event.
   * @param skipStateClear - If true, the function will not clear the global state.
   * This is useful when chaining with a system creation function that clears state itself.
   */
  public resetSystem(skipStateClear: boolean = false): void {
    if (!skipStateClear) {
      celestialManager.clearState({
        resetCamera: false, // Camera reset is usually handled by UI/camera manager
        resetTime: true,
        resetSelection: true,
      });
    } else {
      // Even if skipping full state clear, internal time and resetTime$ event might be relevant.
      if (simulationStateService.getSimulationState().time !== 0) {
        // If time is not already zero
        simulationStateService.setSimulationState({
          ...simulationStateService.getSimulationState(),
          time: 0,
        });
      }
    }
    // Always emit reset event
    this._resetTime$.next();
  }

  /**
   * Emits an event to signal that the simulation time should be reset to zero.
   * This also resets the internal accumulated time of the manager.
   */
  public resetTime(): void {
    this._resetTime$.next();
  }

  /**
   * Cleans up resources used by the SimulationOrchestrator.
   * Stops the loop, and removes event listeners.
   */
  public dispose(): void {
    this.stopLoop();
    this._resetTime$.complete();
    this._orbitUpdate$.complete();
    this.subscriptionManager.dispose();
  }
}

export const simulationManager = SimulationOrchestrator.getInstance();
