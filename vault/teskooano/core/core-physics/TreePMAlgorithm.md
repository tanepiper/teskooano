---
aliases: [TreePMAlgorithm, tree-pm, tree-particle-mesh, tree-pm-algorithm]
tags: [core, physics, algorithm, force-calculation, tree-pm, hybrid]
type: Class
package: "@teskooano/core-physics"
name: TreePMAlgorithm
location: "src/algorithms/tree-pm.ts"
status: implemented
---

# TreePMAlgorithm

Advanced Tree-PM hybrid algorithm combining Tree and Particle-Mesh methods for optimal performance across different density scales.

## 🎯 Purpose

The `TreePMAlgorithm` implements a sophisticated hybrid approach that combines the strengths of both Tree and Particle-Mesh methods. It automatically partitions space based on density thresholds, providing optimal performance across different density scales while maintaining high accuracy in both dense and sparse regions.

## 🏗️ Architecture

### Core Implementation

```typescript
export class TreePMAlgorithm implements ForceCalculationAlgorithm {
  private tempPositions: Float32Array = new Float32Array(1000 * 3);
  private bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;

  // Pre-allocated vectors for mesh creation to avoid memory allocation
  private tempMin = new OSVector3();
  private tempMax = new OSVector3();
  private tempCellMin = new OSVector3();
  private tempCellMax = new OSVector3();
  private tempCenterOfMass = new OSVector3();
  private tempPosition = new OSVector3();

  private config: TreePMConfig;
  private pmGrid: PMCell[][][];
  private gridSpacing: number;
  private simulationBounds: { min: OSVector3; max: OSVector3 };

  constructor(
    private spatialPartitioning: any,
    dependencies?: {
      bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;
    },
    config: Partial<TreePMConfig> = {},
  ) {}

  calculateAcceleration(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    config: AlgorithmConfig,
  ): OSVector3;
}
```

### Key Features

- **Hybrid Approach**: Combines Tree method for short-range and PM method for long-range forces
- **Density-Based Partitioning**: Automatically switches between methods based on local density
- **WASM Integration**: Uses `@robertaron/spacial-partitioning` for efficient neighbor finding
- **Performance Optimization**: Pre-allocated vectors and optimized mesh creation
- **Configurable Parameters**: Adjustable density thresholds and mesh parameters

## 🔧 Implementation Details

### Force Calculation Process

1. **Neighbor Finding**: Uses WASM spatial partitioning to find nearby bodies
2. **Tree-PM Forces**: Combines direct tree calculation with mesh-based long-range forces
3. **Density Analysis**: Identifies high-density regions for tree method
4. **Force Accumulation**: Combines tree and mesh force contributions

### Performance Characteristics

| Aspect           | Value                       | Notes                         |
| ---------------- | --------------------------- | ----------------------------- |
| **Complexity**   | O(N log N)                  | Hybrid tree and mesh approach |
| **Memory Usage** | High                        | Both tree and mesh structures |
| **Accuracy**     | Excellent                   | Best of both methods          |
| **Best For**     | Complex multi-scale systems | Optimal for varying density   |

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

### Tree-PM Method

The algorithm implements the hybrid Tree-PM approach:

```typescript
// Tree-PM method combines:
// 1. Direct particle-particle calculation for nearby particles (Tree method)
// 2. Particle-mesh calculation for long-range forces (PM method)

// Direct calculation for neighbors (short-range forces using Tree method)
for (const neighborIndex of neighbors) {
  if (neighborIndex === targetIndex) continue;

  const neighborBody = allBodies[neighborIndex];
  const r = neighborBody.position_m.clone().sub(targetBody.position_m);
  const rMag = r.length();

  if (rMag > 0) {
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

### Configuration

The algorithm uses a comprehensive configuration system:

```typescript
export interface TreePMConfig {
  /** Density threshold above which to use Tree method (particles/grid_cell) */
  treeThreshold: number;
  /** PM grid size (number of cells per dimension) */
  pmGridSize: number;
  /** Force smoothing length for PM calculation */
  smoothingLength: number;
  /** Tree opening angle (theta parameter) */
  treeOpeningAngle: number;
  /** Maximum tree depth */
  maxTreeDepth: number;
  /** Direct sum cutoff (below this distance, use direct sum) */
  directCutoff: number;
}

export const DEFAULT_TREE_PM_CONFIG: TreePMConfig = {
  treeThreshold: 5.0, // 5 particles per cell threshold
  pmGridSize: 16, // 16^3 grid (4,096 cells instead of 262,144)
  smoothingLength: 1.0, // Smoothing length in simulation units
  treeOpeningAngle: 0.5, // Standard Barnes-Hut opening angle
  maxTreeDepth: 20, // Maximum tree recursion depth
  directCutoff: 2.5, // Direct sum below 2.5 smoothing lengths
};
```

## 🚀 Usage

### Basic Usage

```typescript
import { TreePMAlgorithm } from "@teskooano/core-physics";

const algorithm = new TreePMAlgorithm(
  spatialPartitioning,
  {
    bodiesToFloat32Array: optimizedDataConversion,
  },
  {
    treeThreshold: 5.0,
    pmGridSize: 64,
    smoothingLength: 1.0,
  },
);

const acceleration = algorithm.calculateAcceleration(targetBody, allBodies, {
  neighborDistance: 1000 * AU_METERS,
});
```

### Configuration Options

| Parameter            | Type     | Default            | Description                             |
| -------------------- | -------- | ------------------ | --------------------------------------- |
| `neighborDistance`   | `number` | `1000 * AU_METERS` | Distance threshold for neighbor finding |
| `barnesHutThreshold` | `number` | `neighborDistance` | Not used in Tree-PM algorithm           |
| `treeThreshold`      | `number` | `5.0`              | Density threshold for tree method       |
| `pmGridSize`         | `number` | `16`               | Size of PM mesh grid                    |
| `smoothingLength`    | `number` | `1.0`              | Force smoothing length                  |
| `treeOpeningAngle`   | `number` | `0.5`              | Tree opening angle                      |
| `maxTreeDepth`       | `number` | `20`               | Maximum tree depth                      |
| `directCutoff`       | `number` | `2.5`              | Direct sum cutoff distance              |

## 🔗 Integration

### With AlgorithmFactory

The `TreePMAlgorithm` is created by the `AlgorithmFactory`:

```typescript
const algorithm = AlgorithmFactory.createAlgorithm(
  AlgorithmType.TREE_PM,
  dependencies,
);
```

### With SimulationManager

The algorithm integrates with the simulation manager for complex N-body simulations:

```typescript
const result = simulationManager.simulate({
  configuration: {
    mode: SimulationMode.NBODY,
    neighborDistance: 1000 * AU_METERS,
  },
  bodies: complexCelestialSystem,
});
```

## 📊 Performance Considerations

### Advantages

- **Optimal Performance**: Best of both Tree and PM methods
- **Density Adaptive**: Automatically adapts to local density conditions
- **High Accuracy**: Excellent accuracy in both dense and sparse regions
- **Scalable**: O(N log N) complexity scales well with system size

### Limitations

- **Memory Intensive**: High memory overhead for both tree and mesh structures
- **Complex**: Most complex algorithm with many parameters to tune
- **Not Optimal for Simple Systems**: Overhead not justified for simple systems

### Optimization Tips

1. **Optimized Mesh Size**: Reduced from 64³ to 16³ cells (64x fewer cells) for better performance
2. **Spatial Indexing**: Uses O(n) spatial indexing instead of O(n²) filtering
3. **Pre-allocated Vectors**: Eliminates memory allocation in hot paths
4. **Adaptive Grid Size**: Automatically scales mesh size with body count
5. **Tune Density Threshold**: Adjust `treeThreshold` for optimal method selection
6. **Use WASM Data Conversion**: Leverage optimized data conversion when available

## 🔍 Algorithm Details

### Density-Based Method Selection

The algorithm automatically selects the appropriate method based on local density:

```typescript
// Identify high-density regions that should use tree method
private identifyHighDensityRegions(densityMap: number[][][]): Set<string> {
  const highDensityRegions = new Set<string>();
  const size = this.config.pmGridSize;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        if (densityMap[i][j][k] > this.config.treeThreshold) {
          highDensityRegions.add(`${i},${j},${k}`);
        }
      }
    }
  }

  return highDensityRegions;
}
```

### Mesh Force Calculation

The algorithm calculates long-range forces using a mesh representation:

```typescript
// Calculate force from mesh
for (const cell of mesh) {
  if (cell.totalMass > 0) {
    const r = cell.centerOfMass.clone().sub(targetBody.position_m);
    const rMag = r.length();

    if (rMag > 1000 * 1.496e11) {
      // Only for very distant particles
      const forceMag = (G * cell.totalMass) / (rMag * rMag);
      meshForce.add(r.clone().multiplyScalar(forceMag / rMag));
    }
  }
}
```

### Force Corrections

The algorithm applies corrections to avoid double-counting forces:

```typescript
// Apply corrections to avoid double-counting forces
private applyForceCorrections(
  bodies: Record<string, PhysicsStateReal>,
  forces: Record<string, OSVector3>,
  highDensityRegions: Set<string>,
  G: number
): void {
  // Remove PM forces that were already calculated by tree method
  Object.entries(forces).forEach(([id, force]) => {
    const body = bodies[id];
    const pos = body.position_m;
    const gx = Math.floor((pos.x - this.simulationBounds.min.x) / this.gridSpacing);
    const gy = Math.floor((pos.y - this.simulationBounds.min.y) / this.gridSpacing);
    const gz = Math.floor((pos.z - this.simulationBounds.min.z) / this.gridSpacing);

    if (highDensityRegions.has(`${gx},${gy},${gz}`)) {
      // Reduce PM force contribution in high-density regions
      const correctionFactor = 0.5; // Simplified correction
      force.multiplyScalar(correctionFactor);
    }
  });
}
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
| P3M            | O(N log N) | Varying density | Good      | Medium |
| **Tree-PM**    | O(N log N) | Complex systems | Excellent | High   |

---

_The TreePMAlgorithm provides the most sophisticated approach to gravitational force calculation, combining the best aspects of Tree and Particle-Mesh methods for optimal performance across different density scales and system complexities._
