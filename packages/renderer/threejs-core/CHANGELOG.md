# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Replaced the custom `EventEmitter` in `events.ts` with a type-safe, RxJS-based structure for consistency with other packages.

### Removed

- Removed the unused `CoreRenderer` facade class from `index.ts`.
- Removed the `StateManager.ts` file and its associated tests, as its functionality was superseded by `RendererStateAdapter` in the parent `@teskooano/renderer-threejs` package.

## [0.2.0] - 2025-05-07

### Changed

- Updated `StateManager.ts` to use RxJS Observables (`celestialObjects$`, `simulationState$`) and helper functions (`getCelestialObjects`, `getSimulationState`) from `@teskooano/core-state`.
  - Subscription logic in `StateManager.ts` now uses RxJS `pipe`, `pairwise`, and `startWith` for more robust state diffing.
  - Unsubscribe logic now uses RxJS `Subscription` objects.
- Exported `RendererCelestialObject` type from `index.ts`.
- Extensive comment removal and minor code cleanup across various files, including `SceneManager.ts`, test files (`__tests__/*`), `events.ts`, `index.ts`, and `setup.ts`.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the core renderer package.
- `SceneManager`: Manages Three.js Scene, Camera, and WebGLRenderer.
- `AnimationLoop`: Manages the `requestAnimationFrame` loop and callbacks.
- `StateManager`: Connects renderer components to `@teskooano/core-state` stores (`simulationState`, `celestialObjectsStore`).
- `events`: Shared `EventEmitter3` instance (`rendererEvents`).
- Basic debug helpers (Grid, Origin Sphere) in `SceneManager`.
- Performance stats calculation in `AnimationLoop`.
