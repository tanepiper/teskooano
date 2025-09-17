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
  ["IdealOrreryStrategy", "CollisionDetectionService", "SpatialPartitioning"]
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

High-level orchestrator that provides a unified API for physics simulations, featuring simplified configuration and WASM integration with all 5 implemented algorithms.

**Location**: `src/simulation/simulation-manager.ts`

## 🎯 Purpose

The `SimulationManager` serves as the main entry point for all physics simulations:

- **Unified API**: Single interface for both ideal and N-body simulations
- **Algorithm Management**: Creates and manages all 5 implemented force calculation algorithms
- **WASM Integration**: Seamless integration with high-performance spatial operations
- **Simplified Configuration**: Streamlined configuration with sensible defaults
- **User-Driven Choices**: No automatic performance analysis - user selects based on their needs

## 🏗️ Architecture

### Instance Management

Uses standard instantiation with proper initialization:

```typescript
export class SimulationManager {
  private initialized = false;
  private spatialPartitioning: SpatialPartitioning;
  private collisionDetectionService: CollisionDetectionService;
  private celestialDistanceService: CelestialDistanceService;
  private algorithmInstances: Map<string, ForceCalculationAlgorithm> =
    new Map();

  constructor() {
    // Initialize WASM systems
    this.celestialDistanceService = CelestialDistanceService.getInstance();
    this.collisionDetectionService = new CollisionDetectionService({
      collisionDistance: 0.1 * AU_METERS,
    });
    this.spatialPartitioning = new SpatialPartitioning(1000 * AU_METERS);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.celestialDistanceService.initialize({
      neighborDistance: 1000 * AU_METERS,
    });
    await this.collisionDetectionService.initialize();
    await this.spatialPartitioning.initialize();

    this.initialized = true;
  }
}
```

### Algorithm Management

Manages algorithm instances and delegates to appropriate algorithms:

```typescript
private getAlgorithmInstance(algorithmType: string): ForceCalculationAlgorithm {
  if (!this.algorithmInstances.has(algorithmType)) {
    const dependencies = {
      spatialPartitioning: this.spatialPartitioning,
      bodiesToFloat32Array: this.bodiesToFloat32Array.bind(this)
    };

    const algorithm = AlgorithmFactory.createAlgorithm(
      algorithmType as AlgorithmType,
      dependencies
    );

    this.algorithmInstances.set(algorithmType, algorithm);
  }

  return this.algorithmInstances.get(algorithmType)!;
}

private executeNBodyMode(params: SimulationManagerParams): EnhancedSimulationResult {
  // N-body simulation with algorithm selection
}
```

### WASM Integration

Integrates WASM components with proper initialization checks and fallback behavior:

```typescript
private collisionDetectionService: CollisionDetectionService;
private spatialPartitioning: SpatialPartitioning;
private celestialDistanceService: CelestialDistanceService;

async initialize(): Promise<void> {
  if (this.initialized) return;

  await this.celestialDistanceService.initialize({
    neighborDistance: 1000 * AU_METERS,
  });
  await this.collisionDetectionService.initialize();
  await this.spatialPartitioning.initialize();

  this.initialized = true;
}

// In simulation methods, check initialization before using WASM
if (this.spatialPartitioning.isInitialized()) {
  this.spatialPartitioning.update(params.bodies);
} else {
  console.warn("WASM spatial partitioning not initialized, skipping update");
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

**Returns:**

- Updated physics states
- Acceleration vectors
- Collision information
- Basic execution metadata

### Configuration Creation

```typescript
createDefaultConfiguration(): SimulationConfiguration;
```

Creates default configuration with sensible defaults:

- Default neighbor-based algorithm for reliability
- Symplectic integrator for good performance
- Configurable neighbor distance and collision detection
- User can customize as needed

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
await manager.initialize(); // Must initialize before use

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
    integrator: "symplectic",
    neighborDistance: 1000 * AU_METERS,
    collisionDetection: true,
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

// Get default configuration
const defaultConfig = manager.createDefaultConfiguration();
console.log("Default config:", defaultConfig);

// Use default configuration
const result = manager.simulate({
...params,
configuration: defaultConfig,
});

````

### WASM-Enhanced Simulation

```typescript
// WASM components are automatically used when available
const wasmResult = manager.simulate({
  ...params,
  configuration: {
    mode: "nbody",
    integrator: "symplectic",
    neighborDistance: 1000 * AU_METERS,
    collisionDetection: true,
  },
});

// WASM components are automatically used when available
console.log("WASM spatial partitioning and collision detection enabled");
````

## 🎯 Algorithm Considerations

### Algorithm Management

The manager creates and manages all 5 implemented algorithms:

- **Neighbor-based**: Simple, reliable for small systems
- **Barnes-Hut**: Hierarchical tree-based for medium systems
- **FMM**: Fast Multipole Method for large systems
- **P3M**: Particle-Particle Particle-Mesh for varying density
- **Tree-PM**: Advanced hybrid for complex systems

### WASM Benefits

- **Neighbor Finding**: Efficient spatial queries within distance threshold
- **Memory Efficiency**: Optimized data structures
- **Fallback Support**: Graceful degradation to traditional methods

### Configuration Simplification

```typescript
// Default configuration with sensible defaults
const config = manager.createDefaultConfiguration();
console.log(config);
// {
//   mode: "nbody",
//   integrator: "symplectic",
//   neighborDistance: 1000 * AU_METERS,
//   collisionDetection: true
// }
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

- [[core/core-physics/AlgorithmFactory|AlgorithmFactory]] - Creates and manages algorithm instances
- [[core/core-physics/NeighborBasedAlgorithm|NeighborBasedAlgorithm]] - Simple neighbor-based algorithm
- [[core/core-physics/BarnesHutAlgorithm|BarnesHutAlgorithm]] - Hierarchical tree-based algorithm
- [[core/core-physics/FMMAlgorithm|FMMAlgorithm]] - Fast Multipole Method implementation
- [[core/core-physics/P3MAlgorithm|P3MAlgorithm]] - Particle-Particle Particle-Mesh hybrid
- [[core/core-physics/TreePMAlgorithm|TreePMAlgorithm]] - Advanced Tree-PM hybrid algorithm
- [[core/core-physics/IdealOrreryStrategy|IdealOrreryStrategy]] - Perfect orbital mechanics
- [[core/core-physics/CollisionDetectionService|CollisionDetectionService]] - Optimized collision detection
- [[core/core-physics/SpatialPartitioning|SpatialPartitioning]] - High-performance spatial operations

## 📚 Architecture Patterns

- **Manager Pattern**: Centralized simulation orchestration
- **Factory Pattern**: Algorithm creation and management
- **Strategy Pattern**: Mode selection and algorithm delegation
- **Bridge Pattern**: WASM integration and fallback mechanisms
- **Template Method**: Simulation pipeline orchestration
- **Dependency Injection**: Algorithm dependencies and WASM services

---

_The SimulationManager provides a unified interface for all physics simulations with simplified configuration and algorithm management._
