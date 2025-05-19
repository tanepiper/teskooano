# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Integrated with the global "Show Orbit Lines" setting from the Engine Settings panel, allowing users to toggle the visibility of all orbit lines. The `OrbitManager`'s existing `setVisibility` method is now used by the `CompositeEnginePanel`.

### Changed

- **Dependency Update**: Replaced `nanostores` with `rxjs` for state management.
- **RxJS Integration**:
  - `OrbitManager.ts` and `orbit-manager/keplerian-manager.ts` now consume `renderableStore.renderableObjects$` (an RxJS Observable) and `getCelestialObjects()` from `@teskooano/core-state` (note: `getCelestialObjects()` is part of `gameStateService`).
  - Both managers subscribe to `renderableStore.renderableObjects$` to get the latest data for orbit calculations.
  - `OrbitManager.ts` subscription to `RendererStateAdapter.$visualSettings` now uses RxJS `subscribe` and `unsubscribe` methods.
  - The `dispose` method in `KeplerianOrbitManager` now correctly unsubscribes from the `renderableStore.renderableObjects$` observable.
- Extensive comment removal and minor code cleanup across most files, including `OrbitManager.ts`, `orbit-manager/keplerian-manager.ts`, `orbit-manager/orbit-calculator.ts`, and `orbit-manager/verlet-predictor.ts`.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the `@teskooano/renderer-threejs-orbits` package.
- `OrbitManager`: Manages orbit and trail visualizations for celestial objects.
  - Supports `Keplerian` mode (static orbit lines based on orbital parameters).
  - Supports `Verlet` mode (dynamic trail lines based on position history and future trajectory prediction using Verlet integration).
- `KeplerianOrbitManager`: Handles logic specific to Keplerian orbit line creation and updates.
- `orbit-calculator.ts`: Functions to calculate points for Keplerian orbits.
- `orbit-line-builder.ts`: Utilities to create and update `THREE.Line` objects for orbits.
- `verlet-predictor.ts`: Logic to predict future trajectory using a simplified N-body simulation for Verlet mode.
- Dynamic switching between Keplerian and Verlet modes based on physics engine settings from `RendererStateAdapter`.
- Highlighting of selected object's orbit/trail.
- Throttling for Verlet trail and prediction updates to improve performance.
