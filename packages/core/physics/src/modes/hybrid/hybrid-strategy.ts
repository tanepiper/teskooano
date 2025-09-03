import type {
  PhysicsStateReal,
  OrbitalParameters,
  StabilityReport,
  CorrectionVector,
  HybridCorrectionConfig,
} from "@teskooano/data-types";
import type { SimulationConfiguration } from "@teskooano/core-state";
import { OSVector3 } from "@teskooano/core-math";
import { calculateKeplerianStateAtTime } from "../../orbital/ideal";
import { sortBodiesByHierarchy } from "../../utils";
import { HybridCorrectionEngine } from "../../orbital/hybrid-corrections";
import { OrbitalStabilityAnalyzer } from "../../orbital/stability-analyzer";

/**
 * Simulation step result for Hybrid mode
 */
export interface HybridResult {
  states: PhysicsStateReal[];
  metadata: {
    stepTime: number;
    algorithmUsed: string;
    integratorUsed: string;
    totalBodies: number;
    correctionsApplied: number;
    averageStability: number;
    mode: "hybrid";
  };
}

/**
 * Parameters for Hybrid simulation
 */
export interface HybridParams {
  bodies: PhysicsStateReal[];
  deltaTime: number;
  configuration: SimulationConfiguration;
  orbitalParameters: Map<string, OrbitalParameters>;
  parentIds: Map<string, string>;
  currentTime_s: number;
  
  // Hybrid-specific parameters
  correctionConfig: HybridCorrectionConfig;
  timeScale?: number;
}

/**
 * Hybrid simulation strategy that combines N-Body physics with Kepler corrections
 * Provides realistic gravitational interactions while maintaining orbital stability
 */
export class HybridStrategy {
  readonly name = "hybrid";
  readonly description =
    "N-Body physics with Kepler corrections for stability";
  readonly complexity = "O(N log N) + O(K)"; // N-Body + Kepler corrections

  private correctionEngine: HybridCorrectionEngine;
  private stabilityAnalyzer: OrbitalStabilityAnalyzer;

  constructor() {
    this.correctionEngine = new HybridCorrectionEngine();
    this.stabilityAnalyzer = new OrbitalStabilityAnalyzer();
  }

  simulate(params: HybridParams): HybridResult {
    const startTime = performance.now();

    const { bodies, orbitalParameters, parentIds, currentTime_s, correctionConfig } = params;

    // Validate required parameters for hybrid mode
    if (!orbitalParameters || currentTime_s === undefined || !parentIds) {
      console.error(
        'CRITICAL: "hybrid" physics mode requires orbitalParameters, currentTime_s, and parentIds to be provided.',
      );
      return {
        states: bodies,
        metadata: {
          stepTime: 0,
          algorithmUsed: "hybrid-error",
          integratorUsed: "none",
          totalBodies: bodies.length,
          correctionsApplied: 0,
          averageStability: 0,
          mode: "hybrid",
        },
      };
    }

    // 1. Run N-Body integration (this would be done by the main simulation manager)
    // For now, we assume the bodies have been updated by N-Body integration
    const nbodyStates = bodies;

    // 2. Analyze orbital stability
    const stabilityReports = this.analyzeStability(
      nbodyStates,
      orbitalParameters,
      parentIds,
      currentTime_s,
      correctionConfig
    );

    // 3. Apply Kepler corrections if needed
    const correctedStates = this.correctionEngine.applyCorrections(
      nbodyStates,
      orbitalParameters,
      parentIds,
      correctionConfig,
      stabilityReports
    );

    // 4. Calculate average stability
    const averageStability = this.calculateAverageStability(stabilityReports);

    const endTime = performance.now();

    return {
      states: correctedStates,
      metadata: {
        stepTime: endTime - startTime,
        algorithmUsed: "hybrid",
        integratorUsed: "nbody+kepler",
        totalBodies: bodies.length,
        correctionsApplied: correctedStates.length - nbodyStates.length,
        averageStability,
        mode: "hybrid",
      },
    };
  }

  canHandle(config: SimulationConfiguration): boolean {
    return config.mode === "hybrid";
  }

  getRecommendedParameters(): Partial<HybridParams> {
    return {
      correctionConfig: {
        frequency: "adaptive",
        threshold: 0.01, // 1% default threshold
        preserveMomentum: true,
        hierarchicalCorrections: true,
        maxCorrectionMagnitude: 0.1, // 10% max correction
        adaptive: {
          baseFrequency: 1.0,
          timeScaleFactor: 0.5,
          bodyCountFactor: 0.3,
          errorFactor: 1.0,
        },
      },
    };
  }

  /**
   * Analyzes orbital stability for all bodies
   */
  private analyzeStability(
    bodies: PhysicsStateReal[],
    orbitalParameters: Map<string, OrbitalParameters>,
    parentIds: Map<string, string>,
    currentTime: number,
    correctionConfig: HybridCorrectionConfig
  ): Map<string, StabilityReport> {
    const reports = new Map<string, StabilityReport>();
    const sortedBodies = sortBodiesByHierarchy(bodies, parentIds);

    for (const body of sortedBodies) {
      const bodyOrbitalParams = orbitalParameters.get(body.id);
      const parentId = parentIds.get(body.id);

      if (!parentId || !bodyOrbitalParams) {
        // Body without parent or orbital parameters - mark as stable
        reports.set(body.id, {
          isStable: true,
          positionError: 0,
          velocityError: 0,
          correctionMagnitude: 0,
          recommendedAction: "none",
          confidence: 1.0,
        });
        continue;
      }

      // Find parent body
      const parentBody = bodies.find(b => b.id === parentId);
      if (!parentBody) {
        console.warn(`Parent body ${parentId} not found for ${body.id}`);
        continue;
      }

      // Analyze stability
      const report = this.stabilityAnalyzer.analyzeStability(
        body,
        bodyOrbitalParams,
        parentBody,
        currentTime,
        correctionConfig
      );

      reports.set(body.id, report);
    }

    return reports;
  }

  /**
   * Calculates average stability across all bodies
   */
  private calculateAverageStability(reports: Map<string, StabilityReport>): number {
    if (reports.size === 0) return 1.0;

    let totalStability = 0;
    for (const report of reports.values()) {
      totalStability += report.confidence;
    }

    return totalStability / reports.size;
  }
}