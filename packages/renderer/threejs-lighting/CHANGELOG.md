# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Dynamic Shadow Casting**: Implemented planetary shadow casting system where planets cast shadows on each other only when positioned between light sources and targets.
  - Added `registerShadowCaster()` and `unregisterShadowCaster()` methods to `LightingManager`.
  - Shadow casting is dynamically enabled/disabled based on celestial object positions each frame.
  - Uses geometric calculations to determine when objects are blocking light rays.

### Changed

- **Major Refactor**: The lighting system has been refactored to a component-based architecture.
  - The main `LightManager` has been renamed to `LightingManager` and now acts as a simple registry for light sources.
  - A new `LightSourceComponent` has been introduced. It is responsible for attaching a `THREE.Light` to a `RenderableCelestialObject` and keeping it synchronized.
  - The manager no longer uses a reactive subscription to the state store. Instead, celestial renderers are now responsible for imperatively creating and registering their own `LightSourceComponent` instances.
  - Removed manual methods like `addStarLight` in favor of the `register(component)` pattern.
- Improved `dispose` method to correctly clean up all registered components.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the `@teskooano/renderer-threejs-lighting` package.
- `LightManager`: Manages ambient light and dynamic star point lights.
