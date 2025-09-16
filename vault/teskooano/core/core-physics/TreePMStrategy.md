---
aliases:
  [TreePMStrategy, tree-pm, tree-particle-mesh, hybrid-algorithm, multi-scale]
tags:
  [
    core,
    physics,
    algorithms,
    tree-pm,
    hybrid,
    multi-scale,
    spatial-partitioning,
  ]
type: Class
package: "@teskooano/core-physics"
name: TreePMStrategy
dependencies:
  ["@teskooano/core-math", "@teskooano/data-types", "@teskooano/data-values"]
classes: ["AlgorithmStrategy"]
functions: []
constants: ["GRAVITATIONAL_CONSTANT"]
types:
  [
    "PhysicsStateReal",
    "SimulationParameters",
    "TreePMConfig",
    "PMCell",
    "TreeNode",
  ]
status: active
---

# TreePMStrategy

Advanced Tree-PM hybrid algorithm that combines Tree and Particle-Mesh methods for optimal performance across different density scales.

**Location**: `src/algorithms/tree-pm.ts`

## 🎯 Purpose

The `TreePMStrategy` provides a sophisticated hybrid approach to force calculations:

- **Multi-Scale Optimization**: Automatically adapts to density variations
- **Optimal Performance**: Combines best aspects of Tree and PM methods
- **High Accuracy**: Maintains accuracy in both dense and sparse regions
- **Automatic Partitioning**: Density-based spatial partitioning
- **Force Correction**: Eliminates double-counting between methods
- **Configurable Parameters**: Tunable for different simulation requirements

## 🏗️ Architecture

### Hybrid Algorithm Design

Combines two complementary methods:

```typescript
export class TreePMStrategy extends AlgorithmStrategy {
  readonly name = "tree-pm";
  readonly complexity = "O(N log N)";
  readonly recommendedMinBodies = 1000;
  readonly recommendedMaxBodies = 1000000;
}
```

### Multi-Scale Approach

- **PM Method**: Long-range forces in low-density regions (faster)
- **Tree Method**: Short-range forces in high-density regions (more accurate)
- **Automatic Density Analysis**: Identifies regions for each method
- **Force Correction**: Removes double-counting between methods

### Configuration-Driven

Highly configurable with sensible defaults:

```typescript
export interface TreePMConfig {
  treeThreshold: number; // Particles per cell threshold
  pmGridSize: number; // PM grid size (64³ default)
  smoothingLength: number; // Force smoothing length
  treeOpeningAngle: number; // Barnes-Hut theta parameter
  maxTreeDepth: number; // Tree recursion limit
  directCutoff: number; // Direct sum threshold
}
```

## 🔧 Core Methods

### Force Calculation

```typescript
calculateForces(
  bodies: Record<string, PhysicsStateReal>,
  params: SimulationParameters
): Record<string, OSVector3>;
```

**Algorithm Steps:**

1. **Spatial Partitioning**: Divide space into grid cells
2. **Density Analysis**: Identify high-density regions using threshold
3. **PM Forces**: Calculate long-range forces using mesh method
4. **Tree Forces**: Calculate short-range forces using octree
5. **Force Correction**: Remove double-counting between methods

### Spatial Partitioning

```typescript
private calculateSimulationBounds(bodies: Record<string, PhysicsStateReal>): void;
private initializePMGrid(): void;
private assignParticlesToGrid(bodies: Record<string, PhysicsStateReal>): number[][][];
```

**Features:**

- Automatic bounding box calculation with padding
- Cloud-in-Cell (CIC) particle assignment
- Density map generation for region identification

### Density Analysis

```typescript
private identifyHighDensityRegions(densityMap: number[][][]): Set<string>;
```

**Analysis Features:**

- Threshold-based high-density region identification
- Automatic partitioning based on particle density
- Configurable density thresholds

### PM Force Calculation

```typescript
private calculatePMForces(
  bodies: Record<string, PhysicsStateReal>,
  forces: Record<string, OSVector3>,
  G: number
): void;
```

**PM Features:**

- Long-range force calculation using mesh method
- Softened gravitational forces for stability
- Efficient grid-based force computation

### Tree Force Calculation

```typescript
private calculateTreeForces(
  bodies: Record<string, PhysicsStateReal>,
  forces: Record<string, OSVector3>,
  highDensityRegions: Set<string>,
  G: number
): void;
```

**Tree Features:**

- Octree construction for high-density regions
- Barnes-Hut force approximation
- Configurable opening angle for accuracy control

### Force Correction

```typescript
private applyForceCorrections(
  bodies: Record<string, PhysicsStateReal>,
  forces: Record<string, OSVector3>,
  highDensityRegions: Set<string>,
  G: number
): void;
```

**Correction Features:**

- Removes double-counting between PM and Tree methods
- Ensures consistent force calculations
- Maintains physical accuracy

## 🚀 Usage Examples

### Basic Configuration

```typescript
import { TreePMStrategy } from "@teskooano/core-physics";

// Use default configuration
const treePM = new TreePMStrategy();

// Custom configuration
const customConfig = {
  treeThreshold: 3.0, // Lower threshold for more tree usage
  pmGridSize: 128, // Higher resolution grid
  smoothingLength: 0.5, // Smaller smoothing for accuracy
  treeOpeningAngle: 0.3, // Lower theta for higher accuracy
  maxTreeDepth: 25, // Deeper tree for complex systems
  directCutoff: 1.5, // Smaller direct sum cutoff
};

const highAccuracyTreePM = new TreePMStrategy(customConfig);
```

### Force Calculation

```typescript
// Calculate forces for all bodies
const bodies = {
  sun: {
    id: "sun",
    mass_kg: 1.989e30,
    position_m: new OSVector3(0, 0, 0),
    velocity_mps: new OSVector3(0, 0, 0),
  },
  earth: {
    id: "earth",
    mass_kg: 5.972e24,
    position_m: new OSVector3(1.496e11, 0, 0),
    velocity_mps: new OSVector3(0, 0, 29780),
  },
  // ... more bodies
};

const params = {
  bodies,
  deltaTime: 3600,
  configuration: { mode: "nbody", algorithm: "tree-pm", integrator: "verlet" },
  // ... other parameters
};

const forces = treePM.calculateForces(bodies, params);
console.log("Forces calculated for", Object.keys(forces).length, "bodies");
```

### Performance Optimization

```typescript
// Optimize for speed
const fastConfig = {
  treeThreshold: 10.0, // Higher threshold, less tree usage
  pmGridSize: 32, // Lower resolution grid
  smoothingLength: 2.0, // Larger smoothing for stability
  treeOpeningAngle: 0.8, // Higher theta for speed
  maxTreeDepth: 15, // Shallow tree
  directCutoff: 5.0, // Larger direct sum cutoff
};

const fastTreePM = new TreePMStrategy(fastConfig);

// Optimize for accuracy
const accurateConfig = {
  treeThreshold: 2.0, // Lower threshold, more tree usage
  pmGridSize: 256, // Higher resolution grid
  smoothingLength: 0.1, // Smaller smoothing for accuracy
  treeOpeningAngle: 0.2, // Lower theta for accuracy
  maxTreeDepth: 30, // Deep tree
  directCutoff: 0.5, // Smaller direct sum cutoff
};

const accurateTreePM = new TreePMStrategy(accurateConfig);
```

### Multi-Scale System Simulation

```typescript
// Simulate system with varying density
const solarSystemBodies = {
  // Dense inner system (planets close to sun)
  mercury: {
    /* ... */
  },
  venus: {
    /* ... */
  },
  earth: {
    /* ... */
  },
  mars: {
    /* ... */
  },

  // Sparse outer system (gas giants)
  jupiter: {
    /* ... */
  },
  saturn: {
    /* ... */
  },
  uranus: {
    /* ... */
  },
  neptune: {
    /* ... */
  },

  // Very sparse Kuiper belt
  pluto: {
    /* ... */
  },
  // ... many more distant objects
};

// Tree-PM automatically handles density variations
const forces = treePM.calculateForces(solarSystemBodies, params);

// Check which regions used which method
console.log("High-density regions (Tree method):", highDensityRegions.size);
console.log(
  "Low-density regions (PM method):",
  totalRegions - highDensityRegions.size,
);
```

### Configuration Validation

```typescript
// Validate configuration for system size
function validateTreePMConfig(bodyCount: number, config: TreePMConfig) {
  const treePM = new TreePMStrategy(config);

  // Check if algorithm is optimal for body count
  const isOptimal = treePM.isOptimalFor(bodyCount);

  if (!isOptimal) {
    console.warn(`Tree-PM may not be optimal for ${bodyCount} bodies`);
  }

  // Check configuration sanity
  if (config.treeThreshold < 1) {
    console.warn("Tree threshold too low, may cause excessive tree usage");
  }

  if (config.pmGridSize > 512) {
    console.warn("PM grid size very large, may cause memory issues");
  }

  return isOptimal;
}
```

## 🎯 Performance Considerations

### Algorithm Complexity

- **Overall**: O(N log N) complexity
- **PM Method**: O(N log N) for grid operations
- **Tree Method**: O(N log N) for tree traversal
- **Density Analysis**: O(N) for particle assignment

### Memory Usage

- **PM Grid**: O(gridSize³) memory for grid cells
- **Tree Structure**: O(N) memory for tree nodes
- **Density Map**: O(gridSize³) memory for density tracking
- **Force Storage**: O(N) memory for force vectors

### Accuracy vs Performance Trade-offs

| Parameter          | High Accuracy | High Performance |
| ------------------ | ------------- | ---------------- |
| `treeThreshold`    | 2.0           | 10.0             |
| `pmGridSize`       | 256           | 32               |
| `smoothingLength`  | 0.1           | 2.0              |
| `treeOpeningAngle` | 0.2           | 0.8              |
| `maxTreeDepth`     | 30            | 15               |
| `directCutoff`     | 0.5           | 5.0              |

### Optimal Use Cases

**Best For:**

- Systems with varying density (solar system, star clusters)
- Medium to large body counts (1,000-1,000,000)
- Multi-scale problems with both dense and sparse regions
- Simulations requiring high accuracy in dense regions

**Not Ideal For:**

- Very small systems (< 100 bodies) - overhead not worth it
- Uniform density distributions - simpler algorithms suffice
- Memory-constrained environments - high memory usage
- Real-time simulations with strict timing requirements

## 🔗 Integration Points

### With SimulationManager

```typescript
// SimulationManager automatically selects Tree-PM for appropriate systems
const manager = new SimulationManager();
const result = manager.simulate({
  bodies: multiScaleBodies,
  configuration: { mode: "nbody", algorithm: "tree-pm" },
  // ... other parameters
});
```

### With AlgorithmFactory

```typescript
// AlgorithmFactory recommends Tree-PM for multi-scale systems
const algorithm = AlgorithmFactory.selectOptimalAlgorithm(5000, {
  prioritizeAccuracy: true,
});
// May return "tree-pm" for systems with varying density
```

### With Performance Monitoring

```typescript
// Monitor Tree-PM performance
const startTime = performance.now();
const forces = treePM.calculateForces(bodies, params);
const endTime = performance.now();

console.log(`Tree-PM force calculation: ${endTime - startTime}ms`);
console.log(
  `Forces per body: ${(endTime - startTime) / Object.keys(bodies).length}ms`,
);
```

## 🔗 Related Components

- [[core/core-physics/AlgorithmFactory|AlgorithmFactory]] - Intelligent algorithm selection
- [[core/core-physics/SimulationManager|SimulationManager]] - Simulation orchestration
- [[core/core-physics/Octree|Octree]] - Tree method implementation
- [[core/core-physics/AlgorithmStrategy|AlgorithmStrategy]] - Base interface for algorithms

## 📚 Architecture Patterns

- **Strategy Pattern**: Algorithm implementation and selection
- **Hybrid Pattern**: Combines multiple algorithms for optimal performance
- **Configuration Pattern**: Tunable parameters for different requirements
- **Multi-Scale Pattern**: Handles different density scales automatically
- **Correction Pattern**: Eliminates double-counting between methods

---

_The TreePMStrategy provides a sophisticated hybrid approach that automatically adapts to system characteristics, offering optimal performance across different density scales while maintaining high accuracy._
