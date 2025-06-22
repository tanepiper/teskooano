# TODO - @teskooano/renderer-threejs

This list tracks planned improvements and tasks for the Three.js renderer package.

## Features

- [x] Implement Level of Detail (LOD) for celestial bodies to improve performance with many objects or distant views.
- [x] Add basic lighting (e.g., an ambient light and a directional light representing a star).
- [ ] Implement realistic star rendering (e.g., using point sprites or custom shaders).
- [ ] Add support for loading and displaying 3D models (FBX format specified) for ships or stations.
- [ ] Implement post-processing effects (e.g., bloom for stars/lights).
- [x] Add skybox/environment map for space background instead of just a solid color/simple texture.
- [x] Visualize gravitational fields or other physics data.

## Refactoring & Improvements

### Architectural Refactoring

- [ ] **Refactor `RendererStateAdapter`**: This class currently handles both state subscription and the complex logic of transforming `CelestialObject` data into `RenderableCelestialObject` instances.
  - **Proposal**: Create a `RenderableObjectFactory` to encapsulate the object creation logic currently in `processStandardObject` and `processRingSystem`.
  - **Proposal**: Extract the lighting source calculation from `processCelestialObjectsUpdateNow` into a dedicated utility function.
  - **Benefit**: This will make `RendererStateAdapter` a leaner adapter focused on state flow, while the factory handles the complex and reusable construction logic.
- [ ] **Refactor `ModularSpaceRenderer`**: The logic for creating AU markers is currently hardcoded in a large private method.
  - **Proposal**: Create a new `AuMarkerManager` class, following the existing manager pattern. This class would be responsible for creating and managing both the ring meshes and the 2D labels for AU markers.
  - **Benefit**: This will reduce the size and complexity of `ModularSpaceRenderer` and better encapsulate a distinct piece of functionality.

### General Improvements

- [ ] Improve performance of orbit line updates (e.g., buffer geometry updates vs recreating lines).
- [ ] Optimize label rendering performance.
- [ ] Add more detailed error handling and logging.
- [ ] Review and potentially optimize raycasting for object picking (`objectClicked` event).
- [ ] Add configuration options for visual details (e.g., orbit line colors, label styles).

## Testing

- [ ] Add comprehensive unit tests (`vitest`) for `ModularSpaceRenderer` focusing on setup, teardown, and callback management.
- [ ] Add unit tests for `RendererStateAdapter` focusing on state subscription handling and correct object creation/update/deletion logic (may require mocking state and Three.js objects).
- [ ] Add unit tests for utility functions.
- [ ] Set up integration tests (potentially using Playwright if running in a browser context) to verify the renderer displays objects correctly based on mock state changes.

## Documentation

- [x] Add more detailed API documentation using TSDoc comments in the source code.
- [ ] Expand the README with examples for more advanced features once implemented.
