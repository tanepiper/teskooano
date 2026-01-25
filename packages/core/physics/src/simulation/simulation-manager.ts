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
import {
  adaptiveRKIntegrate,
  forestRuthIntegrate,
  leapfrogIntegrate,
  pefrlIntegrate,
  rk4Integrate,
  standardEuler,
  symplecticEuler,
  velocityVerletIntegrate,
  yoshida4Integrate,
} from "../integrators";
import {
  IdealOrreryStrategy,
  type IdealOrbitParams,
} from "../modes/ideal/ideal-orrery";
import { SpatialPartitioning } from "../spatial/spatial-partitioning";
import {
  EnhancedSimulationResult,
  IntegratorFunction,
  SimulationManagerParams,
} from "./types";

/**
 * Unified WASM-optimized simulation manager
 * Provides high-performance WASM spatial partitioning and collision detection
 * with configurable algorithms and integrators
 */
export class SimulationManager {
  /**
   * The ideal orrery strategy for the SimulationManager.
   */
  private idealOrreryStrategy: IdealOrreryStrategy;

  /**
   * The WASM spatial service for the SimulationOrchestrator.
   */
  private celestialDistanceService: CelestialDistanceService;

  /**
   * The WASM collision detection for the SimulationManager.
   */
  private collisionDetectionService: CollisionDetectionService;
  /**
   * The WASM spatial partitioning for the SimulationManager.
   */
  private spatialPartitioning: SpatialPartitioning;

  /**
   * Cache of algorithm instances for reuse
   */
  private algorithmInstances: Map<AlgorithmType, ForceCalculationAlgorithm> =
    new Map();

  /**
   * Pre-allocated vectors for force calculations to reduce memory allocation
   */
  private tempPositions = new Float32Array(1000 * 3); // Pre-allocate for WASM

  /**
   * Whether the SimulationManager is initialized.
   */
  private initialized = false;

  /**
   * The integrator function for the SimulationManager.
   */
  private integratorFunction: IntegratorFunction;

  constructor() {
    this.idealOrreryStrategy = new IdealOrreryStrategy();

    this.celestialDistanceService = CelestialDistanceService.getInstance();
    this.collisionDetectionService = new CollisionDetectionService({
      collisionDistance: 0.1 * AU_METERS,
    });

    this.spatialPartitioning = new SpatialPartitioning(1000 * AU_METERS);

    this.integratorFunction = this.createIntegratorFunction(
      IntegratorType.PEFRL,
    );
  }

  /**
   * Initialize the WASM systems
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.celestialDistanceService.initialize({
      neighborDistance: 1000 * AU_METERS,
    });

    await this.collisionDetectionService.initialize();
    await this.spatialPartitioning.initialize();

    this.initialized = true;
  }

  /**
   * Create integrator function based on type
   */
  private createIntegratorFunction(
    integratorType: IntegratorType,
  ): IntegratorFunction {
    switch (integratorType) {
      case IntegratorType.EULER:
        return (body, currentAcceleration, _, dt) =>
          standardEuler(body, currentAcceleration, dt);
      case IntegratorType.SYMPLECTIC:
        return (body, currentAcceleration, _, dt) =>
          symplecticEuler(body, currentAcceleration, dt);
      case IntegratorType.VERLET:
        return (body, currentAcceleration, calculateNewAcceleration, dt) =>
          velocityVerletIntegrate(
            body,
            currentAcceleration,
            calculateNewAcceleration,
            dt,
          );
      case IntegratorType.RK4:
        return (body, currentAcceleration, calculateNewAcceleration, dt) =>
          rk4Integrate(body, currentAcceleration, calculateNewAcceleration, dt);
      case IntegratorType.ADAPTIVE:
        return (body, currentAcceleration, calculateNewAcceleration, dt) => {
          const result = adaptiveRKIntegrate(
            body,
            currentAcceleration,
            calculateNewAcceleration,
            dt,
          );
          return result.newState;
        };
      case IntegratorType.YOSHIDA4:
        return (body, currentAcceleration, calculateNewAcceleration, dt) =>
          yoshida4Integrate(
            body,
            currentAcceleration,
            calculateNewAcceleration,
            dt,
          );
      case IntegratorType.FOREST_RUTH:
        return (body, currentAcceleration, calculateNewAcceleration, dt) =>
          forestRuthIntegrate(
            body,
            currentAcceleration,
            calculateNewAcceleration,
            dt,
          );
      case IntegratorType.PEFRL:
        return (body, currentAcceleration, calculateNewAcceleration, dt) =>
          pefrlIntegrate(
            body,
            currentAcceleration,
            calculateNewAcceleration,
            dt,
          );
      case IntegratorType.LEAPFROG:
        return (body, currentAcceleration, calculateNewAcceleration, dt) =>
          leapfrogIntegrate(
            body,
            currentAcceleration,
            calculateNewAcceleration,
            dt,
          );
      default:
        console.warn(
          `Unknown integrator: ${integratorType}, falling back to verlet`,
        );
        return (body, currentAcceleration, calculateNewAcceleration, dt) =>
          velocityVerletIntegrate(
            body,
            currentAcceleration,
            calculateNewAcceleration,
            dt,
          );
    }
  }

  /**
   * Update integrator function when configuration changes
   */
  private updateIntegratorFunction(integratorType: IntegratorType): void {
    this.integratorFunction = this.createIntegratorFunction(integratorType);
  }

  /**
   * Calculate acceleration for a body using the configured algorithm
   * Optimized with caching for expensive neighbor graph calculations
   */
  private calculateAccelerationForBody_NBody(
    targetBodyState: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    config: SimulationConfiguration,
    neighborGraph?: number[][],
  ): OSVector3 {
    // Use the algorithm specified in configuration, default to neighbor-based
    const algorithmType = config.algorithm || AlgorithmType.NEIGHBOR_BASED;
    const algorithm = this.getAlgorithmInstance(algorithmType);
    const barnesHutThreshold =
      config.barnesHutThreshold ?? config.neighborDistance;

    const result = algorithm.calculateAcceleration(targetBodyState, allBodies, {
      neighborDistance: config.neighborDistance,
      barnesHutThreshold,
      barnesHutTheta: config.barnesHutTheta,
      neighborGraph,
    });

    return result;
  }

  /**
   * Create or reuse a neighbor graph for the current step.
   */
  private getOrCreateNeighborGraph(
    bodies: PhysicsStateReal[],
    neighborDistance: number,
  ): number[][] {
    const positions = this.bodiesToFloat32Array(bodies);
    return this.spatialPartitioning.createNearByGraph(
      positions,
      neighborDistance,
    );
  }

  /**
   * Debug method to validate neighbor graph indices
   */
  private validateNeighborGraph(
    neighborGraph: number[][],
    allBodies: PhysicsStateReal[],
  ): void {
    for (let i = 0; i < neighborGraph.length; i++) {
      const neighbors = neighborGraph[i];
      for (const neighborIndex of neighbors) {
        if (neighborIndex < 0 || neighborIndex >= allBodies.length) {
          console.error(
            `Invalid neighbor graph: index ${neighborIndex} out of bounds for bodies array length ${allBodies.length}`,
          );
          console.error(`Body at index ${i}:`, allBodies[i]?.id);
          console.error(`Neighbor graph for body ${i}:`, neighbors);
        }
      }
    }
  }

  /**
   * Get or create an algorithm instance for the specified algorithm type
   */
  private getAlgorithmInstance(
    algorithmType: AlgorithmType = AlgorithmType.NEIGHBOR_BASED,
  ): ForceCalculationAlgorithm {
    if (!this.algorithmInstances.has(algorithmType)) {
      const dependencies: AlgorithmDependencies = {
        spatialPartitioning: this.spatialPartitioning,
        bodiesToFloat32Array: this.bodiesToFloat32Array.bind(this),
      };
      const algorithm = AlgorithmFactory.createAlgorithm(
        algorithmType,
        dependencies,
      );
      this.algorithmInstances.set(algorithmType, algorithm);
    }
    return this.algorithmInstances.get(algorithmType)!;
  }

  /**
   * Efficiently convert bodies to Float32Array for WASM library
   * Optimized to avoid unnecessary slicing and reduce allocations
   */
  private bodiesToFloat32Array(bodies: PhysicsStateReal[]): Float32Array {
    const requiredLength = bodies.length * 3;

    // Always create a new array with exact size to avoid WASM index confusion
    const positions = new Float32Array(requiredLength);

    // Fill the array with body positions
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const idx = i * 3;
      positions[idx] = body.position_m.x;
      positions[idx + 1] = body.position_m.y;
      positions[idx + 2] = body.position_m.z;
    }

    // Return exact-sized array to prevent WASM index mismatches
    return positions;
  }

  /**
   * Executes one simulation step with intelligent mode and algorithm selection
   */
  simulate(params: SimulationManagerParams): EnhancedSimulationResult {
    const startTime = performance.now();
    const { bodies, deltaTime, configuration } = params;

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
      integrator: IntegratorType.SYMPLECTIC,
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

    const config = params.configuration;

    // Update integrator if needed
    if (config.integrator) {
      this.updateIntegratorFunction(config.integrator as IntegratorType);
    }

    const algorithmType = config.algorithm || AlgorithmType.NEIGHBOR_BASED;
    const algorithm = this.getAlgorithmInstance(algorithmType);

    // Update WASM spatial partitioning (only if initialized)
    if (algorithm.update) {
      algorithm.update(params.bodies);
    } else if (this.spatialPartitioning.isInitialized()) {
      this.spatialPartitioning.update(params.bodies);
    } else {
      console.warn(
        "WASM spatial partitioning not initialized, skipping update",
      );
    }

    const usesNeighborGraph =
      algorithmType === AlgorithmType.FMM ||
      algorithmType === AlgorithmType.P3M ||
      algorithmType === AlgorithmType.TREE_PM;
    const neighborDistance = config.neighborDistance ?? 1000 * AU_METERS;
    const neighborGraph =
      usesNeighborGraph && this.spatialPartitioning.isInitialized()
        ? this.getOrCreateNeighborGraph(params.bodies, neighborDistance)
        : undefined;

    // Calculate accelerations using WASM spatial partitioning
    const accelerations = new Map<string, OSVector3>();
    params.bodies.forEach((body) => {
      const acc = this.calculateAccelerationForBody_NBody(
        body,
        params.bodies,
        params.configuration,
        neighborGraph,
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
          neighborGraph,
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
        algorithm: config.algorithm,
        integrator: config.integrator,
        executionTime: endTime - startTime,
        bodyCount: params.bodies.length,
      },
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.collisionDetectionService.dispose();
    this.spatialPartitioning.dispose();
    this.initialized = false;
  }
}
