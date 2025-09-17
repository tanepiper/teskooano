---
aliases: [P3MAlgorithm, p3m, particle-particle-particle-mesh, p3m-algorithm]
tags: [core, physics, algorithm, force-calculation, p3m, particle-mesh]
type: Class
package: "@teskooano/core-physics"
name: P3MAlgorithm
location: "src/algorithms/p3m-algorithm.ts"
status: implemented
---

# P3MAlgorithm

Particle-Particle Particle-Mesh (P3M) hybrid algorithm for gravitational force calculations using WASM spatial partitioning.

## 🎯 Purpose

The `P3MAlgorithm` implements the P3M method, which combines direct particle-particle interactions for nearby bodies with mesh-based calculations for long-range forces. This hybrid approach provides excellent performance for systems with varying density distributions and is particularly effective for cosmological simulations.

## 🏗️ Architecture

### Core Implementation

```typescript
export class P3MAlgorithm implements ForceCalculationAlgorithm {
  private tempPositions: Float32Array = new Float32Array(1000 * 3);
  private bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;
  private meshSize: number = 16; // Reduced from 64 to 16 (4,096 cells instead of 262,144)
  private cutoffRadius: number = 1000 * 1.496e11; // Default 1000 AU

  // Pre-allocated vectors for mesh creation to avoid memory allocation
  private tempMin = new OSVector3();
  private tempMax = new OSVector3();
  private tempCellMin = new OSVector3();
  private tempCellMax = new OSVector3();
  private tempCenterOfMass = new OSVector3();
  private tempPosition = new OSVector3();

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

- **Hybrid Approach**: Combines direct particle interactions with mesh-based long-range forces
- **WASM Integration**: Uses `@robertaron/spacial-partitioning` for efficient neighbor finding
- **Optimized Mesh Creation**: Reduced mesh size (16³ instead of 64³) with spatial indexing
- **Performance Optimization**: Pre-allocated vectors to eliminate memory allocation
- **Configurable Parameters**: Adjustable mesh size and cutoff radius

## 🔧 Implementation Details

### Force Calculation Process

1. **Neighbor Finding**: Uses WASM spatial partitioning to find nearby bodies
2. **Direct Calculation**: Computes exact forces between target body and neighbors
3. **Mesh Creation**: Creates 3D mesh representation of distant bodies
4. **Mesh Force Calculation**: Calculates forces from mesh cells
5. **Force Accumulation**: Combines direct and mesh forces

### Performance Characteristics

| Aspect           | Value                   | Notes                                           |
| ---------------- | ----------------------- | ----------------------------------------------- |
| **Complexity**   | O(N log N)              | Mesh-based long-range calculation               |
| **Memory Usage** | Medium                  | Mesh structure overhead                         |
| **Accuracy**     | Good                    | Direct calculation for nearby, mesh for distant |
| **Best For**     | Varying density systems | Excellent for cosmological simulations          |

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

### P3M Method

The algorithm implements the classic P3M approach:

```typescript
// P3M method combines:
// 1. Direct particle-particle calculation for nearby particles
// 2. Particle-mesh calculation for long-range forces

// Direct calculation for neighbors (short-range forces)
for (const neighborIndex of neighbors) {
  if (neighborIndex === targetIndex) continue;

  const neighborBody = allBodies[neighborIndex];
  const r = neighborBody.position_m.clone().sub(targetBody.position_m);
  const rMag = r.length();

  if (rMag > 0 && rMag < this.cutoffRadius) {
    // Apply softening to avoid singularities
    const softening = 0.1 * 1.496e11; // 0.1 AU softening
    const rSoft = Math.sqrt(rMag * rMag + softening * softening);
    const forceMag = (G * neighborBody.mass_kg) / (rSoft * rSoft);
    acceleration.add(r.clone().multiplyScalar(forceMag / rMag));
  }
}

// Particle-mesh calculation for long-range forces
const meshForce = this.calculateMeshForce(
  targetBody,
  allBodies,
  neighbors,
  targetIndex,
);
acceleration.add(meshForce);
```

### Optimized Mesh Creation

The algorithm creates an optimized 3D mesh representation using spatial indexing:

```typescript
// Adaptive mesh size based on number of bodies
const adaptiveMeshSize = Math.min(
  this.meshSize,
  Math.max(8, Math.floor(Math.cbrt(bodies.length * 4))),
);

// Use spatial indexing instead of filtering all bodies for each cell
const bodyCellIndices: number[] = [];
for (let i = 0; i < bodies.length; i++) {
  const pos = bodies[i].position_m;
  const cellX = Math.floor((pos.x - this.tempMin.x) * cellSizeInv);
  const cellY = Math.floor((pos.y - this.tempMin.y) * cellSizeInv);
  const cellZ = Math.floor((pos.z - this.tempMin.z) * cellSizeInv);

  bodyCellIndices[i] =
    clampedX * gridSize * gridSize + clampedY * gridSize + clampedZ;
}

// Group bodies by cell index for efficient processing
const cellBodies: { [cellIndex: number]: number[] } = {};
for (let i = 0; i < bodies.length; i++) {
  const cellIndex = bodyCellIndices[i];
  if (!cellBodies[cellIndex]) {
    cellBodies[cellIndex] = [];
  }
  cellBodies[cellIndex].push(i);
}
```

## 🚀 Usage

### Basic Usage

```typescript
import { P3MAlgorithm } from "@teskooano/core-physics";

const algorithm = new P3MAlgorithm(spatialPartitioning, {
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
| `barnesHutThreshold` | `number` | `neighborDistance` | Not used in P3M algorithm               |
| `meshSize`           | `number` | `16`               | Size of 3D mesh grid                    |
| `cutoffRadius`       | `number` | `1000 * AU_METERS` | Cutoff radius for direct calculation    |

## 🔗 Integration

### With AlgorithmFactory

The `P3MAlgorithm` is created by the `AlgorithmFactory`:

```typescript
const algorithm = AlgorithmFactory.createAlgorithm(
  AlgorithmType.P3M,
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
  },
  bodies: celestialBodies,
});
```

## 📊 Performance Considerations

### Advantages

- **Hybrid Efficiency**: Combines accuracy of direct calculation with efficiency of mesh methods
- **Scalable**: O(N log N) complexity scales well with system size
- **Density Adaptive**: Excellent for systems with varying density distributions
- **Proven Method**: Well-established in computational physics and cosmology

### Limitations

- **Mesh Overhead**: Memory overhead for 3D mesh structure
- **Complexity**: More complex than simple neighbor-based methods
- **Parameter Tuning**: Requires tuning of mesh size and cutoff radius

### Optimization Tips

1. **Optimized Mesh Size**: Reduced from 64³ to 16³ cells (64x fewer cells) for better performance
2. **Spatial Indexing**: Uses O(n) spatial indexing instead of O(n²) filtering
3. **Pre-allocated Vectors**: Eliminates memory allocation in hot paths
4. **Adaptive Grid Size**: Automatically scales mesh size with body count
5. **Use WASM Data Conversion**: Leverage optimized data conversion when available

## 🔍 Algorithm Details

### Force Separation

The algorithm separates forces into two components:

1. **Short-Range Forces**: Direct particle-particle calculation for nearby bodies
2. **Long-Range Forces**: Mesh-based calculation for distant bodies

### Mesh Force Calculation

The algorithm calculates forces from mesh cells:

```typescript
// Calculate force from mesh
for (const cell of mesh) {
  if (cell.totalMass > 0) {
    const r = cell.centerOfMass.clone().sub(targetBody.position_m);
    const rMag = r.length();

    if (rMag > this.cutoffRadius) {
      // Apply mesh-based force calculation
      const forceMag = (G * cell.totalMass) / (rMag * rMag);
      meshForce.add(r.clone().multiplyScalar(forceMag / rMag));
    }
  }
}
```

### Softening

The algorithm applies gravitational softening to avoid singularities:

```typescript
// Apply softening to avoid singularities
const softening = 0.1 * 1.496e11; // 0.1 AU softening
const rSoft = Math.sqrt(rMag * rMag + softening * softening);
const forceMag = (G * neighborBody.mass_kg) / (rSoft * rSoft);
```

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
| FMM            | O(N log N) | Large systems   | Good      | High   |
| **P3M**        | O(N log N) | Varying density | Good      | Medium |
| Tree-PM        | O(N log N) | Complex systems | Excellent | High   |

---

_The P3MAlgorithm provides an efficient, hybrid approach to gravitational force calculation, combining the accuracy of direct particle interactions with the efficiency of mesh-based methods for excellent performance in systems with varying density distributions._
