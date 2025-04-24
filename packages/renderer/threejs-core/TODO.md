# TODO - @teskooano/renderer-threejs-core

This list tracks planned improvements and tasks for the core Three.js renderer package.

## Features

- [ ] Add support for different camera types (e.g., Orthographic) if needed by specific views.
- [ ] Implement more robust handling of multiple light sources in `AnimationLoop` (currently basic star detection).
- [ ] Add optional support for WebGPU via `WebGPURenderer` as an alternative to `WebGLRenderer`.

## Refactoring & Improvements

- [ ] Refine the state change detection logic in `StateManager` for performance, especially with large numbers of objects.
- [ ] Improve performance stat calculation and reporting in `AnimationLoop`.
- [ ] Add more granular error handling and logging.
- [ ] Evaluate if `CoreRenderer` facade is still necessary or if components are always used individually by the integrator package.
- [ ] Ensure proper disposal and cleanup of all resources in edge cases.
- [ ] Optimize `SceneManager`'s debug helper management.

## Testing

- [ ] Add comprehensive unit tests (`vitest`) for `SceneManager` (mocking Three.js objects).
- [ ] Add unit tests for `AnimationLoop` (mocking `requestAnimationFrame`, `THREE.Clock`).
- [ ] Add unit tests for `StateManager` (mocking state stores and subscribers).
- [ ] Add unit tests for `events.ts`.
- [ ] Consider integration tests within the context of the package that uses this core library.

## Documentation

- [ ] Add detailed TSDoc comments to all public classes, methods, and properties.
- [ ] Clarify the expected units and coordinate systems in method parameters/return values.
