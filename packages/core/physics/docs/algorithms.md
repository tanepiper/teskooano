# Force Calculation Algorithms

The physics package supports multiple force calculation algorithms, each optimized for different scenarios and body counts. The `AlgorithmFactory` automatically selects the optimal algorithm based on system size and performance preferences.

## Algorithm Overview

| Algorithm  | Complexity | Best For             | Min Bodies | Max Bodies | Accuracy |
| ---------- | ---------- | -------------------- | ---------- | ---------- | -------- |
| Direct     | O(N²)      | Small systems        | 1          | 1,000      | Exact    |
| Barnes-Hut | O(N log N) | Medium systems       | 100        | 100,000    | High     |
| FMM        | O(N)       | Large systems        | 1,000      | 1,000,000  | High     |
| P3M        | O(N log N) | Medium-large systems | 500        | 100,000    | Medium   |
| Tree-PM    | O(N log N) | Multi-scale systems  | 1,000      | 1,000,000  | High     |

## Direct Algorithm

**File:** Built into `simulation.ts`
**Complexity:** O(N²)
**Best for:** Small systems (< 100 bodies)

The direct algorithm calculates gravitational forces between every pair of bodies exactly. This provides perfect accuracy but becomes computationally expensive for large systems.

```typescript
// For each body, calculate force from every other body
for (const body1 of bodies) {
  for (const body2 of bodies) {
    if (body1.id !== body2.id) {
      const force = calculateGravitationalForce(body1, body2);
      totalForce.add(force);
    }
  }
}
```

**Advantages:**

- Exact force calculations
- Simple implementation
- Low memory usage
- No approximation errors

**Disadvantages:**

- O(N²) scaling makes it slow for large systems
- Not suitable for real-time simulation with many bodies

## Barnes-Hut Algorithm

**File:** `spatial/octree.ts`
**Complexity:** O(N log N)
**Best for:** Medium systems (100-10,000 bodies)

The Barnes-Hut algorithm uses a spatial octree to group distant bodies and approximate their gravitational effect as a single point mass. The approximation quality is controlled by the θ (theta) parameter.

```typescript
// Build octree from body positions
const octree = new Octree(octreeSize);
bodies.forEach((body) => octree.insert(body));

// Calculate force using Barnes-Hut approximation
bodies.forEach((body) => {
  const force = octree.calculateForceOn(body, theta);
  accelerations.set(body.id, force.multiplyScalar(1 / body.mass_kg));
});
```

**Key Parameters:**

- `theta`: Opening angle parameter (default: 0.7)
  - Lower values (0.3): Higher accuracy, slower
  - Higher values (0.9): Lower accuracy, faster
- `octreeSize`: Size of the simulation volume

**Advantages:**

- Good balance of speed and accuracy
- Well-tested and stable
- Configurable accuracy vs performance

**Disadvantages:**

- Still struggles with very large systems
- Memory usage grows with tree depth

## Fast Multipole Method (FMM)

**File:** `algorithms/fmm.ts` (planned)
**Complexity:** O(N)
**Best for:** Very large systems (> 5,000 bodies)

FMM achieves linear scaling by using multipole expansions to represent the gravitational field. This is the fastest algorithm for very large particle systems.

**Advantages:**

- Linear scaling with particle count
- Excellent for massive simulations
- High accuracy with proper implementation

**Disadvantages:**

- Complex implementation
- High memory overhead for small systems
- Setup cost makes it inefficient for small systems

## Particle-Mesh (P3M)

**File:** `algorithms/p3m.ts` (planned)
**Complexity:** O(N log N)
**Best for:** Medium-large systems (2,000-50,000 bodies)

P3M combines particle-particle forces for close interactions with a mesh-based approach for long-range forces. Uses FFT for efficient mesh force calculations.

**Advantages:**

- Good for uniform particle distributions
- Efficient memory usage
- Scales well to medium-large systems

**Disadvantages:**

- Less accurate than Tree methods for clustered distributions
- Requires careful tuning of mesh size

## Tree-PM Hybrid

**File:** `algorithms/tree-pm.ts`
**Complexity:** O(N log N)
**Best for:** Multi-scale systems (1,000-1,000,000 bodies)

The Tree-PM algorithm combines the strengths of both Tree and Particle-Mesh methods:

- Uses PM method for long-range forces in low-density regions (faster)
- Uses Tree method for short-range forces in high-density regions (more accurate)

```typescript
// Configuration example
const config: TreePMConfig = {
  treeThreshold: 5.0, // Particles per cell threshold
  pmGridSize: 64, // 64³ grid
  smoothingLength: 1.0, // Force smoothing
  treeOpeningAngle: 0.5, // Barnes-Hut theta
  maxTreeDepth: 20, // Tree recursion limit
  directCutoff: 2.5, // Direct sum threshold
};
```

**Algorithm Steps:**

1. **Spatial Partitioning**: Divide space into grid cells
2. **Density Analysis**: Identify high-density regions using threshold
3. **PM Forces**: Calculate long-range forces using mesh method
4. **Tree Forces**: Calculate short-range forces using octree
5. **Force Correction**: Remove double-counting between methods

**Advantages:**

- Automatically adapts to density variations
- Optimal performance across different scales
- High accuracy in both dense and sparse regions

**Disadvantages:**

- Most complex implementation
- Requires careful parameter tuning

## Algorithm Selection

The `AlgorithmFactory` automatically selects the optimal algorithm:

```typescript
// Automatic selection
const algorithm = AlgorithmFactory.selectOptimalAlgorithm(bodyCount, {
  prioritizeAccuracy: true,
  prioritizeSpeed: false,
  maxMemoryUsage: "medium",
});

// Manual configuration
const config = AlgorithmFactory.createOptimalConfiguration(bodyCount, "nbody", {
  prioritizeAccuracy: true,
});
```

**Selection Rules:**

- **≤ 100 bodies**: Direct (exact calculations)
- **100-1,000 bodies**: Barnes-Hut (good balance)
- **1,000-10,000 bodies**: Barnes-Hut or Tree-PM
- **> 10,000 bodies**: FMM or Tree-PM

**Performance Preferences:**

- `prioritizeAccuracy`: Favors exact methods and lower approximation thresholds
- `prioritizeSpeed`: Favors faster algorithms and higher approximation thresholds
- `maxMemoryUsage`: Limits algorithms based on memory constraints

## Performance Tips

1. **Theta Parameter Tuning:**

   ```typescript
   // For Barnes-Hut: balance accuracy vs speed
   const theta = 0.5; // High accuracy
   const theta = 0.7; // Balanced (default)
   const theta = 1.0; // High speed
   ```

2. **Octree Size:**

   ```typescript
   // Size should encompass entire simulation
   const octreeSize = 5e13; // ~334 AU for solar system
   ```

3. **Algorithm Validation:**

   ```typescript
   const validation = AlgorithmFactory.validateAlgorithmChoice("direct", 5000);
   if (!validation.isValid) {
     console.warn("Algorithm may be inefficient:", validation.warnings);
   }
   ```

4. **Performance Monitoring:**
   ```typescript
   const estimate = AlgorithmFactory.getPerformanceEstimate("barnes-hut", 1000);
   console.log(`Relative speed: ${estimate.relativeSpeed}`);
   console.log(`Memory usage: ${estimate.memoryUsage}`);
   ```

## Implementation Notes

- All algorithms operate on `PhysicsStateReal` objects in SI units
- Force calculations return `OSVector3` in Newtons
- Algorithms are stateless and can be switched between frames
- The `AlgorithmStrategy` base class provides common functionality
- Performance estimates are relative to Barnes-Hut at 1000 bodies
