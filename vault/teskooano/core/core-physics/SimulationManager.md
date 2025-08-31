---
aliases:
  [
    SimulationManager,
    simulation-manager,
    physics-orchestrator,
    simulation-coordinator,
  ]
tags: [core, physics, simulation, manager, orchestrator, coordinator, wasm]
type: Class
package: "@teskooano/core-physics"
name: SimulationManager
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/data-types",
    "@teskooano/data-values",
    "@robertaron/spacial-partitioning",
  ]
classes:
  ["IdealOrreryStrategy", "WasmCollisionDetection", "WasmSpatialPartitioning"]
functions: []
constants: []
types:
  [
    "SimulationManagerParams",
    "EnhancedSimulationResult",
    "SimulationConfiguration",
    "PhysicsStateReal",
    "IntegratorType",
  ]
status: active
---

# SimulationManager

High-level orchestrator that provides a unified API for physics simulations, featuring intelligent configuration selection, performance analysis, and WASM integration.

**Location**: `src/simulation/simulation-manager.ts`

## 🎯 Purpose

The `SimulationManager` serves as the main entry point for all physics simulations:

- **Unified API**: Single interface for both ideal and N-body simulations
- **Intelligent Selection**: Automatic algorithm and integrator optimization
- **Performance Analysis**: Built-in profiling and optimization recommendations
- **WASM Integration**: Seamless integration with high-performance spatial operations
- **Configuration Management**: Validation and optimization of simulation parameters
- **Result Enhancement**: Comprehensive metadata and analysis for simulation results

## 🏗️ Architecture

### Singleton Pattern

Uses singleton pattern for global access and resource management:

```typescript
export class SimulationManager {
  private static instance: SimulationManager | null = null;

  public static getInstance(): SimulationManager {
    if (!SimulationManager.instance) {
      SimulationManager.instance = new SimulationManager();
    }
    return SimulationManager.instance;
  }
}
```

### Strategy Delegation

Delegates to appropriate strategies based on simulation mode:

```typescript
private executeIdealMode(params: SimulationManagerParams): EnhancedSimulationResult {
  return this.idealOrreryStrategy.simulate(params);
}

private executeNBodyMode(params: SimulationManagerParams): EnhancedSimulationResult {
  // N-body simulation with algorithm selection
}
```

### WASM Integration

Integrates WASM components for enhanced performance:

```typescript
private wasmCollisionDetection: WasmCollisionDetection;
private wasmSpatialPartitioning: WasmSpatialPartitioning;

async initialize(): Promise<void> {
  await this.wasmCollisionDetection.initialize();
  await this.wasmSpatialPartitioning.initialize();
}
```

## 🔧 Core Methods

### Main Simulation Interface

```typescript
simulate(params: SimulationManagerParams): EnhancedSimulationResult;
```

**Parameters:**

- `bodies`: Array of physics states
- `deltaTime`: Time step in seconds
- `configuration`: Simulation mode and settings
- `orbitalParameters`: Required for ideal mode
- `radii`, `isStar`, `bodyTypes`: Required for N-body mode
- `performancePreferences`: Optimization preferences

**Returns:**

- Updated physics states
- Acceleration vectors
- Collision information
- Performance metadata
- Optimization recommendations

### Configuration Optimization

```typescript
createOptimalConfiguration(params: SimulationManagerParams): SimulationConfiguration;
```

Automatically selects optimal configuration based on:

- Body count and system characteristics
- Performance preferences (accuracy vs speed)
- Memory constraints
- Available algorithms and integrators

### Performance Analysis

```typescript
getPerformanceComparison(params: SimulationManagerParams): {
  ideal?: { available: boolean; reason?: string; estimatedSpeed: number };
  configurations: Array<{
    config: SimulationConfiguration;
    estimate: PerformanceEstimate;
    validation: ValidationResult;
  }>;
};
```

Provides comprehensive performance analysis and recommendations.

### Initialization

```typescript
async initialize(): Promise<void>;
```

Initializes WASM components and prepares the simulation manager for use.

## 🚀 Usage Examples

### Basic Simulation

```typescript
import { SimulationManager } from "@teskooano/core-physics";

const manager = new SimulationManager();
await manager.initialize();

const params = {
  bodies: [
    {
      id: "sun",
      mass_kg: 1.989e30,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    },
    {
      id: "earth",
      mass_kg: 5.972e24,
      position_m: new OSVector3(1.496e11, 0, 0),
      velocity_mps: new OSVector3(0, 0, 29780),
    },
  ],
  deltaTime: 3600, // 1 hour
  configuration: {
    mode: "nbody",
    algorithm: "barnes-hut",
    integrator: "verlet",
  },
  radii: new Map([
    ["sun", 6.96e8],
    ["earth", 6.371e6],
  ]),
  isStar: new Map([
    ["sun", true],
    ["earth", false],
  ]),
  bodyTypes: new Map([
    ["sun", CelestialType.STAR],
    ["earth", CelestialType.PLANET],
  ]),
};

const result = manager.simulate(params);
console.log(
  `Updated ${result.states.length} bodies in ${result.metadata.executionTime}ms`,
);
```

### Ideal Mode Simulation

```typescript
const idealParams = {
  bodies: [sun, earth, mars],
  deltaTime: 86400, // 1 day
  configuration: { mode: "ideal" },
  orbitalParameters: new Map([
    ["earth", earthOrbitalParams],
    ["mars", marsOrbitalParams],
  ]),
  parentIds: new Map([
    ["earth", "sun"],
    ["mars", "sun"],
  ]),
  currentTime_s: 0,
};

const result = manager.simulate(idealParams);
```

### Performance Optimization

```typescript
// Get optimal configuration
const optimalConfig = manager.createOptimalConfiguration(params);

// Compare different approaches
const comparison = manager.getPerformanceComparison(params);
console.log("Best algorithm:", comparison.configurations[0].config.algorithm);

// Use performance preferences
const optimizedParams = {
  ...params,
  performancePreferences: {
    prioritizeAccuracy: true,
    maxMemoryUsage: "medium",
  },
};

const optimizedResult = manager.simulate(optimizedParams);
```

### WASM-Enhanced Simulation

```typescript
// WASM components are automatically used when available
const wasmResult = manager.simulate({
  ...params,
  configuration: {
    mode: "nbody",
    algorithm: "barnes-hut",
    integrator: "verlet",
  },
});

// Check WASM usage statistics
const stats = manager.getStats();
console.log("WASM collision detection:", stats.usingWasmCollisionDetection);
console.log("WASM spatial partitioning:", stats.usingWasmNeighborFinding);
```

## 🎯 Performance Considerations

### Algorithm Selection

The manager automatically selects optimal algorithms:

- **≤ 100 bodies**: Direct (exact calculations)
- **100-1,000 bodies**: Barnes-Hut (good balance)
- **1,000-10,000 bodies**: Barnes-Hut or Tree-PM
- **> 10,000 bodies**: FMM or Tree-PM

### WASM Performance Benefits

- **Collision Detection**: O(n log n) instead of O(n²)
- **Neighbor Finding**: Fast spatial queries
- **Memory Efficiency**: Optimized data structures
- **Fallback Support**: Graceful degradation to traditional methods

### Configuration Optimization

```typescript
// Performance preferences influence selection
const config = manager.createOptimalConfiguration(params, {
  prioritizeAccuracy: true, // Favors exact methods
  prioritizeSpeed: false, // Not speed-focused
  maxMemoryUsage: "medium", // Memory constraint
});
```

## 🔗 Integration Points

### With State Management

```typescript
// Input from state system
const bodies = stateSystem.getPhysicsBodies();

// Output to state system
const result = manager.simulate({ bodies, ...otherParams });
stateSystem.updatePhysicsBodies(result.states);
```

### With Rendering

```typescript
// Coordinate system compatibility
const threePositions = result.states.map(
  (state) =>
    new THREE.Vector3(
      state.position_m.x * METERS_TO_SCENE_UNITS,
      state.position_m.y * METERS_TO_SCENE_UNITS,
      state.position_m.z * METERS_TO_SCENE_UNITS,
    ),
);
```

### With Prediction System

```typescript
// Trajectory prediction uses same physics pipeline
const predictedPoints = await predictTrajectory(
  targetBodyId,
  result.states,
  duration_s,
  steps,
  { relativeToBodyId: "sun" },
);
```

## 🔗 Related Components

- [[AlgorithmFactory]] - Intelligent algorithm selection
- [[IdealOrreryStrategy]] - Perfect orbital mechanics
- [[WasmCollisionDetection]] - Optimized collision detection
- [[WasmSpatialPartitioning]] - High-performance spatial operations
- [[TreePMStrategy]] - Advanced hybrid algorithm
- [[Octree]] - Spatial data structure

## 📚 Architecture Patterns

- **Singleton Pattern**: Global access and resource management
- **Strategy Pattern**: Mode selection and algorithm delegation
- **Factory Pattern**: Configuration creation and optimization
- **Bridge Pattern**: WASM integration and fallback mechanisms
- **Template Method**: Simulation pipeline orchestration
- **Observer Pattern**: Performance monitoring and statistics

---

_The SimulationManager provides a unified, intelligent interface for all physics simulations with automatic optimization and comprehensive performance analysis._
