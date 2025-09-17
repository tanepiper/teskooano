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

Factory for creating and managing force calculation algorithm instances. Provides intelligent algorithm selection and validation for all 5 implemented algorithms with WASM integration.

**Location**: `src/algorithms/algorithm-factory.ts`

**Status**: All 5 algorithms implemented and integrated (Neighbor-based, Barnes-Hut, FMM, P3M, Tree-PM) with WASM spatial partitioning

## 🎯 Purpose

The `AlgorithmFactory` provides algorithm creation and management:

- **Algorithm Creation**: Creates instances of all 5 implemented algorithms (Neighbor-based, Barnes-Hut, FMM, P3M, Tree-PM)
- **WASM Integration**: Injects WASM spatial partitioning dependencies into all algorithms
- **Performance Optimization**: Provides optimized data conversion methods to algorithms
- **Algorithm Validation**: Validates algorithm choices and provides recommendations
- **Factory Pattern**: Centralized creation and management of algorithm instances
- **Dependency Injection**: Manages algorithm dependencies and configuration

## 🏗️ Architecture

### Static Factory Pattern

Uses static methods for algorithm creation and management:

```typescript
export class AlgorithmFactory {
  // Static methods for algorithm creation and management
  static createAlgorithm(
    algorithmType: AlgorithmType,
    dependencies: AlgorithmDependencies,
  ): ForceCalculationAlgorithm;
  static getImplementedAlgorithms(): AlgorithmType[];
  static createOptimalConfiguration(
    bodyCount: number,
    mode: SimulationMode,
  ): SimulationConfiguration;
  static getPerformanceEstimate(
    algorithm: AlgorithmType,
    bodyCount: number,
  ): PerformanceEstimate;
  static validateAlgorithmChoice(
    algorithm: AlgorithmType,
    bodyCount: number,
  ): ValidationResult;
  static selectOptimalAlgorithm(
    bodyCount: number,
    preferences?: PerformancePreferences,
  ): AlgorithmType;
}
```

### Algorithm Creation

Creates algorithm instances with proper dependency injection:

```typescript
export interface AlgorithmDependencies {
  spatialPartitioning: any; // WASM spatial partitioning instance
  bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;
}

export interface AlgorithmConfig {
  neighborDistance?: number; // Distance threshold for neighbor finding
  barnesHutThreshold?: number; // Barnes-Hut approximation threshold
}
```

### Implemented Algorithms

All 5 algorithms are fully implemented and integrated:

```typescript
static getImplementedAlgorithms(): AlgorithmType[] {
  return [
    AlgorithmType.NEIGHBOR_BASED,
    AlgorithmType.BARNES_HUT,
    AlgorithmType.FMM,
    AlgorithmType.P3M,
    AlgorithmType.TREE_PM,
  ];
}
```

## 🔧 Core Methods

### Algorithm Creation

```typescript
static createAlgorithm(
  algorithmType: AlgorithmType,
  dependencies: AlgorithmDependencies
): ForceCalculationAlgorithm;
```

**Creation Logic:**

- Creates instances of all 5 implemented algorithms
- Injects WASM spatial partitioning dependencies
- Provides optimized data conversion methods
- Returns algorithm instances ready for use

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
  mode: SimulationMode = SimulationMode.NBODY
): SimulationConfiguration;
```

**Configuration Features:**

- Creates simplified simulation configurations
- Returns default configuration with neighbor-based algorithm
- Handles both ideal and N-body modes

### Algorithm Information

```typescript
static getImplementedAlgorithms(): AlgorithmType[];
```

**Information Features:**

- Lists all 5 implemented algorithms
- Returns algorithm types for validation and selection
- Provides current implementation status

## 🚀 Usage Examples

### Basic Algorithm Creation

```typescript
import { AlgorithmFactory } from "@teskooano/core-physics";

// Create algorithm instance with dependencies
const dependencies = {
  spatialPartitioning: wasmSpatialPartitioning,
  bodiesToFloat32Array: optimizedDataConversion,
};

const algorithm = AlgorithmFactory.createAlgorithm(
  AlgorithmType.BARNES_HUT,
  dependencies,
);

// Get list of implemented algorithms
const implementedAlgorithms = AlgorithmFactory.getImplementedAlgorithms();
console.log("Available algorithms:", implementedAlgorithms);
// ["neighbor-based", "barnes-hut", "fmm", "p3m", "tree-pm"]
```

### Algorithm Creation for Different Types

```typescript
// Create different algorithm instances
const neighborAlgorithm = AlgorithmFactory.createAlgorithm(
  AlgorithmType.NEIGHBOR_BASED,
  dependencies,
);

const fmmAlgorithm = AlgorithmFactory.createAlgorithm(
  AlgorithmType.FMM,
  dependencies,
);

const treePMAlgorithm = AlgorithmFactory.createAlgorithm(
  AlgorithmType.TREE_PM,
  dependencies,
);

// Use algorithms in simulation
const acceleration = neighborAlgorithm.calculateAcceleration(
  targetBody,
  allBodies,
  { neighborDistance: 1000 * AU_METERS },
);
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
//   integrator: "symplectic",
//   neighborDistance: 1000 * AU_METERS,
//   collisionDetection: true
// }

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
// Get list of implemented algorithms
const implementedAlgorithms = AlgorithmFactory.getImplementedAlgorithms();
console.log("Implemented algorithms:", implementedAlgorithms);
// ["neighbor-based", "barnes-hut", "fmm", "p3m", "tree-pm"]

// Check if algorithm is implemented
const isImplemented = implementedAlgorithms.includes(AlgorithmType.FMM);
console.log("FMM implemented:", isImplemented); // true

// Create all algorithm types
implementedAlgorithms.forEach((algorithmType) => {
  const algorithm = AlgorithmFactory.createAlgorithm(
    algorithmType,
    dependencies,
  );
  console.log(`Created ${algorithmType} algorithm`);
});
```

### Advanced Usage Patterns

```typescript
// Dynamic algorithm creation based on system characteristics
function createAlgorithmForSystem(
  bodyCount: number,
  dependencies: AlgorithmDependencies,
): ForceCalculationAlgorithm {
  let algorithmType: AlgorithmType;

  // Select algorithm based on system size
  if (bodyCount < 100) {
    algorithmType = AlgorithmType.NEIGHBOR_BASED;
  } else if (bodyCount < 1000) {
    algorithmType = AlgorithmType.BARNES_HUT;
  } else if (bodyCount < 10000) {
    algorithmType = AlgorithmType.P3M;
  } else {
    algorithmType = AlgorithmType.FMM;
  }

  // Create and return algorithm instance
  return AlgorithmFactory.createAlgorithm(algorithmType, dependencies);
}
```

## 🎯 Performance Considerations

### Algorithm Characteristics

| Algorithm      | Complexity | Best For        | Accuracy  | Memory | WASM Integration |
| -------------- | ---------- | --------------- | --------- | ------ | ---------------- |
| Neighbor-based | O(K)       | Small systems   | High      | Low    | ✅               |
| Barnes-Hut     | O(N log N) | Medium systems  | Good      | Medium | ✅               |
| FMM            | O(N log N) | Large systems   | Good      | High   | ✅               |
| P3M            | O(N log N) | Varying density | Good      | Medium | ✅               |
| Tree-PM        | O(N log N) | Complex systems | Excellent | High   | ✅               |

### Selection Guidelines

**For General Use:**

- **≤ 100 bodies**: Neighbor-based (simple, reliable)
- **100-1,000 bodies**: Barnes-Hut (good balance)
- **1,000-10,000 bodies**: P3M (varying density)
- **> 10,000 bodies**: FMM (large systems)
- **Complex systems**: Tree-PM (multi-scale)

**For High Accuracy:**

- Neighbor-based for small systems (exact calculation)
- Tree-PM for complex systems (best of both methods)
- Lower approximation thresholds for Barnes-Hut

**For High Performance:**

- FMM for very large systems (O(N log N))
- P3M for varying density distributions
- WASM integration provides significant speedup

**For Memory Constraints:**

- Neighbor-based (low memory usage)
- Barnes-Hut (medium memory usage)
- Avoid FMM and Tree-PM for memory-constrained systems

## 🔗 Integration Points

### With SimulationManager

```typescript
// SimulationManager uses AlgorithmFactory for algorithm creation
const manager = new SimulationManager();
const dependencies = {
  spatialPartitioning: manager.spatialPartitioning,
  bodiesToFloat32Array: manager.bodiesToFloat32Array,
};

const algorithm = AlgorithmFactory.createAlgorithm(
  AlgorithmType.BARNES_HUT,
  dependencies,
);

const result = manager.simulate({ ...params, algorithm });
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

- [[core/core-physics/SimulationManager|SimulationManager]] - Uses factory for algorithm creation
- [[core/core-physics/NeighborBasedAlgorithm|NeighborBasedAlgorithm]] - Simple neighbor-based algorithm
- [[core/core-physics/BarnesHutAlgorithm|BarnesHutAlgorithm]] - Hierarchical tree-based algorithm
- [[core/core-physics/FMMAlgorithm|FMMAlgorithm]] - Fast Multipole Method implementation
- [[core/core-physics/P3MAlgorithm|P3MAlgorithm]] - Particle-Particle Particle-Mesh hybrid
- [[core/core-physics/TreePMAlgorithm|TreePMAlgorithm]] - Advanced Tree-PM hybrid algorithm
- [[core/core-physics/ForceCalculationAlgorithm|ForceCalculationAlgorithm]] - Common algorithm interface

## 📚 Architecture Patterns

- **Factory Pattern**: Centralized algorithm creation and management
- **Dependency Injection**: WASM and optimization dependencies
- **Strategy Pattern**: Algorithm selection and delegation
- **Interface Segregation**: Common algorithm interface
- **Configuration Pattern**: Simplified configuration creation

---

_The AlgorithmFactory provides centralized creation and management of all 5 implemented force calculation algorithms with WASM integration and performance optimization._
