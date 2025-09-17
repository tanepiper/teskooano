---
aliases:
  [AlgorithmFactory, algorithm-factory, force-calculation, algorithm-selection]
tags: [core, physics, algorithms, factory, selection, optimization, performance]
type: Class
package: "@teskooano/core-physics"
name: AlgorithmFactory
dependencies: ["@teskooano/core-state", "@teskooano/data-types"]
classes: ["AlgorithmFactory"]
functions: []
constants: []
types:
  [
    "AlgorithmType",
    "SimulationConfiguration",
    "SimulationMode",
    "IntegratorType",
    "PerformanceEstimate",
    "ValidationResult",
  ]
status: active
---

# AlgorithmFactory

Intelligent factory class for selecting and validating force calculation algorithms based on system characteristics and performance requirements.

**Location**: `src/algorithms/algorithm-factory.ts`

## 🎯 Purpose

The `AlgorithmFactory` provides intelligent algorithm selection and management:

- **Automatic Selection**: Chooses optimal algorithms based on body count and preferences
- **Performance Analysis**: Estimates performance characteristics for each algorithm
- **Validation**: Validates algorithm choices and provides recommendations
- **Configuration Optimization**: Creates optimal simulation configurations
- **Algorithm Information**: Provides detailed information about available algorithms
- **Memory Management**: Considers memory constraints in algorithm selection

## 🏗️ Architecture

### Static Factory Pattern

Uses static methods for utility-style access without instantiation:

```typescript
export class AlgorithmFactory {
  // Static methods only - no instantiation required
  static selectOptimalAlgorithm(
    bodyCount: number,
    preferences?: PerformancePreferences,
  ): AlgorithmType;
  static getPerformanceEstimate(
    algorithm: AlgorithmType,
    bodyCount: number,
  ): PerformanceEstimate;
  static validateAlgorithmChoice(
    algorithm: AlgorithmType,
    bodyCount: number,
  ): ValidationResult;
}
```

### Algorithm Specifications

Maintains comprehensive specifications for each algorithm:

```typescript
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
```

### Performance Thresholds

Uses configurable thresholds for algorithm selection:

```typescript
const PERFORMANCE_THRESHOLDS = {
  small: 100, // Bodies ≤ 100: Use barnes-hut
  medium: 1000, // Bodies 100-1000: Use Barnes-Hut
  large: 10000, // Bodies 1000-10000: Use Barnes-Hut or P3M
  huge: 50000, // Bodies > 10000: Use FMM or P3M
};
```

## 🔧 Core Methods

### Algorithm Selection

```typescript
static selectOptimalAlgorithm(
  bodyCount: number,
  preferences?: {
    prioritizeAccuracy?: boolean;
    prioritizeSpeed?: boolean;
    maxMemoryUsage?: "low" | "medium" | "high";
  }
): AlgorithmType;
```

**Selection Logic:**

- Filters algorithms by memory constraints and body count limits
- Sorts by optimal range, complexity, accuracy, and memory usage
- Returns the best algorithm for the given parameters

### Performance Estimation

```typescript
static getPerformanceEstimate(
  algorithm: AlgorithmType,
  bodyCount: number
): {
  relativeSpeed: number;
  memoryUsage: string;
  accuracy: string;
  isOptimal: boolean;
};
```

**Estimation Features:**

- Calculates relative speed compared to Barnes-Hut at 1000 bodies
- Determines if algorithm is optimal for given body count
- Provides memory usage and accuracy classifications

### Algorithm Validation

```typescript
static validateAlgorithmChoice(
  algorithm: AlgorithmType,
  bodyCount: number
): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
};
```

**Validation Features:**

- Checks body count limits and optimal ranges
- Provides warnings for suboptimal choices
- Suggests better alternatives

### Configuration Creation

```typescript
static createOptimalConfiguration(
  bodyCount: number,
  mode: SimulationMode = SimulationMode.NBODY,
  preferences?: PerformancePreferences
): SimulationConfiguration;
```

**Configuration Features:**

- Creates complete simulation configurations
- Selects optimal algorithm and integrator
- Handles both ideal and N-body modes

### Algorithm Information

```typescript
static getAlgorithmInfo(algorithm: AlgorithmType): AlgorithmSpec;
static getAllAlgorithms(): Record<AlgorithmType, AlgorithmSpec>;
```

**Information Features:**

- Provides detailed specifications for each algorithm
- Lists all available algorithms with their characteristics
- Returns immutable copies to prevent modification

## 🚀 Usage Examples

### Basic Algorithm Selection

```typescript
import { AlgorithmFactory } from "@teskooano/core-physics";

// Automatic selection for small system
const algorithm = AlgorithmFactory.selectOptimalAlgorithm(50);
console.log(algorithm); // "barnes-hut"

// Selection with performance preferences
const fastAlgorithm = AlgorithmFactory.selectOptimalAlgorithm(5000, {
  prioritizeSpeed: true,
});
console.log(fastAlgorithm); // "fmm" (O(N) complexity)

// Selection with memory constraints
const memoryEfficientAlgorithm = AlgorithmFactory.selectOptimalAlgorithm(1000, {
  maxMemoryUsage: "low",
});
console.log(memoryEfficientAlgorithm); // "barnes-hut"
```

### Performance Analysis

```typescript
// Get performance estimate
const estimate = AlgorithmFactory.getPerformanceEstimate("barnes-hut", 1000);
console.log({
  relativeSpeed: estimate.relativeSpeed,
  memoryUsage: estimate.memoryUsage,
  accuracy: estimate.accuracy,
  isOptimal: estimate.isOptimal,
});

// Compare algorithms
const algorithms: AlgorithmType[] = ["barnes-hut", "fmm", "p3m", "tree-pm"];
algorithms.forEach((algorithm) => {
  const estimate = AlgorithmFactory.getPerformanceEstimate(algorithm, 5000);
  console.log(
    `${algorithm}: ${estimate.relativeSpeed}x speed, ${estimate.accuracy} accuracy`,
  );
});
```

### Algorithm Validation

```typescript
// Validate reasonable choice
const validation = AlgorithmFactory.validateAlgorithmChoice("barnes-hut", 1000);
if (validation.isValid) {
  console.log("Algorithm choice is good");
} else {
  console.log("Warnings:", validation.warnings);
  console.log("Recommendations:", validation.recommendations);
}

// Check suboptimal choice
const poorChoice = AlgorithmFactory.validateAlgorithmChoice("fmm", 10);
console.log("Is valid:", poorChoice.isValid); // false
console.log("Warnings:", poorChoice.warnings); // ["FMM overhead may not be worth it for <1000 bodies"]
```

### Configuration Creation

```typescript
// Create optimal configuration for N-body simulation
const config = AlgorithmFactory.createOptimalConfiguration(
  1000,
  SimulationMode.NBODY,
);
console.log(config);
// {
//   mode: "nbody",
//   algorithm: "barnes-hut",
//   integrator: "verlet"
// }

// Create configuration with preferences
const accurateConfig = AlgorithmFactory.createOptimalConfiguration(
  500,
  SimulationMode.NBODY,
  {
    prioritizeAccuracy: true,
  },
);
console.log(accurateConfig.integrator); // "rk4"

// Create ideal mode configuration
const idealConfig = AlgorithmFactory.createOptimalConfiguration(
  100,
  SimulationMode.IDEAL,
);
console.log(idealConfig);
// {
//   mode: "ideal"
//   // No algorithm/integrator needed for analytical solution
// }
```

### Algorithm Information

```typescript
// Get detailed information about an algorithm
const info = AlgorithmFactory.getAlgorithmInfo("barnes-hut");
console.log({
  type: info.type,
  complexity: info.complexity, // "O(N log N)"
  optimalRange: info.optimalRange, // [2, 10000]
  description: info.description,
  memoryUsage: info.memoryUsage, // "medium"
  accuracy: info.accuracy, // "high"
});

// List all available algorithms
const allAlgorithms = AlgorithmFactory.getAllAlgorithms();
Object.keys(allAlgorithms).forEach((type) => {
  const spec = allAlgorithms[type as AlgorithmType];
  console.log(`${spec.type}: ${spec.complexity}, ${spec.accuracy} accuracy`);
});
```

### Advanced Selection Patterns

```typescript
// Dynamic algorithm selection based on system size
function selectAlgorithmForSystem(bodies: PhysicsStateReal[]): AlgorithmType {
  const bodyCount = bodies.length;

  // Get optimal algorithm
  const algorithm = AlgorithmFactory.selectOptimalAlgorithm(bodyCount);

  // Validate the choice
  const validation = AlgorithmFactory.validateAlgorithmChoice(
    algorithm,
    bodyCount,
  );

  if (!validation.isValid) {
    console.warn("Algorithm validation failed:", validation.warnings);
    // Fall back to safe default
    return "barnes-hut";
  }

  return algorithm;
}

// Performance monitoring
function monitorAlgorithmPerformance(
  algorithm: AlgorithmType,
  bodyCount: number,
) {
  const estimate = AlgorithmFactory.getPerformanceEstimate(
    algorithm,
    bodyCount,
  );

  if (!estimate.isOptimal) {
    console.warn(
      `Algorithm ${algorithm} may not be optimal for ${bodyCount} bodies`,
    );

    // Get recommendations
    const validation = AlgorithmFactory.validateAlgorithmChoice(
      algorithm,
      bodyCount,
    );
    console.log("Consider:", validation.recommendations);
  }

  return estimate;
}
```

## 🎯 Performance Considerations

### Algorithm Characteristics

| Algorithm  | Complexity | Best For             | Min Bodies | Max Bodies | Accuracy |
| ---------- | ---------- | -------------------- | ---------- | ---------- | -------- |
| Direct     | O(N²)      | Small systems        | 1          | 1,000      | Exact    |
| Barnes-Hut | O(N log N) | Medium systems       | 100        | 100,000    | High     |
| FMM        | O(N)       | Large systems        | 1,000      | 1,000,000  | High     |
| P3M        | O(N log N) | Medium-large systems | 500        | 100,000    | Medium   |
| Tree-PM    | O(N log N) | Multi-scale systems  | 1,000      | 1,000,000  | High     |

### Selection Guidelines

**For General Use:**

- **≤ 100 bodies**: Barnes-Hut (good balance)
- **100-1,000 bodies**: Barnes-Hut (optimal range)
- **1,000-10,000 bodies**: Barnes-Hut or Tree-PM
- **> 10,000 bodies**: FMM or Tree-PM

**For High Accuracy:**

- Use `prioritizeAccuracy: true`
- Favors exact methods and lower approximation thresholds
- May select slower but more accurate algorithms

**For High Speed:**

- Use `prioritizeSpeed: true`
- Favors O(N) algorithms and higher approximation thresholds
- May sacrifice some accuracy for performance

**For Memory Constraints:**

- Use `maxMemoryUsage: "low"` or `"medium"`
- Avoids memory-intensive algorithms like FMM
- Falls back to more memory-efficient alternatives

## 🔗 Integration Points

### With SimulationManager

```typescript
// SimulationManager uses AlgorithmFactory for configuration
const manager = new SimulationManager();
const config = AlgorithmFactory.createOptimalConfiguration(
  bodyCount,
  mode,
  preferences,
);
const result = manager.simulate({ ...params, configuration: config });
```

### With Performance Monitoring

```typescript
// Monitor algorithm performance
const estimate = AlgorithmFactory.getPerformanceEstimate(algorithm, bodyCount);
if (estimate.relativeSpeed < 0.5) {
  console.warn("Algorithm may be too slow for this system");
}
```

### With Configuration Validation

```typescript
// Validate user-provided configurations
const validation = AlgorithmFactory.validateAlgorithmChoice(
  userAlgorithm,
  bodyCount,
);
if (!validation.isValid) {
  // Suggest better configuration
  const optimalConfig = AlgorithmFactory.createOptimalConfiguration(bodyCount);
  console.log("Consider using:", optimalConfig);
}
```

## 🔗 Related Components

- [[core/core-physics/SimulationManager|SimulationManager]] - Uses factory for configuration optimization
- [[core/core-physics/TreePMStrategy|TreePMStrategy]] - Advanced hybrid algorithm
- [[core/core-physics/Octree|Octree]] - Barnes-Hut implementation
- [[core/core-physics/AlgorithmStrategy|AlgorithmStrategy]] - Base interface for algorithms

## 📚 Architecture Patterns

- **Static Factory Pattern**: Utility-style access without instantiation
- **Strategy Pattern**: Algorithm selection and delegation
- **Specification Pattern**: Algorithm characteristics and constraints
- **Validation Pattern**: Choice validation and recommendations
- **Configuration Pattern**: Optimal configuration creation

---

_The AlgorithmFactory provides intelligent, data-driven algorithm selection with comprehensive performance analysis and validation capabilities._
