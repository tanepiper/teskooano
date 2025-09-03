import type {
  SimulationConfiguration,
} from "@teskooano/core-state";
import { AlgorithmType } from "@teskooano/data-types";
import { SimulationMode, IntegratorType } from "@teskooano/data-types";

/**
 * Algorithm performance characteristics and recommendations
 */
interface AlgorithmSpec {
  type: AlgorithmType;
  complexity: string;
  minBodies: number;
  maxBodies: number;
  optimalRange: [number, number];
  description: string;
  memoryUsage: "low" | "medium" | "high";
  accuracy: "exact" | "high" | "medium";
}

/**
 * Algorithm specifications based on research and implementation characteristics
 */
const ALGORITHM_SPECS: Record<AlgorithmType, AlgorithmSpec> = {
  [AlgorithmType.DIRECT]: {
    type: AlgorithmType.DIRECT,
    complexity: "O(N²)",
    minBodies: 2,
    maxBodies: 1000,
    optimalRange: [2, 100],
    description: "Direct force calculation, exact but slow for large systems",
    memoryUsage: "low",
    accuracy: "exact",
  },
  [AlgorithmType.BARNES_HUT]: {
    type: AlgorithmType.BARNES_HUT,
    complexity: "O(N log N)",
    minBodies: 2,
    maxBodies: 100000,
    optimalRange: [2, 10000],
    description: "Tree-based approximation, good balance of speed and accuracy",
    memoryUsage: "medium",
    accuracy: "high",
  },
  [AlgorithmType.FMM]: {
    type: AlgorithmType.FMM,
    complexity: "O(N)",
    minBodies: 1000,
    maxBodies: 1000000,
    optimalRange: [5000, 500000],
    description: "Fast Multipole Method, best for very large systems",
    memoryUsage: "medium",
    accuracy: "high",
  },
  [AlgorithmType.P3M]: {
    type: AlgorithmType.P3M,
    complexity: "O(N log N)",
    minBodies: 500,
    maxBodies: 100000,
    optimalRange: [2000, 50000],
    description: "Particle-Mesh hybrid, efficient for medium-large systems",
    memoryUsage: "medium",
    accuracy: "medium",
  },
  [AlgorithmType.TREE_PM]: {
    type: AlgorithmType.TREE_PM,
    complexity: "O(N log N)",
    minBodies: 2,
    maxBodies: 1000000,
    optimalRange: [2, 500000],
    description: "Tree-PM hybrid, optimal for multi-scale problems",
    memoryUsage: "medium",
    accuracy: "high",
  },
};

/**
 * Performance thresholds for algorithm selection
 */
const PERFORMANCE_THRESHOLDS = {
  small: 100, // Bodies ≤ 100: Use barnes-hut
  medium: 1000, // Bodies 100-1000: Use Barnes-Hut
  large: 10000, // Bodies 1000-10000: Use Barnes-Hut or P3M
  huge: 50000, // Bodies > 10000: Use FMM or P3M
};

/**
 * Factory class for algorithm selection and management
 */
export class AlgorithmFactory {
  /**
   * Automatically selects the best algorithm based on body count and configuration
   */
  static selectOptimalAlgorithm(
    bodyCount: number,
    preferences?: {
      prioritizeAccuracy?: boolean;
      prioritizeSpeed?: boolean;
      maxMemoryUsage?: "low" | "medium" | "high";
    },
  ): AlgorithmType {
    const {
      prioritizeAccuracy = false,
      prioritizeSpeed = true,
      maxMemoryUsage = "high",
    } = preferences || {};

    // Filter algorithms by memory constraints
    const availableAlgorithms = Object.values(ALGORITHM_SPECS).filter(
      (spec) => {
        const memoryOk = this.isMemoryUsageAcceptable(
          spec.memoryUsage,
          maxMemoryUsage,
        );
        const bodyCountOk =
          bodyCount >= spec.minBodies && bodyCount <= spec.maxBodies;
        return memoryOk && bodyCountOk;
      },
    );

    if (availableAlgorithms.length === 0) {
      console.warn(
        `No suitable algorithm found for ${bodyCount} bodies with memory constraint ${maxMemoryUsage}. Falling back to barnes-hut.`,
      );
      return AlgorithmType.BARNES_HUT;
    }

    // Sort by preference
    availableAlgorithms.sort((a, b) => {
      // Primary: Is body count in optimal range?
      const aInOptimal =
        bodyCount >= a.optimalRange[0] && bodyCount <= a.optimalRange[1];
      const bInOptimal =
        bodyCount >= b.optimalRange[0] && bodyCount <= b.optimalRange[1];

      if (aInOptimal && !bInOptimal) return -1;
      if (!aInOptimal && bInOptimal) return 1;

      // Secondary: Speed preference (O(N) algorithms first)
      if (prioritizeSpeed) {
        const complexityScore: Record<string, number> = {
          "O(N)": 1,
          "O(N log N)": 2,
        };
        const complexityDiff =
          (complexityScore[a.complexity] || 2) -
          (complexityScore[b.complexity] || 2);
        if (complexityDiff !== 0) return complexityDiff;
      }

      // Tertiary: Accuracy preference
      if (prioritizeAccuracy) {
        const accuracyScore = { exact: 3, high: 2, medium: 1 };
        const accuracyDiff =
          accuracyScore[b.accuracy] - accuracyScore[a.accuracy];
        if (accuracyDiff !== 0) return accuracyDiff;
      }

      // Quaternary: Memory usage (lower is better)
      const memoryScore = { low: 1, medium: 2, high: 3 };
      return memoryScore[a.memoryUsage] - memoryScore[b.memoryUsage];
    });

    return availableAlgorithms[0].type;
  }

  /**
   * Gets performance estimate for a given algorithm and body count
   */
  static getPerformanceEstimate(
    algorithm: AlgorithmType,
    bodyCount: number,
  ): {
    relativeSpeed: number; // 1.0 = baseline (barnes-hut at 1000 bodies)
    memoryUsage: string;
    accuracy: string;
    isOptimal: boolean;
  } {
    const spec = ALGORITHM_SPECS[algorithm];
    const isOptimal =
      bodyCount >= spec.optimalRange[0] && bodyCount <= spec.optimalRange[1];

    // Calculate relative speed compared to Barnes-Hut at 1000 bodies
    let relativeSpeed: number;
    switch (algorithm) {
      case "barnes-hut":
        relativeSpeed =
          ((1000 / bodyCount) * Math.log(1000)) /
          Math.log(Math.max(2, bodyCount)); // O(N log N)
        break;
      case "fmm":
        relativeSpeed = 1000 / bodyCount; // O(N)
        break;
      case "p3m":
        relativeSpeed =
          (((1000 / bodyCount) * Math.log(1000)) /
            Math.log(Math.max(2, bodyCount))) *
          0.8; // Slightly worse than Barnes-Hut
        break;
      default: // tree-pm
        relativeSpeed =
          (((1000 / bodyCount) * Math.log(1000)) /
            Math.log(Math.max(2, bodyCount))) *
          1.1; // Slightly better than Barnes-Hut
    }

    return {
      relativeSpeed: Math.max(0.01, relativeSpeed), // Minimum threshold
      memoryUsage: spec.memoryUsage,
      accuracy: spec.accuracy,
      isOptimal,
    };
  }

  /**
   * Validates if a manual algorithm selection is reasonable
   */
  static validateAlgorithmChoice(
    algorithm: AlgorithmType,
    bodyCount: number,
  ): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const spec = ALGORITHM_SPECS[algorithm];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check body count limits
    let isValid = true;
    if (bodyCount < spec.minBodies) {
      isValid = false;
      warnings.push(
        `${algorithm} is not recommended for ${bodyCount} bodies (minimum: ${spec.minBodies})`,
      );
    }
    if (bodyCount > spec.maxBodies) {
      isValid = false;
      warnings.push(
        `${algorithm} may not scale well for ${bodyCount} bodies (maximum: ${spec.maxBodies})`,
      );
    }

    // Check optimal range
    if (bodyCount < spec.optimalRange[0] || bodyCount > spec.optimalRange[1]) {
      const optimal = this.selectOptimalAlgorithm(bodyCount);
      recommendations.push(
        `For ${bodyCount} bodies, ${optimal} might be more efficient than ${algorithm}`,
      );
    }

    // Performance warnings - only for clearly suboptimal choices
    if (algorithm === "barnes-hut" && bodyCount > 10000) {
      warnings.push(
        "Barnes-Hut algorithm with >10000 bodies will be very slow",
      );
    }
    if (algorithm === "fmm" && bodyCount < 1000) {
      warnings.push("FMM overhead may not be worth it for <1000 bodies");
    }

    return { isValid, warnings, recommendations };
  }

  /**
   * Gets detailed information about an algorithm
   */
  static getAlgorithmInfo(algorithm: AlgorithmType): AlgorithmSpec {
    return { ...ALGORITHM_SPECS[algorithm] };
  }

  /**
   * Lists all available algorithms with their specifications
   */
  static getAllAlgorithms(): Record<AlgorithmType, AlgorithmSpec> {
    return { ...ALGORITHM_SPECS };
  }

  /**
   * Creates a complete configuration with optimal algorithm selection
   */
  static createOptimalConfiguration(
    bodyCount: number,
    mode: SimulationMode = SimulationMode.NBODY,
    preferences?: {
      prioritizeAccuracy?: boolean;
      prioritizeSpeed?: boolean;
      maxMemoryUsage?: "low" | "medium" | "high";
    },
  ): SimulationConfiguration {
    if (mode === SimulationMode.IDEAL) {
      return { mode: SimulationMode.IDEAL };
    }

    if (mode === SimulationMode.HYBRID) {
      // Hybrid mode: combine N-Body with Kepler corrections
      const baseConfig = this.createOptimalConfiguration(bodyCount, SimulationMode.NBODY, preferences);
      return {
        ...baseConfig,
        mode: SimulationMode.HYBRID,
        // Hybrid-specific defaults
        correctionFrequency: "adaptive",
        correctionThreshold: 0.01, // 1% position error threshold
        preserveMomentum: true,
        hierarchicalCorrections: true,
      };
    }

    const algorithm = this.selectOptimalAlgorithm(bodyCount, preferences);

    // Select optimal integrator based on accuracy requirements
    const integrator: IntegratorType = preferences?.prioritizeAccuracy
      ? IntegratorType.RK4
      : IntegratorType.VERLET;

    return {
      mode: SimulationMode.NBODY,
      algorithm,
      integrator,
    };
  }

  /**
   * Helper method to check if memory usage is acceptable
   */
  private static isMemoryUsageAcceptable(
    algorithmMemory: "low" | "medium" | "high",
    maxMemory: "low" | "medium" | "high",
  ): boolean {
    const memoryLevels = { low: 1, medium: 2, high: 3 };
    return memoryLevels[algorithmMemory] <= memoryLevels[maxMemory];
  }
}
