---
aliases:
  [
    CollisionDetectionService,
    wasm-collision,
    webassembly-collision,
    high-performance-collision,
  ]
tags: [core, physics, wasm, collision, detection, resolution, webassembly]
type: Class
package: "@teskooano/core-physics"
name: CollisionDetectionService
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/data-types",
    "@robertaron/spacial-partitioning",
  ]
classes: ["CelestialDistanceService"]
functions: []
constants: []
types: ["PhysicsStateReal", "WasmCollisionConfig", "Collision", "CelestialType"]
status: active
---

# CollisionDetectionService

Optimized collision detection using WebAssembly spatial partitioning for high-performance collision detection and resolution.

**Location**: `src/collision/collision-service.ts`

## 🎯 Purpose

The `CollisionDetectionService` provides high-performance collision handling:

- **WASM Integration**: Leverages WebAssembly for near-native performance
- **Spatial Partitioning**: O(n log n) collision detection instead of O(n²)
- **Comprehensive Resolution**: Handles all collision types with destruction rules
- **Fallback Support**: Graceful degradation to traditional methods
- **Configurable Parameters**: Tunable collision detection and resolution

## 🏗️ Architecture

### WASM Service Integration

Uses `CelestialDistanceService` for high-performance spatial operations:

```typescript
export class CollisionDetectionService {
  private spatialService: CelestialDistanceService;
  private config: WasmCollisionConfig;
  private bodiesMap: Map<string | number, PhysicsStateReal> = new Map();
  private radiiMap: Map<string | number, number> = new Map();
  private isStarMap: Map<string | number, boolean> = new Map();
  private bodyTypesMap: Map<string | number, CelestialType> = new Map();
}
```

### Configuration-Driven

Highly configurable:

```typescript
export interface WasmCollisionConfig {
  collisionDistance: number; // Maximum distance to consider for collision detection
}
```

Built-in statistics and performance tracking:

```typescript
getStats(): {
  totalBodies: number;
  usingWasm: boolean;
  collisionDistance: number;
  spatialPartitioningStats?: any;
};
```

## 🔧 Core Methods

### Initialization

```typescript
constructor(config: Partial<WasmCollisionConfig> = {});
async initialize(): Promise<void>;
```

**Features:**

- WASM service initialization
- Configuration setup
- Performance metrics initialization
- Error handling and fallback support

### Body Management

```typescript
update(
  bodies: PhysicsStateReal[],
  radii: Map<string | number, number>,
  isStar: Map<string | number, boolean>,
  bodyTypes: Map<string | number, CelestialType>
): void;
```

**Update Features:**

- Updates body data for collision detection
- Maintains spatial partitioning
- Optimizes for WASM operations
- Handles data synchronization

### Collision Detection

```typescript
detectCollisions(ignoreCollisions?: Map<string | number, boolean>): Collision[];
```

**Detection Features:**

- O(n log n) collision detection using spatial partitioning
- Configurable collision distance
- Ignore list support for specific bodies
- Efficient spatial filtering

### Collision Resolution

```typescript
handleCollisions(ignoreCollisions?: Map<string | number, boolean>): [PhysicsStateReal[], Set<string>];
```

**Resolution Features:**

- Comprehensive collision type handling
- Destruction rules based on body types
- Momentum conservation
- Event tracking and reporting

### Spatial Queries

```typescript
findBodiesInRange(point: OSVector3, distance: number): (string | number)[];
findClosestBody(point: OSVector3): { bodyId: string | number; distance: number } | null;
```

**Query Features:**

- Fast spatial queries using WASM
- Range-based body finding
- Closest body identification
- Performance-optimized algorithms

## 🚀 Usage Examples

### Basic Setup

```typescript
import { CollisionDetectionService } from "@teskooano/core-physics";

// Create collision detection with 1 million meter collision distance
const collisionDetection = new CollisionDetectionService({
  collisionDistance: 1e6,
});

// Initialize WASM module
await collisionDetection.initialize();

// Update with current body data
collisionDetection.update(bodies, radii, isStar, bodyTypes);

// Detect collisions
const collisions = collisionDetection.detectCollisions();
console.log("Detected collisions:", collisions.length);
```

### Collision Detection and Resolution

```typescript
// Detect and handle collisions
const [updatedBodies, destroyedIds] = collisionDetection.handleCollisions();

console.log("Updated bodies:", updatedBodies.length);
console.log("Destroyed bodies:", Array.from(destroyedIds));

// Process destroyed bodies
destroyedIds.forEach((bodyId) => {
  console.log(`Body ${bodyId} was destroyed in collision`);
  // Handle cleanup, events, etc.
});

// Update simulation with new states
simulation.updateBodies(updatedBodies);
```

### Ignore List Usage

```typescript
// Create ignore list for specific bodies
const ignoreCollisions = new Map<string | number, boolean>([
  ["sun", true], // Ignore collisions with sun
  ["blackhole", true], // Ignore collisions with black hole
]);

// Detect collisions with ignore list
const collisions = collisionDetection.detectCollisions(ignoreCollisions);

// Handle collisions with ignore list
const [updatedBodies, destroyedIds] =
  collisionDetection.handleCollisions(ignoreCollisions);
```

### Spatial Queries

```typescript
// Find bodies within range of a point
const bodiesInRange = collisionDetection.findBodiesInRange(
  new OSVector3(1.496e11, 0, 0), // Earth's position
  1e8, // 100 million meters
);
console.log("Bodies in range:", bodiesInRange);

// Find closest body to a point
const closest = collisionDetection.findClosestBody(
  new OSVector3(0, 0, 0), // Sun's position
);

if (closest) {
  console.log(
    `Closest body: ${closest.bodyId} at distance ${closest.distance}m`,
  );
}
```

```typescript
// Monitor collision detection performance
const stats = collisionDetection.getStats();
console.log("Collision detection stats:", {
  totalBodies: stats.totalBodies,
  usingWasm: stats.usingWasm,
  collisionDistance: stats.collisionDistance,
  spatialPartitioningStats: stats.spatialPartitioningStats,
});

// Check if WASM is being used
if (!stats.usingWasm) {
  console.log("Falling back to traditional collision detection");
}
```

### Configuration Management

```typescript
// Update configuration
collisionDetection.updateConfig({
  collisionDistance: 5e6, // 5 million meters
});

// Get current configuration
const config = collisionDetection.getConfig();
console.log("Current config:", config);

// Dispose of resources
collisionDetection.dispose();
```

### Integration with Simulation

```typescript
// Use in physics simulation
async function setupCollisionDetectionService() {
  const collisionDetection = new CollisionDetectionService({
    collisionDistance: 1e6,
  });

  await collisionDetection.initialize();
  return collisionDetection;
}

function handleCollisions(
  collisionDetection: CollisionDetectionService,
  bodies: PhysicsStateReal[],
  radii: Map<string | number, number>,
  isStar: Map<string | number, boolean>,
  bodyTypes: Map<string | number, CelestialType>,
) {
  // Update collision detection with current data
  collisionDetection.update(bodies, radii, isStar, bodyTypes);

  // Handle collisions
  const [updatedBodies, destroyedIds] = collisionDetection.handleCollisions();

  return { updatedBodies, destroyedIds };
}
```

### Advanced Collision Handling

```typescript
// Custom collision handling with events
function handleCollisionsWithEvents(
  collisionDetection: CollisionDetectionService,
  bodies: PhysicsStateReal[],
) {
  // Update collision detection
  collisionDetection.update(bodies, radii, isStar, bodyTypes);

  // Detect collisions first
  const collisions = collisionDetection.detectCollisions();

  // Process collision events
  collisions.forEach((collision) => {
    const body1 = bodies.find((b) => b.id === collision.body1Id);
    const body2 = bodies.find((b) => b.id === collision.body2Id);

    if (body1 && body2) {
      console.log(`Collision between ${body1.id} and ${body2.id}`);
      console.log(`Collision point: ${collision.point}`);
      console.log(`Penetration depth: ${collision.penetrationDepth}`);
    }
  });

  // Handle collision resolution
  const [updatedBodies, destroyedIds] = collisionDetection.handleCollisions();

  return { updatedBodies, destroyedIds, collisions };
}
```

## 🎯 Performance Considerations

### Algorithm Complexity

- **Collision Detection**: O(n log n) using spatial partitioning
- **Collision Resolution**: O(k) where k is number of collisions
- **Spatial Queries**: O(log n) average case
- **Memory Usage**: O(n) for body storage and spatial structures

### Performance Benefits

| Operation           | Traditional | WASM       | Improvement |
| ------------------- | ----------- | ---------- | ----------- |
| Collision Detection | O(n²)       | O(n log n) | 10-100x     |
| Spatial Queries     | O(n)        | O(log n)   | 5-20x       |
| Memory Usage        | High        | Optimized  | 2-5x        |
| Overall Performance | Slow        | Fast       | 5-50x       |

### Collision Types and Resolution

**Collision Types:**

- **Star-Star**: Larger absorbs smaller (inelastic)
- **Star-Planet**: Star absorbs planet (inelastic)
- **Moon-Moon**: Mutual destruction
- **Planet-Gas Giant**: Elastic collision
- **Similar Mass**: Elastic collision
- **Large Mass Difference**: Absorption (inelastic)

**Resolution Features:**

- Momentum conservation for elastic collisions
- Mass transfer for inelastic collisions
- Destruction events for mutual annihilation
- Event tracking and reporting

### Optimal Use Cases

**Best For:**

- Large systems (> 1000 bodies)
- Frequent collision detection
- Real-time simulations
- Performance-critical applications

**Not Ideal For:**

- Very small systems (< 100 bodies) - overhead not worth it
- Systems without collision requirements
- Memory-constrained environments
- Simple collision scenarios

## 🔗 Integration Points

### With SimulationManager

```typescript
// SimulationManager uses WASM collision detection
const manager = new SimulationManager();
await manager.initialize(); // Initializes WASM components

const result = manager.simulate(params);
// WASM collision detection is automatically used when available
```

### With Spatial Partitioning

```typescript
// WASM collision detection uses spatial partitioning
const collisionPairs = spatialPartitioning.getPotentialCollisionPairs();
const collisions = collisionPairs.filter(([id1, id2]) => {
  // Detailed collision check using WASM-filtered pairs
  return checkDetailedCollision(id1, id2);
});
```

### With Physics Simulation

```typescript
// Integration with physics simulation loop
function simulationStep(bodies: PhysicsStateReal[]) {
  // Update collision detection
  collisionDetection.update(bodies, radii, isStar, bodyTypes);

  // Handle collisions
  const [updatedBodies, destroyedIds] = collisionDetection.handleCollisions();

  // Continue with physics simulation
  return simulatePhysics(updatedBodies);
}
```

## 🔗 Related Components

- [[core/core-physics/SpatialPartitioning|SpatialPartitioning]] - High-performance spatial operations
- [[core/core-physics/SimulationManager|SimulationManager]] - Orchestrates WASM usage
- [[core/core-physics/Collision|Collision]] - Traditional collision detection
- [[core/core-physics/CelestialDistanceService|CelestialDistanceService]] - WASM service wrapper

## 📚 Architecture Patterns

- **Bridge Pattern**: WASM integration and fallback mechanisms
- **Strategy Pattern**: Configurable collision algorithms
- **Factory Pattern**: WASM service initialization
- **Adapter Pattern**: Traditional to WASM data conversion

---

_The CollisionDetectionService provides high-performance collision detection and resolution through WebAssembly integration, enabling efficient collision handling for large-scale simulations._
