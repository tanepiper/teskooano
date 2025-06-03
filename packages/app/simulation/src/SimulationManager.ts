import {
  physicsEngineService,
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
} from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  type CelestialOrbitalProperties,
} from "@teskooano/celestial-object";
import { Observable, Subject, Subscription } from "rxjs";
import * as THREE from "three";
import { OrbitUpdatePayload } from "./types";

/**
 * Manages the overall simulation lifecycle, physics loop, state, and events.
 * Implemented as a singleton.
 */
export class SimulationManager {
  /** @internal Singleton instance of the SimulationManager. */
  private static instance: SimulationManager;

  // Loop properties
  /** @internal Timestamp of the last simulation step. Used to calculate delta time. */
  private lastTime = 0;
  /** @internal Flag indicating if the simulation loop is currently active. */
  private isRunning = false;
  // private lastLoggedTime = 0; // This wasn't used for logging, can be removed if confirmed
  /** @internal Accumulated simulation time, scaled by timeScale. Represents the in-simulation time. */
  private accumulatedTime = 0; // Total elapsed simulation time (scaled)
  /** @internal Subscription to the resetTime event, used for internal cleanup. */
  private resetTimeSubscription: Subscription | null = null;
  /** @internal ID of the current animation frame request. Used to cancel the frame. */
  private animationFrameId: number | null = null;

  // Fixed time step properties
  /** @internal Maximum number of physics steps to accumulate before processing. */
  private readonly MAX_ACCUMULATED_STEPS = 5;
  /** @internal Target number of physics updates per second. */
  private readonly PHYSICS_TICK_RATE_HZ = 125; // Target physics updates per second
  /** @internal The fixed time step duration in seconds for each physics update. */
  private readonly FIXED_PHYSICS_DT_S = 1.0 / this.PHYSICS_TICK_RATE_HZ;
  /** @internal Accumulates real-world time elapsed between frames, used to determine how many fixed physics steps to run. */
  private timeAccumulatorForPhysics = 0; // Accumulates wall-clock time for physics steps

  // Event Subjects
  /** @internal RxJS Subject for resetTime events. */
  private readonly _resetTime$ = new Subject<void>();
  /** @internal RxJS Subject for orbitUpdate events. */
  private readonly _orbitUpdate$ = new Subject<OrbitUpdatePayload>();
  /** @internal RxJS Subject for destructionOccurred events. */
  private readonly _destructionOccurred$ = new Subject<DestructionEvent>();

  /**
   * @private Private constructor to enforce singleton pattern.
   */
  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Gets the singleton instance of the SimulationManager.
   * @returns The singleton SimulationManager instance.
   */
  public static getInstance(): SimulationManager {
    if (!SimulationManager.instance) {
      SimulationManager.instance = new SimulationManager();
    }
    return SimulationManager.instance;
  }

  // Public Observables for events
  /**
   * Observable that emits when the simulation time and state are reset.
   * @returns An Observable that emits void on reset.
   */
  public get onResetTime(): Observable<void> {
    return this._resetTime$.asObservable();
  }

  /**
   * Observable that emits updated celestial object positions after each relevant physics step.
   * The payload contains a map of object IDs to their new x, y, z coordinates.
   * @returns An Observable emitting OrbitUpdatePayload.
   */
  public get onOrbitUpdate(): Observable<OrbitUpdatePayload> {
    return this._orbitUpdate$.asObservable();
  }

  /**
   * Observable that emits when a destruction event occurs in the simulation.
   * The payload contains details about the destruction event.
   * @returns An Observable emitting DestructionEvent.
   */
  public get onDestructionOccurred(): Observable<DestructionEvent> {
    return this._destructionOccurred$.asObservable();
  }

  /**
   * Starts the main simulation loop.
   * If the loop is already running, a warning is logged, and the call is ignored.
   * Initializes timing mechanisms and schedules the first animation frame.
   */
  public startLoop(): void {
    if (this.isRunning) {
      console.warn("Simulation loop is already running.");
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulatedTime = getSimulationState().time; // Sync with current state time

    this.resetTimeSubscription?.unsubscribe(); // Ensure no old subscription
    this.resetTimeSubscription = this._resetTime$.subscribe(() => {
      this.accumulatedTime = 0; // Reset internal accumulated time
      // The global state time is reset by celestialFactory.clearState
    });

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(this.simulationStep);
  }

  /**
   * Stops the main simulation loop.
   * If the loop is not running, a warning is logged, and the call is ignored.
   * Cancels any pending animation frame and cleans up loop-related subscriptions.
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
    this.resetTimeSubscription?.unsubscribe();
    this.resetTimeSubscription = null;
  }

  /**
   * Checks if the simulation loop is currently active.
   * @returns True if the loop is running, false otherwise.
   */
  public get isLoopRunning(): boolean {
    return this.isRunning;
  }

  /**
   * @private The main simulation loop callback, executed via requestAnimationFrame.
   * This method calculates elapsed time, manages the physics step accumulator, and calls
   * `_performSinglePhysicsStep` for each fixed physics tick.
   * It also updates the global simulation time state and schedules the next animation frame.
   * @param currentTime The high-resolution timestamp provided by requestAnimationFrame.
   */
  private simulationStep = (currentTime: number): void => {
    if (!this.isRunning) return;

    const acquiredVectors: THREE.Vector3[] = []; // For vectorPool

    try {
      const elapsedFrameTime_s = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      this.timeAccumulatorForPhysics += elapsedFrameTime_s;

      // Cap the accumulator to prevent spiral of death if frames take too long
      // e.g., max 5 physics steps per frame to prevent freezing if performance tanks
      if (
        this.timeAccumulatorForPhysics >
        this.FIXED_PHYSICS_DT_S * this.MAX_ACCUMULATED_STEPS
      ) {
        this.timeAccumulatorForPhysics =
          this.FIXED_PHYSICS_DT_S * this.MAX_ACCUMULATED_STEPS;
      }

      while (this.timeAccumulatorForPhysics >= this.FIXED_PHYSICS_DT_S) {
        if (!getSimulationState().paused) {
          const timeScale = getSimulationState().timeScale;
          // Use the fixed physics dt, scaled by the current timeScale
          const scaledFixedDeltaTime = this.FIXED_PHYSICS_DT_S * timeScale;
          this.accumulatedTime += scaledFixedDeltaTime; // This is the total simulation time

          this._performSinglePhysicsStep(scaledFixedDeltaTime, acquiredVectors);
        }
        // Decrement accumulator by one fixed step
        this.timeAccumulatorForPhysics -= this.FIXED_PHYSICS_DT_S;

        // If paused, break out of the physics step loop, but still consume the accumulated time for this iteration.
        if (getSimulationState().paused) {
          break;
        }
      }

      // Update the global simulation time state once after all physics steps for this frame are done
      // This ensures the UI reflects the most up-to-date simulation time.
      if (!getSimulationState().paused) {
        setSimulationState({
          ...getSimulationState(),
          time: this.accumulatedTime,
        });
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
   * Executes a single step of the physics simulation and updates related game state.
   * This includes physics calculations, collision handling, rotation updates, and event emissions.
   * @param scaledFixedDeltaTime The fixed time step, scaled by the simulation's timeScale.
   * @param acquiredVectors An array to track acquired vectors for the vectorPool (currently unused here but kept for potential future use if direct vectorPool ops are needed).
   */
  private _performSinglePhysicsStep(
    scaledFixedDeltaTime: number,
    acquiredVectors: THREE.Vector3[],
  ): void {
    const allCelestialObjectsForParams =
      physicsSystemAdapter.getCelestialObjectsSnapshot();

    const simParams = this._prepareSimulationParameters(
      allCelestialObjectsForParams,
      this.accumulatedTime,
    );

    const stepResult: SimulationStepResult = physicsEngineService.executeStep(
      physicsSystemAdapter.getPhysicsBodies(), // Get fresh bodies before step
      scaledFixedDeltaTime,
      simParams,
    );

    if (
      stepResult.destructionEvents &&
      stepResult.destructionEvents.length > 0
    ) {
      stepResult.destructionEvents.forEach((event: DestructionEvent) => {
        this._destructionOccurred$.next(event);
      });
    }

    physicsSystemAdapter.updateStateFromResult(stepResult);

    // Get the state *after* the main physics update to apply rotations
    const currentCelestialObjectsAfterPhysicsUpdate =
      physicsSystemAdapter.getCelestialObjectsSnapshot();

    this._applyObjectRotations(
      currentCelestialObjectsAfterPhysicsUpdate,
      this.accumulatedTime,
    );

    // Note: The ad-hoc `rotation` property applied by _applyObjectRotations
    // isn't persisted back to the global state via physicsSystemAdapter.
    // If other systems need this rotation, this needs to be addressed more formally.

    const updatedPositions: Record<
      string,
      { x: number; y: number; z: number }
    > = {};
    stepResult.states.forEach((state) => {
      updatedPositions[String(state.id)] = {
        x: state.position_m.x,
        y: state.position_m.y,
        z: state.position_m.z,
      };
    });
    this._orbitUpdate$.next({ positions: updatedPositions });
  }

  /**
   * Prepares the SimulationParameters object needed for the physics engine step.
   * @param celestialObjectsSnapshot A snapshot of all current celestial objects.
   * @param currentTime The current accumulated simulation time.
   * @returns SimulationParameters object.
   */
  private _prepareSimulationParameters(
    celestialObjectsSnapshot: Record<string, CelestialObject>,
    currentTime: number,
  ): SimulationParameters {
    const radii = new Map<string | number, number>();
    const isStar = new Map<string | number, boolean>();
    const bodyTypes = new Map<string | number, CelestialType>();
    const parentIds = new Map<string | number, string | undefined>();
    const orbitalParams = new Map<
      string | number,
      CelestialOrbitalProperties
    >();

    Object.values(celestialObjectsSnapshot)
      .filter(
        (obj: CelestialObject) =>
          obj.status !== CelestialStatus.DESTROYED && !obj.ignorePhysics,
      )
      .forEach((obj: CelestialObject) => {
        radii.set(obj.id, obj.physicalProperties.radius);
        isStar.set(obj.id, obj.type === CelestialType.STAR);
        bodyTypes.set(obj.id, obj.type.toUpperCase() as any);
        parentIds.set(obj.id, obj.parent?.id);
        if (obj.orbit) {
          orbitalParams.set(obj.id, obj.orbit);
        }
      });

    return {
      radii,
      isStar,
      bodyTypes,
      parentIds,
      orbitalParams,
      currentTime,
      octreeMaxDepth: 20,
      softeningLength: 1e6,
      physicsEngine: getSimulationState().physicsEngine,
    };
  }

  /**
   * Calculates and applies ad-hoc rotation quaternions to celestial objects.
   * Note: This rotation is not formally part of the persisted PhysicsStateReal.
   * @param celestialObjects A map of celestial objects to apply rotations to.
   * @param currentTime The current accumulated simulation time.
   */
  private _applyObjectRotations(
    celestialObjects: Record<string, CelestialObject>,
    currentTime: number,
  ): void {
    Object.keys(celestialObjects).forEach((id) => {
      const obj = celestialObjects[id];
      if (
        obj.status !== CelestialStatus.DESTROYED &&
        obj.physicalProperties.siderealRotationPeriod_s &&
        obj.physicalProperties.siderealRotationPeriod_s > 0 &&
        obj.physicalProperties.axialTilt
      ) {
        const angle =
          ((2 * Math.PI * currentTime) /
            obj.physicalProperties.siderealRotationPeriod_s) %
          (2 * Math.PI);
        const tiltAxisTHREE = new THREE.Vector3(
          obj.physicalProperties.axialTilt.x,
          obj.physicalProperties.axialTilt.y,
          obj.physicalProperties.axialTilt.z,
        ).normalize();
        const newRotation = new THREE.Quaternion().setFromAxisAngle(
          tiltAxisTHREE,
          angle,
        );
        // This is an ad-hoc property. If this rotation needs to be more formally part
        // of the object's state for other systems (e.g., rendering, detailed physics),
        // it should be integrated into the CelestialObject type and state management.
        (obj as any).rotation = newRotation;
      }
    });
  }

  /**
   * Resets celestial objects and simulation state.
   * Clears all existing celestial objects, resets simulation time, and selection states
   * unless `skipStateClear` is true. Always resets internal accumulated time and emits
   * the `onResetTime` event.
   *
   * @param skipStateClear - Set to true if the calling code (e.g., a system initializer like
   *                         `createSolarSystem`) will handle clearing the global simulation state.
   *                         This is to avoid redundant state clearing operations.
   */
  public resetSystem(skipStateClear: boolean = false): void {
    if (!skipStateClear) {
      celestialFactory.clearState({
        resetCamera: false, // Camera reset is usually handled by UI/camera manager
        resetTime: true,
        resetSelection: true,
      });
    } else {
      console.warn(
        "[SimulationManager] Skipping state clear as external system creation will handle it.",
      );
      if (getSimulationState().time !== 0) {
        setSimulationState({ ...getSimulationState(), time: 0 });
      }
    }
    // Always reset internal accumulated time and emit event
    this.accumulatedTime = 0;
    this._resetTime$.next();
  }

  /**
   * Stops the simulation loop and completes all event observables.
   * This prepares the SimulationManager for disposal or re-initialization in test environments.
   */
  public dispose(): void {
    this.stopLoop();

    this._resetTime$.complete();
    this._orbitUpdate$.complete();
    this._destructionOccurred$.complete();
  }
}

// Export the singleton instance for easy access
export const simulationManager = SimulationManager.getInstance();
