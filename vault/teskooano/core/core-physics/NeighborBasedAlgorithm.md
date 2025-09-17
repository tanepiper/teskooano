---
aliases: [NeighborBasedAlgorithm, neighbor-based, neighbor-based-algorithm]
tags: [core, physics, algorithm, force-calculation, neighbor-based]
type: Class
package: "@teskooano/core-physics"
name: NeighborBasedAlgorithm
location: "src/algorithms/neighbor-based-algorithm.ts"
status: implemented
---

# NeighborBasedAlgorithm

Simple, reliable force calculation algorithm using direct neighbor interactions with WASM spatial partitioning.

## 🎯 Purpose

The `NeighborBasedAlgorithm` provides a straightforward approach to gravitational force calculation by computing direct interactions between neighboring bodies. It's optimized for small to medium systems where simplicity and reliability are more important than extreme performance.

## 🏗️ Architecture

### Core Implementation

```typescript
export class NeighborBasedAlgorithm implements ForceCalculationAlgorithm {
  // Pre-allocated vectors for performance
  private tempForce = new OSVector3();
  private tempAcceleration = new OSVector3();

  // Pre-allocated body map to avoid creating new Map every call
  private bodyMap = new Map<string | number, PhysicsStateReal>();

  constructor(private spatialPartitioning: SpatialPartitioning) {}

  calculateAcceleration(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    config: AlgorithmConfig,
  ): OSVector3;
}
```

### Key Features

- **Direct Force Calculation**: Computes gravitational forces between all neighboring bodies
- **WASM Integration**: Uses `@robertaron/spacial-partitioning` for efficient neighbor finding
- **Performance Optimization**: Pre-allocated vectors and reusable body map
- **Memory Optimization**: Supports optimized data conversion for performance
- **Simple and Reliable**: Straightforward implementation with predictable behavior

## 🔧 Implementation Details

### Force Calculation Process

1. **Neighbor Finding**: Uses WASM spatial partitioning to find nearby bodies
2. **Direct Calculation**: Computes gravitational force between target body and each neighbor
3. **Force Accumulation**: Sums all neighbor forces to get total acceleration

### Performance Characteristics

| Aspect           | Value                        | Notes                                 |
| ---------------- | ---------------------------- | ------------------------------------- |
| **Complexity**   | O(K) per body                | K = average number of neighbors       |
| **Memory Usage** | Low                          | Minimal overhead                      |
| **Accuracy**     | High                         | Direct calculation, no approximations |
| **Best For**     | Small systems (< 100 bodies) | Simple, reliable performance          |

### WASM Integration

The algorithm leverages WASM spatial partitioning for efficient neighbor finding:

```typescript
// Use WASM spatial partitioning to build neighbor graph
const positions = this.bodiesToFloat32Array
  ? this.bodiesToFloat32Array(allBodies)
  : this.bodiesToFloat32ArrayFallback(allBodies);
const threshold = config.neighborDistance || 1000 * 1.496e11;
const neighborGraph = this.spatialPartitioning.createNearByGraph(
  positions,
  threshold,
);
```

## 🚀 Usage

### Basic Usage

```typescript
import { NeighborBasedAlgorithm } from "@teskooano/core-physics";

const algorithm = new NeighborBasedAlgorithm(spatialPartitioning, {
  bodiesToFloat32Array: optimizedDataConversion,
});

const acceleration = algorithm.calculateAcceleration(targetBody, allBodies, {
  neighborDistance: 1000 * AU_METERS,
});
```

### Configuration Options

| Parameter            | Type     | Default            | Description                                 |
| -------------------- | -------- | ------------------ | ------------------------------------------- |
| `neighborDistance`   | `number` | `1000 * AU_METERS` | Maximum distance for neighbor consideration |
| `barnesHutThreshold` | `number` | `neighborDistance` | Not used in neighbor-based algorithm        |

## 🔗 Integration

### With AlgorithmFactory

The `NeighborBasedAlgorithm` is created by the `AlgorithmFactory` as the default algorithm:

```typescript
// Default algorithm selection
const algorithm = AlgorithmFactory.createAlgorithm(
  AlgorithmType.NEIGHBOR_BASED, // or default fallback
  dependencies,
);
```

### With SimulationManager

The algorithm integrates seamlessly with the simulation manager:

```typescript
// Used in N-body simulation mode
const result = simulationManager.simulate({
  configuration: {
    mode: SimulationMode.NBODY,
    neighborDistance: 1000 * AU_METERS,
  },
  bodies: celestialBodies,
});
```

## 📊 Performance Considerations

### Advantages

- **Simplicity**: Easy to understand and debug
- **Reliability**: No approximations, direct force calculation
- **Memory Efficient**: Low memory overhead
- **Predictable**: Consistent performance characteristics

### Limitations

- **Scalability**: Performance degrades with large neighbor counts
- **O(N²) Worst Case**: If all bodies are neighbors of each other
- **Not Optimal for Large Systems**: Better algorithms available for > 100 bodies

### Optimization Tips

1. **Pre-allocated Vectors**: Eliminates memory allocation in hot paths
2. **Reusable Body Map**: Avoids creating new Map instances on every call
3. **Tune Neighbor Distance**: Adjust `neighborDistance` to balance accuracy vs performance
4. **Use WASM Data Conversion**: Leverage optimized data conversion when available
5. **Consider System Size**: Switch to Barnes-Hut or FMM for larger systems

## 🔍 Related Components

- [[core/core-physics/AlgorithmFactory|AlgorithmFactory]] - Creates and manages algorithm instances
- [[core/core-physics/SpatialPartitioning|SpatialPartitioning]] - Provides WASM neighbor finding
- [[core/core-physics/SimulationManager|SimulationManager]] - Orchestrates simulation with algorithms
- [[core/core-physics/ForceCalculationAlgorithm|ForceCalculationAlgorithm]] - Common algorithm interface

## 📚 Algorithm Comparison

| Algorithm          | Complexity | Best For        | Accuracy  | Memory |
| ------------------ | ---------- | --------------- | --------- | ------ |
| **Neighbor-based** | O(K)       | Small systems   | High      | Low    |
| Barnes-Hut         | O(N log N) | Medium systems  | Good      | Medium |
| FMM                | O(N log N) | Large systems   | Good      | High   |
| P3M                | O(N log N) | Varying density | Good      | Medium |
| Tree-PM            | O(N log N) | Complex systems | Excellent | High   |

---

_The NeighborBasedAlgorithm provides a reliable, straightforward approach to gravitational force calculation, optimized for small systems where simplicity and accuracy are paramount._
