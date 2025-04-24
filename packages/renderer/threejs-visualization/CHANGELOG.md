# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-04-24

### Added

- **`ObjectManager`:** Manages creation, update, and removal of celestial object meshes based on `renderableObjectsStore`.
  - Integrates specialized renderers from `@teskooano/systems-celestial` (Gas Giants, Asteroid Fields, Rings).
  - Integrates `LODManager` from `@teskooano/renderer-threejs-effects`.
  - Handles basic label creation/removal via `CSS2DManager`.
  - Manages light source updates via `LightManager`.
  - Includes `GravitationalLensingHandler` for potential lensing effects.
  - Includes debris visualization effects on object destruction.
- **`OrbitManager`:** Manages orbit visualizations.
  - Supports `Keplerian` mode (static ellipses) and `Verlet` mode (dynamic trails/predictions).
  - Automatically switches mode based on `simulationState` (`physicsEngine`).
  - Includes throttling for Verlet prediction/trail updates.
  - Supports highlighting of selected object's orbit/trail.
- **`BackgroundManager`:** Creates and manages a multi-layered, animated starfield background with parallax effect.
- **Helper Modules:** Includes sub-modules (`object-manager/`, `orbit-manager/`, `background-manager/`) for specific logic (mesh creation, orbit calculation, star generation, etc.).
- **State Integration:** Deeply integrated with `@teskooano/core-state` for driving updates.
- **Architecture Update**: Refactored to export individual managers (`ObjectManager`, `OrbitManager`, `BackgroundManager`) instead of a single facade class.
