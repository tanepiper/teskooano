import type { AlgorithmType, SimulationConfiguration } from "@teskooano/core-state";

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
  memoryUsage: 'low' | 'medium' | 'high';
  accuracy: 'exact' | 'high' | 'medium';
}

/**
 * Algorithm specifications based on research and implementation characteristics
 */
const ALGORITHM_SPECS: Record<AlgorithmType, AlgorithmSpec> = {
  'direct': {
    type: 'direct',
    complexity: 'O(N²)',
    minBodies: 1,
    maxBodies: 1000, // Becomes impractical beyond this
    optimalRange: [1, 100],
    description: 'Exact N-body calculation, best for small systems',
    memoryUsage: 'low',
    accuracy: 'exact'
  },
  'barnes-hut': {
    type: 'barnes-hut',
    complexity: 'O(N log N)',
    minBodies: 50,
    maxBodies: 100000,
    optimalRange: [100, 10000],
    description: 'Tree-based approximation, good balance of speed and accuracy',
    memoryUsage: 'medium',
    accuracy: 'high'
  },
  'fmm': {
    type: 'fmm',
    complexity: 'O(N)',
    minBodies: 1000,
    maxBodies: 1000000,
    optimalRange: [5000, 500000],
    description: 'Fast Multipole Method, best for very large systems',
    memoryUsage: 'high',
    accuracy: 'high'
  },
  'p3m': {
    type: 'p3m',
    complexity: 'O(N log N)',
    minBodies: 500,
    maxBodies: 100000,
    optimalRange: [2000, 50000],
    description: 'Particle-Mesh hybrid, efficient for medium-large systems',
    memoryUsage: 'medium',
    accuracy: 'medium'
  },
  'tree-pm': {
    type: 'tree-pm',
    complexity: 'O(N log N)',
    minBodies: 1000,
    maxBodies: 1000000,
    optimalRange: [5000, 500000],
    description: 'Tree-PM hybrid, optimal for multi-scale problems',
    memoryUsage: 'medium',
    accuracy: 'high'
  }
};

/**
 * Performance thresholds for algorithm selection
 */
const PERFORMANCE_THRESHOLDS = {
  small: 100,      // Bodies ≤ 100: Use direct
  medium: 1000,    // Bodies 100-1000: Use Barnes-Hut
  large: 10000,    // Bodies 1000-10000: Use Barnes-Hut or P3M
  huge: 50000      // Bodies > 10000: Use FMM or P3M
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
      maxMemoryUsage?: 'low' | 'medium' | 'high';
    }
  ): AlgorithmType {
    const { prioritizeAccuracy = false, prioritizeSpeed = true, maxMemoryUsage = 'high' } = preferences || {};

    // Filter algorithms by memory constraints
    const availableAlgorithms = Object.values(ALGORITHM_SPECS).filter(spec => {
      const memoryOk = this.isMemoryUsageAcceptable(spec.memoryUsage, maxMemoryUsage);
      const bodyCountOk = bodyCount >= spec.minBodies && bodyCount <= spec.maxBodies;
      return memoryOk && bodyCountOk;
    });

    if (availableAlgorithms.length === 0) {
      console.warn(`No suitable algorithm found for ${bodyCount} bodies with memory constraint ${maxMemoryUsage}. Falling back to barnes-hut.`);
      return 'barnes-hut';
    }

    // Sort by preference
    availableAlgorithms.sort((a, b) => {
      // Primary: Is body count in optimal range?
      const aInOptimal = bodyCount >= a.optimalRange[0] && bodyCount <= a.optimalRange[1];
      const bInOptimal = bodyCount >= b.optimalRange[0] && bodyCount <= b.optimalRange[1];
      
      if (aInOptimal && !bInOptimal) return -1;
      if (!aInOptimal && bInOptimal) return 1;

      // Secondary: Accuracy vs Speed preference
      if (prioritizeAccuracy) {
        const accuracyScore = { exact: 3, high: 2, medium: 1 };
        const accuracyDiff = accuracyScore[b.accuracy] - accuracyScore[a.accuracy];
        if (accuracyDiff !== 0) return accuracyDiff;
      }

      if (prioritizeSpeed) {
        // Lower complexity score is better for speed
        const complexityScore: Record<string, number> = { 'O(N)': 1, 'O(N log N)': 2, 'O(N²)': 3 };
        const complexityDiff = (complexityScore[a.complexity] || 2) - (complexityScore[b.complexity] || 2);
        if (complexityDiff !== 0) return complexityDiff;
      }

      // Tertiary: Memory usage (lower is better)
      const memoryScore = { low: 1, medium: 2, high: 3 };
      return memoryScore[a.memoryUsage] - memoryScore[b.memoryUsage];
    });

    return availableAlgorithms[0].type;
  }

  /**
   * Gets performance estimate for a given algorithm and body count
   */
  static getPerformanceEstimate(algorithm: AlgorithmType, bodyCount: number): {
    relativeSpeed: number; // 1.0 = baseline (barnes-hut at 1000 bodies)
    memoryUsage: string;
    accuracy: string;
    isOptimal: boolean;
  } {
    const spec = ALGORITHM_SPECS[algorithm];
    const isOptimal = bodyCount >= spec.optimalRange[0] && bodyCount <= spec.optimalRange[1];

    // Calculate relative speed compared to Barnes-Hut at 1000 bodies
    let relativeSpeed: number;
    switch (algorithm) {
      case 'direct':
        relativeSpeed = Math.pow(1000 / bodyCount, 2); // O(N²) scaling
        break;
      case 'barnes-hut':
        relativeSpeed = (1000 / bodyCount) * Math.log(1000) / Math.log(bodyCount); // O(N log N)
        break;
      case 'fmm':
        relativeSpeed = 1000 / bodyCount; // O(N)
        break;
      case 'p3m':
        relativeSpeed = (1000 / bodyCount) * Math.log(1000) / Math.log(bodyCount) * 0.8; // Slightly worse than Barnes-Hut
        break;
      default:
        relativeSpeed = 1.0;
    }

    return {
      relativeSpeed: Math.max(0.01, relativeSpeed), // Minimum threshold
      memoryUsage: spec.memoryUsage,
      accuracy: spec.accuracy,
      isOptimal
    };
  }

  /**
   * Validates if a manual algorithm selection is reasonable
   */
  static validateAlgorithmChoice(algorithm: AlgorithmType, bodyCount: number): {
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
      warnings.push(`${algorithm} is not recommended for ${bodyCount} bodies (minimum: ${spec.minBodies})`);
    }
    if (bodyCount > spec.maxBodies) {
      isValid = false;
      warnings.push(`${algorithm} may not scale well for ${bodyCount} bodies (maximum: ${spec.maxBodies})`);
    }

    // Check optimal range
    if (bodyCount < spec.optimalRange[0] || bodyCount > spec.optimalRange[1]) {
      const optimal = this.selectOptimalAlgorithm(bodyCount);
      recommendations.push(`For ${bodyCount} bodies, ${optimal} might be more efficient than ${algorithm}`);
    }

    // Performance warnings
    if (algorithm === 'direct' && bodyCount > 500) {
      warnings.push('Direct algorithm with >500 bodies will be very slow');
    }
    if (algorithm === 'fmm' && bodyCount < 2000) {
      warnings.push('FMM overhead may not be worth it for <2000 bodies');
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
    mode: 'ideal' | 'nbody' = 'nbody',
    preferences?: {
      prioritizeAccuracy?: boolean;
      prioritizeSpeed?: boolean;
      maxMemoryUsage?: 'low' | 'medium' | 'high';
    }
  ): SimulationConfiguration {
    if (mode === 'ideal') {
      return { mode: 'ideal' };
    }

    const algorithm = this.selectOptimalAlgorithm(bodyCount, preferences);
    
    // Select optimal integrator based on accuracy requirements
    const integrator = preferences?.prioritizeAccuracy ? 'rk4' : 'verlet';

    return {
      mode: 'nbody',
      algorithm,
      integrator
    };
  }

  /**
   * Helper method to check if memory usage is acceptable
   */
  private static isMemoryUsageAcceptable(
    algorithmMemory: 'low' | 'medium' | 'high',
    maxMemory: 'low' | 'medium' | 'high'
  ): boolean {
    const memoryLevels = { low: 1, medium: 2, high: 3 };
    return memoryLevels[algorithmMemory] <= memoryLevels[maxMemory];
  }
}