# Physics System Data Flow

This document explains how data flows through the physics package, from initial input to final output, covering both simulation modes and all major components.

## Overview

The physics system processes celestial body states through multiple stages, with different paths depending on simulation mode and configuration. The flow is orchestrated by the `SimulationManager` which selects the optimal strategy and algorithms.

```mermaid
graph TD
    A[Input: PhysicsStateReal[]] --> B[SimulationManager]
    B --> C{Mode Selection}
    C -->|Ideal| D[IdealOrreryStrategy]
    C -->|N-Body| E[N-Body Pipeline]

    D --> F[Keplerian Calculations]
    F --> G[Hierarchical Processing]
    G --> H[Output: Updated States]

    E --> I[Algorithm Selection]
    I --> J[Force Calculation]
    J --> K[Integration]
    K --> L[Collision Detection]
    L --> H

    B --> M[Performance Analysis]
    M --> N[Recommendations]
```

## Input Data Structures

### Core Input: PhysicsStateReal

```typescript
interface PhysicsStateReal {
  id: string; // Unique identifier
  mass_kg: number; // Mass in kilograms
  position_m: OSVector3; // Position in meters (Y-up coordinates)
  velocity_mps: OSVector3; // Velocity in m/s (Y-up coordinates)
  ticksSinceLastPhysicsUpdate?: number; // Optional throttling counter
}
```

### Configuration Input: SimulationConfiguration

```typescript
interface SimulationConfiguration {
  mode: "ideal" | "nbody"; // Simulation mode selection
  integrator?: IntegratorType; // Numerical integration method
  algorithm?: AlgorithmType; // Force calculation algorithm
}
```

### Additional Parameters

```typescript
interface SimulationManagerParams {
  bodies: PhysicsStateReal[]; // All celestial bodies
  deltaTime: number; // Time step (seconds)
  configuration: SimulationConfiguration; // Simulation settings

  // Ideal mode requirements
  orbitalParameters?: Map<string, OrbitalParameters>;
  parentIds?: Map<string, string>;
  currentTime_s?: number;

  // N-body mode requirements
  radii?: Map<string, number>;
  isStar?: Map<string, boolean>;
  bodyTypes?: Map<string, CelestialType>;
  octreeSize?: number;
  barnesHutTheta?: number;

  // Optional optimization
  autoSelectAlgorithm?: boolean;
  performancePreferences?: PerformancePreferences;
}
```

## Simulation Manager Flow

### 1. Entry Point

```typescript
const manager = new SimulationManager();
const result = manager.simulate(params);
```

**Process:**

1. **Validation:** Check configuration and required parameters
2. **Mode Selection:** Determine ideal vs N-body based on configuration
3. **Strategy Execution:** Delegate to appropriate strategy
4. **Performance Analysis:** Add metrics and recommendations
5. **Result Assembly:** Package output with metadata

### 2. Configuration Validation

```typescript
private validateConfiguration(
  config: SimulationConfiguration,
  params: SimulationManagerParams
): { isValid: boolean; errors: string[]; warnings: string[] }
```

**Validation Rules:**

- **Mode Required:** Must specify "ideal" or "nbody"
- **Ideal Mode:** Requires orbital parameters, parent hierarchy, current time
- **N-Body Mode:** Requires algorithm and integrator specifications
- **Algorithm Validation:** Check body count compatibility
- **Parameter Completeness:** Warn about missing optional parameters

## Ideal Mode Data Flow

### 1. IdealOrreryStrategy Processing

**File:** `modes/ideal/ideal-orrery.ts`

```typescript
simulate(params: IdealOrbitParams): IdealOrbitResult
```

**Flow Steps:**

1. **Input Validation**

   ```typescript
   if (!orbitalParameters || currentTime_s === undefined || !parentIds) {
     // Return error result
   }
   ```

2. **Hierarchical Sorting**

   ```typescript
   const sortedBodies = sortBodiesByHierarchy(bodies, parentIds);
   ```

   - Uses topological sort to ensure parents are processed before children
   - Prevents dependency issues in orbital calculations

3. **Sequential Processing**

   ```typescript
   for (const body of sortedBodies) {
     const newState = calculateIdealOrbit(body, parent, orbitalParams, time);
     updatedStates[body.id] = newState;
   }
   ```

4. **Keplerian State Calculation**
   ```typescript
   const { position, velocity } = calculateKeplerianStateAtTime(
     orbitalParameters,
     currentTime_s,
   );
   ```

### 2. Keplerian Calculations

**File:** `orbital/kepler.ts`

**Data Flow:**

```
Orbital Parameters → Mean Anomaly → Eccentric Anomaly → True Anomaly → Position/Velocity
```

**Process:**

1. **Time Evolution:** `meanAnomaly + meanMotion * time`
2. **Kepler's Equation:** Solve for eccentric anomaly using Newton-Raphson
3. **Position Calculation:** Transform to Cartesian coordinates
4. **Velocity Calculation:** Derive velocity from orbital parameters
5. **3D Rotation:** Apply orbital element rotations (argP → incl → longAscNode)
6. **Coordinate Mapping:** Use `OSVector3(x, 0, -y)` for proper orientation

### 3. Ideal Mode Output

```typescript
interface IdealOrbitResult {
  states: PhysicsStateReal[];
  metadata: {
    stepTime: number;
    algorithmUsed: "keplerian";
    integratorUsed: "analytical";
    totalBodies: number;
  };
}
```

**Characteristics:**

- **No Force Calculations:** Pure analytical solution
- **No Collisions:** Bodies follow perfect elliptical paths
- **Perfect Accuracy:** No numerical integration errors
- **Linear Performance:** O(N) scaling with body count

## N-Body Mode Data Flow

### 1. Algorithm Selection

**File:** `algorithms/algorithm-factory.ts`

```typescript
const algorithm = AlgorithmFactory.selectOptimalAlgorithm(
  bodyCount,
  preferences,
);
```

**Selection Logic:**

- **≤ 100 bodies:** Direct (O(N²))
- **100-1,000 bodies:** Barnes-Hut (O(N log N))
- **1,000-10,000 bodies:** Barnes-Hut or Tree-PM
- **> 10,000 bodies:** FMM or Tree-PM

### 2. Force Calculation Pipeline

Different algorithms follow different paths:

#### Direct Algorithm

```typescript
for (const body1 of bodies) {
  for (const body2 of bodies) {
    if (body1.id !== body2.id) {
      const force = calculateGravitationalForce(body1, body2);
      totalForce.add(force);
    }
  }
}
```

#### Barnes-Hut Algorithm

```typescript
// 1. Build Octree
const octree = new Octree(octreeSize);
bodies.forEach((body) => octree.insert(body));

// 2. Calculate forces using tree traversal
bodies.forEach((body) => {
  const force = octree.calculateForceOn(body, theta);
  accelerations.set(body.id, force.multiplyScalar(1 / body.mass_kg));
});
```

#### Tree-PM Algorithm

```typescript
// 1. Spatial partitioning
const densityMap = assignParticlesToGrid(bodies);
const highDensityRegions = identifyHighDensityRegions(densityMap);

// 2. PM forces for long-range
calculatePMForces(bodies, forces, G);

// 3. Tree forces for short-range
calculateTreeForces(bodies, forces, highDensityRegions, G);

// 4. Force corrections
applyForceCorrections(bodies, forces, highDensityRegions, G);
```

### 3. Integration Pipeline

**File:** `simulation/simulation.ts`

```typescript
const integratedStates = bodies.map((body) => {
  const acceleration = accelerations.get(body.id);

  switch (integrator) {
    case "euler":
      return standardEuler(body, acceleration, dt);
    case "verlet":
      return velocityVerletIntegrate(
        body,
        acceleration,
        calculateNewAcceleration,
        dt,
      );
    case "rk4":
      return rk4Integrate(body, acceleration, calculateNewAcceleration, dt);
    // ... other integrators
  }
});
```

**Integration Data Flow:**

1. **Current State:** `PhysicsStateReal` from previous step
2. **Force/Acceleration:** From force calculation stage
3. **Time Step:** Fixed or adaptive time step
4. **New State Calculation:** Numerical integration method
5. **Validation:** Check for NaN/infinite values
6. **Output:** Updated `PhysicsStateReal`

### 4. Collision Detection and Resolution

**File:** `collision/collision.ts`

```typescript
const [finalStates, destroyedIds, destructionEvents] = handleCollisions(
  integratedStates,
  radii,
  isStar,
  bodyTypes,
);
```

**Collision Flow:**

1. **Pairwise Detection:** Check all body pairs for sphere overlap
2. **Collision Classification:** Determine collision type based on body types
3. **Resolution Strategy:**
   - **Star-Star:** Larger absorbs smaller
   - **Star-Planet:** Star absorbs planet
   - **Moon-Moon:** Mutual destruction
   - **Planet-Gas Giant:** Elastic collision
   - **Similar Mass:** Elastic collision
   - **Mass Difference > 10:1:** Absorption
4. **State Updates:** Apply collision resolution
5. **Event Recording:** Track destruction events

## Output Data Structures

### Enhanced Simulation Result

```typescript
interface EnhancedSimulationResult {
  states: PhysicsStateReal[]; // Updated body states
  accelerations: Map<string, OSVector3>; // Force/acceleration data
  destroyedIds: Set<string>; // Bodies destroyed in collisions
  destructionEvents: DestructionEvent[]; // Detailed collision events
  metadata: SimulationMetadata; // Performance and analysis data
}
```

### Simulation Metadata

```typescript
interface SimulationMetadata {
  mode: "ideal" | "nbody"; // Mode used
  algorithm?: string; // Algorithm used (N-body only)
  integrator?: string; // Integrator used (N-body only)
  executionTime: number; // Wall clock time (ms)
  bodyCount: number; // Number of bodies processed
  performanceProfile?: PerformanceProfile; // Algorithm performance data
  recommendations?: string[]; // Optimization suggestions
  warnings?: string[]; // Performance warnings
}
```

## Performance Analysis Flow

### 1. Execution Timing

```typescript
const startTime = performance.now();
// ... simulation execution
const endTime = performance.now();
result.metadata.executionTime = endTime - startTime;
```

### 2. Algorithm Performance Profiling

```typescript
const performanceProfile = AlgorithmFactory.getPerformanceEstimate(
  algorithm,
  bodyCount,
);
```

**Profile Data:**

- **Relative Speed:** Compared to Barnes-Hut at 1000 bodies
- **Memory Usage:** Low/Medium/High classification
- **Accuracy Level:** Exact/High/Medium
- **Optimality:** Whether algorithm is optimal for body count

### 3. Recommendation Generation

```typescript
private enhanceResultWithAnalysis(
  result: EnhancedSimulationResult,
  params: SimulationManagerParams
): void
```

**Analysis Categories:**

- **Algorithm Efficiency:** Warn about poor algorithm choices
- **Execution Time:** Identify slow performance (>100ms)
- **Mode Recommendations:** Suggest ideal mode when applicable
- **Parameter Optimization:** Recommend better configurations

## Error Handling and Edge Cases

### 1. Validation Failures

```typescript
if (!validation.isValid) {
  throw new Error(
    `Invalid simulation configuration: ${validation.errors.join(", ")}`,
  );
}
```

### 2. Integration Failures

```typescript
if (
  !Number.isFinite(newState.position_m.x) ||
  !Number.isFinite(newState.velocity_mps.x)
) {
  console.error(
    `Non-finite state detected for body ${body.id}. Aborting prediction.`,
  );
  // Fallback or error handling
}
```

### 3. Collision Edge Cases

```typescript
// Self-collision prevention
if (body1.id === body2.id) continue;

// Zero-mass handling
if (body.mass_kg <= 0) {
  console.warn(`Skipping collision for zero-mass body ${body.id}`);
  continue;
}
```

## Data Flow Optimization

### 1. Memory Management

- **Vector Pooling:** Reuse `OSVector3` instances to reduce garbage collection
- **State Swapping:** Reuse state arrays between time steps
- **Sparse Data Structures:** Only store non-zero accelerations and forces

### 2. Computational Optimization

- **Algorithm Auto-Selection:** Choose optimal algorithm based on body count
- **Adaptive Time Stepping:** Adjust time step for optimal accuracy/performance
- **Early Termination:** Stop calculations on integration failures

### 3. Caching and Memoization

- **Force Caching:** Reuse force calculations within time step
- **Octree Reuse:** Rebuild octree only when necessary
- **Parameter Validation:** Cache validation results

## Integration with External Systems

### 1. State Management Integration

```typescript
// Input from state system
const bodies = stateSystem.getPhysicsBodies();

// Output to state system
stateSystem.updatePhysicsBodies(result.states);
```

### 2. Renderer Integration

```typescript
// Coordinate system compatibility
const threePosition = new THREE.Vector3(
  physicsState.position_m.x * METERS_TO_SCENE_UNITS,
  physicsState.position_m.y * METERS_TO_SCENE_UNITS,
  physicsState.position_m.z * METERS_TO_SCENE_UNITS,
);
```

### 3. Prediction System Integration

```typescript
// Trajectory prediction uses same physics pipeline
const predictedPoints = predictTrajectory(
  targetBodyId,
  allBodiesInitialStates,
  duration_s,
  steps,
  options,
);
```

This data flow ensures consistent, predictable behavior across all physics calculations while providing flexibility for different simulation requirements and performance constraints.
