# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- **Major Refactor (LightManager.ts)**:
  - Now subscribes to `renderableStore.renderableObjects$` from `@teskooano/core-state` using RxJS (`pipe`, `map`, `filter`, `pairwise`).
  - Star lights are now added, updated (position, intensity), and removed reactively based on changes to star objects in the core state.
  - Intensity is now partly derived from star temperature via a new `calculateIntensity` placeholder method.
  - Removed the manual `addStarLight` and `updateStarLight` methods in favor of reactive updates.
  - Improved `dispose` method to correctly unsubscribe and dispose of light resources.
- `LODManager` now adjusts LOD distances based on the global `performanceProfile` from `simulationState$`.

### Removed

- Removed the unused `EffectsManager` facade class. The package now exports `LightManager` and `LODManager` to be used directly by the integrator.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the `@teskooano/renderer-threejs-effects` package.
- `LightManager`: Manages ambient light and dynamic star point lights.
- `LODManager`: Manages Level of Detail for scene objects using `THREE.LOD`.
- Helper functions in `lod-manager/` for building LOD meshes, calculating distances, and debug visualization.
