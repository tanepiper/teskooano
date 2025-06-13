# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- **Major Refactor**: The `ObjectManager` class has been refactored to be a lean orchestrator.
  - All mesh creation logic has been extracted into a new `MeshFactory`.
  - The `MeshFactory` now uses a suite of `create<Type>Mesh` functions for specific celestial types.
  - Object addition/removal is now handled by a dedicated `ObjectLifecycleManager`.
  - Per-frame updates of `CelestialRenderer` instances are now handled by `RendererUpdater`.
- The dependency on `@teskooano/renderer-threejs` has been removed. The package now uses `RenderableCelestialObject` from `@teskooano/data-types`.

### Added

- `MeshFactory.ts`: Centralizes all mesh creation logic.
- `ObjectLifecycleManager.ts`: Manages adding/removing objects from the scene.
- `RendererUpdater.ts`: Handles the `update` calls for individual object renderers.
- `DebrisEffectManager.ts`: Manages particle effects for destroyed objects.
- `GravitationalLensing.ts`: Manages post-processing effects for massive objects.

## [0.2.0] - 2025-05-01

### Changed

- Internal updates to `ObjectManager.ts` and `mesh-factory.ts`.
- Updated dependencies.

## [0.1.0] - 2025-04-24
