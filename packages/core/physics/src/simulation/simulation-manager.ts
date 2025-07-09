import { OSVector3 } from "@teskooano/core-math";
import type { PhysicsStateReal, OrbitalParameters } from "@teskooano/data-types";
import type { SimulationConfiguration } from "@teskooano/core-state";
import { AlgorithmFactory } from "../algorithms/algorithm-factory";
import { updateSimulation, updateSimulationWithConfiguration } from "./simulation";
import { IdealOrreryStrategy, type IdealOrbitParams } from "../modes/ideal/ideal-orrery";

/**
 * Enhanced simulation result with performance metrics and metadata
 */
export interface EnhancedSimulationResult {
  states: PhysicsStateReal[];
  accelerations: Map<string, OSVector3>;
  destroyedIds: Set<string>;
  destructionEvents: any[];
  metadata: {
    mode: 'ideal' | 'nbody';
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
  
  // Optional preferences
  autoSelectAlgorithm?: boolean;
  performancePreferences?: {
    prioritizeAccuracy?: boolean;
    prioritizeSpeed?: boolean;
    maxMemoryUsage?: 'low' | 'medium' | 'high';
  };
}

/**
 * High-level simulation manager that coordinates between ideal and N-body modes
 * Provides intelligent algorithm selection, performance monitoring, and validation
 */
export class SimulationManager {
  private idealOrreryStrategy: IdealOrreryStrategy;
  
  constructor() {
    this.idealOrreryStrategy = new IdealOrreryStrategy();
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
      throw new Error(`Invalid simulation configuration: ${validation.errors.join(', ')}`);
    }

    let result: EnhancedSimulationResult;

    if (configuration.mode === 'ideal') {
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
  createOptimalConfiguration(params: SimulationManagerParams): SimulationConfiguration {
    const bodyCount = params.bodies.length;
    const hasOrbitalData = params.orbitalParameters && params.parentIds;
    
    // If orbital data is available and body count is reasonable for ideal mode, suggest ideal
    if (hasOrbitalData && bodyCount <= 1000) {
      return { mode: 'ideal' };
    }

    // Otherwise use N-body with algorithm factory
    return AlgorithmFactory.createOptimalConfiguration(
      bodyCount,
      'nbody',
      params.performancePreferences
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
      configurations: []
    };

    // Check ideal mode availability
    if (hasOrbitalData) {
      result.ideal = {
        available: true,
        estimatedSpeed: bodyCount // Linear time for ideal mode
      };
    } else {
      result.ideal = {
        available: false,
        reason: 'Missing orbital parameters or parent hierarchy',
        estimatedSpeed: 0
      };
    }

    // Generate estimates for all N-body configurations
    const algorithms = ['direct', 'barnes-hut', 'fmm', 'p3m', 'tree-pm'] as const;
    const integrators = [
      'euler', 'symplectic', 'verlet', 'rk4', 'adaptive',
      'yoshida4', 'forest-ruth', 'pefrl', 'leapfrog'
    ] as const;

    for (const algorithm of algorithms) {
      for (const integrator of integrators) {
        const config: SimulationConfiguration = {
          mode: 'nbody',
          algorithm,
          integrator
        };

        const estimate = AlgorithmFactory.getPerformanceEstimate(algorithm, bodyCount);
        const validation = AlgorithmFactory.validateAlgorithmChoice(algorithm, bodyCount);

        result.configurations.push({
          config,
          estimate,
          validation
        });
      }
    }

    // Sort by relative speed (best first)
    result.configurations.sort((a: any, b: any) => b.estimate.relativeSpeed - a.estimate.relativeSpeed);

    return result;
  }

  /**
   * Validates simulation configuration and parameters
   */
  private validateConfiguration(
    config: SimulationConfiguration, 
    params: SimulationManagerParams
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic configuration validation
    if (!config.mode) {
      errors.push('Simulation mode is required');
    }

    if (config.mode === 'ideal') {
      if (!params.orbitalParameters) {
        errors.push('Orbital parameters required for ideal mode');
      }
      if (!params.parentIds) {
        errors.push('Parent hierarchy required for ideal mode');  
      }
      if (params.currentTime_s === undefined) {
        errors.push('Current time required for ideal mode');
      }
    }

    if (config.mode === 'nbody') {
      if (!config.algorithm) {
        errors.push('Algorithm required for N-body mode');
      }
      if (!config.integrator) {
        errors.push('Integrator required for N-body mode');
      }
      if (!params.radii) {
        warnings.push('Body radii not provided - collision detection will be skipped');
      }
    }

    // Body count validation
    if (params.bodies.length === 0) {
      warnings.push('No bodies provided for simulation');
    }

    // Algorithm-specific validation
    if (config.mode === 'nbody' && config.algorithm) {
      const validation = AlgorithmFactory.validateAlgorithmChoice(config.algorithm, params.bodies.length);
      errors.push(...validation.warnings.filter(w => w.includes('not recommended')));
      warnings.push(...validation.recommendations);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Executes ideal orrery mode simulation
   */
  private executeIdealMode(params: SimulationManagerParams, startTime: number): EnhancedSimulationResult {
    const idealParams: IdealOrbitParams = {
      bodies: params.bodies,
      deltaTime: params.deltaTime,
      configuration: params.configuration,
      orbitalParameters: params.orbitalParameters!,
      parentIds: params.parentIds!,
      currentTime_s: params.currentTime_s!
    };

    const result = this.idealOrreryStrategy.simulate(idealParams);
    const endTime = performance.now();

    return {
      states: result.states,
      accelerations: new Map(), // No force calculations in ideal mode
      destroyedIds: new Set(), // No collisions in ideal mode
      destructionEvents: [],
      metadata: {
        mode: 'ideal',
        executionTime: endTime - startTime,
        bodyCount: params.bodies.length,
        performanceProfile: {
          relativeSpeed: params.bodies.length, // Linear time
          memoryUsage: 'low',
          accuracy: 'exact',
          isOptimal: true
        }
      }
    };
  }

  /**
   * Executes N-body mode simulation
   */
  private executeNBodyMode(params: SimulationManagerParams, startTime: number): EnhancedSimulationResult {
    // Auto-select algorithm if requested
    let config = params.configuration;
    if (params.autoSelectAlgorithm && config.mode === 'nbody') {
      const optimalAlgorithm = AlgorithmFactory.selectOptimalAlgorithm(
        params.bodies.length,
        params.performancePreferences
      );
      config = {
        ...config,
        algorithm: optimalAlgorithm
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

    const result = updateSimulationWithConfiguration(
      params.bodies,
      params.deltaTime,
      simulationParams
    );

    const endTime = performance.now();

    // Get performance profile for the algorithm used
    const performanceProfile = config.algorithm ? 
      AlgorithmFactory.getPerformanceEstimate(config.algorithm, params.bodies.length) :
      { relativeSpeed: 1, memoryUsage: 'medium', accuracy: 'high', isOptimal: true };

    return {
      states: result.states,
      accelerations: result.accelerations,
      destroyedIds: new Set(Array.from(result.destroyedIds).map(String)),
      destructionEvents: result.destructionEvents,
      metadata: {
        mode: 'nbody',
        algorithm: config.algorithm,
        integrator: config.integrator,
        executionTime: endTime - startTime,
        bodyCount: params.bodies.length,
        performanceProfile
      }
    };
  }

  /**
   * Adds performance analysis and recommendations to the result
   */
  private enhanceResultWithAnalysis(result: EnhancedSimulationResult, params: SimulationManagerParams): void {
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Performance analysis
    if (result.metadata.mode === 'nbody' && result.metadata.algorithm) {
      const validation = AlgorithmFactory.validateAlgorithmChoice(
        result.metadata.algorithm as any,
        params.bodies.length
      );
      recommendations.push(...validation.recommendations);
      warnings.push(...validation.warnings);
    }

    // Execution time analysis
    if (result.metadata.executionTime > 100) { // > 100ms
      warnings.push(`Simulation step took ${result.metadata.executionTime.toFixed(1)}ms - consider optimizing`);
      
      if (result.metadata.mode === 'nbody') {
        recommendations.push('Consider using a faster algorithm or reducing time step');
      }
    }

    // Mode recommendations
    if (result.metadata.mode === 'nbody' && params.orbitalParameters && params.bodies.length < 100) {
      recommendations.push('Consider using ideal mode for better performance with this system size');
    }

    result.metadata.recommendations = recommendations;
    result.metadata.warnings = warnings;
  }
}