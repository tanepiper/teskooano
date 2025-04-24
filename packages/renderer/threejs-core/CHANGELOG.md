# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-04-24

### Added

- Initial release of the core renderer package.
- `SceneManager`: Manages Three.js Scene, Camera, and WebGLRenderer.
- `AnimationLoop`: Manages the `requestAnimationFrame` loop and callbacks.
- `StateManager`: Connects renderer components to `@teskooano/core-state` stores (`simulationState`, `celestialObjectsStore`).
- `events`: Shared `EventEmitter3` instance (`rendererEvents`).
- Basic debug helpers (Grid, Origin Sphere) in `SceneManager`.
- Performance stats calculation in `AnimationLoop`.
