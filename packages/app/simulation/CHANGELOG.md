# Changelog

All notable changes to the `@teskooano/app-simulation` package will be documented in this file.

## [0.1.0] - 2025-04-24

### Added

- Initial implementation of the simulation package.
- Core `simulationLoop` integrating physics updates (`@teskooano/core-physics`) and state management (`@teskooano/core-state`).
- `Simulation` class for initializing the ThreeJS renderer (`@teskooano/renderer-threejs`).
- Support for simulation time scaling and pausing via `simulationState`.
- Basic N-body physics calculation (direct summation).
- Collision detection and handling (including destruction/annihilation statuses).
- Direct calculation and application of object rotations based on sidereal periods.
- Event emission for destruction (`rendererEvents`) and orbit updates (`CustomEvents`).
- `resetSystem` utility function for clearing and reloading simulation state.
- Example system initializers in the `systems/` directory (e.g., `redDwarfSystem`, `blueGiantSystem`, etc.).
