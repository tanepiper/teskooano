# Missing N-Body Algorithms Analysis & Implementation Plan

## Current Implementation Status

### ✅ Currently Implemented

**Algorithms:**

- `direct` - O(N²) exact calculation
- `barnes-hut` - O(N log N) tree-based approximation
- `fmm` - O(N) Fast Multipole Method
- `p3m` - O(N log N) Particle-Particle-Particle-Mesh

**Integrators:**

- `euler` - First-order explicit
- `symplectic` - Symplectic Euler
- `verlet` - Velocity Verlet
- `ideal` - Keplerian motion (for ideal mode)

**Infrastructure:**

- Octree spatial data structure
- Algorithm factory with performance optimization
- Collision detection and relativistic forces

## 🔴 Missing Critical Algorithms

### 1. Tree-PM Hybrid Methods

**Status:** Missing  
**Importance:** High - Better than pure Tree or PM methods
**Complexity:** O(N log N)

```typescript
type TreePMConfig = {
  treeThreshold: number; // Density threshold for tree regions
  pmGridSize: number; // PM grid resolution
  smoothingLength: number; // Force smoothing parameter
};
```

### 2. Adaptive Mesh Refinement (AMR)

**Status:** Missing  
**Importance:** High - Critical for multi-scale problems
**Complexity:** O(N log N) with better constants

```typescript
type AMRConfig = {
  maxRefinementLevels: number;
  refinementCriteria: "density" | "gradient" | "error";
  refinementThreshold: number;
  coarseningThreshold: number;
};
```

### 3. Self-Consistent Field (SCF)

**Status:** Missing  
**Importance:** Medium - Excellent for galactic dynamics
**Complexity:** O(N)

```typescript
type SCFConfig = {
  basisFunctions: "spherical" | "cylindrical" | "cartesian";
  maxExpansionOrder: number;
  convergenceTolerance: number;
  maxIterations: number;
};
```

### 4. Nested Grid Particle-Mesh (NGPM)

**Status:** Missing  
**Importance:** Medium - High resolution with mass resolution
**Complexity:** O(N log N)

```typescript
type NGPMConfig = {
  parentGridSize: number;
  subGridSize: number;
  massRatioThreshold: number;
  bufferZoneSize: number;
};
```

## 🔴 Missing Critical Integrators

### 1. Fourth-Order Runge-Kutta (RK4)

**Status:** Defined but not implemented  
**Importance:** High - Standard high-accuracy integrator
**Order:** 4th order

### 2. Adaptive Runge-Kutta

**Status:** Defined but not implemented  
**Importance:** High - Error-controlled integration
**Order:** Variable (typically RK4/5 with error estimation)

### 3. Higher-Order Symplectic Integrators

**Status:** Only basic symplectic implemented  
**Importance:** High - Conservation of energy/momentum
**Examples:** Yoshida, Forest-Ruth, PEFRL

```typescript
type SymplecticConfig = {
  method: "euler" | "yoshida4" | "forest-ruth" | "pefrl";
  order: 2 | 4 | 6;
  compositionType?: "triple-jump" | "composition";
};
```

### 4. Hermite Integrator

**Status:** Missing  
**Importance:** Medium - High accuracy for close encounters
**Order:** 4th order with force derivatives

### 5. Leapfrog/Verlet Variants

**Status:** Basic verlet only  
**Importance:** Medium - Specialized variants
**Examples:** Velocity-Verlet, Position-Verlet, Beeman

## 🟡 Specialized Algorithms Worth Adding

### 1. Multi-Scale Tree Codes

- **Bottom-Up Tree Codes** (Press Tree)
- **Hierarchical Tree Methods**
- **Variable Timestep Tree Integration**

### 2. Hybrid Force Decomposition

- **Tree-SCF combinations**
- **PM-Tree-Direct hierarchies**
- **Force splitting optimizations**

### 3. Modern GPU-Optimized Methods

- **GPU-accelerated FMM variants**
- **CUDA-optimized tree traversal**
- **GPU particle-mesh methods**

## Implementation Priority Matrix

| Algorithm/Integrator    | Priority  | Complexity | Impact    | Implementation Effort |
| ----------------------- | --------- | ---------- | --------- | --------------------- |
| RK4 Integrator          | 🔴 High   | Low        | High      | 1-2 days              |
| Adaptive RK             | 🔴 High   | Medium     | High      | 3-4 days              |
| Tree-PM Hybrid          | 🔴 High   | High       | Very High | 1-2 weeks             |
| Higher-order Symplectic | 🟡 Medium | Medium     | High      | 1 week                |
| AMR Methods             | 🟡 Medium | Very High  | High      | 2-3 weeks             |
| SCF Methods             | 🟡 Medium | High       | Medium    | 1-2 weeks             |
| Hermite Integrator      | 🟠 Low    | Medium     | Medium    | 3-5 days              |

## Recommended Implementation Order

### Phase 1: Complete Basic Integrators (1 week)

1. **RK4 Integrator** - Implement classical 4th-order Runge-Kutta
2. **Adaptive RK Integrator** - RK45 with error control
3. **Enhanced Symplectic** - Add Yoshida 4th-order

### Phase 2: Tree-PM Hybrid (2 weeks)

1. **Tree-PM Algorithm** - Most impactful missing algorithm
2. **Performance optimization** - Benchmarking vs existing methods
3. **Integration tests** - Ensure stability across scales

### Phase 3: Advanced Methods (3-4 weeks)

1. **SCF Implementation** - For galactic/smooth systems
2. **AMR Foundation** - Adaptive mesh infrastructure
3. **Specialized tree variants** - Bottom-up trees, hierarchical methods

## Technical Implementation Notes

### New Type Extensions Needed

```typescript
// Add to AlgorithmType
export type AlgorithmType =
  | "direct"
  | "barnes-hut"
  | "fmm"
  | "p3m"
  | "tree-pm"
  | "amr"
  | "scf"
  | "ngpm" // New algorithms
  | "bottom-up-tree"
  | "gpu-fmm"; // Specialized variants

// Add to IntegratorType
export type IntegratorType =
  | "euler"
  | "symplectic"
  | "verlet"
  | "rk4"
  | "adaptive"
  | "yoshida4"
  | "forest-ruth"
  | "pefrl" // Higher-order symplectic
  | "hermite"
  | "beeman"
  | "leapfrog"; // Additional methods
```

### Configuration Extensions

```typescript
interface AlgorithmConfiguration {
  // Tree-PM specific
  treePM?: TreePMConfig;

  // AMR specific
  amr?: AMRConfig;

  // SCF specific
  scf?: SCFConfig;

  // Symplectic specific
  symplectic?: SymplecticConfig;
}
```

### Performance Characteristics to Add

```typescript
const NEW_ALGORITHM_SPECS: Record<string, AlgorithmSpec> = {
  "tree-pm": {
    complexity: "O(N log N)",
    optimalRange: [1000, 1000000],
    description: "Tree-PM hybrid, optimal for multi-scale problems",
    memoryUsage: "medium",
    accuracy: "high",
  },
  amr: {
    complexity: "O(N log N)",
    optimalRange: [5000, 10000000],
    description: "Adaptive mesh refinement for extreme dynamic range",
    memoryUsage: "high",
    accuracy: "high",
  },
  scf: {
    complexity: "O(N)",
    optimalRange: [10000, 1000000],
    description: "Self-consistent field for smooth galactic systems",
    memoryUsage: "medium",
    accuracy: "high",
  },
};
```

## Success Metrics

1. **Performance Improvements**
   - Tree-PM should outperform pure methods for 10³-10⁶ particles
   - Adaptive integrators should maintain accuracy with larger timesteps
   - SCF should achieve O(N) scaling for appropriate systems

2. **Accuracy Benchmarks**
   - Energy conservation < 10⁻⁸ relative error over 1000 timesteps
   - Angular momentum conservation for test systems
   - Comparison with analytical solutions where available

3. **Usability Metrics**
   - Automatic algorithm selection chooses optimal method 95% of cases
   - Performance warnings trigger appropriately
   - Seamless fallback between algorithms

## References & Further Reading

1. **Tree-PM Methods**: Springel 2005 - GADGET-2, Xu et al. - TPM algorithm
2. **AMR Methods**: Bryan & Norman 1998 - ENZO code
3. **SCF Methods**: Hernquist & Ostriker 1992
4. **Symplectic Methods**: Wisdom & Holman 1991, Yoshida 1990
5. **Modern Reviews**: Dehnen & Read 2011, Price 2012

This analysis provides a roadmap for significantly enhancing your N-body simulation capabilities with the most important missing algorithms from the literature.
