# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Introduced `createSimulationStream` in `simulation/simulation.ts`, an RxJS-based function to create an Observable stream of simulation step results. This replaces the previous imperative `runSimulation` function.
- Added `SimulationParameters` interface to group parameters for the `updateSimulation` function.

### Changed

- Refactored various modules (`orbital/orbital.ts`, `spatial/octree.ts`, `units/*`, `utils/*`) for code clarity and conciseness by removing redundant comments and performing minor cleanup.
- Simplified parameter passing to `updateSimulation` by using the new `SimulationParameters` interface.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the core physics engine package.
- **Core Concepts**: Established `PhysicsStateReal` using SI units (meters, kg, seconds).
- **Force Calculation**: Implemented Newtonian gravity, with placeholders for relativistic and non-gravitational forces.
- **Numerical Integration**: Provided Velocity Verlet (default), standard Euler, and symplectic Euler integrators.
- **Optimization**: Integrated Barnes-Hut algorithm via `Octree` for O(N log N) gravitational force approximation.
- **Collision Handling**: Added detection and basic resolution (momentum conservation, destruction) for celestial bodies.
- **Simulation Loop**: Core `updateSimulation` orchestrates force calculation, integration, and collision handling.
- **Orbital Mechanics**: Utilities for converting between state vectors and orbital elements.
- **Units**: Defined physical constants and unit conversion utilities.
- **Utilities**: `VectorPool` for optimizing vector allocations.
- Initial documentation (`README.md`, `ARCHITECTURE.md`) and project setup.
