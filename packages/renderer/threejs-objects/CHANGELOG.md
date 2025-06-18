# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Major Refactor**: The monolithic `ObjectManager` has been broken down into a suite of smaller, single-responsibility classes to improve modularity and maintainability.
  - The main `ObjectManager` now acts as a lean orchestrator.
  - `ObjectLifecycleManager`: Handles adding, updating, and removing objects from the scene based on state changes.
  - `MeshFactory`: Is now solely responsible for creating `THREE.Object3D` instances by calling the appropriate factories in `@teskooano/systems-celestial`.
  - `RendererUpdater`: Manages the per-frame `update()` call for all active `CelestialRenderer` instances.
  - `DebrisEffectManager`: Manages particle effects for destroyed objects.
  - `GravitationalLensingHandler`: Manages the lensing effect for massive objects.

### Added

- Added `DebrisEffectManager` to handle particle effects for destroyed objects, subscribing to `destruction$` events.

### Removed

- Removed all mesh, material, and geometry creation logic from the `ObjectManager`. This is now fully delegated to the `celestial-renderers` and the `MeshFactory`.

## [0.2.0] - 2025-05-01

### Changed

- Internal updates to `ObjectManager.ts` and `mesh-factory.ts`.
- Updated dependencies.

## [0.1.0] - 2025-04-24
