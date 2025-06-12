# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Refactored `ModularSpaceRenderer` to delegate its frame-by-frame update logic to a new, more modular `RenderPipeline` class.
- Replaced the custom `EventEmitter` in `events.ts` with type-safe RxJS `Subject`s, aligning with the project's state management patterns.
- Created dedicated interfaces (`ModularSpaceRendererOptions`, `RenderPipelineOptions`) for constructor options to improve type safety.

### Removed

- Removed deprecated methods `setFollowTarget` and `updateCamera` from `ModularSpaceRenderer` to clean up the public API.
- Deleted unused `setup.ts` file.

### Fixed

- Completed the `coordinateUtils.ts` file by removing a documented but unimplemented function.

## [0.2.0] - 2025-05-07

### Changed

- Updated `RendererStateAdapter.ts` to consume RxJS Observables (`celestialObjects$`, `simulationState$`) from `@teskooano/core-state`.
- Modified `RendererStateAdapter.ts` to use `renderableActions.setAllRenderableObjects` and `visualSettings.next()` for state updates, aligning with RxJS patterns.
- Added `seed` and `temperature` properties to `RenderableCelestialObject` within `RendererStateAdapter.ts`..

## [0.1.0] - 2025-04-24

### Added

- Initial release of the Three.js renderer **integrator** package.
- `ModularSpaceRenderer` class facade for initializing and coordinating components from `core`, `visualization`, `interaction`, and `effects` packages.
- `RendererStateAdapter` for managing shared visual state.
- Basic visualization components: Grid helper, background management.
- Object management for celestial bodies based on state changes (creation, updates, removal).
- Orbit line visualization.
- Label rendering using CSS2DRenderer.
- Camera follow functionality.
- Event system (`rendererEvents`).
- Basic setup and utility functions.

### Changed

- Updated `README.md` and `ARCHITECTURE.md` to accurately reflect the package's role as an integrator, correcting previous documentation that implied it contained all logic.
