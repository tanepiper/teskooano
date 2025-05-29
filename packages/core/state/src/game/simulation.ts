import { celestialFactory } from "./factory";
import { CelestialType } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { gameStateService } from "./stores";
import { celestialActions } from "./celestialActions";
import { BehaviorSubject, Observable } from "rxjs";
import type {
  PerformanceProfileType,
  SimulationState,
  CameraState,
  VisualSettingsState,
} from "./types";
import { PhysicsEngineType } from "@teskooano/data-types";

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
  public getCurrentState(): SimulationState {
    return this._simulationState.getValue();
  }

  /**
   * Sets the entire simulation state. Use with caution.
   * Prefer specific action methods for partial updates.
   * @param newState The complete new simulation state.
   */
  public setState(newState: SimulationState): void {
    this._simulationState.next(newState);
  }

  public setTimeScale(scale: number): void {
    this.setState({
      ...this.getCurrentState(),
      timeScale: scale,
    });
  }

  public togglePause(): void {
    const currentState = this.getCurrentState();
    this.setState({
      ...currentState,
      paused: !currentState.paused,
    });
  }

  public resetTime(): void {
    const currentState = this.getCurrentState();
    this.setState({
      ...currentState,
      time: 0,
      timeScale: 1,
      paused: false,
    });
  }

  public stepTime(dt: number = 1): void {
    const currentState = this.getCurrentState();
    if (currentState.paused) {
      this.setState({
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
    this.setState({
      ...this.getCurrentState(),
      selectedObject: objectId,
    });
  }

  public setFocusedObject(objectId: string | null): void {
    this.setState({
      ...this.getCurrentState(),
      focusedObjectId: objectId,
    });
  }

  public updateCamera(position: OSVector3, target: OSVector3): void {
    const currentState = this.getCurrentState();
    this.setState({
      ...currentState,
      camera: {
        ...currentState.camera,
        position,
        target,
      },
    });
  }

  public setPhysicsEngine(engine: PhysicsEngineType): void {
    const currentState = this.getCurrentState();

    // Fix for binary/multi-star systems when switching to ideal orbits mode
    if (engine === "kepler") {
      try {
        // Find the main star
        const objects = gameStateService.getCelestialObjects();
        const stars = Object.values(objects).filter(
          (obj: any) => obj.type === CelestialType.STAR,
        );

        // Sort stars by mass to find the primary
        stars.sort(
          (a: any, b: any) => (b.realMass_kg || 0) - (a.realMass_kg || 0),
        );

        if (stars.length > 0) {
          const primaryStar: any = stars[0];

          // Reset primary star position and velocity to origin
          // This prevents the entire system from moving as one unit
          if (primaryStar.physicsStateReal) {
            primaryStar.physicsStateReal.position_m = new OSVector3(0, 0, 0);
            primaryStar.physicsStateReal.velocity_mps = new OSVector3(0, 0, 0);

            // Update the star in the factory
            celestialActions.updateCelestialObject(primaryStar.id, {
              physicsStateReal: primaryStar.physicsStateReal,
            });

            console.log(
              `[SimulationState] Reset primary star ${primaryStar.name} position for ideal orbits mode`,
            );
          }
        }
      } catch (error) {
        console.error(
          "[SimulationState] Error fixing star positions for ideal orbits:",
          error,
        );
      }
    }

    this.setState({
      ...currentState,
      physicsEngine: engine,
    });
  }

  public setPerformanceProfile(profile: PerformanceProfileType): void {
    const currentState = this.getCurrentState();
    if (profile !== currentState.performanceProfile) {
      this.setState({
        ...currentState,
        performanceProfile: profile,
      });
    }
  }

  public setTrailLengthMultiplier(multiplier: number): void {
    const validatedMultiplier = Math.max(0, multiplier);
    const currentState = this.getCurrentState();
    if (
      validatedMultiplier !== currentState.visualSettings.trailLengthMultiplier
    ) {
      this.setState({
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
}

/** Singleton instance of the SimulationStateService. */
export const simulationStateService = SimulationStateService.getInstance();
