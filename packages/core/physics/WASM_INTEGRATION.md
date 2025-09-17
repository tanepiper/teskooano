# WASM Spatial Partitioning Integration

This document describes the integration of the `@robertaron/spacial-partitioning` library into the Teskooano physics engine for high-performance spatial operations.

## Overview

The WASM integration provides significant performance improvements for spatial operations:

- **Collision Detection**: O(n log n) instead of O(n²)
- **Neighbor Finding**: Fast spatial queries for gravitational calculations
- **Proximity Detection**: Efficient range-based searches
- **Scalability**: Better performance with large numbers of bodies

## Components

### 1. SpatialPartitioning

High-performance spatial partitioning using WebAssembly.

```typescript
import { SpatialPartitioning } from "@teskooano/core-physics";

const spatialPartitioning = new SpatialPartitioning(1e6); // 1 million meter neighbor distance
await spatialPartitioning.initialize();

// Update with current body positions
spatialPartitioning.update(bodies);

// Find neighbors of a specific body
const neighbors = spatialPartitioning.findNeighbors("body1");

// Find all bodies within a range
const bodiesInRange = spatialPartitioning.findBodiesInRange(point, distance);

// Get potential collision pairs
const collisionPairs = spatialPartitioning.getPotentialCollisionPairs();
```

### 2. CollisionDetectionService

Optimized collision detection using spatial partitioning.

```typescript
import { CollisionDetectionService } from "@teskooano/core-physics";

const collisionDetection = new CollisionDetectionService({
  collisionDistance: 1e6,
  useWasmPartitioning: true,
  fallbackToTraditional: true,
});

await collisionDetection.initialize();

// Update with current body data
collisionDetection.update(bodies, radii, isStar, bodyTypes);

// Detect collisions
const collisions = collisionDetection.detectCollisions();

// Handle collisions with destruction rules
const [updatedBodies, destroyedIds] = collisionDetection.handleCollisions();
```

### 3. WasmSimulationManager

Complete WASM-enhanced simulation manager.

```typescript
import { WasmSimulationManager } from "@teskooano/core-physics";

const simulationManager = new WasmSimulationManager({
  useCollisionDetectionService: true,
  useWasmNeighborFinding: true,
  neighborDistance: 1e9, // 1 billion meters
  collisionDistance: 1e6, // 1 million meters
  fallbackToTraditional: true,
});

await simulationManager.initialize();

// Update simulation with WASM enhancements
const result = simulationManager.updateSimulation(bodies, dt, params);
```

## Performance Benefits

### Collision Detection

**Before (O(n²)):**

```typescript
// Traditional collision detection
for (let i = 0; i < bodies.length; i++) {
  for (let j = i + 1; j < bodies.length; j++) {
    // Check collision between body i and j
  }
}
```

**After (O(n log n)):**

```typescript
// WASM spatial partitioning
const potentialPairs = spatialPartitioning.getPotentialCollisionPairs();
for (const [bodyId1, bodyId2] of potentialPairs) {
  // Only check pairs that are spatially close
}
```

### Neighbor Finding

**Before:**

```typescript
// Brute force neighbor search
const neighbors = bodies.filter(
  (body) => distance(body.position, targetPosition) < threshold,
);
```

**After:**

```typescript
// WASM spatial query
const neighbors = spatialPartitioning.findNeighbors(targetBodyId);
```

## Configuration

### Spatial Partitioning Configuration

```typescript
interface WasmPartitioningConfig {
  neighborDistance: number; // Maximum distance for neighbor detection
  initialized: boolean; // Whether WASM module is initialized
}
```

### Collision Detection Configuration

```typescript
interface WasmCollisionConfig {
  collisionDistance: number; // Maximum collision detection distance
  useWasmPartitioning: boolean; // Enable WASM spatial partitioning
  fallbackToTraditional: boolean; // Fallback to traditional methods
}
```

### Simulation Configuration

```typescript
interface WasmSimulationConfig {
  useCollisionDetectionService: boolean; // Enable WASM collision detection
  useWasmNeighborFinding: boolean; // Enable WASM neighbor finding
  neighborDistance: number; // Neighbor detection distance
  collisionDistance: number; // Collision detection distance
  fallbackToTraditional: boolean; // Fallback to traditional methods
}
```

## Usage Examples

### Basic Spatial Partitioning

```typescript
import { SpatialPartitioning } from "@teskooano/core-physics";

async function setupSpatialPartitioning() {
  const spatialPartitioning = new SpatialPartitioning(1e6);
  await spatialPartitioning.initialize();

  return spatialPartitioning;
}

function updateSpatialPartitioning(
  spatialPartitioning: SpatialPartitioning,
  bodies: PhysicsStateReal[],
) {
  spatialPartitioning.update(bodies);

  // Find nearby bodies for gravitational calculations
  const nearbyBodies = spatialPartitioning.findBodiesInRange(
    new OSVector3(0, 0, 0),
    1e8, // 100 million meters
  );
}
```

### Enhanced Collision Detection

```typescript
import { CollisionDetectionService } from "@teskooano/core-physics";

async function setupCollisionDetection() {
  const collisionDetection = new CollisionDetectionService({
    collisionDistance: 1e6,
    useWasmPartitioning: true,
    fallbackToTraditional: true,
  });

  await collisionDetection.initialize();
  return collisionDetection;
}

function handleCollisions(
  collisionDetection: CollisionDetectionService,
  bodies: PhysicsStateReal[],
  radii: Map<string, number>,
  isStar: Map<string, boolean>,
  bodyTypes: Map<string, CelestialType>,
) {
  collisionDetection.update(bodies, radii, isStar, bodyTypes);
  const [updatedBodies, destroyedIds] = collisionDetection.handleCollisions();

  return { updatedBodies, destroyedIds };
}
```

### Complete Simulation Integration

```typescript
import { WasmSimulationManager } from "@teskooano/core-physics";

async function setupWasmSimulation() {
  const simulationManager = new WasmSimulationManager({
    useCollisionDetectionService: true,
    useWasmNeighborFinding: true,
    neighborDistance: 1e9,
    collisionDistance: 1e6,
    fallbackToTraditional: true,
  });

  await simulationManager.initialize();
  return simulationManager;
}

function runSimulationStep(
  simulationManager: WasmSimulationManager,
  bodies: PhysicsStateReal[],
  dt: number,
  params: SimulationParameters,
) {
  const result = simulationManager.updateSimulation(bodies, dt, params);

  // Get statistics
  const stats = simulationManager.getStats();
  console.log("WASM Simulation Stats:", stats);

  return result;
}
```

## Fallback Behavior

The WASM integration includes robust fallback mechanisms:

1. **Initialization Failure**: Falls back to traditional methods if WASM fails to initialize
2. **Runtime Errors**: Gracefully degrades to traditional collision detection
3. **Performance Monitoring**: Provides statistics to monitor WASM performance

```typescript
const collisionDetection = new CollisionDetectionService({
  fallbackToTraditional: true, // Enable fallback
});

// Check if WASM is being used
const stats = collisionDetection.getStats();
if (!stats.usingWasm) {
  console.log("Falling back to traditional collision detection");
}
```

## Performance Monitoring

Monitor WASM performance with built-in statistics:

```typescript
const stats = simulationManager.getStats();
console.log({
  initialized: stats.initialized,
  usingCollisionDetectionService: stats.usingCollisionDetectionService,
  usingWasmNeighborFinding: stats.usingWasmNeighborFinding,
  collisionDetectionStats: stats.collisionDetectionStats,
  spatialPartitioningStats: stats.spatialPartitioningStats,
});
```

## Migration Guide

### From Traditional Collision Detection

**Before:**

```typescript
import { handleCollisions } from "@teskooano/core-physics";

const [updatedBodies, destroyedIds] = handleCollisions(
  bodies,
  radii,
  isStar,
  bodyTypes,
  ignoreCollisions,
);
```

**After:**

```typescript
import { CollisionDetectionService } from "@teskooano/core-physics";

const collisionDetection = new CollisionDetectionService();
await collisionDetection.initialize();

collisionDetection.update(bodies, radii, isStar, bodyTypes);
const [updatedBodies, destroyedIds] =
  collisionDetection.handleCollisions(ignoreCollisions);
```

### From Traditional Simulation

**Before:**

```typescript
import { updateSimulation } from "@teskooano/core-physics";

const result = updateSimulation(bodies, dt, params);
```

**After:**

```typescript
import { WasmSimulationManager } from "@teskooano/core-physics";

const simulationManager = new WasmSimulationManager();
await simulationManager.initialize();

const result = simulationManager.updateSimulation(bodies, dt, params);
```

## Troubleshooting

### Common Issues

1. **WASM Initialization Fails**
   - Check browser compatibility
   - Verify the `@robertaron/spacial-partitioning` package is installed
   - Enable fallback to traditional methods

2. **Performance Issues**
   - Monitor statistics to ensure WASM is being used
   - Adjust neighbor and collision distances
   - Consider reducing body count for very large simulations

3. **Memory Issues**
   - WASM uses additional memory for spatial data structures
   - Monitor memory usage in large simulations
   - Consider periodic cleanup of spatial partitioning

### Debug Information

```typescript
// Enable debug logging
const collisionDetection = new CollisionDetectionService({
  fallbackToTraditional: true,
});

// Check configuration
const config = collisionDetection.getConfig();
console.log("Collision Detection Config:", config);

// Monitor performance
const stats = collisionDetection.getStats();
console.log("Performance Stats:", stats);
```

## Future Enhancements

1. **Dynamic Distance Adjustment**: Automatically adjust neighbor distances based on simulation scale
2. **Multi-threading**: Leverage Web Workers for parallel spatial operations
3. **GPU Acceleration**: Explore WebGPU for even faster spatial queries
4. **Adaptive Algorithms**: Switch between WASM and traditional methods based on body count
