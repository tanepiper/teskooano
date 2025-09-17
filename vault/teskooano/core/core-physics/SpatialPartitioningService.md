---
aliases:
  [
    SpatialPartitioning,
    wasm-spatial,
    webassembly-spatial,
    high-performance-spatial,
  ]
tags: [core, physics, wasm, spatial, partitioning, performance, webassembly]
type: Class
package: "@teskooano/core-physics"
name: SpatialPartitioning
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/data-types",
    "@robertaron/spacial-partitioning",
  ]
classes: ["SpatialPartitioning"]
functions: []
constants: []
types: ["PhysicsStateReal", "WasmPartitioningConfig", "PerformanceMetrics"]
status: active
---

# SpatialPartitioning

High-performance spatial partitioning using WebAssembly for efficient neighbor finding within configurable distance thresholds. Used by all 5 implemented force calculation algorithms.

**Location**: `src/spatial/wasm-partitioning.ts`

## 🎯 Purpose

The `SpatialPartitioning` provides efficient spatial operations:

- **Neighbor Finding**: Fast spatial queries for gravitational calculations within distance threshold
- **Proximity Detection**: Efficient range-based searches
- **Scalability**: Better performance with large numbers of bodies
- **WASM Integration**: Leverages WebAssembly for near-native performance
- **Algorithm Integration**: Used by all 5 implemented force calculation algorithms
- **Fallback Support**: Graceful degradation to traditional methods

## 🏗️ Architecture

### WASM Integration

Uses the `@robertaron/spacial-partitioning` library for high-performance operations:

```typescript
export class SpatialPartitioning {
  private config: WasmPartitioningConfig;
  private bodyIds: (string | number)[] = [];
  private positions: Float32Array = new Float32Array();
  private neighborGraph: number[][] = [];
  private performanceMetrics: PerformanceMetrics;
}
```

### Configuration-Driven

Highly configurable:

```typescript
export interface WasmPartitioningConfig {
  neighborDistance: number; // Maximum distance for neighbor detection
  initialized: boolean; // Whether WASM module is initialized
}

export interface PerformanceMetrics {
  totalOperations: number;
  averageOperationTime: number;
  wasmOperations: number;
  traditionalOperations: number;
  lastResetTime: number;
}
```

Built-in performance tracking and statistics:

```typescript
getStats(): {
  totalBodies: number;
  averageNeighbors: number;
  maxNeighbors: number;
  neighborDistance: number;
  performance: PerformanceMetrics;
};
```

## 🔧 Core Methods

### Initialization

```typescript
constructor(neighborDistance: number = 1e6);
async initialize(): Promise<void>;
isInitialized(): boolean;
```

**Features:**

- WASM module initialization with proper error handling
- Configuration setup with initialization state tracking
- Performance metrics initialization
- Graceful fallback when WASM initialization fails
- Initialization state checking to prevent runtime errors

### Body Management

```typescript
update(bodies: PhysicsStateReal[]): void;
```

**Update Features:**

- Converts physics states to WASM format
- Updates spatial data structures
- Maintains neighbor graph
- Optimizes for WASM operations
- **Throws error if not initialized** - prevents runtime crashes
- Requires `initialize()` to be called first

### Spatial Queries

```typescript
findNeighbors(bodyId: string | number): (string | number)[];
findBodiesInRange(point: OSVector3, distance: number): (string | number)[];
calculateDistancesToAll(point: OSVector3): Map<string | number, number>;
findClosestBody(point: OSVector3): { bodyId: string | number; distance: number } | null;
getBodiesInSphere(center: OSVector3, radius: number): (string | number)[];
```

**Query Features:**

- Fast neighbor finding using WASM
- Range-based spatial searches
- Distance calculations to all bodies
- Closest body identification
- Spherical region queries

### Collision Detection

```typescript
getPotentialCollisionPairs(): [string | number, string | number][];
```

**Collision Features:**

- O(n log n) collision pair detection
- Efficient spatial filtering
- Configurable collision distance
- Performance-optimized algorithms

```typescript
getStats(): PerformanceStats;
getPerformanceImprovement(): number;
resetPerformanceMetrics(): void;
```

**Monitoring Features:**

- Operation timing and statistics
- WASM vs traditional performance comparison
- Memory usage tracking
- Performance improvement metrics

## 🚀 Usage Examples

### Basic Setup

```typescript
import { SpatialPartitioning } from "@teskooano/core-physics";

// Create spatial partitioning with 1 million meter neighbor distance
const spatialPartitioning = new SpatialPartitioning(1e6);

// Initialize WASM module
await spatialPartitioning.initialize();

// Update with current body positions
spatialPartitioning.update(bodies);

// Find neighbors of a specific body
const neighbors = spatialPartitioning.findNeighbors("earth");
console.log("Earth's neighbors:", neighbors);

// Find all bodies within a range
const bodiesInRange = spatialPartitioning.findBodiesInRange(
  new OSVector3(0, 0, 0),
  1e8, // 100 million meters
);
console.log("Bodies within range:", bodiesInRange);
```

### Collision Detection

```typescript
// Get potential collision pairs
const collisionPairs = spatialPartitioning.getPotentialCollisionPairs();
console.log("Potential collisions:", collisionPairs.length);

// Process collision pairs
collisionPairs.forEach(([bodyId1, bodyId2]) => {
  const body1 = bodies.find((b) => b.id === bodyId1);
  const body2 = bodies.find((b) => b.id === bodyId2);

  if (body1 && body2) {
    const distance = body1.position_m.distanceTo(body2.position_m);
    const collisionDistance = body1.radius + body2.radius;

    if (distance < collisionDistance) {
      console.log(`Collision detected between ${bodyId1} and ${bodyId2}`);
    }
  }
});
```

### Spatial Queries

```typescript
// Find closest body to a point
const closest = spatialPartitioning.findClosestBody(
  new OSVector3(1.496e11, 0, 0), // Earth's position
);

if (closest) {
  console.log(
    `Closest body: ${closest.bodyId} at distance ${closest.distance}m`,
  );
}

// Calculate distances to all bodies from a point
const distances = spatialPartitioning.calculateDistancesToAll(
  new OSVector3(0, 0, 0), // Sun's position
);

distances.forEach((distance, bodyId) => {
  console.log(`Distance to ${bodyId}: ${distance}m`);
});

// Find bodies in a spherical region
const bodiesInSphere = spatialPartitioning.getBodiesInSphere(
  new OSVector3(0, 0, 0), // Center
  2e11, // Radius (200 billion meters)
);
console.log("Bodies in sphere:", bodiesInSphere);
```

```typescript
// Monitor performance statistics
const stats = spatialPartitioning.getStats();
console.log("Spatial partitioning stats:", {
  totalBodies: stats.totalBodies,
  averageNeighbors: stats.averageNeighbors,
  maxNeighbors: stats.maxNeighbors,
  neighborDistance: stats.neighborDistance,
  performance: {
    totalOperations: stats.performance.totalOperations,
    averageOperationTime: stats.performance.averageOperationTime,
    wasmOperations: stats.performance.wasmOperations,
    traditionalOperations: stats.performance.traditionalOperations,
  },
});

// Check performance improvement
const improvement = spatialPartitioning.getPerformanceImprovement();
console.log(`WASM provides ${improvement.toFixed(2)}x performance improvement`);

// Reset metrics for new measurement period
spatialPartitioning.resetPerformanceMetrics();
```

### Dynamic Updates

```typescript
// Update spatial partitioning for new timestep
function updateSpatialPartitioning(
  spatialPartitioning: SpatialPartitioning,
  bodies: PhysicsStateReal[],
) {
  // Update with new body positions
  spatialPartitioning.update(bodies);

  // Find nearby bodies for gravitational calculations
  const nearbyBodies = spatialPartitioning.findBodiesInRange(
    new OSVector3(0, 0, 0),
    1e8, // 100 million meters
  );

  // Use nearby bodies for efficient force calculations
  return nearbyBodies;
}
```

### Configuration Management

```typescript
// Update configuration
spatialPartitioning.updateConfig({
  neighborDistance: 5e6, // 5 million meters
});

// Get current configuration
const config = spatialPartitioning.getConfig();
console.log("Current config:", config);

// Check initialization status
const isInitialized = spatialPartitioning.isInitialized();
console.log("WASM initialized:", isInitialized);
```

### Integration with Simulation

```typescript
// Use in physics simulation
async function setupWasmSimulation() {
  const spatialPartitioning = new SpatialPartitioning(1e9); // 1 billion meters
  await spatialPartitioning.initialize();

  return spatialPartitioning;
}

function runSimulationStep(
  spatialPartitioning: SpatialPartitioning,
  bodies: PhysicsStateReal[],
) {
  // Check if initialized before updating
  if (!spatialPartitioning.isInitialized()) {
    console.warn("WASM spatial partitioning not initialized, skipping update");
    return { collisionPairs: [], gravitationalNeighbors: new Map() };
  }

  // Update spatial partitioning
  spatialPartitioning.update(bodies);

  // Get collision pairs for collision detection
  const collisionPairs = spatialPartitioning.getPotentialCollisionPairs();

  // Get neighbors for gravitational calculations
  const gravitationalNeighbors = new Map<
    string | number,
    (string | number)[]
  >();
  bodies.forEach((body) => {
    const neighbors = spatialPartitioning.findNeighbors(body.id);
    gravitationalNeighbors.set(body.id, neighbors);
  });

  return { collisionPairs, gravitationalNeighbors };
}
```

## 🎯 Performance Considerations

### Algorithm Complexity

- **Neighbor Finding**: O(log n) average case for spatial queries
- **Range Queries**: O(log n) average case
- **Distance Calculations**: O(n) for all bodies
- **Force Calculation**: O(K) per body where K = average neighbors

### Memory Usage

- **Body Positions**: O(n) memory for position storage
- **Neighbor Graph**: O(n) memory for neighbor relationships
- **WASM Module**: Additional memory for WASM operations
- **Performance Metrics**: O(1) memory for statistics

### Performance Benefits

| Operation        | Traditional | WASM      | Improvement |
| ---------------- | ----------- | --------- | ----------- |
| Neighbor Finding | O(n)        | O(log n)  | 5-20x       |
| Range Queries    | O(n)        | O(log n)  | 5-20x       |
| Memory Usage     | High        | Optimized | 2-5x        |

### Optimal Use Cases

**Best For:**

- Large systems (> 1000 bodies)
- Frequent spatial queries
- Real-time collision detection
- Performance-critical applications

**Not Ideal For:**

- Very small systems (< 100 bodies) - overhead not worth it
- Memory-constrained environments
- Systems without WASM support
- Simple spatial operations

## 🔗 Integration Points

### With Collision Detection

```typescript
// WASM-enhanced collision detection
const collisionPairs = spatialPartitioning.getPotentialCollisionPairs();
const collisions = collisionPairs.filter(([id1, id2]) => {
  // Detailed collision check using WASM-filtered pairs
  return checkDetailedCollision(id1, id2);
});
```

### With Gravitational Calculations

```typescript
// Efficient neighbor finding for gravity
bodies.forEach((body) => {
  const neighbors = spatialPartitioning.findNeighbors(body.id);
  const gravitationalForce = calculateGravitationalForce(body, neighbors);
  // Apply force to body
});
```

### With SimulationManager

```typescript
// SimulationManager uses WASM spatial partitioning
const manager = new SimulationManager();
await manager.initialize(); // Initializes WASM components

const result = manager.simulate(params);
// WASM spatial partitioning is automatically used when available
```

## 🔗 Related Components

- [[core/core-physics/NeighborBasedAlgorithm|NeighborBasedAlgorithm]] - Uses WASM spatial partitioning
- [[core/core-physics/BarnesHutAlgorithm|BarnesHutAlgorithm]] - Uses WASM spatial partitioning
- [[core/core-physics/FMMAlgorithm|FMMAlgorithm]] - Uses WASM spatial partitioning
- [[core/core-physics/P3MAlgorithm|P3MAlgorithm]] - Uses WASM spatial partitioning
- [[core/core-physics/TreePMAlgorithm|TreePMAlgorithm]] - Uses WASM spatial partitioning
- [[core/core-physics/CollisionDetectionService|CollisionDetectionService]] - WASM-enhanced collision detection
- [[core/core-physics/SimulationManager|SimulationManager]] - Orchestrates WASM usage
- [[core/core-physics/Octree|Octree]] - Traditional spatial structure (deprecated)

## 📚 Architecture Patterns

- **Bridge Pattern**: WASM integration and fallback mechanisms
- **Strategy Pattern**: Configurable spatial algorithms
- **Factory Pattern**: WASM module initialization
- **Adapter Pattern**: Traditional to WASM data conversion

---

_The SpatialPartitioning provides significant performance improvements for spatial operations through WebAssembly integration, enabling efficient collision detection and neighbor finding for large-scale simulations._
