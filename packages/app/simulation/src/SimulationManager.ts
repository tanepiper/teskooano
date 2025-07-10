import {
  updateSimulation,
  vectorPool,
  type DestructionEvent,
  type SimulationParameters,
  type SimulationStepResult,
} from "@teskooano/core-physics";
import {
  celestialFactory,
  getSimulationState,
  physicsSystemAdapter,
  setSimulationState,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  OrbitUpdatePayload,
} from "@teskooano/data-types";
import { Observable, Subject } from "rxjs";
import * as THREE from "three";
import { HierarchyManager } from "./HierarchyManager";

/**
 * Manages the overall simulation lifecycle, physics loop, state, and events.
 * Implemented as a singleton.
 */
export class SimulationManager {
  private static instance: SimulationManager;

  // Loop properties
  private lastTime = 0;
  private isRunning = false;
  private accumulatedTime = 0;
  private subscriptionManager = new StateSubscriptionMixin();
  private animationFrameId: number | null = null;
  private hierarchyManager: HierarchyManager;

  // Event Subjects
  private readonly _resetTime$ = new Subject<void>();
  private readonly _orbitUpdate$ = new Subject<OrbitUpdatePayload>();
  private readonly _destructionOccurred$ = new Subject<DestructionEvent>();

  /**
   * Private constructor to enforce the singleton pattern.
   */
  private constructor() {
    // Private constructor for singleton
    this.hierarchyManager = new HierarchyManager();
  }

  /**
   * Gets the singleton instance of the SimulationManager.
   * @returns The singleton instance.
   */
  public static getInstance(): SimulationManager {
    if (!SimulationManager.instance) {
      SimulationManager.instance = new SimulationManager();
    }
    return SimulationManager.instance;
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
   * Observable that emits details of a destruction event (e.g., collision) when it occurs.
   */
  public get onDestructionOccurred(): Observable<DestructionEvent> {
    return this._destructionOccurred$.asObservable();
  }

  /**
   * Starts the main simulation loop.
   * The loop will only advance the simulation if it is not paused.
   * It is safe to call this multiple times; it will not start a second loop.
   */
  public startLoop(): void {
    if (this.isRunning) {
      console.warn("Simulation loop is already running.");
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulatedTime = getSimulationState().time; // Sync with current state time

    this.subscriptionManager.dispose(); // Clear any existing subscriptions
    this.subscriptionManager.subscribeToStateComposition(
      this._resetTime$,
      () => {
        this.accumulatedTime = 0; // Reset internal accumulated time
        // The global state time is reset by celestialFactory.clearState
      },
    );

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(this.simulationStep);
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
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.subscriptionManager.dispose();
  }

  /**
   * Checks if the simulation loop is currently running.
   * @returns True if the loop is running, false otherwise.
   */
  public get isLoopRunning(): boolean {
    return this.isRunning;
  }

  /**
   * The core simulation step, executed on each animation frame.
   * This method calculates the time delta, runs the physics simulation,
   * updates the global state, and schedules the next frame.
   * @param currentTime - The current time provided by `requestAnimationFrame`.
   */
  private simulationStep = (currentTime: number): void => {
    if (!this.isRunning) return;

    const acquiredVectors: THREE.Vector3[] = []; // For vectorPool

    try {
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // Cap delta time to a minimum of 30 FPS to prevent physics instability on freezes or massive frame drops.
      const cappedDeltaTime = Math.min(deltaTime, 1 / 30);

      if (!getSimulationState().paused) {
        const timeScale = getSimulationState().timeScale;
        const scaledDeltaTime = cappedDeltaTime * timeScale;
        this.accumulatedTime += scaledDeltaTime;

        setSimulationState({
          ...getSimulationState(),
          time: this.accumulatedTime,
        });

        const activeBodiesReal = physicsSystemAdapter.getPhysicsBodies();
        const allCelestialObjectsForParams =
          physicsSystemAdapter.getCelestialObjectsSnapshot();

        const radii = new Map<string | number, number>();
        const isStar = new Map<string | number, boolean>();
        const bodyTypes = new Map<string | number, CelestialType>();
        const parentIds = new Map<string | number, string | undefined>();

        Object.values(allCelestialObjectsForParams)
          .filter(
            (obj: CelestialObject) =>
              obj.status !== CelestialStatus.DESTROYED &&
              obj.status !== CelestialStatus.ANNIHILATED &&
              !obj.ignorePhysics,
          )
          .forEach((obj: CelestialObject) => {
            if (obj.physicsStateReal) {
              radii.set(obj.id, obj.realRadius_m);
              isStar.set(obj.id, obj.type === CelestialType.STAR);
              bodyTypes.set(obj.id, obj.type);
              parentIds.set(obj.id, obj.parentId);
            }
          });

        const simParams: SimulationParameters = {
          radii,
          isStar,
          bodyTypes,
          parentIds,
          simulationConfig: getSimulationState().simulationConfig, // Pass the correct config
          orbitalParameters:
            physicsSystemAdapter.getOrbitalParametersSnapshot(),
          currentTime_s: this.accumulatedTime,
        };

        const result: SimulationStepResult = updateSimulation(
          activeBodiesReal,
          scaledDeltaTime,
          simParams,
        );

        if (result.destructionEvents && result.destructionEvents.length > 0) {
          result.destructionEvents.forEach((event: DestructionEvent) => {
            this._destructionOccurred$.next(event);
          });
        }

        physicsSystemAdapter.updateStateFromResult(result);

        // After physics, check for hierarchy changes (orphans, escapes)
        this.hierarchyManager.updateHierarchies();

        const updatedPositions: Record<
          string,
          { x: number; y: number; z: number }
        > = {};
        result.states.forEach((state) => {
          updatedPositions[String(state.id)] = {
            x: state.position_m.x,
            y: state.position_m.y,
            z: state.position_m.z,
          };
        });
        this._orbitUpdate$.next({ positions: updatedPositions });
      }
    } catch (error) {
      console.error("Error in simulation step:", error);
      this.stopLoop(); // Stop loop on critical error
    } finally {
      vectorPool.releaseAll(acquiredVectors); // Ensure vectors are always released
    }

    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.simulationStep);
    }
  };

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
      celestialFactory.clearState({
        resetCamera: false, // Camera reset is usually handled by UI/camera manager
        resetTime: true,
        resetSelection: true,
      });
    } else {
      // Even if skipping full state clear, internal time and resetTime$ event might be relevant.
      if (getSimulationState().time !== 0) {
        // If time is not already zero
        setSimulationState({ ...getSimulationState(), time: 0 });
      }
    }
    // Always reset internal accumulated time and emit event
    this.accumulatedTime = 0;
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
   * Cleans up resources used by the SimulationManager.
   * Stops the loop, and removes event listeners.
   */
  public dispose(): void {
    this.stopLoop();
    this._resetTime$.complete();
    this._orbitUpdate$.complete();
    this._destructionOccurred$.complete();
    this.subscriptionManager.dispose();
  }
}

export const simulationManager = SimulationManager.getInstance();
