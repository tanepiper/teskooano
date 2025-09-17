---
aliases:
  [
    CelestialDistanceService,
    wasm-spatial-service,
    spatial-service,
    centralized-spatial,
  ]
tags: [core, physics, wasm, spatial, service, singleton, centralized]
type: Class
package: "@teskooano/core-physics"
name: CelestialDistanceService
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/data-types",
    "@robertaron/spacial-partitioning",
  ]
classes: ["CelestialDistanceService"]
functions: ["getInstance"]
constants: []
types: ["WasmPartitioningConfig", "PhysicsStateReal"]
status: active
---

# CelestialDistanceService

Centralized singleton service that provides a single source of truth for WASM spatial partitioning operations across the simulation system. Used by all 5 implemented force calculation algorithms.

**Location**: `src/spatial/wasm-spatial-service.ts`

## 🎯 Purpose

The `CelestialDistanceService` serves as a centralized coordinator for WASM spatial operations:

- **Singleton Pattern**: Single instance across the entire application
- **Centralized Management**: Unified access point for spatial partitioning
- **Algorithm Integration**: Used by all 5 implemented force calculation algorithms
- **Initialization Control**: Manages WASM module initialization lifecycle
- **Fallback Handling**: Graceful degradation when WASM is unavailable
- **Resource Management**: Proper cleanup and disposal of WASM resources

## 🏗️ Architecture

### Singleton Implementation

Uses singleton pattern for global access and resource management:

```typescript
export class CelestialDistanceService {
  private static instance: CelestialDistanceService | null = null;
  private spatialPartitioning: SpatialPartitioning | null = null;
  private isInitializing = false;
  private initializationPromise: Promise<boolean> | null = null;

  public static getInstance(): CelestialDistanceService {
    if (!CelestialDistanceService.instance) {
      CelestialDistanceService.instance = new CelestialDistanceService();
    }
    return CelestialDistanceService.instance;
  }
}
```

### Initialization Management

Handles complex initialization lifecycle with proper concurrency control:

```typescript
public async initialize(config: Partial<WasmPartitioningConfig> = {}): Promise<boolean> {
  // Prevent multiple simultaneous initializations
  if (this.isInitializing && this.initializationPromise) {
    return this.initializationPromise;
  }

  // Return success if already initialized
  if (this.spatialPartitioning?.isInitialized()) {
    return true;
  }

  // Start initialization process
  this.isInitializing = true;
  this.initializationPromise = this.performInitialization(config);

  try {
    const result = await this.initializationPromise;
    return result;
  } finally {
    this.isInitializing = false;
    this.initializationPromise = null;
  }
}
```

### Error Handling and Fallback

Provides robust error handling with graceful degradation:

```typescript
private async performInitialization(config: Partial<WasmPartitioningConfig>): Promise<boolean> {
  try {
    this.spatialPartitioning = new SpatialPartitioning(
      config.neighborDistance || 1e12 // Default to 1 trillion meters (~6700 AU)
    );
    await this.spatialPartitioning.initialize();
    return true;
  } catch (error) {
    console.error("[CelestialDistanceService] Failed to initialize WASM spatial partitioning:", error);
    this.spatialPartitioning = null;
    return false;
  }
}
```

## 🔧 Core Methods

### Service Management

```typescript
public static getInstance(): CelestialDistanceService;
public async initialize(config?: Partial<WasmPartitioningConfig>): Promise<boolean>;
public isInitialized(): boolean;
public dispose(): void;
```

**Service Features:**

- Singleton access pattern
- Async initialization with configuration
- Initialization state checking
- Proper resource cleanup

### Spatial Operations

```typescript
public update(bodies: PhysicsStateReal[]): void;
public findNeighbors(bodyId: string | number): (string | number)[];
public findBodiesInRange(point: OSVector3, distance: number): (string | number)[];
public getPotentialCollisionPairs(): [string | number, string | number][];
public findClosestBody(point: OSVector3): { bodyId: string | number; distance: number } | null;
public calculateDistancesToAll(point: OSVector3): Map<string | number, number>;
```

**Operation Features:**

- All methods check initialization before proceeding
- Graceful fallback when WASM is not available
- Consistent API across all spatial operations
- Performance-optimized implementations

### Configuration Management

```typescript
public setNeighborDistance(distance: number): void;
```

**Configuration Features:**

- Dynamic neighbor distance adjustment
- Runtime configuration updates
- Validation and error handling

## 🚀 Usage Examples

### Basic Service Setup

```typescript
import { CelestialDistanceService } from "@teskooano/core-physics";

// Get singleton instance
const spatialService = CelestialDistanceService.getInstance();

// Initialize with default configuration
const initialized = await spatialService.initialize();
if (initialized) {
  console.log("WASM spatial service initialized successfully");
} else {
  console.warn(
    "WASM spatial service initialization failed, using fallback methods",
  );
}
```

### Custom Configuration

```typescript
// Initialize with custom configuration
const spatialService = CelestialDistanceService.getInstance();
const initialized = await spatialService.initialize({
  neighborDistance: 5e12, // 5 trillion meters (~33,000 AU)
});

if (initialized) {
  console.log("WASM spatial service initialized with custom configuration");
}
```

### Spatial Operations

```typescript
// Update with current body positions
spatialService.update(bodies);

// Find neighbors of a specific body
const neighbors = spatialService.findNeighbors("earth");
console.log("Earth's neighbors:", neighbors);

// Find bodies within a range
const bodiesInRange = spatialService.findBodiesInRange(
  new OSVector3(0, 0, 0),
  1e8, // 100 million meters
);
console.log("Bodies within range:", bodiesInRange);

// Get potential collision pairs
const collisionPairs = spatialService.getPotentialCollisionPairs();
console.log("Potential collisions:", collisionPairs.length);
```

### Distance Calculations

```typescript
// Find closest body to a point
const closest = spatialService.findClosestBody(
  new OSVector3(1.496e11, 0, 0), // Earth's position
);

if (closest) {
  console.log(
    `Closest body: ${closest.bodyId} at distance ${closest.distance}m`,
  );
}

// Calculate distances to all bodies
const distances = spatialService.calculateDistancesToAll(
  new OSVector3(0, 0, 0), // Sun's position
);

distances.forEach((distance, bodyId) => {
  console.log(`Distance to ${bodyId}: ${distance}m`);
});
```

### Configuration Management

```typescript
// Update neighbor distance
spatialService.setNeighborDistance(2e12); // 2 trillion meters

// Check initialization status
const isReady = spatialService.isInitialized();
console.log("Service ready:", isReady);
```

### Integration with Simulation

```typescript
// Use in simulation loop
async function setupSimulation() {
  const spatialService = CelestialDistanceService.getInstance();

  // Initialize service
  const initialized = await spatialService.initialize({
    neighborDistance: 1000 * AU_METERS, // 1000 AU
  });

  if (!initialized) {
    console.warn(
      "WASM spatial service failed to initialize, using fallback methods",
    );
  }

  return spatialService;
}

function runSimulationStep(
  spatialService: CelestialDistanceService,
  bodies: PhysicsStateReal[],
) {
  // Update spatial partitioning
  spatialService.update(bodies);

  // Get collision pairs for collision detection
  const collisionPairs = spatialService.getPotentialCollisionPairs();

  // Get neighbors for gravitational calculations
  const gravitationalNeighbors = new Map<
    string | number,
    (string | number)[]
  >();
  bodies.forEach((body) => {
    const neighbors = spatialService.findNeighbors(body.id);
    gravitationalNeighbors.set(body.id, neighbors);
  });

  return { collisionPairs, gravitationalNeighbors };
}
```

### Error Handling

```typescript
// Robust error handling
async function safeSpatialOperation() {
  const spatialService = CelestialDistanceService.getInstance();

  try {
    // Check if service is initialized
    if (!spatialService.isInitialized()) {
      console.warn(
        "Spatial service not initialized, attempting initialization",
      );
      const initialized = await spatialService.initialize();

      if (!initialized) {
        console.error("Failed to initialize spatial service");
        return null;
      }
    }

    // Perform spatial operations
    const neighbors = spatialService.findNeighbors("earth");
    return neighbors;
  } catch (error) {
    console.error("Spatial operation failed:", error);
    return null;
  }
}
```

### Resource Management

```typescript
// Proper cleanup
function cleanupSpatialService() {
  const spatialService = CelestialDistanceService.getInstance();
  spatialService.dispose();
  console.log("Spatial service disposed");
}
```

## 🎯 Performance Considerations

### Initialization Optimization

- **Concurrent Initialization**: Prevents multiple simultaneous initialization attempts
- **Promise Caching**: Reuses existing initialization promises
- **State Checking**: Avoids redundant initialization calls
- **Error Recovery**: Graceful fallback when initialization fails

### Operation Efficiency

- **Initialization Checks**: All operations verify service state before proceeding
- **Fallback Methods**: Graceful degradation when WASM is unavailable
- **Memory Management**: Proper cleanup and resource disposal

### Memory Usage

- **Singleton Pattern**: Single instance reduces memory overhead
- **Lazy Initialization**: WASM module loaded only when needed
- **Resource Cleanup**: Proper disposal prevents memory leaks
- **State Management**: Efficient state tracking and validation

## 🔗 Integration Points

### With SimulationManager

```typescript
// SimulationManager uses CelestialDistanceService
export class SimulationManager {
  private CelestialDistanceService: CelestialDistanceService;

  constructor() {
    this.CelestialDistanceService = CelestialDistanceService.getInstance();
  }

  async initialize(): Promise<void> {
    await this.CelestialDistanceService.initialize({
      neighborDistance: 1000 * AU_METERS,
    });
  }
}
```

### With Collision Detection

```typescript
// Enhanced collision detection using spatial service
const collisionPairs = spatialService.getPotentialCollisionPairs();
const detailedCollisions = collisionPairs.filter(([id1, id2]) => {
  // Detailed collision check using spatial-filtered pairs
  return checkDetailedCollision(id1, id2);
});
```

### With Gravitational Calculations

```typescript
// Efficient neighbor finding for gravity
bodies.forEach((body) => {
  const neighbors = spatialService.findNeighbors(body.id);
  const gravitationalForce = calculateGravitationalForce(body, neighbors);
  // Apply force to body
});
```

## 🔗 Related Components

- [[core/core-physics/SpatialPartitioning|SpatialPartitioning]] - Core WASM spatial partitioning implementation
- [[core/core-physics/NeighborBasedAlgorithm|NeighborBasedAlgorithm]] - Uses CelestialDistanceService
- [[core/core-physics/BarnesHutAlgorithm|BarnesHutAlgorithm]] - Uses CelestialDistanceService
- [[core/core-physics/FMMAlgorithm|FMMAlgorithm]] - Uses CelestialDistanceService
- [[core/core-physics/P3MAlgorithm|P3MAlgorithm]] - Uses CelestialDistanceService
- [[core/core-physics/TreePMAlgorithm|TreePMAlgorithm]] - Uses CelestialDistanceService
- [[core/core-physics/SimulationManager|SimulationManager]] - Uses CelestialDistanceService for spatial operations
- [[core/core-physics/CollisionDetectionService|CollisionDetectionService]] - Enhanced collision detection
- [[core/core-physics/Octree|Octree]] - Traditional spatial structure fallback (deprecated)

## 📚 Architecture Patterns

- **Singleton Pattern**: Global access and resource management
- **Service Pattern**: Centralized service coordination
- **Dependency Injection**: Provides spatial services to algorithm classes
- **Bridge Pattern**: WASM integration and fallback mechanisms
- **Promise Pattern**: Async initialization and error handling
- **Facade Pattern**: Simplified interface to complex WASM operations

---

_The CelestialDistanceService provides centralized, robust management of WASM spatial partitioning operations with proper initialization control, error handling, and performance optimization._
