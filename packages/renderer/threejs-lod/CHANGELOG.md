# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- `LODManager` now adjusts LOD distances based on the global `performanceProfile` from `simulationState$`.
- The `LODManager` no longer contains internal logic for building LOD meshes or calculating distances. It now relies on `CelestialRenderer` instances to provide pre-defined `LODLevel` arrays.
- Refactored tests to align with the current `LODManager` API.

### Removed

- Removed the obsolete `LightManager` and `EffectsManager` facade class. The package now exports only `LODManager`.
- Removed obsolete helper functions for building LOD meshes and calculating distances.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the `@teskooano/renderer-threejs-lod` package.
- `LODManager`: Manages Level of Detail for scene objects using `THREE.LOD`.
- Debug visualization for LOD levels and distances.
