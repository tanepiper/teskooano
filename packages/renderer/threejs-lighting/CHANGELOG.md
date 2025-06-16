# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- **Major Refactor**: `LightManager` now subscribes to `renderableStore.renderableObjects$` from `@teskooano/core-state` using RxJS.
  - Star lights are now added, updated, and removed reactively based on changes to star objects in the core state.
  - Intensity is now partly derived from star temperature.
  - Removed the manual `addStarLight` and `updateStarLight` methods in favor of reactive updates.
- Improved `dispose` method to correctly unsubscribe and dispose of light resources.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the `@teskooano/renderer-threejs-lighting` package.
- `LightManager`: Manages ambient light and dynamic star point lights.
