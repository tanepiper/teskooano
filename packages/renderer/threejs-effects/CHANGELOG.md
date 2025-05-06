# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- **Major Refactor (LightManager.ts)**:
  - Now subscribes to `celestialObjects$` from `@teskooano/core-state` using RxJS (`pipe`, `map`, `filter`, `pairwise`).
  - Star lights are now added, updated (position, intensity), and removed reactively based on changes to star objects in the core state.
  - Intensity is now partly derived from star temperature via a new `calculateIntensity` placeholder method.
  - Removed the manual `updateStarLight` method.
  - Improved `dispose` method to correctly unsubscribe and dispose of light resources.
- Added `distance` and `decay` parameters to `LightManager.addStarLight`.
- `EffectComposerManager.update` now checks if `this.composer` exists before rendering.
- Added `../threejs` to `tsconfig.json` references.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the `@teskooano/renderer-threejs-effects` package.
- `EffectsManager`: Facade class to coordinate effects.
- `LightManager`: Manages ambient light and dynamic star point lights.
- `LODManager`: Manages Level of Detail for scene objects using `THREE.LOD`.
- Helper functions in `lod-manager/` for building LOD meshes, calculating distances, and debug visualization.
