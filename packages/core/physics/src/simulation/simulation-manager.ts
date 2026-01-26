import { OSVector3 } from "@teskooano/core-math";
import { CelestialDistanceService } from "@teskooano/core-physics";
import type { SimulationConfiguration } from "./types";
import {
  AlgorithmType,
  IntegratorType,
  SimulationMode,
  type PhysicsStateReal,
} from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-values";
import { AlgorithmFactory } from "../algorithms/algorithm-factory";
import {
  AlgorithmDependencies,
  ForceCalculationAlgorithm,
} from "../algorithms/force-calculation-algorithm";
import { CollisionDetectionService } from "../collision/collision-service";
import { velocityVerletIntegrate } from "../integrators";
import {
  IdealOrreryStrategy,
  type IdealOrbitParams,
} from "../modes/ideal/ideal-orrery";
import {
  EnhancedSimulationResult,
  IntegratorFunction,
  SimulationManagerParams,
} from "./types";

/**
 * Unified WASM-optimized simulation manager
 * Provides high-performance WASM spatial partitioning and collision detection
 * Uses Barnes-Hut algorithm and Velocity Verlet integrator (optimal for planetary N-body simulations)
 *
 * All spatial operations go through a single unified WASM pipeline via CelestialDistanceService
 * to ensure consistency and optimal performance.
 */
export class SimulationManager {
  /**
   * The ideal orrery strategy for the SimulationManager.
   */
  private idealOrreryStrategy: IdealOrreryStrategy;

  /**
   * The WASM spatial service (singleton, single source of truth for all spatial operations)
   */
  private celestialDistanceService: CelestialDistanceService;

  /**
   * The WASM collision detection for the SimulationManager.
   */
  private collisionDetectionService: CollisionDetectionService;

  /**
   * The algorithm instance (always Barnes-Hut)
   */
  private algorithmInstance?: ForceCalculationAlgorithm;

  /**
   * Whether the SimulationManager is initialized.
   */
  private initialized = false;

  /**
   * The integrator function for the SimulationManager.
   */
  private integratorFunction: IntegratorFunction;

  /**
   * Frame counter for tracking simulation steps (used for WASM update caching)
   */
  private frameCounter = 0;

  constructor() {
    this.idealOrreryStrategy = new IdealOrreryStrategy();

    // Use CelestialDistanceService singleton as single source of truth for WASM
    this.celestialDistanceService = CelestialDistanceService.getInstance();
    this.collisionDetectionService = new CollisionDetectionService({
      collisionDistance: 0.1 * AU_METERS,
    });

    this.integratorFunction = this.getIntegratorFunction();
  }

  /**
   * Initialize the WASM systems (single unified pipeline)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize WASM spatial partitioning (single source of truth)
    const wasmInitialized = await this.celestialDistanceService.initialize({
      neighborDistance: 1000 * AU_METERS,
    });

    if (!wasmInitialized) {
      console.error(
        "[SimulationManager] Failed to initialize WASM spatial partitioning",
      );
      // Don't set initialized = true if WASM failed
      return;
    }

    await this.collisionDetectionService.initialize();

    this.initialized = true;
  }

  /**
   * Get the integrator function (always Velocity Verlet)
   */
  private getIntegratorFunction(): IntegratorFunction {
    // Only Velocity Verlet is supported - it's optimal for N-body simulations
    return (body, currentAcceleration, calculateNewAcceleration, dt) =>
      velocityVerletIntegrate(
        body,
        currentAcceleration,
        calculateNewAcceleration,
        dt,
      );
  }

  /**
   * Calculate acceleration for a body using the configured algorithm
   * Optimized with caching for expensive neighbor graph calculations
   */
  private calculateAccelerationForBody_NBody(
    targetBodyState: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    config: SimulationConfiguration,
  ): OSVector3 {
    // Only Barnes-Hut is supported
    const algorithm = this.getAlgorithmInstance();
    const barnesHutThreshold =
      config.barnesHutThreshold ?? config.neighborDistance;

    const result = algorithm.calculateAcceleration(targetBodyState, allBodies, {
      neighborDistance: config.neighborDistance,
      barnesHutThreshold,
      barnesHutTheta: config.barnesHutTheta,
    });

    return result;
  }

  /**
   * Get or create the algorithm instance (always Barnes-Hut)
   * Uses the same WASM spatial partitioning instance as collision detection
   */
  private getAlgorithmInstance(): ForceCalculationAlgorithm {
    if (!this.algorithmInstance) {
      // Get the shared WASM spatial partitioning instance from CelestialDistanceService
      const spatialPartitioning =
        this.celestialDistanceService.getSpatialPartitioning();
      if (!spatialPartitioning) {
        throw new Error(
          "[SimulationManager] WASM spatial partitioning not initialized. Call initialize() first.",
        );
      }

      const dependencies: AlgorithmDependencies = {
        spatialPartitioning,
      };
      this.algorithmInstance = AlgorithmFactory.createAlgorithm(
        AlgorithmType.BARNES_HUT,
        dependencies,
      );
    }
    return this.algorithmInstance;
  }

  /**
   * Executes one simulation step with intelligent mode and algorithm selection
   */
  simulate(params: SimulationManagerParams): EnhancedSimulationResult {
    const startTime = performance.now();
    const { bodies, deltaTime, configuration } = params;

    // Verify initialization before proceeding
    if (!this.initialized) {
      console.warn(
        "[SimulationManager] simulate() called before initialization",
      );
      return {
        states: bodies,
        accelerations: new Map(),
        destroyedIds: new Set(),
        destructionEvents: [],
        metadata: {
          mode: configuration.mode,
          executionTime: performance.now() - startTime,
          bodyCount: bodies.length,
          warnings: ["SimulationManager not initialized"],
        },
      };
    }

    // For N-body mode, verify WASM is actually initialized
    if (
      configuration.mode === SimulationMode.NBODY &&
      !this.celestialDistanceService.isInitialized()
    ) {
      console.warn(
        "[SimulationManager] WASM spatial partitioning not initialized for N-body mode",
      );
      return {
        states: bodies,
        accelerations: new Map(),
        destroyedIds: new Set(),
        destructionEvents: [],
        metadata: {
          mode: configuration.mode,
          executionTime: performance.now() - startTime,
          bodyCount: bodies.length,
          warnings: ["WASM spatial partitioning not initialized"],
        },
      };
    }

    let result: EnhancedSimulationResult;

    if (configuration.mode === SimulationMode.IDEAL) {
      result = this.executeIdealMode(params, startTime);
    } else {
      result = this.executeNBodyMode(params, startTime);
    }

    return result;
  }

  /**
   * Creates a default configuration - user should customize as needed
   */
  createDefaultConfiguration(): SimulationConfiguration {
    return {
      mode: SimulationMode.NBODY,
      integrator: IntegratorType.VERLET,
      algorithm: AlgorithmType.BARNES_HUT,
      neighborDistance: AU_METERS,
      barnesHutThreshold: 100 * AU_METERS,
      barnesHutTheta: 0.5,
      collisionDetection: true,
    };
  }

  /**
   * Executes ideal orrery mode simulation
   */
  private executeIdealMode(
    params: SimulationManagerParams,
    startTime: number,
  ): EnhancedSimulationResult {
    const idealParams: IdealOrbitParams = {
      bodies: params.bodies,
      deltaTime: params.deltaTime,
      configuration: params.configuration,
      orbitalParameters: params.orbitalParameters!,
      parentIds: params.parentIds!,
      currentTime_s: params.currentTime_s!,
    };

    const result = this.idealOrreryStrategy.simulate(idealParams);
    const endTime = performance.now();

    return {
      states: result.states,
      accelerations: new Map(), // No force calculations in ideal mode
      destroyedIds: new Set(), // No collisions in ideal mode
      destructionEvents: [],
      metadata: {
        mode: SimulationMode.IDEAL,
        executionTime: endTime - startTime,
        bodyCount: params.bodies.length,
      },
    };
  }

  /**
   * Executes N-body mode simulation
   */
  private executeNBodyMode(
    params: SimulationManagerParams,
    startTime: number,
  ): EnhancedSimulationResult {
    if (!this.initialized) {
      console.warn(
        "SimulationManager not initialized, skipping N-body mode simulation",
      );
      // Return a minimal result to prevent crashes
      return {
        states: params.bodies,
        accelerations: new Map(),
        destroyedIds: new Set(),
        destructionEvents: [],
        metadata: {
          mode: SimulationMode.NBODY,
          executionTime: performance.now() - startTime,
          bodyCount: params.bodies.length,
          warnings: ["SimulationManager not initialized"],
        },
      };
    }

    // Increment frame counter for WASM update caching
    this.frameCounter++;

    const config = params.configuration;

    // Only Barnes-Hut + Velocity Verlet is supported
    const algorithm = this.getAlgorithmInstance();

    // Update WASM spatial partitioning through algorithm (single unified pipeline)
    // This ensures WASM is the single source of truth for all spatial operations
    // Use updateIfNeeded() to prevent redundant updates within the same frame
    if (algorithm.update) {
      algorithm.update(params.bodies, this.frameCounter);
    } else {
      console.warn(
        "[SimulationManager] Algorithm does not support update(), falling back to direct WASM update",
      );
      // Use CelestialDistanceService singleton for unified pipeline
      if (this.celestialDistanceService.isInitialized()) {
        this.celestialDistanceService.updateIfNeeded(
          params.bodies,
          this.frameCounter,
        );
      } else {
        console.warn(
          "[SimulationManager] WASM spatial partitioning not initialized",
        );
      }
    }

    // Calculate accelerations using WASM spatial partitioning
    const accelerations = new Map<string, OSVector3>();
    params.bodies.forEach((body) => {
      const acc = this.calculateAccelerationForBody_NBody(
        body,
        params.bodies,
        params.configuration,
      );
      accelerations.set(body.id, acc);
    });

    const predictedStates = params.bodies.map((body) => {
      const currentAcceleration =
        accelerations.get(body.id) || new OSVector3(0, 0, 0);
      const position = body.position_m
        .clone()
        .addScaledVector(body.velocity_mps, params.deltaTime)
        .addScaledVector(currentAcceleration, 0.5 * params.deltaTime ** 2);

      return {
        ...body,
        position_m: position,
      };
    });

    // Integration step using cached integrator
    const integratedStates = params.bodies.map((body) => {
      const currentAcceleration =
        accelerations.get(body.id) || new OSVector3(0, 0, 0);

      const calculateNewAccelerationForAdvanced = (
        stateGuess: PhysicsStateReal,
      ): OSVector3 => {
        const bodiesForAcceleration = predictedStates.map((predictedBody) =>
          predictedBody.id === stateGuess.id ? stateGuess : predictedBody,
        );
        return this.calculateAccelerationForBody_NBody(
          stateGuess,
          bodiesForAcceleration,
          params.configuration,
        );
      };

      return this.integratorFunction(
        body,
        currentAcceleration,
        calculateNewAccelerationForAdvanced,
        params.deltaTime,
      );
    });

    // Update collision detection with integrated states
    this.collisionDetectionService.update(
      integratedStates,
      params.radii || new Map(),
      params.isStar || new Map(),
      params.bodyTypes || new Map(),
      this.frameCounter,
    );
    const [finalStates, destroyedIds] =
      this.collisionDetectionService.handleCollisions(params.ignoreCollisions);

    const result = {
      states: finalStates,
      accelerations,
      destroyedIds,
    };

    const endTime = performance.now();

    return {
      states: result.states,
      accelerations: result.accelerations,
      destroyedIds: new Set(Array.from(result.destroyedIds).map(String)),
      destructionEvents: Array.from(result.destroyedIds),
      metadata: {
        mode: SimulationMode.NBODY,
        algorithm: AlgorithmType.BARNES_HUT,
        integrator: IntegratorType.VERLET,
        executionTime: endTime - startTime,
        bodyCount: params.bodies.length,
      },
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.algorithmInstance?.dispose) {
      this.algorithmInstance.dispose();
    }
    this.algorithmInstance = undefined;
    this.collisionDetectionService.dispose();
    this.celestialDistanceService.dispose();
    this.initialized = false;
  }
}
