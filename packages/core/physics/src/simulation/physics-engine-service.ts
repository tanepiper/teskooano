import { Observable, combineLatest, BehaviorSubject } from "rxjs";
import { scan, startWith } from "rxjs/operators";
import { PhysicsStateReal } from "../types";
import {
  SimulationOrchestrator,
  SimulationStepResult,
  SimulationParameters,
} from "./simulation-orchestrator";

/**
 * @class PhysicsEngineService
 * @description Singleton service that manages the physics simulation engine.
 * Provides Observable streams for real-time physics updates and coordinates
 * all physics calculations, integration, and collision handling.
 */
export class PhysicsEngineService {
  private static instance: PhysicsEngineService;
  private readonly orchestrator: SimulationOrchestrator;
  private readonly _currentState: BehaviorSubject<SimulationStepResult>;

  /** Observable stream of the current simulation state */
  public readonly currentState$: Observable<SimulationStepResult>;

  private constructor() {
    this.orchestrator = new SimulationOrchestrator();

    // Initialize with empty state
    const initialResult = this.orchestrator.createInitialResult([]);
    this._currentState = new BehaviorSubject<SimulationStepResult>(
      initialResult,
    );
    this.currentState$ = this._currentState.asObservable();
  }

  /**
   * Get the singleton instance of the PhysicsEngineService
   * @returns The singleton instance
   */
  public static getInstance(): PhysicsEngineService {
    if (!PhysicsEngineService.instance) {
      PhysicsEngineService.instance = new PhysicsEngineService();
    }
    return PhysicsEngineService.instance;
  }

  /**
   * Get the current simulation state synchronously
   * @returns Current simulation step result
   */
  public getCurrentState(): SimulationStepResult {
    return this._currentState.getValue();
  }

  /**
   * Execute a single simulation step
   * @param bodies Current physics bodies
   * @param dt Time step
   * @param params Simulation parameters
   * @returns Updated simulation result
   */
  public executeStep(
    bodies: PhysicsStateReal[],
    dt: number,
    params: SimulationParameters,
  ): SimulationStepResult {
    const result = this.orchestrator.executeSimulationStep(bodies, dt, params);
    this._currentState.next(result);
    return result;
  }

  /**
   * Reset the simulation to initial state
   * @param initialBodies Initial physics bodies
   */
  public reset(initialBodies: PhysicsStateReal[] = []): void {
    const initialResult = this.orchestrator.createInitialResult(initialBodies);
    this._currentState.next(initialResult);
  }

  /**
   * Create an Observable stream for continuous simulation updates
   * @param initialState Initial physics bodies
   * @param parameters$ Observable of simulation parameters
   * @param tick$ Observable of time deltas
   * @returns Observable stream of simulation results
   */
  public createSimulationStream(
    initialState: PhysicsStateReal[],
    parameters$: Observable<SimulationParameters>,
    tick$: Observable<number>,
  ): Observable<SimulationStepResult> {
    const initialResult = this.orchestrator.createInitialResult(initialState);

    return combineLatest([tick$, parameters$]).pipe(
      scan(
        (
          previousResult: SimulationStepResult,
          [dt, params]: [number, SimulationParameters],
        ) => {
          const result = this.orchestrator.executeSimulationStep(
            previousResult.states,
            dt,
            params,
          );
          this._currentState.next(result);
          return result;
        },
        initialResult,
      ),
      startWith(initialResult),
    );
  }

  /**
   * Update simulation with new bodies (useful for adding/removing objects)
   * @param bodies New set of physics bodies
   * @param params Current simulation parameters
   */
  public updateBodies(
    bodies: PhysicsStateReal[],
    params?: SimulationParameters,
  ): void {
    if (params) {
      // Execute a zero-time step to update internal state
      const result = this.orchestrator.executeSimulationStep(bodies, 0, params);
      this._currentState.next(result);
    } else {
      // Just update the bodies without executing physics
      const currentResult = this.getCurrentState();
      const updatedResult: SimulationStepResult = {
        ...currentResult,
        states: bodies,
      };
      this._currentState.next(updatedResult);
    }
  }

  /**
   * Get performance metrics for the current simulation state
   * @returns Performance metrics object
   */
  public getPerformanceMetrics(): PhysicsPerformanceMetrics {
    const currentState = this.getCurrentState();
    return {
      bodyCount: currentState.states.length,
      accelerationCount: currentState.accelerations.size,
      collisionCount: currentState.destructionEvents.length,
      destroyedBodyCount: currentState.destroyedIds.size,
    };
  }
}

/**
 * Performance metrics for the physics simulation
 */
export interface PhysicsPerformanceMetrics {
  bodyCount: number;
  accelerationCount: number;
  collisionCount: number;
  destroyedBodyCount: number;
}

/** Singleton instance of the PhysicsEngineService */
export const physicsEngineService = PhysicsEngineService.getInstance();

// Re-export the types and interfaces for convenience
export type {
  SimulationStepResult,
  SimulationParameters,
} from "./simulation-orchestrator";
