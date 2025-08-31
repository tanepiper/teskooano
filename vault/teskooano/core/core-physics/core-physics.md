---
aliases: [core-physics, physics-engine, celestial-mechanics, simulation-engine]
tags: [core, physics, simulation, celestial, mechanics, orbital, n-body]
type: Package
package: "@teskooano/core-physics"
name: Core Physics Engine
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/core-state",
    "@teskooano/data-types",
    "@teskooano/data-values",
    "rxjs",
    "three",
    "@robertaron/spacial-partitioning",
  ]
classes:
  [
    "SimulationManager",
    "AlgorithmFactory",
    "TreePMStrategy",
    "Octree",
    "WasmSpatialPartitioning",
    "WasmCollisionDetection",
    "IdealOrreryStrategy",
    "LagrangePointService",
    "OrbitalValidationDebugger",
    "Vector3Pool",
  ]
functions:
  [
    "updateSimulation",
    "predictTrajectory",
    "calculateKeplerianStateAtTime",
    "calculateElementsFromStateVectors",
    "velocityVerletIntegrate",
    "rk4Integrate",
    "adaptiveRKIntegrate",
    "yoshida4Integrate",
    "pefrlIntegrate",
    "calculateNewtonianGravitationalForce",
    "detectSphereCollision",
    "handleCollisions",
    "solveKeplerEquation",
    "createOrbitalElements",
  ]
constants:
  [
    "GRAVITATIONAL_CONSTANT",
    "AU",
    "EARTH_MASS",
    "SOLAR_MASS",
    "METERS_TO_SCENE_UNITS",
  ]
types:
  [
    "PhysicsStateReal",
    "SimulationConfiguration",
    "SimulationParameters",
    "OrbitalParameters",
    "AlgorithmType",
    "IntegratorType",
    "SimulationMode",
    "CelestialType",
    "Collision",
    "PredictedPoint",
  ]
status: active
---

# Core Physics Engine

Comprehensive physics simulation engine for celestial mechanics, featuring dual simulation modes, multiple force calculation algorithms, and advanced numerical integrators.

## 🎯 Purpose

The `@teskooano/core-physics` package provides a complete physics simulation engine:

- **Dual Simulation Modes**: Perfect Keplerian orbits (ideal) and full N-body dynamics
- **Multiple Algorithms**: Direct, Barnes-Hut, FMM, P3M, and Tree-PM hybrid
- **Advanced Integrators**: Velocity Verlet, RK4, adaptive methods, and symplectic integrators
- **Intelligent Selection**: Automatic algorithm and integrator optimization
- **Real SI Units**: All calculations in meters, kilograms, and seconds
- **Performance Analysis**: Built-in profiling and optimization recommendations
- **WASM Integration**: High-performance spatial partitioning and collision detection
- **Orbital Mechanics**: Complete Keplerian and Lagrange point calculations

## 🏗️ Architecture

### Configuration-Driven Design

All simulation behavior is controlled through configuration objects:

```typescript
interface SimulationConfiguration {
  mode: "ideal" | "nbody";
  integrator?: IntegratorType;
  algorithm?: AlgorithmType;
}
```

### Strategy Pattern Implementation

Different algorithms and integrators are implemented as strategies:

- **Algorithm Strategies**: Direct, Barnes-Hut, FMM, P3M, Tree-PM
- **Integration Strategies**: Euler variants, Verlet, RK4, Adaptive, Symplectic methods
- **Simulation Strategies**: Ideal mode (analytical) vs N-body mode (numerical)

### Intelligent Selection

The `AlgorithmFactory` and `SimulationManager` automatically select optimal configurations based on:

- Body count
- Performance preferences (accuracy vs speed)
- Memory constraints
- System characteristics

### Real SI Units

All internal calculations use SI units (meters, kg, seconds) for physical accuracy and simplicity.

## 📁 Directory Structure

```
src/
├── algorithms/                 # Force calculation algorithms
│   ├── algorithm-factory.ts   # Intelligent algorithm selection
│   └── tree-pm.ts            # Tree-PM hybrid implementation
├── collision/                 # Collision detection and resolution
│   ├── collision.ts          # Traditional collision handling
│   └── wasm-collision.ts     # WASM-enhanced collision detection
├── forces/                    # Force calculation methods
│   ├── gravity.ts            # Newtonian gravity
│   ├── relativistic.ts       # Relativistic corrections
│   ├── non-gravitational.ts  # Thrust, drag, etc.
│   └── index.ts              # Force utilities
├── integrators/               # Numerical integration methods
│   ├── euler.ts              # Basic Euler methods
│   ├── verlet.ts             # Velocity Verlet (default)
│   ├── rk4.ts                # Runge-Kutta 4th order
│   ├── adaptive.ts           # Adaptive timestep (Dormand-Prince)
│   ├── yoshida.ts            # Symplectic integrators
│   ├── ideal.ts              # Analytical Keplerian orbits
│   └── index.ts              # Integrator exports
├── interfaces/                # Strategy pattern interfaces
│   ├── algorithm-strategy.ts  # Algorithm interface
│   └── simulation-strategy.ts # Simulation interface
├── modes/                     # Simulation mode implementations
│   └── ideal/                # Ideal mode (Keplerian orbits)
│       └── ideal-orrery.ts   # Perfect orbital mechanics
├── orbital/                   # Orbital mechanics calculations
│   ├── kepler.ts             # Kepler's equation solver
│   ├── orbital.ts            # State vector conversions
│   ├── elementsFromState.ts  # Inverse orbital calculations
│   ├── helpers.ts            # Orbital element creation
│   ├── epoch.ts              # Epoch handling and conversions
│   ├── lagrange.ts           # Lagrange point calculations
│   ├── lagrange-service.ts   # Lagrange point management
│   ├── tle.ts                # Two-Line Element support
│   ├── n-body.ts             # N-body orbital calculations
│   └── shared.ts             # Shared orbital utilities
├── simulation/                # Main simulation orchestration
│   ├── simulation-manager.ts # High-level coordinator
│   ├── simulation.ts         # Core simulation loop
│   ├── prediction.ts         # Trajectory prediction
│   └── types.ts              # Simulation interfaces
├── spatial/                   # Spatial data structures
│   ├── octree.ts             # Barnes-Hut octree
│   ├── wasm-partitioning.ts  # WASM spatial partitioning
│   ├── wasm-spatial-service.ts # WASM service wrapper
│   └── wasm-test.ts          # WASM testing utilities
├── units/                     # Unit constants and conversions
│   ├── constants.ts          # Physical constants
│   └── units.ts              # Unit conversion utilities
├── utils/                     # Utility functions
│   ├── vectorPool.ts         # Memory optimization
│   ├── body-sort.ts          # Hierarchical sorting
│   ├── scaling.ts            # Display scaling utilities
│   └── index.ts              # Utility exports
├── debug/                     # Debugging and validation
│   ├── orbitalValidation.ts  # Orbital validation debugger
│   └── orbitalValidation.test.ts # Validation tests
└── types.ts                   # Core type definitions
```

## 🔧 Core Components

### [[SimulationManager]]

**Location**: `src/simulation/simulation-manager.ts`

The main orchestrator that provides a high-level API for physics simulations:

- Configuration validation and mode selection
- Strategy delegation and performance analysis
- Result assembly with metadata
- WASM integration for enhanced performance

### [[AlgorithmFactory]]

**Location**: `src/algorithms/algorithm-factory.ts`

Intelligent selection and validation of force calculation algorithms:

- Automatic algorithm selection based on body count
- Performance estimation and validation
- Configuration optimization recommendations

### [[TreePMStrategy]]

**Location**: `src/algorithms/tree-pm.ts`

Advanced Tree-PM hybrid algorithm combining Tree and Particle-Mesh methods:

- Multi-scale approach for optimal performance
- Automatic density-based partitioning
- High accuracy in both dense and sparse regions

### [[Octree]]

**Location**: `src/spatial/octree.ts`

Hierarchical spatial data structure for O(N log N) force calculations:

- Barnes-Hut algorithm implementation
- Efficient force approximation
- Configurable accuracy vs performance trade-offs

### [[WasmSpatialPartitioning]]

**Location**: `src/spatial/wasm-partitioning.ts`

High-performance spatial partitioning using WebAssembly:

- O(n log n) collision detection
- Fast neighbor finding and proximity detection
- Significant performance improvements for large systems

### [[WasmCollisionDetection]]

**Location**: `src/collision/wasm-collision.ts`

Optimized collision detection using spatial partitioning:

- WASM-enhanced collision detection
- Automatic fallback to traditional methods
- Comprehensive collision resolution rules

### [[IdealOrreryStrategy]]

**Location**: `src/modes/ideal/ideal-orrery.ts`

Perfect Keplerian orbital mechanics with analytical solutions:

- Hierarchical body sorting
- Sequential Keplerian calculations
- Exact analytical position/velocity computation

### [[LagrangePointService]]

**Location**: `src/orbital/lagrange-service.ts`

Comprehensive Lagrange point management and calculations:

- Automatic Lagrange point identification
- Stability analysis and classification
- Historical tracking and optimization

### [[OrbitalValidationDebugger]]

**Location**: `src/debug/orbitalValidation.ts`

Debugging and validation tools for orbital mechanics:

- Energy conservation validation
- Eccentricity-angular momentum orthogonality
- Comprehensive conservation law testing

### [[Vector3Pool]]

**Location**: `src/utils/vectorPool.ts`

Memory optimization through vector pooling:

- Reuse OSVector3 instances to reduce GC pressure
- Efficient memory management for intensive calculations
- Performance monitoring and statistics

## 🚀 Key Features

### Dual Simulation Modes

**Ideal Mode (Analytical)**

- Perfect Keplerian orbits with exact analytical solutions
- O(N) scaling with body count
- No force calculations or collisions
- Hierarchical processing for complex systems

**N-Body Mode (Numerical)**

- Full gravitational N-body simulation
- Configurable algorithms and integrators
- Collision detection and resolution
- Performance optimization for large systems

### Advanced Algorithms

| Algorithm  | Complexity | Best For             | Accuracy |
| ---------- | ---------- | -------------------- | -------- |
| Direct     | O(N²)      | Small systems        | Exact    |
| Barnes-Hut | O(N log N) | Medium systems       | High     |
| FMM        | O(N)       | Large systems        | High     |
| P3M        | O(N log N) | Medium-large systems | Medium   |
| Tree-PM    | O(N log N) | Multi-scale systems  | High     |

### Numerical Integrators

| Integrator       | Order | Symplectic | Energy Conservation | Best For                  |
| ---------------- | ----- | ---------- | ------------------- | ------------------------- |
| Euler            | 1st   | No         | Poor                | Debugging only            |
| Symplectic Euler | 1st   | Yes        | Good                | Simple simulations        |
| Verlet           | 2nd   | Yes        | Excellent           | General orbital mechanics |
| RK4              | 4th   | No         | Good                | High accuracy needs       |
| Adaptive RK      | 4-5th | No         | Good                | Complex systems           |
| Yoshida4         | 4th   | Yes        | Excellent           | Long-term stability       |
| PEFRL            | 4th   | Yes        | Excellent           | Optimized symplectic      |

### WASM Integration

- **Spatial Partitioning**: O(n log n) collision detection
- **Neighbor Finding**: Fast spatial queries for gravitational calculations
- **Proximity Detection**: Efficient range-based searches
- **Performance Monitoring**: Built-in statistics and optimization

### Orbital Mechanics

- **Kepler's Equation**: Fast analytical orbital calculations
- **State Vector Conversions**: Bidirectional orbital element conversions
- **Lagrange Points**: Complete L1-L5 calculations and stability analysis
- **Epoch Handling**: Comprehensive epoch conversion and standardization
- **TLE Support**: Two-Line Element parsing and conversion

## 🔗 Integration Points

### With State Management

- Integrates with `@teskooano/core-state` for physics state management
- Provides `PhysicsSystemAdapter` for seamless state updates
- Supports reactive state updates through RxJS observables

### With Rendering

- Uses `@teskooano/core-math` for vector mathematics
- Compatible with Three.js coordinate systems
- Provides scaling utilities for display units

### With Data Types

- Uses `@teskooano/data-types` for type definitions
- Integrates with `@teskooano/data-values` for constants
- Supports all celestial object types and configurations

## 📚 Related Components

- [[SimulationManager]] - Main simulation orchestrator
- [[AlgorithmFactory]] - Intelligent algorithm selection
- [[TreePMStrategy]] - Advanced hybrid algorithm
- [[Octree]] - Spatial data structure
- [[WasmSpatialPartitioning]] - High-performance spatial operations
- [[WasmCollisionDetection]] - Optimized collision detection
- [[IdealOrreryStrategy]] - Perfect orbital mechanics
- [[LagrangePointService]] - Lagrange point management
- [[OrbitalValidationDebugger]] - Debugging and validation
- [[Vector3Pool]] - Memory optimization

## 📚 Architecture Patterns

- **Strategy Pattern**: Algorithm and integrator selection
- **Factory Pattern**: Configuration and object creation
- **Singleton Pattern**: Service management and caching
- **Observer Pattern**: Performance monitoring and statistics
- **Resource Management**: Vector pooling and memory optimization
- **Bridge Pattern**: WASM integration and fallback mechanisms
- **Template Method**: Simulation pipeline orchestration
- **Command Pattern**: Simulation step execution and validation

---

_The Core Physics Engine provides a comprehensive, high-performance simulation system for celestial mechanics with intelligent optimization and extensive algorithmic support._
