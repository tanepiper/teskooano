---
aliases:
  [
    IdealOrreryStrategy,
    ideal-orrery,
    keplerian-orbits,
    analytical-orbits,
    perfect-orbits,
  ]
tags: [core, physics, ideal, keplerian, analytical, orbital, mechanics]
type: Class
package: "@teskooano/core-physics"
name: IdealOrreryStrategy
dependencies: ["@teskooano/core-math", "@teskooano/data-types"]
classes: ["IdealOrreryStrategy"]
functions: []
constants: []
types:
  [
    "PhysicsStateReal",
    "OrbitalParameters",
    "IdealOrbitParams",
    "IdealOrbitResult",
  ]
status: active
---

# IdealOrreryStrategy

Perfect Keplerian orbital mechanics with analytical solutions, providing exact orbital calculations without numerical integration.

**Location**: `src/modes/ideal/ideal-orrery.ts`

## 🎯 Purpose

The `IdealOrreryStrategy` provides perfect orbital mechanics:

- **Analytical Solutions**: Exact Keplerian orbit calculations
- **Perfect Accuracy**: No numerical integration errors
- **Hierarchical Processing**: Parent-child orbital relationships
- **Linear Performance**: O(N) scaling with body count
- **No Force Calculations**: Pure orbital mechanics
- **No Collisions**: Bodies follow perfect elliptical paths

## 🏗️ Architecture

### Strategy Pattern Implementation

Implements the simulation strategy interface for ideal mode:

```typescript
export class IdealOrreryStrategy {
  readonly name = "ideal-orrery";
  readonly description =
    "Perfect Keplerian orbital mechanics with analytical solutions";
  readonly complexity = "O(N)";
}
```

### Hierarchical Processing

Processes bodies in hierarchical order to ensure parent-child relationships:

```typescript
interface IdealOrbitParams {
  bodies: PhysicsStateReal[];
  deltaTime: number;
  configuration: SimulationConfiguration;
  orbitalParameters: Map<string, OrbitalParameters>;
  parentIds: Map<string, string>;
  currentTime_s: number;
}
```

### Analytical Calculations

Uses exact analytical solutions for orbital mechanics:

```typescript
interface IdealOrbitResult {
  states: PhysicsStateReal[];
  metadata: {
    stepTime: number;
    algorithmUsed: string;
    integratorUsed: string;
    totalBodies: number;
  };
}
```

## 🔧 Core Methods

### Main Simulation Interface

```typescript
simulate(params: IdealOrbitParams): IdealOrbitResult;
```

**Simulation Features:**

- Hierarchical body sorting
- Sequential Keplerian calculations
- Exact analytical position/velocity computation
- Metadata generation

### Configuration Validation

```typescript
canHandle(config: SimulationConfiguration): boolean;
```

**Validation Features:**

- Checks for ideal mode configuration
- Validates required parameters
- Ensures orbital parameters are available

### Parameter Recommendations

```typescript
getRecommendedParameters(): Partial<IdealOrbitParams>;
```

**Recommendation Features:**

- Suggests optimal time steps
- Recommends orbital parameter formats
- Provides configuration guidance

### Orbital Calculations

```typescript
private calculateIdealOrbit(
  body: PhysicsStateReal,
  parent: PhysicsStateReal,
  orbitalParameters: OrbitalParameters,
  currentTime_s: number
): PhysicsStateReal;
```

**Calculation Features:**

- Kepler's equation solution
- Orbital element transformations
- Position and velocity computation
- Hierarchical coordinate systems

## 🚀 Usage Examples

### Basic Ideal Mode Simulation

```typescript
import { IdealOrreryStrategy } from "@teskooano/core-physics";

const idealOrrery = new IdealOrreryStrategy();

// Set up orbital parameters
const orbitalParameters = new Map<string, OrbitalParameters>([
  [
    "earth",
    {
      semiMajorAxis_m: 1.496e11,
      eccentricity: 0.0167,
      inclination_rad: 0.00005,
      longitudeOfAscendingNode_rad: 0,
      argumentOfPeriapsis_rad: 1.796,
      meanAnomaly: 6.258,
      period_s: 365.25 * 24 * 3600,
    },
  ],
  [
    "mars",
    {
      semiMajorAxis_m: 2.279e11,
      eccentricity: 0.0934,
      inclination_rad: 0.032,
      longitudeOfAscendingNode_rad: 0.864,
      argumentOfPeriapsis_rad: 4.998,
      meanAnomaly: 5.453,
      period_s: 687 * 24 * 3600,
    },
  ],
]);

// Set up parent-child relationships
const parentIds = new Map<string, string>([
  ["earth", "sun"],
  ["mars", "sun"],
]);

// Create simulation parameters
const params = {
  bodies: [sun, earth, mars],
  deltaTime: 86400, // 1 day
  configuration: { mode: "ideal" },
  orbitalParameters,
  parentIds,
  currentTime_s: 0,
};

// Run ideal mode simulation
const result = idealOrrery.simulate(params);
console.log(
  `Updated ${result.states.length} bodies in ${result.metadata.stepTime}ms`,
);
```

### Hierarchical System Simulation

```typescript
// Simulate complex hierarchical system
const hierarchicalOrbitalParams = new Map<string, OrbitalParameters>([
  // Planets around sun
  ["earth", earthOrbitalParams],
  ["mars", marsOrbitalParams],

  // Moons around planets
  [
    "moon",
    {
      semiMajorAxis_m: 3.844e8,
      eccentricity: 0.0549,
      inclination_rad: 0.0898,
      longitudeOfAscendingNode_rad: 0,
      argumentOfPeriapsis_rad: 1.622,
      meanAnomaly: 2.094,
      period_s: 27.3 * 24 * 3600,
    },
  ],
  [
    "phobos",
    {
      semiMajorAxis_m: 9.377e6,
      eccentricity: 0.0151,
      inclination_rad: 0.001,
      longitudeOfAscendingNode_rad: 0,
      argumentOfPeriapsis_rad: 0.785,
      meanAnomaly: 1.571,
      period_s: 0.319 * 24 * 3600,
    },
  ],
]);

const hierarchicalParentIds = new Map<string, string>([
  ["earth", "sun"],
  ["mars", "sun"],
  ["moon", "earth"],
  ["phobos", "mars"],
]);

const hierarchicalParams = {
  bodies: [sun, earth, mars, moon, phobos],
  deltaTime: 3600, // 1 hour
  configuration: { mode: "ideal" },
  orbitalParameters: hierarchicalOrbitalParams,
  parentIds: hierarchicalParentIds,
  currentTime_s: 0,
};

const hierarchicalResult = idealOrrery.simulate(hierarchicalParams);
```

### Time Evolution Simulation

```typescript
// Simulate orbital evolution over time
function simulateOrbitalEvolution(
  bodies: PhysicsStateReal[],
  orbitalParameters: Map<string, OrbitalParameters>,
  parentIds: Map<string, string>,
  duration_s: number,
  timeStep_s: number,
) {
  const results: PhysicsStateReal[][] = [];
  let currentTime_s = 0;

  while (currentTime_s <= duration_s) {
    const params = {
      bodies,
      deltaTime: timeStep_s,
      configuration: { mode: "ideal" },
      orbitalParameters,
      parentIds,
      currentTime_s,
    };

    const result = idealOrrery.simulate(params);
    results.push(result.states);

    currentTime_s += timeStep_s;
  }

  return results;
}

// Simulate Earth's orbit for one year
const earthEvolution = simulateOrbitalEvolution(
  [sun, earth],
  new Map([["earth", earthOrbitalParams]]),
  new Map([["earth", "sun"]]),
  365.25 * 24 * 3600, // One year
  24 * 3600, // Daily steps
);

console.log(`Simulated ${earthEvolution.length} orbital positions`);
```

### Configuration Validation

```typescript
// Validate ideal mode configuration
const config = { mode: "ideal" as const };
const canHandle = idealOrrery.canHandle(config);
console.log("Can handle ideal mode:", canHandle);

// Get recommended parameters
const recommendations = idealOrrery.getRecommendedParameters();
console.log("Recommended parameters:", recommendations);
```

### Performance Comparison

```typescript
// Compare ideal mode vs N-body performance
function comparePerformance(bodies: PhysicsStateReal[]) {
  // Ideal mode simulation
  const idealStart = performance.now();
  const idealParams = {
    bodies,
    deltaTime: 86400,
    configuration: { mode: "ideal" },
    orbitalParameters: createOrbitalParameters(bodies),
    parentIds: createParentIds(bodies),
    currentTime_s: 0,
  };
  const idealResult = idealOrrery.simulate(idealParams);
  const idealTime = performance.now() - idealStart;

  // N-body simulation (for comparison)
  const nbodyStart = performance.now();
  const nbodyParams = {
    bodies,
    deltaTime: 86400,
    configuration: {
      mode: "nbody",
      algorithm: "barnes-hut",
      integrator: "verlet",
    },
    radii: createRadii(bodies),
    isStar: createIsStar(bodies),
    bodyTypes: createBodyTypes(bodies),
  };
  const nbodyResult = nbodyStrategy.simulate(nbodyParams);
  const nbodyTime = performance.now() - nbodyStart;

  console.log("Performance comparison:");
  console.log(`Ideal mode: ${idealTime}ms`);
  console.log(`N-body mode: ${nbodyTime}ms`);
  console.log(`Speedup: ${nbodyTime / idealTime}x`);

  return { idealTime, nbodyTime, speedup: nbodyTime / idealTime };
}
```

### Orbital Parameter Creation

```typescript
// Create orbital parameters from current state
function createOrbitalParameters(
  bodies: PhysicsStateReal[],
): Map<string, OrbitalParameters> {
  const orbitalParams = new Map<string, OrbitalParameters>();

  bodies.forEach((body) => {
    if (body.id !== "sun") {
      // Calculate orbital elements from current state
      const elements = calculateElementsFromStateVectors(
        body.position_m,
        body.velocity_mps,
        sun.mass_kg,
      );

      if (elements) {
        orbitalParams.set(body.id, {
          ...elements,
          period_s: calculateOrbitalPeriod(
            elements.semiMajorAxis_m,
            sun.mass_kg,
          ),
        });
      }
    }
  });

  return orbitalParams;
}
```

## 🎯 Performance Considerations

### Algorithm Complexity

- **Overall**: O(N) complexity
- **Hierarchical Sorting**: O(N log N) for topological sort
- **Orbital Calculations**: O(1) per body
- **Memory Usage**: O(N) for body states

### Performance Benefits

| Aspect     | Ideal Mode | N-Body Mode | Advantage             |
| ---------- | ---------- | ----------- | --------------------- |
| Complexity | O(N)       | O(N log N)  | Linear scaling        |
| Accuracy   | Perfect    | Numerical   | No integration errors |
| Speed      | Very Fast  | Fast        | 10-100x faster        |
| Memory     | Low        | Medium      | Minimal overhead      |
| Stability  | Perfect    | Variable    | No numerical drift    |

### Optimal Use Cases

**Best For:**

- Solar system simulations
- Hierarchical orbital systems
- Long-term orbital evolution
- High-accuracy orbital mechanics
- Educational demonstrations
- Reference orbital calculations

**Not Ideal For:**

- Systems with significant perturbations
- Close encounters or collisions
- Multi-body gravitational interactions
- Chaotic orbital dynamics
- Systems requiring collision detection

## 🔗 Integration Points

### With SimulationManager

```typescript
// SimulationManager automatically selects ideal mode
const manager = new SimulationManager();
const result = manager.simulate({
  bodies: solarSystemBodies,
  configuration: { mode: "ideal" },
  orbitalParameters: solarSystemOrbitalParams,
  parentIds: solarSystemParentIds,
  currentTime_s: currentTime,
});
```

### With Orbital Mechanics

```typescript
// Uses orbital mechanics functions
import { calculateKeplerianStateAtTime } from "@teskooano/core-physics";

// Ideal orrery uses these functions internally
const { position, velocity } = calculateKeplerianStateAtTime(
  orbitalParameters,
  currentTime_s,
  parentMass_kg,
);
```

### With State Management

```typescript
// Integration with state management
const idealResult = idealOrrery.simulate(params);
stateSystem.updatePhysicsBodies(idealResult.states);

// State system can use ideal mode for reference calculations
const referenceStates = idealOrrery.simulate(referenceParams);
```

## 🔗 Related Components

- [[SimulationManager]] - Orchestrates ideal mode simulation
- [[OrbitalParameters]] - Orbital element definitions
- [[calculateKeplerianStateAtTime]] - Core orbital calculations
- [[calculateElementsFromStateVectors]] - Inverse orbital calculations

## 📚 Architecture Patterns

- **Strategy Pattern**: Ideal mode implementation
- **Template Method**: Hierarchical processing pipeline
- **Factory Pattern**: Orbital parameter creation
- **Hierarchical Pattern**: Parent-child relationships
- **Analytical Pattern**: Exact mathematical solutions

---

_The IdealOrreryStrategy provides perfect orbital mechanics through analytical solutions, offering exact accuracy and linear performance for hierarchical orbital systems._
