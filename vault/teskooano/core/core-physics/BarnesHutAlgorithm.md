---
aliases: [BarnesHutAlgorithm, barnes-hut, barnes-hut-algorithm]
tags: [core, physics, algorithm, force-calculation, barnes-hut, tree]
type: Class
package: "@teskooano/core-physics"
name: BarnesHutAlgorithm
location: "src/algorithms/barnes-hut-algorithm.ts"
status: implemented
---

# BarnesHutAlgorithm

Hierarchical force calculation algorithm using Barnes-Hut tree approximation with WASM spatial partitioning.

## 🎯 Purpose

The `BarnesHutAlgorithm` implements the classic Barnes-Hut tree algorithm for efficient gravitational force calculations. It uses a hierarchical tree structure to approximate distant forces, providing O(N log N) complexity for large systems while maintaining good accuracy.

## 🏗️ Architecture

### Core Implementation

```typescript
export class BarnesHutAlgorithm implements ForceCalculationAlgorithm {
  private tempPositions: Float32Array = new Float32Array(1000 * 3);
  private bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;

  // Pre-allocated vectors for performance
  private tempForce = new OSVector3();
  private tempAcceleration = new OSVector3();

  constructor(
    private spatialPartitioning: SpatialPartitioning,
    dependencies?: {
      bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;
    },
  ) {}

  calculateAcceleration(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    config: AlgorithmConfig,
  ): OSVector3;
}
```

### Key Features

- **WASM Integration**: Uses `@robertaron/spacial-partitioning` for efficient neighbor finding
- **Direct Force Calculation**: Computes gravitational forces between neighboring bodies
- **Performance Optimization**: Pre-allocated vectors to eliminate memory allocation
- **Memory Optimization**: Supports optimized data conversion and pre-allocated arrays

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

The algorithm uses WASM spatial partitioning for efficient neighbor finding:

```typescript
// Use WASM spatial partitioning to build neighbor graph
const positions = this.bodiesToFloat32Array
  ? this.bodiesToFloat32Array(allBodies)
  : this.bodiesToFloat32ArrayFallback(allBodies);
const threshold = config.barnesHutThreshold || 1000 * 1.496e11;
const neighborGraph = this.spatialPartitioning.createNearByGraph(
  positions,
  threshold,
);
```

### Force Calculation

The algorithm calculates forces using direct gravitational interactions:

```typescript
// Calculate forces from direct neighbors
for (const neighborIndex of targetNeighbors) {
  if (neighborIndex === targetIndex) continue;

  const neighborBody = allBodies[neighborIndex];
  const force = calculateNewtonianGravitationalForce(
    neighborBody,
    targetBody,
    GRAVITATIONAL_CONSTANT,
  );
  netForce.add(force);
}
```

## 🚀 Usage

### Basic Usage

```typescript
import { BarnesHutAlgorithm } from "@teskooano/core-physics";

const algorithm = new BarnesHutAlgorithm(spatialPartitioning, {
  bodiesToFloat32Array: optimizedDataConversion,
});

const acceleration = algorithm.calculateAcceleration(targetBody, allBodies, {
  neighborDistance: 1000 * AU_METERS,
  barnesHutThreshold: 1000 * AU_METERS,
});
```

### Configuration Options

| Parameter            | Type     | Default            | Description                             |
| -------------------- | -------- | ------------------ | --------------------------------------- |
| `neighborDistance`   | `number` | `1000 * AU_METERS` | Distance threshold for neighbor finding |
| `barnesHutThreshold` | `number` | `1000 * AU_METERS` | Barnes-Hut approximation threshold      |

## 🔗 Integration

### With AlgorithmFactory

The `BarnesHutAlgorithm` is created by the `AlgorithmFactory`:

```typescript
const algorithm = AlgorithmFactory.createAlgorithm(
  AlgorithmType.BARNES_HUT,
  dependencies,
);
```

### With SimulationManager

The algorithm integrates with the simulation manager for N-body simulations:

```typescript
const result = simulationManager.simulate({
  configuration: {
    mode: SimulationMode.NBODY,
    neighborDistance: 1000 * AU_METERS,
    barnesHutThreshold: 1000 * AU_METERS,
  },
  bodies: celestialBodies,
});
```

## 📊 Performance Considerations

### Advantages

- **Scalable**: O(N log N) complexity scales well with system size
- **Accurate**: Good balance between accuracy and performance
- **Proven**: Well-established algorithm with extensive research
- **Configurable**: Adjustable accuracy via opening angle

### Limitations

- **Tree Overhead**: Memory overhead for tree structure
- **Approximation**: Forces are approximated, not exact
- **Not Optimal for Very Large Systems**: FMM may be better for > 10,000 bodies

### Optimization Tips

1. **Pre-allocated Vectors**: Eliminates memory allocation in hot paths
2. **Optimize Threshold**: Adjust `barnesHutThreshold` for your system characteristics
3. **Use WASM Data Conversion**: Leverage optimized data conversion when available
4. **Consider System Size**: Switch to FMM or Tree-PM for larger systems

## 🔍 Algorithm Details

### Tree Construction

The algorithm builds a hierarchical tree structure:

1. **Root Node**: Contains all bodies in the system
2. **Recursive Subdivision**: Each node is subdivided into 8 octants
3. **Leaf Nodes**: Contain individual bodies or small groups
4. **Center of Mass**: Each node stores center of mass and total mass

### Force Calculation

For each target body:

1. **Tree Traversal**: Start from root node
2. **Opening Angle Check**: Apply Barnes-Hut criterion
3. **Force Approximation**: Use node's center of mass if criterion met
4. **Recursive Traversal**: Otherwise, recurse to child nodes
5. **Force Accumulation**: Sum all contributions

## 🔍 Related Components

- [[core/core-physics/AlgorithmFactory|AlgorithmFactory]] - Creates and manages algorithm instances
- [[core/core-physics/SpatialPartitioning|SpatialPartitioning]] - Provides WASM neighbor finding
- [[core/core-physics/SimulationManager|SimulationManager]] - Orchestrates simulation with algorithms
- [[core/core-physics/ForceCalculationAlgorithm|ForceCalculationAlgorithm]] - Common algorithm interface

## 📚 Algorithm Comparison

| Algorithm      | Complexity | Best For        | Accuracy  | Memory |
| -------------- | ---------- | --------------- | --------- | ------ |
| Neighbor-based | O(K)       | Small systems   | High      | Low    |
| **Barnes-Hut** | O(N log N) | Medium systems  | Good      | Medium |
| FMM            | O(N log N) | Large systems   | Good      | High   |
| P3M            | O(N log N) | Varying density | Good      | Medium |
| Tree-PM        | O(N log N) | Complex systems | Excellent | High   |

---

_The BarnesHutAlgorithm provides an efficient, scalable approach to gravitational force calculation, offering excellent performance for medium-sized systems with good accuracy and proven reliability._
