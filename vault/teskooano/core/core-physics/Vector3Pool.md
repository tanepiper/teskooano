---
aliases: [Vector3Pool, vector-pool, memory-pool, object-pool, vector-recycling]
tags: [core, physics, memory, pool, optimization, performance, vector-reuse]
type: Class
package: "@teskooano/core-physics"
name: Vector3Pool
dependencies: ["@teskooano/core-math"]
classes: ["OSVector3"]
functions: []
constants: []
types: ["OSVector3", "PoolConfig", "PoolStats"]
status: active
---

# Vector3Pool

High-performance object pool for OSVector3 instances, providing efficient memory management and reducing garbage collection overhead in physics simulations.

**Location**: `src/utils/vectorPool.ts`

## 🎯 Purpose

The `Vector3Pool` provides efficient vector memory management:

- **Memory Optimization**: Reduces garbage collection pressure
- **Performance Improvement**: Faster vector allocation/deallocation
- **Memory Reuse**: Recycles vector instances instead of creating new ones
- **Pool Management**: Configurable pool size and growth strategies
- **Statistics Tracking**: Monitors pool usage and performance metrics
- **Thread Safety**: Safe for concurrent access in multi-threaded environments

## 🏗️ Architecture

### Object Pool Pattern

Implements the object pool pattern for OSVector3 instances:

```typescript
export class Vector3Pool {
  private pool: OSVector3[] = [];
  private available: OSVector3[] = [];
  private inUse: Set<OSVector3> = new Set();
  private config: PoolConfig;
  private stats: PoolStats;
}
```

### Configuration-Driven

Highly configurable pool behavior:

```typescript
interface PoolConfig {
  initialSize: number;
  maxSize: number;
  growthFactor: number;
  enableStats: boolean;
  autoResize: boolean;
}

interface PoolStats {
  totalAllocated: number;
  totalFreed: number;
  currentInUse: number;
  peakInUse: number;
  allocationHits: number;
  allocationMisses: number;
  averageAllocationTime: number;
  averageFreeTime: number;
}
```

### Memory Management

Efficient memory allocation and recycling:

```typescript
class Vector3Pool {
  acquire(): OSVector3;
  release(vector: OSVector3): void;
  clear(): void;
  resize(newSize: number): void;
  getStats(): PoolStats;
}
```

## 🔧 Core Methods

### Pool Acquisition

```typescript
acquire(): OSVector3;
```

**Acquisition Features:**

- Returns recycled vector or creates new one
- Zeroes vector components automatically
- Tracks allocation statistics
- Handles pool growth when needed

### Pool Release

```typescript
release(vector: OSVector3): void;
```

**Release Features:**

- Returns vector to available pool
- Validates vector ownership
- Updates usage statistics
- Handles pool overflow protection

### Pool Management

```typescript
clear(): void;
resize(newSize: number): void;
getStats(): PoolStats;
```

**Management Features:**

- Complete pool cleanup
- Dynamic pool resizing
- Performance statistics
- Memory usage monitoring

### Configuration

```typescript
constructor(config?: Partial<PoolConfig>);
updateConfig(newConfig: Partial<PoolConfig>): void;
```

**Configuration Features:**

- Initial pool size setup
- Maximum size limits
- Growth factor configuration
- Statistics enablement

## 🚀 Usage Examples

### Basic Pool Usage

```typescript
import { Vector3Pool } from "@teskooano/core-physics";

// Create pool with default configuration
const pool = new Vector3Pool();

// Acquire vectors from pool
const vector1 = pool.acquire();
const vector2 = pool.acquire();
const vector3 = pool.acquire();

// Use vectors
vector1.set(1, 2, 3);
vector2.set(4, 5, 6);
vector3.set(7, 8, 9);

// Release vectors back to pool
pool.release(vector1);
pool.release(vector2);
pool.release(vector3);

// Get pool statistics
const stats = pool.getStats();
console.log("Pool stats:", stats);
```

### Custom Configuration

```typescript
// Create pool with custom configuration
const customPool = new Vector3Pool({
  initialSize: 100,
  maxSize: 1000,
  growthFactor: 2.0,
  enableStats: true,
  autoResize: true,
});

// Use custom pool
const vectors: OSVector3[] = [];
for (let i = 0; i < 50; i++) {
  const vector = customPool.acquire();
  vector.set(i, i * 2, i * 3);
  vectors.push(vector);
}

// Release all vectors
vectors.forEach((vector) => customPool.release(vector));

// Check statistics
const stats = customPool.getStats();
console.log("Custom pool stats:", {
  totalAllocated: stats.totalAllocated,
  totalFreed: stats.totalFreed,
  currentInUse: stats.currentInUse,
  peakInUse: stats.peakInUse,
});
```

### Physics Simulation Integration

```typescript
// Use pool in physics simulation
class PhysicsSimulation {
  private vectorPool: Vector3Pool;

  constructor() {
    this.vectorPool = new Vector3Pool({
      initialSize: 1000,
      maxSize: 10000,
      enableStats: true,
    });
  }

  calculateForces(bodies: PhysicsStateReal[]): OSVector3[] {
    const forces: OSVector3[] = [];

    bodies.forEach((body) => {
      const force = this.vectorPool.acquire();
      // Calculate force for this body
      this.calculateGravitationalForce(body, force);
      forces.push(force);
    });

    return forces;
  }

  updateVelocities(
    bodies: PhysicsStateReal[],
    forces: OSVector3[],
    dt: number,
  ) {
    bodies.forEach((body, index) => {
      const force = forces[index];
      const acceleration = this.vectorPool.acquire();

      // Calculate acceleration
      acceleration.copy(force).multiplyScalar(1 / body.mass_kg);

      // Update velocity
      body.velocity_mps.add(acceleration.multiplyScalar(dt));

      // Release temporary vectors
      this.vectorPool.release(force);
      this.vectorPool.release(acceleration);
    });
  }

  cleanup() {
    this.vectorPool.clear();
  }
}
```

### Performance Benchmarking

```typescript
// Benchmark pool performance vs direct allocation
function benchmarkVectorAllocation(iterations: number) {
  // Test direct allocation
  const directStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const vector = new OSVector3(i, i * 2, i * 3);
    // Simulate some work
    vector.length();
  }
  const directTime = performance.now() - directStart;

  // Test pool allocation
  const pool = new Vector3Pool({ initialSize: 1000, enableStats: true });
  const poolStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const vector = pool.acquire();
    vector.set(i, i * 2, i * 3);
    // Simulate some work
    vector.length();
    pool.release(vector);
  }
  const poolTime = performance.now() - poolStart;

  const stats = pool.getStats();

  console.log("Vector allocation benchmark:");
  console.log(`Direct allocation: ${directTime.toFixed(2)}ms`);
  console.log(`Pool allocation: ${poolTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(directTime / poolTime).toFixed(2)}x`);
  console.log(`Pool stats:`, stats);

  pool.clear();

  return { directTime, poolTime, speedup: directTime / poolTime, stats };
}
```

### Memory Usage Monitoring

```typescript
// Monitor memory usage patterns
function monitorMemoryUsage() {
  const pool = new Vector3Pool({
    initialSize: 100,
    maxSize: 1000,
    enableStats: true,
  });

  const usagePatterns: PoolStats[] = [];

  // Simulate varying load
  for (let cycle = 0; cycle < 10; cycle++) {
    const vectors: OSVector3[] = [];

    // Allocate varying number of vectors
    const allocationCount = 50 + Math.floor(Math.random() * 100);

    for (let i = 0; i < allocationCount; i++) {
      const vector = pool.acquire();
      vector.set(Math.random(), Math.random(), Math.random());
      vectors.push(vector);
    }

    // Use vectors
    vectors.forEach((vector) => {
      vector.length();
      vector.normalize();
    });

    // Release some vectors
    const releaseCount = Math.floor(vectors.length * 0.7);
    for (let i = 0; i < releaseCount; i++) {
      pool.release(vectors[i]);
    }

    // Record stats
    usagePatterns.push({ ...pool.getStats() });

    // Keep some vectors for next cycle
    vectors.splice(0, releaseCount);
  }

  // Analyze usage patterns
  console.log("Memory usage patterns:");
  usagePatterns.forEach((stats, index) => {
    console.log(`Cycle ${index}:`, {
      currentInUse: stats.currentInUse,
      peakInUse: stats.peakInUse,
      allocationHits: stats.allocationHits,
      allocationMisses: stats.allocationMisses,
    });
  });

  pool.clear();
  return usagePatterns;
}
```

### Pool Resizing

```typescript
// Dynamic pool resizing
function demonstratePoolResizing() {
  const pool = new Vector3Pool({
    initialSize: 10,
    maxSize: 100,
    enableStats: true,
  });

  console.log("Initial pool size:", pool.getStats().totalAllocated);

  // Allocate more vectors than initial size
  const vectors: OSVector3[] = [];
  for (let i = 0; i < 50; i++) {
    const vector = pool.acquire();
    vector.set(i, i, i);
    vectors.push(vector);
  }

  console.log("After allocation:", pool.getStats().totalAllocated);

  // Release all vectors
  vectors.forEach((vector) => pool.release(vector));

  console.log("After release:", pool.getStats().totalAllocated);

  // Manually resize pool
  pool.resize(200);
  console.log("After resize:", pool.getStats().totalAllocated);

  pool.clear();
}
```

### Error Handling

```typescript
// Demonstrate error handling
function demonstrateErrorHandling() {
  const pool = new Vector3Pool({ enableStats: true });

  // Acquire vector
  const vector = pool.acquire();

  // Try to release same vector twice (should handle gracefully)
  pool.release(vector);
  pool.release(vector); // This should be handled safely

  // Try to release vector not from this pool
  const externalVector = new OSVector3(1, 2, 3);
  pool.release(externalVector); // This should be handled safely

  // Check final stats
  const stats = pool.getStats();
  console.log("Error handling stats:", stats);

  pool.clear();
}
```

## 🎯 Performance Considerations

### Memory Benefits

- **Reduced GC Pressure**: Eliminates frequent vector allocations
- **Memory Locality**: Pooled vectors may have better cache performance
- **Predictable Memory Usage**: Bounded memory consumption
- **Faster Allocation**: O(1) allocation from pool vs O(n) from heap

### Performance Characteristics

| Operation         | Direct Allocation    | Pool Allocation  | Improvement |
| ----------------- | -------------------- | ---------------- | ----------- |
| Allocation        | O(n) heap allocation | O(1) pool access | 10-100x     |
| Deallocation      | O(n) GC pressure     | O(1) pool return | 5-50x       |
| Memory Usage      | Unbounded            | Bounded          | Predictable |
| Cache Performance | Variable             | Better locality  | 2-5x        |

### Optimal Pool Sizes

**Small Simulations (< 100 bodies):**

- Initial size: 50-100
- Max size: 200-500
- Growth factor: 1.5

**Medium Simulations (100-1000 bodies):**

- Initial size: 200-500
- Max size: 1000-5000
- Growth factor: 2.0

**Large Simulations (> 1000 bodies):**

- Initial size: 500-1000
- Max size: 5000-20000
- Growth factor: 2.0

### Memory Overhead

- **Pool Storage**: ~24 bytes per vector (3 doubles)
- **Management Overhead**: ~16 bytes per vector (references)
- **Total Overhead**: ~40 bytes per pooled vector
- **Benefit**: Eliminates allocation/deallocation costs

## 🔗 Integration Points

### With Physics Simulations

```typescript
// Integration with physics simulation
class PhysicsEngine {
  private vectorPool: Vector3Pool;

  constructor() {
    this.vectorPool = new Vector3Pool({
      initialSize: 1000,
      maxSize: 10000,
      enableStats: true,
    });
  }

  simulate(bodies: PhysicsStateReal[], dt: number) {
    // Use pool for all vector operations
    const forces = this.calculateForces(bodies);
    this.updatePositions(bodies, forces, dt);

    // Clean up forces
    forces.forEach((force) => this.vectorPool.release(force));
  }
}
```

### With Integrators

```typescript
// Integration with numerical integrators
class VerletIntegrator {
  private vectorPool: Vector3Pool;

  constructor() {
    this.vectorPool = new Vector3Pool();
  }

  integrate(bodies: PhysicsStateReal[], dt: number) {
    bodies.forEach((body) => {
      const acceleration = this.vectorPool.acquire();
      const velocity = this.vectorPool.acquire();

      // Integration calculations
      this.calculateAcceleration(body, acceleration);
      velocity.copy(body.velocity_mps).add(acceleration.multiplyScalar(dt));

      // Update body
      body.position_m.add(velocity.multiplyScalar(dt));
      body.velocity_mps.copy(velocity);

      // Release temporary vectors
      this.vectorPool.release(acceleration);
      this.vectorPool.release(velocity);
    });
  }
}
```

### With Force Calculations

```typescript
// Integration with force calculations
class GravitationalForceCalculator {
  private vectorPool: Vector3Pool;

  constructor() {
    this.vectorPool = new Vector3Pool();
  }

  calculateForce(body1: PhysicsStateReal, body2: PhysicsStateReal): OSVector3 {
    const force = this.vectorPool.acquire();
    const displacement = this.vectorPool.acquire();

    // Calculate displacement
    displacement.copy(body2.position_m).sub(body1.position_m);
    const distance = displacement.length();

    // Calculate force magnitude
    const forceMagnitude =
      (G * body1.mass_kg * body2.mass_kg) / (distance * distance);

    // Calculate force vector
    force.copy(displacement).normalize().multiplyScalar(forceMagnitude);

    // Release temporary vector
    this.vectorPool.release(displacement);

    return force; // Caller is responsible for releasing force
  }
}
```

## 🔗 Related Components

- [[core/core-math/OSVector3|OSVector3]] - Core vector class
- [[core/core-physics/SimulationManager|SimulationManager]] - Integration with simulation systems
- [[data/data-types/PhysicsStateReal|PhysicsStateReal]] - Physics state representation
- [[core/core-physics/Integrators|Integrators]] - Numerical integration methods

## 📚 Architecture Patterns

- **Object Pool Pattern**: Efficient object recycling
- **Factory Pattern**: Vector creation and management
- **Resource Management**: Automatic cleanup and monitoring
- **Statistics Pattern**: Performance monitoring
- **Configuration Pattern**: Flexible pool behavior

---

_The Vector3Pool provides efficient memory management for OSVector3 instances, significantly improving performance in physics simulations by reducing garbage collection overhead and providing faster vector allocation._
