# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- **Major Refactor**: The architecture has been refactored to decouple object management from celestial rendering logic.
  - All celestial mesh creation logic (geometry, materials, LODs) has been moved out of this package and into dedicated factory functions (e.g., `createStarMesh`) within the `@teskooano/systems-celestial` package.
  - The `MeshFactory` class within this package now acts as a lean delegator, calling the appropriate factory function from `@teskooano/systems-celestial` based on the object type.
  - The `ObjectManager` class has been refactored to be a lean orchestrator, composing its functionality from specialized managers (`MeshFactory`, `ObjectLifecycleManager`, `RendererUpdater`).
- The dependency on `@teskooano/renderer-threejs` has been removed. The package now uses `RenderableCelestialObject` from `@teskooano/data-types`.

### Added

- `MeshFactory.ts`: Centralizes delegation of all mesh creation logic.
- `ObjectLifecycleManager.ts`: Manages adding/removing objects from the scene.
- `RendererUpdater.ts`: Handles the `update` calls for individual object renderers.
- `DebrisEffectManager.ts`: Manages particle effects for destroyed objects.
- `GravitationalLensing.ts`: Manages post-processing effects for massive objects.

## [0.2.0] - 2025-05-01

### Changed

- Internal updates to `ObjectManager.ts` and `mesh-factory.ts`.
- Updated dependencies.

## [0.1.0] - 2025-04-24
