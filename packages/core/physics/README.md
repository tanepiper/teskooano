# @teskooano/core-physics

A comprehensive physics simulation engine for celestial mechanics, featuring dual simulation modes, multiple force calculation algorithms, and advanced numerical integrators.

## Features

- **Dual Simulation Modes**: Perfect Keplerian orbits (ideal) and full N-body dynamics
- **Multiple Algorithms**: Direct, Barnes-Hut, FMM, P3M, and Tree-PM hybrid
- **Advanced Integrators**: Velocity Verlet, RK4, adaptive methods, and symplectic integrators
- **Intelligent Selection**: Automatic algorithm and integrator optimization
- **Real SI Units**: All calculations in meters, kilograms, and seconds
- **Performance Analysis**: Built-in profiling and optimization recommendations

## Quick Start

```typescript
import { SimulationManager } from "@teskooano/core-physics";
import type { PhysicsStateReal } from "@teskooano/data-types";

// Create simulation manager
const manager = new SimulationManager();

// Set up celestial bodies
const bodies: PhysicsStateReal[] = [
  {
    id: "sun",
    mass_kg: 1.989e30,
    position_m: new OSVector3(0, 0, 0),
    velocity_mps: new OSVector3(0, 0, 0),
  },
  {
    id: "earth",
    mass_kg: 5.972e24,
    position_m: new OSVector3(1.496e11, 0, 0),
    velocity_mps: new OSVector3(0, 0, 29780),
  },
];

// Configure simulation
const params = {
  bodies,
  deltaTime: 3600, // 1 hour
  configuration: {
    mode: "nbody" as const,
    algorithm: "barnes-hut" as const,
    integrator: "verlet" as const,
  },
};

// Run simulation step
const result = manager.simulate(params);
console.log(
  `Updated ${result.states.length} bodies in ${result.metadata.executionTime}ms`,
);
```

## Simulation Modes

### Ideal Mode (Analytical)

Perfect Keplerian orbits with exact analytical solutions. Requires orbital parameters and parent hierarchy.

```typescript
const config = {
  mode: "ideal",
  // No algorithm/integrator needed - uses analytical solution
};
```

### N-Body Mode (Numerical)

Full gravitational N-body simulation with configurable algorithms and integrators.

```typescript
const config = {
  mode: "nbody",
  algorithm: "barnes-hut", // or "direct", "fmm", "p3m", "tree-pm"
  integrator: "verlet", // or "rk4", "adaptive", "pefrl", etc.
};
```

## Coordinate System

**Y-up Right-handed System:**

- **Y-axis**: Points "up" (reference direction)
- **XZ-plane**: Contains orbital motion
- **Orbital Direction**: Counter-clockwise when viewed from +Y (prograde motion)

All calculations use SI units (meters, kg, seconds) internally.

## Automatic Optimization

The `SimulationManager` automatically selects optimal configurations:

```typescript
// Get optimal configuration for your system
const optimalConfig = manager.createOptimalConfiguration(params);

// Compare different approaches
const comparison = manager.getPerformanceComparison(params);
console.log("Best algorithm:", comparison.configurations[0].config.algorithm);
```

## Performance Guidelines

| Body Count   | Recommended Algorithm | Expected Performance      |
| ------------ | --------------------- | ------------------------- |
| ≤ 100        | Direct                | Exact, fast               |
| 100-1,000    | Barnes-Hut            | High accuracy, good speed |
| 1,000-10,000 | Barnes-Hut or Tree-PM | Good balance              |
| > 10,000     | FMM or Tree-PM        | Linear scaling            |

## Documentation

### Detailed Guides

- **[Algorithms](./docs/algorithms.md)** - Force calculation methods and selection
- **[Integrators](./docs/integrators.md)** - Numerical integration methods and characteristics
- **[Coordinate Systems](./docs/coordinate-systems.md)** - Coordinate conventions and orbital mechanics
- **[Data Flow](./docs/data-flow.md)** - System architecture and data processing pipeline

### API Reference

- **[Architecture](./ARCHITECTURE.md)** - Overall system design and components
- **[Changelog](./CHANGELOG.md)** - Version history and changes

## Core Concepts

### Physics State

All bodies are represented as `PhysicsStateReal` objects:

```typescript
interface PhysicsStateReal {
  id: string;
  mass_kg: number; // Mass in kilograms
  position_m: OSVector3; // Position in meters
  velocity_mps: OSVector3; // Velocity in m/s
}
```

### Configuration-Driven

Simulations are controlled by configuration objects:

```typescript
interface SimulationConfiguration {
  mode: "ideal" | "nbody";
  integrator?: "euler" | "verlet" | "rk4" | "adaptive" | "pefrl" | ...;
  algorithm?: "direct" | "barnes-hut" | "fmm" | "p3m" | "tree-pm";
}
```

### Performance Monitoring

All simulations return detailed performance metadata:

```typescript
interface SimulationMetadata {
  executionTime: number;
  performanceProfile: PerformanceProfile;
  recommendations: string[];
  warnings: string[];
}
```

## Advanced Features

### Orbital Elements Support

Convert between state vectors and Keplerian orbital elements:

```typescript
import {
  calculateKeplerianStateAtTime,
  calculateElementsFromStateVectors,
} from "@teskooano/core-physics";

// From orbital elements to state
const { position, velocity } = calculateKeplerianStateAtTime(
  orbitalParams,
  time,
);

// From state to orbital elements
const elements = calculateElementsFromStateVectors(
  position,
  velocity,
  centralMass,
);
```

### Collision Detection

Automatic collision detection and resolution based on body types and radii:

```typescript
const params = {
  // ... other params
  radii: new Map([
    ["earth", 6.371e6],
    ["moon", 1.737e6],
  ]),
  bodyTypes: new Map([
    ["earth", CelestialType.PLANET],
    ["moon", CelestialType.MOON],
  ]),
};
```

### Trajectory Prediction

Predict future trajectories using the same physics engine:

```typescript
import { predictTrajectory } from "@teskooano/core-physics";

const predictions = predictTrajectory(
  "earth", // Target body
  allBodies, // Initial states
  31536000, // Duration (1 year)
  1000, // Steps
  { relativeToBodyId: "sun" },
);
```

## Testing

```bash
# Run all physics tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "Orbital Mechanics"
```

## Performance Tips

1. **Algorithm Selection**: Use `AlgorithmFactory.selectOptimalAlgorithm()` for automatic optimization
2. **Time Step Size**: Smaller steps = higher accuracy but slower performance
3. **Barnes-Hut Theta**: Lower values (0.3) = more accurate, higher values (0.9) = faster
4. **Symplectic Integrators**: Use for long-term orbital stability (PEFRL, Yoshida4)
5. **Vector Pooling**: Enable for memory optimization in intensive calculations

## Dependencies

- `@teskooano/core-math` - Vector mathematics (`OSVector3`, `OSQuaternion`)
- `@teskooano/data-types` - Type definitions and constants
- `@teskooano/core-state` - State management interfaces
- `three` - Additional 3D math utilities
- `rxjs` - Reactive programming utilities

## License

MIT License - see LICENSE file for details
