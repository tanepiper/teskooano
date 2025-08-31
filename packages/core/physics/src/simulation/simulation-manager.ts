import { OSVector3 } from "@teskooano/core-math";
import {
  type PhysicsStateReal,
  type OrbitalParameters,
  SimulationMode,
  AlgorithmType,
  IntegratorType,
  CelestialType,
} from "@teskooano/data-types";
import type { SimulationConfiguration } from "@teskooano/core-state";
import { AlgorithmFactory } from "../algorithms/algorithm-factory";
import {
  IdealOrreryStrategy,
  type IdealOrbitParams,
} from "../modes/ideal/ideal-orrery";
import { WasmCollisionDetection } from "../collision/wasm-collision";
import { WasmSpatialPartitioning } from "../spatial/wasm-partitioning";
import { calculateNewtonianGravitationalForce } from "../forces/gravity";
import {
  velocityVerletIntegrate,
  standardEuler,
  symplecticEuler,
  idealOrbit,
  rk4Integrate,
  adaptiveRKIntegrate,
  yoshida4Integrate,
  forestRuthIntegrate,
  pefrlIntegrate,
  leapfrogIntegrate,
} from "../integrators";
import { sortBodiesByHierarchy } from "../utils";
import {
  ResonanceIntegrator,
  estimateResonantSemiMajorAxisAU,
  findNearestResonance,
  ResonanceType,
} from "../orbital";
import { celestialManager } from "@teskooano/core-state";
import {
  AU_METERS,
  GRAVITATIONAL_CONSTANT,
  GRAVITATIONAL_SOFTENING_SQUARED,
} from "@teskooano/data-values";

/**
 * Enhanced simulation result with performance metrics and metadata
 */
export interface EnhancedSimulationResult {
  states: PhysicsStateReal[];
  accelerations: Map<string, OSVector3>;
  destroyedIds: Set<string>;
  destructionEvents: any[];
  metadata: {
    mode: SimulationMode;
    algorithm?: string;
    integrator?: string;
    executionTime: number;
    bodyCount: number;
    performanceProfile?: {
      relativeSpeed: number;
      memoryUsage: string;
      accuracy: string;
      isOptimal: boolean;
    };
    recommendations?: string[];
    warnings?: string[];
  };
}

/**
 * Parameters for the simulation manager
 */
export interface SimulationManagerParams {
  bodies: PhysicsStateReal[];
  deltaTime: number;
  configuration: SimulationConfiguration;

  // Required for ideal mode
  orbitalParameters?: Map<string, OrbitalParameters>;
  parentIds?: Map<string, string>;
  currentTime_s?: number;

  // Required for N-body mode
  radii?: Map<string, number>;
  isStar?: Map<string, boolean>;
  bodyTypes?: Map<string, any>;
  octreeSize?: number;
  barnesHutTheta?: number;
  ignoreCollisions?: Map<string, boolean>;

  // Optional preferences
  autoSelectAlgorithm?: boolean;
  performancePreferences?: {
    prioritizeAccuracy?: boolean;
    prioritizeSpeed?: boolean;
    maxMemoryUsage?: "low" | "medium" | "high";
  };
}

/**
 * Type for cached integrator functions
 */
type IntegratorFunction = (
  body: PhysicsStateReal,
  currentAcceleration: OSVector3,
  calculateNewAcceleration: (stateGuess: PhysicsStateReal) => OSVector3,
  dt: number,
) => PhysicsStateReal;

/**
 * Unified WASM-optimized simulation manager
 * Provides intelligent algorithm selection, performance monitoring, and validation
 * with high-performance WASM spatial partitioning and collision detection
 */
export class SimulationManager {
  private idealOrreryStrategy: IdealOrreryStrategy;

  // WASM systems
  private wasmCollisionDetection: WasmCollisionDetection;
  private wasmSpatialPartitioning: WasmSpatialPartitioning;
  private initialized = false;

  // Caching for performance optimization
  private integratorFunction: IntegratorFunction;
  // Throttle resonance analysis to avoid per-step cost
  private resonanceElapsed_s: number = 0;

  constructor() {
    this.idealOrreryStrategy = new IdealOrreryStrategy();

    // Initialize WASM systems
    this.wasmCollisionDetection = new WasmCollisionDetection({
      collisionDistance: 0.1 * AU_METERS, // 0.1 AU
    });

    this.wasmSpatialPartitioning = new WasmSpatialPartitioning(
      1000 * AU_METERS,
    ); // 1000 AU

    // Initialize with default integrator
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

    await this.wasmCollisionDetection.initialize();
    await this.wasmSpatialPartitioning.initialize();
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
   * Calculate acceleration for a body using WASM spatial partitioning
   */
  private calculateAccelerationForBody_NBody(
    targetBodyState: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
  ): OSVector3 {
    // Use WASM spatial partitioning for neighbor finding, then calculate forces
    const neighborIds = this.wasmSpatialPartitioning.findNeighbors(
      targetBodyState.id,
    );

    const netForce = new OSVector3(0, 0, 0);

    // Create a map for fast body lookup
    const bodyMap = new Map<string | number, PhysicsStateReal>();
    for (const body of allBodies) {
      bodyMap.set(body.id, body);
    }

    // Calculate forces from all neighboring bodies
    for (const neighborId of neighborIds) {
      // Skip self-interaction
      if (neighborId === targetBodyState.id) continue;

      // Get neighbor body from the bodies array
      const neighborBody = bodyMap.get(neighborId);
      if (!neighborBody) continue;

      // Calculate gravitational force using standardized function
      const force = calculateNewtonianGravitationalForce(
        neighborBody,
        targetBodyState,
        GRAVITATIONAL_CONSTANT,
      );
      netForce.add(force);
    }

    const acceleration = new OSVector3(0, 0, 0);
    if (targetBodyState.mass_kg !== 0) {
      acceleration.copy(netForce).multiplyScalar(1 / targetBodyState.mass_kg);
    }
    return acceleration;
  }

  /**
   * Executes one simulation step with intelligent mode and algorithm selection
   */
  simulate(params: SimulationManagerParams): EnhancedSimulationResult {
    const startTime = performance.now();
    const { bodies, deltaTime, configuration } = params;

    // Validate configuration
    const validation = this.validateConfiguration(configuration, params);
    if (!validation.isValid) {
      throw new Error(
        `Invalid simulation configuration: ${validation.errors.join(", ")}`,
      );
    }

    let result: EnhancedSimulationResult;

    if (configuration.mode === SimulationMode.IDEAL) {
      result = this.executeIdealMode(params, startTime);
    } else {
      result = this.executeNBodyMode(params, startTime);
    }

    // Add performance analysis and recommendations
    this.enhanceResultWithAnalysis(result, params);

    return result;
  }

  /**
   * Automatically creates optimal configuration based on current simulation state
   */
  createOptimalConfiguration(
    params: SimulationManagerParams,
  ): SimulationConfiguration {
    return AlgorithmFactory.createOptimalConfiguration(
      params.bodies.length,
      SimulationMode.NBODY,
      params.performancePreferences,
    );
  }

  /**
   * Provides performance estimates for different configurations
   */
  getPerformanceComparison(params: SimulationManagerParams): {
    ideal?: { available: boolean; reason?: string; estimatedSpeed: number };
    configurations: Array<{
      config: SimulationConfiguration;
      estimate: {
        relativeSpeed: number;
        memoryUsage: string;
        accuracy: string;
        isOptimal: boolean;
      };
      validation: {
        isValid: boolean;
        warnings: string[];
        recommendations: string[];
      };
    }>;
  } {
    const bodyCount = params.bodies.length;
    const hasOrbitalData = params.orbitalParameters && params.parentIds;

    const result: any = {
      configurations: [],
    };

    // Check ideal mode availability
    if (hasOrbitalData) {
      result.ideal = {
        available: true,
        estimatedSpeed: bodyCount, // Linear time for ideal mode
      };
    } else {
      result.ideal = {
        available: false,
        reason: "Missing orbital parameters or parent hierarchy",
        estimatedSpeed: 0,
      };
    }

    // Generate estimates for all N-body configurations
    const algorithms = [
      AlgorithmType.BARNES_HUT,
      AlgorithmType.FMM,
      AlgorithmType.P3M,
      AlgorithmType.TREE_PM,
    ] as const;
    const integrators = [
      IntegratorType.EULER,
      IntegratorType.SYMPLECTIC,
      IntegratorType.VERLET,
      IntegratorType.RK4,
      IntegratorType.ADAPTIVE,
      IntegratorType.YOSHIDA4,
      IntegratorType.FOREST_RUTH,
      IntegratorType.PEFRL,
      IntegratorType.LEAPFROG,
    ] as const;

    for (const algorithm of algorithms) {
      for (const integrator of integrators) {
        const config: SimulationConfiguration = {
          mode: SimulationMode.NBODY,
          algorithm,
          integrator,
        };

        const estimate = AlgorithmFactory.getPerformanceEstimate(
          algorithm,
          bodyCount,
        );
        const validation = AlgorithmFactory.validateAlgorithmChoice(
          algorithm,
          bodyCount,
        );

        result.configurations.push({
          config,
          estimate,
          validation,
        });
      }
    }

    // Sort by relative speed (best first)
    result.configurations.sort(
      (a: any, b: any) => b.estimate.relativeSpeed - a.estimate.relativeSpeed,
    );

    return result;
  }

  /**
   * Validates simulation configuration and parameters
   */
  private validateConfiguration(
    config: SimulationConfiguration,
    params: SimulationManagerParams,
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic configuration validation
    if (!config.mode) {
      errors.push("Simulation mode is required");
    }

    if (config.mode === SimulationMode.IDEAL) {
      if (!params.orbitalParameters) {
        errors.push("Orbital parameters required for ideal mode");
      }
      if (!params.parentIds) {
        errors.push("Parent hierarchy required for ideal mode");
      }
      if (params.currentTime_s === undefined) {
        errors.push("Current time required for ideal mode");
      }
    }

    if (config.mode === SimulationMode.NBODY) {
      if (!config.algorithm) {
        errors.push("Algorithm required for N-body mode");
      }
      if (!config.integrator) {
        errors.push("Integrator required for N-body mode");
      }
      if (!params.radii) {
        warnings.push(
          "Body radii not provided - collision detection will be skipped",
        );
      }
    }

    // Body count validation
    if (params.bodies.length === 0) {
      warnings.push("No bodies provided for simulation");
    }

    // Algorithm-specific validation
    if (config.mode === SimulationMode.NBODY && config.algorithm) {
      const validation = AlgorithmFactory.validateAlgorithmChoice(
        config.algorithm,
        params.bodies.length,
      );
      errors.push(
        ...validation.warnings.filter((w) => w.includes("not recommended")),
      );
      warnings.push(...validation.recommendations);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
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
        performanceProfile: {
          relativeSpeed: params.bodies.length, // Linear time
          memoryUsage: "low",
          accuracy: "exact",
          isOptimal: true,
        },
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
    // Auto-select algorithm if requested
    let config = params.configuration;
    if (params.autoSelectAlgorithm && config.mode === SimulationMode.NBODY) {
      const optimalAlgorithm = AlgorithmFactory.selectOptimalAlgorithm(
        params.bodies.length,
        params.performancePreferences,
      );
      config = {
        ...config,
        algorithm: optimalAlgorithm,
      };
    }

    // Use enhanced simulation wrapper
    const simulationParams = {
      ...params,
      simulationConfig: config,
      radii: params.radii || new Map(),
      isStar: params.isStar || new Map(),
      bodyTypes: params.bodyTypes || new Map(),
      parentIds: params.parentIds || new Map(),
      octreeSize: params.octreeSize || 5e13,
      barnesHutTheta: params.barnesHutTheta || 0.7,
    };

    // Update integrator if needed
    if (config.integrator) {
      this.updateIntegratorFunction(config.integrator);
    }

    // Update WASM spatial partitioning
    this.wasmSpatialPartitioning.update(params.bodies);

    // Substepping to preserve stability for fast orbits (moons) at high time scales
    let currentStates: PhysicsStateReal[] = params.bodies;
    // Estimate max stable substep as a fraction of the smallest orbital period
    let minPeriod_s = Infinity;
    if (params.orbitalParameters) {
      for (const [id, el] of params.orbitalParameters.entries()) {
        if (el && el.period_s && el.period_s > 0) {
          if (el.period_s < minPeriod_s) minPeriod_s = el.period_s;
        }
      }
    }
    const fallbackMaxStep_s = 3600; // 1 hour if we lack orbital metadata
    const maxSubstep_s = isFinite(minPeriod_s)
      ? Math.max(1, 0.02 * minPeriod_s)
      : fallbackMaxStep_s;
    const substeps = Math.max(
      1,
      Math.min(64, Math.ceil(params.deltaTime / maxSubstep_s)),
    );
    const dtSub = params.deltaTime / substeps;

    for (let sub = 0; sub < substeps; sub++) {
      // Update WASM partitioning and compute accelerations for current state
      this.wasmSpatialPartitioning.update(currentStates);
      const accMap = new Map<string, OSVector3>();
      currentStates.forEach((body) => {
        const acc = this.calculateAccelerationForBody_NBody(body, currentStates);
        accMap.set(body.id, acc);
      });

      // Integrate one substep
      currentStates = currentStates.map((body) => {
        const currentAcceleration = accMap.get(body.id) || new OSVector3(0, 0, 0);
        const calculateNewAccelerationForAdvanced = (
          stateGuess: PhysicsStateReal,
        ): OSVector3 => {
          return this.calculateAccelerationForBody_NBody(stateGuess, currentStates);
        };
        return this.integratorFunction(
          body,
          currentAcceleration,
          calculateNewAccelerationForAdvanced,
          dtSub,
        );
      });
    }

    const integratedStates = currentStates;

    // Update collision detection with integrated states
    this.wasmCollisionDetection.update(
      integratedStates,
      params.radii || new Map(),
      params.isStar || new Map(),
      params.bodyTypes || new Map(),
    );
    const [finalStates, destroyedIds] =
      this.wasmCollisionDetection.handleCollisions(params.ignoreCollisions);

    // Optional: resonance detection (no forces changed)
    if (config.resonanceModeling && config.resonanceInNBody) {
      // Throttle by simulated time interval and cap per-step pairs
      // Base: once per simulation day, scaled up by timeScale (e.g., x10^7 => ~ once per 10 years)
      const baseDay_s = 24 * 3600;
      const timeScale = (params as any).timeScale || 1;
      const scaledInterval_s = baseDay_s * Math.max(1, timeScale);
      const interval_s =
        (config as any).resonanceUpdateInterval_s || scaledInterval_s;
      this.resonanceElapsed_s += params.deltaTime || 0;
      if (this.resonanceElapsed_s < interval_s) {
        // Skip this step
      } else {
        this.resonanceElapsed_s = 0;
      try {
        const integrator = new ResonanceIntegrator({
          enableResonanceDetection: true,
          resonanceTolerance: 0.05,
          librationDetectionWindow: 64,
          timeStep: 0.1,
          maxIntegrationSteps: 256,
        });
        const AU = 149_597_870_700;
        // Require orbital metadata to proceed
        if (params.orbitalParameters && params.parentIds) {
          // Build simplified objects from provided params instead of querying the state manager
          const objects = integratedStates
            .map((s) => {
              const id = String(s.id);
              const orbit = params.orbitalParameters!.get(id);
              const parentId = params.parentIds!.get(id);
              if (!orbit || !parentId) return null;
              return { id, orbit, parentId, mass_kg: s.mass_kg };
            })
            .filter((o): o is { id: string; orbit: OrbitalParameters; parentId: string; mass_kg: number } => !!o);

          const maxPairs = (config as any).resonanceMaxPairsPerStep || 16;
          let pairsProcessed = 0;
          for (const obj of objects) {
            const sameSystem = objects.filter(
              (o) => o.id !== obj.id && o.parentId === obj.parentId,
            );
            for (const perturber of sameSystem) {
              if (pairsProcessed >= maxPairs) break;
              if ((perturber.mass_kg || 0) < 1e22) continue;
              const periodRatio = (obj.orbit.period_s || 0) / (perturber.orbit.period_s || 1);
              if (!isFinite(periodRatio) || periodRatio <= 0) continue;
              const guess = findNearestResonance(periodRatio, 12, 12);
              if (!guess) continue;
              const centerAU = estimateResonantSemiMajorAxisAU(
                perturber.orbit.realSemiMajorAxis_m,
                guess.p,
                guess.q,
              );
              const smaAU = obj.orbit.realSemiMajorAxis_m / AU;
              const widthAU = 2.0; // coarse generic width
              if (Math.abs(smaAU - centerAU) > widthAU) continue;
              const res = integrator.integrateWithResonance(
                obj.orbit,
                perturber.orbit,
                {
                  planetId: perturber.id,
                  ratio: { p: guess.p, q: guess.q },
                  type: smaAU >= centerAU
                    ? ResonanceType.EXTERNAL
                    : ResonanceType.INTERNAL,
                  semiMajorAxisCenter: centerAU,
                  width: widthAU,
                  librationModes: [],
                  stabilityCriteria: {
                    maxEccentricity: 1,
                    maxInclination: 180,
                    minPerihelionDistance: 0,
                  },
                },
                500 * 365.25 * 24 * 3600,
              );
              // Publish resonance state if manager is available
              try {
                celestialManager.setResonanceState(
                  `${obj.id}__${perturber.id}`,
                  res.resonanceState,
                );
              } catch (_) {}
              pairsProcessed++;
            }
            if (pairsProcessed >= maxPairs) break;
          }
        }
      } catch (e) {
        console.warn("[Resonance] N-body resonance analysis skipped:", e);
      }
      }
    }

    // Compute final accelerations snapshot for result
    const accelerations = new Map<string, OSVector3>();
    this.wasmSpatialPartitioning.update(finalStates);
    finalStates.forEach((body) => {
      const acc = this.calculateAccelerationForBody_NBody(body, finalStates);
      accelerations.set(body.id, acc);
    });

    const result = {
      states: finalStates,
      accelerations,
      destroyedIds,
    };

    const endTime = performance.now();

    // Get performance profile for the algorithm used
    const performanceProfile = config.algorithm
      ? AlgorithmFactory.getPerformanceEstimate(
          config.algorithm,
          params.bodies.length,
        )
      : {
          relativeSpeed: 1,
          memoryUsage: "medium",
          accuracy: "high",
          isOptimal: true,
        };

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
        performanceProfile,
      },
    };
  }

  /**
   * Adds performance analysis and recommendations to the result
   */
  private enhanceResultWithAnalysis(
    result: EnhancedSimulationResult,
    params: SimulationManagerParams,
  ): void {
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Performance analysis
    if (
      result.metadata.mode === SimulationMode.NBODY &&
      result.metadata.algorithm
    ) {
      const validation = AlgorithmFactory.validateAlgorithmChoice(
        result.metadata.algorithm as any,
        params.bodies.length,
      );
      recommendations.push(...validation.recommendations);
      warnings.push(...validation.warnings);
    }

    // Execution time analysis
    if (result.metadata.executionTime > 100) {
      // > 100ms
      warnings.push(
        `Simulation step took ${result.metadata.executionTime.toFixed(1)}ms - consider optimizing`,
      );

      if (result.metadata.mode === SimulationMode.NBODY) {
        recommendations.push(
          "Consider using a faster algorithm or reducing time step",
        );
      }
    }

    // Mode recommendations
    if (
      result.metadata.mode === SimulationMode.NBODY &&
      params.orbitalParameters &&
      params.bodies.length < 100
    ) {
      recommendations.push(
        "Consider using ideal mode for better performance with this system size",
      );
    }

    result.metadata.recommendations = recommendations;
    result.metadata.warnings = warnings;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.wasmCollisionDetection.dispose();
    this.wasmSpatialPartitioning.dispose();
    this.initialized = false;
  }
}
