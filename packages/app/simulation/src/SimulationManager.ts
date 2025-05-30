import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { CelestialLabelComponentFactory } from "@teskooano/renderer-threejs-interaction";
import {
  physicsEngineService,
  vectorPool,
  type SimulationStepResult,
  type DestructionEvent,
  type SimulationParameters,
} from "@teskooano/core-physics";
import {
  getSimulationState,
  setSimulationState,
  physicsSystemAdapter,
  celestialFactory,
} from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  OrbitalParameters,
} from "@teskooano/data-types";
import * as THREE from "three";
import { Subject, Subscription, Observable } from "rxjs";

/**
 * Defines the payload for the orbit update event stream.
 */
export interface OrbitUpdatePayload {
  positions: Record<string, { x: number; y: number; z: number }>;
}

/**
 * Manages the overall simulation lifecycle, physics loop, state, and events.
 * Implemented as a singleton.
 */
export class SimulationManager {
  private static instance: SimulationManager;

  // Loop properties
  private lastTime = 0;
  private isRunning = false;
  // private lastLoggedTime = 0; // This wasn't used for logging, can be removed if confirmed
  private accumulatedTime = 0;
  private resetTimeSubscription: Subscription | null = null;
  private animationFrameId: number | null = null;

  // Event Subjects
  private readonly _resetTime$ = new Subject<void>();
  private readonly _orbitUpdate$ = new Subject<OrbitUpdatePayload>();
  private readonly _destructionOccurred$ = new Subject<DestructionEvent>();

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): SimulationManager {
    if (!SimulationManager.instance) {
      SimulationManager.instance = new SimulationManager();
    }
    return SimulationManager.instance;
  }

  // Public Observables for events
  public get onResetTime(): Observable<void> {
    return this._resetTime$.asObservable();
  }

  public get onOrbitUpdate(): Observable<OrbitUpdatePayload> {
    return this._orbitUpdate$.asObservable();
  }

  public get onDestructionOccurred(): Observable<DestructionEvent> {
    return this._destructionOccurred$.asObservable();
  }

  /**
   * Initializes the SimulationManager with the container for the renderer.
   * This must be called before starting the loop.
   * @param container The HTML element to host the renderer canvas.
   * @param options - Optional options for the renderer
   */
  public initialize() // container: HTMLElement, // REMOVED container argument
  // options?: { // REMOVED options argument
  //   celestialLabelComponentFactory?: CelestialLabelComponentFactory;
  // },
  : void {
    // if (this.renderer) { // REMOVED renderer check
    //   console.warn("SimulationManager already initialized.");
    //   // Optionally, dispose existing renderer or handle re-initialization
    //   this.disposeRenderer();
    // }
    // this.container = container; // REMOVED
    // this.renderer = new ModularSpaceRenderer(this.container, { // REMOVED
    //   celestialLabelComponentFactory: options?.celestialLabelComponentFactory,
    // });
    // this.setupEventListeners(); // We might not need this version of setupEventListeners
    console.log("SimulationManager initialized (global aspects only).");
  }

  // public getRenderer(): ModularSpaceRenderer | null { // REMOVED
  //   return this.renderer;
  // }

  private setupEventListeners(): void {
    // window.addEventListener("resize", this.handleResize); // Potentially re-evaluate if global resize handling is needed beyond individual panels
  }

  private removeEventListeners(): void {
    // window.removeEventListener("resize", this.handleResize); // Potentially re-evaluate
  }

  // private handleResize = (): void => { // REMOVED direct renderer resizing
  // if (this.renderer && this.container) {
  //   // Use container dimensions for renderer, not necessarily full window
  //   this.renderer.onResize(
  //     this.container.clientWidth,
  //     this.container.clientHeight,
  //   );
  // }
  // };

  public startLoop(): void {
    if (this.isRunning) {
      console.warn("Simulation loop is already running.");
      return;
    }
    // if (!this.renderer) { // REMOVED renderer check
    //   console.error(
    //     "Renderer not initialized. Call initialize() before starting the loop.",
    //   );
    //   return;
    // }

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
    console.log("Simulation loop started.");
  }

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
    console.log("Simulation loop stopped.");
  }

  public get isLoopRunning(): boolean {
    return this.isRunning;
  }

  private simulationStep = (currentTime: number): void => {
    if (!this.isRunning) return;

    // Renderer-specific updates (like this.renderer.update()) would be removed from here.
    // Each renderer will have its own update mechanism triggered by the animation frame or this loop.
    // For now, this simulationStep focuses on updating the core physics state.

    const acquiredVectors: THREE.Vector3[] = []; // For vectorPool

    try {
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      const fixedDeltaTime = Math.min(deltaTime, 0.008); // 8ms fixed step

      if (!getSimulationState().paused) {
        const timeScale = getSimulationState().timeScale;
        const scaledDeltaTime = fixedDeltaTime * timeScale;
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
        const orbitalParams = new Map<string | number, OrbitalParameters>();

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
              if (obj.orbit) {
                orbitalParams.set(obj.id, obj.orbit);
              }
            }
          });

        const simParams: SimulationParameters = {
          radii,
          isStar,
          bodyTypes,
          parentIds,
          orbitalParams,
          currentTime: this.accumulatedTime,
          octreeMaxDepth: 20, // high depth for accurate close-body interactions
          softeningLength: 1e6, // 1000 km softening to calm close passes
          physicsEngine: getSimulationState().physicsEngine,
        };

        const stepResult: SimulationStepResult =
          physicsEngineService.executeStep(
            activeBodiesReal,
            scaledDeltaTime,
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

        // Rotation logic (remains a bit problematic as in original, might need adjustment)
        const currentCelestialObjectsAfterUpdate =
          physicsSystemAdapter.getCelestialObjectsSnapshot();
        const finalStateMapWithRotations: Record<string, CelestialObject> = {
          ...currentCelestialObjectsAfterUpdate,
        };

        Object.keys(finalStateMapWithRotations).forEach((id) => {
          const obj = finalStateMapWithRotations[id];
          if (
            obj.status !== CelestialStatus.DESTROYED &&
            obj.status !== CelestialStatus.ANNIHILATED &&
            obj.siderealRotationPeriod_s &&
            obj.siderealRotationPeriod_s > 0 &&
            obj.axialTilt
          ) {
            const angle =
              ((2 * Math.PI * this.accumulatedTime) /
                obj.siderealRotationPeriod_s) %
              (2 * Math.PI);
            const tiltAxisTHREE = new THREE.Vector3(
              obj.axialTilt.x,
              obj.axialTilt.y,
              obj.axialTilt.z,
            ).normalize();
            const newRotation = new THREE.Quaternion().setFromAxisAngle(
              tiltAxisTHREE,
              angle,
            );
            (finalStateMapWithRotations[id] as any).rotation = newRotation; // Ad-hoc property
          }
        });
        // If these rotations are critical, physicsSystemAdapter.updateStateFromResult might need to be aware of them,
        // or another mechanism to persist them to the global state is needed if consumers expect them.

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
   * Resets celestial objects and simulation state.
   * This also emits the onResetTime event.
   * @param skipStateClear - Set to true if calling code will use createSolarSystem which also clears state
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
      // Even if skipping full state clear, internal time and resetTime$ event might be relevant.
      if (getSimulationState().time !== 0) {
        // If time is not already zero
        setSimulationState({ ...getSimulationState(), time: 0 });
      }
    }
    // Always reset internal accumulated time and emit event
    this.accumulatedTime = 0;
    this._resetTime$.next();
    console.log("System reset triggered.");
  }

  // private disposeRenderer(): void { // REMOVED
  //   if (this.renderer) {
  //     this.renderer.dispose();
  //     this.renderer = null;
  //     console.log("Renderer disposed by SimulationManager.");
  //   }
  // }
  public dispose(): void {
    this.stopLoop();
    // this.disposeRenderer(); // REMOVED
    this.removeEventListeners(); // Call to remove any global listeners it might still manage

    // Complete subjects to prevent further emissions and signal completion
    this._resetTime$.complete();
    this._orbitUpdate$.complete();
    this._destructionOccurred$.complete();

    // Clear the static instance for potential re-instantiation in test environments or special cases
    // (SimulationManager as any).instance = null; // Consider if this is desired for your testing strategy
    console.log("SimulationManager disposed.");
  }
}
