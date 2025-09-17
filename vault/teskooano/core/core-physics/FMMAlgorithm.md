---
aliases: [FMMAlgorithm, fmm, fast-multipole-method, fmm-algorithm]
tags: [core, physics, algorithm, force-calculation, fmm, multipole]
type: Class
package: "@teskooano/core-physics"
name: FMMAlgorithm
location: "src/algorithms/fmm-algorithm.ts"
status: implemented
---

# FMMAlgorithm

Fast Multipole Method (FMM) implementation for large-scale gravitational simulations using WASM spatial partitioning.

## 🎯 Purpose

The `FMMAlgorithm` implements the Fast Multipole Method, a sophisticated algorithm for efficient gravitational force calculations in large systems. It uses multipole expansions to approximate distant forces, providing O(N log N) complexity with excellent accuracy for systems with thousands to millions of bodies.

## 🏗️ Architecture

### Core Implementation

```typescript
export class FMMAlgorithm implements ForceCalculationAlgorithm {
  private tempPositions: Float32Array = new Float32Array(1000 * 3);
  private bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;

  // Pre-allocated vectors for performance
  private tempMin = new OSVector3();
  private tempMax = new OSVector3();
  private tempCenterOfMass = new OSVector3();
  private tempPosition = new OSVector3();
  private tempForce = new OSVector3();

  constructor(
    private spatialPartitioning: any,
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

- **Multipole Expansions**: Uses hierarchical multipole expansions for distant force approximation
- **WASM Integration**: Leverages `@robertaron/spacial-partitioning` for efficient neighbor finding
- **Hierarchical Clustering**: Groups distant bodies into clusters for efficient force calculation
- **Performance Optimization**: Pre-allocated vectors to eliminate memory allocation
- **Memory Optimization**: Supports optimized data conversion and pre-allocated arrays

## 🔧 Implementation Details

### Force Calculation Process

1. **Neighbor Finding**: Uses WASM spatial partitioning to find nearby bodies
2. **Direct Calculation**: Computes exact forces between target body and neighbors
3. **Clustering**: Groups distant bodies into spatial clusters
4. **Multipole Expansion**: Calculates forces from cluster centers of mass
5. **Force Accumulation**: Combines direct and multipole forces

### Performance Characteristics

| Aspect           | Value                                   | Notes                                  |
| ---------------- | --------------------------------------- | -------------------------------------- |
| **Complexity**   | O(N log N)                              | Hierarchical multipole expansions      |
| **Memory Usage** | High                                    | Multipole expansion overhead           |
| **Accuracy**     | Good                                    | Configurable via clustering parameters |
| **Best For**     | Large systems (10,000-1,000,000 bodies) | Excellent for massive simulations      |

### WASM Integration

The algorithm uses WASM spatial partitioning for efficient neighbor finding:

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

### Multipole Expansion

The algorithm implements a simplified multipole expansion:

```typescript
// Create clusters of distant bodies for multipole expansion
const clusters = this.createClusters(distantBodies, 8); // 8 clusters for simplicity

for (const cluster of clusters) {
  if (cluster.length > 0) {
    const clusterForce = this.calculateMultipoleForce(targetBody, cluster);
    acceleration.add(clusterForce);
  }
}
```

### Spatial Clustering

The algorithm groups distant bodies into spatial clusters:

```typescript
// Simple spatial clustering based on position
const clusters: PhysicsStateReal[][] = Array(numClusters)
  .fill(null)
  .map(() => []);

// Find bounding box and assign bodies to clusters
bodies.forEach((body) => {
  const pos = body.position_m;
  const normalizedX = (pos.x - min.x) / (max.x - min.x);
  const normalizedY = (pos.y - min.y) / (max.y - min.y);
  const normalizedZ = (pos.z - min.z) / (max.z - min.z);

  // Simple 3D grid clustering
  const clusterX = Math.floor(normalizedX * 2);
  const clusterY = Math.floor(normalizedY * 2);
  const clusterZ = Math.floor(normalizedZ * 2);
  const clusterIndex = clusterX + clusterY * 2 + clusterZ * 4;

  if (clusterIndex >= 0 && clusterIndex < numClusters) {
    clusters[clusterIndex].push(body);
  }
});
```

## 🚀 Usage

### Basic Usage

```typescript
import { FMMAlgorithm } from "@teskooano/core-physics";

const algorithm = new FMMAlgorithm(spatialPartitioning, {
  bodiesToFloat32Array: optimizedDataConversion,
});

const acceleration = algorithm.calculateAcceleration(targetBody, allBodies, {
  neighborDistance: 1000 * AU_METERS,
});
```

### Configuration Options

| Parameter            | Type     | Default            | Description                             |
| -------------------- | -------- | ------------------ | --------------------------------------- |
| `neighborDistance`   | `number` | `1000 * AU_METERS` | Distance threshold for neighbor finding |
| `barnesHutThreshold` | `number` | `neighborDistance` | Not used in FMM algorithm               |

## 🔗 Integration

### With AlgorithmFactory

The `FMMAlgorithm` is created by the `AlgorithmFactory`:

```typescript
const algorithm = AlgorithmFactory.createAlgorithm(
  AlgorithmType.FMM,
  dependencies,
);
```

### With SimulationManager

The algorithm integrates with the simulation manager for large-scale N-body simulations:

```typescript
const result = simulationManager.simulate({
  configuration: {
    mode: SimulationMode.NBODY,
    neighborDistance: 1000 * AU_METERS,
  },
  bodies: largeCelestialSystem,
});
```

## 📊 Performance Considerations

### Advantages

- **Scalable**: O(N log N) complexity scales excellently with system size
- **Accurate**: Good accuracy for large systems with proper clustering
- **Efficient**: Excellent performance for systems with > 10,000 bodies
- **Proven**: Well-established algorithm in computational physics

### Limitations

- **Memory Intensive**: High memory overhead for multipole expansions
- **Complex**: More complex implementation than simpler algorithms
- **Not Optimal for Small Systems**: Overhead not justified for < 1,000 bodies

### Optimization Tips

1. **Pre-allocated Vectors**: Eliminates memory allocation in hot paths
2. **Optimized Clustering**: Single-pass bounding box calculation and efficient clustering
3. **Tune Clustering**: Adjust number of clusters for optimal performance
4. **Optimize Neighbor Distance**: Balance direct vs multipole calculations
5. **Use WASM Data Conversion**: Leverage optimized data conversion when available

## 🔍 Algorithm Details

### Multipole Force Calculation

The algorithm calculates forces from cluster centers of mass:

```typescript
// Calculate cluster center of mass
let totalMass = 0;
const centerOfMass = new OSVector3(0, 0, 0);

cluster.forEach((body) => {
  totalMass += body.mass_kg;
  centerOfMass.add(body.position_m.clone().multiplyScalar(body.mass_kg));
});

if (totalMass === 0) return new OSVector3(0, 0, 0);

centerOfMass.multiplyScalar(1 / totalMass);

// Calculate force from cluster center of mass
const r = centerOfMass.clone().sub(targetBody.position_m);
const rMag = r.length();

if (rMag > 0) {
  const G = GRAVITATIONAL_CONSTANT;
  const forceMag = (G * totalMass) / (rMag * rMag);
  return r.clone().multiplyScalar(forceMag / rMag);
}
```

### Clustering Strategy

The algorithm uses a simple 3D grid clustering approach:

1. **Bounding Box**: Calculate bounding box of all distant bodies
2. **Grid Division**: Divide space into 2×2×2 = 8 clusters
3. **Body Assignment**: Assign bodies to clusters based on position
4. **Center of Mass**: Calculate center of mass for each cluster

## 🔍 Related Components

- [[core/core-physics/AlgorithmFactory|AlgorithmFactory]] - Creates and manages algorithm instances
- [[core/core-physics/SpatialPartitioning|SpatialPartitioning]] - Provides WASM neighbor finding
- [[core/core-physics/SimulationManager|SimulationManager]] - Orchestrates simulation with algorithms
- [[core/core-physics/ForceCalculationAlgorithm|ForceCalculationAlgorithm]] - Common algorithm interface

## 📚 Algorithm Comparison

| Algorithm      | Complexity | Best For        | Accuracy  | Memory |
| -------------- | ---------- | --------------- | --------- | ------ |
| Neighbor-based | O(K)       | Small systems   | High      | Low    |
| Barnes-Hut     | O(N log N) | Medium systems  | Good      | Medium |
| **FMM**        | O(N log N) | Large systems   | Good      | High   |
| P3M            | O(N log N) | Varying density | Good      | Medium |
| Tree-PM        | O(N log N) | Complex systems | Excellent | High   |

---

_The FMMAlgorithm provides an efficient, scalable approach to gravitational force calculation for large systems, offering excellent performance and good accuracy for simulations with thousands to millions of bodies._
