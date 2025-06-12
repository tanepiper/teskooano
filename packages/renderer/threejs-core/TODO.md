# TODO for @teskooano/renderer-threejs-core

This is a list of tasks for the core renderer package.

## Features

- [ ] Add support for different camera types (e.g., Orthographic) if needed by specific views.
- [ ] Implement more robust handling of multiple light sources in `AnimationLoop` (currently basic star detection).
- [ ] Add optional support for WebGPU via `WebGPURenderer` as an alternative to `WebGLRenderer`.

## Refactoring & Improvements

- [ ] Add more detailed error handling and logging.

## Testing

- [ ] Add comprehensive unit tests (`vitest`) for `SceneManager` (mocking Three.js objects).
- [ ] Add unit tests for `AnimationLoop` (mocking `requestAnimationFrame`, `THREE.Clock`).
- [ ] Add unit tests for `StateManager` (mocking state stores and subscribers).
- [ ] Add unit tests for `events.ts`.
- [ ] Consider integration tests within the context of the package that uses this core library.

## Documentation

- [x] Review and update all package documentation (`README.md`, `ARCHITECTURE.md`) to reflect latest changes.
- [x] Add detailed API documentation using TSDoc comments in the source code.
- [ ] Expand the README with examples for more advanced features once implemented.
